import { Link } from 'react-router-dom';
import { useT } from '../../lib/prefs';

export function Footer() {
  const t = useT();
  return (
    <footer className="site-footer">
      <div className="container flex flex-col gap-2 py-6 text-sm sm:flex-row sm:justify-between">
        <p>{t('footer.disclaimer')}</p>
        <p className="flex gap-4">
          <Link to="/sources" className="link">
            {t('nav.sources')}
          </Link>
          <Link to="/about" className="link">
            {t('nav.about')}
          </Link>
          <span className="muted">{t('footer.build', { id: __BUILD_ID__ })}</span>
        </p>
      </div>
    </footer>
  );
}
