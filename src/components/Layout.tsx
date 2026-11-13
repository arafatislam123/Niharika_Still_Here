import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';
import { BADGES, useProgress } from '../lib/progress';

/** Every section has its own icon and colour, so children can find it without reading. */
const NAV: { to: string; label: StringKey; icon: string; color: string }[] = [
  { to: '/explore', label: 'nav.explore', icon: '🪐', color: '#8fa8ff' },
  { to: '/artifacts', label: 'nav.artifacts', icon: '📖', color: '#ffc94d' },
  { to: '/ask', label: 'nav.ask', icon: '💬', color: '#7df9ff' },
  { to: '/game', label: 'nav.game', icon: '🎮', color: '#ff7a45' },
  { to: '/timeline', label: 'nav.timeline', icon: '⏳', color: '#c9a7ff' },
  { to: '/learn', label: 'nav.learn', icon: '🧠', color: '#6ee7a8' },
];

function LanguageToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
      aria-label={t('lang.switchLabel')}
      lang={lang === 'en' ? 'bn' : 'en'}
      className="chip min-h-11 border-2 border-accent/70 px-3 text-sm text-accent hover:bg-accent hover:text-space"
    >
      🌐 {t('lang.switchTo')}
    </button>
  );
}

/** Badge counter: a little reward that is always in sight. */
function BadgeCounter() {
  const { t, n } = useLang();
  const progress = useProgress();
  const earned = BADGES.filter((b) => b.earned(progress)).length;
  const vars = { n: n(earned), total: n(BADGES.length) };
  return (
    <Link
      to="/learn#badges"
      aria-label={t('badges.chipLabel', vars)}
      title={t('badges.chipLabel', vars)}
      className="chip min-h-11 border-2 border-emerald-400/60 px-3 text-sm text-emerald-200 hover:bg-emerald-400 hover:text-space"
    >
      <span aria-hidden className={earned > 0 ? 'badge-pop' : undefined}>
        🏅
      </span>
      <span aria-hidden>{t('badges.chip', vars)}</span>
    </Link>
  );
}

export default function Layout() {
  const { t } = useLang();

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
            className="flex shrink-0 items-center gap-2 font-display text-xl font-extrabold tracking-wide"
          >
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-9 w-9" />
            <span lang="en" className="hidden sm:inline">
              Still <span className="text-accent">Here</span>
            </span>
            <span className="sr-only sm:hidden">{t('nav.home')}</span>
          </Link>
          <nav aria-label={t('nav.main')} className="hidden xl:block">
            <ul className="flex gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    style={{ ['--nav' as string]: item.color }}
                    className={({ isActive }) =>
                      `nav-pill flex items-center gap-1.5 rounded-full px-3 py-2 font-bold transition ${
                        isActive ? 'nav-pill-active' : 'text-muted hover:text-ink'
                      }`
                    }
                  >
                    <span aria-hidden className="text-lg">
                      {item.icon}
                    </span>
                    {t(item.label)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <BadgeCounter />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-line/70 bg-space/90 pb-24 xl:pb-0">
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

      {/* Phones and tablets: a big, always-visible tab bar with icons, like a kids' app. */}
      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-space/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-6">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                style={{ ['--nav' as string]: item.color }}
                className={({ isActive }) =>
                  `tab-item flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center text-[11px] font-bold leading-tight sm:text-xs ${
                    isActive ? 'tab-item-active' : 'text-muted'
                  }`
                }
              >
                <span aria-hidden className="tab-icon text-2xl leading-none">
                  {item.icon}
                </span>
                <span className="line-clamp-1">{t(item.label)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <ScrollRestoration />
    </div>
  );
}
