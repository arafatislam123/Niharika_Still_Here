import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { artifactsIn } from '../data/artifacts';
import { getWorld } from '../data/worlds';
import type { Artifact } from '../data/types';
import PioneerTracker, { pioneerNow } from '../components/PioneerTracker';
import { PageHeader, StatusBadge } from '../components/ui';
import { localizeArtifact, localizeWorld, useLang } from '../i18n';
import NotFound from './NotFound';

const PlanetGlobe = lazy(() => import('../three/PlanetGlobe'));

/** Deep space has no surface, so we show distance on a (logarithmic) ruler instead. */
function DeepSpaceRuler() {
  const { t, n } = useLang();
  const todayAu = pioneerNow(Date.now()).au;
  const marks = [
    { name: t('ruler.earth'), au: 1 },
    { name: t('ruler.jupiter'), au: 5.2 },
    { name: t('ruler.neptune'), au: 30 },
    { name: t('ruler.lastSignal'), au: 80, dim: true },
    { name: t('ruler.today'), au: todayAu, highlight: true },
  ];
  const max = 200;
  const pos = (au: number) => (Math.log10(au) / Math.log10(max)) * 100;
  return (
    <div className="card">
      <h2 className="font-display text-xl font-bold">{t('ruler.title')}</h2>
      <p className="mt-1 text-muted">{t('ruler.lead')}</p>
      <div
        className="relative mx-6 mt-12 h-2 rounded-full bg-gradient-to-r from-amber-300 via-sky-500 to-indigo-900"
        role="img"
        aria-label={t('ruler.aria')}
      >
        {marks.map((m, i) => (
          <div
            key={m.name}
            className={`absolute flex -translate-x-1/2 flex-col items-center ${i % 2 ? 'top-4' : '-top-2'}`}
            style={{ left: `${pos(m.au)}%` }}
          >
            <span
              className={`h-6 w-1 rounded ${m.highlight ? 'bg-accent' : m.dim ? 'bg-muted' : 'bg-ink'}`}
            />
            <span
              className={`mt-1 w-20 text-center text-xs ${m.highlight ? 'font-bold text-accent' : 'text-muted'}`}
            >
              {m.name}
              <br />
              {n(m.au, m.au < 10 && m.au % 1 ? 1 : 0)} AU
            </span>
          </div>
        ))}
      </div>
      <div className="h-24" />
    </div>
  );
}

function ArtifactDetails({ artifact }: { artifact: Artifact }) {
  const { t, n } = useLang();
  const { lat, lon } = artifact.location;
  const coords =
    lat !== undefined && lon !== undefined
      ? `${n(Math.abs(lat), 2)}° ${lat >= 0 ? 'N' : 'S'}, ${n(Math.abs(lon), 2)}° ${lon >= 0 ? 'E' : 'W'}`
      : null;
  const life = artifact.plannedLife;
  const discovery = artifact.facts.find((f) => f.topic === 'discovery');
  const unit = (v: number, u: string) =>
    `${n(v)} ${u === 'sols' ? t('unit.sols') : u === 'months' ? t('unit.months') : u}`;

  return (
    <article className="card" aria-live="polite">
      <StatusBadge status={artifact.status} />
      <h3 className="mt-3 font-display text-2xl font-bold">{artifact.name}</h3>
      <p className="mt-1 italic text-muted">“{artifact.tagline}”</p>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-semibold text-accent">{t('world.period')}</dt>
          <dd>
            {artifact.mission} · {artifact.missionPeriod}
          </dd>
        </div>
        {life && (
          <div>
            <dt className="font-semibold text-accent">{t('world.lifetime')}</dt>
            <dd>
              {t('world.lifetimeValue', {
                planned: unit(life.value, life.unit),
                actual: unit(life.actual, life.unit),
              })}
            </dd>
          </div>
        )}
        {discovery && (
          <div>
            <dt className="font-semibold text-accent">{t('world.discovery')}</dt>
            <dd>{discovery.text}</dd>
          </div>
        )}
        <div>
          <dt className="font-semibold text-accent">{t('world.where')}</dt>
          <dd>
            {artifact.location.name}
            {coords && <span className="text-muted"> ({coords})</span>}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-accent">{t('world.status')}</dt>
          <dd>{artifact.statusNote}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/artifacts/${artifact.id}`} className="btn-primary">
          {t('world.read')}
        </Link>
        <Link to={`/ask?artifact=${artifact.id}`} className="btn-ghost">
          {t('world.ask', { name: artifact.shortName })}
        </Link>
      </div>
    </article>
  );
}

export default function WorldPage() {
  const { world: worldId = '' } = useParams();
  const { t, lang } = useLang();
  const raw = getWorld(worldId);
  const list = artifactsIn(worldId).map((a) => localizeArtifact(a, lang));
  const [selectedId, setSelectedId] = useState<string | undefined>(list[0]?.id);
  if (!raw) return <NotFound />;
  const world = localizeWorld(raw, lang);
  const selected = list.find((a) => a.id === selectedId) ?? list[0];

  return (
    <>
      <PageHeader
        icon={world.id === 'moon' ? '🌕' : world.id === 'mars' ? '🔴' : '🛰️'}
        tip={t('tip.world')}
        eyebrow={t('world.eyebrow')}
        title={world.name}
      >
        {world.description}
      </PageHeader>
      <div className="container grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          {worldId === 'deep-space' ? (
            <>
              <PioneerTracker />
              <DeepSpaceRuler />
            </>
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
          <h2 className="font-display text-xl font-bold">{t('world.here')}</h2>
          <ul className="grid gap-2" aria-label={t('world.listLabel', { world: world.name })}>
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
          {selected && <ArtifactDetails artifact={selected} />}
        </div>
      </div>
    </>
  );
}
