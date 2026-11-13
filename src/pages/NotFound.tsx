import { Link } from 'react-router-dom';
import { useLang } from '../i18n';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="stars flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl" aria-hidden>
        🛰️
      </p>
      <h1 className="font-display text-3xl font-bold">{t('notfound.title')}</h1>
      <p className="max-w-md text-muted">{t('notfound.text')}</p>
      <Link to="/" className="btn-primary">
        {t('notfound.home')}
      </Link>
    </div>
  );
}
