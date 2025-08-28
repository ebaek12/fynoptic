// auth.js – Handles Firebase Auth

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
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
  storageBucket: "financefirst-ee059.firebasestorage.app",
  messagingSenderId: "784511465100",
  appId: "1:784511465100:web:939286cdcb6fa89e84ada9",
  measurementId: "G-0ER63Z21GK"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🔐 Auth UI logic
window.authUI = {
  loginWithGoogle: () => {
    signInWithPopup(auth, provider)
      .then(() => {
        document.getElementById('login-modal')?.setAttribute('hidden', '');
      })
      .catch(err => alert(err.message));
  },
  loginWithEmail: (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  },
  signUpWithEmail: (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  logout: () => signOut(auth)
};

// 🔁 Update UI on login state
onAuthStateChanged(auth, user => {
  const userBtn = document.getElementById('user-btn');
  if (!userBtn) return;

  if (user) {
    const initials = user.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('')
      : user.email.slice(0, 2).toUpperCase();

    userBtn.innerHTML = `<div class="user-initials" title="${user.email}">${initials}</div>`;
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
