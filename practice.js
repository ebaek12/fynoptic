/* ===========================================================
   Fynoptic – Adaptive Practice (wizard + end session + scroll + cross-out)
   Only minimal changes for requested features
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
   
   const elStage = $('#stage');                             // <— for auto-scroll (NEW)
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
   const elPrev = $('#prev-btn');
   const elRestart = $('#restart-btn');
   const elFinishReset = $('#finish-reset-btn');
   const elFinishSummary = $('#finish-summary');
   
   /* ---------- Wizard ---------- */
   const elWizard = $('#practice-wizard');
   const step1 = '#step-1';
   const step2 = '#step-2';
   const step3 = '#step-3';
   const elStep2 = $(step2);
   const elStep3 = $(step3);
   const btnNext1 = $('#wiz-next-1');
   const btnBack2 = $('#wiz-back-2');
   const btnNext2 = $('#wiz-next-2');
   const btnBack3 = $('#wiz-back-3');
   const elSummary = $('#wiz-summary');
   
   function goToStep(n) {
     if (!elWizard) return;
     elWizard.setAttribute('data-step', String(n));
   
     // Hide all panels first to avoid overlap/flicker
     [step1, step2, step3].forEach(sel => {
       const panel = $(sel);
       if (!panel) return;
       panel.classList.remove('flip-in', 'slide-out');
       panel.hidden = true;
     });
   
     // Show and animate only the active panel
     const active = document.querySelector(`#step-${n}`);
     if (active) {
       active.hidden = false;
       void active.offsetWidth;
       active.classList.add('flip-in');
       setTimeout(() => active.classList.remove('flip-in'), 400);
     }
   }
   
   btnNext1?.addEventListener('click', () => {
     refreshTopicsUIForCategory(elCategory.value);
     goToStep(2);
   });
   
   btnBack2?.addEventListener('click', () => goToStep(1));
   
   btnNext2?.addEventListener('click', () => {
     const topics = getSelectedTopics();
     if (!topics.length) { toast('Please select at least one unit.'); return; }
     const adaptive = elAdaptiveToggle.checked ? `Adaptive every ${elAdaptEvery.value}` : 'Non-adaptive';
     elSummary.textContent =
       `${elCategory.value} • ${topics.length} unit${topics.length>1?'s':''} • ${elQuestionCount.value} questions • ${adaptive}`;
     goToStep(3);
   });
   
   btnBack3?.addEventListener('click', () => goToStep(2));
   
   /* ---------- NEW: End Session controls (existing feature) ---------- */
   const elEndSessionBtn = $('#end-session-btn');
   const elEndSessionModal = $('#end-session-modal');
   const elEndSessionClose = $('#end-session-close');
   const elEndSessionStats = $('#end-session-stats');
   
   /* ---------- State ---------- */
   const STATE = { session: null };
   
   /* ---------- End Session helpers ---------- */
   function openEndSessionModal() {
     const s = STATE.session;
     if (!s) { toast('No active session.'); return; }
   
     const answered = s.asked;
     const total = s.totalQuestions;
     const correct = s.correct;
     const acc = answered ? Math.round((correct / answered) * 100) : 0;
     const streak = s.streak;
     const diff = s.currentDiff ? s.currentDiff[0].toUpperCase() + s.currentDiff.slice(1) : '—';
     const topics = (s.topics || []).map(t => t.replace(/[_-]/g,' ')).join(', ') || '—';
   
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
     elEndSessionModal.hidden = false;
   }
   
   function closeEndSessionModalAndReturn() {
     elEndSessionModal.hidden = true;
     resetPractice(); // return to mode selection
   }
   
   elEndSessionBtn?.addEventListener('click', openEndSessionModal);
   elEndSessionClose?.addEventListener('click', closeEndSessionModalAndReturn);
   
   /* ---------- Load question banks (unchanged) ---------- */
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
       } catch (e) {}
     }
     console.error('Could not load pf_bank_modules_1of6.json from expected paths.');
     toast('Could not load the question bank (check file path/name).');
   }
   
   async function loadEconomics() {
     try {
       const res = await fetch('./econ_grouped_by_module_unit_with_choices.json');
       if (!res.ok) throw new Error(`HTTP ${res.status}`);
       const econ = await res.json();
   
       window.QUESTIONS = window.QUESTIONS || {};
       window.QUESTIONS = { ...window.QUESTIONS, ...econ };
   
       if (document.getElementById('category')?.value === 'Economics') {
         if (typeof refreshTopicList === 'function') refreshTopicList();
         if (typeof initTopics === 'function') initTopics();
       }
   
       try { (window.toast || console.log)('Economics bank loaded.'); } catch {}
     } catch (err) {
       console.error('loadEconomics error:', err);
       try { (window.toast || console.error)('Could not load Economics bank (check path).'); } catch {}
     }
   }
   
   loadPF();
   loadEconomics();
   
   /* External merge hook (unchanged) */
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
   
   /* ---------- Topics chips UI ---------- */
   function refreshTopicsUIForCategory(category) {
     const topicsObj = (window.QUESTIONS || QUESTIONS)?.[category] || {};
     const topics = Object.keys(topicsObj).sort();
   
     elHiddenTopicSelect.innerHTML = '';
     topics.forEach(t => {
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
       timeline: [],          // array of { q, answered, chosenIdx, correct, eliminated[] } (NEW: eliminated)
       currentIndex: -1
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
   
       // SELECT on normal click; CROSS-OUT on Alt/Ctrl/Meta click or right-click
       btn.addEventListener('click', (e) => {
         if (e.altKey || e.ctrlKey || e.metaKey) {
           e.preventDefault();
           toggleEliminate(btn);
           return;
         }
         selectChoice(idx);
       });
       btn.addEventListener('contextmenu', (e) => {
         e.preventDefault();
         toggleEliminate(btn);
       });
   
       elMcArea.appendChild(btn);
     });
   
     elSubmit.disabled = true;
     elNext.disabled = true;
     elFeedback.hidden = true;
     elFeedback.classList.remove('ok','bad');
   
     // Re-apply persisted selection/eliminations when navigating back
     const s = STATE.session;
     if (s && s.timeline && s.currentIndex >= 0) {
       const entry = s.timeline[s.currentIndex];
       if (entry && entry.q && entry.q.id === q.id) {
         if (Array.isArray(entry.eliminated)) {
           entry.eliminated.forEach(i => {
             const b = $(`.mc-option[data-index="${i}"]`);
             if (b) b.classList.add('is-eliminated');
           });
         }
         if (entry.answered && Number.isInteger(entry.chosenIdx)) {
           selectChoice(entry.chosenIdx);
           markResponse(!!entry.correct, q);
         }
       }
     }
   }
   
   // Toggle cross-out (eliminate) state and persist it to timeline
   function toggleEliminate(btn) {
     const idx = Number(btn.getAttribute('data-index'));
     btn.classList.toggle('is-eliminated');
   
     const s = STATE.session;
     if (!s || s.currentIndex < 0 || !s.timeline[s.currentIndex]) return;
   
     const elim = s.timeline[s.currentIndex].eliminated || [];
     const pos = elim.indexOf(idx);
     if (btn.classList.contains('is-eliminated')) {
       if (pos === -1) elim.push(idx);
     } else if (pos !== -1) {
       elim.splice(pos, 1);
     }
     s.timeline[s.currentIndex].eliminated = elim;
   }
   
   function selectChoice(idx) {
     // Clear selection & elimination for the chosen option
     $$('.mc-option').forEach(b => b.classList.remove('is-selected'));
     const btn = $(`.mc-option[data-index="${idx}"]`);
     if (btn) {
       btn.classList.remove('is-eliminated'); // selecting overrides cross-out
       btn.classList.add('is-selected');
     }
   
     // Persist chosenIdx (even before submit) to help re-render on nav
     const s = STATE.session;
     if (s && s.timeline && s.currentIndex >= 0 && s.timeline[s.currentIndex]) {
       s.timeline[s.currentIndex].chosenIdx = idx;
     }
   
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
   
   /* ---------- Auto-scroll (NEW) ---------- */
   function centerScroll() {
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
   
     // Initialize timeline with eliminated array
     session.timeline.push({ q, answered: false, chosenIdx: null, correct: null, eliminated: [] });
     session.currentIndex = 0;
   
     // hide selection wizard during session
     elWizard?.classList.add('is-hidden');
   
     renderQuestion(q);
   
     // NEW: Auto-scroll stage to center after render tick
     setTimeout(centerScroll, 0);
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
   
     if (s.currentIndex < s.timeline.length - 1) {
       s.currentIndex += 1;
       s.current = s.timeline[s.currentIndex].q;
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
   
     // show wizard again at step 1
     elWizard?.classList.remove('is-hidden');
     goToStep(1);
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
   elPrev.addEventListener('click', prevQuestion);
   
   elRestart.addEventListener('click', () => {
     if (!STATE.session) return;
     const { category, topics, totalQuestions, adaptWindow, adaptive } = STATE.session;
     STATE.session = createSession({ category, topics, totalQuestions, adaptWindow, adaptive });
     updateChips(category, topics);
     updateProgress(STATE.session);
     const q = drawQuestion(STATE.session);
     showQuestionView();
   
     STATE.session.timeline.push({ q, answered: false, chosenIdx: null, correct: null, eliminated: [] });
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
   function syncAdaptiveDisable() {
     const on = elAdaptiveToggle.checked;
     elAdaptEvery.disabled = !on;
   }
   elAdaptiveToggle.addEventListener('change', syncAdaptiveDisable);
   syncAdaptiveDisable();
   
   // Start at step 1, centered wizard
   goToStep(1);
   
   /* ---------- Minor bugfix: stray text converted to a real comment ----------
      economics (non-breaking) */
   (function () {
     const catSel = document.getElementById('category');
     if (!catSel) return;
     function updateCatAttr() {
       document.body.setAttribute('data-cat', catSel.value);
     }
     catSel.addEventListener('change', updateCatAttr);
     updateCatAttr();
   })();
   