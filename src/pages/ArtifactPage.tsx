import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { artifacts, getArtifact } from '../data/artifacts';
import { getWorld } from '../data/worlds';
import type { Artifact } from '../data/types';
import NasaGallery from '../components/NasaGallery';
import { FactCard, SourceLink, StatusBadge } from '../components/ui';
import { useNarration } from '../lib/narration';
import { markLastSignalSeen, markStoryRead } from '../lib/progress';
import NotFound from './NotFound';

type Mode = 'read' | 'listen' | 'facts';

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: 'read', label: 'Read Story', icon: '📖' },
  { id: 'listen', label: 'Listen Story', icon: '🎧' },
  { id: 'facts', label: 'Explore Facts', icon: '🔬' },
];

function ImaginedNote() {
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-2 text-sm text-muted">
      ✨ <strong>Imagined voice.</strong> The explorer “speaks” to make the story fun, but every
      event in it comes from NASA records. Switch to <em>Explore Facts</em> to see the sources.
    </p>
  );
}

function ReadMode({ artifact }: { artifact: Artifact }) {
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
          Chapter {index + 1} of {artifact.chapters.length}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
          {chapter.title.replace(/^Chapter \d+: /, '')}
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
          ← Back
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
          <span className="chip border-emerald-400/60 text-emerald-300">✓ Story complete</span>
        ) : (
          <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function ListenMode({ artifact }: { artifact: Artifact }) {
  const { play, stop, speakingIndex, supported } = useNarration();
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
                ▶ Play the story
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={stop}>
                ■ Stop
              </button>
            )}
            <p className="text-sm text-muted">
              Narration uses your device’s built-in voice. The words are shown below as they are
              read.
            </p>
          </>
        ) : (
          <p className="text-muted">
            Your browser does not support narration. You can still read along below.
          </p>
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
                  className="chip hover:border-accent"
                  onClick={() => play(parts, i)}
                  aria-label={`Play from ${c.title}`}
                >
                  ▶ From here
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
        <h3 className="font-display text-xl font-bold">Photos from the NASA Image Library</h3>
        <p className="mt-1 text-sm text-muted">
          Live search results for “{artifact.imageQuery}”. Click a photo to see its full NASA record
          and credit.
        </p>
        <div className="mt-4">
          <NasaGallery query={artifact.imageQuery} />
        </div>
      </section>
    </div>
  );
}

function MissionClock({ artifact }: { artifact: Artifact }) {
  const life = artifact.plannedLife;
  if (!life) return null;
  const ratio = life.actual / life.value;
  const plannedPct = Math.max(2, (life.value / life.actual) * 100);
  return (
    <section className="card" aria-labelledby="clock">
      <h2 id="clock" className="font-display text-xl font-bold">
        ⏱ Mission clock
      </h2>
      <div className="mt-4 grid gap-3 text-sm">
        <div>
          <div className="flex justify-between">
            <span>Planned</span>
            <span>
              {life.value.toLocaleString()} {life.unit}
            </span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-raised">
            <div className="h-3 rounded-full bg-sky-400" style={{ width: `${plannedPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between">
            <span>Actually worked</span>
            <span>
              about {life.actual.toLocaleString()} {life.unit}
            </span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-accent" />
        </div>
      </div>
      <p className="mt-4 text-lg font-bold text-accent">
        That’s about {ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× longer than planned!
      </p>
      <p className="mt-1 text-sm text-muted">{life.note}</p>
    </section>
  );
}

function LastSignal({ artifact }: { artifact: Artifact }) {
  const events = artifact.lastSignal;
  const [shown, setShown] = useState(0);
  useEffect(() => setShown(0), [artifact.id]);
  useEffect(() => {
    if (events && shown === events.length) markLastSignalSeen(artifact.id);
  }, [shown, events, artifact.id]);
  if (!events) return null;

  return (
    <section className="card border-accent/40" aria-labelledby="last-signal">
      <p className="eyebrow">Special story mode</p>
      <h2 id="last-signal" className="mt-1 font-display text-2xl font-bold">
        📡 The Last Signal
      </h2>
      <p className="mt-1 text-muted">
        Step through the final days of the mission, one moment at a time.
      </p>
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
              {e.verification === 'needs-review' && (
                <span className="chip border-amber-400/50 text-amber-200">
                  ⚠ Being double-checked
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5">
        {shown < events.length ? (
          <button type="button" className="btn-primary" onClick={() => setShown((s) => s + 1)}>
            {shown === 0 ? 'Begin ▶' : 'What happened next? ▶'}
          </button>
        ) : (
          <p className="font-display text-lg">
            The signal is gone, but {artifact.shortName}’s discoveries are still part of science.
          </p>
        )}
      </div>
    </section>
  );
}

export default function ArtifactPage() {
  const { id = '' } = useParams();
  const artifact = getArtifact(id);
  const [mode, setMode] = useState<Mode>('read');
  useEffect(() => setMode('read'), [id]);
  if (!artifact) return <NotFound />;

  const world = getWorld(artifact.world)!;
  const index = artifacts.indexOf(artifact);
  const next = artifacts[(index + 1) % artifacts.length];

  return (
    <div className="container pt-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to="/artifacts" className="hover:text-ink">
          Artifacts
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
            💬 Ask {artifact.shortName}
          </Link>
        </div>
      </header>
      <p className="mt-3 max-w-3xl rounded-xl bg-raised/60 px-4 py-3 text-sm">
        <strong>Status:</strong> {artifact.statusNote} <strong>Location:</strong>{' '}
        {artifact.location.name}.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div role="tablist" aria-label="Story mode" className="mb-5 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`btn min-h-10 border ${mode === m.id ? 'border-accent bg-accent text-space' : 'border-line bg-surface hover:border-accent'}`}
              >
                <span aria-hidden>{m.icon}</span> {m.label}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            {mode === 'read' && <ReadMode key={artifact.id} artifact={artifact} />}
            {mode === 'listen' && <ListenMode key={artifact.id} artifact={artifact} />}
            {mode === 'facts' && <FactsMode artifact={artifact} />}
          </div>
        </div>

        <aside className="grid content-start gap-6">
          <MissionClock artifact={artifact} />
          <section className="card">
            <h2 className="font-display text-xl font-bold">🌟 Why it still matters</h2>
            <p className="mt-2">{artifact.whyItMatters}</p>
          </section>
        </aside>
      </div>

      <div className="mt-10">
        {artifact.lastSignal ? (
          <LastSignal artifact={artifact} />
        ) : (
          <section className="card">
            <h2 className="font-display text-xl font-bold">📡 No “last signal” here</h2>
            <p className="mt-2 text-muted">
              {artifact.shortName} was never meant to call home after its job was done. It was left
              behind on purpose.
            </p>
          </section>
        )}
      </div>

      <div className="mt-10 flex justify-end">
        <Link to={`/artifacts/${next.id}`} className="btn-ghost">
          Next explorer: {next.shortName} →
        </Link>
      </div>
    </div>
  );
}
