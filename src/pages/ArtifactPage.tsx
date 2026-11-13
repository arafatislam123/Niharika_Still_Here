import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { artifacts, getArtifact } from '../data/artifacts';
import { getWorld } from '../data/worlds';
import type { Artifact } from '../data/types';
import AudioClips from '../components/AudioClips';
import NasaGallery from '../components/NasaGallery';
import PioneerTracker from '../components/PioneerTracker';
import { FactCard, ReviewBadge, SourceLink, StatusBadge } from '../components/ui';
import { artifactModelNote, localizeArtifact, localizeWorld, useLang } from '../i18n';
import { useNarration } from '../lib/narration';
import { markLastSignalSeen, markStoryRead } from '../lib/progress';
import { CINEMA_ARTIFACTS } from '../cinema/available';
import NotFound from './NotFound';

const ModelViewer3D = lazy(() => import('../components/ModelViewer3D'));
const CinemaMode = lazy(() => import('../cinema/CinemaMode'));

type Mode = 'read' | 'listen' | 'facts';

const MODES: { id: Mode; icon: string }[] = [
  { id: 'read', icon: '📖' },
  { id: 'listen', icon: '🎧' },
  { id: 'facts', icon: '🔬' },
];

function ImaginedNote() {
  const { t } = useLang();
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-2 text-sm text-muted">
      {t('story.imagined')}
    </p>
  );
}

function ReadMode({ artifact }: { artifact: Artifact }) {
  const { t, n } = useLang();
  const [index, setIndex] = useState(0);
  const chapter = artifact.chapters[index];
  const last = index === artifact.chapters.length - 1;
  useEffect(() => {
    if (last) markStoryRead(artifact.id);
  }, [last, artifact.id]);

  return (
    <div className="grid gap-5">
      <ImaginedNote />
      <article className="card min-h-[260px]" aria-live="polite">
        <p className="eyebrow">
          {t('story.chapterOf', { n: n(index + 1), total: n(artifact.chapters.length) })}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
          {chapter.title.replace(/^[^:]+:\s*/, '')}
        </h2>
        <p className="story-text mt-4">“{chapter.text}”</p>
      </article>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn-ghost"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          {t('story.back')}
        </button>
        <div className="flex gap-2" aria-hidden>
          {artifact.chapters.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-accent' : 'bg-line'}`}
            />
          ))}
        </div>
        {last ? (
          <span className="chip border-emerald-400/60 text-emerald-300">{t('story.complete')}</span>
        ) : (
          <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)}>
            {t('story.next')}
          </button>
        )}
      </div>
    </div>
  );
}

function ListenMode({ artifact }: { artifact: Artifact }) {
  const { t, lang } = useLang();
  const { play, stop, speakingIndex, supported } = useNarration(lang);
  const parts = artifact.chapters.map((c) => `${c.title}. ${c.text}`);
  useEffect(() => {
    if (speakingIndex === artifact.chapters.length - 1) markStoryRead(artifact.id);
  }, [speakingIndex, artifact]);

  return (
    <div className="grid gap-5">
      <ImaginedNote />
      <div className="card flex flex-wrap items-center gap-3">
        {supported ? (
          <>
            {speakingIndex === null ? (
              <button type="button" className="btn-primary" onClick={() => play(parts)}>
                {t('story.play')}
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={stop}>
                {t('story.stop')}
              </button>
            )}
            <p className="text-sm text-muted">
              {lang === 'bn' ? t('story.narrationBnNote') : t('story.narrationNote')}
            </p>
          </>
        ) : (
          <p className="text-muted">{t('story.noNarration')}</p>
        )}
      </div>
      <ol className="grid gap-3">
        {artifact.chapters.map((c, i) => (
          <li
            key={c.title}
            className={`rounded-2xl border p-5 transition ${speakingIndex === i ? 'border-accent bg-raised' : 'border-line bg-surface/70'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold">{c.title}</h3>
              {supported && (
                <button
                  type="button"
                  className="chip shrink-0 hover:border-accent"
                  onClick={() => play(parts, i)}
                  aria-label={t('story.playFrom', { title: c.title })}
                >
                  {t('story.fromHere')}
                </button>
              )}
            </div>
            <p className="story-text mt-2">{c.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FactsMode({ artifact }: { artifact: Artifact }) {
  const { t } = useLang();
  return (
    <div className="grid gap-8">
      {artifact.chapters.map((c) => (
        <section key={c.title} aria-label={c.title}>
          <h3 className="font-display text-xl font-bold">{c.title}</h3>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {c.factIds.map((id) => {
              const f = artifact.facts.find((x) => x.id === id)!;
              return <FactCard key={id} fact={f} />;
            })}
          </ul>
        </section>
      ))}
      <section>
        <h3 className="font-display text-xl font-bold">{t('story.photos')}</h3>
        <p className="mt-1 text-sm text-muted">
          {t('story.photosNote', { query: artifact.imageQuery })}
        </p>
        <div className="mt-4">
          <NasaGallery query={artifact.imageQuery} />
        </div>
      </section>
    </div>
  );
}

function MissionClock({ artifact }: { artifact: Artifact }) {
  const { t, n } = useLang();
  const life = artifact.plannedLife;
  if (!life) return null;
  const ratio = life.actual / life.value;
  const plannedPct = Math.max(2, (life.value / life.actual) * 100);
  const unit = life.unit === 'sols' ? t('unit.sols') : t('unit.months');
  return (
    <section className="card" aria-labelledby="clock">
      <h2 id="clock" className="font-display text-xl font-bold">
        {t('story.clock')}
      </h2>
      <div className="mt-4 grid gap-3 text-sm">
        <div>
          <div className="flex justify-between">
            <span>{t('story.planned')}</span>
            <span>
              {n(life.value)} {unit}
            </span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-raised">
            <div className="h-3 rounded-full bg-sky-400" style={{ width: `${plannedPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between">
            <span>{t('story.actual')}</span>
            <span>{t('story.about', { value: `${n(life.actual)} ${unit}` })}</span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-accent" />
        </div>
      </div>
      <p className="mt-4 text-lg font-bold text-accent">
        {t('story.longer', { ratio: ratio >= 10 ? n(Math.round(ratio)) : n(ratio, 1) })}
      </p>
      <p className="mt-1 text-sm text-muted">{life.note}</p>
    </section>
  );
}

function LastSignal({ artifact }: { artifact: Artifact }) {
  const { t } = useLang();
  const events = artifact.lastSignal;
  const [shown, setShown] = useState(0);
  useEffect(() => setShown(0), [artifact.id]);
  useEffect(() => {
    if (events && shown === events.length) markLastSignalSeen(artifact.id);
  }, [shown, events, artifact.id]);
  if (!events) return null;

  return (
    <section className="card border-accent/40" aria-labelledby="last-signal">
      <p className="eyebrow">{t('story.signalEyebrow')}</p>
      <h2 id="last-signal" className="mt-1 font-display text-2xl font-bold">
        {t('story.signalTitle')}
      </h2>
      <p className="mt-1 text-muted">{t('story.signalLead')}</p>
      <ol className="relative mt-6 grid gap-5 border-l-2 border-line pl-6">
        {events.slice(0, shown).map((e) => (
          <li key={e.date} className="relative">
            <span
              className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-accent bg-space"
              aria-hidden
            />
            <p className="text-sm font-bold text-accent">{e.date}</p>
            <h3 className="font-bold">{e.title}</h3>
            <p className="mt-1">{e.text}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <SourceLink sourceId={e.sourceId} compact />
              {e.verification === 'needs-review' && <ReviewBadge />}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5">
        {shown < events.length ? (
          <button type="button" className="btn-primary" onClick={() => setShown((s) => s + 1)}>
            {shown === 0 ? t('story.signalBegin') : t('story.signalNext')}
          </button>
        ) : (
          <p className="font-display text-lg">
            {t('story.signalEnd', { name: artifact.shortName })}
          </p>
        )}
      </div>
    </section>
  );
}

function LookCloser({ artifact }: { artifact: Artifact }) {
  const { t, lang } = useLang();
  return (
    <section className="card" aria-labelledby="look-closer">
      <h2 id="look-closer" className="font-display text-xl font-bold">
        {t('ar.title')}
      </h2>
      {artifact.model ? (
        <>
          <p className="mt-1 text-sm text-muted">{t('ar.lead')}</p>
          <div className="mt-4">
            <Suspense fallback={<div className="h-[380px] animate-pulse rounded-2xl bg-raised" />}>
              <ModelViewer3D
                src={artifact.model.src}
                name={artifact.name}
                note={artifactModelNote(artifact.id, lang) ?? artifact.model.note}
              />
            </Suspense>
          </div>
          <div className="mt-2">
            <SourceLink sourceId="src-nasa-3d" compact />
          </div>
        </>
      ) : (
        <p className="mt-2 text-muted">{t('ar.noModel', { name: artifact.shortName })}</p>
      )}
    </section>
  );
}

export default function ArtifactPage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();
  const raw = getArtifact(id);
  const [mode, setMode] = useState<Mode>('read');
  const [cinema, setCinema] = useState(false);
  useEffect(() => {
    setMode('read');
    setCinema(false);
  }, [id]);
  if (!raw) return <NotFound />;

  const artifact = localizeArtifact(raw, lang);
  const world = localizeWorld(getWorld(artifact.world)!, lang);
  const index = artifacts.indexOf(raw);
  const next = localizeArtifact(artifacts[(index + 1) % artifacts.length], lang);

  return (
    <div className="container pt-8">
      <nav aria-label={t('story.breadcrumb')} className="text-sm text-muted">
        <Link to="/artifacts" className="hover:text-ink">
          {t('nav.artifacts')}
        </Link>{' '}
        /{' '}
        <Link to={`/explore/${world.id}`} className="hover:text-ink">
          {world.name}
        </Link>
      </nav>

      <header className="mt-4 grid gap-4 md:flex md:items-end md:justify-between">
        <div>
          <p className="eyebrow">
            {artifact.mission} · {artifact.missionPeriod}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
            <span aria-hidden>{artifact.icon} </span>
            {artifact.tagline}
          </h1>
          <p className="mt-2 text-lg text-muted">{artifact.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={artifact.status} />
          <Link to={`/ask?artifact=${artifact.id}`} className="btn-ghost min-h-10">
            {t('story.ask', { name: artifact.shortName })}
          </Link>
        </div>
      </header>
      <p className="mt-3 max-w-3xl rounded-xl bg-raised/60 px-4 py-3 text-sm">
        <strong>{t('story.statusLabel')}</strong> {artifact.statusNote}{' '}
        <strong>{t('story.locationLabel')}</strong> {artifact.location.name}.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {CINEMA_ARTIFACTS.has(artifact.id) && (
            <button
              type="button"
              onClick={() => setCinema(true)}
              className="group mb-5 flex w-full items-center gap-4 rounded-2xl border border-accent/60 bg-gradient-to-r from-raised to-surface p-4 text-left transition hover:border-accent"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-2xl text-space transition group-hover:scale-110">
                ▶
              </span>
              <span>
                <span className="block font-display text-xl font-bold">{t('cinema.button')}</span>
                <span className="text-sm text-muted">{t('cinema.lead')}</span>
              </span>
            </button>
          )}
          <div role="tablist" aria-label={t('story.modes')} className="mb-5 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`btn min-h-10 border ${mode === m.id ? 'border-accent bg-accent text-space' : 'border-line bg-surface hover:border-accent'}`}
              >
                <span aria-hidden>{m.icon}</span> {t(`story.mode.${m.id}`)}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            {mode === 'read' && <ReadMode key={`${artifact.id}-${lang}`} artifact={artifact} />}
            {mode === 'listen' && <ListenMode key={`${artifact.id}-${lang}`} artifact={artifact} />}
            {mode === 'facts' && <FactsMode artifact={artifact} />}
          </div>
        </div>

        <aside className="grid content-start gap-6">
          <MissionClock artifact={artifact} />
          <section className="card">
            <h2 className="font-display text-xl font-bold">{t('story.why')}</h2>
            <p className="mt-2">{artifact.whyItMatters}</p>
          </section>
          {artifact.id === 'apollo-11-descent-stage' && <AudioClips />}
        </aside>
      </div>

      {artifact.id === 'pioneer-10' && (
        <div className="mt-10">
          <PioneerTracker />
        </div>
      )}

      <div className="mt-10">
        <LookCloser artifact={artifact} />
      </div>

      <div className="mt-10">
        {artifact.lastSignal ? (
          <LastSignal artifact={artifact} />
        ) : (
          <section className="card">
            <h2 className="font-display text-xl font-bold">{t('story.noSignalTitle')}</h2>
            <p className="mt-2 text-muted">
              {t('story.noSignalText', { name: artifact.shortName })}
            </p>
          </section>
        )}
      </div>

      {cinema && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] bg-black" />}>
          <CinemaMode artifact={artifact} onClose={() => setCinema(false)} />
        </Suspense>
      )}

      <div className="mt-10 flex justify-end">
        <Link to={`/artifacts/${next.id}`} className="btn-ghost">
          {t('story.nextExplorer', { name: next.shortName })}
        </Link>
      </div>
    </div>
  );
}
