import { describe, expect, it } from 'vitest';
import { toEastPm180 } from './coords';

describe('toEastPm180', () => {
  it('keeps east -180..180 values', () => {
    expect(toEastPm180(23.47, 'east-pm180')).toBeCloseTo(23.47);
    expect(toEastPm180(-10, 'east-pm180')).toBe(-10);
    expect(toEastPm180(0, 'west-pm180')).toBe(0);
  });

  it('wraps east 0..360 values', () => {
    expect(toEastPm180(350, 'east-0-360')).toBe(-10);
    expect(toEastPm180(77.5, 'east-0-360')).toBeCloseTo(77.5);
  });

  it('flips west longitudes', () => {
    expect(toEastPm180(10, 'west-pm180')).toBe(-10);
    expect(toEastPm180(190, 'west-0-360')).toBe(170);
    expect(toEastPm180(354.5, 'west-0-360')).toBeCloseTo(5.5);
  });
});
