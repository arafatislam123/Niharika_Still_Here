/**
 * Mars Explorer: a small Three.js rover game. A simplified educational simulation, not real
 * rover physics: drive with the arrow keys / WASD or the on-screen pad, visit glowing sites,
 * read learning cards, answer science questions and manage solar power.
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { SourceLink } from '../components/ui';
import { useLang } from '../i18n';
import { prefersReducedMotion, webglAvailable } from '../three/textures';
import { createMarsAudio, type MarsAudio } from './marsAudio';
import { createMarsWorld, type Quality } from './marsWorld';
import type { Mission, Site } from './missions';

type Phase = 'drive' | 'storm-sleep' | 'storm-drive' | 'cleared';
type Modal =
  | { kind: 'site'; site: Site; picked?: number }
  | { kind: 'storm-choice' }
  | { kind: 'storm-cleared' }
  | { kind: 'fail' }
  | { kind: 'complete' };

interface Hud {
  battery: number;
  score: number;
  visited: string[];
  phase: Phase;
  stormLeft: number;
}

const BOUND = 44;

export default function RoverGame({
  mission,
  quality,
  started,
  fullscreen,
  onStart,
  onToggleFullscreen,
  onComplete,
  onRestart,
}: {
  mission: Mission;
  quality: Quality;
  /** False until the player taps "Start game" (which also opens full screen). */
  started: boolean;
  fullscreen: boolean;
  onStart: () => void;
  onToggleFullscreen: () => void;
  onComplete: (score: number) => void;
  onRestart: () => void;
}) {
  const startedRef = useRef(started);
  startedRef.current = started;
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const audioRef = useRef<MarsAudio | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const keys = useRef({ forward: false, back: false, left: false, right: false });
  const game = useRef({
    paused: false,
    battery: 100,
    score: 0,
    visited: new Set<string>(),
    phase: 'drive' as Phase,
    phaseTime: 0,
    playTime: 0,
    stormDone: false,
    failed: false,
  });
  const [hud, setHud] = useState<Hud>({
    battery: 100,
    score: 0,
    visited: [],
    phase: 'drive',
    stormLeft: 0,
  });
  const [modal, setModal] = useState<Modal | null>(null);
  const [supported] = useState(webglAvailable);
  const { t, n } = useLang();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const openModal = (m: Modal) => {
    game.current.paused = true;
    keys.current = { forward: false, back: false, left: false, right: false };
    setModal(m);
  };
  const closeModal = () => {
    game.current.paused = false;
    setModal(null);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !supported) return;
    const g = game.current;
    const reduced = prefersReducedMotion();
    const storm = mission.storm;

    const renderer = new THREE.WebGLRenderer({
      antialias: quality === 'low',
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.5));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const world = createMarsWorld(renderer, quality, BOUND, mission.sites);
    const { camera, beacons, obstacles, heightAt } = world;
    camera.position.set(0, heightAt(0, 16) + 6, 16);
    const state = { x: 0, z: 8, heading: Math.PI, speed: 0 };

    const audio = createMarsAudio();
    audioRef.current = audio;
    audio.setMuted(mutedRef.current);
    const startAudio = () => audio.start();
    mount.addEventListener('pointerdown', startAudio);

    const resize = () => world.setSize(mount.clientWidth, mount.clientHeight);
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const map: Record<string, keyof typeof keys.current> = {
        ArrowUp: 'forward',
        KeyW: 'forward',
        ArrowDown: 'back',
        KeyS: 'back',
        ArrowLeft: 'left',
        KeyA: 'left',
        ArrowRight: 'right',
        KeyD: 'right',
      };
      const k = map[e.code];
      if (!k) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      audio.start();
      if (!g.paused) keys.current[k] = down;
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    const clock = new THREE.Timer();
    let hudTimer = 0;
    let frame = 0;
    let stormMix = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsed();

      let moving = false;
      if (startedRef.current && !g.paused && !g.failed) {
        g.playTime += dt;
        const k = keys.current;
        const canDrive = g.phase !== 'storm-sleep' && g.battery > 0;
        const throttle = canDrive ? (k.forward ? 1 : 0) - (k.back ? 0.5 : 0) : 0;
        const turn = canDrive ? (k.left ? 1 : 0) - (k.right ? 1 : 0) : 0;
        // Smooth acceleration and braking instead of instant speed changes.
        state.speed += (throttle * 7 - state.speed) * Math.min(1, dt * 2.5);
        state.heading += turn * dt * 1.7;
        const nx = THREE.MathUtils.clamp(
          state.x + Math.sin(state.heading) * state.speed * dt,
          -BOUND,
          BOUND,
        );
        const nz = THREE.MathUtils.clamp(
          state.z + Math.cos(state.heading) * state.speed * dt,
          -BOUND,
          BOUND,
        );
        // Big boulders block the way.
        if (obstacles.some((o) => Math.hypot(o.x - nx, o.z - nz) < o.r + 1.3)) {
          state.speed *= -0.2;
        } else {
          state.x = nx;
          state.z = nz;
        }
        moving = Math.abs(state.speed) > 0.2 || turn !== 0;

        // --- energy ---
        const inStorm = g.phase === 'storm-sleep' || g.phase === 'storm-drive';
        const solar = inStorm ? 0 : storm ? 1.6 : 3;
        const drain =
          g.phase === 'storm-sleep'
            ? 1
            : g.phase === 'storm-drive'
              ? moving
                ? 14
                : 12
              : moving
                ? storm
                  ? 3
                  : 1.6
                : 0;
        g.battery = THREE.MathUtils.clamp(g.battery + (solar - drain) * dt, 0, 100);

        // --- storm phases ---
        if (storm) {
          g.phaseTime += dt;
          if (g.phase === 'drive' && !g.stormDone && g.playTime >= storm.afterSeconds) {
            openModal({ kind: 'storm-choice' });
          } else if (inStorm && g.battery <= 0) {
            g.failed = true;
            openModal({ kind: 'fail' });
          } else if (inStorm && g.phaseTime >= storm.durationSeconds) {
            g.phase = 'cleared';
            g.stormDone = true;
            g.battery = Math.min(100, g.battery + 35); // a gust cleans the panels
            g.score += 50;
            openModal({ kind: 'storm-cleared' });
          }
        }

        // --- reaching sites ---
        for (const site of mission.sites) {
          if (g.visited.has(site.id)) continue;
          if (Math.hypot(site.x - state.x, site.z - state.z) < 2.6) {
            g.visited.add(site.id);
            g.score += 10;
            const beacon = beacons.get(site.id);
            if (beacon) beacon.visible = false;
            openModal({ kind: 'site', site });
            break;
          }
        }
      } else {
        state.speed = 0;
      }

      const stormy = g.phase === 'storm-sleep' || g.phase === 'storm-drive' ? 1 : 0;
      stormMix += (stormy - stormMix) * Math.min(1, dt * 1.5);
      world.update(dt, t, state, stormMix, reduced);
      world.render();
      audio.setDrive(moving ? Math.min(1, Math.abs(state.speed) / 7) : 0);
      audio.setStorm(stormMix);

      hudTimer += dt;
      if (hudTimer > 0.1) {
        hudTimer = 0;
        const stormLeft =
          storm && (g.phase === 'storm-sleep' || g.phase === 'storm-drive')
            ? Math.max(0, storm.durationSeconds - g.phaseTime)
            : 0;
        setHud({
          battery: g.battery,
          score: g.score,
          visited: [...g.visited],
          phase: g.phase,
          stormLeft,
        });
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      mount.removeEventListener('pointerdown', startAudio);
      audio.dispose();
      audioRef.current = null;
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mission, supported, quality]);

  // Called after closing a site card: finish when every site is visited (and the storm, if any, is over).
  const afterSite = () => {
    const g = game.current;
    const done = g.visited.size === mission.sites.length && (!mission.storm || g.stormDone);
    if (done) {
      onCompleteRef.current(g.score);
      setModal({ kind: 'complete' });
    } else closeModal();
  };

  const chooseStorm = (sleep: boolean) => {
    const g = game.current;
    g.phase = sleep ? 'storm-sleep' : 'storm-drive';
    g.phaseTime = 0;
    if (sleep) g.score += 30;
    closeModal();
  };

  const hold = (k: keyof typeof keys.current) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      e.preventDefault();
      if (!game.current.paused) keys.current[k] = true;
    },
    onPointerUp: () => (keys.current[k] = false),
    onPointerLeave: () => (keys.current[k] = false),
    onPointerCancel: () => (keys.current[k] = false),
  });

  if (!supported) {
    return <p className="card text-muted">{t('game.noWebgl')}</p>;
  }

  const batteryColor =
    hud.battery > 50 ? 'bg-emerald-400' : hud.battery > 20 ? 'bg-amber-400' : 'bg-red-500';
  const pad = 'h-14 w-14 rounded-2xl bg-space/80 text-2xl active:bg-accent active:text-space';

  return (
    <div
      className={`relative select-none overflow-hidden ${
        fullscreen ? 'h-full w-full' : 'h-[70vh] min-h-[460px] rounded-3xl border border-line'
      }`}
    >
      <div ref={mountRef} className="absolute inset-0" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="rounded-2xl bg-space/80 px-4 py-2 text-sm">
          <p className="font-bold">
            {t('game.mission', { n: n(mission.number) })}: {mission.title}
          </p>
          <p className="text-muted">
            {t('game.hudSites', { done: n(hud.visited.length), total: n(mission.sites.length) })} ·{' '}
            {t('game.hudPoints')} <strong className="text-accent">{n(hud.score)}</strong>
          </p>
        </div>
        <div
          className="w-44 rounded-2xl bg-space/80 px-4 py-2 text-sm"
          role="meter"
          aria-label={t('game.battery')}
          aria-valuenow={Math.round(hud.battery)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <p className="flex justify-between font-bold">
            <span>{t('game.battery')}</span>
            <span>{n(Math.round(hud.battery))}%</span>
          </p>
          <div className="mt-1 h-2.5 rounded-full bg-raised">
            <div
              className={`h-2.5 rounded-full ${batteryColor}`}
              style={{ width: `${hud.battery}%` }}
            />
          </div>
          {hud.battery <= 0 && hud.phase !== 'storm-sleep' && (
            <p className="mt-1 text-xs text-amber-300">{t('game.empty')}</p>
          )}
        </div>
      </div>

      {hud.stormLeft > 0 && (
        <p
          className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-red-900/80 px-4 py-2 text-center text-sm font-bold"
          role="status"
        >
          {t('game.storm')} {hud.phase === 'storm-sleep' ? t('game.sleeping') : t('game.noSun')}{' '}
          {n(Math.ceil(hud.stormLeft))}s
        </p>
      )}

      {/* Touch / mouse controls */}
      <div
        className="absolute bottom-4 right-4 grid grid-cols-3 gap-2"
        aria-label={t('game.controls')}
      >
        <span />
        <button type="button" aria-label={t('game.forward')} className={pad} {...hold('forward')}>
          ▲
        </button>
        <span />
        <button type="button" aria-label={t('game.left')} className={pad} {...hold('left')}>
          ◀
        </button>
        <button type="button" aria-label={t('game.reverse')} className={pad} {...hold('back')}>
          ▼
        </button>
        <button type="button" aria-label={t('game.right')} className={pad} {...hold('right')}>
          ▶
        </button>
      </div>
      <div className="absolute bottom-4 left-4 flex max-w-[60%] flex-col items-start gap-2">
        <button
          type="button"
          aria-pressed={!muted}
          onClick={() => {
            const next = !muted;
            setMuted(next);
            audioRef.current?.start();
            audioRef.current?.setMuted(next);
          }}
          className="rounded-full bg-space/80 px-3 py-1.5 text-xs font-semibold hover:bg-raised"
        >
          {muted ? t('game.soundOff') : t('game.soundOn')}
        </button>
        <button
          type="button"
          aria-pressed={fullscreen}
          onClick={onToggleFullscreen}
          className="rounded-full bg-space/80 px-3 py-1.5 text-xs font-semibold hover:bg-raised"
        >
          {fullscreen ? t('game.exitFullscreen') : t('game.fullscreen')}
        </button>
        <p className="pointer-events-none hidden rounded-full bg-space/70 px-3 py-1 text-xs text-muted md:block">
          {t('game.hint')}
        </p>
      </div>

      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 p-6 text-center">
          <button
            type="button"
            onClick={() => {
              audioRef.current?.start();
              onStart();
            }}
            className="btn-primary px-8 py-4 text-xl shadow-2xl"
            autoFocus
          >
            {t('game.start')}
          </button>
          <p className="rounded-full bg-black/50 px-4 py-1.5 text-sm text-white/85">
            {t('game.startNote')}
          </p>
        </div>
      )}

      {modal && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-modal-title"
        >
          <div className="card max-h-full w-full max-w-lg overflow-y-auto">
            {modal.kind === 'site' && (
              <SiteCard
                site={modal.site}
                picked={modal.picked}
                onPick={(i) => {
                  if (modal.picked !== undefined) return;
                  if (i === modal.site.question!.answer) game.current.score += 20;
                  setModal({ ...modal, picked: i });
                }}
                onDone={afterSite}
              />
            )}
            {modal.kind === 'storm-choice' && (
              <>
                <h2 id="game-modal-title" className="font-display text-2xl font-bold">
                  {t('game.stormTitle')}
                </h2>
                <p className="mt-2">{t('game.stormText')}</p>
                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    className="btn-ghost justify-start text-left"
                    onClick={() => chooseStorm(false)}
                  >
                    {t('game.stormDrive')}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost justify-start text-left"
                    onClick={() => chooseStorm(true)}
                  >
                    {t('game.stormSleep')}
                  </button>
                </div>
              </>
            )}
            {modal.kind === 'storm-cleared' && (
              <>
                <h2 id="game-modal-title" className="font-display text-2xl font-bold">
                  {t('game.clearedTitle')}
                </h2>
                <p className="mt-2">{t('game.clearedText')}</p>
                <div className="mt-2">
                  <SourceLink sourceId="src-opportunity" compact />
                </div>
                <button type="button" className="btn-primary mt-4" onClick={afterSite}>
                  {t('common.continue')}
                </button>
              </>
            )}
            {modal.kind === 'fail' && (
              <>
                <h2 id="game-modal-title" className="font-display text-2xl font-bold">
                  {t('game.failTitle')}
                </h2>
                <p className="mt-2">{t('game.failText')}</p>
                <p className="mt-2 font-semibold">{t('game.failTip')}</p>
                <div className="mt-2">
                  <SourceLink sourceId="src-opportunity-end" compact />
                </div>
                <button type="button" className="btn-primary mt-4" onClick={onRestart}>
                  {t('game.retry')}
                </button>
              </>
            )}
            {modal.kind === 'complete' && (
              <>
                <h2 id="game-modal-title" className="font-display text-2xl font-bold">
                  {t('game.completeTitle')}
                </h2>
                <p className="mt-2">{t('game.completeText', { score: n(game.current.score) })}</p>
                <button type="button" className="btn-primary mt-4" onClick={onRestart}>
                  {t('game.again')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SiteCard({
  site,
  picked,
  onPick,
  onDone,
}: {
  site: Site;
  picked?: number;
  onPick: (i: number) => void;
  onDone: () => void;
}) {
  const { t } = useLang();
  const q = site.question;
  return (
    <>
      <p className="eyebrow">{t('game.card')}</p>
      <h2 id="game-modal-title" className="mt-1 font-display text-2xl font-bold">
        {site.card.title}
      </h2>
      <p className="mt-2">{site.card.text}</p>
      <div className="mt-2">
        <SourceLink sourceId={site.card.sourceId} compact />
      </div>
      {q && (
        <div className="mt-5">
          <p className="font-bold">{q.question}</p>
          <div className="mt-2 grid gap-2">
            {q.options.map((o, i) => {
              const state =
                picked === undefined
                  ? ''
                  : i === q.answer
                    ? 'border-emerald-400 bg-emerald-900/40'
                    : i === picked
                      ? 'border-red-400 bg-red-900/30'
                      : 'opacity-60';
              return (
                <button
                  key={o}
                  type="button"
                  disabled={picked !== undefined}
                  onClick={() => onPick(i)}
                  className={`btn-ghost justify-start text-left ${state}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== undefined && (
            <p className="mt-3" role="status">
              {picked === q.answer ? t('game.correct') : t('game.wrong')} {q.explanation}
            </p>
          )}
        </div>
      )}
      {(!q || picked !== undefined) && (
        <button type="button" className="btn-primary mt-4" onClick={onDone}>
          {t('common.continue')}
        </button>
      )}
    </>
  );
}
