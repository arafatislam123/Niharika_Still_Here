/**
 * The realistic Mars world for the rover game: noise-sculpted terrain with craters and dunes,
 * a detailed tiling ground texture with normal map, thousands of instanced rocks, NASA's real
 * rover model, a physically-inspired Mars sky (butterscotch by day, bluish around a low Sun),
 * soft shadows, exponential haze, bloom + filmic tone mapping, wheel tracks and dust.
 *
 * Two quality levels: "high" (shadows, post-processing, dense detail) for laptops/desktops and
 * "low" for phones and older computers.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { fbm, rand, ridged } from '../three/noise';
import { buildSimpleRover, faceRoverForward, loadNasaModel } from '../three/marsScene';
import { disposeTree, makeGlowTexture } from '../three/textures';

import type { Quality } from './quality';

export type { Quality };

export interface WorldSite {
  id: string;
  x: number;
  z: number;
  color: string;
}

export interface RoverState {
  x: number;
  z: number;
  heading: number;
  speed: number;
}

// ---------------------------------------------------------------------------------------------
// terrain shape
// ---------------------------------------------------------------------------------------------

/** Craters: [x, z, radius, depth]. The Mission 3 "crater rim" site sits on the first one's rim. */
const CRATERS: [number, number, number, number][] = [
  [26, -26, 10, 2.4],
  [-32, -4, 6, 1.4],
  [-28, 22, 5, 1.1],
  [20, 24, 4, 0.9],
  [38, 8, 6, 1.3],
  [-2, 22, 3, 0.6],
];

export function marsGroundHeight(x: number, z: number): number {
  const hills = fbm(x * 0.018, z * 0.018, 4, 1) * 7;
  // Elongated, wind-sculpted dune ridges.
  const warp = fbm(x * 0.03, z * 0.03, 2, 5) * 3;
  const dunes = ridged(x * 0.045 + warp, z * 0.018, 3, 2) * 1.4;
  const bumps = fbm(x * 0.28, z * 0.28, 3, 3) * 0.35;
  let h = hills + dunes + bumps;
  for (const [cx, cz, r, depth] of CRATERS) {
    const d = Math.hypot(x - cx, z - cz) / r;
    if (d < 1) h -= depth * (1 - d * d);
    h += depth * 0.45 * Math.exp(-(((d - 1) / 0.18) ** 2));
  }
  return h;
}

// ---------------------------------------------------------------------------------------------
// detail textures (generated once, seamless)
// ---------------------------------------------------------------------------------------------

function makeGroundTextures(size: number) {
  const period = 8; // lattice cells across the tile; noise wraps at this period
  const heights = new Float32Array(size * size);
  const albedo = document.createElement('canvas');
  albedo.width = albedo.height = size;
  const actx = albedo.getContext('2d')!;
  const aimg = actx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * period;
      const v = (y / size) * period;
      const large = fbm(u, v, 3, 11, period);
      const fine = fbm(u * 4, v * 4, 3, 12, period * 4);
      // Pebbles: sharp bright/dark specks.
      const peb = fbm(u * 16, v * 16, 2, 13, period * 16);
      const pebble = peb > 0.18 ? (peb - 0.18) * 4 : 0;
      const h = large * 0.6 + fine * 0.3 + pebble * 0.5;
      heights[y * size + x] = h;
      const i = (y * size + x) * 4;
      const shade = 0.82 + large * 0.35 + fine * 0.25 - pebble * 0.35;
      aimg.data[i] = Math.min(255, 186 * shade);
      aimg.data[i + 1] = Math.min(255, 104 * shade);
      aimg.data[i + 2] = Math.min(255, 66 * shade);
      aimg.data[i + 3] = 255;
    }
  }
  actx.putImageData(aimg, 0, 0);

  const normal = document.createElement('canvas');
  normal.width = normal.height = size;
  const nctx = normal.getContext('2d')!;
  const nimg = nctx.createImageData(size, size);
  const at = (x: number, y: number) => heights[((y + size) % size) * size + ((x + size) % size)];
  const strength = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      nimg.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      nimg.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      nimg.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      nimg.data[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(normal);
  for (const t of [map, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  return { map, normalMap };
}

// ---------------------------------------------------------------------------------------------
// sky
// ---------------------------------------------------------------------------------------------

function makeSky(sunDir: THREE.Vector3) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { sunDir: { value: sunDir.clone() }, storm: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 sunDir;
      uniform float storm;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0.0, 1.0);
        // Mars daytime sky: butterscotch near the horizon, darker brownish overhead.
        vec3 horizon = vec3(0.87, 0.64, 0.44);
        vec3 zenith = vec3(0.56, 0.37, 0.26);
        vec3 col = mix(horizon, zenith, pow(h, 0.55));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        // Fine dust scatters blue light forward, so the sky around the Sun looks bluish.
        col = mix(col, vec3(0.62, 0.72, 0.86), pow(s, 10.0) * 0.55);
        col += vec3(1.0, 0.96, 0.9) * smoothstep(0.9992, 0.9997, s) * 4.0;
        col = mix(col, vec3(0.34, 0.2, 0.13), storm);
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), material);
  return { sky, material };
}

// ---------------------------------------------------------------------------------------------
// rocks
// ---------------------------------------------------------------------------------------------

function rockGeometry(seed: number, detail: number) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * 1.3 + seed, v.y * 1.3 + v.z * 0.7, 3, seed) * 0.55;
    v.multiplyScalar(1 + n);
    // Flat-ish bottoms so rocks sit in the soil.
    if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.25;
    v.y *= 0.72;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------------------------
// the world
// ---------------------------------------------------------------------------------------------

export interface MarsWorld {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rover: THREE.Group;
  beacons: Map<string, THREE.Group>;
  /** Big boulders the rover cannot drive through. */
  obstacles: { x: number; z: number; r: number }[];
  heightAt: (x: number, z: number) => number;
  update(dt: number, time: number, s: RoverState, stormMix: number, reduced: boolean): void;
  render(): void;
  setSize(w: number, h: number): void;
  dispose(): void;
}

export function createMarsWorld(
  renderer: THREE.WebGLRenderer,
  quality: Quality,
  bound: number,
  sites: WorldSite[],
): MarsWorld {
  const high = quality === 'high';
  const heightAt = marsGroundHeight;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);

  // --- light, sky, haze ---
  const sunDir = new THREE.Vector3(0.55, 0.42, 0.35).normalize();
  const { sky, material: skyMat } = makeSky(sunDir);
  scene.add(sky);
  const hazeColor = new THREE.Color(0xc9936a);
  const fog = new THREE.FogExp2(hazeColor.clone(), 0.0105);
  scene.fog = fog;

  const sun = new THREE.DirectionalLight(0xfff0dc, 2.7);
  sun.castShadow = high;
  if (high) {
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = sc.bottom = -26;
    sc.right = sc.top = 26;
    sc.near = 1;
    sc.far = 160;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 3;
  }
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xeab58c, 0x5c2e1a, 0.95);
  scene.add(hemi);

  // --- terrain ---
  const size = bound * 2 * 1.45;
  const segs = high ? 280 : 150;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    // Macro colour: darker basaltic sand in hollows, lighter dust on crests.
    const tone =
      0.82 + THREE.MathUtils.clamp(y * 0.05, -0.18, 0.2) + fbm(x * 0.06, z * 0.06, 2, 7) * 0.25;
    colors.set([tone, tone * 0.97, tone * 0.95], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const { map, normalMap } = makeGroundTextures(high ? 1024 : 512);
  const repeat = size / 6;
  map.repeat.set(repeat, repeat);
  normalMap.repeat.set(repeat, repeat);
  const ground = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      vertexColors: true,
      roughness: 0.96,
      metalness: 0,
    }),
  );
  ground.receiveShadow = high;
  scene.add(ground);

  // --- rocks (instanced) and boulders ---
  const avoid = [{ x: 0, z: 8 }, ...sites];
  const clear = (x: number, z: number, r: number) =>
    avoid.every((p) => Math.hypot(p.x - x, p.z - z) > r);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x7a4a33,
    roughness: 0.9,
    normalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
  });
  const variants = 4;
  const perVariant = Math.floor((high ? 900 : 320) / variants);
  const dummy = new THREE.Object3D();
  const rocks: THREE.InstancedMesh[] = [];
  let k = 0;
  for (let v = 0; v < variants; v++) {
    const mesh = new THREE.InstancedMesh(rockGeometry(v * 7.3, high ? 3 : 2), rockMat, perVariant);
    mesh.castShadow = high;
    mesh.receiveShadow = high;
    let placed = 0;
    while (placed < perVariant && k < perVariant * variants * 4) {
      k++;
      const x = (rand(k, 1) - 0.5) * size * 0.95;
      const z = (rand(k, 2) - 0.5) * size * 0.95;
      const s = 0.08 + Math.pow(rand(k, 3), 5) * 0.9;
      if (!clear(x, z, 3 + s * 2)) continue;
      dummy.position.set(x, heightAt(x, z) - s * 0.15, z);
      dummy.rotation.set(rand(k, 4) * 0.6, rand(k, 5) * Math.PI * 2, rand(k, 6) * 0.6);
      dummy.scale.set(s * (0.8 + rand(k, 7) * 0.5), s, s * (0.8 + rand(k, 8) * 0.5));
      dummy.updateMatrix();
      mesh.setMatrixAt(placed++, dummy.matrix);
    }
    mesh.count = placed;
    scene.add(mesh);
    rocks.push(mesh);
  }
  const obstacles: { x: number; z: number; r: number }[] = [];
  const boulderGeo = rockGeometry(42, high ? 4 : 3);
  for (let i = 0; obstacles.length < 16 && i < 400; i++) {
    const x = (rand(i, 21) - 0.5) * bound * 1.9;
    const z = (rand(i, 22) - 0.5) * bound * 1.9;
    const s = 1.2 + rand(i, 23) * 1.3;
    if (!clear(x, z, 7) || obstacles.some((o) => Math.hypot(o.x - x, o.z - z) < 6)) continue;
    const b = new THREE.Mesh(boulderGeo, rockMat);
    b.position.set(x, heightAt(x, z) - s * 0.2, z);
    b.rotation.set(0, rand(i, 24) * 6, 0);
    b.scale.set(s * 1.2, s, s);
    b.castShadow = high;
    b.receiveShadow = high;
    scene.add(b);
    obstacles.push({ x, z, r: s * 1.15 });
  }

  // --- glowing mission sites ---
  const glowMap = makeGlowTexture('#ffffff');
  const beacons = new Map<string, THREE.Group>();
  for (const site of sites) {
    const group = new THREE.Group();
    group.position.set(site.x, heightAt(site.x, site.z), site.z);
    const color = new THREE.Color(site.color);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 16, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    pillar.position.y = 8;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.7, 2.1, 48),
      new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        toneMapped: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        color,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.position.y = 1.2;
    glow.scale.set(3.2, 3.2, 1);
    group.add(pillar, ring, glow);
    scene.add(group);
    beacons.set(site.id, group);
  }

  // --- rover: simple stand-in until NASA's model arrives ---
  const rover = new THREE.Group();
  const placeholder = buildSimpleRover();
  rover.add(placeholder);
  scene.add(rover);
  const castAll = (o: THREE.Object3D) =>
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = m.receiveShadow = high;
    });
  castAll(placeholder);
  let disposed = false;
  loadNasaModel('models/mars-exploration-rover.glb', 2.7)
    .then((m) => {
      if (disposed) return;
      const model = faceRoverForward(m.clone());
      castAll(model);
      rover.remove(placeholder);
      rover.add(model);
    })
    .catch(() => {
      /* keep the stand-in */
    });

  // --- wheel tracks: small dark imprints left in the soil ---
  const trackCount = high ? 2400 : 900;
  const tracks = new THREE.InstancedMesh(
    // Slightly longer than the 0.3 m spacing so imprints join into continuous tracks.
    new THREE.PlaneGeometry(0.28, 0.42).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0xc0866a,
      map,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
    trackCount,
  );
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  for (let i = 0; i < trackCount; i++) tracks.setMatrixAt(i, dummy.matrix);
  tracks.frustumCulled = false;
  scene.add(tracks);
  let trackIndex = 0;
  const lastTrack = new THREE.Vector2(Infinity, Infinity);
  const here = new THREE.Vector2();

  // --- dust: kicked up by wheels, and drifting in the air (thicker in storms) ---
  const puffTex = makeGlowTexture('#d9a07a');
  const kickCount = 260;
  const kickPos = new Float32Array(kickCount * 3).fill(-999);
  const kickVel = new Float32Array(kickCount * 3);
  const kickLife = new Float32Array(kickCount);
  const kickGeo = new THREE.BufferGeometry();
  kickGeo.setAttribute('position', new THREE.BufferAttribute(kickPos, 3));
  const kick = new THREE.Points(
    kickGeo,
    new THREE.PointsMaterial({
      map: puffTex,
      size: 0.55,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      color: 0xd8a07a,
    }),
  );
  kick.frustumCulled = false;
  scene.add(kick);
  let kickNext = 0;

  const airCount = high ? 2200 : 900;
  const airPos = new Float32Array(airCount * 3);
  for (let i = 0; i < airCount; i++)
    airPos.set([(rand(i, 31) - 0.5) * 70, rand(i, 32) * 16, (rand(i, 33) - 0.5) * 70], i * 3);
  const airGeo = new THREE.BufferGeometry();
  airGeo.setAttribute('position', new THREE.BufferAttribute(airPos, 3));
  const airMat = new THREE.PointsMaterial({
    map: puffTex,
    size: 0.18,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    color: 0xe0b08a,
  });
  const air = new THREE.Points(airGeo, airMat);
  air.frustumCulled = false;
  scene.add(air);

  // --- post-processing (high quality) ---
  let composer: EffectComposer | null = null;
  if (high) {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.55, 0.9));
    composer.addPass(new OutputPass());
  }

  // --- per-frame update ---
  const camTarget = new THREE.Vector3();
  const look = new THREE.Vector3();
  const halfLen = 1.1;
  const halfWid = 0.95;

  return {
    scene,
    camera,
    rover,
    beacons,
    obstacles,
    heightAt,
    update(dt, time, s, stormMix, reduced) {
      const sin = Math.sin(s.heading);
      const cos = Math.cos(s.heading);
      // Sample the ground under the four corners to tilt the rover like real suspension.
      const front = heightAt(s.x + sin * halfLen, s.z + cos * halfLen);
      const back = heightAt(s.x - sin * halfLen, s.z - cos * halfLen);
      const left = heightAt(s.x + cos * halfWid, s.z - sin * halfWid);
      const right = heightAt(s.x - cos * halfWid, s.z + sin * halfWid);
      const y = (front + back + left + right) / 4;
      rover.position.set(s.x, y, s.z);
      rover.rotation.set(
        -Math.atan2(front - back, halfLen * 2),
        s.heading,
        Math.atan2(left - right, halfWid * 2),
        'YXZ',
      );
      // Tiny judder when driving over rough ground.
      if (!reduced && Math.abs(s.speed) > 0.1) rover.position.y += Math.sin(time * 37) * 0.012;

      // Wheel tracks every 0.3 m of travel.
      here.set(s.x, s.z);
      if (Math.abs(s.speed) > 0.1 && lastTrack.distanceTo(here) > 0.3) {
        lastTrack.copy(here);
        for (const side of [-1, 1]) {
          const tx = s.x + cos * halfWid * side - sin * 0.9;
          const tz = s.z - sin * halfWid * side - cos * 0.9;
          dummy.position.set(tx, heightAt(tx, tz) + 0.03, tz);
          dummy.rotation.set(0, s.heading, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          tracks.setMatrixAt(trackIndex, dummy.matrix);
          trackIndex = (trackIndex + 1) % trackCount;
        }
        tracks.instanceMatrix.needsUpdate = true;
      }

      // Dust kicked up by the wheels.
      const kp = kickGeo.attributes.position as THREE.BufferAttribute;
      if (Math.abs(s.speed) > 0.5 && !reduced) {
        for (let n = 0; n < 3; n++) {
          const side = n % 2 ? 1 : -1;
          const i = kickNext;
          kickNext = (kickNext + 1) % kickCount;
          const bx = s.x + cos * halfWid * side - sin * 1.1;
          const bz = s.z - sin * halfWid * side - cos * 1.1;
          kp.setXYZ(i, bx, heightAt(bx, bz) + 0.15, bz);
          kickVel.set(
            [
              (Math.random() - 0.5) * 0.6 - sin * 0.4,
              0.5 + Math.random() * 0.5,
              (Math.random() - 0.5) * 0.6 - cos * 0.4,
            ],
            i * 3,
          );
          kickLife[i] = 1.2;
        }
      }
      for (let i = 0; i < kickCount; i++) {
        if (kickLife[i] <= 0) continue;
        kickLife[i] -= dt;
        kp.setXYZ(
          i,
          kp.getX(i) + kickVel[i * 3] * dt,
          kp.getY(i) + kickVel[i * 3 + 1] * dt,
          kp.getZ(i) + kickVel[i * 3 + 2] * dt,
        );
        kickVel[i * 3 + 1] -= 0.4 * dt;
        if (kickLife[i] <= 0) kp.setY(i, -999);
      }
      kp.needsUpdate = true;

      // Drifting air dust follows the rover and blows with the wind.
      air.position.set(s.x, 0, s.z);
      const ap = airGeo.attributes.position as THREE.BufferAttribute;
      const wind = (reduced ? 0 : 1.2 + stormMix * 7) * dt;
      for (let i = 0; i < airCount; i++) {
        let x = ap.getX(i) + wind;
        if (x > 35) x -= 70;
        ap.setX(i, x);
      }
      ap.needsUpdate = true;
      airMat.opacity = 0.1 + stormMix * 0.7;
      airMat.size = 0.18 + stormMix * 0.35;

      // Weather.
      skyMat.uniforms.storm.value = stormMix * 0.85;
      fog.density = 0.0105 + stormMix * 0.05;
      fog.color.copy(hazeColor).lerp(new THREE.Color(0x5a3422), stormMix);
      sun.intensity = 2.7 * (1 - stormMix * 0.85);
      hemi.intensity = 0.95 * (1 - stormMix * 0.45);

      // Keep the shadow area centred on the rover.
      sun.target.position.set(s.x, y, s.z);
      sun.position.copy(sun.target.position).addScaledVector(sunDir, 80);
      sky.position.set(s.x, 0, s.z);

      for (const b of beacons.values()) b.rotation.y = reduced ? 0 : time;

      // Chase camera, never below the ground.
      camTarget.set(s.x - sin * 8.5, 0, s.z - cos * 8.5);
      camTarget.y = Math.max(heightAt(camTarget.x, camTarget.z) + 2.2, y + 4.2);
      camera.position.lerp(camTarget, Math.min(1, dt * 3));
      look.set(s.x + sin * 2, y + 1.3, s.z + cos * 2);
      camera.lookAt(look);
    },
    render() {
      if (composer) composer.render();
      else renderer.render(scene, camera);
    },
    setSize(w, h) {
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w < h ? 70 : 58;
      camera.updateProjectionMatrix();
    },
    dispose() {
      disposed = true;
      composer?.dispose();
      disposeTree(scene);
      for (const r of rocks) r.dispose();
      tracks.dispose();
    },
  };
}
