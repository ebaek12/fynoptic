// Back-to-top button, deduplicating the inline copy in courses.html
// (#back-to-top) and js/articles.js (#float-top). Both show the button past
// scrollY 600 and smooth-scroll to top on click.

export function initBackToTop(): void {
  const btn = document.getElementById('back-to-top') ?? document.getElementById('float-top');
  if (!btn) return;

  const onScroll = (): void => {
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.classList.toggle('show', y > 600);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
