// Port of the auth-overhaul branch's js/profile.js. Firebase 12.17.1 via the
// npm package instead of gstatic CDN URLs; same behavior.
//
// profile.html currently ships markup for the summary card only — the
// settings/edit panel (#settings, #edit-open, #edit-cancel, #settings-form,
// #verify-btn, #input-photo-file) has no markup on this page yet. Bind
// defensively so a missing panel degrades to "feature absent" instead of
// throwing and killing the whole script — same contract as the source.

import {
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { auth, logout } from '../lib/auth';
import { getCourseProgress } from '../lib/storage';
import { showToast } from '../lib/toast';

const NAME_KEY = 'ff_user_name';
const DP_STATE_LS = 'ff_dp_state';
const DP_STATE_COOKIE = 'ff_dp_state_v2';

function $<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

function setText(selector: string, value: string | number): void {
  const el = $(selector);
  if (el) el.textContent = String(value);
}

function initialsFrom(user: User): string {
  const name = user.displayName ?? '';
  if (name.trim()) {
    return name
      .split(' ')
      .map((n) => n[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  const email = user.email ?? 'U';
  return email.slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

function getCookie(name: string): string | null {
  try {
    const escaped = name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// Dark Patterns course state, read straight from its own cookie/localStorage
// keys — neither lives in the ff_course_progress/ff_fixit_history/ff_reports
// wrapper in src/lib/storage.ts, so this stays a direct read like the source.
type DPModuleFlags = Partial<Record<'video' | 'article' | 'idExercise' | 'auditSubmitted', boolean>>;
type DPState = Partial<Record<'m1' | 'm2' | 'm3' | 'm4', DPModuleFlags>>;

function parseDPState(raw: string): DPState | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as DPState) : null;
  } catch {
    return null;
  }
}

function readDPState(): DPState | null {
  const cookie = getCookie(DP_STATE_COOKIE);
  if (cookie) {
    const parsed = parseDPState(cookie);
    if (parsed) return parsed;
  }
  try {
    const ls = localStorage.getItem(DP_STATE_LS);
    if (ls) {
      const parsed = parseDPState(ls);
      if (parsed) return parsed;
    }
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
  return null;
}

interface ProgressResult {
  done: number;
  total: number;
  pct: number;
  source: 'dp' | 'dp-fallback' | 'legacy6';
}

// Prefer Dark Patterns course state if present; else fall back to the old
// ff_course_progress array (read through the typed storage wrapper).
function computeProgressAccurate(): ProgressResult {
  const dp = readDPState();
  if (dp) {
    const m1 = Boolean(dp.m1?.video && dp.m1?.article);
    const m2 = Boolean(dp.m2?.video && dp.m2?.article && dp.m2?.idExercise);
    const m3 = Boolean(dp.m3?.video && dp.m3?.article);
    const m4 = Boolean(dp.m4?.article && dp.m4?.auditSubmitted);
    const done = [m1, m2, m3, m4].filter(Boolean).length;
    const total = 4;
    return { done, total, pct: Math.round((done / total) * 100), source: 'dp' };
  }

  // Fallback: legacy array of module IDs. Support both new and old ids,
  // preferring whichever set has more matches so the UI doesn't undercount.
  const ARR6 = ['junk-fees', 'subs-cancel', 'bnpl', 'chargebacks', 'arbitration', 'debt-rights'];
  const DP4 = ['dp-m1', 'dp-m2', 'dp-m3', 'dp-m4'];
  const ids = getCourseProgress();

  const count6 = ids.filter((id) => ARR6.includes(id)).length;
  const count4 = ids.filter((id) => DP4.includes(id)).length;

  if (count4 >= count6) {
    const done = count4;
    const total = 4;
    return { done, total, pct: Math.round((done / total) * 100), source: 'dp-fallback' };
  }
  const done = count6;
  const total = 6;
  return { done, total, pct: Math.round((done / total) * 100), source: 'legacy6' };
}

function setRing(pct: number): void {
  const deg = Math.max(0, Math.min(100, pct)) * 3.6;
  const ring = $('#ring');
  if (ring) {
    ring.style.setProperty('--deg', `${deg}deg`);
    ring.setAttribute('aria-valuenow', String(pct));
  }
  setText('#ring-num', pct);
}

function setBar(pct: number): void {
  const fill = $('#progress-fill');
  if (fill) fill.style.setProperty('--p', `${pct}%`);
  setText('#pct-text', `${pct}%`);
}

function setAvatar(user: User): void {
  const img = $<HTMLImageElement>('#prof-avatar');
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

function renderChips(user: User): void {
  const row = $('#chip-row');
  if (!row) return;
  row.innerHTML = '';
  const make = (text: string): HTMLSpanElement => {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = text;
    return span;
  };
  row.appendChild(make(user.emailVerified ? 'Email verified' : 'Email not verified'));
  const prov = user.providerData.map((p) => p.providerId.replace('.com', '')).join(', ') || 'password';
  row.appendChild(make(`Provider: ${prov}`));
}

function populate(user: User): void {
  setText('#prof-name', user.displayName || user.email?.split('@')[0] || 'Friend');
  setText('#prof-email', user.email || '');
  setText('#joined-at', fmtDate(user.metadata.creationTime));
  setText('#last-login', fmtDate(user.metadata.lastSignInTime));

  setAvatar(user);
  renderChips(user);

  const progress = computeProgressAccurate();
  setText('#mods-done', progress.done);
  setText('#mods-total', progress.total);
  setRing(progress.pct);
  setBar(progress.pct);

  // Settings panel has no markup on this page yet (see file header) — these
  // are no-ops until it exists, same as the source.
  const nameInput = $<HTMLInputElement>('#input-name');
  if (nameInput) nameInput.value = user.displayName || localStorage.getItem(NAME_KEY) || '';
  const photoInput = $<HTMLInputElement>('#input-photo');
  if (photoInput) photoInput.value = user.photoURL || '';
  const verifyBtn = $('#verify-btn');
  if (verifyBtn) verifyBtn.hidden = Boolean(user.emailVerified);
}

// 3 MB cap + image/* content-type check — mirrors the Storage security rules
// in FIREBASE_SETUP.md #2 (avatars/{userId}/{fileName}). Keep these in sync
// with that doc if either side changes.
async function uploadAvatar(file: File, uid: string): Promise<string> {
  if (!/^image\//i.test(file.type)) throw new Error('Please choose an image file.');
  if (file.size > 3 * 1024 * 1024) throw new Error('Image must be under 3 MB.');

  const storage = getStorage();
  const path = `avatars/${uid}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const fileRef = storageRef(storage, path);

  const task = uploadBytesResumable(fileRef, file, { cacheControl: 'public,max-age=31536000' });
  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      () => {
        // No progress UI on this page currently.
      },
      (err) => reject(err),
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve).catch(reject);
      },
    );
  });
}

function wireEvents(): void {
  $('#logout-btn')?.addEventListener('click', async () => {
    try {
      await logout();
      window.location.replace('/');
    } catch {
      showToast('Could not sign out. Try again.');
    }
  });

  $('#edit-open')?.addEventListener('click', () => {
    const settings = $('#settings');
    if (settings) settings.hidden = false;
  });
  $('#edit-cancel')?.addEventListener('click', () => {
    const settings = $('#settings');
    if (settings) settings.hidden = true;
  });

  // Preview selected avatar instantly.
  $<HTMLInputElement>('#input-photo-file')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = $<HTMLImageElement>('#prof-avatar');
    if (img) {
      img.src = url;
      img.hidden = false;
    }
    const initialsEl = $('#prof-initials');
    if (initialsEl) initialsEl.hidden = true;
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  $('#settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const nameInput = $<HTMLInputElement>('#input-name')?.value.trim() ?? '';
    const urlInput = $<HTMLInputElement>('#input-photo')?.value.trim() ?? '';
    const file = $<HTMLInputElement>('#input-photo-file')?.files?.[0];

    try {
      // 1) If a file was chosen, upload it and override urlInput.
      let finalPhotoURL: string | null = urlInput || null;
      if (file) {
        showToast('Uploading avatar…');
        finalPhotoURL = await uploadAvatar(file, user.uid);
      }

      // 2) Update Firebase auth profile.
      await updateProfile(user, {
        displayName: nameInput || null,
        photoURL: finalPhotoURL || null,
      });

      // 2b) Tell the header avatar to refresh (null means "cleared" -> initials).
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { photoURL: finalPhotoURL || null } }));

      // 3) Mirror display name to the certificate name key.
      if (nameInput) {
        try {
          localStorage.setItem(NAME_KEY, nameInput);
        } catch {
          // localStorage may be unavailable; ignore.
        }
      }

      // 4) Refresh UI.
      populate(user);
      const settings = $('#settings');
      if (settings) settings.hidden = true;
      showToast('Profile updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed');
    }
  });

  $('#verify-btn')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await sendEmailVerification(user);
      showToast('Verification email sent.');
      const verifyBtn = $('#verify-btn');
      if (verifyBtn) verifyBtn.hidden = true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send verification email');
    }
  });
}

export function initProfile(): void {
  // Bind once — onAuthStateChanged fires again on every token refresh.
  wireEvents();

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace('/');
      return;
    }
    populate(user);
  });
}
