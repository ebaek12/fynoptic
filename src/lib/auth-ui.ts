// Port of the auth-overhaul branch's injectAuthModals()/initAuthUI() from
// js/app.js. This is now the single source of truth for the three auth
// modals — they used to be copy-pasted into eight HTML files and missing
// entirely from articles.html, so sign-in was unreachable from that page.
// `novalidate` is deliberate: the inline role=alert errors replace the
// browser's validation bubbles.

import { errorMessage, loginWithEmail, loginWithGoogle, resetPassword, signUpWithEmail } from './auth';
import { closeModal } from './modal';
import { showToast } from './toast';
import { track } from './track';

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
      <p>Enter your email and we'll send you a link to choose a new password.</p>
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

function injectAuthModals(): void {
  if (document.getElementById('login-modal')) return;
  const holder = document.createElement('div');
  holder.innerHTML = AUTH_MODAL_MARKUP;
  while (holder.firstElementChild) document.body.appendChild(holder.firstElementChild);
}

// Run fn once auth.ts has fired 'auth-ready'. auth.ts assigns its exports
// synchronously at module load, but the persistence/redirect setup that
// gates 'auth-ready' is async — this bounds the wait so a stalled Firebase
// load can't leave every auth control a silent no-op.
const AUTH_READY_TIMEOUT_MS = 8000;
const AUTH_UNAVAILABLE_MESSAGE = 'Sign-in is unavailable right now. Please reload the page.';
let authReady = false;
window.addEventListener('auth-ready', () => {
  authReady = true;
});

function onAuthReady(fn: () => void, onUnavailable?: () => void): void {
  if (authReady) {
    fn();
    return;
  }
  let settled = false;
  const onReady = (): void => {
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

// Inline, screen-reader-announced errors. Raw Firebase strings must never
// reach a user, so every caller runs the error through errorMessage() first.
// Unhide BEFORE writing the text: a live-region mutation on a display:none
// node is generally not announced, and the later attribute change is not a
// text insertion.
function setFormError(el: Element | null | undefined, message: string): void {
  if (!(el instanceof HTMLElement)) return;
  el.hidden = !message;
  el.textContent = message || '';
}

// Hold the submit button for the duration of the request; double-clicking
// used to fire two sign-ins.
async function withSubmitLock(
  btn: HTMLButtonElement | null,
  busyLabel: string,
  task: () => Promise<void>,
): Promise<void> {
  if (btn?.disabled) return; // a request is already in flight
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

function $<T extends Element = Element>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

export function initAuthUI(): void {
  injectAuthModals(); // must run before any form querySelector below

  const loginForm = $<HTMLFormElement>('#login-form');
  const signupForm = $<HTMLFormElement>('#signup-form');
  const resetForm = $<HTMLFormElement>('#reset-form');

  const googleLoginBtn = $<HTMLButtonElement>('#google-login');
  const googleSignupBtn = $<HTMLButtonElement>('#google-signup');

  // guard against duplicate bindings that can cause double popups/argument-error
  function armOnce(btn: HTMLButtonElement | null, handler: (e: MouseEvent) => void): void {
    if (!btn || btn.dataset.armed) return;
    btn.dataset.armed = '1';
    btn.addEventListener('click', handler);
  }

  // Google Sign-In (both modals). The handler is shared, so lock whichever
  // button was clicked — without it a double-click rejects the live popup
  // with auth/cancelled-popup-request.
  const handleGoogle = (e: MouseEvent): void => {
    const btn = e.currentTarget as HTMLButtonElement;
    onAuthReady(() =>
      withSubmitLock(btn, 'Opening Google…', async () => {
        const modal = document.querySelector<HTMLElement>('.modal:not([hidden])');
        try {
          await loginWithGoogle();
          if (modal) closeModal(modal);
        } catch (err) {
          const message = errorMessage(err);
          setFormError(modal?.querySelector('.form-error'), message);
          showToast(message);
        }
      }),
    );
  };

  armOnce(googleLoginBtn, handleGoogle);
  armOnce(googleSignupBtn, handleGoogle);

  // Email/Password Login
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = $('#login-error');
    const email = $<HTMLInputElement>('#login-email')?.value.trim();
    const password = $<HTMLInputElement>('#login-password')?.value || '';

    setFormError(errorEl, '');
    if (!email || !password) {
      setFormError(errorEl, 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setFormError(errorEl, 'Password must be at least 6 characters.');
      return;
    }

    onAuthReady(
      () =>
        withSubmitLock($<HTMLButtonElement>('#login-submit'), 'Signing in…', async () => {
          try {
            await loginWithEmail(email, password);
            closeModal('login-modal');
            showToast('Signed in!');
            track('login_success', { method: 'email' });
          } catch (err) {
            const message = errorMessage(err);
            setFormError(errorEl, message);
            showToast(message);
          }
        }),
      () => setFormError(errorEl, AUTH_UNAVAILABLE_MESSAGE),
    );
  });

  // Email/Password Sign-Up
  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = $('#signup-error');
    const email = $<HTMLInputElement>('#signup-email')?.value.trim();
    const password = $<HTMLInputElement>('#signup-password')?.value || '';
    const confirm = $<HTMLInputElement>('#signup-confirm')?.value || '';

    setFormError(errorEl, '');
    if (!email || !password || !confirm) {
      setFormError(errorEl, 'Please fill in every field.');
      return;
    }
    if (password.length < 6) {
      setFormError(errorEl, 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setFormError(errorEl, 'Passwords do not match.');
      return;
    }

    onAuthReady(
      () =>
        withSubmitLock($<HTMLButtonElement>('#signup-submit'), 'Creating account…', async () => {
          try {
            await signUpWithEmail(email, password);
            closeModal('signup-modal');
            showToast('Account created!');
            track('signup_success', { method: 'email' });
          } catch (err) {
            const message = errorMessage(err);
            setFormError(errorEl, message);
            showToast(message);
          }
        }),
      () => setFormError(errorEl, AUTH_UNAVAILABLE_MESSAGE),
    );
  });

  // Password reset
  resetForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = $('#reset-error');
    const email = $<HTMLInputElement>('#reset-email')?.value.trim();

    setFormError(errorEl, '');
    if (!email) {
      setFormError(errorEl, 'Please enter your email.');
      return;
    }

    onAuthReady(
      () =>
        withSubmitLock($<HTMLButtonElement>('#reset-submit'), 'Sending…', async () => {
          try {
            await resetPassword(email);
          } catch (err) {
            // A missing account reports success too — confirming it exists
            // would leak who has signed up here (account enumeration).
            if (!(err instanceof Error) || (err as { code?: string }).code !== 'auth/user-not-found') {
              const message = errorMessage(err);
              setFormError(errorEl, message);
              showToast(message);
              return;
            }
          }
          closeModal('reset-modal');
          showToast('Password reset link sent. Check your inbox.');
          track('password_reset_sent');
        }),
      () => setFormError(errorEl, AUTH_UNAVAILABLE_MESSAGE),
    );
  });
}
