import { lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artifactsIn } from '../data/artifacts';
import { worlds } from '../data/worlds';
import { PageHeader } from '../components/ui';

const SolarSystem = lazy(() => import('../three/SolarSystem'));

export default function Explore() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader eyebrow="3D Explorer" title="Explore the solar system">
        Click the Moon, Mars, or the tiny Pioneer 10 spacecraft far out in deep space to see which
        explorers are resting there.
      </PageHeader>
      <div className="container">
        <Suspense fallback={<div className="h-[65vh] animate-pulse rounded-3xl bg-surface" />}>
          <SolarSystem
            className="h-[65vh] min-h-[400px]"
            onSelect={(w) => navigate(`/explore/${w}`)}
          />
        </Suspense>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {worlds.map((w) => (
            <Link
              key={w.id}
              to={`/explore/${w.id}`}
              className="card transition hover:border-accent"
            >
              <h2 className="font-display text-2xl font-bold" style={{ color: w.color }}>
                {w.name}
              </h2>
              <p className="mt-2 text-muted">{w.description}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {artifactsIn(w.id).map((a) => (
                  <li key={a.id} className="chip">
                    {a.icon} {a.shortName}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
