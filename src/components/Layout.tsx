import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

const NAV: { to: string; label: StringKey }[] = [
  { to: '/explore', label: 'nav.explore' },
  { to: '/artifacts', label: 'nav.artifacts' },
  { to: '/ask', label: 'nav.ask' },
  { to: '/game', label: 'nav.game' },
  { to: '/timeline', label: 'nav.timeline' },
  { to: '/learn', label: 'nav.learn' },
];

function LanguageToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
      aria-label={t('lang.switchLabel')}
      lang={lang === 'en' ? 'bn' : 'en'}
      className="chip min-h-10 border-accent/60 px-3 text-sm text-accent hover:bg-accent hover:text-space"
    >
      🌐 {t('lang.switchTo')}
    </button>
  );
}

export default function Layout() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="stars flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-accent px-4 py-2 text-space focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('nav.skip')}
      </a>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-space/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-wide"
          >
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8" />
            <span lang="en" className="hidden sm:inline">
              Forgotten <span className="text-accent">Explorers</span>
            </span>
          </Link>
          <nav aria-label={t('nav.main')} className="hidden xl:block">
            <ul className="flex gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-raised ${
                        isActive ? 'bg-raised text-accent' : 'text-muted'
                      }`
                    }
                  >
                    {t(item.label)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              type="button"
              className="btn-ghost min-h-10 px-4 xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? t('nav.close') : t('nav.menu')}
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label={t('nav.main')}
            className="border-t border-line bg-space xl:hidden"
          >
            <ul className="container grid gap-1 py-3">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 font-semibold ${isActive ? 'bg-raised text-accent' : ''}`
                    }
                  >
                    {t(item.label)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-line/70 bg-space/90">
        <div className="container grid gap-3 py-8 text-sm text-muted md:flex md:items-center md:justify-between">
          <p className="max-w-3xl">{t('footer.text')}</p>
          <p className="flex shrink-0 gap-4">
            <Link to="/sources" className="underline hover:text-ink">
              {t('footer.sources')}
            </Link>
            <span>
              {t('footer.build')} {__BUILD_ID__}
            </span>
          </p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
