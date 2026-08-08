// Port of js/practice.js (adaptive practice wizard + quiz engine).
//
// Behavior ported faithfully, including the pre-existing loadPF() quirk:
// its retry list repeats the same path three times (looks like a
// copy-paste leftover, not intentional) — kept as-is rather than "fixed".
//
// Deviates from the original in two ways, both dead-code drops with zero
// consumers in this repo (grepped for callers before dropping):
//   1. window.QUESTIONS / window.injectQuestions — an external test-harness
//      hook with no reader anywhere in this codebase.
//   2. elStep2 / elStep3 — declared in the original but never referenced.
//
// The `.practice-shell` body class and `data-cat` attribute are applied
// here at runtime (not in Base.astro, which this task must not touch)
// because legacy.css's practice styles are scoped to `.practice-shell`.

import { shuffle } from '../lib/shuffle';
import { showToast } from '../lib/toast';
import { parseEconBank, parsePfBank } from '../schemas';
import type { PracticeBank, PracticeDifficulty, PracticeItem } from '../types';

function $<E extends Element = Element>(sel: string, root: ParentNode = document): E | null {
  return root.querySelector<E>(sel);
}
function $$<E extends Element = Element>(sel: string, root: ParentNode = document): E[] {
  return Array.from(root.querySelectorAll<E>(sel));
}

interface NormalizedQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

interface TimelineEntry {
  q: NormalizedQuestion;
  answered: boolean;
  chosenIdx: number | null;
  correct: boolean | null;
  eliminated: number[];
}

interface HistoryEntry {
  id: string;
  correct: boolean;
  difficulty: PracticeDifficulty;
}

interface Session {
  category: string;
  topics: string[];
  totalQuestions: number;
  adaptWindow: number;
  adaptive: boolean;
  asked: number;
  correct: number;
  streak: number;
  history: HistoryEntry[];
  byDiff: Record<PracticeDifficulty, PracticeItem[]>;
  current: NormalizedQuestion | null;
  currentDiff: PracticeDifficulty;
  timeline: TimelineEntry[];
  currentIndex: number;
}

let QUESTIONS: PracticeBank = {};

export function initPractice(): void {
  document.body.classList.add('practice-shell');

  /* ---------- Elements (match the HTML) ---------- */
  const elCategory = $<HTMLSelectElement>('#category');
  const elHiddenTopicSelect = $<HTMLSelectElement>('#topic'); // hidden <select multiple>
  const elTopicsList = $<HTMLElement>('#topics-list'); // chips container
  const elTopicsSelectAll = $<HTMLButtonElement>('#topics-select-all');
  const elTopicsClear = $<HTMLButtonElement>('#topics-clear');

  const elQuestionCount = $<HTMLSelectElement>('#question-count'); // select 10/20/...
  const elAdaptiveToggle = $<HTMLInputElement>('#adaptive-toggle'); // checkbox
  const elAdaptEvery = $<HTMLSelectElement>('#adapt-every'); // select cadence

  const elStart = $<HTMLButtonElement>('#start-btn');
  const elReset = $<HTMLButtonElement>('#reset-btn');

  const elProgressFill = $<HTMLElement>('#pc-progress-fill'); // progress bar fill
  const elStatAnswered = $<HTMLElement>('#stat-answered');
  const elStatTotal = $<HTMLElement>('#stat-total');
  const elStatCorrect = $<HTMLElement>('#stat-correct');
  const elStatStreak = $<HTMLElement>('#stat-streak');
  const elStatDiff = $<HTMLElement>('#stat-diff');

  const elStage = $<HTMLElement>('#stage'); // for auto-scroll
  const elStageEmpty = $<HTMLElement>('#stage-empty');
  const elStageWrap = $<HTMLElement>('#stage-qwrap');
  const elStageFinish = $<HTMLElement>('#stage-finish');

  const elChipCategory = $<HTMLElement>('#chip-category');
  const elChipTopic = $<HTMLElement>('#chip-topic');
  const elChipDiff = $<HTMLElement>('#chip-diff');

  const elPrompt = $<HTMLElement>('#prompt');
  const elMcArea = $<HTMLElement>('#mc-area');
  const elFeedback = $<HTMLElement>('#feedback');

  const elSubmit = $<HTMLButtonElement>('#submit-btn');
  const elNext = $<HTMLButtonElement>('#next-btn');
  const elPrev = $<HTMLButtonElement>('#prev-btn');
  const elRestart = $<HTMLButtonElement>('#restart-btn');
  const elFinishReset = $<HTMLButtonElement>('#finish-reset-btn');
  const elFinishSummary = $<HTMLElement>('#finish-summary');

  /* ---------- Wizard ---------- */
  const elWizard = $<HTMLElement>('#practice-wizard');
  const btnNext1 = $<HTMLButtonElement>('#wiz-next-1');
  const btnBack2 = $<HTMLButtonElement>('#wiz-back-2');
  const btnNext2 = $<HTMLButtonElement>('#wiz-next-2');
  const btnBack3 = $<HTMLButtonElement>('#wiz-back-3');
  const elSummary = $<HTMLElement>('#wiz-summary');

  function goToStep(n: number): void {
    if (!elWizard) return;
    elWizard.setAttribute('data-step', String(n));

    // Hide all panels first to avoid overlap/flicker
    ['#step-1', '#step-2', '#step-3'].forEach((sel) => {
      const panel = $<HTMLElement>(sel);
      if (!panel) return;
      panel.classList.remove('flip-in', 'slide-out');
      panel.hidden = true;
    });

    // Show and animate only the active panel
    const active = $<HTMLElement>(`#step-${n}`);
    if (active) {
      active.hidden = false;
      void active.offsetWidth;
      active.classList.add('flip-in');
      setTimeout(() => active.classList.remove('flip-in'), 400);
    }
  }

  btnNext1?.addEventListener('click', () => {
    if (elCategory) refreshTopicsUIForCategory(elCategory.value);
    goToStep(2);
  });

  btnBack2?.addEventListener('click', () => goToStep(1));

  btnNext2?.addEventListener('click', () => {
    const topics = getSelectedTopics();
    if (!topics.length) {
      showToast('Please select at least one unit.');
      return;
    }
    const adaptive = elAdaptiveToggle?.checked ? `Adaptive every ${elAdaptEvery?.value}` : 'Non-adaptive';
    if (elSummary) {
      elSummary.textContent = `${elCategory?.value} • ${topics.length} unit${topics.length > 1 ? 's' : ''} • ${elQuestionCount?.value} questions • ${adaptive}`;
    }
    goToStep(3);
  });

  btnBack3?.addEventListener('click', () => goToStep(2));

  /* ---------- End Session controls ---------- */
  const elEndSessionBtn = $<HTMLButtonElement>('#end-session-btn');
  const elEndSessionModal = $<HTMLElement>('#end-session-modal');
  const elEndSessionClose = $<HTMLButtonElement>('#end-session-close');
  const elEndSessionStats = $<HTMLElement>('#end-session-stats');

  /* ---------- State ---------- */
  const STATE: { session: Session | null } = { session: null };

  /* ---------- End Session helpers ---------- */
  function openEndSessionModal(): void {
    const s = STATE.session;
    if (!s) {
      showToast('No active session.');
      return;
    }

    const answered = s.asked;
    const total = s.totalQuestions;
    const correct = s.correct;
    const acc = answered ? Math.round((correct / answered) * 100) : 0;
    const streak = s.streak;
    const diff = s.currentDiff ? s.currentDiff[0]!.toUpperCase() + s.currentDiff.slice(1) : '—';
    const topics = (s.topics || []).map((t) => t.replace(/[_-]/g, ' ')).join(', ') || '—';

    if (elEndSessionStats) {
      elEndSessionStats.innerHTML = `
        <div class="stat-grid">
          <div class="session-stat"><div class="k">${answered}/${total}</div><div class="l">Answered</div></div>
          <div class="session-stat"><div class="k">${correct}</div><div class="l">Correct</div></div>
          <div class="session-stat"><div class="k">${acc}%</div><div class="l">Accuracy</div></div>
          <div class="session-stat"><div class="k">${streak}</div><div class="l">Current Streak</div></div>
          <div class="session-stat"><div class="k">${diff}</div><div class="l">Difficulty</div></div>
          <div class="session-stat wide"><div class="k">${topics}</div><div class="l">Units</div></div>
        </div>
      `;
    }
    if (elEndSessionModal) elEndSessionModal.hidden = false;
  }

  function closeEndSessionModalAndReturn(): void {
    if (elEndSessionModal) elEndSessionModal.hidden = true;
    resetPractice(); // return to mode selection
  }

  elEndSessionBtn?.addEventListener('click', openEndSessionModal);
  elEndSessionClose?.addEventListener('click', closeEndSessionModalAndReturn);

  /* ---------- Load question banks ---------- */
  // These only fetch. The merge into QUESTIONS happens once, after both
  // banks settle, so network ordering can never let one bank clobber the
  // other.
  async function loadPF(): Promise<PracticeBank | null> {
    // NOTE: this repeats the same path three times in the original —
    // a copy-paste leftover, not intentional, but ported as-is.
    const tryPaths = ['data/pf_bank_modules_1of6.json', 'data/pf_bank_modules_1of6.json', 'data/pf_bank_modules_1of6.json'];
    for (const path of tryPaths) {
      try {
        const res = await fetch(path);
        if (!res.ok) continue;
        return parsePfBank(await res.json());
      } catch {
        /* try next path */
      }
    }
    console.error('Could not load pf_bank_modules_1of6.json from expected paths.');
    showToast('Could not load the question bank (check file path/name).');
    return null;
  }

  async function loadEconomics(): Promise<PracticeBank | null> {
    try {
      const res = await fetch('data/econ_grouped_by_module_unit_with_choices.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseEconBank(await res.json());
    } catch (err) {
      console.error('loadEconomics error:', err);
      showToast('Could not load Economics bank (check path).');
      return null;
    }
  }

  async function loadQuestionBanks(): Promise<void> {
    const [pf, econ] = await Promise.all([loadPF(), loadEconomics()]);
    QUESTIONS = { ...QUESTIONS, ...(pf || {}), ...(econ || {}) };
    refreshTopicsUIForCategory(elCategory?.value);
  }

  void loadQuestionBanks();

  /* ---------- Topics chips UI ---------- */
  function refreshTopicsUIForCategory(category: string | undefined): void {
    if (!elHiddenTopicSelect || !elTopicsList) return;
    const topicsObj = (category && QUESTIONS[category]) || {};
    const topics = Object.keys(topicsObj).sort();

    elHiddenTopicSelect.innerHTML = '';
    topics.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      elHiddenTopicSelect.appendChild(opt);
    });

    elTopicsList.innerHTML = '';
    if (!topics.length) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = 'No topics available for this category.';
      elTopicsList.appendChild(empty);
      return;
    }

    topics.forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-btn';
      btn.dataset.value = t;
      btn.textContent = t;
      btn.setAttribute('role', 'checkbox');
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => toggleTopicValue(t));
      elTopicsList.appendChild(btn);
    });

    syncChipsFromHidden();
  }

  function toggleTopicValue(value: string): void {
    if (!elHiddenTopicSelect) return;
    const opt = [...elHiddenTopicSelect.options].find((o) => o.value === value);
    if (!opt) return;
    opt.selected = !opt.selected;
    syncChipsFromHidden();
  }

  function selectAllTopics(): void {
    if (!elHiddenTopicSelect) return;
    [...elHiddenTopicSelect.options].forEach((o) => (o.selected = true));
    syncChipsFromHidden();
  }

  function clearAllTopics(): void {
    if (!elHiddenTopicSelect) return;
    [...elHiddenTopicSelect.options].forEach((o) => (o.selected = false));
    syncChipsFromHidden();
  }

  function syncChipsFromHidden(): void {
    if (!elHiddenTopicSelect || !elTopicsList) return;
    const selected = new Set([...elHiddenTopicSelect.selectedOptions].map((o) => o.value));
    $$<HTMLButtonElement>('.topic-btn', elTopicsList).forEach((btn) => {
      const on = selected.has(btn.dataset.value || '');
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  function getSelectedTopics(): string[] {
    if (!elHiddenTopicSelect) return [];
    return [...elHiddenTopicSelect.selectedOptions].map((o) => o.value);
  }

  /* ---------- Practice engine ---------- */
  function createSession(params: {
    category: string;
    topics: string[];
    totalQuestions: number;
    adaptWindow: number;
    adaptive: boolean;
  }): Session | null {
    const { category, topics, totalQuestions, adaptWindow, adaptive } = params;
    const catObj = QUESTIONS[category];
    if (!catObj) return null;

    const byDiff: Record<PracticeDifficulty, PracticeItem[]> = { easy: [], medium: [], hard: [] };
    topics.forEach((t) => {
      const block = catObj[t];
      if (!block) return;
      (['easy', 'medium', 'hard'] as const).forEach((d) => {
        const arr = block[d];
        if (Array.isArray(arr)) byDiff[d].push(...arr);
      });
    });

    byDiff.easy = shuffle(byDiff.easy);
    byDiff.medium = shuffle(byDiff.medium);
    byDiff.hard = shuffle(byDiff.hard);

    if (!byDiff.easy.length && !byDiff.medium.length && !byDiff.hard.length) return null;

    const startDiff: PracticeDifficulty = byDiff.medium.length ? 'medium' : byDiff.easy.length ? 'easy' : 'hard';

    return {
      category,
      topics,
      totalQuestions,
      adaptWindow,
      adaptive,
      asked: 0,
      correct: 0,
      streak: 0,
      history: [],
      byDiff,
      current: null,
      currentDiff: startDiff,
      timeline: [],
      currentIndex: -1,
    };
  }

  function maybeAdapt(session: Session): void {
    if (!session.adaptive) return;
    const N = session.adaptWindow;
    const slice = session.history.slice(-N);
    if (!slice.length) return;

    const acc = slice.filter((x) => x.correct).length / slice.length;
    let next = session.currentDiff;

    if (acc >= 0.85) {
      if (session.currentDiff === 'easy' && session.byDiff.medium.length) next = 'medium';
      else if (session.currentDiff === 'medium' && session.byDiff.hard.length) next = 'hard';
    } else if (acc <= 0.5) {
      if (session.currentDiff === 'hard' && session.byDiff.medium.length) next = 'medium';
      else if (session.currentDiff === 'medium' && session.byDiff.easy.length) next = 'easy';
    }

    session.currentDiff = next;
  }

  function normalizeQuestion(raw: PracticeItem): NormalizedQuestion {
    const choices = raw.choices.slice();
    let answerIndex = choices.findIndex((c) => c === raw.answer);
    if (answerIndex < 0) answerIndex = 0;
    return {
      id: raw.id || cryptoRandomId(),
      prompt: raw.question,
      choices,
      answerIndex,
      explanation: '',
    };
  }

  function cryptoRandomId(): string {
    try {
      return 'q-' + crypto.getRandomValues(new Uint32Array(1))[0]!.toString(36);
    } catch {
      return 'q-' + Math.random().toString(36).slice(2);
    }
  }

  function drawQuestion(session: Session): NormalizedQuestion | null {
    const tryOrder: PracticeDifficulty[] = [session.currentDiff, 'medium', 'easy', 'hard'];
    for (const d of tryOrder) {
      const arr = session.byDiff[d];
      if (arr && arr.length) {
        const raw = arr.shift()!;
        const q = normalizeQuestion(raw);
        session.current = q;
        session.currentDiff = d;
        updateDiffChip(d);
        return q;
      }
    }
    return null;
  }

  /* ---------- UI helpers ---------- */
  function niceTopic(slug: string): string {
    return slug.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function renderQuestion(q: NormalizedQuestion): void {
    if (elPrompt) elPrompt.textContent = q.prompt;
    if (!elMcArea) return;
    elMcArea.innerHTML = '';

    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'mc-option';
      btn.type = 'button';
      btn.setAttribute('data-index', String(idx));
      btn.textContent = choice;

      // SELECT on normal click; CROSS-OUT on Alt/Ctrl/Meta click or right-click
      btn.addEventListener('click', (e: MouseEvent) => {
        if (e.altKey || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleEliminate(btn);
          return;
        }
        selectChoice(idx);
      });
      btn.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        toggleEliminate(btn);
      });

      elMcArea.appendChild(btn);
    });

    if (elSubmit) elSubmit.disabled = true;
    if (elNext) elNext.disabled = true;
    if (elFeedback) {
      elFeedback.hidden = true;
      elFeedback.classList.remove('ok', 'bad');
    }

    // Re-apply persisted selection/eliminations when navigating back
    const s = STATE.session;
    if (s && s.timeline && s.currentIndex >= 0) {
      const entry = s.timeline[s.currentIndex];
      if (entry && entry.q && entry.q.id === q.id) {
        entry.eliminated.forEach((i) => {
          const b = $<HTMLButtonElement>(`.mc-option[data-index="${i}"]`);
          if (b) b.classList.add('is-eliminated');
        });
        if (entry.answered && entry.chosenIdx !== null) {
          selectChoice(entry.chosenIdx);
          markResponse(!!entry.correct, q);
        }
      }
    }
  }

  // Toggle cross-out (eliminate) state and persist it to timeline
  function toggleEliminate(btn: HTMLButtonElement): void {
    const idx = Number(btn.getAttribute('data-index'));
    btn.classList.toggle('is-eliminated');

    const s = STATE.session;
    if (!s || s.currentIndex < 0 || !s.timeline[s.currentIndex]) return;

    const entry = s.timeline[s.currentIndex]!;
    const elim = entry.eliminated;
    const pos = elim.indexOf(idx);
    if (btn.classList.contains('is-eliminated')) {
      if (pos === -1) elim.push(idx);
    } else if (pos !== -1) {
      elim.splice(pos, 1);
    }
  }

  function selectChoice(idx: number): void {
    // Clear selection & elimination for the chosen option
    $$<HTMLButtonElement>('.mc-option').forEach((b) => b.classList.remove('is-selected'));
    const btn = $<HTMLButtonElement>(`.mc-option[data-index="${idx}"]`);
    if (btn) {
      btn.classList.remove('is-eliminated'); // selecting overrides cross-out
      btn.classList.add('is-selected');
    }

    // Persist chosenIdx (even before submit) to help re-render on nav
    const s = STATE.session;
    if (s && s.timeline && s.currentIndex >= 0 && s.timeline[s.currentIndex]) {
      s.timeline[s.currentIndex]!.chosenIdx = idx;
    }

    if (elSubmit) elSubmit.disabled = false;
  }

  function markResponse(correct: boolean, q: NormalizedQuestion): void {
    const selectedBtn = $<HTMLButtonElement>('.mc-option.is-selected');
    const selectedIdx = selectedBtn ? Number(selectedBtn.getAttribute('data-index')) : NaN;
    const buttons = $$<HTMLButtonElement>('.mc-option');

    buttons.forEach((b) => (b.disabled = true));
    if (Number.isInteger(selectedIdx)) {
      if (selectedIdx === q.answerIndex) {
        selectedBtn?.classList.add('is-correct');
      } else {
        selectedBtn?.classList.add('is-wrong');
        const right = $<HTMLButtonElement>(`.mc-option[data-index="${q.answerIndex}"]`);
        right?.classList.add('is-correct');
      }
    }

    if (elFeedback) {
      elFeedback.hidden = false;
      elFeedback.textContent = correct
        ? q.explanation
          ? `Correct! ${q.explanation}`
          : 'Correct!'
        : q.explanation
          ? `Not quite. ${q.explanation}`
          : 'Not quite.';
      elFeedback.classList.toggle('ok', correct);
      elFeedback.classList.toggle('bad', !correct);
    }

    if (elSubmit) elSubmit.disabled = true;
    if (elNext) elNext.disabled = false;
  }

  function updateProgress(session: Session): void {
    if (elStatAnswered) elStatAnswered.textContent = String(session.asked);
    if (elStatTotal) elStatTotal.textContent = String(session.totalQuestions);
    if (elStatCorrect) elStatCorrect.textContent = String(session.correct);
    if (elStatStreak) elStatStreak.textContent = String(session.streak);
    const pct = session.totalQuestions ? Math.round((100 * session.asked) / session.totalQuestions) : 0;
    elProgressFill?.style.setProperty('--p', `${pct}%`);
  }

  function updateChips(category: string, topics: string[]): void {
    if (elChipCategory) elChipCategory.textContent = category || '—';
    if (!elChipTopic) return;
    if (!topics || !topics.length) {
      elChipTopic.textContent = '—';
      return;
    }
    if (topics.length === 1) elChipTopic.textContent = niceTopic(topics[0]!);
    else elChipTopic.textContent = `${niceTopic(topics[0]!)} +${topics.length - 1}`;
  }

  function updateDiffChip(diff: PracticeDifficulty | null): void {
    const label = diff ? diff[0]!.toUpperCase() + diff.slice(1) : '—';
    if (elChipDiff) elChipDiff.textContent = label;
    if (elStatDiff) elStatDiff.textContent = label;
  }

  function showEmpty(): void {
    elStageEmpty?.classList.remove('hide');
    elStageWrap?.classList.add('hide');
    elStageFinish?.classList.add('hide');
  }
  function showQuestionView(): void {
    elStageEmpty?.classList.add('hide');
    elStageWrap?.classList.remove('hide');
    elStageFinish?.classList.add('hide');
  }
  function showFinish(summary: string): void {
    elStageEmpty?.classList.add('hide');
    elStageWrap?.classList.add('hide');
    elStageFinish?.classList.remove('hide');
    if (elFinishSummary) elFinishSummary.textContent = summary;
  }

  /* ---------- Auto-scroll ---------- */
  function centerScroll(): void {
    if (!elStage) return;
    // Prefer native center if supported
    try {
      elStage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      const rect = elStage.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const target = rect.top + scrollTop + rect.height / 2 - window.innerHeight / 2;
      window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }
  }

  /* ---------- Flow ---------- */
  function startPractice(): void {
    if (!elCategory) return;
    const category = elCategory.value;
    const topics = getSelectedTopics();
    if (!topics.length) {
      showToast('Please select at least one topic.');
      return;
    }

    const totalQuestions = parseInt(elQuestionCount?.value || '10', 10) || 10;
    const adaptWindow = parseInt(elAdaptEvery?.value || '10', 10) || 10;
    const adaptive = !!elAdaptiveToggle?.checked;

    const session = createSession({ category, topics, totalQuestions, adaptWindow, adaptive });
    if (!session) {
      showToast('No questions available for that selection.');
      return;
    }

    STATE.session = session;
    if (elReset) elReset.disabled = false;
    updateChips(category, topics);
    updateProgress(session);

    const q = drawQuestion(session);
    if (!q) {
      showToast('Question pool is empty.');
      return;
    }
    showQuestionView();

    // Initialize timeline with eliminated array
    session.timeline.push({ q, answered: false, chosenIdx: null, correct: null, eliminated: [] });
    session.currentIndex = 0;

    // hide selection wizard during session
    elWizard?.classList.add('is-hidden');

    renderQuestion(q);

    // Auto-scroll stage to center after render tick
    setTimeout(centerScroll, 0);
  }

  function submitAnswer(): void {
    const s = STATE.session;
    if (!s || !s.current) return;

    const selected = $<HTMLButtonElement>('.mc-option.is-selected');
    if (!selected) return;
    const chosenIdx = Number(selected.getAttribute('data-index'));
    const isCorrect = chosenIdx === s.current.answerIndex;

    s.asked += 1;
    s.correct += isCorrect ? 1 : 0;
    s.streak = isCorrect ? s.streak + 1 : 0;
    s.history.push({ id: s.current.id, correct: isCorrect, difficulty: s.currentDiff });

    if (s.currentIndex >= 0 && s.timeline[s.currentIndex]) {
      const entry = s.timeline[s.currentIndex]!;
      entry.answered = true;
      entry.chosenIdx = chosenIdx;
      entry.correct = isCorrect;
    }

    markResponse(isCorrect, s.current);
    updateProgress(s);

    if (s.adaptive && s.adaptWindow > 0 && s.asked % s.adaptWindow === 0) {
      maybeAdapt(s);
    }
  }

  function nextQuestion(): void {
    const s = STATE.session;
    if (!s) return;

    if (s.currentIndex < s.timeline.length - 1) {
      s.currentIndex += 1;
      s.current = s.timeline[s.currentIndex]!.q;
      updateDiffChip(s.currentDiff);
      renderQuestion(s.current);
      return;
    }

    if (s.asked >= s.totalQuestions) {
      const acc = s.correct / s.asked;
      const summary = `You answered ${s.correct} out of ${s.asked} correctly (${Math.round(acc * 100)}%).`;
      showFinish(summary);
      return;
    }

    const q = drawQuestion(s);
    if (!q) {
      const acc = s.correct / (s.asked || 1);
      const summary = `We ran out of questions. Final score: ${s.correct}/${s.asked} (${Math.round(acc * 100)}%).`;
      showFinish(summary);
      return;
    }

    s.timeline.push({ q, answered: false, chosenIdx: null, correct: null, eliminated: [] });
    s.currentIndex = s.timeline.length - 1;

    renderQuestion(q);
  }

  function prevQuestion(): void {
    const s = STATE.session;
    if (!s) return;
    if (s.currentIndex > 0) {
      s.currentIndex -= 1;
      s.current = s.timeline[s.currentIndex]!.q;
      showQuestionView();
      renderQuestion(s.current);
    }
  }

  function resetPractice(): void {
    STATE.session = null;
    if (elReset) elReset.disabled = true;
    if (elStatDiff) elStatDiff.textContent = '—';
    if (elStatStreak) elStatStreak.textContent = '0';
    if (elStatCorrect) elStatCorrect.textContent = '0';
    if (elStatAnswered) elStatAnswered.textContent = '0';
    if (elStatTotal) elStatTotal.textContent = '0';
    elProgressFill?.style.setProperty('--p', `0%`);
    showEmpty();

    // show wizard again at step 1
    elWizard?.classList.remove('is-hidden');
    goToStep(1);
  }

  /* ---------- Events ---------- */
  elCategory?.addEventListener('change', () => {
    refreshTopicsUIForCategory(elCategory.value);
  });

  elTopicsSelectAll?.addEventListener('click', selectAllTopics);
  elTopicsClear?.addEventListener('click', clearAllTopics);

  elStart?.addEventListener('click', startPractice);
  elReset?.addEventListener('click', resetPractice);
  elFinishReset?.addEventListener('click', resetPractice);

  elSubmit?.addEventListener('click', submitAnswer);
  elNext?.addEventListener('click', nextQuestion);
  elPrev?.addEventListener('click', prevQuestion);

  elRestart?.addEventListener('click', () => {
    if (!STATE.session) return;
    const { category, topics, totalQuestions, adaptWindow, adaptive } = STATE.session;
    const session = createSession({ category, topics, totalQuestions, adaptWindow, adaptive });
    if (!session) {
      showToast('No questions available for that selection.');
      return;
    }

    STATE.session = session;
    updateChips(category, topics);
    updateProgress(session);
    const q = drawQuestion(session);
    if (!q) {
      showToast('Question pool is empty.');
      return;
    }
    showQuestionView();

    session.timeline.push({ q, answered: false, chosenIdx: null, correct: null, eliminated: [] });
    session.currentIndex = 0;

    renderQuestion(q);
  });

  /* Enter key submits only while a question is on screen */
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const questionVisible = !!elStageWrap && !elStageWrap.classList.contains('hide');
    if (e.key === 'Enter' && questionVisible && elSubmit && !elSubmit.disabled) {
      e.preventDefault();
      submitAnswer();
    }
  });

  /* ---------- Initial UI ---------- */
  showEmpty();
  function syncAdaptiveDisable(): void {
    if (!elAdaptiveToggle || !elAdaptEvery) return;
    elAdaptEvery.disabled = !elAdaptiveToggle.checked;
  }
  elAdaptiveToggle?.addEventListener('change', syncAdaptiveDisable);
  syncAdaptiveDisable();

  // Start at step 1, centered wizard
  goToStep(1);

  /* ---------- data-cat attribute sync (drives body[data-cat="Economics"] rules) ---------- */
  if (elCategory) {
    const updateCatAttr = () => document.body.setAttribute('data-cat', elCategory.value);
    elCategory.addEventListener('change', updateCatAttr);
    updateCatAttr();
  }
}
