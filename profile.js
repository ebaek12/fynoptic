/* profile.js — minimal, drop-in fixes only
   - Upload + preview avatar (nice-looking pill + round preview added via JS)
   - Save name + avatar (persisted in localStorage; attempts Firebase update if available)
   - Avatar shows in top-right nav everywhere (updates #nav-avatar or #user-btn)
   - “Verify email” button & “Provider: …” chip removed/hidden
   - Clicking “Edit profile” auto-scrolls to the avatar/name area
*/

(function () {
    /* ─────────── Helpers / constants ─────────── */
    const AVATAR_KEY = 'ff_user_avatar_dataurl'; // 256px dataURL stored locally for global reuse
    const NAME_KEY   = 'ff_user_name';
  
    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  
    function onReady(fn) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
      } else {
        fn();
      }
    }
  
    function showToast(msg) {
      // use site toast if available; else fallback to alert
      const box = $('.toast-container');
      if (box) {
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = msg;
        box.appendChild(el);
        setTimeout(() => el.remove(), 3500);
      } else {
        try { console.log('[toast]', msg); } catch {}
      }
    }
  
    function initialsFrom(str) {
      const s = (str || '').trim();
      if (!s) return '?';
      return s.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
    }
  
    /* ─────────── UI: make a nice uploader without changing HTML files ─────────── */
    function enhanceFileInput(fileInput) {
      if (!fileInput || fileInput.dataset.enhanced) return;
      fileInput.dataset.enhanced = '1';
  
      // Container
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.gap = '12px';
      wrap.style.flexWrap = 'wrap';
  
      // Round preview
      const prev = document.createElement('div');
      prev.id = 'avatar-preview';
      prev.style.width = '80px';
      prev.style.height = '80px';
      prev.style.borderRadius = '9999px';
      prev.style.overflow = 'hidden';
      prev.style.border = '1px solid rgba(255,255,255,.14)';
      prev.style.background = 'radial-gradient(120% 120% at 0% 0%, #263252 0%, #0b1220 60%)';
      prev.style.boxShadow = '0 8px 28px rgba(0,0,0,.25)';
      prev.style.display = 'grid';
      prev.style.placeItems = 'center';
  
      const prevImg = document.createElement('img');
      prevImg.id = 'avatar-preview-img';
      prevImg.alt = '';
      prevImg.style.display = 'none';
      prevImg.style.width = '100%';
      prevImg.style.height = '100%';
      prevImg.style.objectFit = 'cover';
      prev.appendChild(prevImg);
  
      const fallback = document.createElement('div');
      fallback.id = 'avatar-preview-fallback';
      fallback.textContent = '👤';
      fallback.style.fontSize = '28px';
      fallback.style.opacity = '.75';
      prev.appendChild(fallback);
  
      // Fancy pill trigger
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.id = 'pick-file';
      pill.textContent = 'Upload photo';
      pill.style.padding = '.6rem 1rem';
      pill.style.borderRadius = '9999px';
      pill.style.fontWeight = '600';
      pill.style.border = '0';
      pill.style.background = 'linear-gradient(90deg,#3F6AFF,#22D1B2)';
      pill.style.color = '#0b1220';
      pill.style.cursor = 'pointer';
      pill.style.boxShadow = '0 10px 28px rgba(0,0,0,.25)';
  
      // Remove btn
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.id = 'remove-photo';
      removeBtn.textContent = 'Remove';
      removeBtn.style.padding = '.45rem .75rem';
      removeBtn.style.borderRadius = '9999px';
      removeBtn.style.border = '1px solid rgba(255,255,255,.18)';
      removeBtn.style.background = 'transparent';
      removeBtn.style.color = 'inherit';
      removeBtn.style.cursor = 'pointer';
  
      // Meta/help
      const meta = document.createElement('div');
      meta.id = 'file-meta';
      meta.textContent = 'JPG/PNG, under 3 MB';
      meta.style.color = 'var(--text-300, #9fb0d6)';
      meta.style.fontSize = '.9rem';
  
      // Hide real input and move it into our wrapper
      fileInput.style.display = 'none';
      fileInput.parentElement.insertBefore(wrap, fileInput);
      wrap.appendChild(prev);
      wrap.appendChild(pill);
      wrap.appendChild(removeBtn);
      wrap.appendChild(meta);
      wrap.appendChild(fileInput); // keep in DOM for forms
  
      // Wiring
      pill.addEventListener('click', () => fileInput.click());
      removeBtn.addEventListener('click', () => {
        fileInput.value = '';
        prevImg.src = '';
        prevImg.style.display = 'none';
        fallback.style.display = 'block';
        meta.textContent = 'JPG/PNG, under 3 MB';
        // Also clear preview on page + pending avatar buffer
        pendingAvatarDataURL = null;
      });
  
      // if an avatar already exists (localStorage), render it
      const existing = localStorage.getItem(AVATAR_KEY);
      if (existing) {
        prevImg.src = existing; prevImg.style.display = 'block'; fallback.style.display = 'none';
        meta.textContent = 'Using saved photo';
      }
    }
  
    /* ─────────── Image processing (resize to 256x256 and return DataURL) ─────────── */
    function fileToDataURL(file) {
      return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
    }
  
    async function resizeTo256DataURL(file) {
      const url = await fileToDataURL(file);
      const img = new Image();
      return new Promise((res) => {
        img.onload = () => {
          const size = 256;
          const c = document.createElement('canvas');
          c.width = size; c.height = size;
          const ctx = c.getContext('2d');
          // cover fit
          const ir = img.width / img.height;
          const tr = 1; // square
          let sx, sy, sw, sh;
          if (ir > tr) { // image wider than tall
            sh = img.height;
            sw = sh * tr;
            sx = (img.width - sw) / 2;
            sy = 0;
          } else {
            sw = img.width;
            sh = sw / tr;
            sx = 0;
            sy = (img.height - sh) / 2;
          }
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
          res(c.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => res(url); // fallback to original dataURL
        img.src = url;
      });
    }
  
    /* ─────────── Apply avatar globally (nav + profile preview) ─────────── */
    function applyGlobalAvatar(url, nameForInitials) {
      // Profile page preview (if present)
      const prevImg = $('#avatar-preview-img');
      const fb = $('#avatar-preview-fallback');
      if (prevImg) {
        if (url) {
          prevImg.src = url; prevImg.style.display = 'block';
          if (fb) fb.style.display = 'none';
        } else {
          prevImg.removeAttribute('src');
          if (fb) fb.style.display = 'block';
        }
      }
  
      // Top-right nav (preferred: #nav-avatar <img> + #nav-initials)
      const navImg = $('#nav-avatar');
      const navInits = $('#nav-initials');
      if (navImg) {
        if (url) {
          navImg.src = url; navImg.hidden = false;
          if (navInits) navInits.hidden = true;
        } else {
          navImg.hidden = true;
          if (navInits) { navInits.hidden = false; navInits.textContent = initialsFrom(nameForInitials || ''); }
        }
      } else {
        // Fallback: mutate #user-btn to show an <img> avatar
        const btn = $('#user-btn');
        if (btn) {
          // Ensure it looks like a circle thumbnail
          btn.style.width = '36px';
          btn.style.height = '36px';
          btn.style.borderRadius = '9999px';
          btn.style.overflow = 'hidden';
          btn.style.display = 'grid';
          btn.style.placeItems = 'center';
          // Ensure a single <img> child
          let img = btn.querySelector('img[data-nav-avatar-fb]');
          if (!img) {
            img = document.createElement('img');
            img.setAttribute('data-nav-avatar-fb', '1');
            img.alt = 'Profile';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            // clear other children (like initials/SVG) so the photo is visible
            btn.innerHTML = '';
            btn.appendChild(img);
          }
          if (url) {
            img.src = url;
          } else {
            // render initials fallback if no url
            btn.innerHTML = '';
            const span = document.createElement('span');
            span.textContent = initialsFrom(nameForInitials || '?');
            span.style.fontWeight = '600';
            span.style.fontSize = '.9rem';
            btn.appendChild(span);
          }
        }
      }
  
      // Let other pages listening know
      try {
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { photoURL: url || null } }));
      } catch {}
    }
  
    /* ─────────── Remove provider/verify UI bits ─────────── */
    function removeProviderAndVerifyBits() {
      // Obvious IDs/classes first
      $('#verify-btn')?.remove();
      $('#verify-email')?.remove();
      $('#provider-chip')?.remove();
  
      // Fallback by label text
      $$('button, a').forEach(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        if (t === 'verify email' || t === 'verify' || t.includes('verify email')) el.remove();
      });
      $$('.chip, .tag, span, div').forEach(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        if (t.startsWith('provider') || t === 'provider') el.remove();
      });
    }
  
    /* ─────────── Firebase profile update (best-effort, optional) ─────────── */
    async function tryUpdateFirebaseProfile({ displayName, photoURL }) {
      try {
        // authUI wrapper path
        const user1 = window.authUI?.auth?.currentUser;
        if (user1 && typeof user1.updateProfile === 'function') {
          await user1.updateProfile({ displayName, photoURL });
          return true;
        }
      } catch (e) { /* ignore */ }
  
      try {
        // Namespaced v8 path (if firebase auth is loaded this way)
        const user2 = window.firebase?.auth?.()?.currentUser;
        if (user2 && typeof user2.updateProfile === 'function') {
          await user2.updateProfile({ displayName, photoURL });
          return true;
        }
      } catch (e) { /* ignore */ }
  
      // Modular v9+ without imports isn’t reliably callable here — skip.
      return false;
    }
  
    /* ─────────── Edit button: open + auto-scroll to form/uploader ─────────── */
    function wireEditScroll() {
      const btn =
        $('#edit-profile') ||
        $('#edit-open') ||
        $$('button').find(b => /edit profile/i.test(b.textContent || ''));
  
      if (!btn) return;
  
      btn.addEventListener('click', (e) => {
        // reveal settings panel if it exists & is hidden
        const panel = $('#settings') || $('#profile-settings') || $('#edit-panel');
        if (panel && (panel.hidden || panel.hasAttribute('hidden'))) {
          panel.hidden = false;
          panel.removeAttribute('hidden');
        }
        // choose best scroll target
        const target =
          $('.avatar-uploader') ||
          $('#avatar-preview') ||
          $('#profile-form') ||
          $('#settings-form') ||
          panel ||
          document.body;
  
        try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        catch { window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' }); }
      });
    }
  
    /* ─────────── Form wiring (save name + avatar) ─────────── */
    let pendingAvatarDataURL = null;
  
    function wireForm() {
      // Inputs (support multiple possible IDs)
      const nameInput =
        $('#display-name') || $('#profile-name') || $('#learner-name') || $('input[name="displayName"]');
  
      const fileInput =
        $('#photo-file') || $('#input-photo-file') || $('input[type="file"][name="avatar"]') || $('input[type="file"][id*="photo"]');
  
      const form =
        $('#profile-form') || $('#settings-form') || $('#edit-form') || nameInput?.closest('form');
  
      // Prefill name & avatar from storage/user
      const storedName = localStorage.getItem(NAME_KEY);
      const storedAvatar = localStorage.getItem(AVATAR_KEY);
  
      if (nameInput) {
        if (storedName) nameInput.value = storedName;
        else {
          // best-effort pull from auth if present
          try {
            const u = window.authUI?.auth?.currentUser || window.firebase?.auth?.()?.currentUser;
            if (u?.displayName) nameInput.value = u.displayName;
          } catch { /* ignore */ }
        }
      }
  
      if (fileInput) {
        enhanceFileInput(fileInput);
        if (storedAvatar) applyGlobalAvatar(storedAvatar, (nameInput && nameInput.value) || storedName);
        fileInput.addEventListener('change', async () => {
          const f = fileInput.files?.[0];
          if (!f) return;
          if (f.size > 3 * 1024 * 1024) {
            showToast('Image is larger than 3 MB. It will be compressed.');
          }
          pendingAvatarDataURL = await resizeTo256DataURL(f);
          applyGlobalAvatar(pendingAvatarDataURL, (nameInput && nameInput.value) || storedName);
          const meta = $('#file-meta');
          if (meta) meta.textContent = `${f.name} — ${(f.size / 1024 / 1024).toFixed(2)} MB (compressed)`;
        });
      }
  
      // Save handler
      const saveBtn =
        $('#save-profile') ||
        $('#settings-save') ||
        $$('button, input[type="submit"]').find(b => /save/i.test(b.value || b.textContent || ''));
  
      // If we don’t have a dedicated save button, listen for form submit
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await doSave(nameInput, pendingAvatarDataURL);
        });
      }
      if (saveBtn && !form) {
        saveBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await doSave(nameInput, pendingAvatarDataURL);
        });
      }
    }
  
    async function doSave(nameInput, dataUrl) {
      const displayName = (nameInput?.value || '').trim();
  
      // Persist locally (always available)
      if (displayName) localStorage.setItem(NAME_KEY, displayName);
      if (dataUrl)     localStorage.setItem(AVATAR_KEY, dataUrl);
  
      // Reflect immediately in the UI everywhere
      applyGlobalAvatar(
        dataUrl || localStorage.getItem(AVATAR_KEY) || null,
        displayName || localStorage.getItem(NAME_KEY) || ''
      );
  
      // Best-effort push to Firebase Auth profile (works if your app exposes a compatible API)
      try {
        const photoURL = dataUrl || null; // may be a data: URL; fine for local use
        await tryUpdateFirebaseProfile({ displayName, photoURL });
      } catch { /* ignore */ }
  
      showToast('Profile saved.');
    }
  
    /* ─────────── Boot ─────────── */
    onReady(() => {
      removeProviderAndVerifyBits();
      wireEditScroll();
      wireForm();
  
      // Ensure header avatar renders from stored values on page load
      const storedAvatar = localStorage.getItem(AVATAR_KEY);
      const storedName   = localStorage.getItem(NAME_KEY) || '';
      applyGlobalAvatar(storedAvatar, storedName);
    });
  })();
  