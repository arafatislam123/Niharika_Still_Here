/**
 * Mission Memory Map: a spinning Moon or Mars globe with a pin at each artifact's real
 * latitude/longitude. Pins have button labels, and the globe turns to face the selected one.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Artifact } from '../data/types';
import { useLang } from '../i18n';
import {
  disposeTree,
  latLonToVector,
  makeGlowTexture,
  makePlanetTexture,
  makeStarfield,
  prefersReducedMotion,
  webglAvailable,
} from './textures';

const RADIUS = 5;

export default function PlanetGlobe({
  look,
  artifacts,
  selectedId,
  onSelect,
}: {
  look: 'moon' | 'mars';
  artifacts: Artifact[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<string, HTMLElement>());
  const focusRef = useRef<(id: string) => void>(() => {});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [supported] = useState(webglAvailable);
  const { t } = useLang();
  const pinned = artifacts.filter(
    (a) => a.location.lat !== undefined && a.location.lon !== undefined,
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !supported) return;
    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.set(0, 2, 17);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 9;
    controls.maxDistance = 30;

    scene.add(makeStarfield(1000, 300));
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const light = new THREE.DirectionalLight(0xffffff, 1.6);
    light.position.set(10, 6, 12);
    scene.add(light);

    const globe = new THREE.Group();
    scene.add(globe);
    globe.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS, 72, 72),
        new THREE.MeshStandardMaterial({
          map: makePlanetTexture(look, look === 'mars' ? 11 : 5),
          roughness: 1,
        }),
      ),
    );
    if (look === 'mars') {
      globe.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(RADIUS * 1.04, 48, 48),
          new THREE.MeshBasicMaterial({
            color: 0xff9a6a,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
          }),
        ),
      );
    }

    const anchors = new Map<string, THREE.Object3D>();
    const hits: THREE.Object3D[] = [];
    const glowMap = makeGlowTexture('#ffc94d');
    for (const a of pinned) {
      const surface = latLonToVector(a.location.lat!, a.location.lon!, RADIUS);
      const normal = surface.clone().normalize();
      const pin = new THREE.Group();
      pin.position.copy(surface);
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      stem.position.y = 0.35;
      pin.add(stem);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(a.color) }),
      );
      head.position.y = 0.75;
      pin.add(head);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowMap,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.position.y = 0.75;
      halo.scale.set(1.2, 1.2, 1);
      pin.add(halo);

      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.position.y = 0.6;
      hit.userData.id = a.id;
      pin.add(hit);
      hits.push(hit);

      globe.add(pin);
      anchors.set(a.id, head);
    }

    // Turn the globe so the chosen pin faces the camera.
    let targetQuat: THREE.Quaternion | null = null;
    let autoSpin = !reduced;
    focusRef.current = (id: string) => {
      const a = pinned.find((p) => p.id === id);
      if (!a) return;
      const local = latLonToVector(a.location.lat!, a.location.lon!, 1).normalize();
      const toCamera = camera.position.clone().normalize();
      targetQuat = new THREE.Quaternion().setFromUnitVectors(local, toCamera);
      autoSpin = false;
    };
    controls.addEventListener('start', () => {
      autoSpin = false;
      targetQuat = null;
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt = { x: 0, y: 0 };
    const pick = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(hits, false)[0]?.object.userData.id as string | undefined;
    };
    const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
      const id = pick(e);
      if (id) onSelectRef.current(id);
    };
    const onMove = (e: PointerEvent) =>
      (renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab');
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onMove);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.fov = w < 640 ? 55 : 40;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Timer();
    const world = new THREE.Vector3();
    const toCam = new THREE.Vector3();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      if (targetQuat) {
        globe.quaternion.slerp(targetQuat, reduced ? 1 : Math.min(1, dt * 3));
        if (globe.quaternion.angleTo(targetQuat) < 0.001) targetQuat = null;
      } else if (autoSpin) {
        globe.rotation.y += dt * 0.12;
      }
      controls.update();
      renderer.render(scene, camera);

      const { clientWidth: w, clientHeight: h } = mount;
      for (const [id, el] of labelRefs.current) {
        const anchor = anchors.get(id);
        if (!anchor) continue;
        anchor.getWorldPosition(world);
        // Hide labels for pins on the far side of the globe.
        const facing =
          world.clone().normalize().dot(toCam.copy(camera.position).sub(world).normalize()) > 0.05;
        world.project(camera);
        el.style.opacity = facing ? '1' : '0';
        el.style.pointerEvents = facing ? 'auto' : 'none';
        el.style.transform = `translate(-50%, -130%) translate(${((world.x + 1) / 2) * w}px, ${((1 - world.y) / 2) * h}px)`;
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
    // `pinned` is derived from props that are constant for a given world page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, supported]);

  useEffect(() => {
    if (selectedId) focusRef.current(selectedId);
  }, [selectedId]);

  if (!supported) return null;

  return (
    <div className="relative h-[55vh] min-h-[360px] overflow-hidden rounded-3xl border border-line bg-black/40">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        {pinned.map((a) => (
          <button
            key={a.id}
            type="button"
            tabIndex={-1}
            aria-hidden
            ref={(el) => {
              if (el) labelRefs.current.set(a.id, el);
              else labelRefs.current.delete(a.id);
            }}
            onClick={() => onSelect(a.id)}
            className={`absolute left-0 top-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold shadow transition-opacity md:text-sm ${
              selectedId === a.id
                ? 'border-accent bg-accent text-space'
                : 'border-line bg-space/85 text-ink hover:border-accent'
            }`}
          >
            {a.icon} {a.shortName}
          </button>
        ))}
      </div>
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-space/70 px-3 py-1 text-xs text-muted">
        {t('globe.hint')}
      </p>
    </div>
  );
}
