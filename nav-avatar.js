// nav-avatar.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function initialsFrom(user){
  const base = (user?.displayName || user?.email || '').trim();
  if (!base) return '?';
  const name = base.includes('@') ? base.split('@')[0] : base;
  return name.split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase();
}

function applyAvatar(userOrUrl){
  const img = document.getElementById('nav-avatar');
  const inits = document.getElementById('nav-initials');
  if (!img || !inits) return;

  const url = typeof userOrUrl === 'string' ? userOrUrl : userOrUrl?.photoURL;
  if (url){
    img.src = url; img.hidden = false; inits.hidden = true;
  } else {
    img.hidden = true; inits.hidden = false; inits.textContent = initialsFrom(userOrUrl || null);
  }
}

function onReady(cb){
  if (window.authUI?.auth) return cb(window.authUI.auth);
  window.addEventListener('auth-ready', ()=>cb(window.authUI.auth), { once:true });
}

onReady((auth)=>{
  onAuthStateChanged(auth, (user)=>applyAvatar(user));
});

// When profile page updates the avatar, it will dispatch this:
window.addEventListener('avatar-updated', (e)=>{
  const url = e.detail?.photoURL;
  if (url) applyAvatar(url);
});
