/**
 * Simple hand-built 3D props for the cinema films, for hardware NASA has no 3D model of (or
 * that must come apart, like the two Lunar Module stages). Shapes follow the real designs in
 * broad strokes only; the films are labelled as artist's animations.
 */
import * as THREE from 'three';
import { makeGlowTexture } from '../three/textures';

const gold = () =>
  new THREE.MeshStandardMaterial({ color: 0xc9a23a, metalness: 0.7, roughness: 0.35 });
const silver = () =>
  new THREE.MeshStandardMaterial({ color: 0xbfc4cc, metalness: 0.6, roughness: 0.4 });
const white = () => new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 });
const dark = () => new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.8 });

// ---------------------------------------------------------------------------------------------
// Apollo Lunar Module: gold-foil descent stage with four legs, grey angular ascent stage on top
// ---------------------------------------------------------------------------------------------

export function buildLunarModule() {
  const group = new THREE.Group();
  const descent = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.3, 8), gold());
  body.position.y = 1.65;
  descent.add(body);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4), silver());
    leg.position.set(Math.cos(a) * 1.9, 0.95, Math.sin(a) * 1.9);
    leg.lookAt(Math.cos(a) * 1.2, 2.2, Math.sin(a) * 1.2);
    leg.rotateX(Math.PI / 2);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.1, 16), silver());
    pad.position.set(Math.cos(a) * 2.4, 0.05, Math.sin(a) * 2.4);
    descent.add(leg, pad);
  }
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.05), silver());
  ladder.position.set(0, 1, 1.75);
  ladder.rotation.x = -0.35;
  descent.add(ladder);
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.22),
    new THREE.MeshStandardMaterial({
      color: 0xdfe3ea,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x333333,
    }),
  );
  plaque.position.set(0, 1.45, 1.78);
  plaque.rotation.x = -0.35;
  descent.add(plaque);
  const engineGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('#ffd27a'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  engineGlow.position.y = 0.7;
  engineGlow.scale.set(2.5, 2.5, 1);
  descent.add(engineGlow);
  group.add(descent);

  const ascent = new THREE.Group();
  const cabin = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), silver());
  cabin.scale.set(1.2, 0.9, 1);
  cabin.position.y = 3.1;
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), dark());
  hatch.position.set(0, 2.8, 1.05);
  const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.2, 16, 1, true), white());
  antenna.position.set(0.9, 4.1, -0.3);
  antenna.rotation.z = 0.6;
  const ascentGlow = engineGlow.clone();
  ascentGlow.position.y = 2.3;
  ascentGlow.scale.set(1.8, 1.8, 1);
  ascent.add(cabin, hatch, antenna, ascentGlow);
  group.add(ascent);

  return { group, descent, ascent, engineGlow, ascentGlow };
}

export function buildAstronaut() {
  const g = new THREE.Group();
  const suit = white();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 12), suit);
  body.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), suit);
  head.position.y = 1.55;
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 1, roughness: 0.1 }),
  );
  visor.position.set(0, 1.56, 0.06);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.25), suit);
  pack.position.set(0, 1.0, -0.3);
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.4, 4, 8), suit);
  legL.position.set(-0.13, 0.32, 0);
  const legR = legL.clone();
  legR.position.x = 0.13;
  g.add(body, head, visor, pack, legL, legR);
  return { group: g, legL, legR };
}

export function buildFlag() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2), silver());
  pole.position.y = 1.1;
  const canvas = document.createElement('canvas');
  canvas.width = 76;
  canvas.height = 40;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 13; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#b22234';
    ctx.fillRect(0, (i * 40) / 13, 76, 40 / 13 + 0.5);
  }
  ctx.fillStyle = '#3c3b6e';
  ctx.fillRect(0, 0, 30, 21.5);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.6),
    new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }),
  );
  cloth.position.set(0.58, 1.85, 0);
  g.add(pole, cloth);
  return g;
}

/** Laser ranging retroreflector: a small panel of mirror cells on the ground. */
export function buildRetroreflector() {
  const g = new THREE.Group();
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.05, 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x9fb4d8,
      metalness: 1,
      roughness: 0.05,
      emissive: 0x112244,
    }),
  );
  panel.position.y = 0.35;
  panel.rotation.x = -0.4;
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.06), silver());
  stand.position.y = 0.17;
  g.add(panel, stand);
  return g;
}

// ---------------------------------------------------------------------------------------------
// Phoenix lander: deck on three legs, two round (fan-like) solar arrays, a robotic arm + scoop
// ---------------------------------------------------------------------------------------------

export function buildPhoenix() {
  const group = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 6), white());
  deck.position.y = 1.0;
  group.add(deck);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1), silver());
    leg.position.set(Math.cos(a) * 0.9, 0.5, Math.sin(a) * 0.9);
    leg.rotation.z = Math.cos(a) * 0.3;
    leg.rotation.x = -Math.sin(a) * 0.3;
    group.add(leg);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), white());
  mast.position.set(0.2, 1.7, 0.3);
  const camera = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), white());
  camera.position.set(0.2, 2.2, 0.3);
  const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25), dark());
  lidar.position.set(-0.4, 1.35, 0.2);
  group.add(mast, camera, lidar);

  // Two round solar arrays: decagon "fans" that unfold after landing.
  const arrays: THREE.Mesh[] = [];
  const arrayMat = new THREE.MeshStandardMaterial({
    color: 0x2a3f8f,
    metalness: 0.5,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  for (const side of [-1, 1]) {
    const fan = new THREE.Mesh(new THREE.CircleGeometry(1.05, 10), arrayMat);
    fan.rotation.x = -Math.PI / 2;
    fan.position.set(side * 1.95, 1.15, 0);
    group.add(fan);
    arrays.push(fan);
  }

  // Robotic arm with a scoop at the end.
  const arm = new THREE.Group();
  arm.position.set(0, 1.0, 0.85);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), white());
  upper.position.z = 0.6;
  const elbow = new THREE.Group();
  elbow.position.z = 1.2;
  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.0), white());
  lower.position.z = 0.5;
  const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.2), silver());
  scoop.position.z = 1.05;
  elbow.add(lower, scoop);
  arm.add(upper, elbow);
  group.add(arm);

  return { group, arrays, arm, elbow, scoop, lidar };
}

// ---------------------------------------------------------------------------------------------
// Mars Pathfinder lander: a tetrahedron whose three side "petals" open flat, with a ramp
// ---------------------------------------------------------------------------------------------

export function buildPathfinder() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 3), white());
  base.position.y = 0.06;
  group.add(base);
  const petals: THREE.Object3D[] = [];
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0x3a4f9a,
    metalness: 0.4,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 3; i++) {
    const hinge = new THREE.Group();
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    hinge.position.set(Math.cos(a) * 0.45, 0.12, Math.sin(a) * 0.45);
    hinge.rotation.y = -a + Math.PI / 2;
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.9, 3), petalMat);
    petal.rotation.x = -Math.PI / 2;
    petal.position.z = 0.55;
    hinge.add(petal);
    group.add(hinge);
    petals.push(hinge);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9), white());
  mast.position.y = 0.55;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.14), white());
  head.position.y = 1.05;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.05, 0.08, 16), white());
  dish.position.set(0.35, 0.45, 0);
  dish.rotation.z = 0.8;
  group.add(mast, head, dish);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 1.1), silver());
  ramp.position.set(0, 0.12, 1.45);
  ramp.rotation.x = 0.18;
  group.add(ramp);
  return { group, petals, ramp };
}

// ---------------------------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------------------------

/** Expanding rings that show a radio signal; strength 0..1 fades them out. */
export function signalRings(scene: THREE.Object3D, color = 0x9db4ff, size = 1.5) {
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.04, 8, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }),
    );
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    rings.push(ring);
  }
  return (origin: THREE.Vector3, strength: number, time: number, rise = 1.4) => {
    rings.forEach((ring, i) => {
      const phase = (time * 0.6 + i / rings.length) % 1;
      ring.position.copy(origin).add(new THREE.Vector3(0, phase * rise, 0));
      ring.scale.setScalar((0.3 + phase) * size);
      (ring.material as THREE.MeshBasicMaterial).opacity = strength * (1 - phase) * 0.9;
    });
  };
}

/** A field of tumbling asteroids. They are drawn much closer together than in reality. */
export function buildAsteroidField(count: number, spread: number, depth: number) {
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7d7468, roughness: 1, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const r = (k: number) => {
      const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    dummy.position.set((r(1) - 0.5) * spread, (r(2) - 0.5) * spread * 0.5, -r(3) * depth);
    dummy.rotation.set(r(4) * 6, r(5) * 6, 0);
    dummy.scale.setScalar(0.2 + r(6) * 1.4);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  return mesh;
}

/** Footprints: small dark ovals pressed into the ground. */
export function footprint() {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 1 }),
  );
  m.scale.set(1, 1.8, 1);
  m.rotation.x = -Math.PI / 2;
  return m;
}
