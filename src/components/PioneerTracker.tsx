/**
 * "Where is Pioneer 10 right now?" Uses the JPL Horizons snapshot fetched at build time
 * (scripts/fetch-horizons.mjs) and moves it forward to the current moment using the
 * spacecraft's speed, updating every second.
 */
import { useEffect, useState } from 'react';
import position from '../data/pioneerPosition.json';
import { useLang } from '../i18n';
import { SourceLink } from './ui';

const KM_PER_AU = 149_597_870.7;
const SECONDS_PER_DAY = 86_400;
const LIGHT_KM_S = 299_792.458;

export function pioneerNow(at: number) {
  const days = (at - Date.parse(position.epoch)) / (SECONDS_PER_DAY * 1000);
  const au = position.distanceAu + position.rangeRateAuPerDay * days;
  return {
    au,
    km: au * KM_PER_AU,
    lightHours: (au * KM_PER_AU) / LIGHT_KM_S / 3600,
    speedKmS: (position.rangeRateAuPerDay * KM_PER_AU) / SECONDS_PER_DAY,
  };
}

export default function PioneerTracker() {
  const { t, n, lang } = useLang();
  const [opened] = useState(() => Date.now());
  const [now, setNow] = useState(opened);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const p = pioneerNow(now);
  const since = p.km - pioneerNow(opened).km;
  const dataDate = new Date(position.epoch).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const stats = [
    {
      label: t('tracker.distance'),
      value: t('tracker.au', { au: n(p.au, 2) }),
      sub: t('tracker.km', { km: n(p.km / 1e9, 1) }),
    },
    { label: t('tracker.light'), value: t('tracker.lightValue', { h: n(p.lightHours, 1) }) },
    { label: t('tracker.speed'), value: t('tracker.speedValue', { kms: n(p.speedKmS, 1) }) },
    { label: t('tracker.since'), value: t('tracker.sinceValue', { km: n(since) }), live: true },
  ];

  return (
    <section className="card border-deep/50" aria-labelledby="tracker-title">
      <p className="eyebrow text-deep">{t('tracker.eyebrow')}</p>
      <h2 id="tracker-title" className="mt-1 font-display text-2xl font-bold">
        🛰️ {t('tracker.title')}
      </h2>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-raised/70 p-4">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd
              className={`mt-1 font-display text-2xl font-bold ${s.live ? 'text-accent tabular-nums' : ''}`}
            >
              {s.value}
            </dd>
            {s.sub && <dd className="text-sm text-muted">{s.sub}</dd>}
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted">{t('tracker.note', { date: dataDate })}</p>
      <div className="mt-3">
        <SourceLink sourceId="src-horizons" compact />
      </div>
    </section>
  );
}
