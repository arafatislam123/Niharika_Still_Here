/**
 * Mars Explorer: a small Three.js rover game. A simplified educational simulation, not real
 * rover physics: drive with the arrow keys / WASD or the on-screen pad, visit glowing sites,
 * read learning cards, answer science questions and manage solar power.
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { SourceLink } from '../components/ui';
import { useLang } from '../i18n';
import {
  disposeTree,
  makeGlowTexture,
  prefersReducedMotion,
  webglAvailable,
} from '../three/textures';
import { buildMarsTerrain, buildSimpleRover, marsHeight } from '../three/marsScene';
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
const height = marsHeight;

export default function RoverGame({
  mission,
  onComplete,
  onRestart,
}: {
  mission: Mission;
  onComplete: (score: number) => void;
  onRestart: () => void;
}) {
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

    const scene = new THREE.Scene();
    const clearSky = new THREE.Color(0xd9a27a);
    const stormSky = new THREE.Color(0x6b3d24);
    scene.background = clearSky.clone();
    scene.fog = new THREE.Fog(clearSky.clone(), 30, 90);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffe6d0, 0.7);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(30, 50, 20);
    scene.add(sun);

    scene.add(buildMarsTerrain(BOUND * 2.6));
    // Scattered rocks for a sense of motion.
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x5a2f1f,
      roughness: 1,
      flatShading: true,
    });
    for (let i = 0; i < 120; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const z = (Math.sin(i * 78.233) * 12345.678) % 1;
      const px = x * BOUND * 1.1;
      const pz = z * BOUND * 1.1;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.3 + Math.abs(x) * 0.7, 0),
        rockMat,
      );
      rock.position.set(px, height(px, pz), pz);
      rock.rotation.set(x * 3, z * 3, 0);
      scene.add(rock);
    }

    const glowMap = makeGlowTexture('#ffffff');
    const beacons = new Map<string, THREE.Group>();
    for (const site of mission.sites) {
      const group = new THREE.Group();
      group.position.set(site.x, height(site.x, site.z), site.z);
      const color = new THREE.Color(site.color);
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 14, 16, 1, true),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      pillar.position.y = 7;
      group.add(pillar);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.1, 32),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.15;
      group.add(ring);
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowMap,
          color,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      glow.position.y = 1.2;
      glow.scale.set(3, 3, 1);
      group.add(glow);
      scene.add(group);
      beacons.set(site.id, group);
    }

    const rover = buildSimpleRover();
    scene.add(rover);
    const state = { x: 0, z: 8, heading: Math.PI, wheelSpin: 0 };

    // Dust particles for the storm.
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 900;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++)
      dustPos.set([Math.random() * 60 - 30, Math.random() * 14, Math.random() * 60 - 30], i * 3);
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xc98a5a,
      size: 0.25,
      transparent: true,
      opacity: 0,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

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
      if (!g.paused) keys.current[k] = down;
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    const clock = new THREE.Timer();
    const camTarget = new THREE.Vector3();
    let hudTimer = 0;
    let frame = 0;
    let stormMix = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsed();

      if (!g.paused && !g.failed) {
        g.playTime += dt;
        const k = keys.current;
        const canDrive = g.phase !== 'storm-sleep' && g.battery > 0;
        const throttle = canDrive ? (k.forward ? 1 : 0) - (k.back ? 0.5 : 0) : 0;
        const turn = canDrive ? (k.left ? 1 : 0) - (k.right ? 1 : 0) : 0;
        state.heading += turn * dt * 1.9;
        const speed = throttle * 7;
        state.x = THREE.MathUtils.clamp(
          state.x + Math.sin(state.heading) * speed * dt,
          -BOUND,
          BOUND,
        );
        state.z = THREE.MathUtils.clamp(
          state.z + Math.cos(state.heading) * speed * dt,
          -BOUND,
          BOUND,
        );
        state.wheelSpin += speed * dt * 2;
        const moving = throttle !== 0 || turn !== 0;

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
      }

      // --- visuals ---
      const y = height(state.x, state.z);
      rover.position.set(state.x, y, state.z);
      rover.rotation.y = state.heading;
      const ahead = height(
        state.x + Math.sin(state.heading) * 1.2,
        state.z + Math.cos(state.heading) * 1.2,
      );
      rover.rotation.x = -Math.atan2(ahead - y, 1.2) * 0.8;
      for (const c of rover.children) if (c.userData.wheel) c.rotation.x = state.wheelSpin;

      const stormy = g.phase === 'storm-sleep' || g.phase === 'storm-drive' ? 1 : 0;
      stormMix += (stormy - stormMix) * Math.min(1, dt * 1.5);
      (scene.background as THREE.Color).copy(clearSky).lerp(stormSky, stormMix);
      const fog = scene.fog as THREE.Fog;
      fog.color.copy(scene.background as THREE.Color);
      fog.far = 90 - stormMix * 70;
      fog.near = 30 - stormMix * 26;
      sun.intensity = 1.6 - stormMix * 1.2;
      dustMat.opacity = stormMix * 0.8;
      dust.position.set(state.x, 0, state.z);
      if (!reduced) dust.rotation.y = t * 0.6;

      for (const b of beacons.values()) b.rotation.y = reduced ? 0 : t;

      camTarget.set(
        state.x - Math.sin(state.heading) * 9,
        y + 5.5,
        state.z - Math.cos(state.heading) * 9,
      );
      camera.position.lerp(camTarget, Math.min(1, dt * 3));
      camera.lookAt(state.x, y + 1.2, state.z);
      renderer.render(scene, camera);

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
    camera.position.set(0, 8, 18);
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      disposeTree(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mission, supported]);

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
    <div className="relative h-[70vh] min-h-[460px] select-none overflow-hidden rounded-3xl border border-line">
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
      <p className="pointer-events-none absolute bottom-4 left-4 hidden max-w-[60%] rounded-full bg-space/70 px-3 py-1 text-xs text-muted md:block">
        {t('game.hint')}
      </p>

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
