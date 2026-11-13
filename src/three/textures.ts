/**
 * Procedural planet textures drawn on a canvas, so the app needs no large image downloads.
 * These are artistic, not real maps; the UI says so.
 */
import * as THREE from 'three';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Look = 'moon' | 'mars' | 'earth' | 'gas' | 'rock' | 'ice';

interface Palette {
  base: string;
  spots: string[];
  bands?: string[];
}

const PALETTES: Record<Look, Palette> = {
  moon: { base: '#9a9ca3', spots: ['#7d8088', '#b6b8be', '#6a6d75', '#5b5e66'] },
  mars: { base: '#b9532c', spots: ['#8e3b1f', '#d06d3d', '#7a3320', '#e08a52'] },
  earth: { base: '#1f5fae', spots: ['#3c8d3f', '#5ea64a', '#c9b37a', '#2f7a3a'] },
  gas: { base: '#c99a6b', spots: [], bands: ['#e3c29b', '#a8754b', '#f0dcc0', '#b9895c'] },
  rock: { base: '#8f8478', spots: ['#6f665d', '#a89c8e'] },
  ice: { base: '#7fb8d8', spots: [], bands: ['#9cd0ea', '#6aa6c9', '#b4e0f2'] },
};

export function makePlanetTexture(look: Look, seed = 1, tint?: string): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = rng(seed);
  const p = PALETTES[look];

  ctx.fillStyle = tint ?? p.base;
  ctx.fillRect(0, 0, w, h);

  if (p.bands) {
    let y = 0;
    while (y < h) {
      const bh = 6 + rand() * 22;
      ctx.fillStyle = p.bands[Math.floor(rand() * p.bands.length)];
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, y, w, bh);
      y += bh;
    }
    ctx.globalAlpha = 1;
  }

  const blobs = look === 'earth' ? 70 : look === 'moon' ? 260 : 180;
  for (let i = 0; i < blobs; i++) {
    if (p.spots.length === 0) break;
    const x = rand() * w;
    const y = rand() * h;
    const r = look === 'earth' ? 8 + rand() * 30 : 2 + rand() * (look === 'moon' ? 14 : 20);
    ctx.globalAlpha = look === 'earth' ? 0.9 : 0.35 + rand() * 0.4;
    ctx.fillStyle = p.spots[Math.floor(rand() * p.spots.length)];
    ctx.beginPath();
    ctx.ellipse(x, y, r * (1 + rand()), r, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    if (look === 'moon' && r > 6) {
      // crater rim highlight
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#c8cad0';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  if (look === 'mars' || look === 'earth') {
    // polar caps
    ctx.fillStyle = '#f4f1ea';
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 8, w, 8);
    ctx.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Soft round glow used for the Sun and for highlighted markers. */
export function makeGlowTexture(color = '#ffd27a'): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.35, `${color}aa`);
  g.addColorStop(1, `${color}00`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeStarfield(count = 1500, radius = 400): THREE.Points {
  const rand = rng(42);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const t = rand() * Math.PI * 2;
    const r = radius * (0.7 + rand() * 0.3);
    const s = Math.sqrt(1 - u * u);
    positions.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false }),
  );
}

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Frees every geometry, material and texture under an object. */
export function disposeTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    for (const m of materials) {
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose();
      m.dispose();
    }
  });
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lat/lon (degrees) to a point on a sphere, matching three's SphereGeometry UV layout. */
export function latLonToVector(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}
