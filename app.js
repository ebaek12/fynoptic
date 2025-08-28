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
    initToasts();
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
    const container = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
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
  // --------- USER LOGIN ---------

const USER_KEY = 'ff_user';

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  renderUserState();
});

function initLogin() {
  const form = document.getElementById('login-form');
  const googleBtn = document.getElementById('google-login');

  if (!form || !googleBtn) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!validateEmail(email)) {
      showToast('Please enter a valid email.');
      return;
    }
    if (password.length < 4) {
      showToast('Password must be at least 4 characters.');
      return;
    }

    const user = { email };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    closeModal('login-modal');
    renderUserState();
    ffTrack('login_success', { method: 'email' });
    showToast(`Welcome, ${email.split('@')[0]}!`);
  });

  googleBtn.addEventListener('click', () => {
    const user = { email: 'user@gmail.com' }; // Mock
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    closeModal('login-modal');
    renderUserState();
    ffTrack('login_success', { method: 'google' });
    showToast('Signed in with Google (mock)');
  });
}

function renderUserState() {
  const userBtn = document.getElementById('user-btn');
  const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');

  if (user && user.email && userBtn) {
    const initials = getInitials(user.email);
    userBtn.innerHTML = `<div class="user-initials" title="${user.email}">${initials}</div>`;
    userBtn.removeAttribute('data-modal-open');
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getInitials(email) {
  const name = email.split('@')[0];
  const parts = name.split(/[.\-_]/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
}
// --------- AUTH MODAL SWITCHING & SUBMIT ---------

document.addEventListener('DOMContentLoaded', () => {
    initAuthModals();
  });
  
  function initAuthModals() {
    document.querySelectorAll('[data-modal-switch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-modal-switch');
        document.querySelectorAll('.modal').forEach(m => m.setAttribute('hidden', ''));
        openModal(targetId);
      });
    });
  
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
  
    if (loginForm) {
      loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = loginForm['login-email'].value.trim();
        const password = loginForm['login-password'].value.trim();
  
        try {
          await authUI.loginWithEmail(email, password);
          closeModal('login-modal');
          showToast('Signed in!');
          ffTrack('login_success', { method: 'email' });
        } catch (err) {
          showToast(err.message || 'Login failed.');
        }
      });
    }
  
    if (signupForm) {
      signupForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = signupForm['signup-email'].value.trim();
        const password = signupForm['signup-password'].value.trim();
        const confirm = signupForm['signup-confirm'].value.trim();
  
        if (password !== confirm) {
          showToast('Passwords do not match.');
          return;
        }
  
        try {
          await authUI.signUpWithEmail(email, password);
          closeModal('signup-modal');
          showToast('Account created!');
          ffTrack('signup_success', { method: 'email' });
        } catch (err) {
          showToast(err.message || 'Signup failed.');
        }
      });
    }
  
    const googleLogin = document.getElementById('google-login');
    const googleSignup = document.getElementById('google-signup');
  
    [googleLogin, googleSignup].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        authUI.loginWithGoogle();
      });
    });
  }
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

const $ = (sel) => document.querySelector(sel);

// --- Small helpers ---
function showToast(msg) {
  const container = document.querySelector('.toast-container');
  if (!container) { alert(msg); return; }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.removeAttribute('hidden');
  // focus the first control
  const focusable = m.querySelector('input,button,select,textarea,[tabindex]');
  focusable?.focus();
}

function closeModal(id) {
  document.getElementById(id)?.setAttribute('hidden', '');
}

// click outside dialog closes the modal
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
  const modal = e.target.closest('.modal');
  if (modal && !e.target.closest('.dialog')) {
    // clicked the modal backdrop
    closeModal(modal.id);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => m.setAttribute('hidden',''));
  }
});

// Wait for auth.js to finish
function onAuthReady(fn) {
  if (window.authUI) return fn();
  window.addEventListener('auth-ready', fn, { once: true });
}

// --- Wire up Auth UI once DOM is ready ---
document.addEventListener('DOMContentLoaded', () => {
  const loginForm  = $('#login-form');
  const signupForm = $('#signup-form');

  const googleLoginBtn  = $('#google-login');
  const googleSignupBtn = $('#google-signup');

  // Google Sign-In (both modals)
  const handleGoogle = () => onAuthReady(async () => {
    try {
      await window.authUI.loginWithGoogle();
      closeModal('login-modal');
      closeModal('signup-modal');
    } catch (err) {
      showToast(err.message || 'Google sign-in failed');
    }
  });

  googleLoginBtn?.addEventListener('click', handleGoogle);
  googleSignupBtn?.addEventListener('click', handleGoogle);

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
      } catch (err) {
        showToast(err.message || 'Sign-up failed');
      }
    });
  });
});
// app.js
let googleInFlight = false;

function wire(btn) {
  if (!btn || btn.dataset.armed) return; // avoid double-listening
  btn.dataset.armed = "1";
  btn.addEventListener('click', () => {
    if (googleInFlight) return;          // prevent concurrent popups
    googleInFlight = true;
    btn.disabled = true;

    const run = async () => {
      await window.authUI.loginWithGoogle();
      // close whichever modal is open
      document.getElementById('login-modal')?.setAttribute('hidden','');
      document.getElementById('signup-modal')?.setAttribute('hidden','');
    };

    run().catch(err => {
      // Friendly messages for common popup issues
      if (err?.code === 'auth/popup-blocked') {
        alert('Popup was blocked. Allow popups for this site.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        // user closed it — optional toast
      } else if (err?.code !== 'auth/cancelled-popup-request') {
        alert(err.message || 'Google sign-in failed');
      }
    }).finally(() => {
      googleInFlight = false;
      btn.disabled = false;
    });
  });
}

window.addEventListener('auth-ready', () => {
  wire(document.getElementById('google-login'));
  wire(document.getElementById('google-signup'));
}, { once: true });
// Mobile "waffle" nav
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
