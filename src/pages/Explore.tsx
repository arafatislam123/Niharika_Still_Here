import { lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artifactsIn } from '../data/artifacts';
import { worlds } from '../data/worlds';
import { PageHeader } from '../components/ui';
import { localizeArtifact, localizeWorld, useLang } from '../i18n';

const SolarSystem = lazy(() => import('../three/SolarSystem'));

export default function Explore() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  return (
    <>
      <PageHeader eyebrow={t('explore.eyebrow')} title={t('explore.title')}>
        {t('explore.lead')}
      </PageHeader>
      <div className="container">
        <Suspense fallback={<div className="h-[65vh] animate-pulse rounded-3xl bg-surface" />}>
          <SolarSystem
            className="h-[65vh] min-h-[400px]"
            onSelect={(w) => navigate(`/explore/${w}`)}
          />
        </Suspense>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {worlds.map((raw) => {
            const w = localizeWorld(raw, lang);
            return (
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
                      {a.icon} {localizeArtifact(a, lang).shortName}
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
