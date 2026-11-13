import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/explore', label: 'Explore' },
  { to: '/artifacts', label: 'Artifacts' },
  { to: '/ask', label: 'AI Explorer' },
  { to: '/game', label: 'Mission Game' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/learn', label: 'Learn' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="stars flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-accent px-4 py-2 text-space focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-space/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-lg font-bold tracking-wide"
          >
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8" />
            <span>
              Forgotten <span className="text-accent">Explorers</span>
            </span>
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
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
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            className="btn-ghost min-h-10 px-4 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label="Main"
            className="border-t border-line bg-space lg:hidden"
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
                    {item.label}
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
          <p>
            Built for the NASA Space Apps Challenge 2026. An independent student project:{' '}
            <strong>no NASA endorsement is implied.</strong> Images and data courtesy of NASA.
          </p>
          <p className="flex gap-4">
            <Link to="/sources" className="underline hover:text-ink">
              Sources &amp; credits
            </Link>
            <span aria-label="Build version">build {__BUILD_ID__}</span>
          </p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
