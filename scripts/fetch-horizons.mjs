// Fetches Pioneer 10's position from NASA JPL Horizons (https://ssd.jpl.nasa.gov/horizons/) and
// saves it to src/data/pioneerPosition.json. Horizons does not allow browser (CORS) requests, so
// we fetch at build time; the site then extrapolates the distance to "now" in the browser.
// If the request fails, the committed snapshot is kept, so builds never break.
import fs from 'node:fs';

const OUT = 'src/data/pioneerPosition.json';
const today = new Date();
const day = (d) => d.toISOString().slice(0, 10);
const tomorrow = new Date(today.getTime() + 86_400_000);

const params = new URLSearchParams({
  format: 'json',
  COMMAND: "'-23'", // Pioneer 10
  OBJ_DATA: "'NO'",
  MAKE_EPHEM: "'YES'",
  EPHEM_TYPE: "'VECTORS'",
  CENTER: "'500@10'", // Sun's centre
  START_TIME: `'${day(today)}'`,
  STOP_TIME: `'${day(tomorrow)}'`,
  STEP_SIZE: "'1d'",
  VEC_TABLE: "'3'",
  OUT_UNITS: "'AU-D'",
});

try {
  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { result } = await res.json();
  const block = result.slice(result.indexOf('$$SOE'), result.indexOf('$$EOE'));
  const num = (key) => {
    const m = block.match(new RegExp(`${key}\\s*=\\s*([-+0-9.E]+)`));
    if (!m) throw new Error(`Horizons output has no ${key}`);
    return Number(m[1]);
  };
  const date = block.match(/A\.D\. (\d{4}-[A-Za-z]{3}-\d{2})/)?.[1];
  const snapshot = {
    source: 'NASA JPL Horizons, target -23 (Pioneer 10), Sun-centred vectors',
    epoch: `${day(today)}T00:00:00Z`,
    epochLabel: date,
    distanceAu: num('RG'),
    rangeRateAuPerDay: num('RR'),
    lightTimeDays: num('LT'),
    fetchedAt: new Date().toISOString(),
  };
  fs.writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `Pioneer 10: ${snapshot.distanceAu.toFixed(2)} AU from the Sun (${snapshot.epochLabel})`,
  );
} catch (error) {
  if (!fs.existsSync(OUT)) throw error;
  console.warn(`Horizons fetch failed (${error.message}); keeping the saved snapshot.`);
}
