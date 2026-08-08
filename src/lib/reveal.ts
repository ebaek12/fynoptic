// Scroll-triggered "arrive late" reveal animations. The legacy inline copies
// (index.html, three near-duplicates around lines 294/298/334, plus js/app.js
// ~278) used `threshold: 0.6` (or 0.45/0.1), which never fires for a section
// taller than the viewport since it can never reach 60% visibility. This
// version uses `threshold: 0` so any intersection at all reveals the section.
const SELECTOR =
  '.fade-up, .reveal, .reveal-up, .reveal-card, .reveal-section, .reveal-prism, .reveal-cta, .reveal-in';

export function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>(SELECTOR);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    },
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
  );

  els.forEach((el) => io.observe(el));
}

const MAX_TILT = 8; // degrees
const MAX_Z = 14; // px

/** Founder-card / partner-cell stagger-in plus desktop-only 3D tilt on pointer move. */
export function initCardReveal(): void {
  const items = document.querySelectorAll<HTMLElement>('.founder-card, .partner-cell');

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.45 }
  );

  items.forEach((el, i) => {
    el.classList.add('reveal-in');
    el.style.transitionDelay = `${Math.min(i * 70, 280)}ms`;
    io.observe(el);
  });

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(pointer: coarse)').matches;
  if (prefersReduced || isTouch) return;

  const cards = document.querySelectorAll<HTMLElement>('.founder-card');

  cards.forEach((card) => {
    const portrait = card.querySelector<HTMLElement>('.portrait');

    const move = (e: PointerEvent): void => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = (y / r.height - 0.5) * -2; // -1..1
      const ry = (x / r.width - 0.5) * 2; // -1..1

      card.style.transform =
        `perspective(900px) rotateX(${rx * MAX_TILT}deg) rotateY(${ry * MAX_TILT}deg) translateZ(${MAX_Z}px)`;
      if (portrait) portrait.style.filter = `saturate(${1 + Math.abs(ry) * 0.12})`;
    };

    const reset = (): void => {
      card.style.transform = '';
      if (portrait) portrait.style.filter = '';
    };

    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', reset);
    card.addEventListener('blur', reset);
  });
}
