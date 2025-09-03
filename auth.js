// auth.js – Firebase Auth (persistent login + robust Google sign-in)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
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

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAGkg7sRXZBL7sqXsN_45qvY55ixE2jCKQ",
  authDomain: "financefirst-ee059.firebaseapp.com",
  projectId: "financefirst-ee059",
  storageBucket: "financefirst-ee059.appspot.com", // <- fixed bucket
  messagingSenderId: "784511465100",
  appId: "1:784511465100:web:939286cdcb6fa89e84ada9",
  measurementId: "G-0ER63Z21GK"
};

const app = initializeApp(firebaseConfig);

// ✅ Long-lived persistence with graceful fallbacks
const auth = initializeAuth(app, {
  persistence: [
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence
  ]
});

// Try to complete a pending redirect silently
getRedirectResult(auth).catch(() => {});

/** Google sign-in that can’t mismatch the SDK instance. */
async function googleSignIn() {
  // Create provider *inside* the function so it's guaranteed to be from this module instance
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    // Popup blocked / unsupported -> reliable redirect fallback
    if (
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      return; // continue after redirect
    }
    // Surface helpful hint for the classic "argument-error"
    if (err?.code === "auth/argument-error") {
      console.warn(
        "[auth] argument-error likely from duplicate SDKs or double handlers. " +
        "Ensure only one copy of firebase-auth is imported and only one click handler is bound."
      );
    }
    throw err;
  }
}

window.authUI = {
  loginWithGoogle: () => googleSignIn(),
  loginWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signUpWithEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  auth
};

// Fire once after authUI exists
window.dispatchEvent(new Event("auth-ready"));

onAuthStateChanged(auth, (user) => {
  const userBtn = document.getElementById("user-btn");
  if (!userBtn) return;

  if (user) {
    userBtn.removeAttribute("data-modal-open");
    const initials = (user.displayName
      ? user.displayName.split(" ").map(n => n[0]).join("")
      : (user.email || "U").slice(0, 2)).toUpperCase();
    userBtn.innerHTML = `<div class="user-initials" title="${user.email || user.displayName || ''}">${initials}</div>`;
    userBtn.onclick = () => window.authUI.logout();
  } else {
    userBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>`;
    userBtn.setAttribute("data-modal-open", "login-modal");
    userBtn.onclick = null;
  }
});
