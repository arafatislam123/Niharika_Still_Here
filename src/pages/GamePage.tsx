import { lazy, Suspense, useState } from 'react';
import { MISSIONS } from '../games/missions';
import { PageHeader } from '../components/ui';
import { completeMission, useProgress } from '../lib/progress';

const RoverGame = lazy(() => import('../games/RoverGame'));

export default function GamePage() {
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [run, setRun] = useState(0);
  const progress = useProgress();
  const mission = MISSIONS.find((m) => m.id === missionId)!;

  return (
    <>
      <PageHeader eyebrow="Mission Game" title="Mars Explorer">
        Take the controls of a solar-powered rover. Explore, collect samples, think like a scientist
        and keep your rover safe.
      </PageHeader>
      <div className="container">
        <div role="group" aria-label="Choose a mission" className="grid gap-3 md:grid-cols-3">
          {MISSIONS.map((m) => {
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
                  Mission {m.number} {done && <span className="text-emerald-300">✓ done</span>}
                </p>
                <p className="mt-1 text-lg font-bold">{m.title}</p>
                <p className="mt-1 text-sm text-muted">{m.goal}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-6 rounded-xl bg-raised/60 px-4 py-3">
          <strong>Your goal:</strong> {mission.goal} {mission.instructions}
        </p>

        <div className="mt-4">
          <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl bg-surface" />}>
            <RoverGame
              key={`${mission.id}-${run}`}
              mission={mission}
              onComplete={() => completeMission(mission.id)}
              onRestart={() => setRun((r) => r + 1)}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
