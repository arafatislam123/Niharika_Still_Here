/** Graphics quality for the rover game (kept separate so pages can use it without loading 3D code). */
export type Quality = 'high' | 'low';

const KEY = 'forgotten-explorers:graphics';

/** Pick a sensible default: phones, small screens and weak devices get the light version. */
export function detectQuality(): Quality {
  if (typeof navigator === 'undefined') return 'low';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const touchSmall = navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 900;
  const weak = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
  return touchSmall || weak ? 'low' : 'high';
}

/** The player's saved choice, or the detected default. */
export function initialQuality(): Quality {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'high' || saved === 'low') return saved;
  } catch {
    /* storage blocked */
  }
  return detectQuality();
}

export function saveQuality(q: Quality) {
  try {
    localStorage.setItem(KEY, q);
  } catch {
    /* keep for this visit only */
  }
}
