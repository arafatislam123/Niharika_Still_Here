import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePrefs, useT } from '../../lib/prefs';
import { warmOfflineCache } from '../../lib/warmup';

/** Shown only for `?warm=1` (§9.3). */
export function WarmupBanner() {
  const t = useT();
  const { locale } = usePrefs();
  const [params] = useSearchParams();
  const enabled = params.get('warm') === '1';
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setMessage(t('warmup.start'));
    warmOfflineCache(locale, (done, total) => {
      if (!cancelled) setMessage(t('warmup.progress', { done, total }));
    })
      .then(({ total, failed }) => {
        if (cancelled) return;
        setMessage(failed ? t('warmup.failed', { failed, total }) : t('warmup.done', { total }));
      })
      .catch(() => !cancelled && setMessage(t('warmup.error')));
    return () => {
      cancelled = true;
    };
  }, [enabled, locale, t]);

  if (!enabled) return null;
  return (
    <div role="status" className="warmup-banner">
      {message}
    </div>
  );
}
