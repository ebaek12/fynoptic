// Port of the theme toggle IIFE from js/app.js. Dark-first default,
// persisted via storage.ts, and sets data-theme on both <html> and <body>.

import { getTheme, setTheme, type Theme } from './storage';

export function initTheme(): void {
  const btn = document.getElementById('theme-btn');
  const roots = [document.documentElement, document.body];

  const applyTheme = (mode: Theme): void => {
    roots.forEach((r) => r.setAttribute('data-theme', mode));
    if (btn) {
      btn.textContent = mode === 'light' ? 'Dark' : 'Light';
      btn.setAttribute('aria-pressed', String(mode === 'light'));
      btn.title = `Toggle to ${mode === 'light' ? 'dark' : 'light'} mode`;
    }
  };

  applyTheme(getTheme());

  btn?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next: Theme = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  });
}
