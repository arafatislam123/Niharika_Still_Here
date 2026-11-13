import { lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artifacts, artifactsIn } from '../data/artifacts';
import { worlds } from '../data/worlds';
import { ArtifactCard, SourceLink } from '../components/ui';
import { localizeWorld, useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

const SolarSystem = lazy(() => import('../three/SolarSystem'));

const FEATURES: {
  to: string;
  icon: string;
  key: 'feature.3d' | 'feature.story' | 'feature.ask' | 'feature.game';
}[] = [
  { to: '/explore', icon: '🪐', key: 'feature.3d' },
  { to: '/artifacts', icon: '📖', key: 'feature.story' },
  { to: '/ask', icon: '💬', key: 'feature.ask' },
  { to: '/game', icon: '🎮', key: 'feature.game' },
];

/** Then → Now → Next: how the old missions connect to NASA's current and future work. */
const LEGACY_ROWS: {
  world: 'moon' | 'mars' | 'deep';
  icon: string;
  link: string;
  sources: [string, string, string];
}[] = [
  {
    world: 'moon',
    icon: '🌕',
    link: '/artifacts/apollo-11-descent-stage',
    sources: ['src-apollo-lrrr', 'src-artemis1', 'src-artemis'],
  },
  {
    world: 'mars',
    icon: '🔴',
    link: '/explore/mars',
    sources: ['src-phoenix', 'src-perseverance', 'src-perseverance'],
  },
  {
    world: 'deep',
    icon: '🛰️',
    link: '/explore/deep-space',
    sources: ['src-pioneer10', 'src-voyager', 'src-horizons'],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { t, lang, n } = useLang();

  return (
    <>
      <section className="container grid items-center gap-8 pb-10 pt-10 lg:grid-cols-[1fr_1.4fr] lg:pt-16">
        <div>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-6xl">
            {t('home.title1')}
            <br />
            <span className="text-accent">{t('home.title2')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t('home.lead')}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/explore" className="btn-primary">
              {t('home.cta')}
            </Link>
            <Link to="/artifacts/opportunity" className="btn-ghost">
              {t('home.meet')}
            </Link>
          </div>
        </div>
        <Suspense
          fallback={<div className="h-[60vh] min-h-[380px] animate-pulse rounded-3xl bg-surface" />}
        >
          <SolarSystem onSelect={(w) => navigate(`/explore/${w}`)} />
        </Suspense>
      </section>

      <section className="container py-10" aria-labelledby="destinations">
        <h2 id="destinations" className="font-display text-3xl font-bold">
          {t('home.destinations')}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {worlds.map((raw) => {
            const w = localizeWorld(raw, lang);
            const count = artifactsIn(w.id).length;
            return (
              <Link
                key={w.id}
                to={`/explore/${w.id}`}
                className="card group relative overflow-hidden transition hover:-translate-y-1 hover:border-accent"
              >
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-80 blur-[1px]"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, white, ${w.color} 45%, #000 100%)`,
                  }}
                />
                <p className="eyebrow">
                  {t(count === 1 ? 'home.explorer1' : 'home.explorers', { n: n(count) })}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold group-hover:text-accent">
                  {w.name}
                </h3>
                <p className="mt-2 max-w-[75%] text-muted">{w.tagline}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container py-10" aria-labelledby="features">
        <h2 id="features" className="font-display text-3xl font-bold">
          {t('home.features')}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.to}>
              <Link to={f.to} className="card block h-full transition hover:border-accent">
                <span className="text-3xl" aria-hidden>
                  {f.icon}
                </span>
                <h3 className="mt-3 text-lg font-bold">{t(`${f.key}.title`)}</h3>
                <p className="mt-1 text-muted">{t(`${f.key}.text`)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container py-10" aria-labelledby="then-now-next">
        <p className="eyebrow">{t('next.eyebrow')}</p>
        <h2 id="then-now-next" className="mt-2 font-display text-3xl font-bold">
          {t('next.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{t('next.lead')}</p>
        <div className="mt-6 grid gap-6">
          {LEGACY_ROWS.map((row) => (
            <ol key={row.world} className="grid gap-3 md:grid-cols-3">
              {(['then', 'now', 'next'] as const).map((step, i) => {
                const body = (
                  <>
                    <p className="eyebrow">
                      <span aria-hidden>{row.icon} </span>
                      {t(`next.${step}`)}
                    </p>
                    <p className="mt-2">{t(`next.${row.world}.${step}` as StringKey)}</p>
                  </>
                );
                return (
                  <li
                    key={step}
                    className={`card relative ${step === 'now' ? 'border-accent/50' : ''}`}
                  >
                    {step === 'next' ? (
                      <Link to={row.link} className="block hover:text-accent">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                    <div className="mt-3">
                      <SourceLink sourceId={row.sources[i]} compact />
                    </div>
                    {i < 2 && (
                      <span
                        aria-hidden
                        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-2xl text-accent md:block"
                      >
                        ➜
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          ))}
        </div>
      </section>

      <section className="container py-10" aria-labelledby="explorers">
        <div className="flex items-end justify-between gap-4">
          <h2 id="explorers" className="font-display text-3xl font-bold">
            {t('home.meetExplorers')}
          </h2>
          <Link to="/artifacts" className="text-sm font-semibold text-accent">
            {t('common.seeAll')}
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((a) => (
            <ArtifactCard key={a.id} artifact={a} />
          ))}
        </div>
      </section>

      <section className="container py-10">
        <blockquote className="card text-center">
          <p className="font-display text-2xl md:text-3xl">{t('home.quote')}</p>
        </blockquote>
      </section>
    </>
  );
}
