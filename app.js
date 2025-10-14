/* ------------------------------
   FinanceFirst - app.js
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
  initModals();
  initMobileNav();
  initProgress();
  initToasts(); // <-- ensure function exists
  initFixitBot();
  initSearchFilter();
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

function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(trigger => {
    const modalId = trigger.getAttribute('data-modal-open');
    trigger.addEventListener('click', () => openModal(modalId));
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal.id);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal(modal.id);
    });
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.removeAttribute('hidden');
    trapFocus(modal);
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.setAttribute('hidden', '');
  }
}

function trapFocus(modal) {
  const focusable = modal.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  first.focus();
}

// --------- Mobile Nav ---------

function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobile-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      menu.hidden = expanded;
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
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
  let start = 0;
  const stepTime = Math.abs(Math.floor(duration / target));
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

document.addEventListener('DOMContentLoaded', () => {
  const counters = document.querySelectorAll('.count');
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    animateCount(counter, target);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});

// app.js (use as a module)

// Keep $, onAuthReady, and global click handlers; remove duplicate modal helpers
const $ = (sel) => document.querySelector(sel);

// Wait for auth.js to finish
function onAuthReady(fn) {
  if (window.authUI) return fn();
  window.addEventListener('auth-ready', fn, { once: true });
}

// Global handlers for [data-modal-open] and [data-modal-switch]
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-modal-open]');
  if (trigger) {
    e.preventDefault();
    openModal(trigger.getAttribute('data-modal-open'));
    return;
  }
  const switcher = e.target.closest('[data-modal-switch]');
  if (switcher) {
    const to = switcher.getAttribute('data-modal-switch');
    document.querySelectorAll('.modal').forEach(m => m.setAttribute('hidden',''));
    openModal(to);
    return;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => m.setAttribute('hidden',''));
  }
});

// --- Wire up Auth UI once DOM is ready ---
document.addEventListener('DOMContentLoaded', () => {
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
});

// ======= REMOVED: googleInFlight/wire() duplicate Google wiring =======

// Mobile "waffle" nav (kept as-is)
(() => {
  const btn  = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');

  if (!btn || !menu) return;

  const openMenu = () => {
    btn.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    document.body.classList.add('no-scroll');
    // move focus to the first link for a11y
    const firstLink = menu.querySelector('a, button');
    firstLink && firstLink.focus();
  };

  const closeMenu = () => {
    btn.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    document.body.classList.remove('no-scroll');
    btn.focus();
  };

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });

  // close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) closeMenu();
  });

  // close when a menu link is clicked
  menu.addEventListener('click', (e) => {
    const el = e.target;
    if (el.matches('a[href], button')) closeMenu();
  });
})();
// === Mobile nav toggle (accessibility + iOS scroll lock) =================
const toggle = document.getElementById('nav-toggle');
const drawer = document.getElementById('mobile-menu');

let _scrollY = 0;

function openMenu() {
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
    if (e.key === 'Escape') closeMenu();
  });
}
// ========================================================================
// ======= Modal helpers (Sign In / Sign Up) ==============================
(function () {
  const BODY = document.body;
  let scrollY = 0;

  function lockBody() {
    scrollY = window.scrollY || 0;
    BODY.classList.add('no-scroll');
    BODY.style.position = 'fixed';
    BODY.style.top = `-${scrollY}px`;
    BODY.style.width = '100%';
  }
  function unlockBody() {
    BODY.classList.remove('no-scroll');
    BODY.style.position = '';
    BODY.style.top = '';
    BODY.style.width = '';
    window.scrollTo(0, scrollY);
  }

  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    lockBody();

    // focus first focusable control
    const focusable = modal.querySelector('input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
    (focusable || modal).focus?.();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    unlockBody();
  }

  // open buttons: [data-modal-open="login-modal"]
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-modal-open');
      const modal = document.getElementById(id);
      openModal(modal);
    });
  });

  // close buttons: [data-modal-close]
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
  });

  // switch between modals: [data-modal-switch="signup-modal"]
  document.querySelectorAll('[data-modal-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.getAttribute('data-modal-switch'));
      const current = btn.closest('.modal');
      current && (current.hidden = true);
      openModal(target);
    });
  });

  // click outside dialog closes
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // ESC closes whichever modal is open
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const open = document.querySelector('.modal:not([hidden])');
      if (open) closeModal(open);
    }
  });

  // Hook up the mobile menu "X" to re-use the same close
  const menu = document.getElementById('mobile-menu');
  const menuClose = menu?.querySelector('.menu-close');
  if (menuClose) {
    menuClose.addEventListener('click', () => {
      // use the existing nav code’s close function if present
      if (typeof closeMenu === 'function') closeMenu();
      else menu.hidden = true, unlockBody();
    });
  }
})();
/* ===== Theme toggle (persisted) ===== */
/* ===== Theme toggle (robust + persisted) ===== */
(() => {
  const STORAGE_KEY = 'fynoptic-theme';
  const btn = document.getElementById('theme-btn');
  const roots = [document.documentElement, document.body]; // set on both, to be safe

  // preferred theme
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  const initial = stored || (prefersLight ? 'light' : 'dark');

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
