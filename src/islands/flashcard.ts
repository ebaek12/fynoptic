// Port of js/flashcard.js (auth-overhaul worktree) — the one-screen wizard
// flashcard experience: pick units, pick a mode (multiple choice / fill in
// the blank), run a session, track progress in localStorage, show a summary.
//
// Behavior is ported as-is. In particular `centerOn()` below carries a
// pre-existing bug (flagged inline) that is NOT fixed here — it belongs to a
// separate audit.

import { z } from 'zod';
import type { Flashcard } from '../types';
import { FLASHCARD_UNITS } from '../data/flashcard-units';
import { shuffle } from '../lib/shuffle';
import { showToast } from '../lib/toast';

const STORAGE_KEY = 'fynoptic.flashcards.v1';

type Mode = 'mc' | 'fitb';
type AnswerTarget = 'term' | 'definition';
type WizardStep = 1 | 2 | 3;

interface DeckCard extends Flashcard {
  unit: string;
  id: string;
}

interface AnswerRecord {
  correct: boolean;
  attempts: number;
  lastAt: number;
}

interface Stats {
  total: number;
  done: number;
  correct: number;
  streak: number;
}

interface FlashcardState {
  unitsSelected: Set<string>;
  mode: Mode;
  mcAnswer: AnswerTarget;
  fitbAnswer: AnswerTarget;
  deck: DeckCard[];
  index: number;
  flipped: boolean;
  stats: Stats;
  answers: Record<string, AnswerRecord>;
  active: boolean;
  revealed: Set<string>;
  step: WizardStep;
}

interface Els {
  // Required — always present in the flashcard.astro markup.
  controls: HTMLElement;
  blockUnits: HTMLElement;
  blockMode: HTMLElement;
  blockStart: HTMLElement;
  unitList: HTMLElement;
  stage: HTMLElement;
  empty: HTMLElement;
  termSide: HTMLElement;
  defSide: HTMLElement;
  termText: HTMLElement;
  defText: HTMLElement;
  mcArea: HTMLElement;
  fitbForm: HTMLFormElement;
  fitbInput: HTMLInputElement;
  feedback: HTMLElement;
  crumbs: HTMLElement;

  // Optional — original code guards these with `?.` / `if (...)`.
  selectAll: HTMLButtonElement | null;
  clearAll: HTMLButtonElement | null;
  confirmUnits: HTMLButtonElement | null;
  confirmMode: HTMLButtonElement | null;
  startBig: HTMLButtonElement | null;
  startSummary: HTMLElement | null;
  startBtn: HTMLButtonElement | null;
  endBtn: HTMLButtonElement | null;
  resetProgress: HTMLButtonElement | null;
  shuffleToggle: HTMLInputElement | null;
  caseInsensitive: HTMLInputElement | null;
  flip: HTMLButtonElement | null;
  fitbHint: HTMLButtonElement | null;
  prev: HTMLButtonElement | null;
  next: HTMLButtonElement | null;
  restart: HTMLButtonElement | null;
  mcAnswerToggle: HTMLButtonElement | null;
  statTotal: HTMLElement | null;
  statDone: HTMLElement | null;
  statCorrect: HTMLElement | null;
  statAcc: HTMLElement | null;
  statStreak: HTMLElement | null;
  progressFill: HTMLElement | null;
  blockProgress: HTMLElement | null;
  summaryModal: HTMLElement | null;
  summaryGrid: HTMLElement | null;
  summaryUnits: HTMLElement | null;
}

function $<T extends Element = Element>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

let els: Els;
let state: FlashcardState;

function createInitialState(): FlashcardState {
  return {
    unitsSelected: new Set(),
    mode: 'mc',
    mcAnswer: 'term',
    fitbAnswer: 'term',
    deck: [],
    index: 0,
    flipped: false,
    stats: { total: 0, done: 0, correct: 0, streak: 0 },
    answers: {},
    active: false,
    revealed: new Set(),
    step: 1,
  };
}

// ---------- STORAGE ----------
const answerRecordSchema = z.object({
  correct: z.boolean(),
  attempts: z.number(),
  lastAt: z.number(),
});

const storedDataSchema = z.object({
  answers: z.record(answerRecordSchema),
});

function readStorage(): { answers: Record<string, AnswerRecord> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const result = storedDataSchema.safeParse(parsed);
    return result.success ? result.data : { answers: {} };
  } catch {
    return { answers: {} };
  }
}

function persistProgress(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: state.answers }));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded); ignore.
  }
}

// ---------- INIT ----------
export function initFlashcards(): void {
  const controls = $<HTMLElement>('.fc-controls');
  const blockUnits = document.getElementById('block-units');
  const blockMode = document.getElementById('block-mode');
  const blockStart = document.getElementById('block-start');
  const unitList = document.getElementById('unit-list');
  const stage = document.getElementById('fc-stage');
  const empty = document.getElementById('empty-state');
  const termSide = document.getElementById('term-side');
  const defSide = document.getElementById('def-side');
  const termText = document.getElementById('term-text');
  const defText = document.getElementById('def-text');
  const mcArea = document.getElementById('mc-area');
  const fitbForm = document.getElementById('fitb-form') as HTMLFormElement | null;
  const fitbInput = document.getElementById('fitb-input') as HTMLInputElement | null;
  const feedback = document.getElementById('feedback');
  const crumbs = document.getElementById('crumbs-text');

  if (
    !controls ||
    !blockUnits ||
    !blockMode ||
    !blockStart ||
    !unitList ||
    !stage ||
    !empty ||
    !termSide ||
    !defSide ||
    !termText ||
    !defText ||
    !mcArea ||
    !fitbForm ||
    !fitbInput ||
    !feedback ||
    !crumbs
  ) {
    console.error('[flashcards] missing required DOM elements; aborting init');
    return;
  }

  els = {
    controls,
    blockUnits,
    blockMode,
    blockStart,
    unitList,
    selectAll: $<HTMLButtonElement>('#select-all'),
    clearAll: $<HTMLButtonElement>('#clear-all'),
    confirmUnits: $<HTMLButtonElement>('#confirm-units'),
    confirmMode: $<HTMLButtonElement>('#confirm-mode'),
    startBig: $<HTMLButtonElement>('#start-btn-big'),
    startSummary: document.getElementById('start-summary'),
    startBtn: $<HTMLButtonElement>('#start-btn'),
    endBtn: $<HTMLButtonElement>('#end-btn'),
    resetProgress: $<HTMLButtonElement>('#reset-progress'),
    shuffleToggle: $<HTMLInputElement>('#shuffle'),
    caseInsensitive: $<HTMLInputElement>('#case-insensitive'),
    stage,
    empty,
    flip: $<HTMLButtonElement>('#flip-btn'),
    termSide,
    defSide,
    termText,
    defText,
    mcArea,
    fitbForm,
    fitbInput,
    fitbHint: $<HTMLButtonElement>('#fitb-hint'),
    feedback,
    prev: $<HTMLButtonElement>('#prev-btn'),
    next: $<HTMLButtonElement>('#next-btn'),
    restart: $<HTMLButtonElement>('#restart-btn'),
    crumbs,
    mcAnswerToggle: $<HTMLButtonElement>('#mc-toggle-answer'),
    statTotal: document.getElementById('stat-total'),
    statDone: document.getElementById('stat-done'),
    statCorrect: document.getElementById('stat-correct'),
    statAcc: document.getElementById('stat-acc'),
    statStreak: document.getElementById('stat-streak'),
    progressFill: document.getElementById('progress-fill'),
    blockProgress: document.getElementById('block-progress'),
    summaryModal: document.getElementById('summary-modal'),
    summaryGrid: document.getElementById('summary-grid'),
    summaryUnits: document.getElementById('summary-units'),
  };

  state = createInitialState();

  hydrateUnits();
  hookControls();
  loadSavedProgress();
  updateProgressUI();

  setStepHiddenState(1, true);
  els.stage.hidden = true;
  els.empty.hidden = true;

  if (els.blockProgress) {
    els.blockProgress.hidden = true;
    els.blockProgress.setAttribute('aria-hidden', 'true');
  }

  // Center the Units box on load only (per original design).
  requestAnimationFrame(() => centerOn(els.blockUnits, { behavior: 'smooth' }));
}

// ---------- A11Y LIVE REGION (ported for fidelity; unused in original too) ----------
const live: HTMLElement =
  document.getElementById('a11y-live') ??
  (() => {
    const d = document.createElement('div');
    d.id = 'a11y-live';
    d.className = 'vh';
    d.setAttribute('aria-live', 'polite');
    document.body.appendChild(d);
    return d;
  })();

function announce(msg: string): void {
  live.textContent = msg;
}
void announce;

// ---------- WIZARD FLOW ----------
function setStepHiddenState(step: WizardStep, initial = false): void {
  const blocks = [els.blockUnits, els.blockMode, els.blockStart];
  blocks.forEach((b, i) => {
    const shouldHide = i !== step - 1;
    b.hidden = shouldHide;
    b.setAttribute('aria-hidden', String(shouldHide));
  });
  els.controls.dataset.step = String(step);

  if (step === 3 && els.startSummary) {
    const count = state.unitsSelected.size;
    const modeLabel = state.mode === 'mc' ? 'Multiple Choice' : 'Fill in the Blank';
    els.startSummary.textContent = count
      ? `You selected ${count} unit${count > 1 ? 's' : ''} in ${modeLabel} mode.`
      : `No units selected yet.`;
  }

  if (!initial) {
    els.controls.classList.add('flip-out');
    setTimeout(() => {
      els.controls.classList.remove('flip-out');
      els.controls.classList.add('flip-in');
      setTimeout(() => els.controls.classList.remove('flip-in'), 420);
    }, 220);
  }
}

function showWizardStep(step: WizardStep): void {
  state.step = step;
  setStepHiddenState(step);
}

// ---------- UNITS ----------
function hydrateUnits(): void {
  const frag = document.createDocumentFragment();
  Object.keys(FLASHCARD_UNITS).forEach((unitName) => {
    const chip = document.createElement('button');
    chip.className = 'chip unit-chip';
    chip.type = 'button';
    chip.dataset.unit = unitName;
    chip.textContent = unitName;
    chip.addEventListener('click', () => toggleUnit(unitName, chip));
    frag.appendChild(chip);
  });
  els.unitList.innerHTML = '';
  els.unitList.appendChild(frag);
}

function toggleUnit(unit: string, chipEl: HTMLButtonElement): void {
  if (state.unitsSelected.has(unit)) {
    state.unitsSelected.delete(unit);
    chipEl.classList.remove('is-active');
  } else {
    state.unitsSelected.add(unit);
    chipEl.classList.add('is-active');
  }
}

// ---------- HOOKS ----------
function hookControls(): void {
  document.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach((r) => {
    r.addEventListener('change', (e: Event) => {
      const target = e.currentTarget as HTMLInputElement;
      if (state.active) {
        e.preventDefault();
        const prevRadio = document.querySelector<HTMLInputElement>(
          `input[name="mode"][value="${state.mode}"]`,
        );
        if (prevRadio) prevRadio.checked = true;
        showToast('End the current session to switch modes.');
        return;
      }
      state.mode = target.value as Mode;
      renderAnswerArea();
      renderCard();
    });
  });

  els.selectAll?.addEventListener('click', () => {
    state.unitsSelected = new Set(Object.keys(FLASHCARD_UNITS));
    document.querySelectorAll('.unit-chip').forEach((el) => el.classList.add('is-active'));
  });

  els.clearAll?.addEventListener('click', () => {
    state.unitsSelected.clear();
    document.querySelectorAll('.unit-chip').forEach((el) => el.classList.remove('is-active'));
  });

  // CONFIRM buttons (no auto-advance)
  els.confirmUnits?.addEventListener('click', () => {
    if (!state.unitsSelected.size) {
      showToast('Select at least one unit to continue.');
      return;
    }
    showWizardStep(2);
  });

  els.confirmMode?.addEventListener('click', () => {
    showWizardStep(3);
  });

  // Start buttons
  els.startBtn?.addEventListener('click', startSession);
  els.startBig?.addEventListener('click', startSession);

  els.endBtn?.addEventListener('click', endSession);

  els.resetProgress?.addEventListener('click', () => {
    if (confirm('Reset all saved flashcard progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      state.stats = { total: 0, done: 0, correct: 0, streak: 0 };
      state.answers = {};
      updateProgressUI();
      showToast('Progress reset.');
    }
  });

  // Stage actions
  els.flip?.addEventListener('click', () => flipCard());
  els.prev?.addEventListener('click', () => gotoRelative(-1));
  els.next?.addEventListener('click', () => gotoRelative(1));
  els.restart?.addEventListener('click', () => restartDeck());

  // FITB
  els.fitbForm.addEventListener('submit', onFitbSubmit);
  els.fitbHint?.addEventListener('click', () => showHint());

  // Toggle "answer with ..." for both modes
  els.mcAnswerToggle?.addEventListener('click', () => {
    if (state.mode === 'mc') {
      state.mcAnswer = state.mcAnswer === 'term' ? 'definition' : 'term';
    } else {
      state.fitbAnswer = state.fitbAnswer === 'term' ? 'definition' : 'term';
    }
    updateAnswerToggleLabel();
    renderCard();
  });
}

// ---------- SESSION ----------
function startSession(): void {
  const units = Array.from(state.unitsSelected);
  if (!units.length) {
    showToast('Select at least one unit.');
    return;
  }
  buildDeck(units);
  if (els.shuffleToggle?.checked) state.deck = shuffle(state.deck);
  state.index = 0;
  state.flipped = false;
  state.active = true;
  state.revealed.clear();

  document.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach((r) => {
    r.disabled = true;
  });
  if (els.endBtn) els.endBtn.hidden = false;

  // Hide wizard, show stage in same spot
  els.controls.setAttribute('aria-hidden', 'true');
  els.controls.classList.add('is-hidden');
  els.stage.hidden = false;
  els.empty.hidden = true;

  // Show progress only when the stage is actually visible.
  if (els.blockProgress) {
    els.blockProgress.hidden = false;
    els.blockProgress.setAttribute('aria-hidden', 'false');
  }

  // Auto-center the quizzing/flashcard modal.
  requestAnimationFrame(() => centerOn(els.stage, { behavior: 'smooth' }));

  renderCard();
  renderAnswerArea();
  updateCrumbs();
}

function showEndChip(): void {
  const controls = document.querySelector<HTMLElement>('.fc-controls');
  if (!controls) return;

  controls.querySelectorAll('.end-chip').forEach((n) => n.remove());
  const chip = document.createElement('div');
  chip.className = 'end-chip';
  chip.innerHTML = `<span class="dot" aria-hidden="true"></span> Session ended`;
  controls.appendChild(chip);
  setTimeout(() => chip.remove(), 6000);
}

/* Show summary modal on click; return to Unit selection AFTER user closes (X). */
function endSession(): void {
  if (!state.active) {
    // If already inactive, still try to show summary if available.
    if (els.summaryModal) openSummaryModal();
    return;
  }

  // Build + open the summary modal.
  if (els.summaryModal) {
    openSummaryModal();
  } else {
    // Fallback if summary modal not in DOM.
    returnToUnitSelection();
  }

  // Disable answering while summary is open.
  state.active = false;
}

function openSummaryModal(): void {
  const modal = els.summaryModal;
  if (!modal) return;

  const { total, done, correct } = state.stats;
  const acc = total ? Math.round((correct / (done || 1)) * 100) : 0;

  if (els.summaryGrid) {
    els.summaryGrid.innerHTML = `
      <div class="summary-item"><span>Completed</span><strong>${done} / ${total}</strong></div>
      <div class="summary-item"><span>Correct</span><strong>${correct}</strong></div>
      <div class="summary-item"><span>Accuracy</span><strong>${acc}%</strong></div>
      <div class="summary-item"><span>Revealed Cards</span><strong>${state.revealed.size}</strong></div>
    `;
  }

  if (els.summaryUnits) {
    els.summaryUnits.innerHTML =
      Array.from(state.unitsSelected)
        .map((u) => `<span class="chip">${escapeHTML(u)}</span>`)
        .join('') || `<span class="muted">None</span>`;
  }

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');

  // Close via X button only.
  modal.addEventListener('click', onSummaryModalClick);
}

function onSummaryModalClick(e: MouseEvent): void {
  const modal = els.summaryModal;
  if (!modal) return;

  const target = e.target;
  const closeBtn = target instanceof Element ? target.closest('[data-modal-close]') : null;
  if (!closeBtn) return;

  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  modal.removeEventListener('click', onSummaryModalClick);

  // After closing, return to Units selection.
  returnToUnitSelection();
}

function returnToUnitSelection(): void {
  // Hide stage, show wizard step 1.
  els.stage.hidden = true;
  els.empty.hidden = true;
  els.controls.classList.remove('is-hidden');
  els.controls.removeAttribute('aria-hidden');
  state.step = 1;
  setStepHiddenState(1);

  // Hide progress again when leaving the stage.
  if (els.blockProgress) {
    els.blockProgress.hidden = true;
    els.blockProgress.setAttribute('aria-hidden', 'true');
  }

  // Reset End button UI.
  if (els.endBtn) {
    els.endBtn.hidden = true;
    els.endBtn.classList.remove('btn-ended');
    els.endBtn.removeAttribute('aria-disabled');
    els.endBtn.textContent = 'End Session';
  }
  els.stage.classList.remove('ending');

  // Allow switching modes again.
  document.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach((r) => {
    r.disabled = false;
  });

  showEndChip();
}

function restartDeck(): void {
  if (els.shuffleToggle?.checked) state.deck = shuffle(state.deck);
  state.index = 0;
  state.flipped = false;
  state.revealed.clear();
  renderCard();
  renderAnswerArea();
  updateCrumbs();
}

function buildDeck(units: string[]): void {
  const deck: DeckCard[] = [];
  units.forEach((u) => {
    (FLASHCARD_UNITS[u] ?? []).forEach((card) => {
      deck.push({ ...card, unit: u, id: `${u}::${card.term}` });
    });
  });
  state.deck = deck;
  state.stats.total = deck.length;

  const saved = readStorage();
  state.answers = saved.answers;
  const ids = new Set(deck.map((c) => c.id));
  let done = 0;
  let correct = 0;
  for (const [id, a] of Object.entries(state.answers)) {
    if (ids.has(id)) {
      done++;
      if (a.correct) correct++;
    }
  }
  state.stats.done = done;
  state.stats.correct = correct;
  state.stats.streak = 0;
  updateProgressUI();
}

function renderCard(): void {
  const card = currentCard();
  if (!card) return;

  els.termText.textContent = card.term;
  els.defText.textContent = card.definition;

  const showDefFirst =
    (state.mode === 'fitb' && state.fitbAnswer === 'term') ||
    (state.mode === 'mc' && state.mcAnswer === 'term');

  const frontIsTerm = !showDefFirst;
  state.flipped = state.revealed.has(card.id);

  els.termSide.classList.toggle('is-front', state.flipped ? !frontIsTerm : frontIsTerm);
  els.defSide.classList.toggle('is-front', state.flipped ? frontIsTerm : !frontIsTerm);

  els.feedback.hidden = true;
  els.feedback.textContent = '';

  if (state.mode === 'mc') buildMCOptions(card);
  if (state.mode === 'fitb') {
    els.fitbInput.value = '';
    els.fitbInput.placeholder = state.fitbAnswer === 'term' ? 'Type the term…' : 'Type the definition…';
    if (!state.revealed.has(card.id)) els.fitbInput.focus();
  }
  setAnswerInteractivity();
}

function renderAnswerArea(): void {
  const isMC = state.mode === 'mc';
  els.mcArea.hidden = !isMC;
  els.fitbForm.hidden = isMC;

  if (els.mcAnswerToggle) {
    els.mcAnswerToggle.hidden = false;
    updateAnswerToggleLabel();
  }
}

function currentCard(): DeckCard | undefined {
  return state.deck[state.index];
}

function updateCrumbs(): void {
  els.crumbs.textContent = `${Math.min(state.index + 1, state.deck.length)} / ${state.deck.length}`;
}

function gotoRelative(delta: number): void {
  if (!state.deck.length) return;
  state.index = (state.index + delta + state.deck.length) % state.deck.length;
  renderCard();
  renderAnswerArea();
  updateCrumbs();
  setAnswerInteractivity();
}

function flipCard(): void {
  const card = currentCard();
  if (!card) return;

  if (state.revealed.has(card.id)) {
    showToast('This card is already revealed.');
    return;
  }

  state.revealed.add(card.id);
  state.flipped = true;

  const showDefFirst =
    (state.mode === 'fitb' && state.fitbAnswer === 'term') ||
    (state.mode === 'mc' && state.mcAnswer === 'term');
  const frontIsTerm = !showDefFirst;

  els.termSide.classList.toggle('is-front', !frontIsTerm);
  els.defSide.classList.toggle('is-front', frontIsTerm);

  setAnswerInteractivity();
}

// ---------- MULTIPLE CHOICE ----------
function buildMCOptions(card: DeckCard): void {
  const pool: Flashcard[] = state.deck.length ? state.deck : Object.values(FLASHCARD_UNITS).flat();
  const useTermAnswers = state.mcAnswer === 'term';
  const correctValue = useTermAnswers ? card.term : card.definition;

  const candidates = pool
    .map((c) => (useTermAnswers ? c.term : c.definition))
    .filter((v) => v && v !== correctValue);

  const values = new Set<string>([correctValue]);
  while (values.size < 4 && candidates.length) {
    const i = Math.floor(Math.random() * candidates.length);
    values.add(candidates[i]!);
    candidates.splice(i, 1);
  }
  const options = shuffle(Array.from(values));

  els.mcArea.innerHTML = '';
  options.forEach((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mc-option';
    b.dataset.value = opt;
    b.textContent = opt;
    b.addEventListener('click', () => handleMCClick(opt));
    els.mcArea.appendChild(b);
  });
  setAnswerInteractivity();
}

function handleMCClick(value: string): void {
  const card = currentCard();
  if (!card) return;

  if (state.revealed.has(card.id)) {
    showToast('You revealed this card; answering is disabled.');
    return;
  }

  const useTermAnswers = state.mcAnswer === 'term';
  const correctValue = useTermAnswers ? card.term : card.definition;

  const correct = value === correctValue;
  gradeCurrent(correct);

  document.querySelectorAll<HTMLButtonElement>('.mc-option').forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.value === correctValue) btn.classList.add('is-correct');
    if (btn.dataset.value === value && !correct) btn.classList.add('is-wrong');
  });

  const answerLabel = escapeHTML(correctValue);
  showFeedback(correct ? 'Nice! ✅' : `Not quite. The answer is <strong>${answerLabel}</strong>.`, correct);
}

// ---------- FILL IN THE BLANK ----------
function onFitbSubmit(e: SubmitEvent): void {
  e.preventDefault();
  const card = currentCard();
  if (!card) return;

  if (state.revealed.has(card.id)) {
    showToast('You revealed this card; answering is disabled.');
    return;
  }

  const val = (els.fitbInput.value || '').trim();
  if (!val) return;

  const target = state.fitbAnswer === 'term' ? card.term : card.definition;

  // Default to case-insensitive if toggle isn't present.
  const ciChecked = els.caseInsensitive ? !!els.caseInsensitive.checked : true;
  const normalize = (s: string): string => (ciChecked ? s.toLowerCase() : s);
  const correct = normalize(val) === normalize(target);

  gradeCurrent(correct);
  showFeedback(correct ? 'Correct! ✅' : `Answer: <strong>${escapeHTML(target)}</strong>`, correct);
}

function showHint(): void {
  const card = currentCard();
  if (!card) return;

  const target = state.fitbAnswer === 'term' ? card.term : card.definition;
  const visible = Math.max(1, Math.ceil(target.length / 3));
  const hint = target.slice(0, visible) + '…';
  showFeedback(`Hint: <strong>${escapeHTML(hint)}</strong>`, true);
}

// ---------- GRADING / PROGRESS ----------
function gradeCurrent(correct: boolean): void {
  const card = currentCard();
  if (!card) return;

  const prev = state.answers[card.id];
  const alreadyCounted = !!prev;

  state.answers[card.id] = {
    correct,
    attempts: (prev?.attempts ?? 0) + 1,
    lastAt: Date.now(),
  };

  if (!alreadyCounted) state.stats.done += 1;
  if (correct) {
    state.stats.correct += 1;
    state.stats.streak += 1;
  } else {
    state.stats.streak = 0;
  }

  persistProgress();
  updateProgressUI();
}

function updateProgressUI(): void {
  const { total, done, correct, streak } = state.stats;
  const acc = total ? Math.round((correct / (done || 1)) * 100) : 0;
  if (els.statTotal) els.statTotal.textContent = String(total);
  if (els.statDone) els.statDone.textContent = String(done);
  if (els.statCorrect) els.statCorrect.textContent = String(correct);
  if (els.statAcc) els.statAcc.textContent = `${acc}%`;
  if (els.statStreak) els.statStreak.textContent = String(streak);

  const p = total ? Math.round((done / total) * 100) : 0;
  if (els.progressFill) {
    els.progressFill.style.setProperty('--p', `${p}%`);
    els.progressFill.style.width = `${p}%`;
  }
}

function loadSavedProgress(): void {
  const saved = readStorage();
  state.answers = saved.answers;

  let done = 0;
  let correct = 0;
  for (const a of Object.values(state.answers)) {
    done++;
    if (a.correct) correct++;
  }
  state.stats.done = done;
  state.stats.correct = correct;
  state.stats.streak = 0;
}

// ---------- UTIL ----------
function showFeedback(html: string, good: boolean): void {
  els.feedback.hidden = false;
  els.feedback.innerHTML = html;
  els.feedback.classList.toggle('ok', good);
  els.feedback.classList.toggle('bad', !good);
}

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
};

function escapeHTML(s: string): string {
  return s.replace(/[&<>'"]/g, (c) => ESCAPE_MAP[c] ?? c);
}

function updateAnswerToggleLabel(): void {
  if (!els.mcAnswerToggle) return;
  const answerTarget = state.mode === 'mc' ? state.mcAnswer : state.fitbAnswer;
  els.mcAnswerToggle.textContent = answerTarget === 'term' ? 'Answer with Term' : 'Answer with Definition';
}

/**
 * Centers the given element roughly in the viewport (used only on load and
 * on session start).
 *
 * KNOWN BUG — NOT FIXED HERE: this assumes a sticky header whose height
 * should be subtracted from the scroll target, but the offset math doesn't
 * match the real layout, causing an unwanted ~314px scroll on page load.
 * Ported verbatim from js/flashcard.js; flagged for a separate fix, not
 * addressed as part of this port.
 */
function centerOn(el: HTMLElement, { behavior = 'smooth' as ScrollBehavior, offset = 12 } = {}): void {
  const header = document.querySelector<HTMLElement>('.header');
  const headerH = header ? header.offsetHeight : 0;
  const rect = el.getBoundingClientRect();
  const elMid = rect.top + window.pageYOffset + rect.height / 2;
  const targetTop = Math.max(0, elMid - window.innerHeight / 2 - headerH / 2 - offset);
  window.scrollTo({ top: targetTop, behavior });
}

function setAnswerInteractivity(): void {
  const card = currentCard();
  const locked = card ? state.revealed.has(card.id) : false;

  els.mcArea.classList.toggle('is-locked', locked);
  els.mcArea.querySelectorAll<HTMLButtonElement>('.mc-option').forEach((btn) => {
    btn.disabled = locked;
    btn.setAttribute('aria-disabled', String(locked));
    btn.tabIndex = locked ? -1 : 0;
  });

  els.fitbInput.disabled = locked;
  els.fitbForm.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    b.disabled = locked;
  });

  if (els.flip) {
    els.flip.disabled = locked;
    els.flip.setAttribute('aria-disabled', String(locked));
  }
}
