import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artifacts, artifactsIn } from '../data/artifacts';
import { worlds } from '../data/worlds';
import { GuideTip } from '../components/Guide';
import { ArtifactCard, SourceLink } from '../components/ui';
import { localizeArtifact, localizeWorld, useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';
import { useProgress, type Progress } from '../lib/progress';

const SolarSystem = lazy(() => import('../three/SolarSystem'));

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

/** Five learning steps, ticked off from the progress the site already records. */
const PATH: {
  id: 'story' | 'signal' | 'ask' | 'game' | 'quiz';
  icon: string;
  to: string;
  color: string;
  done: (p: Progress) => boolean;
}[] = [
  {
    id: 'story',
    icon: '📖',
    to: '/artifacts',
    color: '#ffc94d',
    done: (p) => p.storiesRead.length > 0,
  },
  {
    id: 'signal',
    icon: '📡',
    to: '/artifacts/opportunity',
    color: '#8fa8ff',
    done: (p) => p.lastSignalsSeen.length > 0,
  },
  { id: 'ask', icon: '💬', to: '/ask', color: '#7df9ff', done: (p) => p.questionsAsked > 0 },
  { id: 'game', icon: '🎮', to: '/game', color: '#ff7a45', done: (p) => p.gameMissions.length > 0 },
  {
    id: 'quiz',
    icon: '🧠',
    to: '/learn',
    color: '#6ee7a8',
    done: (p) => Object.keys(p.quizScores).length > 0,
  },
];

function MissionPath() {
  const { t, n } = useLang();
  const progress = useProgress();
  const doneCount = PATH.filter((s) => s.done(progress)).length;
  return (
    <section className="container py-10" aria-labelledby="mission-path">
      <div className="card border-2 border-accent/40">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="mission-path" className="font-display text-3xl font-extrabold">
              🗺️ {t('path.title')}
            </h2>
            <p className="mt-1 text-muted">{t('path.lead')}</p>
          </div>
          <p className="text-lg font-extrabold text-accent">
            {t('path.progress', { n: n(doneCount), total: n(PATH.length) })}
          </p>
        </div>
        <div
          className="mt-4 h-4 overflow-hidden rounded-full bg-raised"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={PATH.length}
          aria-valuenow={doneCount}
          aria-label={t('path.title')}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent via-mars to-emerald-400 transition-all duration-700"
            style={{ width: `${(doneCount / PATH.length) * 100}%` }}
          />
        </div>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PATH.map((step, i) => {
            const done = step.done(progress);
            return (
              <li key={step.id}>
                <Link
                  to={step.to}
                  className={`step-card group flex h-full flex-col rounded-2xl border-2 p-4 transition hover:-translate-y-1 ${
                    done ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-line bg-raised/60'
                  }`}
                  style={{ ['--step' as string]: step.color }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      aria-hidden
                      className="grid h-12 w-12 place-items-center rounded-full text-2xl"
                      style={{ background: `${step.color}33` }}
                    >
                      {step.icon}
                    </span>
                    <span className="text-2xl font-extrabold text-muted/60">{n(i + 1)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold">{t(`path.${step.id}.title`)}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted">{t(`path.${step.id}.text`)}</p>
                  <span
                    className={`mt-3 text-sm font-extrabold ${done ? 'text-emerald-300' : 'text-accent group-hover:underline'}`}
                  >
                    {done ? t('path.done') : t('path.go')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        {doneCount === PATH.length && (
          <p className="mt-5 rounded-2xl bg-emerald-400/15 p-4 text-center text-lg font-bold text-emerald-200">
            {t('path.allDone')}
          </p>
        )}
      </div>
    </section>
  );
}

/** A random checked fact from the explorers, with its NASA source. */
function DidYouKnow() {
  const { t, lang } = useLang();
  const facts = useMemo(
    () =>
      artifacts.flatMap((raw) => {
        const a = localizeArtifact(raw, lang);
        return a.facts
          .filter((f) => f.verification !== 'needs-review')
          .map((f) => ({ ...f, icon: a.icon, name: a.shortName, id: a.id }));
      }),
    [lang],
  );
  const [index, setIndex] = useState(() => Math.floor(Math.random() * 1000));
  const fact = facts[index % facts.length];
  if (!fact) return null;
  return (
    <section className="container py-6" aria-labelledby="did-you-know">
      <div className="card relative overflow-hidden border-2 border-deep/50 bg-gradient-to-br from-raised to-surface">
        <span aria-hidden className="absolute -right-4 -top-6 text-[7rem] opacity-15">
          💡
        </span>
        <h2 id="did-you-know" className="font-display text-2xl font-extrabold text-deep">
          💡 {t('dyk.title')}
        </h2>
        <p className="mt-3 max-w-3xl text-xl leading-relaxed" aria-live="polite">
          <span aria-hidden>{fact.icon} </span>
          <Link to={`/artifacts/${fact.id}`} className="font-bold text-accent hover:underline">
            {fact.name}:
          </Link>{' '}
          {fact.text}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setIndex((i) => i + 1 + Math.floor(Math.random() * (facts.length - 1)))}
          >
            {t('dyk.next')}
          </button>
          <SourceLink sourceId={fact.sourceId} compact />
        </div>
      </div>
    </section>
  );
}

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
          <div className="mt-6">
            <GuideTip big>
              <strong className="text-accent">{t('home.hello')}</strong> {t('home.orbi')}
            </GuideTip>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/explore" className="btn-primary btn-big">
              🚀 {t('home.cta')}
            </Link>
            <Link to="/artifacts/opportunity" className="btn-ghost btn-big">
              🤖 {t('home.meet')}
            </Link>
          </div>
        </div>
        <Suspense
          fallback={<div className="h-[60vh] min-h-[380px] animate-pulse rounded-3xl bg-surface" />}
        >
          <SolarSystem onSelect={(w) => navigate(`/explore/${w}`)} />
        </Suspense>
      </section>

      <MissionPath />
      <DidYouKnow />

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
