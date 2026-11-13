/** Small, fast 2D gradient noise + fractal (fBm) helpers for natural-looking terrain and textures. */

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function grad(ix: number, iy: number, x: number, y: number, seed: number, period: number) {
  // With a period, the lattice wraps around so textures tile without seams.
  const hx = period ? ((ix % period) + period) % period : ix;
  const hy = period ? ((iy % period) + period) % period : iy;
  const a = hash(hx, hy, seed) * Math.PI * 2;
  return Math.cos(a) * (x - ix) + Math.sin(a) * (y - iy);
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Perlin-style gradient noise, roughly in [-0.7, 0.7]. `period` > 0 makes it tile. */
export function noise2(x: number, y: number, seed = 0, period = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const sx = fade(x - x0);
  const sy = fade(y - y0);
  const n00 = grad(x0, y0, x, y, seed, period);
  const n10 = grad(x0 + 1, y0, x, y, seed, period);
  const n01 = grad(x0, y0 + 1, x, y, seed, period);
  const n11 = grad(x0 + 1, y0 + 1, x, y, seed, period);
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

/** Fractal Brownian motion: several octaves of noise added together. */
export function fbm(x: number, y: number, octaves = 5, seed = 0, period = 0): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * freq, y * freq, seed + i * 17, period * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

/** Ridged noise: sharp crests, good for wind-sculpted dunes and rocky ridges. */
export function ridged(x: number, y: number, octaves = 4, seed = 0): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2(x * freq, y * freq, seed + i * 31, 0) * 1.4);
    sum += amp * n * n;
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

/** Deterministic random in [0, 1) for a given index (stable placement of rocks, etc.). */
export const rand = (i: number, k = 0) => hash(i, k, 99);
