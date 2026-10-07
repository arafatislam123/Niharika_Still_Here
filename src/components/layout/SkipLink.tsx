import { useT } from '../../lib/prefs';

export function SkipLink() {
  const t = useT();
  return (
    <a href="#main" className="skip-link">
      {t('a11y.skip')}
    </a>
  );
}
