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

function openModal(target) {
  const modal = resolveModal(target);
  if (!modal) return;
  modal.hidden = false;
  lockBody();
  trapFocus(modal);
}

function closeModal(target) {
  const modal = resolveModal(target);
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  unlockBody();
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

// Wait for auth.js to finish
function onAuthReady(fn) {
  if (window.authUI) return fn();
  window.addEventListener('auth-ready', fn, { once: true });
}

// Global handlers for [data-modal-open], [data-modal-close], [data-modal-switch]
// and click-outside. Delegated so dynamically added nodes work too.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-modal-open]');
  if (trigger) {
    e.preventDefault();
    openModal(trigger.getAttribute('data-modal-open'));
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
    if (current) current.hidden = true;
    openModal(switcher.getAttribute('data-modal-switch'));
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

// --- Wire up Auth UI once DOM is ready (called from the init block above) ---
function initAuthUI() {
  const loginForm  = $('#login-form');
  const signupForm = $('#signup-form');

  const googleLoginBtn  = $('#google-login');
  const googleSignupBtn = $('#google-signup');

  // *** FIX: guard against duplicate bindings that can cause double popups/argument-error ***
  function armOnce(btn, handler) {
    if (!btn || btn.dataset.armed) return;
    btn.dataset.armed = '1';
    btn.addEventListener('click', handler);
  }

  // Google Sign-In (both modals)
  const handleGoogle = () => onAuthReady(async () => {
    try {
      await window.authUI.loginWithGoogle();
      // If popup path: signed in now; redirect path: will come back signed in
      closeModal('login-modal');
      closeModal('signup-modal');
    } catch (err) {
      showToast(err.message || 'Google sign-in failed');
    }
  });

  armOnce(googleLoginBtn, handleGoogle);   // <-- use guarded binder
  armOnce(googleSignupBtn, handleGoogle);  // <-- use guarded binder

  // Email/Password Login
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#login-email')?.value.trim();
    const password = $('#login-password')?.value;
    if (!email || !password) return;

    onAuthReady(async () => {
      try {
        await window.authUI.loginWithEmail(email, password);
        closeModal('login-modal');
        showToast('Signed in!');
        ffTrack('login_success', { method: 'email' });
      } catch (err) {
        showToast(err.message || 'Sign-in failed');
      }
    });
  });

  // Email/Password Sign-Up
  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#signup-email')?.value.trim();
    const password = $('#signup-password')?.value;
    const confirm = $('#signup-confirm')?.value;
    if (!email || !password) return;
    if (password !== confirm) return showToast('Passwords do not match.');

    onAuthReady(async () => {
      try {
        await window.authUI.signUpWithEmail(email, password);
        closeModal('signup-modal');
        showToast('Account created!');
        ffTrack('signup_success', { method: 'email' });
      } catch (err) {
        showToast(err.message || 'Sign-up failed');
      }
    });
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
