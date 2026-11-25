// Quick checks for the live-navigation fixes: run with `npx tsx scripts/check-heading-reroute.ts`.
import { bearingDeg, haversineMeters, type LatLng } from '../src/lib/geo';
import { angleDelta, createHeadingFilter } from '../src/lib/heading';
import { findRoute } from '../src/lib/routing/router';

const M_LAT = 110540;
const mLng = (lat: number) => 111320 * Math.cos((lat * Math.PI) / 180);
const move = (p: LatLng, deg: number, m: number): LatLng => ({
  lat: p.lat + (m * Math.cos((deg * Math.PI) / 180)) / M_LAT,
  lng: p.lng + (m * Math.sin((deg * Math.PI) / 180)) / mLng(p.lat),
});

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures++;
};

// 1. Diagonal walking: the fitted heading comes out diagonal, not snapped to an axis.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
for (const deg of [45, 135, 225, 315, 30, 300]) {
  const f = createHeadingFilter();
  let p: LatLng = { lat: 41.4865, lng: -71.5295 };
  let h: number | undefined;
  for (let t = 0; t < 15; t++) {
    p = move(p, deg, 1.4);
    const noisy = move(move(p, 0, rand() * 3), 90, rand() * 3); // +/-3 m GPS wobble
    h = f.update(noisy, t * 1000, null, null);
  }
  check(h !== undefined && Math.abs(angleDelta(h, deg)) < 20, `walking at ${deg}°: arrow ${h?.toFixed(0)}°`);
}

// 2. Rerouting a moving walker: the new route heads off the way they're walking.
const DEST: LatLng = { lat: 41.48506, lng: -71.5299 }; // Memorial Union
const spots: LatLng[] = [
  { lat: 41.4872, lng: -71.5262 },
  { lat: 41.4858, lng: -71.5275 },
  { lat: 41.4845, lng: -71.5262 },
  { lat: 41.4880, lng: -71.5300 },
  { lat: 41.4866, lng: -71.5315 },
];
let forward = 0;
let total = 0;
for (const at of spots) {
  for (const heading of [0, 45, 90, 135, 180, 225, 270, 315]) {
    const r = findRoute(at, DEST, 'walk', { heading });
    if (!r) continue;
    total++;
    // The route's first move: to the first point more than 5 m away (a node
    // underfoot doesn't count). It may turn around later, if the destination is behind.
    let i = 1;
    while (i < r.coords.length - 1 && haversineMeters(at, r.coords[i]) < 5) i++;
    const startDir = bearingDeg(at, r.coords[i]);
    const off = Math.abs(angleDelta(heading, startDir));
    const plain = findRoute(at, DEST, 'walk')!;
    if (off <= 90) forward++;
    else console.log(`      backwards at ${at.lat},${at.lng} heading ${heading}: starts ${startDir.toFixed(0)}° (+${(r.meters - plain.meters).toFixed(0)} m vs. shortest)`);
  }
}
// A few may start behind: when the destination is straight back and no path leads ahead nearby, turning around is far quicker.
check(forward / total >= 0.9, `reroutes that start ahead of the walker: ${forward}/${total}`);

// 3. Without a heading (standing still), routing is unchanged: the shortest route.
const still = findRoute(spots[0], DEST, 'walk');
check(!!still && still.coords.length > 2, 'standing still: route found from the nearest node');

process.exit(failures ? 1 : 0);
