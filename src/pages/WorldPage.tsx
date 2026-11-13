import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { artifactsIn } from '../data/artifacts';
import { getWorld } from '../data/worlds';
import type { Artifact } from '../data/types';
import { PageHeader, StatusBadge } from '../components/ui';
import NotFound from './NotFound';

const PlanetGlobe = lazy(() => import('../three/PlanetGlobe'));

function formatCoords(a: Artifact) {
  const { lat, lon } = a.location;
  if (lat === undefined || lon === undefined) return null;
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
}

/** Deep space has no surface, so we show distance on a (logarithmic) ruler instead. */
function DeepSpaceRuler() {
  const marks = [
    { name: 'Earth', au: 1 },
    { name: 'Jupiter', au: 5.2 },
    { name: 'Neptune', au: 30 },
    { name: 'Pioneer 10’s last signal', au: 80, highlight: true },
  ];
  const pos = (au: number) => (Math.log10(au) / Math.log10(100)) * 100;
  return (
    <div className="card">
      <h2 className="font-display text-xl font-bold">How far is deep space?</h2>
      <p className="mt-1 text-muted">
        1 AU is the distance from the Sun to Earth, about 150 million km. This ruler is stretched
        (logarithmic) so everything fits.
      </p>
      <div
        className="relative mt-12 h-2 rounded-full bg-gradient-to-r from-amber-300 via-sky-500 to-indigo-900"
        role="img"
        aria-label="Pioneer 10 was about 80 times farther from the Sun than Earth when it last called home."
      >
        {marks.map((m) => (
          <div
            key={m.name}
            className="absolute -top-2 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${pos(m.au)}%` }}
          >
            <span className={`h-6 w-1 rounded ${m.highlight ? 'bg-accent' : 'bg-ink'}`} />
            <span
              className={`mt-1 w-24 text-center text-xs ${m.highlight ? 'font-bold text-accent' : 'text-muted'}`}
            >
              {m.name}
              <br />
              {m.au} AU
            </span>
          </div>
        ))}
      </div>
      <p className="mt-16 text-sm text-muted">
        Pioneer 10 was about 12.2 billion km away, roughly 80 AU, when Earth heard it for the last
        time in 2003. Radio signals took over 11 hours to cross that distance.
      </p>
    </div>
  );
}

export default function WorldPage() {
  const { world: worldId = '' } = useParams();
  const world = getWorld(worldId);
  const list = artifactsIn(worldId);
  const [selectedId, setSelectedId] = useState<string | undefined>(list[0]?.id);
  if (!world) return <NotFound />;
  const selected = list.find((a) => a.id === selectedId) ?? list[0];

  return (
    <>
      <PageHeader eyebrow="Mission Memory Map" title={world.name}>
        {world.description}
      </PageHeader>
      <div className="container grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {worldId === 'deep-space' ? (
            <DeepSpaceRuler />
          ) : (
            <Suspense fallback={<div className="h-[55vh] animate-pulse rounded-3xl bg-surface" />}>
              <PlanetGlobe
                look={worldId as 'moon' | 'mars'}
                artifacts={list}
                selectedId={selected?.id}
                onSelect={setSelectedId}
              />
            </Suspense>
          )}
        </div>

        <div className="grid content-start gap-4">
          <h2 className="font-display text-xl font-bold">Explorers here</h2>
          <ul className="grid gap-2" aria-label={`Explorers on ${world.name}`}>
            {list.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  aria-pressed={selected?.id === a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selected?.id === a.id
                      ? 'border-accent bg-raised'
                      : 'border-line bg-surface hover:border-accent/60'
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    {a.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold">{a.name}</span>
                    <span className="text-sm text-muted">{a.missionPeriod}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <article className="card" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.status} />
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold">{selected.name}</h3>
              <p className="mt-1 italic text-muted">“{selected.tagline}”</p>
              <dl className="mt-4 grid gap-2 text-sm">
                <div>
                  <dt className="font-semibold text-accent">Where it is</dt>
                  <dd>
                    {selected.location.name}
                    {formatCoords(selected) && (
                      <span className="text-muted"> ({formatCoords(selected)})</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-accent">Status</dt>
                  <dd>{selected.statusNote}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/artifacts/${selected.id}`} className="btn-primary">
                  Read its story
                </Link>
                <Link to={`/ask?artifact=${selected.id}`} className="btn-ghost">
                  Ask {selected.shortName}
                </Link>
              </div>
            </article>
          )}
        </div>
      </div>
    </>
  );
}
