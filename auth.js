// auth.js — robust, persistent Firebase Auth

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
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

// 🔐 Config
const firebaseConfig = {
  apiKey: "AIzaSyAGkg7sRXZBL7sqXsN_45qvY55ixE2jCKQ",
  authDomain: "financefirst-ee059.firebaseapp.com",
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
(async () => {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
  } catch {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
      await setPersistence(auth, browserSessionPersistence);
    }
  }
})();

// Complete any pending redirect (ignore if none)
getRedirectResult(auth).catch(() => {});

// Google Sign-In (popup → redirect fallback; also fallback on argument-error)
async function googleSignIn() {
  const provider = new GoogleAuthProvider(); // created inside to avoid instance mismatch
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    if (
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/operation-not-supported-in-this-environment" ||
      err?.code === "auth/argument-error" // <- fallback here too
    ) {
      await signInWithRedirect(auth, provider);
      return; // continue after redirect roundtrip
    }
    throw err;
  }
}

// Surface a minimal API to app.js
window.authUI = {
  loginWithGoogle: () => googleSignIn(),
  loginWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signUpWithEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  auth
};

// Fire once after authUI exists
window.dispatchEvent(new Event("auth-ready"));

// Reflect auth state in the header button
onAuthStateChanged(auth, (user) => {
  const userBtn = document.getElementById("user-btn");
  if (!userBtn) return;

  if (user) {
    userBtn.removeAttribute("data-modal-open");
    const initials = (user.displayName
      ? user.displayName.split(" ").map(n => n[0]).join("")
      : (user.email || "U").slice(0, 2)).toUpperCase();

    userBtn.innerHTML = `<div class="user-initials" title="${user.email || user.displayName || ''}">${initials}</div>`;
    // 👉 Go to profile when clicked
    userBtn.onclick = () => { window.location.href = "profile.html"; };
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

