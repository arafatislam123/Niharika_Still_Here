/**
 * The only longitude conversion in the codebase (§5.2). Sites store planetocentric latitude and
 * east-positive longitude in -180..180. Use this when copying a value from a source that uses
 * another convention, and record the original in the site's `sourceCoords`.
 */
export type LonSystem = 'east-pm180' | 'east-0-360' | 'west-pm180' | 'west-0-360';

export function toEastPm180(value: number, system: LonSystem): number {
  const east = system.startsWith('west') ? -value : value;
  const wrapped = ((((east + 180) % 360) + 360) % 360) - 180;
  return wrapped + 0; // turn -0 into 0
}
