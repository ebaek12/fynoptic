/* ------------------------------
   Fynoptic - app.js
   Interactivity, storage, modals, filters
------------------------------ */

// Constants
const COURSE_MODULES = [
  { id: 'junk-fees', title: 'Junk fees & drip pricing', minutes: 8 },
  { id: 'subs-cancel', title: 'Subscription traps & cancellation', minutes: 9 },
  { id: 'bnpl', title: 'BNPL pitfalls', minutes: 7 },
  { id: 'chargebacks', title: 'Chargebacks & dispute rights', minutes: 10 },
  { id: 'arbitration', title: 'Arbitration clauses & your options', minutes: 6 },
  { id: 'debt-rights', title: 'Debt collection & your rights', minutes: 8 }
];

const ARTICLES = [
  { id: 'subs-checklist', title: 'The Subscription Cancel Checklist', tags: ['Subscriptions'], blurb: 'A quick path to “I’m out.”' },
  { id: 'chargeback', title: 'How to Win a Chargeback', tags: ['Disputes'], blurb: 'Dispute like you mean it.' },
  { id: 'junk-fees-guide', title: 'Junk Fees: What’s Illegal vs. Annoying', tags: ['Fees'], blurb: 'Know when to push back.' },
  { id: 'bnpl-impact', title: 'BNPL: Late Fees & Credit Impact', tags: ['BNPL'], blurb: 'What to watch before you tap.' },
  { id: 'dark-patterns', title: 'Dark Patterns to Watch For', tags: ['Privacy'], blurb: 'UI tricks that drain money.' },
  { id: 'gym-contracts', title: 'Gym & Fitness Contracts', tags: ['Subscriptions'], blurb: 'Stop the eternal membership.' },
  { id: 'air-travel-fees', title: 'Airline & Hotel Add-on Fees', tags: ['Fees'], blurb: 'Resort, seat, and carry-on fees decoded.' },
  { id: 'debt-validation', title: 'Debt Collection: Your Validation Rights', tags: ['Disputes'], blurb: 'Make them prove it.' }
];

// LocalStorage Keys
const PROGRESS_KEY = 'ff_course_progress';
const FIXIT_HISTORY_KEY = 'ff_fixit_history';
const REPORTS_KEY = 'ff_reports';

// Init on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  initProgress();
  initToasts(); // <-- ensure function exists
  initFixitBot();
  initSearchFilter();
  initCounters();
  initAuthUI();
});

// --------- Utility Functions ---------

function ffTrack(eventName, payload = {}) {
  console.log('[ffTrack]', eventName, payload);
}

function setFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function showToast(message, variant = 'info') {
  const container = document.querySelector('.toast-container') || (() => {
    // Fallback container if none present
    const c = document.createElement('div');
    c.className = 'toast-container';
    c.setAttribute('aria-live','polite');
    c.setAttribute('aria-atomic','true');
    document.body.appendChild(c);
    return c;
  })();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// *** FIX: define initToasts so the earlier call doesn't throw ReferenceError ***
function initToasts() {
  if (!document.querySelector('.toast-container')) {
    const c = document.createElement('div');
    c.className = 'toast-container';
    c.setAttribute('aria-live','polite');
    c.setAttribute('aria-atomic','true');
    document.body.appendChild(c);
  }
}

// --------- Course Progress ---------

function initProgress() {
  const completed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
  updateProgressBar(completed.length);

  // Example: attach click handler to "Start module" buttons
  COURSE_MODULES.forEach(mod => {
    const btn = document.querySelector(`[data-module-id="${mod.id}"]`);
    if (btn) {
      btn.addEventListener('click', () => {
        if (!completed.includes(mod.id)) {
          completed.push(mod.id);
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(completed));
          updateProgressBar(completed.length);
          ffTrack('module_complete', { module: mod.id });
        }
      });
    }
  });
}

function updateProgressBar(count) {
  const percent = Math.min(count / COURSE_MODULES.length, 1);
  const bar = document.getElementById('progress-bar');
  if (bar) {
    bar.style.width = `${percent * 100}%`;
  }
}

// --------- Modals ---------

const MODAL_FOCUSABLE = 'a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

let modalScrollY = 0;

function lockBody() {
  if (document.body.classList.contains('no-scroll')) return;
  modalScrollY = window.scrollY || 0;
  document.body.classList.add('no-scroll');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${modalScrollY}px`;
  document.body.style.width = '100%';
}

function unlockBody() {
  if (!document.body.classList.contains('no-scroll')) return;
  document.body.classList.remove('no-scroll');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, modalScrollY);
}

// Accepts a modal id (auth wiring passes strings) or the modal element itself
function resolveModal(target) {
  return typeof target === 'string' ? document.getElementById(target) : target;
}

// Remember which control opened each modal so closing it can hand focus back;
// keyboard users used to get dumped at the top of the document.
const modalOpeners = new WeakMap();

// Stale validation/auth errors must never survive an open, close or switch.
function clearFormErrors(modal) {
  modal.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.hidden = true;
  });
}

function openModal(target, opener) {
  const modal = resolveModal(target);
  if (!modal) return;
  if (opener) modalOpeners.set(modal, opener);
  clearFormErrors(modal);
  modal.hidden = false;
  lockBody();
  trapFocus(modal);
}

function closeModal(target) {
  const modal = resolveModal(target);
  if (!modal || modal.hidden) return;
  clearFormErrors(modal);
  modal.hidden = true;
  unlockBody();
  const opener = modalOpeners.get(modal);
  modalOpeners.delete(modal);
  if (opener && document.contains(opener)) opener.focus();
}

function trapFocus(modal) {
  // bind the Tab handler once per modal so repeated opens don't stack listeners
  if (!modal.dataset.focusTrapped) {
    modal.dataset.focusTrapped = '1';
    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll(MODAL_FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
  const first = modal.querySelector(MODAL_FOCUSABLE);
  if (first) first.focus();
}

// --------- Fix-it Bot ---------

const FIXIT_KEYWORDS = {
  'cancel|subscription|gym|membership': 'subs-checklist',
  'chargeback|dispute|refund|card': 'chargeback',
  'bnpl|afterpay|klarna|affirm': 'bnpl-impact',
  'junk fee|resort fee|add-on|drip': 'junk-fees-guide',
  'debt|collector|harass': 'debt-validation'
};

function initFixitBot() {
  const input = document.querySelector('#fixit-input');
  const sendBtn = document.querySelector('#fixit-send');

  if (input && sendBtn) {
    sendBtn.addEventListener('click', () => {
      const query = input.value.trim();
      if (query) {
        const resultId = mapQueryToArticle(query);
        if (resultId) {
          ffTrack('fixit_query', { query });
          updateFixitHistory(query);
          renderFixitResponse(resultId);
        } else {
          showToast('Sorry, no suggestions found.');
        }
      }
    });
  }
}

function mapQueryToArticle(query) {
  const lower = query.toLowerCase();
  for (let pattern in FIXIT_KEYWORDS) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lower)) return FIXIT_KEYWORDS[pattern];
  }
  return null;
}

function updateFixitHistory(query) {
  const existing = JSON.parse(localStorage.getItem(FIXIT_HISTORY_KEY) || '[]');
  const updated = [query, ...existing.filter(q => q !== query)].slice(0, 5);
  localStorage.setItem(FIXIT_HISTORY_KEY, JSON.stringify(updated));
  // Optionally: re-render history chips
}

function renderFixitResponse(articleId) {
  const article = ARTICLES.find(a => a.id === articleId);
  if (article) {
    showToast(`Here’s what we found: ${article.title}`);
    // Optionally: dynamically update Fix-it modal with content
  }
}

// --------- Search & Filters ---------

let searchTimeout;
function initSearchFilter() {
  const input = document.querySelector('#search-input');
  const cardsContainer = document.querySelector('#articles-list');

  if (!input || !cardsContainer) return;

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const term = input.value.toLowerCase();
      const results = ARTICLES.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.blurb.toLowerCase().includes(term) ||
        a.tags.some(tag => tag.toLowerCase().includes(term))
      );

      cardsContainer.innerHTML = results.length
        ? results.map(renderArticleCard).join('')
        : '<p>No articles found.</p>';
    }, 250);
  });
}

function renderArticleCard(article) {
  return `
    <div class="card" tabindex="0" data-article-id="${article.id}">
      <h3>${article.title}</h3>
      <p>${article.blurb}</p>
      <button class="btn btn-ghost" aria-label="Read guide for ${article.title}">Read guide</button>
    </div>
  `;
}

// ======= REMOVED: Mock localStorage "USER LOGIN" block (conflicted with Firebase) =======

// ======= REMOVED: initAuthModals() block that duplicated auth wiring =======

// IntersectionObserver for fade-up
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// HERO METRICS COUNT-UP
function animateCount(el, target, duration = 1500) {
  // a missing/blank data-target gives NaN, which would recurse forever
  if (!Number.isFinite(target) || target <= 0) return;
  let start = 0;
  const update = () => {
    start += Math.ceil(target / (duration / 16));
    if (start >= target) {
      el.textContent = target.toLocaleString();
    } else {
      el.textContent = start.toLocaleString();
      requestAnimationFrame(update);
    }
  };
  update();
}

function initCounters() {
  const counters = document.querySelectorAll('.count');
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    animateCount(counter, target);
  });
}

// app.js (use as a module)

// Keep $, onAuthReady, and global click handlers; remove duplicate modal helpers
const $ = (sel) => document.querySelector(sel);

// Run fn once window.authUI exists. auth.js is a deferred module that assigns
// window.authUI synchronously, so in the happy path this resolves immediately. The
// bounded wait covers the failure path: if the Firebase CDN never loads, 'auth-ready'
// never fires, and without a timeout every auth control would be a silent no-op.
// onUnavailable runs instead in that case (default: a toast).
const AUTH_READY_TIMEOUT_MS = 8000;
const AUTH_UNAVAILABLE_MESSAGE = 'Sign-in is unavailable right now. Please reload the page.';

function onAuthReady(fn, onUnavailable) {
  if (window.authUI) return fn();
  let settled = false;
  const onReady = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    fn();
  };
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    window.removeEventListener('auth-ready', onReady);
    if (onUnavailable) onUnavailable();
    else showToast(AUTH_UNAVAILABLE_MESSAGE);
  }, AUTH_READY_TIMEOUT_MS);
  window.addEventListener('auth-ready', onReady, { once: true });
}

// Global handlers for [data-modal-open], [data-modal-close], [data-modal-switch]
// and click-outside. Delegated so dynamically added nodes work too.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-modal-open]');
  if (trigger) {
    e.preventDefault();
    openModal(trigger.getAttribute('data-modal-open'), trigger);
    return;
  }
  const closer = e.target.closest('[data-modal-close]');
  if (closer) {
    closeModal(closer.closest('.modal'));
    return;
  }
  const switcher = e.target.closest('[data-modal-switch]');
  if (switcher) {
    const current = switcher.closest('.modal');
    // carry the original opener across so closing the switched-to modal still restores focus
    let opener = null;
    if (current) {
      opener = modalOpeners.get(current);
      modalOpeners.delete(current);
      clearFormErrors(current);
      current.hidden = true;
    }
    openModal(switcher.getAttribute('data-modal-switch'), opener);
    return;
  }
  // click on the backdrop itself closes the modal
  if (e.target.classList.contains('modal')) closeModal(e.target);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = document.querySelector('.modal:not([hidden])');
  if (open) closeModal(open);
});

// --- Auth modal markup ---------------------------------------------------
// app.js is the single source of truth for these three modals. They used to be
// copy-pasted into eight HTML files and missing entirely from articles.html, so
// you could not sign in from that page. `novalidate` is deliberate: the inline
// role=alert errors below replace the browser's validation bubbles.
const AUTH_MODAL_MARKUP = `
  <div id="login-modal" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="login-title">
    <div class="dialog" role="document">
      <button class="modal-close" data-modal-close aria-label="Close">&times;</button>
      <h2 id="login-title">Sign in</h2>
      <form id="login-form" novalidate>
        <label for="login-email">Email</label>
        <input type="email" id="login-email" name="email" autocomplete="email" required />
        <label for="login-password">Password</label>
        <input type="password" id="login-password" name="password" autocomplete="current-password" required minlength="6" />
        <p id="login-error" class="form-error" role="alert" aria-live="assertive" hidden></p>
        <button type="submit" id="login-submit" class="btn btn-primary">Sign in</button>
        <div class="divider">or</div>
        <button type="button" id="google-login" class="btn btn-ghost">Continue with Google</button>
      </form>
      <p class="auth-link"><button data-modal-switch="reset-modal">Forgot your password?</button></p>
      <p class="auth-link">New user? <button data-modal-switch="signup-modal">Create an account</button></p>
    </div>
  </div>

  <div id="signup-modal" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="signup-title">
    <div class="dialog" role="document">
      <button class="modal-close" data-modal-close aria-label="Close">&times;</button>
      <h2 id="signup-title">Sign up</h2>
      <form id="signup-form" novalidate>
        <label for="signup-email">Email</label>
        <input type="email" id="signup-email" name="email" autocomplete="email" required />
        <label for="signup-password">Password</label>
        <input type="password" id="signup-password" name="password" autocomplete="new-password" required minlength="6" />
        <label for="signup-confirm">Confirm password</label>
        <input type="password" id="signup-confirm" name="confirm" autocomplete="new-password" required minlength="6" />
        <p id="signup-error" class="form-error" role="alert" aria-live="assertive" hidden></p>
        <button type="submit" id="signup-submit" class="btn btn-primary">Create account</button>
        <div class="divider">or</div>
        <button type="button" id="google-signup" class="btn btn-ghost">Continue with Google</button>
      </form>
      <p class="auth-link">Already have an account? <button data-modal-switch="login-modal">Sign in</button></p>
    </div>
  </div>

  <div id="reset-modal" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="reset-title">
    <div class="dialog" role="document">
      <button class="modal-close" data-modal-close aria-label="Close">&times;</button>
      <h2 id="reset-title">Reset password</h2>
      <p>Enter your email and we’ll send you a link to choose a new password.</p>
      <form id="reset-form" novalidate>
        <label for="reset-email">Email</label>
        <input type="email" id="reset-email" name="email" autocomplete="email" required />
        <p id="reset-error" class="form-error" role="alert" aria-live="assertive" hidden></p>
        <button type="submit" id="reset-submit" class="btn btn-primary">Send reset link</button>
      </form>
      <p class="auth-link"><button data-modal-switch="login-modal">Back to sign in</button></p>
    </div>
  </div>
`;

function injectAuthModals() {
  if (document.getElementById('login-modal')) return;
  const holder = document.createElement('div');
  holder.innerHTML = AUTH_MODAL_MARKUP;
  while (holder.firstElementChild) document.body.appendChild(holder.firstElementChild);
}

// Inline, screen-reader-announced errors. Raw Firebase strings like
// "Firebase: Error (auth/invalid-credential)." must never reach a user, so every
// caller runs the message through window.authUI.errorMessage() first.
// Unhide BEFORE writing the text: a live-region mutation on a display:none node is
// generally not announced, and the later attribute change is not a text insertion.
function setFormError(el, message) {
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || '';
}

// Hold the submit button for the duration of the request; double-clicking used to
// fire two sign-ins.
async function withSubmitLock(btn, busyLabel, task) {
  if (btn && btn.disabled) return; // a request is already in flight
  const label = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = busyLabel;
  }
  try {
    await task();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = label;
    }
  }
}

// --- Wire up Auth UI once DOM is ready (called from the init block above) ---
function initAuthUI() {
  injectAuthModals(); // must run before any form querySelector below

  const loginForm  = $('#login-form');
  const signupForm = $('#signup-form');
  const resetForm  = $('#reset-form');

  const googleLoginBtn  = $('#google-login');
  const googleSignupBtn = $('#google-signup');

  // *** FIX: guard against duplicate bindings that can cause double popups/argument-error ***
  function armOnce(btn, handler) {
    if (!btn || btn.dataset.armed) return;
    btn.dataset.armed = '1';
    btn.addEventListener('click', handler);
  }

  // Google Sign-In (both modals). The handler is shared, so lock whichever button
  // was clicked — without it a double-click rejects the live popup with
  // auth/cancelled-popup-request.
  const handleGoogle = (e) => {
    const btn = e.currentTarget;
    onAuthReady(() => withSubmitLock(btn, 'Opening Google…', async () => {
      const modal = document.querySelector('.modal:not([hidden])');
      try {
        await window.authUI.loginWithGoogle();
        // If popup path: signed in now; redirect path: will come back signed in
        if (modal) closeModal(modal);
      } catch (err) {
        const message = window.authUI.errorMessage(err);
        setFormError(modal?.querySelector('.form-error'), message);
        showToast(message);
      }
    }));
  };

  armOnce(googleLoginBtn, handleGoogle);   // <-- use guarded binder
  armOnce(googleSignupBtn, handleGoogle);  // <-- use guarded binder

  // Email/Password Login
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = $('#login-error');
    const email = $('#login-email')?.value.trim();
    const password = $('#login-password')?.value || '';

    setFormError(errorEl, '');
    if (!email || !password) return setFormError(errorEl, 'Please enter your email and password.');
    if (password.length < 6) return setFormError(errorEl, 'Password must be at least 6 characters.');

    onAuthReady(() => withSubmitLock($('#login-submit'), 'Signing in…', async () => {
      try {
        await window.authUI.loginWithEmail(email, password);
        closeModal('login-modal');
        showToast('Signed in!');
        ffTrack('login_success', { method: 'email' });
      } catch (err) {
        const message = window.authUI.errorMessage(err);
        setFormError(errorEl, message);
        showToast(message);
      }
    }), () => setFormError(errorEl, AUTH_UNAVAILABLE_MESSAGE));
  });

  // Email/Password Sign-Up
  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = $('#signup-error');
    const email = $('#signup-email')?.value.trim();
    const password = $('#signup-password')?.value || '';
    const confirm = $('#signup-confirm')?.value || '';

    setFormError(errorEl, '');
    if (!email || !password || !confirm) return setFormError(errorEl, 'Please fill in every field.');
    if (password.length < 6) return setFormError(errorEl, 'Password must be at least 6 characters.');
    if (password !== confirm) return setFormError(errorEl, 'Passwords do not match.');

    onAuthReady(() => withSubmitLock($('#signup-submit'), 'Creating account…', async () => {
      try {
        await window.authUI.signUpWithEmail(email, password);
        closeModal('signup-modal');
        showToast('Account created!');
        ffTrack('signup_success', { method: 'email' });
      } catch (err) {
        const message = window.authUI.errorMessage(err);
        setFormError(errorEl, message);
        showToast(message);
      }
    }), () => setFormError(errorEl, AUTH_UNAVAILABLE_MESSAGE));
  });

  // Password reset
  resetForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = $('#reset-error');
    const email = $('#reset-email')?.value.trim();

    setFormError(errorEl, '');
    if (!email) return setFormError(errorEl, 'Please enter your email.');

    onAuthReady(() => withSubmitLock($('#reset-submit'), 'Sending…', async () => {
      try {
        await window.authUI.resetPassword(email);
      } catch (err) {
        // A missing account reports success too — confirming it exists would leak
        // who has signed up here (account enumeration).
        if (err?.code !== 'auth/user-not-found') {
          const message = window.authUI.errorMessage(err);
          setFormError(errorEl, message);
          showToast(message);
          return;
        }
      }
      closeModal('reset-modal');
      showToast('Password reset link sent. Check your inbox.');
      ffTrack('password_reset_sent');
    }), () => setFormError(errorEl, AUTH_UNAVAILABLE_MESSAGE));
  });
}

// ======= REMOVED: googleInFlight/wire() duplicate Google wiring =======

// === Mobile nav toggle (accessibility + iOS scroll lock) =================
const toggle = document.getElementById('nav-toggle');
const drawer = document.getElementById('mobile-menu');

let _scrollY = 0;

function openMenu() {
  if (!toggle || !drawer) return;
  drawer.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');

  // lock body scroll in an iOS-safe way
  _scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.classList.add('no-scroll');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${_scrollY}px`;
  document.body.style.width = '100%';
}

function closeMenu() {
  if (!toggle || !drawer) return;
  drawer.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');

  document.body.classList.remove('no-scroll');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, _scrollY);
}

if (toggle && drawer) {
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  // close on any link tap inside drawer
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeMenu();
  });

  // close on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) closeMenu();
  });

  // the drawer's "X" re-uses the same close
  const menuClose = drawer.querySelector('.menu-close');
  if (menuClose) menuClose.addEventListener('click', closeMenu);
}
// ========================================================================
/* ===== Theme toggle (persisted) ===== */
/* ===== Theme toggle (robust + persisted) ===== */
(() => {
  const STORAGE_KEY = 'fynoptic-theme';
  const btn = document.getElementById('theme-btn');
  const roots = [document.documentElement, document.body]; // set on both, to be safe

  // Fynoptic is a dark-first brand: every page ships <body data-theme="dark">, the body
  // background is var(--brand-950), and theme-color is #0B1220. Following the OS here meant
  // every visitor on a light-mode machine landed on the light theme, which is only partly
  // built. Default to dark; light is opt-in via the toggle and remembered after that.
  const stored = localStorage.getItem(STORAGE_KEY);
  const initial = stored === 'light' || stored === 'dark' ? stored : 'dark';

  const applyTheme = (mode) => {
    roots.forEach(r => r.setAttribute('data-theme', mode));
    if (btn) {
      btn.textContent = mode === 'light' ? 'Dark' : 'Light';
      btn.setAttribute('aria-pressed', String(mode === 'light'));
      btn.title = `Toggle to ${mode === 'light' ? 'dark' : 'light'} mode`;
    }
  };

  applyTheme(initial);

  btn?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });
})();


/* ===== Flip / reveal buttons ===== */
(() => {
  const flips = document.querySelectorAll('.flip');
  flips.forEach(btn => {
    btn.addEventListener('click', () => {
      const pressed = btn.classList.toggle('is-flipped');
      btn.setAttribute('aria-pressed', String(pressed));
    });
  });
})();

/* ===== Pause ticker on hover (optional) ===== */
(() => {
  const track = document.getElementById('fact-track');
  if (!track) return;
  const pause = () => track.style.animationPlayState = 'paused';
  const play  = () => track.style.animationPlayState = 'running';
  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', play);
})();
// Stagger + reveal-in
(() => {
  const items = document.querySelectorAll('.founder-card, .partner-cell');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.45 });

  items.forEach((el, i) => {
    el.classList.add('reveal-in');
    el.style.transitionDelay = `${Math.min(i * 70, 280)}ms`;
    io.observe(el);
  });
})();

// Tasteful 3D tilt (desktop only, respects reduced motion)
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(pointer: coarse)').matches;

  if (prefersReduced || isTouch) return;

  const MAX_TILT = 8;      // degrees
  const MAX_Z = 14;        // px
  const cards = document.querySelectorAll('.founder-card');

  cards.forEach(card => {
    const portrait = card.querySelector('.portrait');

    function move(e) {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y / r.height) - 0.5) * -2; // -1..1
      const ry = ((x / r.width)  - 0.5) *  2; // -1..1

      card.style.transform =
        `perspective(900px) rotateX(${rx * MAX_TILT}deg) rotateY(${ry * MAX_TILT}deg) translateZ(${MAX_Z}px)`;
      if (portrait) portrait.style.filter = `saturate(${1 + Math.abs(ry)*0.12})`;
    }

    function reset() {
      card.style.transform = '';
      if (portrait) portrait.style.filter = '';
    }

    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', reset);
    card.addEventListener('blur', reset);
  });
})();
