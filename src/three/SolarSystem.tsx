/**
 * Interactive 3D Solar System (Three.js). Moon, Mars and Pioneer 10 (deep space) are clickable;
 * their labels are real <button>s so the scene also works with a keyboard and screen reader.
 * Distances and sizes are squeezed so everything fits on screen: this is not to scale.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { WorldId } from '../data/types';
import { useLang } from '../i18n';
import { useFullscreen } from '../lib/fullscreen';
import { createSpaceAudio, type SpaceAudio } from './spaceAudio';
import type { StringKey } from '../i18n/strings';
import {
  disposeTree,
  makeGlowTexture,
  makePlanetTexture,
  makeStarfield,
  prefersReducedMotion,
  webglAvailable,
  type Look,
} from './textures';

interface Body {
  id: string;
  name: string;
  distance: number;
  size: number;
  look: Look;
  tint?: string;
  speed: number;
  target?: WorldId;
}

const BODIES: Body[] = [
  { id: 'mercury', name: 'Mercury', distance: 6, size: 0.4, look: 'rock', speed: 1.6 },
  {
    id: 'venus',
    name: 'Venus',
    distance: 8.5,
    size: 0.75,
    look: 'gas',
    tint: '#e8c98a',
    speed: 1.2,
  },
  { id: 'earth', name: 'Earth', distance: 11.5, size: 0.85, look: 'earth', speed: 1 },
  { id: 'mars', name: 'Mars', distance: 15, size: 0.6, look: 'mars', speed: 0.8, target: 'mars' },
  { id: 'jupiter', name: 'Jupiter', distance: 21, size: 2.1, look: 'gas', speed: 0.45 },
  {
    id: 'saturn',
    name: 'Saturn',
    distance: 28,
    size: 1.8,
    look: 'gas',
    tint: '#dcc08f',
    speed: 0.33,
  },
  { id: 'uranus', name: 'Uranus', distance: 34, size: 1.15, look: 'ice', speed: 0.23 },
  {
    id: 'neptune',
    name: 'Neptune',
    distance: 39,
    size: 1.1,
    look: 'ice',
    tint: '#3f6fd8',
    speed: 0.18,
  },
];

interface Label {
  id: string;
  name: StringKey;
  target?: WorldId;
}

const LABELS: Label[] = [
  ...BODIES.map((b) => ({ id: b.id, name: `planet.${b.id}` as StringKey, target: b.target })),
  { id: 'moon', name: 'planet.moon', target: 'moon' },
  { id: 'pioneer', name: 'solar.deepSpace', target: 'deep-space' },
];

export default function SolarSystem({
  onSelect,
  className = 'h-[60vh] min-h-[380px]',
}: {
  onSelect: (target: WorldId) => void;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<string, HTMLElement>());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [supported] = useState(webglAvailable);
  const { t, lang } = useLang();
  // Clicking empty space opens the solar system in full screen.
  const wrapRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(wrapRef);
  // "Sound of the universe" plays only in full screen. It must start inside the click itself.
  const audioRef = useRef<SpaceAudio | null>(null);
  const [muted, setMuted] = useState(false);
  const enterFullscreen = () => {
    audioRef.current ??= createSpaceAudio();
    audioRef.current.start();
    fullscreen.enter();
  };
  useEffect(() => {
    if (!fullscreen.active) audioRef.current?.stop();
  }, [fullscreen.active]);
  useEffect(() => audioRef.current?.setMuted(muted), [muted]);
  useEffect(
    () => () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    },
    [],
  );
  const fsRef = useRef({ ...fullscreen, enter: enterFullscreen });
  fsRef.current = { ...fullscreen, enter: enterFullscreen };
  const select = (target: WorldId) => {
    fsRef.current.exit();
    onSelectRef.current(target);
  };
  const selectRef = useRef(select);
  selectRef.current = select;
  const labelText = (l: Label) =>
    l.id === 'pioneer' ? (lang === 'bn' ? 'পাইওনিয়ার ১০' : 'Pioneer 10') : t(l.name);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !supported) return;

    const reduced = prefersReducedMotion();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    camera.position.set(0, 30, 58);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 15;
    controls.maxDistance = 120;
    controls.maxPolarAngle = Math.PI * 0.85;

    scene.add(makeStarfield());
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sunLight = new THREE.PointLight(0xfff1d6, 2.4, 0, 0);
    scene.add(sunLight);

    // Sun
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(3, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xffc84a }),
    );
    scene.add(sun);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('#ffb43a'),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.set(16, 16, 1);
    scene.add(glow);

    const anchors = new Map<string, THREE.Object3D>();
    const clickables: THREE.Object3D[] = [];
    const pivots: { pivot: THREE.Object3D; speed: number; spin: THREE.Object3D }[] = [];

    BODIES.forEach((body, index) => {
      const pivot = new THREE.Object3D();
      pivot.rotation.y = index * 1.3;
      scene.add(pivot);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(body.distance - 0.03, body.distance + 0.03, 128),
        new THREE.MeshBasicMaterial({
          color: body.target ? 0xff8a5b : 0x5865a8,
          transparent: true,
          opacity: body.target ? 0.6 : 0.3,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(body.size, 40, 40),
        new THREE.MeshStandardMaterial({
          map: makePlanetTexture(body.look, index + 3, body.tint),
          roughness: 0.9,
        }),
      );
      planet.position.x = body.distance;
      pivot.add(planet);
      anchors.set(body.id, planet);
      pivots.push({ pivot, speed: body.speed, spin: planet });

      if (body.target) {
        planet.userData.target = body.target;
        clickables.push(planet);
      }

      if (body.id === 'saturn') {
        const rings = new THREE.Mesh(
          new THREE.RingGeometry(body.size * 1.3, body.size * 2.1, 64),
          new THREE.MeshBasicMaterial({
            color: 0xd9c49a,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
          }),
        );
        rings.rotation.x = -Math.PI / 2.4;
        planet.add(rings);
      }

      if (body.id === 'earth') {
        const moonPivot = new THREE.Object3D();
        planet.add(moonPivot);
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 32, 32),
          new THREE.MeshStandardMaterial({ map: makePlanetTexture('moon', 7), roughness: 1 }),
        );
        moon.position.x = 1.7;
        moon.userData.target = 'moon';
        moonPivot.add(moon);
        anchors.set('moon', moon);
        clickables.push(moon);
        pivots.push({ pivot: moonPivot, speed: 6, spin: moon });
      }
    });

    // Pioneer 10: a small glowing craft far beyond Neptune.
    const pioneer = new THREE.Group();
    pioneer.position.set(-27, 5, -30);
    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 0.3, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xdfe6ff,
        metalness: 0.6,
        roughness: 0.3,
        side: THREE.DoubleSide,
      }),
    );
    dish.rotation.x = Math.PI / 2;
    pioneer.add(dish);
    const beacon = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('#9db4ff'),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    beacon.scale.set(3, 3, 1);
    pioneer.add(beacon);
    pioneer.userData.target = 'deep-space';
    scene.add(pioneer);
    anchors.set('pioneer', pioneer);
    clickables.push(pioneer);

    // Bigger invisible hit areas so small targets are easy to tap on a phone.
    for (const obj of [...clickables]) {
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.userData.target = obj.userData.target;
      obj.add(hit);
      clickables.push(hit);
    }

    // ---- input ----------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt = { x: 0, y: 0 };

    const pick = (event: PointerEvent): WorldId | undefined => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(clickables, false)[0]?.object.userData.target as
        WorldId | undefined;
    };
    const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return; // was a drag
      const target = pick(e);
      if (target) selectRef.current(target);
      else if (!fsRef.current.active) fsRef.current.enter();
    };
    const onMove = (e: PointerEvent) => {
      renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onMove);

    // ---- sizing & loop --------------------------------------------------------------------
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      // Pull the camera back on narrow screens so the whole system stays visible.
      camera.fov = w < 640 ? 62 : 45;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Timer();
    const tmp = new THREE.Vector3();
    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      const rate = reduced ? 0 : 0.12;
      for (const p of pivots) {
        p.pivot.rotation.y += dt * p.speed * rate;
        p.spin.rotation.y += dt * (reduced ? 0 : 0.5);
      }
      pioneer.rotation.y += dt * 0.3;
      controls.update();
      renderer.render(scene, camera);

      const { clientWidth: w, clientHeight: h } = mount;
      for (const [id, el] of labelRefs.current) {
        const anchor = anchors.get(id);
        if (!anchor) continue;
        anchor.getWorldPosition(tmp);
        tmp.project(camera);
        const visible = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
        el.style.opacity = visible ? '1' : '0';
        el.style.transform = `translate(-50%, 0) translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h + 14}px)`;
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointermove', onMove);
      disposeTree(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [supported]);

  if (!supported) {
    return (
      <div
        className={`card flex flex-col items-center justify-center gap-4 text-center ${className}`}
      >
        <p className="text-muted">{t('solar.noWebgl')}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {LABELS.filter((l) => l.target).map((l) => (
            <button
              key={l.id}
              type="button"
              className="btn-ghost"
              onClick={() => select(l.target!)}
            >
              {labelText(l)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`overflow-hidden bg-black ${
        fullscreen.mode === 'fake'
          ? 'fixed inset-0 z-[100] h-[100dvh]'
          : fullscreen.mode === 'native'
            ? 'relative h-screen'
            : `relative rounded-3xl border border-line bg-black/40 ${className}`
      }`}
    >
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        {LABELS.map((l) =>
          l.target ? (
            <button
              key={l.id}
              type="button"
              ref={(el) => {
                if (el) labelRefs.current.set(l.id, el);
                else labelRefs.current.delete(l.id);
              }}
              onClick={() => onSelect(l.target!)}
              className="pointer-events-auto absolute left-0 top-0 whitespace-nowrap rounded-full border border-accent/70 bg-space/80 px-3 py-1 text-xs font-bold text-accent shadow transition-opacity hover:bg-accent hover:text-space md:text-sm"
            >
              {labelText(l)}
              {l.id === 'pioneer' && (
                <span className="ml-1 font-normal opacity-80">· {t('solar.deepSpace')}</span>
              )}{' '}
              →
            </button>
          ) : (
            <span
              key={l.id}
              aria-hidden
              ref={(el) => {
                if (el) labelRefs.current.set(l.id, el);
                else labelRefs.current.delete(l.id);
              }}
              className="absolute left-0 top-0 whitespace-nowrap text-[11px] text-muted transition-opacity"
            >
              {labelText(l)}
            </span>
          ),
        )}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-col items-start gap-1.5">
        {fullscreen.active && !muted && (
          <p className="max-w-xl rounded-2xl bg-space/70 px-3 py-1 text-[11px] text-muted">
            {t('solar.soundNote')}
          </p>
        )}
        <p className="rounded-full bg-space/70 px-3 py-1 text-xs text-muted">
          {fullscreen.active ? t('solar.hintFullscreen') : t('solar.hint')}
        </p>
      </div>
      <div className="absolute right-3 top-3 flex gap-2">
        {fullscreen.active && (
          <button
            type="button"
            aria-pressed={!muted}
            onClick={() => setMuted((m) => !m)}
            className="rounded-full bg-space/80 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-raised"
          >
            {muted ? t('solar.soundOff') : t('solar.soundOn')}
          </button>
        )}
        <button
          type="button"
          onClick={() => (fullscreen.active ? fullscreen.exit() : enterFullscreen())}
          className="rounded-full bg-space/80 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-raised"
        >
          {fullscreen.active ? t('solar.exitFullscreen') : t('solar.fullscreen')}
        </button>
      </div>
    </div>
  );
}
