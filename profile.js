// profile.js (module)
import {
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
  
  // Helpers
  const $ = (sel) => document.querySelector(sel);
  const showToast = (msg) => {
    const c = document.querySelector('.toast-container') || (() => {
      const d = document.createElement('div');
      d.className = 'toast-container'; document.body.appendChild(d); return d;
    })();
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role','status'); t.textContent = msg;
    c.appendChild(t); setTimeout(() => t.remove(), 4000);
  };
  
  const PROGRESS_KEY = 'ff_course_progress';
  const COURSE_MODULES = [
    { id: 'junk-fees' }, { id: 'subs-cancel' }, { id: 'bnpl' },
    { id: 'chargebacks' }, { id: 'arbitration' }, { id: 'debt-rights' }
  ];
  
  const authReady = () => new Promise((res) => {
    if (window.authUI?.auth) return res(window.authUI.auth);
    window.addEventListener('auth-ready', () => res(window.authUI.auth), { once: true });
  });
  
  function initialsFrom(user){
    const name = user.displayName || '';
    if (name.trim()) return name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const email = user.email || 'U';
    return email.slice(0,2).toUpperCase();
  }
  
  function fmtDate(iso){
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString([], { year:'numeric', month:'short', day:'numeric' });
  }
  
  function computeProgress(){
    const completed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
    const total = COURSE_MODULES.length;
    const done = completed.filter(id => COURSE_MODULES.some(m => m.id === id)).length;
    const pct = total ? Math.round((done/total)*100) : 0;
    return { done, total, pct };
  }
  
  function setRing(pct){
    // conic ring uses degrees; 100% -> 360deg
    const deg = Math.max(0, Math.min(100, pct)) * 3.6;
    const ring = $('#ring');
    ring.style.setProperty('--deg', `${deg}deg`);
    $('#ring-num').textContent = pct;
    ring.setAttribute('aria-valuenow', String(pct));
  }
  
  function setBar(pct){
    $('#progress-fill').style.setProperty('--p', `${pct}%`);
    $('#pct-text').textContent = `${pct}%`;
  }
  
  function setAvatar(user){
    const img = $('#prof-avatar');
    const fallback = $('#prof-initials');
    const url = user.photoURL;
    if (url) {
      img.src = url;
      img.alt = user.displayName || user.email || 'User avatar';
      img.hidden = false;
      fallback.hidden = true;
    } else {
      img.hidden = true;
      fallback.hidden = false;
      fallback.textContent = initialsFrom(user);
    }
  }
  
  function renderChips(user){
    const row = $('#chip-row'); row.innerHTML = '';
    const make = (txt) => { const s = document.createElement('span'); s.className='chip'; s.textContent = txt; return s; };
    row.appendChild(make(user.emailVerified ? 'Email verified' : 'Email not verified'));
    const prov = user.providerData.map(p=>p.providerId.replace('.com','')).join(', ') || 'password';
    row.appendChild(make(`Provider: ${prov}`));
  }
  
  function populate(user){
    $('#prof-name').textContent = user.displayName || (user.email?.split('@')[0] ?? 'Friend');
    $('#prof-email').textContent = user.email || '';
    $('#joined-at').textContent = fmtDate(user.metadata?.creationTime);
    $('#last-login').textContent = fmtDate(user.metadata?.lastSignInTime);
    $('#prov').textContent = user.providerData.map(p=>p.providerId.replace('.com','')).join(', ') || 'password';
  
    setAvatar(user);
    renderChips(user);
  
    const { done, total, pct } = computeProgress();
    $('#mods-done').textContent = done;
    $('#mods-total').textContent = total;
    setRing(pct);
    setBar(pct);
  
    // settings defaults
    $('#input-name').value = user.displayName || '';
    $('#input-photo').value = user.photoURL || '';
    // verify button
    $('#verify-btn').hidden = !!user.emailVerified;
  }
  
  function wireEvents(auth){
    $('#logout-btn').addEventListener('click', async () => {
      try {
        await window.authUI.logout();
        window.location.replace('index.html');
      } catch(e){
        showToast('Could not sign out. Try again.');
      }
    });
  
    $('#edit-open').addEventListener('click', () => { $('#settings').hidden = false; });
    $('#edit-cancel').addEventListener('click', () => { $('#settings').hidden = true; });
  
    $('#settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return;
  
      const displayName = $('#input-name').value.trim();
      const photoURL = $('#input-photo').value.trim() || null;
  
      try {
        await updateProfile(user, { displayName: displayName || null, photoURL });
        populate(user);
        $('#settings').hidden = true;
        showToast('Profile updated');
      } catch(err){
        showToast(err?.message || 'Update failed');
      }
    });
  
    $('#verify-btn').addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        await sendEmailVerification(user);
        showToast('Verification email sent.');
      } catch(err){
        showToast(err?.message || 'Could not send verification email');
      }
    });
  }
  
  // init
  (async () => {
    const auth = await authReady();
  
    // guard route
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If not signed in, bounce to home.
        window.location.replace('index.html');
        return;
      }
      populate(user);
      wireEvents(auth);
    });
  
    // tiny nav helpers from your existing app.js
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('mobile-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        menu.hidden = expanded;
        document.body.classList.toggle('no-scroll', !expanded);
      });
      menu.addEventListener('click', (e) => {
        const el = e.target;
        if (el.matches('a[href], button')) {
          menu.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('no-scroll');
        }
      });
    }
  })();
  