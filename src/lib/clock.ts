/** Mission Clock math (§5.3). Components never do this arithmetic themselves. */
import type { LifetimeClock, LiveClock } from './schema';

const DAY_MS = 86_400_000;
/** One Mars solar day in Earth days (88,775.244 s). */
export const SOL_IN_DAYS = 88_775.244 / 86_400;
export const SPEED_OF_LIGHT_KM_S = 299_792.458;

export function lifetimeActual(clock: LifetimeClock, now = Date.now()): number {
  if (clock.actual.type === 'fixed') return clock.actual.value;
  const days = (now - Date.parse(`${clock.actual.start}T00:00:00Z`)) / DAY_MS;
  switch (clock.unit) {
    case 'days':
      return days;
    case 'years':
      return days / 365.25;
    case 'sols':
      return days / SOL_IN_DAYS;
    case 'flights':
      throw new Error('A flight count cannot be ongoing');
  }
}

/** Linear extrapolation from the sourced value at `asOf`. Always shown as "about". */
export function liveValue(clock: LiveClock, now = Date.now()): number {
  const seconds = (now - Date.parse(clock.asOf)) / 1000;
  return clock.valueAtEpoch + clock.ratePerSecond * seconds;
}

export const lightTimeSeconds = (km: number) => km / SPEED_OF_LIGHT_KM_S;

export function splitDuration(totalSeconds: number) {
  const minutesTotal = Math.floor(totalSeconds / 60);
  return { hours: Math.floor(minutesTotal / 60), minutes: minutesTotal % 60 };
}

/** "About N times": whole numbers from 2x up, one decimal below that. */
export function roundMultiplier(actual: number, expected: number): number {
  const ratio = actual / expected;
  return ratio >= 2 ? Math.round(ratio) : Math.round(ratio * 10) / 10;
}

/** Shared scale for the bars, with headroom so the longest bar never touches the edge. */
export const sharedScale = (...values: number[]) => Math.max(...values) * 1.1;
