import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getArtifact } from '../data/artifacts';
import { legacy, timeline } from '../data/worlds';
import { PageHeader, SourceLink } from '../components/ui';
import { localizeArtifact, localizeLegacy, localizeTimeline, useLang } from '../i18n';
import { prefersReducedMotion } from '../three/textures';

const FILTERS = [
  { id: 'all', label: 'timeline.all' },
  { id: 'moon', label: 'timeline.moon' },
  { id: 'mars', label: 'timeline.mars' },
  { id: 'space', label: 'timeline.space' },
] as const;

const WORLD_DOT: Record<string, string> = {
  moon: 'bg-moon',
  mars: 'bg-mars',
  'deep-space': 'bg-deep',
  jupiter: 'bg-amber-300',
  venus: 'bg-yellow-200',
  earth: 'bg-sky-400',
};

const FIRST_YEAR = timeline[0].year;
const LAST_YEAR = new Date().getFullYear();

export default function Timeline() {
  const { t, lang, n } = useLang();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [year, setYear] = useState(LAST_YEAR);
  const [playing, setPlaying] = useState(false);

  // "Play history": step through the years automatically.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(
      () =>
        setYear((y) => {
          if (y >= LAST_YEAR) {
            setPlaying(false);
            return y;
          }
          return y + 1;
        }),
      prefersReducedMotion() ? 600 : 250,
    );
    return () => window.clearInterval(id);
  }, [playing]);

  const events = timeline
    .filter((e) =>
      filter === 'all'
        ? true
        : filter === 'space'
          ? !['moon', 'mars'].includes(e.world)
          : e.world === filter,
    )
    .filter((e) => e.year <= year);

  return (
    <>
      <PageHeader eyebrow={t('timeline.eyebrow')} title={t('timeline.title')}>
        {t('timeline.lead')}
      </PageHeader>
      <div className="container">
        <div role="group" aria-label={t('timeline.filter')} className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`chip px-4 py-2 text-sm ${filter === f.id ? 'border-accent bg-accent text-space' : 'hover:border-accent'}`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>

        <div className="card sticky top-20 z-30 mt-6 border-accent/40 bg-surface/95 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="year" className="font-bold">
              {t('timeline.slider')}:{' '}
              <span className="font-display text-2xl text-accent">
                {t('timeline.year', { year: n(year).replace(/,/g, '') })}
              </span>
            </label>
            <button
              type="button"
              className="btn-ghost min-h-10"
              onClick={() => {
                if (!playing && year >= LAST_YEAR) setYear(FIRST_YEAR);
                setPlaying((p) => !p);
              }}
            >
              {playing ? t('timeline.pause') : t('timeline.play')}
            </button>
          </div>
          <input
            id="year"
            type="range"
            min={FIRST_YEAR}
            max={LAST_YEAR}
            value={year}
            onChange={(e) => {
              setPlaying(false);
              setYear(Number(e.target.value));
            }}
            className="mt-3 w-full accent-[rgb(var(--color-accent))]"
            aria-valuetext={String(year)}
          />
          <div className="flex justify-between text-xs text-muted" aria-hidden>
            <span>{n(FIRST_YEAR).replace(/,/g, '')}</span>
            <span>{n(LAST_YEAR).replace(/,/g, '')}</span>
          </div>
          <p className="mt-2 text-sm text-muted" aria-live="polite">
            {t('timeline.showing', { n: n(events.length), year: n(year).replace(/,/g, '') })}
          </p>
        </div>

        <ol className="relative mt-8 border-l-2 border-line pl-6 md:pl-10">
          {events.map((raw) => {
            const e = localizeTimeline(raw, lang);
            const artifact = raw.artifactId ? getArtifact(raw.artifactId) : undefined;
            const name = artifact && localizeArtifact(artifact, lang).shortName;
            return (
              <li key={`${raw.date}-${raw.title}`} className="relative mb-6">
                <span
                  aria-hidden
                  className={`absolute -left-[33px] top-4 h-4 w-4 rounded-full ring-4 ring-space md:-left-[49px] ${WORLD_DOT[e.world]}`}
                />
                <div className={`card ${artifact ? 'border-accent/50' : ''}`}>
                  <p className="text-sm font-bold text-accent">{e.date}</p>
                  <h2 className="mt-1 text-xl font-bold">{e.title}</h2>
                  <p className="mt-1 text-muted">{e.text}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <SourceLink sourceId={e.sourceId} compact />
                    {artifact && (
                      <Link
                        to={`/artifacts/${artifact.id}`}
                        className="chip border-accent/60 text-accent hover:bg-accent hover:text-space"
                      >
                        {t('timeline.read', { icon: artifact.icon, name: name! })}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="mt-14" aria-labelledby="legacy">
          <p className="eyebrow">{t('timeline.legacyEyebrow')}</p>
          <h2 id="legacy" className="mt-2 font-display text-3xl font-bold">
            {t('timeline.legacyTitle')}
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {legacy.map((raw) => {
              const l = localizeLegacy(raw, lang);
              return (
                <li key={raw.from + raw.to} className="card">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    <span>{l.from}</span>
                    <span className="text-accent" aria-label={t('common.ledTo')}>
                      ➜
                    </span>
                    <span>{l.to}</span>
                  </p>
                  <p className="mt-2 text-muted">{l.text}</p>
                  <div className="mt-3">
                    <SourceLink sourceId={l.sourceId} compact />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
