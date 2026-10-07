import { Link, NavLink } from 'react-router-dom';
import { useT } from '../../lib/prefs';
import { ReadingToggle } from './ReadingToggle';

const NAV = [
  { to: '/map', key: 'nav.map' },
  { to: '/finale', key: 'nav.finale' },
  { to: '/sources', key: 'nav.sources' },
  { to: '/about', key: 'nav.about' },
];

export function Header() {
  const t = useT();
  return (
    <header className="site-header">
      <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
        <Link to="/" className="brand">
          {t('app.name')}
        </Link>
        <nav aria-label={t('nav.label')}>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className="nav-link">
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <ReadingToggle />
      </div>
    </header>
  );
}
