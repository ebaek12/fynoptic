// Single toast implementation, deduplicating the near-identical copies in
// js/app.js (showToast/initToasts), js/flashcard.js, js/practice.js,
// js/course-one.js and js/articles.js.

export type ToastVariant = 'info' | 'success' | 'error';

function ensureContainer(): HTMLElement {
  let container = document.querySelector<HTMLElement>('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message: string, variant: ToastVariant = 'info'): void {
  const container = ensureContainer();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  if (variant === 'success') el.style.borderLeftColor = 'var(--success-500)';
  if (variant === 'error') el.style.borderLeftColor = 'var(--danger-500)';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function initToasts(): void {
  ensureContainer();
}
