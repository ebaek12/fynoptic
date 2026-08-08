// profile.js (drop-in replacement)

/* Firebase */
import {
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification
  } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
  
  import {
    getStorage,
    ref as sRef,
    uploadBytesResumable,
    getDownloadURL
  } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";
  
  /* DOM + toasts */
  const $ = (sel) => document.querySelector(sel);
  const setText = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
  const showToast = (msg) => {
    const c = document.querySelector('.toast-container') || (() => {
      const d = document.createElement('div');
      d.className = 'toast-container'; document.body.appendChild(d); return d;
    })();
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role','status'); t.textContent = msg;
    c.appendChild(t); setTimeout(() => t.remove(), 4000);
  };
  
  /* Keys (mirror your course) */
  const NAME_KEY = 'ff_user_name';
  const COURSE_PROGRESS_KEY = 'ff_course_progress'; // legacy fallback
  const DP_STATE_LS = 'ff_dp_state';
  const DP_STATE_COOKIE = 'ff_dp_state_v2';
  
  /* Helpers */
  function initialsFrom(user){
    const name = user.displayName || '';
    if (name.trim()) return name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const email = user.email || 'U';
    return email.slice(0,2).toUpperCase();
  }
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString([], { year:'numeric', month:'short', day:'numeric' }) : '—';
  
  function getCookie(name){
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-[\]/{}()*+?.\\^$|]/g,'\\$&') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch { return null; }
  }
  
  function readDPState(){
    // cookie first (v2), then LS (legacy)
    try {
      const c = getCookie(DP_STATE_COOKIE);
      if (c) return JSON.parse(c);
    } catch {}
    try {
      const ls = localStorage.getItem(DP_STATE_LS);
      if (ls) return JSON.parse(ls);
    } catch {}
    return null;
  }
  
  /* === Accurate course progress ===
     Prefer Dark Patterns course state if present; else fallback to old PROGRESS_KEY.
  */
  function computeProgressAccurate(){
    const dp = readDPState();
    if (dp && typeof dp === 'object'){
      const m1 = !!(dp.m1?.video && dp.m1?.article);
      const m2 = !!(dp.m2?.video && dp.m2?.article && dp.m2?.idExercise);
      const m3 = !!(dp.m3?.video && dp.m3?.article);
      const m4 = !!(dp.m4?.article && dp.m4?.auditSubmitted);
      const done = [m1,m2,m3,m4].filter(Boolean).length;
      const total = 4;
      const pct = Math.round((done/total)*100);
      return { done, total, pct, source: 'dp' };
    }
  
    // Fallback: legacy array of module IDs. Support both new and old ids.
    const ARR6 = ['junk-fees','subs-cancel','bnpl','chargebacks','arbitration','debt-rights'];
    const DP4  = ['dp-m1','dp-m2','dp-m3','dp-m4'];
  
    let ids = [];
    try { ids = JSON.parse(localStorage.getItem(COURSE_PROGRESS_KEY) || '[]'); } catch {}
  
    // Prefer whichever set has more matches so the UI doesn't undercount.
    const count6 = ids.filter(id => ARR6.includes(id)).length;
    const count4 = ids.filter(id => DP4.includes(id)).length;
  
    if (count4 >= count6) {
      const done = count4, total = 4, pct = Math.round((done/total)*100);
      return { done, total, pct, source: 'dp-fallback' };
    } else {
      const done = count6, total = 6, pct = Math.round((done/total)*100);
      return { done, total, pct, source: 'legacy6' };
    }
  }
  
  function setRing(pct){
    const deg = Math.max(0, Math.min(100, pct)) * 3.6;
    const ring = $('#ring');
    if (ring) {
      ring.style.setProperty('--deg', `${deg}deg`);
      ring.setAttribute('aria-valuenow', String(pct));
    }
    setText('#ring-num', pct);
  }
  function setBar(pct){
    const fill = $('#progress-fill');
    if (fill) fill.style.setProperty('--p', `${pct}%`);
    setText('#pct-text', `${pct}%`);
  }
  
  function setAvatar(user){
    const img = $('#prof-avatar');
    const fallback = $('#prof-initials');
    const url = user.photoURL;
    if (url) {
      if (img) {
        img.src = url;
        img.alt = user.displayName || user.email || 'User avatar';
        img.hidden = false;
      }
      if (fallback) fallback.hidden = true;
    } else {
      if (img) img.hidden = true;
      if (fallback) {
        fallback.hidden = false;
        fallback.textContent = initialsFrom(user);
      }
    }
  }

  function renderChips(user){
    const row = $('#chip-row');
    if (!row) return;
    row.innerHTML = '';
    const make = (txt) => { const s = document.createElement('span'); s.className='chip'; s.textContent = txt; return s; };
    row.appendChild(make(user.emailVerified ? 'Email verified' : 'Email not verified'));
    const prov = user.providerData.map(p=>p.providerId.replace('.com','')).join(', ') || 'password';
    row.appendChild(make(`Provider: ${prov}`));
  }
  
  function populate(user){
    setText('#prof-name', user.displayName || (user.email?.split('@')[0] ?? 'Friend'));
    setText('#prof-email', user.email || '');
    setText('#joined-at', fmtDate(user.metadata?.creationTime));
    setText('#last-login', fmtDate(user.metadata?.lastSignInTime));

    setAvatar(user);
    renderChips(user);

    const p = computeProgressAccurate();
    setText('#mods-done', p.done);
    setText('#mods-total', p.total);
    setRing(p.pct); setBar(p.pct);

    // settings defaults
    const nameInput = $('#input-name');
    if (nameInput) nameInput.value = user.displayName || localStorage.getItem(NAME_KEY) || '';
    const photoInput = $('#input-photo');
    if (photoInput) photoInput.value = user.photoURL || '';
    const verifyBtn = $('#verify-btn');
    if (verifyBtn) verifyBtn.hidden = !!user.emailVerified;
  }
  
  /* === Avatar upload === */
  async function uploadAvatar(file, uid){
    if (!file) return null;
    if (!/^image\//i.test(file.type)) throw new Error('Please choose an image file.');
    if (file.size > 3 * 1024 * 1024) throw new Error('Image must be under 3 MB.');
  
    const storage = getStorage(); // default app
    const path = `avatars/${uid}/${Date.now()}-${file.name.replace(/\s+/g,'_')}`;
    const ref = sRef(storage, path);
  
    const task = uploadBytesResumable(ref, file, { cacheControl: 'public,max-age=31536000' });
    return new Promise((resolve, reject) => {
      task.on('state_changed',
        () => {}, // could show progress if you like
        (err) => reject(err),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (e) { reject(e); }
        }
      );
    });
  }
  
  /* === Wire UI === */
  function wireEvents(auth){
    // profile.html currently ships markup for the summary card only — the settings/edit
    // panel (#settings, #edit-open, #edit-cancel, #settings-form, #verify-btn,
    // #input-photo-file) has no markup on the page. Bind defensively so a missing panel
    // degrades to "feature absent" instead of throwing and killing the whole script.
    $('#logout-btn')?.addEventListener('click', async () => {
      try {
        await window.authUI.logout();
        window.location.replace('index.html');
      } catch(e){
        showToast('Could not sign out. Try again.');
      }
    });

    $('#edit-open')?.addEventListener('click', () => { const s = $('#settings'); if (s) s.hidden = false; });
    $('#edit-cancel')?.addEventListener('click', () => { const s = $('#settings'); if (s) s.hidden = true; });
  
    // Preview selected avatar instantly
    $('#input-photo-file')?.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (f) {
        const url = URL.createObjectURL(f);
        const img = $('#prof-avatar');
        img.src = url; img.hidden = false;
        $('#prof-initials').hidden = true;
        setTimeout(()=>URL.revokeObjectURL(url), 5000);
      }
    });
  
    $('#settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return;
  
      const nameInput  = $('#input-name').value.trim();
      const urlInput   = $('#input-photo').value.trim();
      const fileInput  = $('#input-photo-file');
      const file       = fileInput?.files?.[0];
  
      try {
        // 1) If a file was chosen, upload it and override urlInput
        let finalPhotoURL = urlInput || null;
        if (file) {
          showToast('Uploading avatar…');
          finalPhotoURL = await uploadAvatar(file, user.uid);
        }
  
        // 2) Update Firebase auth profile
        await updateProfile(user, {
          displayName: nameInput || null,
          photoURL: finalPhotoURL || null
        });
  
        // 2b) Tell the header avatar to refresh (null means "cleared" -> initials)
        window.dispatchEvent(new CustomEvent('avatar-updated', {
          detail: { photoURL: finalPhotoURL || null }
        }));

        // 3) Mirror display name to your certificate name key
        if (nameInput) {
          try { localStorage.setItem(NAME_KEY, nameInput); } catch {}
        }
  
        // 4) Refresh UI
        populate(user);
        $('#settings').hidden = true;
        showToast('Profile updated');
  
      } catch(err){
        showToast(err?.message || 'Update failed');
      }
    });
  
    $('#verify-btn')?.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        await sendEmailVerification(user);
        showToast('Verification email sent.');
        $('#verify-btn').hidden = true;
      } catch(err){
        showToast(err?.message || 'Could not send verification email');
      }
    });
  }
  
  /* === Boot === */
  const authReady = () => new Promise((res) => {
    if (window.authUI?.auth) return res(window.authUI.auth);
    window.addEventListener('auth-ready', () => res(window.authUI.auth), { once: true });
  });
  
  (async () => {
    const auth = await authReady();

    // Bind once — onAuthStateChanged fires again on every token refresh.
    wireEvents(auth);

    onAuthStateChanged(auth, (user) => {
      if (!user) { window.location.replace('index.html'); return; }
      populate(user);
    });

    // Mobile nav is handled by app.js — do not duplicate it here.
  })();
  