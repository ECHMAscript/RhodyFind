import { SpatialIndex } from './engine';

/** One measurement: average microseconds per query for each method at n points. */
export type BenchRow = {
  n: number;
  k: number;
  buildMs: number;
  kdQueryUs: number;
  bfQueryUs: number;
  /** k-d tree and brute force returned the same distances on every checked query. */
  matches?: boolean;
};

export const BENCH_SIZES = [100, 1_000, 10_000, 100_000];
/** Largest point count the in-browser benchmark accepts. */
export const MAX_BENCH_POINTS = 2_000_000;
export const MAX_BENCH_SIZES = 8;

// Random points over an area about the size of the Kingston campus (meters).
const WIDTH_M = 2500;
const HEIGHT_M = 2000;
// Distinct query points, cycled through. Enough that the searches don't all
// hit the same few cached tree nodes.
const QUERIES = 10_000;
// Each timing keeps running until this long has passed. Browsers round their
// clock to about 0.1 ms (plus jitter), so 60 ms keeps that error under 0.2%.
const MIN_SAMPLE_MS = 60;
// Samples per method; the fastest is reported. Other work on the computer
// (other tabs, a busy CPU, a background tab getting less CPU) can only make
// a sample slower, never faster, so the fastest is the cleanest measurement.
const SAMPLES = 7;
const BUILD_SAMPLES = 5;
const WARMUP_MS = 20;
const CHECKS = 100; // queries compared between the two methods

/** The settings used, for the page's note. */
export const BENCH_METHOD = { queries: QUERIES, minSampleMs: MIN_SAMPLE_MS, samples: SAMPLES };

// Small seeded PRNG so every run uses the same points.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomXY(count: number, rand: () => number): Float64Array {
  const xy = new Float64Array(count * 2);
  for (let i = 0; i < count; i++) {
    xy[2 * i] = rand() * WIDTH_M;
    xy[2 * i + 1] = rand() * HEIGHT_M;
  }
  return xy;
}

const fastest = (v: number[]) => Math.min(...v);
const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Parses a point count typed by the user: "5000", "5,000", "5k", "2.5k", "1m".
 * Returns undefined if it isn't a whole number from 1 to MAX_BENCH_POINTS.
 */
export function parsePointCount(text: string): number | undefined {
  const t = text.trim().toLowerCase().replace(/[,_\s]/g, '');
  const m = /^(\d+(?:\.\d+)?)([km]?)$/.exec(t);
  if (!m) return undefined;
  const n = Math.round(Number(m[1]) * (m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : 1));
  return Number.isFinite(n) && n >= 1 && n <= MAX_BENCH_POINTS ? n : undefined;
}

/**
 * Runs the C++ k-d tree and brute force (both in WebAssembly) at each size.
 * For accuracy, every timing repeats the work until at least 60 ms has
 * passed, the two methods take turns going first, and the fastest of 7
 * samples is kept. Calls onRow as each size finishes so the page can update.
 * Returns null if the WebAssembly engine isn't loaded.
 */
export async function runWasmBenchmark(
  k: number,
  onRow: (row: BenchRow) => void,
  sizes: number[] = BENCH_SIZES,
): Promise<BenchRow[] | null> {
  const queryRand = mulberry32(42);
  const queries = randomXY(QUERIES, queryRand);
  const rows: BenchRow[] = [];
  for (const n of [...sizes].sort((a, b) => a - b)) {
    await nextFrame(); // let the page paint progress between sizes
    const index = SpatialIndex.fromXY(randomXY(n, mulberry32(212 + n)));
    if (!index) return null;
    try {
      // Warm up: the first runs pay for WebAssembly compilation and cold caches.
      index.timeQuery(queries, k, 'kdtree', WARMUP_MS);
      index.timeQuery(queries, k, 'brute', WARMUP_MS);

      const kd: number[] = [];
      const bf: number[] = [];
      for (let s = 0; s < SAMPLES; s++) {
        // Alternate which goes first so neither always runs on a warmer CPU.
        const order: ('kdtree' | 'brute')[] = s % 2 ? ['brute', 'kdtree'] : ['kdtree', 'brute'];
        for (const method of order) {
          const msPerQuery = index.timeQuery(queries, k, method, MIN_SAMPLE_MS);
          (method === 'kdtree' ? kd : bf).push(msPerQuery * 1000);
        }
        await nextFrame();
      }

      const builds: number[] = [];
      for (let s = 0; s < BUILD_SAMPLES; s++) builds.push(index.timeBuild(MIN_SAMPLE_MS));

      let matches = true;
      for (let i = 0; i < CHECKS && matches; i++) {
        const x = queries[2 * i];
        const y = queries[2 * i + 1];
        const a = index.kNearestXY(x, y, k, 'kdtree');
        const b = index.kNearestXY(x, y, k, 'brute');
        matches = a.length === b.length && a.every((nb, j) => Math.abs(nb.dist2 - b[j].dist2) < 1e-6);
      }
      const row = { n, k, buildMs: fastest(builds), kdQueryUs: fastest(kd), bfQueryUs: fastest(bf), matches };
      rows.push(row);
      onRow(row);
    } finally {
      index.free();
    }
  }
  return rows;
}
