import { lazy, Suspense, useMemo, useState } from 'react';
import { MISSIONS } from '../games/missions';
import { initialQuality, saveQuality, type Quality } from '../games/quality';
import { PageHeader } from '../components/ui';
import { localizeMission, useLang } from '../i18n';
import { completeMission, useProgress } from '../lib/progress';

const RoverGame = lazy(() => import('../games/RoverGame'));

export default function GamePage() {
  const { t, lang, n } = useLang();
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [run, setRun] = useState(0);
  const [quality, setQuality] = useState<Quality>(initialQuality);
  const progress = useProgress();
  // Memoised: the game scene restarts whenever the mission object changes.
  const mission = useMemo(
    () =>
      localizeMission(
        MISSIONS.find((m) => m.id === missionId)!,
        lang,
      ),
    [missionId, lang],
  );

  return (
    <>
      <PageHeader eyebrow={t('game.eyebrow')} title={t('game.title')}>
        {t('game.lead')}
      </PageHeader>
      <div className="container">
        <div role="group" aria-label={t('game.choose')} className="grid gap-3 md:grid-cols-3">
          {MISSIONS.map((raw) => {
            const m = localizeMission(raw, lang);
            const done = progress.gameMissions.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={m.id === missionId}
                onClick={() => {
                  setMissionId(m.id);
                  setRun((r) => r + 1);
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  m.id === missionId
                    ? 'border-accent bg-raised'
                    : 'border-line bg-surface hover:border-accent/60'
                }`}
              >
                <p className="eyebrow">
                  {t('game.mission', { n: n(m.number) })}{' '}
                  {done && <span className="text-emerald-300">{t('game.done')}</span>}
                </p>
                <p className="mt-1 text-lg font-bold">{m.title}</p>
                <p className="mt-1 text-sm text-muted">{m.goal}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-6 rounded-xl bg-raised/60 px-4 py-3">
          <strong>{t('game.goal')}</strong> {mission.goal} {mission.instructions}
        </p>

        <div
          role="group"
          aria-label={t('game.graphics')}
          className="mt-4 flex flex-wrap items-center gap-2 text-sm"
        >
          <span className="font-semibold text-muted">{t('game.graphics')}:</span>
          {(['high', 'low'] as const).map((q) => (
            <button
              key={q}
              type="button"
              aria-pressed={quality === q}
              onClick={() => {
                setQuality(q);
                saveQuality(q);
              }}
              className={`chip px-3 py-1.5 ${quality === q ? 'border-accent bg-accent text-space' : 'hover:border-accent'}`}
            >
              {q === 'high' ? t('game.graphicsHigh') : t('game.graphicsLow')}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl bg-surface" />}>
            <RoverGame
              key={`${mission.id}-${run}-${lang}-${quality}`}
              mission={mission}
              quality={quality}
              onComplete={() => completeMission(mission.id)}
              onRestart={() => setRun((r) => r + 1)}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
