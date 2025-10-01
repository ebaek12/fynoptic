/* ===========================================================
   Fynoptic – Adaptive Practice (multi-topic + adaptive toggle)
   (Matches the HTML you pasted)
   =========================================================== */

   const $ = (sel, root = document) => root.querySelector(sel);
   const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
   
   const toast = (msg) => {
     const wrap = document.querySelector('.toast-container');
     if (!wrap) { console.log('[toast]', msg); return; }
     const el = document.createElement('div');
     el.className = 'toast';
     el.textContent = msg;
     wrap.appendChild(el);
     setTimeout(() => el.remove(), 3000);
   };
   
   // Single source of truth for the question bank
   let QUESTIONS = window.QUESTIONS || {};
   
   /* ---------- Elements (match your HTML) ---------- */
   const elCategory = $('#category');
   const elHiddenTopicSelect = $('#topic');                 // hidden <select multiple>
   const elTopicsList = $('#topics-list');                  // chips container
   const elTopicsSelectAll = $('#topics-select-all');
   const elTopicsClear = $('#topics-clear');
   
   const elQuestionCount = $('#question-count');            // select 10/20/...
   const elAdaptiveToggle = $('#adaptive-toggle');          // checkbox
   const elAdaptEvery = $('#adapt-every');                  // select cadence
   
   const elStart = $('#start-btn');
   const elReset = $('#reset-btn');
   
   const elProgressFill = $('#pc-progress-fill');           // progress bar fill
   const elStatAnswered = $('#stat-answered');
   const elStatTotal = $('#stat-total');
   const elStatCorrect = $('#stat-correct');
   const elStatStreak = $('#stat-streak');
   const elStatDiff = $('#stat-diff');
   
   const elStageEmpty = $('#stage-empty');
   const elStageWrap = $('#stage-qwrap');
   const elStageFinish = $('#stage-finish');
   
   const elChipCategory = $('#chip-category');
   const elChipTopic = $('#chip-topic');
   const elChipDiff = $('#chip-diff');
   
   const elPrompt = $('#prompt');
   const elMcArea = $('#mc-area');
   const elFeedback = $('#feedback');
   
   const elSubmit = $('#submit-btn');
   const elNext = $('#next-btn');
   const elPrev = $('#prev-btn'); // present in HTML, not used by engine yet
   const elRestart = $('#restart-btn');
   const elFinishReset = $('#finish-reset-btn');
   const elFinishSummary = $('#finish-summary');
   
   /* ---------- State ---------- */
   const STATE = { session: null };
   
   /* ---------- Load question bank ---------- */
   async function loadPF() {
     const tryPaths = [
       './pf_bank_modules_1of6.json',
       'data/pf_bank_modules_1of6.json',
       '/pf_bank_modules_1of6.json'
     ];
     for (const path of tryPaths) {
       try {
         const res = await fetch(path);
         if (!res.ok) continue;
         const db = await res.json();
         window.QUESTIONS = QUESTIONS = db; // sync
         refreshTopicsUIForCategory(elCategory.value);
         return;
       } catch (e) {
         // try next
       }
     }
     console.error('Could not load pf_bank_modules_1of6.json from expected paths.');
     toast('Could not load the question bank (check file path/name).');
   }
   // --- ADD THIS (near your other loaders) ---
async function loadEconomics() {
    try {
      // If you put it in /data/, use '/data/econ_grouped_by_module_unit_with_choices.json'
      const res = await fetch('./econ_grouped_by_module_unit_with_choices.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const econ = await res.json();
  
      // Merge into your global QUESTIONS (single source of truth)
      window.QUESTIONS = window.QUESTIONS || {};
      // Shallow-merge is fine because top-level key is "Economics"
      window.QUESTIONS = { ...window.QUESTIONS, ...econ };
  
      // If your Category select already contains "Economics", we’re done.
      // Refresh the topic list so Units appear on the right
      if (document.getElementById('category')?.value === 'Economics') {
        // This is your existing function that rebuilds the #topic options
        if (typeof refreshTopicList === 'function') refreshTopicList();
        // And your right-side chips mirror #topic, so they’ll update too
        if (typeof initTopics === 'function') initTopics();
      }
  
      // Optional toast if your UI has one
      try {
        (window.toast || console.log)('Economics bank loaded.');
      } catch {}
    } catch (err) {
      console.error('loadEconomics error:', err);
      try { (window.toast || console.error)('Could not load Economics bank (check path).'); } catch {}
    }
  }
  
  // Call it once on page load (alongside your existing loads)
 
  
   loadPF();
   loadEconomics();
   
   /* Allow external JS to merge-in more questions safely */
   window.injectQuestions = function(newData) {
     QUESTIONS = deepMerge(QUESTIONS, newData || {});
     window.QUESTIONS = QUESTIONS;
     refreshTopicsUIForCategory(elCategory.value);
     toast('Question bank loaded.');
   };
   
   function deepMerge(target, src) {
     if (typeof src !== 'object' || src === null) return target;
     const out = Array.isArray(target) ? [...(target || [])] : { ...(target || {}) };
     for (const k of Object.keys(src)) {
       const v = src[k];
       if (Array.isArray(v)) out[k] = (out[k] || []).concat(v);
       else if (v && typeof v === 'object') out[k] = deepMerge(out[k] || {}, v);
       else out[k] = v;
     }
     return out;
   }
   
   /* ---------- Topics chips UI (right panel) ---------- */
   function refreshTopicsUIForCategory(category) {
     // Read topics from QUESTIONS for the chosen category
     const topicsObj = (window.QUESTIONS || QUESTIONS)?.[category] || {};
     const topics = Object.keys(topicsObj).sort();
   
     // Rebuild the hidden <select multiple>
     elHiddenTopicSelect.innerHTML = '';
     topics.forEach(t => {
       const opt = document.createElement('option');
       opt.value = t;
       opt.textContent = t;
       elHiddenTopicSelect.appendChild(opt);
     });
   
     // Rebuild the chips
     elTopicsList.innerHTML = '';
     if (!topics.length) {
       const empty = document.createElement('div');
       empty.className = 'muted';
       empty.textContent = 'No topics available for this category.';
       elTopicsList.appendChild(empty);
       return;
     }
   
     topics.forEach(t => {
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
   
     // EDIT: do NOT auto-select the first topic/module
     // (Removed the previous auto-preselect to satisfy your request.)
   
     syncChipsFromHidden();
   }
   
   function toggleTopicValue(value) {
     const opt = [...elHiddenTopicSelect.options].find(o => o.value === value);
     if (!opt) return;
     opt.selected = !opt.selected;
     syncChipsFromHidden();
   }
   
   function selectAllTopics() {
     [...elHiddenTopicSelect.options].forEach(o => (o.selected = true));
     syncChipsFromHidden();
   }
   
   function clearAllTopics() {
     [...elHiddenTopicSelect.options].forEach(o => (o.selected = false));
     syncChipsFromHidden();
   }
   
   function syncChipsFromHidden() {
     const selected = new Set([...elHiddenTopicSelect.selectedOptions].map(o => o.value));
     [...elTopicsList.querySelectorAll('.topic-btn')].forEach(btn => {
       const on = selected.has(btn.dataset.value);
       btn.classList.toggle('is-selected', on);
       btn.setAttribute('aria-pressed', String(on));
     });
   }
   
   /* Read the selected topics from the hidden select (single source of truth) */
   function getSelectedTopics() {
     return [...elHiddenTopicSelect.selectedOptions].map(o => o.value);
   }
   
   /* ---------- Practice engine ---------- */
   function createSession({ category, topics, totalQuestions, adaptWindow, adaptive }) {
     const catObj = (window.QUESTIONS || QUESTIONS)?.[category];
     if (!catObj) return null;
   
     const byDiff = { easy: [], medium: [], hard: [] };
     topics.forEach(t => {
       const block = catObj?.[t];
       if (!block) return;
       ['easy','medium','hard'].forEach(d => {
         if (Array.isArray(block[d])) byDiff[d].push(...block[d]);
       });
     });
   
     byDiff.easy = shuffle(byDiff.easy);
     byDiff.medium = shuffle(byDiff.medium);
     byDiff.hard = shuffle(byDiff.hard);
   
     if (!byDiff.easy.length && !byDiff.medium.length && !byDiff.hard.length) return null;
   
     const startDiff = byDiff.medium.length ? 'medium' : (byDiff.easy.length ? 'easy' : 'hard');
   
     return {
       category, topics, totalQuestions, adaptWindow, adaptive,
       asked: 0, correct: 0, streak: 0,
       history: [],
       byDiff,
       current: null,
       currentDiff: startDiff,
       // EDIT: navigation timeline for Prev/Next
       timeline: [],          // array of { q, answered, chosenIdx, correct }
       currentIndex: -1       // pointer into timeline
     };
   }
   
   function maybeAdapt(session) {
     if (!session.adaptive) return;
     const N = session.adaptWindow;
     const slice = session.history.slice(-N);
     if (!slice.length) return;
   
     const acc = slice.filter(x => x.correct).length / slice.length;
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
   
   function normalizeQuestion(raw) {
     if (!raw) return null;
     const prompt = raw.prompt || raw.question || '';
     const choices = Array.isArray(raw.choices) ? raw.choices.slice() : [];
     let answerIndex = Number.isInteger(raw.answerIndex)
       ? raw.answerIndex
       : choices.findIndex(c => c === raw.answer);
     if (answerIndex < 0) answerIndex = 0;
     return {
       id: raw.id || cryptoRandomId(),
       prompt,
       choices,
       answerIndex,
       explanation: raw.explanation || '',
       _raw: raw
     };
   }
   
   function cryptoRandomId() {
     try { return 'q-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36); }
     catch { return 'q-' + Math.random().toString(36).slice(2); }
   }
   
   function drawQuestion(session) {
     const tryOrder = [session.currentDiff, 'medium', 'easy', 'hard'];
     for (const d of tryOrder) {
       const arr = session.byDiff[d];
       if (arr && arr.length) {
         const raw = arr.shift();
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
   function niceTopic(slug) {
     return String(slug).replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
   }
   
   function renderQuestion(q) {
     elPrompt.textContent = q.prompt;
     elMcArea.innerHTML = '';
     q.choices.forEach((choice, idx) => {
       const btn = document.createElement('button');
       btn.className = 'mc-option';
       btn.type = 'button';
       btn.setAttribute('data-index', String(idx));
       btn.textContent = choice;
       btn.addEventListener('click', () => selectChoice(idx));
       elMcArea.appendChild(btn);
     });
     elSubmit.disabled = true;
     elNext.disabled = true;
     elFeedback.hidden = true;
     elFeedback.classList.remove('ok','bad');
   
     // EDIT: if we are re-rendering a previously answered question, show its state
     const s = STATE.session;
     if (s && s.timeline && s.currentIndex >= 0) {
       const entry = s.timeline[s.currentIndex];
       if (entry && entry.q && entry.q.id === q.id && entry.answered) {
         if (Number.isInteger(entry.chosenIdx)) {
           selectChoice(entry.chosenIdx);
         }
         // markResponse expects a selected button to be present
         markResponse(!!entry.correct, q);
       }
     }
   }
   
   function selectChoice(idx) {
     $$('.mc-option').forEach(b => b.classList.remove('is-selected'));
     const btn = $(`.mc-option[data-index="${idx}"]`);
     if (btn) btn.classList.add('is-selected');
     elSubmit.disabled = false;
   }
   
   function markResponse(correct, q) {
     const selectedBtn = $('.mc-option.is-selected');
     const selectedIdx = Number(selectedBtn?.getAttribute('data-index'));
     const buttons = $$('.mc-option');
   
     buttons.forEach((b) => b.disabled = true);
     if (Number.isInteger(selectedIdx)) {
       if (selectedIdx === q.answerIndex) {
         selectedBtn.classList.add('is-correct');
       } else {
         selectedBtn.classList.add('is-wrong');
         const right = $(`.mc-option[data-index="${q.answerIndex}"]`);
         if (right) right.classList.add('is-correct');
       }
     }
   
     elFeedback.hidden = false;
     elFeedback.textContent = correct
       ? (q.explanation ? `Correct! ${q.explanation}` : 'Correct!')
       : (q.explanation ? `Not quite. ${q.explanation}` : 'Not quite.');
     elFeedback.classList.toggle('ok', correct);
     elFeedback.classList.toggle('bad', !correct);
   
     elSubmit.disabled = true;
     elNext.disabled = false;
   }
   
   function updateProgress(session) {
     elStatAnswered.textContent = String(session.asked);
     elStatTotal.textContent = String(session.totalQuestions);
     elStatCorrect.textContent = String(session.correct);
     elStatStreak.textContent = String(session.streak);
     const pct = session.totalQuestions ? Math.round(100 * session.asked / session.totalQuestions) : 0;
     elProgressFill.style.setProperty('--p', `${pct}%`);
   }
   
   function updateChips(category, topics) {
     elChipCategory.textContent = category || '—';
     if (!topics || !topics.length) { elChipTopic.textContent = '—'; return; }
     if (topics.length === 1) elChipTopic.textContent = niceTopic(topics[0]);
     else elChipTopic.textContent = `${niceTopic(topics[0])} +${topics.length - 1}`;
   }
   
   function updateDiffChip(diff) {
     const label = diff ? diff[0].toUpperCase() + diff.slice(1) : '—';
     elChipDiff.textContent = label;
     elStatDiff.textContent = label;
   }
   
   function showEmpty() {
     elStageEmpty.classList.remove('hide');
     elStageWrap.classList.add('hide');
     elStageFinish.classList.add('hide');
   }
   function showQuestionView() {
     elStageEmpty.classList.add('hide');
     elStageWrap.classList.remove('hide');
     elStageFinish.classList.add('hide');
   }
   function showFinish(summary) {
     elStageEmpty.classList.add('hide');
     elStageWrap.classList.add('hide');
     elStageFinish.classList.remove('hide');
     elFinishSummary.textContent = summary;
   }
   
   /* ---------- Flow ---------- */
   function startPractice() {
     const category = elCategory.value;
     const topics = getSelectedTopics();
     if (!topics.length) { toast('Please select at least one topic.'); return; }
   
     const totalQuestions = parseInt(elQuestionCount.value, 10) || 10;
     const adaptWindow = parseInt(elAdaptEvery.value, 10) || 10;
     const adaptive = !!elAdaptiveToggle.checked;
   
     const session = createSession({ category, topics, totalQuestions, adaptWindow, adaptive });
     if (!session) { toast('No questions available for that selection.'); return; }
   
     STATE.session = session;
     elReset.disabled = false;
     updateChips(category, topics);
     updateProgress(session);
   
     const q = drawQuestion(session);
     if (!q) { toast('Question pool is empty.'); return; }
     showQuestionView();
   
     // EDIT: initialize timeline and index with the very first question
     session.timeline.push({ q, answered: false, chosenIdx: null, correct: null });
     session.currentIndex = 0;
   
     renderQuestion(q);
   }
   
   function submitAnswer() {
     const s = STATE.session;
     if (!s || !s.current) return;
   
     const selected = $('.mc-option.is-selected');
     if (!selected) return;
     const chosenIdx = Number(selected.getAttribute('data-index'));
     const isCorrect = chosenIdx === s.current.answerIndex;
   
     s.asked += 1;
     s.correct += isCorrect ? 1 : 0;
     s.streak = isCorrect ? (s.streak + 1) : 0;
     s.history.push({ id: s.current.id, correct: isCorrect, difficulty: s.currentDiff });
   
     // EDIT: persist the answer in the timeline entry
     if (s.currentIndex >= 0 && s.timeline[s.currentIndex]) {
       s.timeline[s.currentIndex].answered = true;
       s.timeline[s.currentIndex].chosenIdx = chosenIdx;
       s.timeline[s.currentIndex].correct = isCorrect;
     }
   
     markResponse(isCorrect, s.current);
     updateProgress(s);
   
     if (s.adaptive && s.adaptWindow > 0 && s.asked % s.adaptWindow === 0) {
       maybeAdapt(s);
     }
   }
   
   function nextQuestion() {
     const s = STATE.session;
     if (!s) return;
   
     // EDIT: If we have a future question in the timeline (after going back), move forward within timeline
     if (s.currentIndex < s.timeline.length - 1) {
       s.currentIndex += 1;
       s.current = s.timeline[s.currentIndex].q;
       updateDiffChip(s.currentDiff); // keep current diff label
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
   
     // EDIT: append the newly drawn question to the timeline and advance index
     s.timeline.push({ q, answered: false, chosenIdx: null, correct: null });
     s.currentIndex = s.timeline.length - 1;
   
     renderQuestion(q);
   }
   
   // EDIT: implement going to the previous question without changing stats
   function prevQuestion() {
     const s = STATE.session;
     if (!s) return;
     if (s.currentIndex > 0) {
       s.currentIndex -= 1;
       s.current = s.timeline[s.currentIndex].q;
       showQuestionView();
       renderQuestion(s.current);
     }
   }
   
   function resetPractice() {
     STATE.session = null;
     elReset.disabled = true;
     elStatDiff.textContent = '—';
     elStatStreak.textContent = '0';
     elStatCorrect.textContent = '0';
     elStatAnswered.textContent = '0';
     elStatTotal.textContent = '0';
     elProgressFill.style.setProperty('--p', `0%`);
     showEmpty();
   }
   
   /* ---------- Helpers ---------- */
   function shuffle(arr) {
     const a = [...arr];
     for (let i = a.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [a[i], a[j]] = [a[j], a[i]];
     }
     return a;
   }
   
   /* ---------- Events ---------- */
   elCategory.addEventListener('change', () => {
     refreshTopicsUIForCategory(elCategory.value);
   });
   
   elTopicsSelectAll.addEventListener('click', selectAllTopics);
   elTopicsClear.addEventListener('click', clearAllTopics);
   
   elStart.addEventListener('click', startPractice);
   elReset.addEventListener('click', resetPractice);
   elFinishReset.addEventListener('click', resetPractice);
   
   elSubmit.addEventListener('click', submitAnswer);
   elNext.addEventListener('click', nextQuestion);
   // EDIT: wire up Prev to navigate the timeline
   elPrev.addEventListener('click', prevQuestion);
   
   elRestart.addEventListener('click', () => {
     if (!STATE.session) return;
     const { category, topics, totalQuestions, adaptWindow, adaptive } = STATE.session;
     STATE.session = createSession({ category, topics, totalQuestions, adaptWindow, adaptive });
     updateChips(category, topics);
     updateProgress(STATE.session);
     const q = drawQuestion(STATE.session);
     showQuestionView();
   
     // EDIT: reinitialize timeline after restart
     STATE.session.timeline.push({ q, answered: false, chosenIdx: null, correct: null });
     STATE.session.currentIndex = 0;
   
     renderQuestion(q);
   });
   
   /* Enter key submits only while a question is on screen */
   document.addEventListener('keydown', (e) => {
     const questionVisible = !elStageWrap.classList.contains('hide');
     if (e.key === 'Enter' && questionVisible && !elSubmit.disabled) {
       e.preventDefault();
       submitAnswer();
     }
   });
   
   /* ---------- Initial UI ---------- */
   showEmpty();
   // Disable cadence control if adaptive is off (your UI defaults to checked)
   function syncAdaptiveDisable() {
     const on = elAdaptiveToggle.checked;
     elAdaptEvery.disabled = !on;
   }
   elAdaptiveToggle.addEventListener('change', syncAdaptiveDisable);
   syncAdaptiveDisable();
  
economics (non-breaking) ---
(function () {
  const catSel = document.getElementById('category');
  if (!catSel) return;

  function updateCatAttr() {
    document.body.setAttribute('data-cat', catSel.value);
  }

  catSel.addEventListener('change', updateCatAttr);
  updateCatAttr(); // run once on load
})();
