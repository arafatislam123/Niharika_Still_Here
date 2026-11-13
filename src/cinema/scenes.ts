/**
 * Cinema mode scenes. Each scene is a self-contained THREE.Scene whose `update(t)` draws the
 * moment at progress t (0 → 1) of its chapter, so scenes can be paused, scrubbed and replayed.
 *
 * These are artist's animations of real events: what happens matches the NASA record (launch,
 * parachute + airbag landing, rolling into a small crater, hematite "blueberries", a long
 * drive, the 2018 dust storm), but shapes, colours and timings are simplified.
 */
import * as THREE from 'three';
import { buildMarsTerrain, buildSimpleRover, marsHeight } from '../three/marsScene';
import { buildPathfinder } from './props';
import { makeGlowTexture, makePlanetTexture, makeStarfield } from '../three/textures';

export interface CinemaScene {
  scene: THREE.Scene;
  /** Positions everything (including the shared camera) for progress t in [0, 1]. */
  update(t: number, camera: THREE.PerspectiveCamera, time: number): void;
}

export interface SceneContext {
  /** A ready-to-clone Mars Exploration Rover (NASA model, or a simple stand-in). */
  rover: THREE.Object3D;
  /** A ready-to-clone Pioneer 10 (NASA model, or a simple stand-in). */
  pioneer: THREE.Object3D;
}

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Progress of t inside the window [a, b], clamped to 0..1. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const easeInOut = (x: number) => x * x * (3 - 2 * x);
export const easeIn = (x: number) => x * x * x;
export const lerp = THREE.MathUtils.lerp;

export const MARS_SKY = new THREE.Color(0xd9a27a);

export function marsLights(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0xffe6d0, 0.75);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(30, 50, 20);
  scene.add(ambient, sun);
  return { ambient, sun };
}

/** A small bowl-shaped crater at the origin, on top of gentle hills. */
export const craterHeight =
  (radius: number, depth: number, hills = 0.35) =>
  (x: number, z: number) => {
    const r = Math.hypot(x, z);
    const bowl = r < radius ? -depth * (1 - (r / radius) ** 2) : 0;
    const rim = Math.exp(-(((r - radius) / 1.2) ** 2)) * depth * 0.35;
    return marsHeight(x, z) * hills + bowl + rim;
  };

export function scatterRocks(
  scene: THREE.Object3D,
  height: (x: number, z: number) => number,
  count: number,
  spread: number,
) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a2f1f, roughness: 1, flatShading: true });
  for (let i = 0; i < count; i++) {
    const rx = Math.sin(i * 12.9898) * 43758.5453;
    const rz = Math.sin(i * 78.233) * 12345.678;
    const x = (rx - Math.floor(rx) - 0.5) * spread;
    const z = (rz - Math.floor(rz) - 0.5) * spread;
    const s = 0.15 + (rx - Math.floor(rx)) * 0.5;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
    rock.position.set(x, height(x, z) + s * 0.3, z);
    rock.rotation.set(rx, rz, 0);
    scene.add(rock);
  }
}

// ---------------------------------------------------------------------------------------------
// 1. The Beginning: launch from Earth, then parachute + airbag landing into a small crater
// ---------------------------------------------------------------------------------------------

export function launchAndLanding(
  ctx: SceneContext,
  payload: 'rover' | 'pathfinder' = 'rover',
): CinemaScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // --- part A: launch (t < 0.3) ---
  const launch = new THREE.Group();
  launch.add(makeStarfield(1200, 300));
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(40, 64, 64),
    new THREE.MeshStandardMaterial({ map: makePlanetTexture('earth', 4), roughness: 0.9 }),
  );
  earth.position.set(0, -40, 0);
  launch.add(earth);
  const earthLight = new THREE.DirectionalLight(0xffffff, 2);
  earthLight.position.set(-20, 30, 30);
  launch.add(earthLight, new THREE.AmbientLight(0xffffff, 0.35));

  const rocket = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 24), white);
  body.position.y = 1.6;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 24), white);
  nose.position.y = 3.65;
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.5, 24),
    new THREE.MeshStandardMaterial({ color: 0x3a6fd8 }),
  );
  band.position.y = 0.7;
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 1.6, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffa23a,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    }),
  );
  flame.rotation.x = Math.PI;
  flame.position.y = -0.8;
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('#ffb24a'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.position.y = -0.9;
  glow.scale.set(3, 3, 1);
  rocket.add(body, nose, band, flame, glow);
  launch.add(rocket);
  scene.add(launch);

  // --- part B: landing on Mars (t >= 0.3) ---
  const landing = new THREE.Group();
  const height = craterHeight(7, 1.2);
  landing.add(buildMarsTerrain(120, 150, height, false));
  scatterRocks(landing, height, 120, 90);
  const lights = new THREE.Group();
  const amb = new THREE.AmbientLight(0xffe6d0, 0.75);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(30, 50, 20);
  lights.add(amb, sun);
  landing.add(lights);

  // What the airbags protect: a Mars Exploration Rover, or the Pathfinder lander carrying the
  // small Sojourner rover, which opens its petals and drives down a ramp.
  const rover = payload === 'rover' ? ctx.rover.clone() : new THREE.Group();
  const pathfinder = payload === 'pathfinder' ? buildPathfinder() : null;
  const sojourner = payload === 'pathfinder' ? buildSimpleRover() : null;
  if (pathfinder && sojourner) {
    sojourner.scale.setScalar(0.32);
    rover.add(pathfinder.group, sojourner);
  }
  landing.add(rover);

  const airbags = new THREE.Group();
  const bagMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.7,
    transparent: true,
    opacity: 0.95,
  });
  const ico = new THREE.IcosahedronGeometry(1, 0);
  const vertices = ico.attributes.position;
  const seen = new Set<string>();
  for (let i = 0; i < vertices.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(vertices, i);
    const key = v
      .toArray()
      .map((n) => n.toFixed(2))
      .join();
    if (seen.has(key)) continue;
    seen.add(key);
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 20), bagMat);
    bag.position.copy(v.multiplyScalar(1.05));
    airbags.add(bag);
  }
  ico.dispose();
  landing.add(airbags);

  const chute = new THREE.Group();
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.8 }),
  );
  canopy.position.y = 6;
  chute.add(canopy);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xdddddd });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(a) * 3, 6, Math.sin(a) * 3),
      new THREE.Vector3(0, 0, 0),
    ]);
    chute.add(new THREE.Line(geo, lineMat));
  }
  landing.add(chute);
  scene.add(landing);

  const spaceBg = new THREE.Color(0x000000);
  const marsBg = MARS_SKY.clone();
  const marsFog = new THREE.Fog(MARS_SKY, 35, 110);

  // Bounce path: lands at x = -24, bounces towards the crater at x = 0.
  const bounceX = (v: number) => lerp(-24, 0, easeInOut(v));
  const bounceY = (v: number) => {
    const hops = 4;
    const h = Math.abs(Math.sin(v * Math.PI * hops)) * 7 * (1 - v) ** 2;
    return h;
  };

  return {
    scene,
    update(t, camera, time) {
      const inSpace = t < 0.3;
      launch.visible = inSpace;
      landing.visible = !inSpace;
      scene.background = inSpace ? spaceBg : marsBg;
      scene.fog = inSpace ? null : marsFog;

      if (inSpace) {
        const u = t / 0.3;
        rocket.position.y = easeIn(u) * 30;
        const flicker = 0.85 + Math.sin(time * 40) * 0.15;
        flame.scale.set(1, flicker * (1 + u), 1);
        glow.scale.setScalar(3 + u * 2);
        camera.position.set(9 - u * 3, 3 + rocket.position.y * 0.9, 14);
        camera.lookAt(0, rocket.position.y + 2, 0);
        return;
      }

      const u = (t - 0.3) / 0.7;
      // 1) parachute descent, 2) bouncing, 3) rolling into the crater, 4) airbags deflate
      const descent = seg(u, 0, 0.22);
      const bounce = seg(u, 0.22, 0.72);
      const deflate = seg(u, 0.78, 0.9);

      let x: number;
      let y: number;
      if (u < 0.22) {
        x = -24;
        y = lerp(45, height(-24, 0) + 1.9, easeInOut(descent));
      } else {
        x = bounceX(bounce);
        y = height(x, 0) + 1.9 + bounceY(bounce);
      }
      airbags.position.set(x, y, 0);
      airbags.rotation.z = -bounce * 9;
      airbags.rotation.x = Math.sin(bounce * 7) * 0.4;
      airbags.scale.setScalar(1 - deflate * 0.9);
      airbags.visible = deflate < 1;

      chute.visible = u < 0.24;
      chute.position.set(x, y, 0);
      chute.rotation.z = Math.sin(time * 1.5) * 0.08;

      rover.visible = deflate > 0.3;
      rover.position.set(0, height(0, 0), 0);
      rover.scale.setScalar(easeInOut(seg(deflate, 0.3, 1)));
      rover.rotation.y = Math.PI / 2; // facing along the bounce direction (+x)
      if (pathfinder && sojourner) {
        const open = easeInOut(seg(u, 0.88, 0.94));
        pathfinder.petals.forEach((p) => (p.rotation.x = (1 - open) * -1.15));
        const drive = easeInOut(seg(u, 0.94, 1));
        sojourner.position.set(0, 0.15 + Math.max(0, 0.25 - drive * 0.4), 0.3 + drive * 2.2);
      }

      // camera: follow the fall, then the bounces, then circle the rover
      if (u < 0.22) {
        camera.position.set(x + 14, y - 4, 18);
        camera.lookAt(x, y, 0);
      } else if (u < 0.85) {
        // Stay above the hills so the camera never clips into the ground.
        const cx = x + 6;
        camera.position.set(cx, Math.max(6, height(cx, 16) + 3), 16);
        camera.lookAt(x, y - 0.5, 0);
      } else {
        const a = seg(u, 0.85, 1) * 0.9;
        camera.position.set(Math.sin(a) * 9, 4.5, Math.cos(a) * 9);
        camera.lookAt(0, height(0, 0) + 1, 0);
      }
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 2. The Discoveries: layered rocks and hematite "blueberries"
// ---------------------------------------------------------------------------------------------

export function discoveries(ctx: SceneContext): CinemaScene {
  const scene = new THREE.Scene();
  scene.background = MARS_SKY.clone();
  scene.fog = new THREE.Fog(MARS_SKY, 25, 80);
  const height = (x: number, z: number) => marsHeight(x, z) * 0.15;
  scene.add(buildMarsTerrain(90, 120, height));
  scatterRocks(scene, height, 60, 60);
  marsLights(scene);

  // A layered outcrop: thin stacked slabs in alternating sandy colours.
  const outcrop = new THREE.Group();
  const colors = [0xc98a5b, 0xb4744a, 0xd9a273, 0xa86a42];
  for (let i = 0; i < 9; i++) {
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(7 - i * 0.25, 0.28, 2.2),
      new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 1,
        flatShading: true,
      }),
    );
    slab.position.y = i * 0.28 + 0.14;
    slab.position.x = Math.sin(i) * 0.15;
    outcrop.add(slab);
  }
  outcrop.position.set(4.5, height(4.5, 2), 2);
  outcrop.rotation.y = -0.3;
  scene.add(outcrop);

  // "Blueberries": small hematite-rich spheres that light up as the rover examines them.
  const berries: THREE.Mesh[] = [];
  for (let i = 0; i < 70; i++) {
    const a = Math.sin(i * 91.7) * 1000;
    const b = Math.sin(i * 17.3) * 1000;
    const x = (a - Math.floor(a) - 0.5) * 5;
    const z = (b - Math.floor(b)) * 16 - 6;
    const berry = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0x55607a,
        emissive: 0x6f8cff,
        emissiveIntensity: 0,
        roughness: 0.4,
      }),
    );
    berry.position.set(x - 1, height(x, z) + 0.08, z);
    scene.add(berry);
    berries.push(berry);
  }

  const rover = ctx.rover.clone();
  scene.add(rover);

  return {
    scene,
    update(t, camera) {
      const z = lerp(-9, 7, easeInOut(t));
      rover.position.set(-1, height(-1, z), z);
      rover.rotation.y = 0;
      for (const berry of berries) {
        const near = Math.max(0, 1 - Math.abs(berry.position.z - z) / 3);
        (berry.material as THREE.MeshStandardMaterial).emissiveIntensity = near * 1.6;
      }
      camera.position.set(-6 + t * 2, 2.2, z - 5);
      camera.lookAt(0, 0.6, z + 2);
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 3. The Long Drive: years of days and nights, a growing trail of wheel tracks
// ---------------------------------------------------------------------------------------------

export function longDrive(ctx: SceneContext): CinemaScene {
  const scene = new THREE.Scene();
  scene.background = MARS_SKY.clone();
  scene.fog = new THREE.Fog(MARS_SKY, 60, 160);
  const height = (x: number, z: number) => marsHeight(x, z) * 0.6;
  scene.add(buildMarsTerrain(180, 160, height));
  scatterRocks(scene, height, 160, 150);
  const { ambient, sun } = marsLights(scene);

  const path = new THREE.CatmullRomCurve3(
    [
      [-50, 30],
      [-30, 18],
      [-20, -5],
      [0, -12],
      [15, 5],
      [30, 0],
      [45, -20],
      [55, -35],
    ].map(([x, z]) => new THREE.Vector3(x, height(x, z) + 0.05, z)),
  );
  const samples = 400;
  const points = path
    .getSpacedPoints(samples)
    .map((p) => new THREE.Vector3(p.x, height(p.x, p.z) + 0.06, p.z));
  // Wheel tracks as a thin ribbon (lines are 1px in WebGL), revealed as the rover drives.
  const radial = 4;
  const trackGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    samples,
    0.22,
    radial,
  );
  const track = new THREE.Mesh(
    trackGeo,
    new THREE.MeshStandardMaterial({ color: 0x4a200f, roughness: 1 }),
  );
  scene.add(track);

  const rover = ctx.rover.clone();
  rover.scale.multiplyScalar(1.4);
  scene.add(rover);
  const skyDay = MARS_SKY.clone();
  const skyNight = new THREE.Color(0x4a2c33);

  return {
    scene,
    update(t, camera) {
      const u = easeInOut(t);
      const p = path.getPointAt(u);
      const ahead = path.getPointAt(Math.min(1, u + 0.01));
      rover.position.set(p.x, height(p.x, p.z), p.z);
      rover.lookAt(ahead.x, rover.position.y, ahead.z);
      trackGeo.setDrawRange(0, Math.floor(u * samples) * radial * 6);

      // Days and nights race past to show the years going by.
      const day = t * 14 * Math.PI * 2;
      const elevation = Math.sin(day);
      sun.position.set(Math.cos(day) * 60, Math.max(elevation, -0.2) * 60, 20);
      const light = THREE.MathUtils.smoothstep(elevation, -0.2, 0.3);
      sun.intensity = 0.5 + light * 1.3;
      ambient.intensity = 0.5 + light * 0.35;
      (scene.background as THREE.Color).copy(skyNight).lerp(skyDay, light);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);

      // Chase camera, behind and above the rover, looking along the trail.
      const back = new THREE.Vector3(p.x - ahead.x, 0, p.z - ahead.z).normalize();
      const cx = p.x + back.x * 14 + 4;
      const cz = p.z + back.z * 14 + 4;
      camera.position.set(cx, Math.max(height(cx, cz), p.y) + 9, cz);
      camera.lookAt(p.x, p.y + 1, p.z);
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 4. The Silence: the 2018 dust storm darkens the sky; the rover's signal fades away
// ---------------------------------------------------------------------------------------------

export function dustStormSilence(ctx: SceneContext): CinemaScene {
  const scene = new THREE.Scene();
  const height = craterHeight(14, 3, 0.25);
  scene.add(buildMarsTerrain(120, 150, height, false));
  scatterRocks(scene, height, 90, 80);
  const { ambient, sun } = marsLights(scene);
  const clear = MARS_SKY.clone();
  const storm = new THREE.Color(0x3b2116);
  scene.background = clear.clone();
  scene.fog = new THREE.Fog(clear, 30, 100);

  const rover = ctx.rover.clone();
  const rx = -14;
  rover.position.set(rx, height(rx, 2), 2);
  rover.rotation.y = Math.PI / 2;
  scene.add(rover);

  // Expanding rings = radio signal sent home; they grow weaker and then stop.
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.04, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x9db4ff, transparent: true, opacity: 0 }),
    );
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    rings.push(ring);
  }
  const power = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('#ffd27a'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  power.scale.set(1.3, 1.3, 1);
  scene.add(power);

  // Blowing dust
  const count = 2500;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++)
    pos.set([Math.random() * 80 - 60, Math.random() * 18, Math.random() * 60 - 30], i * 3);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xc98a5a,
    size: 0.22,
    transparent: true,
    opacity: 0,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  return {
    scene,
    update(t, camera, time) {
      const stormy = easeInOut(seg(t, 0.05, 0.7));
      (scene.background as THREE.Color).copy(clear).lerp(storm, stormy);
      const fog = scene.fog as THREE.Fog;
      fog.color.copy(scene.background as THREE.Color);
      fog.near = 30 - stormy * 26;
      fog.far = 100 - stormy * 82;
      sun.intensity = 1.7 * (1 - stormy) + 0.05;
      ambient.intensity = 0.75 * (1 - stormy * 0.8);
      dustMat.opacity = stormy * 0.85;
      dust.position.x = (time * 6) % 20;

      // Signal: strong at first, weaker and slower, then gone after the last contact.
      const strength = 1 - seg(t, 0.35, 0.82);
      const top = rover.position.clone().add(new THREE.Vector3(0, 2.2, 0));
      rings.forEach((ring, i) => {
        const phase = (time * 0.6 + i / rings.length) % 1;
        ring.position.copy(top).add(new THREE.Vector3(0, phase * 1.4, 0));
        ring.scale.setScalar(0.3 + phase * 1.5);
        (ring.material as THREE.MeshBasicMaterial).opacity = strength * (1 - phase) * 0.9;
      });
      power.position.copy(top);
      (power.material as THREE.SpriteMaterial).opacity = 0.15 + strength * 0.85;

      const a = t * 0.6;
      camera.position.set(rx + Math.sin(a) * 12 + 2, 4.5 + t * 2.5, 2 + Math.cos(a) * 12);
      camera.lookAt(rx, rover.position.y + 1.2, 2);
    },
  };
}
