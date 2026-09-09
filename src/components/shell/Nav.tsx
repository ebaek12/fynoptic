import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { ensureAuthReady, initialsFrom } from '@/lib/auth';
import { openAuthDialog } from '@/lib/auth-dialog';
import type { Theme } from '@/lib/storage';
import { setTheme } from '@/lib/storage';
import { themeStore } from '@/lib/theme';

const NAV_LINKS = [
  { href: '/courses', label: 'Course' },
  { href: '/articles', label: 'Articles' },
  { href: '/flashcard', label: 'Flashcards' },
  { href: '/practice', label: 'Practice' },
  { href: '/about', label: 'About' },
];

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Nav() {
  const { user, status } = useAuth();
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const scrollYRef = useRef(0);

  const loading = status === 'loading';
  const signedIn = status === 'in' && !!user;
  const photoURL = signedIn ? (user?.photoURL ?? null) : null;
  const showAvatarImg = !!photoURL && !avatarFailed;

  useEffect(() => {
    void ensureAuthReady();
  }, []);

  // A photoURL that failed to load shouldn't stay "failed" forever — reset
  // when the user (or their photo) actually changes.
  useEffect(() => {
    setAvatarFailed(false);
  }, [photoURL]);

  useEffect(() => {
    // The hydration snapshot is light; read the actual preference before writing.
    const current = themeStore.get();
    document.documentElement.setAttribute('data-theme', current);
    document.body.setAttribute('data-theme', current);
  }, [theme]);

  function openDrawer(): void {
    scrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.classList.add('no-scroll');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.width = '100%';
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    document.body.classList.remove('no-scroll');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollYRef.current);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  function handleThemeToggle(): void {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    document.body.setAttribute('data-theme', next);
    setTheme(next);
    themeStore.set(next);
  }

  function handleUserClick(): void {
    if (loading) return;
    if (signedIn) {
      window.location.href = '/profile';
    } else {
      openAuthDialog('login');
    }
  }

  return (
    <header className="header" role="banner">
      <nav className="nav container" role="navigation" aria-label="Main Navigation">
        <a href="/" className="logo" aria-label="Fynoptic Home">
          <img src="/assets/img/fynopticlogo.png" alt="Fynoptic logo" />
          <span className="logo-text">Fynoptic</span>
        </a>

        <button
          id="nav-toggle"
          className="nav-toggle"
          aria-label="Open Menu"
          aria-controls="mobile-menu"
          aria-expanded={drawerOpen}
          onClick={() => (drawerOpen ? closeDrawer() : openDrawer())}
        >
          <span aria-hidden="true" className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </button>

        <ul className="nav-links" id="desktop-nav">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <button
            id="theme-btn"
            className="btn btn-ghost"
            aria-pressed={theme === 'light'}
            title={`Toggle to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={handleThemeToggle}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            <span className="sr-only">{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          <button
            id="user-btn"
            className="user-icon"
            aria-label={loading ? 'Loading account' : signedIn ? 'Your Profile' : 'Sign In'}
            aria-busy={loading}
            disabled={loading}
            data-modal-open={status === 'out' ? 'login-modal' : undefined}
            onClick={handleUserClick}
          >

            {showAvatarImg && (
              <img
                id="nav-avatar"
                alt=""
                src={photoURL ?? undefined}
                onError={() => setAvatarFailed(true)}
              />
            )}
            <span id="nav-initials" aria-hidden="true" hidden={!signedIn || showAvatarImg}>
              {signedIn ? initialsFrom(user) : ''}
            </span>
            <span id="nav-user-label" hidden={status !== 'out'}>
              Sign In
            </span>
          </button>

          <a href="/courses" className="btn btn-primary cta-desktop" data-track="cta_click">
            Start the Free Course
          </a>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className="mobile-menu"
        hidden={!drawerOpen}
        onClick={(e) => {
          if (e.target instanceof Element && e.target.closest('a')) closeDrawer();
        }}
      >
        <button className="menu-close" aria-label="Close Menu" onClick={closeDrawer}>
          &times;
        </button>
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
          <li>
            <a href="/courses" className="btn btn-primary" data-track="cta_click">
              Start the Free Course
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
