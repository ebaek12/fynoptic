// Port of the mobile nav drawer from js/app.js's tail: the iOS-safe
// scroll-lock-via-fixed-position technique plus Escape/backdrop-tap close.

export function initNav(): void {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('mobile-menu');
  if (!toggle || !drawer) return;

  let scrollY = 0;

  const openMenu = (): void => {
    drawer.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');

    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.classList.add('no-scroll');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  };

  const closeMenu = (): void => {
    drawer.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');

    document.body.classList.remove('no-scroll');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else openMenu();
  });

  // close on any link tap inside drawer
  drawer.addEventListener('click', (e: MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('a')) closeMenu();
  });

  // close on ESC
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !drawer.hidden) closeMenu();
  });

  // the drawer's "X" re-uses the same close
  const menuClose = drawer.querySelector('.menu-close');
  menuClose?.addEventListener('click', closeMenu);
}
