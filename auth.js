// auth.js – Firebase Auth (persistent login)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  // ✅ Use initializeAuth to set persistent storage with fallbacks
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔐 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAGkg7sRXZBL7sqXsN_45qvY55ixE2jCKQ",
  authDomain: "financefirst-ee059.firebaseapp.com",
  projectId: "financefirst-ee059",
  // keep this corrected bucket so Storage works later
  storageBucket: "financefirst-ee059.appspot.com",
  messagingSenderId: "784511465100",
  appId: "1:784511465100:web:939286cdcb6fa89e84ada9",
  measurementId: "G-0ER63Z21GK"
};

const app = initializeApp(firebaseConfig);

// ✅ Persist “for a while”: prefer IndexedDB, then LocalStorage, then Session as a last resort.
// This keeps users signed in across reloads and browser restarts (until they sign out).
const auth = initializeAuth(app, {
  persistence: [
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence
  ]
});

// Google provider
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// Complete any pending redirect (ignore if none)
getRedirectResult(auth).catch(() => {});

/** Popup first; fallback to redirect if blocked/unsupported */
async function googleSignIn() {
  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    if (
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      return; // will continue after redirect
    }
    throw err;
  }
}

// Expose helpers
window.authUI = {
  loginWithGoogle: () => googleSignIn(), // returns a Promise
  loginWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signUpWithEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  auth
};

// Fire once after authUI exists
window.dispatchEvent(new Event('auth-ready'));

// Keep the UI in sync
onAuthStateChanged(auth, user => {
  const userBtn = document.getElementById('user-btn');
  if (!userBtn) return;

  if (user) {
    // stop opening the login modal when signed in
    userBtn.removeAttribute('data-modal-open');
    const initials = (user.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('')
      : (user.email || 'U').slice(0, 2)
    ).toUpperCase();

    userBtn.innerHTML = `<div class="user-initials" title="${user.email || user.displayName || ''}">${initials}</div>`;
    userBtn.onclick = () => window.authUI.logout();
  } else {
    userBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>`;
    userBtn.setAttribute('data-modal-open', 'login-modal');
    userBtn.onclick = null;
  }
});
