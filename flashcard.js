/* ============================================================
   FYNOPTIC FLASHCARDS — One-screen wizard (confirm-only, no scroll between steps)
   ============================================================ */

// ---------- DATABASE SHAPE ----------
const FLASHCARDS = { units: {} };

import { FLASHCARD_UNITS } from './flashcard_units_1_12.js';
Object.assign(FLASHCARDS.units, FLASHCARD_UNITS);

// ---------- CONSTANTS / STATE ----------
const STORAGE_KEY = "fynoptic.flashcards.v1";

const els = {
  // Wizard container + blocks
  controls: document.querySelector(".fc-controls"),
  blockUnits: document.getElementById("block-units"),
  blockMode: document.getElementById("block-mode"),
  blockStart: document.getElementById("block-start"),

  // Units
  unitList: document.getElementById("unit-list"),
  selectAll: document.getElementById("select-all"),
  clearAll: document.getElementById("clear-all"),
  confirmUnits: document.getElementById("confirm-units"),

  // Mode
  confirmMode: document.getElementById("confirm-mode"),

  // Start (big)
  startBig: document.getElementById("start-btn-big"),
  startSummary: document.getElementById("start-summary"),

  // Existing actions
  startBtn: document.getElementById("start-btn"),
  endBtn: document.getElementById("end-btn"),
  resetProgress: document.getElementById("reset-progress"),

  shuffle: document.getElementById("shuffle"),
  caseInsensitive: document.getElementById("case-insensitive"), // may be null; handled safely

  stage: document.getElementById("fc-stage"),
  empty: document.getElementById("empty-state"),

  flip: document.getElementById("flip-btn"),

  termSide: document.getElementById("term-side"),
  defSide: document.getElementById("def-side"),
  termText: document.getElementById("term-text"),
  defText: document.getElementById("def-text"),

  mcArea: document.getElementById("mc-area"),
  fitbForm: document.getElementById("fitb-form"),
  fitbInput: document.getElementById("fitb-input"),
  fitbHint: document.getElementById("fitb-hint"),
  feedback: document.getElementById("feedback"),

  prev: document.getElementById("prev-btn"),
  next: document.getElementById("next-btn"),
  restart: document.getElementById("restart-btn"),

  crumbs: document.getElementById("crumbs-text"),
  mcAnswerToggle: document.getElementById("mc-toggle-answer"),

  // Progress
  statTotal: document.getElementById("stat-total"),
  statDone: document.getElementById("stat-done"),
  statCorrect: document.getElementById("stat-correct"),
  statAcc: document.getElementById("stat-acc"),
  statStreak: document.getElementById("stat-streak"),
  progressFill: document.getElementById("progress-fill"),

  // ADDED
  blockProgress: document.getElementById("block-progress"),

  // ADDED: Session Summary modal elements
  summaryModal: document.getElementById("summary-modal"),
  summaryGrid: document.getElementById("summary-grid"),
  summaryUnits: document.getElementById("summary-units"),
};

let state = {
  unitsSelected: new Set(),
  mode: "mc",           // "mc" | "fitb"
  mcAnswer: "term",     // "term" | "definition"
  fitbAnswer: "term",   // "term" | "definition"
  deck: [],
  index: 0,
  flipped: false,
  stats: { total: 0, done: 0, correct: 0, streak: 0 },
  answers: {},
  active: false,
  revealed: new Set(),  // revealed cards lock answers
  step: 1               // 1=Units, 2=Mode, 3=Start
};

// ---------- INIT ----------
init();

function init() {
  hydrateUnits();
  hookControls();
  loadSavedProgress();
  updateProgressUI();

  // Start at step 1; hide others hard via [hidden]
  setStepHiddenState(1, true);
  els.stage.hidden = true;
  els.empty.hidden = true;

  // Ensure progress stays hidden until session actually starts (ADDED)
  if (els.blockProgress) {
    els.blockProgress.hidden = true;
    els.blockProgress.setAttribute('aria-hidden', 'true');
  }

  // Center the Units box ON LOAD only (per your request)
  requestAnimationFrame(() => centerOn(els.blockUnits, { behavior: "smooth" }));

}

// ---------- WIZARD FLOW ----------
function setStepHiddenState(step, initial = false) {
  const blocks = [els.blockUnits, els.blockMode, els.blockStart];
  blocks.forEach((b, i) => {
    if (!b) return;
    const shouldHide = (i !== step - 1);
    b.hidden = shouldHide;
    b.setAttribute('aria-hidden', String(shouldHide));
  });
  // data-step used only for styling/animation
  els.controls.dataset.step = String(step);

  // Update summary for step 3
  if (step === 3 && els.startSummary) {
    const count = state.unitsSelected.size;
    const modeLabel = state.mode === "mc" ? "Multiple Choice" : "Fill in the Blank";
    els.startSummary.textContent = count
      ? `You selected ${count} unit${count > 1 ? "s" : ""} in ${modeLabel} mode.`
      : `No units selected yet.`;
  }

  // Flip animation (skip on very first paint)
  if (!initial) {
    els.controls.classList.add("flip-out");
    setTimeout(() => {
      els.controls.classList.remove("flip-out");
      els.controls.classList.add("flip-in");
      setTimeout(() => els.controls.classList.remove("flip-in"), 420);
    }, 220);
  }
}

function showWizardStep(step) {
  state.step = step;
  setStepHiddenState(step);
}

// ---------- UNITS ----------
function hydrateUnits() {
  const frag = document.createDocumentFragment();
  Object.keys(FLASHCARDS.units).forEach((unitName) => {
    const chip = document.createElement("button");
    chip.className = "chip unit-chip";
    chip.type = "button";
    chip.dataset.unit = unitName;
    chip.textContent = unitName;
    chip.addEventListener("click", () => toggleUnit(unitName, chip));
    frag.appendChild(chip);
  });
  els.unitList.innerHTML = "";
  els.unitList.appendChild(frag);
}

function toggleUnit(unit, chipEl) {
  if (state.unitsSelected.has(unit)) {
    state.unitsSelected.delete(unit);
    chipEl.classList.remove("is-active");
  } else {
    state.unitsSelected.add(unit);
    chipEl.classList.add("is-active");
  }
}

// ---------- HOOKS ----------
function hookControls() {
  // Mode radios — block switching while active
  document.querySelectorAll('input[name="mode"]').forEach(r => {
    r.addEventListener("change", (e) => {
      if (state.active) {
        e.preventDefault();
        document.querySelector(`input[name="mode"][value="${state.mode}"]`).checked = true;
        toast("End the current session to switch modes.");
        return;
      }
      state.mode = e.target.value;
      renderAnswerArea();
      renderCard();
    });
  });

  els.selectAll.addEventListener("click", () => {
    state.unitsSelected = new Set(Object.keys(FLASHCARDS.units));
    document.querySelectorAll(".unit-chip").forEach(el => el.classList.add("is-active"));
  });

  els.clearAll.addEventListener("click", () => {
    state.unitsSelected.clear();
    document.querySelectorAll(".unit-chip").forEach(el => el.classList.remove("is-active"));
  });

  // CONFIRM buttons (no auto-advance)
  els.confirmUnits?.addEventListener("click", () => {
    if (!state.unitsSelected.size) {
      toast("Select at least one unit to continue.");
      return;
    }
    showWizardStep(2);
  });

  els.confirmMode?.addEventListener("click", () => {
    showWizardStep(3);
  });

  // Start buttons
  els.startBtn.addEventListener("click", startSession);
  els.startBig?.addEventListener("click", startSession);

  els.endBtn.addEventListener("click", endSession);

  els.resetProgress.addEventListener("click", () => {
    if (confirm("Reset all saved flashcard progress?")) {
      localStorage.removeItem(STORAGE_KEY);
      state.stats = { total: 0, done: 0, correct: 0, streak: 0 };
      state.answers = {};
      updateProgressUI();
      toast("Progress reset.");
    }
  });

  // Stage actions
  els.flip.addEventListener("click", () => flipCard());
  els.prev.addEventListener("click", () => gotoRelative(-1));
  els.next.addEventListener("click", () => gotoRelative(+1));
  els.restart.addEventListener("click", () => restartDeck());

  // FITB
  els.fitbForm.addEventListener("submit", onFitbSubmit);
  els.fitbHint.addEventListener("click", () => showHint());

  // Toggle "answer with ..." for both modes
  if (els.mcAnswerToggle) {
    els.mcAnswerToggle.addEventListener("click", () => {
      if (state.mode === "mc") {
        state.mcAnswer = state.mcAnswer === "term" ? "definition" : "term";
      } else {
        state.fitbAnswer = state.fitbAnswer === "term" ? "definition" : "term";
      }
      updateAnswerToggleLabel();
      renderCard();
    });
  }
}

// ---------- SESSION ----------
function startSession() {
  const units = Array.from(state.unitsSelected);
  if (!units.length) {
    toast("Select at least one unit.");
    return;
  }
  buildDeck(units);
  if (els.shuffle?.checked) shuffle(state.deck);
  state.index = 0;
  state.flipped = false;
  state.active = true;
  state.revealed.clear();

  document.querySelectorAll('input[name="mode"]').forEach(r => r.disabled = true);
  els.endBtn.hidden = false;

  // Hide wizard, show stage in same spot
  els.controls.setAttribute("aria-hidden", "true");
  els.controls.classList.add("is-hidden");
  els.stage.hidden = false;
  els.empty.hidden = true;

  // Show progress only when the stage is actually visible (ADDED)
  if (els.blockProgress) {
    els.blockProgress.hidden = false;
    els.blockProgress.setAttribute('aria-hidden', 'false');
  }

  // Auto-center the quizzing/flashcard modal (ADDED)
  requestAnimationFrame(() => centerOn(els.stage, { behavior: "smooth" }));

  renderCard();
  renderAnswerArea();
  updateCrumbs();
}

// --- A11y live region (create once) ---
const live = document.getElementById('a11y-live') || (() => {
  const d = document.createElement('div');
  d.id = 'a11y-live';
  d.className = 'vh';
  d.setAttribute('aria-live', 'polite');
  document.body.appendChild(d);
  return d;
})();

function announce(msg) { live.textContent = msg; }

function showEndChip() {
  const controls = document.querySelector('.fc-controls');
  if (!controls) return;

  controls.querySelectorAll('.end-chip').forEach(n => n.remove());
  const chip = document.createElement('div');
  chip.className = 'end-chip';
  chip.innerHTML = `<span class="dot" aria-hidden="true"></span> Session ended`;
  controls.appendChild(chip);
  setTimeout(() => chip.remove(), 6000);
}

/* =========================
   ADDED: New endSession flow
   - Show summary modal on click
   - Return to Unit selection AFTER user closes (X)
   ========================= */
function endSession() {
  if (!state.active) {
    // If already inactive, still try to show summary if available
    if (els.summaryModal) openSummaryModal();
    return;
  }

  // Build + open the summary modal
  if (els.summaryModal) {
    openSummaryModal();
  } else {
    // Fallback if summary modal not in DOM
    returnToUnitSelection();
  }

  // Disable answering while summary is open
  state.active = false;
}

// ADDED: Build and open the summary modal
function openSummaryModal() {
  // Stats
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
    els.summaryUnits.innerHTML = Array.from(state.unitsSelected)
      .map(u => `<span class="chip">${escapeHTML(u)}</span>`)
      .join('') || `<span class="muted">None</span>`;
  }

  els.summaryModal.hidden = false;
  els.summaryModal.setAttribute('aria-hidden', 'false');

  // Close via X button only
  els.summaryModal.addEventListener('click', onSummaryModalClick);
}

// ADDED: Handle clicking the X in the summary modal
function onSummaryModalClick(e) {
  const closeBtn = e.target.closest('[data-modal-close]');
  if (!closeBtn) return;

  els.summaryModal.hidden = true;
  els.summaryModal.setAttribute('aria-hidden', 'true');
  els.summaryModal.removeEventListener('click', onSummaryModalClick);

  // After closing, return to Units selection
  returnToUnitSelection();
}

// ADDED: Cleanup and navigate back to Unit selection
function returnToUnitSelection() {
  // Hide stage, show wizard step 1
  els.stage.hidden = true;
  els.empty.hidden = true;
  els.controls.classList.remove("is-hidden");
  els.controls.removeAttribute("aria-hidden");
  state.step = 1;
  setStepHiddenState(1);

  // Hide progress again when leaving the stage
  if (els.blockProgress) {
    els.blockProgress.hidden = true;
    els.blockProgress.setAttribute('aria-hidden', 'true');
  }

  // Reset End button UI
  els.endBtn.hidden = true;
  els.endBtn.classList.remove('btn-ended');
  els.endBtn.removeAttribute('aria-disabled');
  els.endBtn.textContent = 'End Session';
  els.stage.classList.remove('ending');

  // Allow switching modes again
  document.querySelectorAll('input[name="mode"]').forEach(r => r.disabled = false);

  showEndChip();
}

function restartDeck() {
  if (els.shuffle?.checked) shuffle(state.deck);
  state.index = 0;
  state.flipped = false;
  state.revealed.clear();
  renderCard();
  renderAnswerArea();
  updateCrumbs();
}

function buildDeck(units) {
  const deck = [];
  units.forEach(u => {
    (FLASHCARDS.units[u] || []).forEach(card => {
      deck.push({ ...card, unit: u, id: `${u}::${card.term}` });
    });
  });
  state.deck = deck;
  state.stats.total = deck.length;

  const saved = readStorage();
  state.answers = saved.answers || {};
  const ids = new Set(deck.map(c => c.id));
  let done = 0, correct = 0;
  for (const [id, a] of Object.entries(state.answers)) {
    if (ids.has(id) && a && typeof a.correct === "boolean") {
      done++;
      if (a.correct) correct++;
    }
  }
  state.stats.done = done;
  state.stats.correct = correct;
  state.stats.streak = 0;
  updateProgressUI();
}

function renderCard() {
  const card = currentCard();
  if (!card) return;

  els.termText.textContent = card.term;
  els.defText.textContent = card.definition;

  const showDefFirst =
    (state.mode === "fitb"  && state.fitbAnswer === "term") ||
    (state.mode === "mc"    && state.mcAnswer   === "term");

  const frontIsTerm = !showDefFirst;
  state.flipped = state.revealed.has(card.id);

  els.termSide.classList.toggle("is-front", state.flipped ? !frontIsTerm : frontIsTerm);
  els.defSide.classList.toggle("is-front",  state.flipped ?  frontIsTerm : !frontIsTerm);

  els.feedback.hidden = true;
  els.feedback.textContent = "";

  if (state.mode === "mc") buildMCOptions(card);
  if (state.mode === "fitb") {
    els.fitbInput.value = "";
    els.fitbInput.placeholder = state.fitbAnswer === "term" ? "Type the term…" : "Type the definition…";
    if (!state.revealed.has(card.id)) els.fitbInput.focus();
  }
  setAnswerInteractivity();
}

function renderAnswerArea() {
  const isMC = state.mode === "mc";
  els.mcArea.hidden = !isMC;
  els.fitbForm.hidden = isMC;

  if (els.mcAnswerToggle) {
    els.mcAnswerToggle.hidden = false;
    updateAnswerToggleLabel();
  }
}

function currentCard() {
  return state.deck[state.index];
}

function updateCrumbs() {
  els.crumbs.textContent = `${Math.min(state.index + 1, state.deck.length)} / ${state.deck.length}`;
}

function gotoRelative(delta) {
  if (!state.deck.length) return;
  state.index = (state.index + delta + state.deck.length) % state.deck.length;
  renderCard();
  renderAnswerArea();
  updateCrumbs();
  setAnswerInteractivity();
}

function flipCard() {
  const card = currentCard();
  if (!card) return;

  if (state.revealed.has(card.id)) {
    toast("This card is already revealed.");
    return;
  }

  state.revealed.add(card.id);
  state.flipped = true;

  const showDefFirst =
    (state.mode === "fitb"  && state.fitbAnswer === "term") ||
    (state.mode === "mc"    && state.mcAnswer   === "term");
  const frontIsTerm = !showDefFirst;

  els.termSide.classList.toggle("is-front", !frontIsTerm);
  els.defSide.classList.toggle("is-front",  frontIsTerm);

  setAnswerInteractivity();
}

// ---------- MULTIPLE CHOICE ----------
function buildMCOptions(card) {
  const pool = state.deck.length ? state.deck : Object.values(FLASHCARDS.units).flat();
  const useTermAnswers = state.mcAnswer === "term";
  const correctValue = useTermAnswers ? card.term : card.definition;

  const candidates = pool
    .map(c => useTermAnswers ? c.term : c.definition)
    .filter(v => v && v !== correctValue);

  const values = new Set([correctValue]);
  while (values.size < 4 && candidates.length) {
    const v = candidates[Math.floor(Math.random() * candidates.length)];
    values.add(v);
  }
  const options = Array.from(values);
  shuffle(options);

  els.mcArea.innerHTML = "";
  options.forEach(opt => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mc-option";
    b.dataset.value = opt;
    b.textContent = opt;
    b.addEventListener("click", () => handleMCClick(opt));
    els.mcArea.appendChild(b);
  });
  setAnswerInteractivity();
}

function handleMCClick(value) {
  const card = currentCard();
  if (!card) return;

  if (state.revealed.has(card.id)) {
    toast("You revealed this card; answering is disabled.");
    return;
  }

  const useTermAnswers = state.mcAnswer === "term";
  const correctValue = useTermAnswers ? card.term : card.definition;

  const correct = value === correctValue;
  gradeCurrent(correct);

  document.querySelectorAll(".mc-option").forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.value === correctValue) btn.classList.add("is-correct");
    if (btn.dataset.value === value && !correct) btn.classList.add("is-wrong");
  });

  const answerLabel = escapeHTML(correctValue);
  showFeedback(correct ? "Nice! ✅" : `Not quite. The answer is <strong>${answerLabel}</strong>.`, correct);
}

// ---------- FILL IN THE BLANK ----------
function onFitbSubmit(e) {
  e.preventDefault();
  const card = currentCard();
  if (!card) return;

  if (state.revealed.has(card.id)) {
    toast("You revealed this card; answering is disabled.");
    return;
  }

  const val = (els.fitbInput.value || "").trim();
  if (!val) return;

  const target = state.fitbAnswer === "term" ? card.term : card.definition;

  // Default to case-insensitive if toggle isn't present
  const ciChecked = els.caseInsensitive ? !!els.caseInsensitive.checked : true;
  const normalize = (s) => ciChecked ? s.toLowerCase() : s;
  const correct = normalize(val) === normalize(target);

  gradeCurrent(correct);
  showFeedback(correct ? "Correct! ✅" : `Answer: <strong>${escapeHTML(target)}</strong>`, correct);
}

function showHint() {
  const card = currentCard();
  const target = state.fitbAnswer === "term" ? card.term : card.definition;
  const visible = Math.max(1, Math.ceil(target.length / 3));
  const hint = target.slice(0, visible) + "…";
  showFeedback(`Hint: <strong>${escapeHTML(hint)}</strong>`, true);
}

// ---------- GRADING / PROGRESS ----------
function gradeCurrent(correct) {
  const card = currentCard();
  if (!card) return;

  const prev = state.answers[card.id];
  const alreadyCounted = !!prev;

  state.answers[card.id] = {
    correct: !!correct,
    attempts: (prev?.attempts || 0) + 1,
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

function updateProgressUI() {
  const { total, done, correct, streak } = state.stats;
  const acc = total ? Math.round((correct / (done || 1)) * 100) : 0;
  els.statTotal.textContent = total;
  els.statDone.textContent = done;
  els.statCorrect.textContent = correct;
  els.statAcc.textContent = `${acc}%`;
  els.statStreak.textContent = String(streak);

  const p = total ? Math.round((done / total) * 100) : 0;
  els.progressFill.style.setProperty("--p", `${p}%`);
  els.progressFill.style.width = `${p}%`;
}

function persistProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: state.answers }));
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// ---------- UTIL ----------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showFeedback(html, good) {
  els.feedback.hidden = false;
  els.feedback.innerHTML = html;
  els.feedback.classList.toggle("ok", !!good);
  els.feedback.classList.toggle("bad", !good);
}

function toast(msg) {
  const wrap = document.querySelector(".toast-container");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

function escapeHTML(s) {
  return s.replace(/[&<>'"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;" }[c]));
}

function updateAnswerToggleLabel() {
  if (!els.mcAnswerToggle) return;
  const answerTarget = (state.mode === "mc") ? state.mcAnswer : state.fitbAnswer;
  els.mcAnswerToggle.textContent =
    answerTarget === "term" ? "Answer with Term" : "Answer with Definition";
}

/* Center the given element roughly in viewport (used only on load) */
function centerOn(el, { behavior = "smooth", offset = 12 } = {}) {
  if (!el) return;
  const header = document.querySelector(".header");
  const headerH = header ? header.offsetHeight : 0;
  const rect = el.getBoundingClientRect();
  const elMid = rect.top + window.pageYOffset + rect.height / 2;
  const targetTop = Math.max(0, elMid - (window.innerHeight / 2) - headerH / 2 - offset);
  window.scrollTo({ top: targetTop, behavior });
}

function setAnswerInteractivity() {
  const card = currentCard();
  const locked = card ? state.revealed.has(card.id) : false;

  els.mcArea.classList.toggle('is-locked', locked);
  els.mcArea.querySelectorAll('.mc-option').forEach(btn => {
    btn.disabled = locked;
    btn.setAttribute('aria-disabled', String(locked));
    btn.tabIndex = locked ? -1 : 0;
  });

  if (els.fitbInput) els.fitbInput.disabled = locked;
  if (els.fitbForm) {
    els.fitbForm.querySelectorAll('button').forEach(b => b.disabled = locked);
  }

  els.flip.disabled = locked;
  els.flip.setAttribute('aria-disabled', String(locked));
}
