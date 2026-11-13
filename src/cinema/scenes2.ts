/**
 * Cinema scenes for Apollo 11, Spirit, Phoenix, Sojourner and Pioneer 10. Same contract as
 * scenes.ts: `update(t)` draws the moment at chapter progress t (0 → 1). Artist's animations of
 * events from the NASA record; shapes, colours, distances and timings are simplified.
 */
import * as THREE from 'three';
import { buildMarsTerrain, buildSimpleRover, marsHeight } from '../three/marsScene';
import { makeGlowTexture, makePlanetTexture, makeStarfield } from '../three/textures';
import {
  buildAsteroidField,
  buildAstronaut,
  buildFlag,
  buildLunarModule,
  buildPathfinder,
  buildPhoenix,
  buildRetroreflector,
  footprint,
  signalRings,
} from './props';
import {
  easeIn,
  easeInOut,
  lerp,
  MARS_SKY,
  marsLights,
  scatterRocks,
  seg,
  type CinemaScene,
  type SceneContext,
} from './scenes';

type Height = (x: number, z: number) => number;

// =============================================================================================
// THE MOON (Apollo 11)
// =============================================================================================

const MOON_TINT: [number, number, number] = [0.6, 0.6, 0.63];
const moonHeight: Height = (x, z) => {
  let h = marsHeight(x * 0.7, z * 0.7) * 0.18;
  for (const [cx, cz, r, d] of [
    [-14, -10, 4, 0.9],
    [12, -16, 6, 1.2],
    [18, 8, 3, 0.6],
    [-20, 14, 5, 1],
    [6, -30, 8, 1.5],
  ]) {
    const dist = Math.hypot(x - cx, z - cz);
    if (dist < r) h -= d * (1 - (dist / r) ** 2);
    h += Math.exp(-(((dist - r) / 0.8) ** 2)) * d * 0.3;
  }
  return h;
};

function moonWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.add(makeStarfield(1500, 300));
  scene.add(buildMarsTerrain(120, 160, moonHeight, false, MOON_TINT));
  scatterRocks(scene, moonHeight, 80, 90);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-40, 30, 20);
  scene.add(sun);
  // Earth hanging in the black sky.
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(6, 48, 48),
    new THREE.MeshStandardMaterial({ map: makePlanetTexture('earth', 9), roughness: 0.9 }),
  );
  earth.position.set(40, 45, -120);
  scene.add(earth);
  return scene;
}

/** Apollo 1: the two-stage Lunar Module descends to the Sea of Tranquility. */
export function lmDescent(): CinemaScene {
  const scene = moonWorld();
  const lm = buildLunarModule();
  scene.add(lm.group);
  lm.ascentGlow.visible = false;
  const dust = new THREE.Mesh(
    new THREE.RingGeometry(1, 5, 32),
    new THREE.MeshBasicMaterial({
      color: 0xbfbfbf,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  );
  dust.rotation.x = -Math.PI / 2;
  dust.position.y = moonHeight(0, 0) + 0.05;
  scene.add(dust);
  const ground = moonHeight(0, 0);

  return {
    scene,
    update(t, camera, time) {
      const fall = easeInOut(seg(t, 0, 0.7));
      const y = lerp(30, ground, fall);
      lm.group.position.set(lerp(-12, 0, fall), y, 0);
      lm.group.rotation.y = 0.4 - fall * 0.4;
      const burning = t < 0.72;
      lm.engineGlow.visible = burning;
      lm.engineGlow.scale.setScalar(2.2 + Math.sin(time * 30) * 0.3);
      const near = 1 - Math.min(1, (y - ground) / 6);
      (dust.material as THREE.MeshBasicMaterial).opacity = burning ? near * 0.5 : 0;
      dust.scale.setScalar(1 + near);
      // Show the two stages apart for a moment: "two machines in one".
      lm.ascent.position.y = Math.sin(seg(t, 0.78, 0.98) * Math.PI) * 1.2;
      const a = t * 0.8;
      camera.position.set(Math.sin(a) * 14 + 4, y + 3 - fall * 1.5, Math.cos(a) * 14);
      camera.lookAt(lm.group.position.x, y + 2, 0);
    },
  };
}

/** Apollo 2: two astronauts walk on the Moon, leave footprints, plant a flag and set up experiments. */
export function moonWalk(): CinemaScene {
  const scene = moonWorld();
  const ground = (x: number, z: number) => moonHeight(x, z);
  const lm = buildLunarModule();
  lm.engineGlow.visible = false;
  lm.ascentGlow.visible = false;
  lm.group.position.y = ground(0, 0);
  scene.add(lm.group);

  const paths = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 2.6),
      new THREE.Vector3(2, 0, 6),
      new THREE.Vector3(5.5, 0, 7),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 2.6),
      new THREE.Vector3(-2.5, 0, 5),
      new THREE.Vector3(-5, 0, 4),
    ]),
  ];
  const astronauts = paths.map(() => buildAstronaut());
  astronauts.forEach((a) => scene.add(a.group));
  const prints = paths.map((p) =>
    p.getSpacedPoints(24).map((pt, i) => {
      const f = footprint();
      f.position.set(pt.x + (i % 2 ? 0.12 : -0.12), ground(pt.x, pt.z) + 0.03, pt.z);
      f.visible = false;
      scene.add(f);
      return f;
    }),
  );
  const flag = buildFlag();
  flag.position.set(5.8, ground(5.8, 7.5), 7.5);
  scene.add(flag);
  const reflector = buildRetroreflector();
  reflector.position.set(-5.4, ground(-5.4, 4.6), 4.6);
  scene.add(reflector);

  return {
    scene,
    update(t, camera, time) {
      const walk = seg(t, 0.05, 0.75);
      astronauts.forEach((a, i) => {
        const p = paths[i].getPointAt(walk);
        const ahead = paths[i].getPointAt(Math.min(1, walk + 0.02));
        a.group.position.set(p.x, ground(p.x, p.z) + Math.abs(Math.sin(time * 4 + i)) * 0.15, p.z);
        a.group.lookAt(ahead.x, a.group.position.y, ahead.z);
        a.legL.rotation.x = Math.sin(time * 6 + i) * 0.4;
        a.legR.rotation.x = -Math.sin(time * 6 + i) * 0.4;
        prints[i].forEach((f, k) => (f.visible = k / prints[i].length < walk));
      });
      flag.visible = t > 0.72;
      reflector.visible = t > 0.75;
      const a = 0.6 + t * 0.7;
      camera.position.set(Math.sin(a) * 13, 5, Math.cos(a) * 13);
      camera.lookAt(0, 1.5, 3);
    },
  };
}

/** Apollo 3: the ascent stage fires its engine and lifts off, leaving the descent stage behind. */
export function lmLiftoff(): CinemaScene {
  const scene = moonWorld();
  const ground = moonHeight(0, 0);
  const lm = buildLunarModule();
  lm.engineGlow.visible = false;
  lm.group.position.y = ground;
  scene.add(lm.group);
  const flag = buildFlag();
  flag.position.set(-5.5, moonHeight(-5.5, 6), 6);
  scene.add(flag);

  return {
    scene,
    update(t, camera, time) {
      const lift = easeIn(seg(t, 0.25, 1));
      lm.ascent.position.y = lift * 40;
      lm.ascentGlow.visible = t > 0.22;
      lm.ascentGlow.scale.setScalar(1.6 + Math.sin(time * 30) * 0.3);
      const look = lm.ascent.position.y * 0.6 + 2.5;
      camera.position.set(10, 2 + lift * 6, 12);
      camera.lookAt(0, ground + look, 0);
    },
  };
}

/** Apollo 4: the descent stage is still there; a laser from Earth bounces off the reflector. */
export function moonStillHere(): CinemaScene {
  const scene = moonWorld();
  const ground = (x: number, z: number) => moonHeight(x, z);
  const lm = buildLunarModule();
  lm.engineGlow.visible = false;
  lm.ascent.visible = false;
  lm.group.position.y = ground(0, 0);
  scene.add(lm.group);
  const flag = buildFlag();
  flag.position.set(5.8, ground(5.8, 7.5), 7.5);
  scene.add(flag);
  const reflector = buildRetroreflector();
  const rpos = new THREE.Vector3(-5.4, ground(-5.4, 4.6), 4.6);
  reflector.position.copy(rpos);
  scene.add(reflector);
  for (let i = 0; i < 40; i++) {
    const f = footprint();
    const x = Math.sin(i * 1.7) * 5;
    const z = 2 + Math.cos(i * 1.3) * 3 + i * 0.08;
    f.position.set(x, ground(x, z) + 0.03, z);
    f.rotation.z = i;
    scene.add(f);
  }
  // Laser pulse from the direction of Earth.
  const earthDir = new THREE.Vector3(40, 45, -120).normalize();
  const beamLen = 60;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, beamLen, 6),
    new THREE.MeshBasicMaterial({
      color: 0x4dff6a,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.copy(
    rpos
      .clone()
      .add(new THREE.Vector3(0, 0.4, 0))
      .add(earthDir.clone().multiplyScalar(beamLen / 2)),
  );
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), earthDir);
  scene.add(beam);
  const flash = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('#6dff7f'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  flash.position.copy(rpos).add(new THREE.Vector3(0, 0.4, 0));
  scene.add(flash);

  return {
    scene,
    update(t, camera, time) {
      const pulse = t > 0.35 ? (Math.sin(time * 5) + 1) / 2 : 0;
      (beam.material as THREE.MeshBasicMaterial).opacity = pulse * 0.8;
      flash.scale.setScalar(0.2 + pulse * 1.5);
      const a = -0.3 + t * 0.9;
      camera.position.set(Math.sin(a) * 15 - 2, 4.5 + t * 2, Math.cos(a) * 15 + 2);
      camera.lookAt(-1.5, 1.2, 2.5);
    },
  };
}

// =============================================================================================
// SPIRIT (Gusev crater)
// =============================================================================================

const hillHeight: Height = (x, z) =>
  marsHeight(x, z) * 0.3 + Math.exp(-((x * x + (z + 30) * (z + 30)) / 300)) * 12;

/** Spirit 2: driving up the Columbia Hills. */
export function hillClimb(ctx: SceneContext): CinemaScene {
  const scene = new THREE.Scene();
  scene.background = MARS_SKY.clone();
  scene.fog = new THREE.Fog(MARS_SKY, 40, 140);
  scene.add(buildMarsTerrain(140, 160, hillHeight, false));
  scatterRocks(scene, hillHeight, 140, 110);
  marsLights(scene);
  const rover = ctx.rover.clone();
  scene.add(rover);
  return {
    scene,
    update(t, camera) {
      const z = lerp(12, -24, easeInOut(t));
      const y = hillHeight(0, z);
      const ahead = hillHeight(0, z - 1);
      rover.position.set(0, y, z);
      rover.rotation.set(0, Math.PI, 0);
      rover.rotateX(-Math.atan2(ahead - y, 1) * 0.9);
      camera.position.set(8, y + 4, z + 10);
      camera.lookAt(0, y + 1, z - 3);
    },
  };
}

/** Spirit 3: driving backwards, dragging a stuck wheel that scrapes up bright silica-rich soil. */
export function silicaScrape(ctx: SceneContext): CinemaScene {
  const scene = new THREE.Scene();
  scene.background = MARS_SKY.clone();
  scene.fog = new THREE.Fog(MARS_SKY, 30, 100);
  const height: Height = (x, z) => marsHeight(x, z) * 0.15;
  scene.add(buildMarsTerrain(90, 120, height, false));
  scatterRocks(scene, height, 60, 60);
  marsLights(scene);
  const rover = ctx.rover.clone();
  scene.add(rover);
  const samples = 80;
  const trench = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 1, 1, samples),
    new THREE.MeshStandardMaterial({ color: 0xf6f2e8, emissive: 0x6b6458, roughness: 0.9 }),
  );
  trench.rotation.x = -Math.PI / 2;
  scene.add(trench);
  const startZ = -8;
  const endZ = 8;
  return {
    scene,
    update(t, camera, time) {
      const z = lerp(startZ, endZ, easeInOut(seg(t, 0, 0.8)));
      // Facing -z while moving +z: driving backwards.
      rover.position.set(0, height(0, z), z);
      rover.rotation.y = Math.PI;
      const len = Math.max(0.01, z - startZ);
      trench.scale.set(1, len, 1);
      trench.position.set(0.55, height(0.55, z) + 0.04, z - len / 2 - 1);
      const glint = t > 0.75 ? 0.4 + Math.sin(time * 4) * 0.2 : 0.1;
      (trench.material as THREE.MeshStandardMaterial).emissiveIntensity = glint;
      camera.position.set(5, 3 + t, z - 6);
      camera.lookAt(0.5, 0.3, z - len / 2);
    },
  };
}

/** Spirit 4: stuck in soft soil at Troy; winter comes and the signal fades. */
export function stuckWinter(ctx: SceneContext): CinemaScene {
  const scene = new THREE.Scene();
  const clear = MARS_SKY.clone();
  const winter = new THREE.Color(0x2d2230);
  scene.background = clear.clone();
  scene.fog = new THREE.Fog(clear, 30, 100);
  const height: Height = (x, z) => marsHeight(x, z) * 0.2;
  scene.add(buildMarsTerrain(90, 120, height, false));
  scatterRocks(scene, height, 70, 70);
  const { ambient, sun } = marsLights(scene);
  const rover = ctx.rover.clone();
  scene.add(rover);
  const rings = signalRings(scene);
  const puffs = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.BufferAttribute(
        Float32Array.from({ length: 300 }, (_, i) =>
          i % 3 === 1 ? Math.random() * 0.8 : (Math.random() - 0.5) * 3,
        ),
        3,
      ),
    ),
    new THREE.PointsMaterial({ color: 0xd9a27a, size: 0.12, transparent: true, opacity: 0 }),
  );
  scene.add(puffs);

  return {
    scene,
    update(t, camera, time) {
      const sink = easeInOut(seg(t, 0, 0.35)) * 0.45;
      rover.position.set(0, height(0, 0) - sink, 0);
      rover.rotation.y = 0.5;
      puffs.position.copy(rover.position);
      (puffs.material as THREE.PointsMaterial).opacity =
        t < 0.35 ? Math.abs(Math.sin(time * 6)) * 0.6 : 0;
      const dark = easeInOut(seg(t, 0.3, 0.85));
      (scene.background as THREE.Color).copy(clear).lerp(winter, dark);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
      sun.intensity = 1.7 * (1 - dark) + 0.08;
      ambient.intensity = 0.75 * (1 - dark * 0.75);
      rings(rover.position.clone().add(new THREE.Vector3(0, 2.2, 0)), 1 - seg(t, 0.45, 0.85), time);
      const a = 0.4 + t * 0.6;
      camera.position.set(Math.sin(a) * 9, 4, Math.cos(a) * 9);
      camera.lookAt(0, 1, 0);
    },
  };
}

// =============================================================================================
// PHOENIX (Martian Arctic)
// =============================================================================================

const ARCTIC_SKY = new THREE.Color(0xc9a58d);
/** Flat plains cracked into polygons, like the patterned ground where Phoenix landed. */
const arcticHeight: Height = (x, z) => {
  const trough = (v: number) => Math.pow(1 - Math.abs(Math.sin(v)), 8);
  return marsHeight(x, z) * 0.05 - 0.12 * Math.max(trough(x * 0.45), trough(z * 0.45 + x * 0.2));
};
const ARCTIC_TINT: [number, number, number] = [0.66, 0.46, 0.34];

function arcticWorld() {
  const scene = new THREE.Scene();
  scene.background = ARCTIC_SKY.clone();
  scene.fog = new THREE.Fog(ARCTIC_SKY, 30, 110);
  scene.add(buildMarsTerrain(110, 180, arcticHeight, false, ARCTIC_TINT));
  scatterRocks(scene, arcticHeight, 40, 80);
  return { scene, ...marsLights(scene) };
}

/** Phoenix 1: rocket thrusters slow the lander onto the Arctic plains; the round arrays open. */
export function phoenixLanding(): CinemaScene {
  const { scene } = arcticWorld();
  const px = buildPhoenix();
  scene.add(px.group);
  const thrusters = [0, 1, 2].map((i) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('#ffb35a'),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const a = (i / 3) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.6, 0.6, Math.sin(a) * 0.6);
    px.group.add(s);
    return s;
  });
  return {
    scene,
    update(t, camera, time) {
      const fall = easeInOut(seg(t, 0, 0.6));
      const y = lerp(28, 0, fall);
      px.group.position.set(0, arcticHeight(0, 0) + y, 0);
      thrusters.forEach((s) => {
        s.visible = t < 0.62;
        s.scale.setScalar(1.2 + Math.sin(time * 35) * 0.25);
      });
      const open = easeInOut(seg(t, 0.68, 0.9));
      px.arrays.forEach((fan, i) => fan.scale.setScalar(Math.max(0.05, open) * (i ? 1 : 1)));
      px.arm.rotation.x = 0.4;
      const a = 0.3 + t * 0.9;
      camera.position.set(Math.sin(a) * 10, Math.max(3, y * 0.6 + 3), Math.cos(a) * 10);
      camera.lookAt(0, px.group.position.y + 1, 0);
    },
  };
}

/** Phoenix 2: the arm digs a trench; bright chunks appear, then vanish into the thin air (ice). */
export function phoenixDig(): CinemaScene {
  const { scene } = arcticWorld();
  const px = buildPhoenix();
  px.group.position.y = arcticHeight(0, 0);
  scene.add(px.group);
  const trench = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 1 }),
  );
  trench.rotation.x = -Math.PI / 2;
  trench.position.set(0, arcticHeight(0, 2.3) + 0.03, 2.4);
  scene.add(trench);
  const chunks = Array.from({ length: 7 }, (_, i) => {
    const c = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.08, 0.13),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x99aabb, transparent: true }),
    );
    c.position.set(-0.3 + (i % 4) * 0.2, trench.position.y + 0.03, 2.25 + Math.floor(i / 4) * 0.2);
    scene.add(c);
    return c;
  });
  return {
    scene,
    update(t, camera, time) {
      // dig cycles
      const dig = t < 0.45 ? (Math.sin(time * 2) + 1) / 2 : 0.2;
      px.arm.rotation.x = 0.35 + dig * 0.35;
      px.elbow.rotation.x = 0.5 + dig * 0.4;
      trench.scale.set(1, 0.2 + seg(t, 0, 0.45) * 0.8, 1);
      // ice appears after digging, then sublimates away over the "days"
      const show = seg(t, 0.4, 0.5);
      const vanish = seg(t, 0.6, 0.95);
      chunks.forEach((c, i) => {
        const s = show * (1 - Math.min(1, vanish * (1 + i * 0.15)));
        c.scale.setScalar(Math.max(0.001, s));
        (c.material as THREE.MeshStandardMaterial).opacity = s;
      });
      camera.position.set(5.5, 3.6, 7.8 - t * 0.8);
      camera.lookAt(0, 0.2, 2.4);
    },
  };
}

/** Phoenix 3: the laser points up and sees snow falling from clouds, vanishing before the ground. */
export function phoenixSnow(): CinemaScene {
  const { scene, sun, ambient } = arcticWorld();
  sun.intensity = 0.6;
  ambient.intensity = 0.5;
  scene.background = new THREE.Color(0x6f5a6a);
  (scene.fog as THREE.Fog).color.set(0x6f5a6a);
  const px = buildPhoenix();
  px.group.position.y = arcticHeight(0, 0);
  scene.add(px.group);
  const beamLen = 18;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, beamLen, 6),
    new THREE.MeshBasicMaterial({
      color: 0x5dff7a,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.set(-0.4, px.group.position.y + 1.4 + beamLen / 2, 0.2);
  scene.add(beam);
  const clouds = new THREE.Group();
  const cloudTex = makeGlowTexture('#e8e4f0');
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    );
    c.position.set((Math.sin(i * 3.1) - 0.2) * 10, 17 + Math.cos(i) * 1.2, Math.cos(i * 2.3) * 6);
    c.scale.set(8, 3, 1);
    clouds.add(c);
  }
  scene.add(clouds);
  const count = 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++)
    pos.set(
      [(Math.random() - 0.5) * 18, 16 + Math.random() * 2, (Math.random() - 0.5) * 12],
      i * 3,
    );
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.9 }),
  );
  scene.add(snow);
  return {
    scene,
    update(t, camera, time) {
      (beam.material as THREE.MeshBasicMaterial).opacity =
        t > 0.1 ? 0.5 + Math.sin(time * 20) * 0.3 : 0;
      // Snow falls from ~17 m and disappears around ~8 m: it never reaches the ground.
      const p = snowGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        let y = p.getY(i) - 0.03;
        if (y < 8 + (i % 7) * 0.3) y = 16 + Math.random() * 2;
        p.setY(i, y);
      }
      p.needsUpdate = true;
      (snow.material as THREE.PointsMaterial).opacity = seg(t, 0.25, 0.4) * 0.9;
      clouds.position.x = Math.sin(time * 0.1) * 2;
      camera.position.set(9, 3 + t * 2, 9);
      camera.lookAt(0, 8 + t * 2, 0);
    },
  };
}

/** Phoenix 4: the Sun sinks, winter darkness and ice arrive, the signal fades, an array breaks. */
export function phoenixWinter(): CinemaScene {
  const { scene, sun, ambient } = arcticWorld();
  const px = buildPhoenix();
  px.group.position.y = arcticHeight(0, 0);
  scene.add(px.group);
  const rings = signalRings(scene);
  const day = ARCTIC_SKY.clone();
  const night = new THREE.Color(0x141826);
  const frost = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0xeaf2ff,
      transparent: true,
      opacity: 0,
      roughness: 0.4,
    }),
  );
  frost.position.copy(px.group.position);
  frost.scale.y = 0.6;
  scene.add(frost);
  return {
    scene,
    update(t, camera, time) {
      const dark = easeInOut(seg(t, 0.05, 0.6));
      sun.position.set(40, 50 * (1 - dark) + 2, 20);
      sun.intensity = 1.7 * (1 - dark) + 0.1;
      ambient.intensity = 0.75 * (1 - dark * 0.7);
      (scene.background as THREE.Color).copy(day).lerp(night, dark);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
      rings(
        px.group.position.clone().add(new THREE.Vector3(0, 2.3, 0)),
        1 - seg(t, 0.3, 0.6),
        time,
      );
      (frost.material as THREE.MeshStandardMaterial).opacity = seg(t, 0.6, 0.85) * 0.55;
      // Ice weighs down one of the round arrays.
      px.arrays[1].rotation.x = -Math.PI / 2 + seg(t, 0.85, 1) * 0.6;
      const a = 0.2 + t * 0.6;
      camera.position.set(Math.sin(a) * 8, 3.5, Math.cos(a) * 8);
      camera.lookAt(0, 1, 0);
    },
  };
}

// =============================================================================================
// SOJOURNER (Ares Vallis)
// =============================================================================================

function aresWorld() {
  const scene = new THREE.Scene();
  scene.background = MARS_SKY.clone();
  scene.fog = new THREE.Fog(MARS_SKY, 25, 90);
  const height: Height = (x, z) => marsHeight(x, z) * 0.12;
  scene.add(buildMarsTerrain(90, 120, height, false));
  scatterRocks(scene, height, 160, 50);
  const lights = marsLights(scene);
  const pf = buildPathfinder();
  pf.petals.forEach((p) => (p.rotation.x = 0));
  pf.group.position.y = height(0, 0);
  scene.add(pf.group);
  const rover = buildSimpleRover();
  rover.scale.setScalar(0.32);
  scene.add(rover);
  return { scene, height, pf, rover, ...lights };
}

/** Sojourner 2: driving up to the rocks Barnacle Bill and Yogi to measure what they are made of. */
export function rockGarden(): CinemaScene {
  const { scene, height, rover } = aresWorld();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x6b3b26,
    roughness: 1,
    flatShading: true,
  });
  const bill = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), rockMat);
  bill.position.set(2.2, height(2.2, 3) + 0.3, 3);
  const yogi = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), rockMat);
  yogi.scale.set(1.3, 0.8, 1);
  yogi.position.set(-2.6, height(-2.6, 5.5) + 0.5, 5.5);
  scene.add(bill, yogi);
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 2.6),
    new THREE.Vector3(1.6, 0, 2.6),
    new THREE.Vector3(1.4, 0, 4),
    new THREE.Vector3(-1.2, 0, 5.5),
  ]);
  return {
    scene,
    update(t, camera) {
      const u = easeInOut(t);
      const p = path.getPointAt(u);
      const ahead = path.getPointAt(Math.min(1, u + 0.02));
      rover.position.set(p.x, height(p.x, p.z), p.z);
      rover.lookAt(ahead.x, rover.position.y, ahead.z);
      camera.position.set(p.x + 3, 1.6, p.z - 3);
      camera.lookAt(p.x, 0.3, p.z + 1);
    },
  };
}

/** Sojourner 3: a loop around the lander as the Martian evening comes. */
export function sojournerDusk(): CinemaScene {
  const { scene, height, rover, sun, ambient } = aresWorld();
  const day = MARS_SKY.clone();
  // Martian sunsets are blue-tinted near the Sun.
  const dusk = new THREE.Color(0x5b5f86);
  return {
    scene,
    update(t, camera) {
      const a = t * Math.PI * 1.6;
      const x = Math.sin(a) * 2.6;
      const z = Math.cos(a) * 2.6;
      rover.position.set(x, height(x, z), z);
      rover.lookAt(Math.sin(a + 0.1) * 2.6, rover.position.y, Math.cos(a + 0.1) * 2.6);
      const d = easeInOut(seg(t, 0.2, 1));
      (scene.background as THREE.Color).copy(day).lerp(dusk, d);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
      sun.position.set(40, 40 * (1 - d) + 3, -30);
      sun.intensity = 1.7 - d * 1.1;
      ambient.intensity = 0.75 - d * 0.35;
      camera.position.set(6, 3, 6);
      camera.lookAt(0, 0.4, 0);
    },
  };
}

/** Sojourner 4: night falls; the lander's last signal fades and the little rover goes quiet. */
export function pathfinderSilence(): CinemaScene {
  const { scene, height, pf, rover, sun, ambient } = aresWorld();
  rover.position.set(1.4, height(1.4, 2.2), 2.2);
  rover.rotation.y = -0.6;
  const rings = signalRings(scene, 0x9db4ff, 1.1);
  const night = new THREE.Color(0x101322);
  const dusk = new THREE.Color(0x5b5f86);
  const stars = makeStarfield(800, 200);
  (stars.material as THREE.PointsMaterial).transparent = true;
  scene.add(stars);
  return {
    scene,
    update(t, camera, time) {
      const d = easeInOut(seg(t, 0, 0.5));
      (scene.background as THREE.Color).copy(dusk).lerp(night, d);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
      sun.intensity = 0.6 * (1 - d) + 0.05;
      ambient.intensity = 0.4 * (1 - d) + 0.15;
      (stars.material as THREE.PointsMaterial).opacity = d;
      rings(
        pf.group.position.clone().add(new THREE.Vector3(0.35, 0.6, 0)),
        1 - seg(t, 0.35, 0.8),
        time,
        1.2,
      );
      const a = 0.9 + t * 0.4;
      camera.position.set(Math.sin(a) * 6, 2.4, Math.cos(a) * 6);
      camera.lookAt(0.5, 0.4, 1);
    },
  };
}

// =============================================================================================
// PIONEER 10 (deep space)
// =============================================================================================

function spaceWorld(sunDistance: number) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.add(makeStarfield(2500, 400));
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const sunLight = new THREE.DirectionalLight(0xffffff, 2);
  sunLight.position.set(-30, 10, sunDistance);
  scene.add(sunLight);
  const sun = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('#ffe2a0'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sun.position.copy(sunLight.position).multiplyScalar(4);
  scene.add(sun);
  return { scene, sun };
}

/** Pioneer 1: leaving Earth behind and crossing the asteroid belt. */
export function asteroidBelt(ctx: SceneContext): CinemaScene {
  const { scene, sun } = spaceWorld(60);
  sun.scale.setScalar(60);
  const craft = ctx.pioneer.clone();
  scene.add(craft);
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(3, 48, 48),
    new THREE.MeshStandardMaterial({ map: makePlanetTexture('earth', 6) }),
  );
  earth.position.set(-4, -2, 12);
  scene.add(earth);
  const field = buildAsteroidField(220, 50, 160);
  field.position.z = -30;
  scene.add(field);
  return {
    scene,
    update(t, camera, time) {
      const z = lerp(0, -170, easeInOut(t));
      craft.position.set(0, 0, z);
      craft.rotation.z = time * 0.3;
      earth.visible = t < 0.35;
      camera.position.set(2.6, 1.4, z + 6.5);
      camera.lookAt(0, 0, z - 2);
    },
  };
}

/** Pioneer 2: the first close-up visit to Jupiter. */
export function jupiterFlyby(ctx: SceneContext): CinemaScene {
  const { scene, sun } = spaceWorld(80);
  sun.scale.setScalar(25);
  const tex = makePlanetTexture('gas', 21);
  // Great Red Spot
  const canvas = tex.image as HTMLCanvasElement;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#b5532f';
  g.beginPath();
  g.ellipse(330, 160, 26, 14, 0, 0, Math.PI * 2);
  g.fill();
  tex.needsUpdate = true;
  const jupiter = new THREE.Mesh(
    new THREE.SphereGeometry(30, 96, 96),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
  );
  jupiter.position.set(-20, -8, -70);
  scene.add(jupiter);
  const craft = ctx.pioneer.clone();
  scene.add(craft);
  return {
    scene,
    update(t, camera, time) {
      const x = lerp(25, -25, easeInOut(t));
      craft.position.set(x, 4, -22);
      craft.rotation.z = time * 0.3;
      jupiter.rotation.y = time * 0.05;
      camera.position.set(x * 0.6 + 6, 7, -8);
      camera.lookAt(x, 3, -26);
    },
  };
}

/** Pioneer 3: far from the Sun (a bright star now), powered by RTGs, carrying its plaque. */
export function deepCoast(ctx: SceneContext): CinemaScene {
  const { scene, sun } = spaceWorld(200);
  sun.scale.setScalar(8);
  const craft = ctx.pioneer.clone();
  scene.add(craft);
  const rtgGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('#ff8a3a'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.6,
    }),
  );
  rtgGlow.scale.set(2.2, 2.2, 1);
  craft.add(rtgGlow);
  // The gold plaque, shown as a simple engraved panel (not a copy of the real drawing).
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#d6b052';
  c.fillRect(0, 0, 256, 160);
  c.strokeStyle = '#7a5a12';
  c.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    c.beginPath();
    c.arc(30 + i * 24, 140, 3 + (i === 2 ? 3 : 0), 0, Math.PI * 2);
    c.stroke();
  }
  for (let i = 0; i < 14; i++) {
    c.beginPath();
    c.moveTo(60, 60);
    const a = (i / 14) * Math.PI * 2;
    c.lineTo(60 + Math.cos(a) * 45, 60 + Math.sin(a) * 45);
    c.stroke();
  }
  const ptex = new THREE.CanvasTexture(canvas);
  ptex.colorSpace = THREE.SRGBColorSpace;
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1),
    new THREE.MeshStandardMaterial({
      map: ptex,
      metalness: 0.8,
      roughness: 0.3,
      side: THREE.DoubleSide,
    }),
  );
  scene.add(plaque);
  return {
    scene,
    update(t, camera, time) {
      craft.rotation.y = time * 0.15;
      (rtgGlow.material as THREE.SpriteMaterial).opacity = 0.4 + Math.sin(time * 2) * 0.15;
      plaque.visible = t > 0.5;
      plaque.position.set(2.2, 0.8, 1.5);
      plaque.lookAt(camera.position);
      const zoom = easeInOut(seg(t, 0.5, 0.75));
      camera.position.set(lerp(6, 3.8, zoom), lerp(2, 1, zoom), lerp(7, 3.6, zoom));
      camera.lookAt(lerp(0, 2.2, zoom), lerp(0, 0.8, zoom), lerp(0, 1.5, zoom));
    },
  };
}

/** Pioneer 4: the signal home grows faint and stops; the craft coasts on towards Aldebaran. */
export function faintSignal(ctx: SceneContext): CinemaScene {
  const { scene, sun } = spaceWorld(250);
  sun.scale.setScalar(4);
  const craft = ctx.pioneer.clone();
  scene.add(craft);
  const rings = signalRings(scene, 0x9db4ff, 1.4);
  const aldebaran = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('#ff8a5a'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  aldebaran.position.set(-30, 12, -200);
  aldebaran.scale.setScalar(14);
  scene.add(aldebaran);
  return {
    scene,
    update(t, camera, time) {
      const z = -t * 30;
      craft.position.set(0, 0, z);
      craft.rotation.z = time * 0.2;
      rings(
        craft.position.clone().add(new THREE.Vector3(0, 0.8, 1)),
        1 - seg(t, 0.2, 0.7),
        time,
        2,
      );
      camera.position.set(3, 1.5, 9 + z * 0.4);
      camera.lookAt(-6 * t, 1.5 * t, z - 10);
    },
  };
}
