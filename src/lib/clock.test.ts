import { describe, expect, it } from 'vitest';
import {
  SOL_IN_DAYS,
  lifetimeActual,
  lightTimeSeconds,
  liveValue,
  roundMultiplier,
  sharedScale,
  splitDuration,
} from './clock';
import type { LifetimeClock, LiveClock } from './schema';

const base = {
  kind: 'lifetime',
  expected: 90,
  rule: 'until-last-contact',
  sliderMax: 6000,
  why: 'x',
  sourceId: 'src-test',
} as const;

describe('lifetimeActual', () => {
  it('returns fixed values unchanged', () => {
    const clock: LifetimeClock = { ...base, unit: 'flights', actual: { type: 'fixed', value: 72 } };
    expect(lifetimeActual(clock)).toBe(72);
  });

  it('computes ongoing days, years and sols from the start date', () => {
    const now = Date.parse('2000-01-11T00:00:00Z');
    const start = { type: 'ongoing', start: '2000-01-01' } as const;
    expect(lifetimeActual({ ...base, unit: 'days', actual: start }, now)).toBe(10);
    expect(lifetimeActual({ ...base, unit: 'years', actual: start }, now)).toBeCloseTo(10 / 365.25);
    expect(lifetimeActual({ ...base, unit: 'sols', actual: start }, now)).toBeCloseTo(10 / SOL_IN_DAYS);
  });
});

describe('liveValue', () => {
  it('extrapolates linearly from asOf', () => {
    const clock: LiveClock = {
      kind: 'live',
      quantity: 'distance-from-earth',
      valueAtEpoch: 1000,
      unit: 'km',
      ratePerSecond: 2,
      asOf: '2026-01-01T00:00:00Z',
      why: 'x',
      sourceId: 'src-test',
    };
    expect(liveValue(clock, Date.parse('2026-01-01T00:00:10Z'))).toBe(1020);
  });
});

describe('helpers', () => {
  it('rounds multipliers for young readers', () => {
    expect(roundMultiplier(72, 5)).toBe(14);
    expect(roundMultiplier(15, 10)).toBe(1.5);
  });

  it('converts distance to light time', () => {
    expect(lightTimeSeconds(299_792.458)).toBe(1);
    expect(splitDuration(3 * 3600 + 25 * 60 + 59)).toEqual({ hours: 3, minutes: 25 });
  });

  it('adds headroom to the shared scale', () => {
    expect(sharedScale(5, 72, 40)).toBeCloseTo(79.2);
  });
});
