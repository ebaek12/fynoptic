/* ============================================================
   FYNOPTIC FLASHCARDS — simplified per your requests
   ============================================================ */

// ---------- DATABASE SHAPE ----------
const FLASHCARDS = { units: {} };

import { FLASHCARD_UNITS } from './flashcard_units_1_12.js';
Object.assign(FLASHCARDS.units, FLASHCARD_UNITS);

// ---------- CONSTANTS / STATE ----------
const STORAGE_KEY = "fynoptic.flashcards.v1";

const els = {
  unitList: document.getElementById("unit-list"),
  selectAll: document.getElementById("select-all"),
  clearAll: document.getElementById("clear-all"),
  startBtn: document.getElementById("start-btn"),
  endBtn: document.getElementById("end-btn"),
  resetProgress: document.getElementById("reset-progress"),

  shuffle: document.getElementById("shuffle"),
  caseInsensitive: document.getElementById("case-insensitive"),

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

  // This is the pill button you placed above the answer area
  mcAnswerToggle: document.getElementById("mc-toggle-answer"),

  // Progress
  statTotal: document.getElementById("stat-total"),
  statDone: document.getElementById("stat-done"),
  statCorrect: document.getElementById("stat-correct"),
  statAcc: document.getElementById("stat-acc"),
  statStreak: document.getElementById("stat-streak"),
  progressFill: document.getElementById("progress-fill"),
};

let state = {
  unitsSelected: new Set(),
  mode: "mc",           // "mc" | "fitb"
  mcAnswer: "term",     // "term" | "definition" (for Multiple Choice)
  fitbAnswer: "term",   // NEW: "term" | "definition" (for Fill-in)
  deck: [],
  index: 0,
  flipped: false,
  stats: { total: 0, done: 0, correct: 0, streak: 0 },
  answers: {},
  active: false,
};

// ---------- INIT ----------
init();

function init() {
  hydrateUnits();
  hookControls();
  loadSavedProgress();
  updateProgressUI();
  showEmptyState();
}

// Build unit chips
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

  els.startBtn.addEventListener("click", startSession);
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

  // Answer-with toggle (works for BOTH MC and FITB now)
  if (els.mcAnswerToggle) {
    els.mcAnswerToggle.addEventListener("click", () => {
      if (state.mode === "mc") {
        state.mcAnswer = state.mcAnswer === "term" ? "definition" : "term";
      } else {
        state.fitbAnswer = state.fitbAnswer === "term" ? "definition" : "term";
      }
      updateAnswerToggleLabel();
      renderCard(); // rebuild face & options / placeholder
    });
  }
}

function startSession() {
  const units = Array.from(state.unitsSelected);
  if (!units.length) {
    toast("Select at least one unit.");
    return;
  }
  buildDeck(units);
  if (els.shuffle.checked) shuffle(state.deck);
  state.index = 0;
  state.flipped = false;
  state.active = true;

  document.querySelectorAll('input[name="mode"]').forEach(r => r.disabled = true);
  els.endBtn.hidden = false;

  els.stage.hidden = false;
  els.empty.hidden = true;

  renderCard();
  renderAnswerArea();
  updateCrumbs();
}

function endSession() {
  state.active = false;
  els.stage.hidden = true;
  els.empty.hidden = false;
  els.endBtn.hidden = true;

  document.querySelectorAll('input[name="mode"]').forEach(r => r.disabled = false);
}

function restartDeck() {
  if (els.shuffle.checked) shuffle(state.deck);
  state.index = 0;
  state.flipped = false;
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

  // Decide which side is front based on mode + answer target
  const showDefFirst =
    (state.mode === "fitb"  && state.fitbAnswer === "term") ||
    (state.mode === "mc"    && state.mcAnswer   === "term");

  state.flipped = false;
  els.termSide.classList.toggle("is-front", !showDefFirst);
  els.defSide.classList.toggle("is-front",  showDefFirst);

  els.feedback.hidden = true;
  els.feedback.textContent = "";

  if (state.mode === "mc") buildMCOptions(card);
  if (state.mode === "fitb") {
    els.fitbInput.value = "";
    els.fitbInput.placeholder = state.fitbAnswer === "term" ? "Type the term…" : "Type the definition…";
    els.fitbInput.focus();
  }
}

function renderAnswerArea() {
  const isMC = state.mode === "mc";
  els.mcArea.hidden = !isMC;
  els.fitbForm.hidden = isMC;

  // Show the same toggle button in both modes with the correct label
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
}

function flipCard() {
  state.flipped = !state.flipped;
  els.termSide.classList.toggle("is-front", !state.flipped);
  els.defSide.classList.toggle("is-front", state.flipped);
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
}

function handleMCClick(value) {
  const card = currentCard();
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
  const val = (els.fitbInput.value || "").trim();
  if (!val) return;

  const target = state.fitbAnswer === "term" ? card.term : card.definition;

  const normalize = (s) => els.caseInsensitive.checked ? s.toLowerCase() : s;
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

// ---------- small helpers ----------
function updateAnswerToggleLabel() {
  if (!els.mcAnswerToggle) return;

  // Label reflects the *current* answer target in the current mode
  // - If the user is answering with "term", the card shows the definition
  // - If answering with "definition", the card shows the term
  const answerTarget = (state.mode === "mc") ? state.mcAnswer : state.fitbAnswer;
  els.mcAnswerToggle.textContent =
    answerTarget === "term" ? "Answer with Term" : "Answer with Definition";
}

// ---------- hydration fallbacks ----------
function loadSavedProgress() { /* no-op here */ }
function showEmptyState() {
  els.stage.hidden = true;
  els.empty.hidden = false;
}
