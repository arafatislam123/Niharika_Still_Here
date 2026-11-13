import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // Full screen. Browsers only allow it after a tap/click, so it starts from "Start game".
  // 'native' = real browser full screen; 'fake' = the game fills the window (e.g. iPhone Safari,
  // which has no full screen for web pages).
  const stageRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState<'none' | 'native' | 'fake'>('none');

  const enterFullscreen = useCallback(() => {
    const el = stageRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen()
        .then(() => setFullscreen('native'))
        .catch(() => setFullscreen('fake'));
    } else {
      setFullscreen('fake');
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setFullscreen('none');
  }, []);

  useEffect(() => {
    // Leaving full screen with the browser's own Esc / back gesture.
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen((f) => (f === 'native' ? 'none' : f));
    };
    // Esc also leaves the "fake" full screen.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen((f) => (f === 'fake' ? 'none' : f));
    };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    // No page scrolling behind the game while it fills the window.
    document.body.style.overflow = fullscreen === 'fake' ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreen]);
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
      <PageHeader icon="🎮" tip={t('tip.game')} eyebrow={t('game.eyebrow')} title={t('game.title')}>
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

        {/* This wrapper is what goes full screen, so restarting the game keeps full screen. */}
        <div
          ref={stageRef}
          className={
            fullscreen === 'fake'
              ? 'fixed inset-0 z-[100] h-[100dvh] bg-black'
              : fullscreen === 'native'
                ? 'h-full bg-black'
                : 'mt-4'
          }
        >
          <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl bg-surface" />}>
            <RoverGame
              key={`${mission.id}-${run}-${lang}-${quality}`}
              mission={mission}
              quality={quality}
              started={started}
              fullscreen={fullscreen !== 'none'}
              onStart={() => {
                setStarted(true);
                enterFullscreen();
              }}
              onToggleFullscreen={() =>
                fullscreen === 'none' ? enterFullscreen() : exitFullscreen()
              }
              onComplete={() => completeMission(mission.id)}
              onRestart={() => setRun((r) => r + 1)}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
