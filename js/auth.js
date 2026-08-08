// auth.js — robust, persistent Firebase Auth

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// Flip to true ONLY after completing the steps in FIREBASE_SETUP.md
// (Firebase Console -> Authentication -> Settings -> Authorized domains + custom
// auth domain, plus DNS). Turning this on before DNS resolves breaks Google sign-in.
const USE_CUSTOM_AUTH_DOMAIN = false;

// 🔐 Config
const firebaseConfig = {
  apiKey: "AIzaSyAGkg7sRXZBL7sqXsN_45qvY55ixE2jCKQ",
  authDomain: USE_CUSTOM_AUTH_DOMAIN ? "fynoptic.org" : "financefirst-ee059.firebaseapp.com",
  projectId: "financefirst-ee059",
  storageBucket: "financefirst-ee059.appspot.com",
  messagingSenderId: "784511465100",
  appId: "1:784511465100:web:939286cdcb6fa89e84ada9",
  measurementId: "G-0ER63Z21GK"
};

// App + a single Auth instance
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Durable persistence with graceful fallbacks
async function setUpPersistence() {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
  } catch {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
      await setPersistence(auth, browserSessionPersistence);
    }
  }
}

// Google Sign-In — popup only. signInWithRedirect cannot work while authDomain sits on a
// different origin than the site: it fails silently and dumps the user back signed out.
// Let failures reject so the caller can show a real message.
function googleSignIn() {
  const provider = new GoogleAuthProvider(); // created inside to avoid instance mismatch
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

// Plain-English text for the Firebase codes we can actually hit. Users never see
// "Firebase: Error (auth/...)".
const CREDENTIAL_FAILED = "That email or password isn't right.";
const ERROR_MESSAGES = {
  // One shared message for all three credential failures, so the form can't be used to
  // discover which emails have accounts.
  "auth/invalid-credential": CREDENTIAL_FAILED,
  "auth/wrong-password": CREDENTIAL_FAILED,
  "auth/user-not-found": CREDENTIAL_FAILED,
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/email-already-in-use": "An account with that email already exists. Try signing in instead.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.",
  "auth/popup-closed-by-user": "The sign-in window closed before you finished. Please try again.",
  "auth/cancelled-popup-request": "Another sign-in window is already open.",
  "auth/network-request-failed": "We couldn't reach the network. Check your connection and try again.",
  "auth/user-disabled": "This account has been disabled. Contact support if that's a mistake.",
  "auth/missing-password": "Please enter your password.",
  "auth/operation-not-allowed": "That sign-in method isn't enabled for this site.",
  "auth/unauthorized-domain": "Sign-in isn't allowed from this address yet."
};

function errorMessage(err) {
  return ERROR_MESSAGES[err?.code] || "Something went wrong. Please try again.";
}

// Surface the API to app.js. Assigned synchronously so consumers that check for
// window.authUI right away still find it.
window.authUI = {
  auth,
  loginWithGoogle: () => googleSignIn(),
  loginWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signUpWithEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  resetPassword: (email) => sendPasswordResetEmail(auth, email),
  logout: () => signOut(auth),
  errorMessage
};

// Boot order matters: persistence has to be settled before Firebase finishes a redirect,
// and "auth-ready" only fires once both are done. Firing it early was the old race.
(async () => {
  try {
    await setUpPersistence();
  } catch (err) {
    console.error("Auth persistence setup failed:", err);
  }

  try {
    // Legacy path: completes a redirect started by an older build of the site.
    // New sign-ins use popups only.
    await getRedirectResult(auth);
  } catch (err) {
    console.error("Redirect sign-in failed:", errorMessage(err), err);
  }

  window.dispatchEvent(new Event("auth-ready"));
})();

// Initials from a display name, else the local part of the email. Two characters max.
function initialsFrom(user) {
  const base = (user?.displayName || user?.email || "").trim();
  if (!base) return "?";
  const name = base.includes("@") ? base.split("@")[0] : base;
  return name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

// Toggle the two children the nav markup already contains. Never write innerHTML on
// #user-btn — that destroyed #nav-avatar and #nav-initials on every state change.
function showAvatar(photoURL, user) {
  const img = document.getElementById("nav-avatar");
  const initials = document.getElementById("nav-initials");

  // Fall back to initials. Unbinds onerror and drops the src first, so a photo that
  // fails to load can't re-enter this from its own error handler.
  const useInitials = () => {
    if (img) {
      img.onerror = null;
      img.hidden = true;
      img.removeAttribute("src");
    }
    if (initials) {
      initials.hidden = false;
      initials.textContent = initialsFrom(user);
    }
  };

  if (photoURL && img) {
    // Rebound every call: the handler closes over this call's user, and last call's
    // handler is gone before the new src starts loading. A dead photoURL (Google
    // photos 404 after the user removes theirs) then shows initials, not a broken icon.
    img.onerror = useInitials;
    img.hidden = false;
    if (initials) initials.hidden = true;
    img.src = photoURL; // last, so the fallback always wins the visibility flip
    return;
  }

  useInitials();
}

// Reflect auth state in the header button
onAuthStateChanged(auth, (user) => {
  const btn = document.getElementById("user-btn");
  const img = document.getElementById("nav-avatar");
  const initials = document.getElementById("nav-initials");
  if (!btn) return;

  if (user) {
    btn.removeAttribute("data-modal-open");
    btn.setAttribute("aria-label", "Your profile");
    btn.onclick = () => { window.location.href = "/profile"; };
    showAvatar(user.photoURL, user);
  } else {
    if (img) {
      img.hidden = true;
      // Drop the URL too, so a signed-out browser isn't left holding the last
      // user's photo (and can't flash it at whoever signs in next). The onerror
      // goes with it — it closes over the user who just signed out.
      img.onerror = null;
      img.removeAttribute("src");
    }
    if (initials) {
      initials.hidden = true;
      initials.textContent = "";
    }
    btn.setAttribute("data-modal-open", "login-modal");
    btn.setAttribute("aria-label", "Sign in");
    btn.onclick = null;
  }
});

// profile.js dispatches this after a photo change. A null/empty photoURL means the avatar
// was cleared: fall back to initials instead of leaving a stale image up.
window.addEventListener("avatar-updated", (e) => {
  showAvatar(e.detail?.photoURL, auth.currentUser);
});
