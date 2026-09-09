import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type SubmitEvent,
} from "react";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { Modal, ModalClose } from "@/components/ui/Modal";
import { useAuthDialog } from "@/hooks/useAuthDialog";
import { closeAuthDialog, openAuthDialog } from "@/lib/auth-dialog";
import {
  ensureAuthReady,
  errorMessage,
  loginWithEmail,
  loginWithGoogle,
  resetPassword,
  signUpWithEmail,
} from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { track } from "@/lib/track";

const AUTH_READY_TIMEOUT_MS = 8000;
const AUTH_UNAVAILABLE_MESSAGE =
  "Sign-in is unavailable right now. Please reload the page.";

function waitForAuthReady(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(false);
    }, AUTH_READY_TIMEOUT_MS);
    ensureAuthReady()
      .then(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timer);
        settled = true;
        resolve(false);
      });
  });
}

type AuthTab = "login" | "signup";

function MailIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 5.5h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M2.5 6 10 11l7.5-5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="9"
        width="12"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function EyeIcon({ crossedOut }: { crossedOut: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle
        cx="10"
        cy="10"
        r="2.25"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {crossedOut && (
        <path
          d="M3 17 17 3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.86 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.55-1.84.86-3.06.86-2.36 0-4.36-1.6-5.08-3.75H.9v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.92 10.67A5.4 5.4 0 0 1 3.64 9c0-.58.1-1.15.28-1.67V4.99H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.01l3.02-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.99l3.02 2.34C4.64 5.18 6.64 3.58 9 3.58Z"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="15"
      height="15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 2 18 17H2L10 2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M10 8v3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14" r="0.9" fill="currentColor" />
    </svg>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!value) setVisible(false);
  }, [value]);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <LockIcon />
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={id}
          autoComplete={autoComplete}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="auth-toggle-visibility"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          <EyeIcon crossedOut={visible} />
        </button>
      </div>
    </div>
  );
}

function AuthModal({ open, tab }: { open: boolean; tab: AuthTab }) {
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const signupTabRef = useRef<HTMLButtonElement>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, runAuth] = useSubmitLock();
  const [pendingAction, setPendingAction] = useState("");
  const signingIn = busy && pendingAction === "login";
  const loginGoogleBusy = busy && pendingAction === "login-google";
  const creating = busy && pendingAction === "signup";
  const signupGoogleBusy = busy && pendingAction === "signup-google";

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupError, setSignupError] = useState("");

  useEffect(() => {
    setLoginError("");
    setSignupError("");
    setLoginPassword("");
    setSignupPassword("");
    setSignupConfirm("");
  }, [open, tab]);

  const handleLoginGoogle = (): Promise<void> =>
    runAuth(async () => {
      setPendingAction("login-google");
      const ready = await waitForAuthReady();
      if (!ready) {
        setLoginError(AUTH_UNAVAILABLE_MESSAGE);
        return;
      }
      try {
        await loginWithGoogle();
        closeAuthDialog();
      } catch (err) {
        const message = errorMessage(err);
        setLoginError(message);
        showToast(message);
      }
    });

  const handleSignupGoogle = (): Promise<void> =>
    runAuth(async () => {
      setPendingAction("signup-google");
      const ready = await waitForAuthReady();
      if (!ready) {
        setSignupError(AUTH_UNAVAILABLE_MESSAGE);
        return;
      }
      try {
        await loginWithGoogle();
        closeAuthDialog();
      } catch (err) {
        const message = errorMessage(err);
        setSignupError(message);
        showToast(message);
      }
    });

  const handleLoginSubmit = (e: SubmitEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setLoginError("");
    const trimmedEmail = loginEmail.trim();

    if (!trimmedEmail || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError("Password must be at least 6 characters.");
      return;
    }

    void runAuth(async () => {
      setPendingAction("login");
      const ready = await waitForAuthReady();
      if (!ready) {
        setLoginError(AUTH_UNAVAILABLE_MESSAGE);
        return;
      }
      try {
        await loginWithEmail(trimmedEmail, loginPassword);
        closeAuthDialog();
        showToast("Signed in!");
        track("login_success", { method: "email" });
      } catch (err) {
        const message = errorMessage(err);
        setLoginError(message);
        showToast(message);
      }
    });
  };

  const handleSignupSubmit = (e: SubmitEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setSignupError("");
    const trimmedEmail = signupEmail.trim();

    if (!trimmedEmail || !signupPassword || !signupConfirm) {
      setSignupError("Please fill in every field.");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match.");
      return;
    }

    void runAuth(async () => {
      setPendingAction("signup");
      const ready = await waitForAuthReady();
      if (!ready) {
        setSignupError(AUTH_UNAVAILABLE_MESSAGE);
        return;
      }
      try {
        await signUpWithEmail(trimmedEmail, signupPassword);
        closeAuthDialog();
        showToast("Account created!");
        track("signup_success", { method: "email" });
      } catch (err) {
        const message = errorMessage(err);
        setSignupError(message);
        showToast(message);
      }
    });
  };

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    if (busy) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next: AuthTab = tab === "login" ? "signup" : "login";
    openAuthDialog(next);
    (next === "login" ? loginTabRef : signupTabRef).current?.focus();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && closeAuthDialog()}
      title={tab === "login" ? "Sign in" : "Sign up"}
      hideTitle
      id="auth-modal"
    >
      <ModalClose />
      <header className="auth-head">
        <span className="auth-wordmark">Fynoptic</span>
        <h2 className="auth-title">
          {tab === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="auth-subtitle">
          {tab === "login"
            ? "Sign in to manage your profile and certificates."
            : "Your place to learn, practice, and build your skills."}
        </p>
      </header>

      <div role="tablist" className="auth-tabs" aria-label="Sign in or sign up">
        <button
          type="button"
          role="tab"
          disabled={busy}
          id="auth-tab-login"
          ref={loginTabRef}
          aria-selected={tab === "login"}
          aria-controls="auth-panel-login"
          tabIndex={tab === "login" ? 0 : -1}
          onClick={() => openAuthDialog("login")}
          onKeyDown={handleTabKeyDown}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          disabled={busy}
          id="auth-tab-signup"
          ref={signupTabRef}
          aria-selected={tab === "signup"}
          aria-controls="auth-panel-signup"
          tabIndex={tab === "signup" ? 0 : -1}
          onClick={() => openAuthDialog("signup")}
          onKeyDown={handleTabKeyDown}
        >
          Sign up
        </button>
      </div>

      <div
        role="tabpanel"
        id="auth-panel-login"
        aria-labelledby="auth-tab-login"
        hidden={tab !== "login"}
      >
        <button
          type="button"
          id="google-login"
          className="btn btn-ghost auth-google"
          disabled={busy}
          aria-busy={loginGoogleBusy || undefined}
          onClick={handleLoginGoogle}
        >
          <GoogleMark />
          {loginGoogleBusy ? "Opening Google…" : "Continue with Google"}
        </button>
        <div className="divider">or use your email</div>
        <form id="login-form" noValidate onSubmit={handleLoginSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <div className="auth-input-wrap">
              <MailIcon />
              <input
                type="email"
                id="login-email"
                name="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
          </div>
          <PasswordField
            id="login-password"
            label="Password"
            autoComplete="current-password"
            value={loginPassword}
            onChange={setLoginPassword}
          />
          <p
            id="login-error"
            className="form-error auth-error"
            role="alert"
            aria-live="assertive"
            hidden={!loginError}
          >
            <AlertIcon />
            <span>{loginError}</span>
          </p>
          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary auth-submit"
            disabled={busy}
            aria-busy={signingIn || undefined}
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-link">
          <button
            type="button"
            disabled={busy}
            onClick={() => openAuthDialog("reset")}
          >
            Forgot your password?
          </button>
        </p>
        <p className="auth-link">
          New user?{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => openAuthDialog("signup")}
          >
            Create an account
          </button>
        </p>
      </div>

      <div
        role="tabpanel"
        id="auth-panel-signup"
        aria-labelledby="auth-tab-signup"
        hidden={tab !== "signup"}
      >
        <button
          type="button"
          id="google-signup"
          className="btn btn-ghost auth-google"
          disabled={busy}
          aria-busy={signupGoogleBusy || undefined}
          onClick={handleSignupGoogle}
        >
          <GoogleMark />
          {signupGoogleBusy ? "Opening Google…" : "Continue with Google"}
        </button>
        <div className="divider">or use your email</div>
        <form id="signup-form" noValidate onSubmit={handleSignupSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <div className="auth-input-wrap">
              <MailIcon />
              <input
                type="email"
                id="signup-email"
                name="email"
                autoComplete="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
            </div>
          </div>
          <PasswordField
            id="signup-password"
            label="Password"
            autoComplete="new-password"
            value={signupPassword}
            onChange={setSignupPassword}
          />
          <PasswordField
            id="signup-confirm"
            label="Confirm password"
            autoComplete="new-password"
            value={signupConfirm}
            onChange={setSignupConfirm}
          />
          <p
            id="signup-error"
            className="form-error auth-error"
            role="alert"
            aria-live="assertive"
            hidden={!signupError}
          >
            <AlertIcon />
            <span>{signupError}</span>
          </p>
          <button
            type="submit"
            id="signup-submit"
            className="btn btn-primary auth-submit"
            disabled={busy}
            aria-busy={creating || undefined}
          >
            {creating ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-link">
          Already have an account?{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => openAuthDialog("login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </Modal>
  );
}

function ResetModal({ open }: { open: boolean }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, runSend] = useSubmitLock();

  useEffect(() => {
    setError("");
  }, [open]);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    void runSend(async () => {
      const ready = await waitForAuthReady();
      if (!ready) {
        setError(AUTH_UNAVAILABLE_MESSAGE);
        return;
      }
      try {
        await resetPassword(trimmedEmail);
      } catch (err) {
        if (
          !(err instanceof Error) ||
          (err as { code?: string }).code !== "auth/user-not-found"
        ) {
          const message = errorMessage(err);
          setError(message);
          showToast(message);
          return;
        }
      }
      closeAuthDialog();
      showToast("Password reset link sent. Check your inbox.");
      track("password_reset_sent");
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && closeAuthDialog()}
      title="Reset password"
      id="reset-modal"
    >
      <ModalClose />
      <p>
        Enter your email and we&apos;ll send you a link to choose a new
        password.
      </p>
      <form id="reset-form" noValidate onSubmit={handleSubmit}>
        <label htmlFor="reset-email">Email</label>
        <input
          type="email"
          id="reset-email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p
          id="reset-error"
          className="form-error"
          role="alert"
          aria-live="assertive"
          hidden={!error}
        >
          {error}
        </p>
        <button
          type="submit"
          id="reset-submit"
          className="btn btn-primary"
          disabled={sending}
          aria-busy={sending || undefined}
        >
          {sending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="auth-link">
        <button
          type="button"
          disabled={sending}
          onClick={() => openAuthDialog("login")}
        >
          Back to sign in
        </button>
      </p>
    </Modal>
  );
}

export function AuthDialog() {
  const { open, mode } = useAuthDialog();
  const authOpen = open && (mode === "login" || mode === "signup");
  const activeTab: AuthTab = mode === "signup" ? "signup" : "login";

  return (
    <>
      <AuthModal open={authOpen} tab={activeTab} />
      <ResetModal open={open && mode === "reset"} />
    </>
  );
}
