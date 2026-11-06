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

// Random points over an area about the size of the Kingston campus (meters).
const WIDTH_M = 2500;
const HEIGHT_M = 2000;
const QUERIES = 1000;
const RUNS = 3; // the median run is reported
const CHECKS = 100; // queries compared between the two methods

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

const median = (v: number[]) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];
const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Runs the C++ k-d tree and brute force (both in WebAssembly) at each size.
 * Calls onRow as each size finishes so the page can update. Returns null if
 * the WebAssembly engine isn't loaded.
 */
export async function runWasmBenchmark(k: number, onRow: (row: BenchRow) => void): Promise<BenchRow[] | null> {
  const rand = mulberry32(212);
  const queries = randomXY(QUERIES, rand);
  const rows: BenchRow[] = [];
  for (const n of BENCH_SIZES) {
    await nextFrame(); // let the page paint progress between sizes
    const index = SpatialIndex.fromXY(randomXY(n, rand));
    if (!index) return null;
    try {
      const kd: number[] = [];
      const bf: number[] = [];
      for (let r = 0; r < RUNS; r++) {
        kd.push((index.bench(queries, k, 'kdtree') * 1000) / QUERIES);
        bf.push((index.bench(queries, k, 'brute') * 1000) / QUERIES);
      }
      let matches = true;
      for (let i = 0; i < CHECKS && matches; i++) {
        const x = queries[2 * i];
        const y = queries[2 * i + 1];
        const a = index.kNearestXY(x, y, k, 'kdtree');
        const b = index.kNearestXY(x, y, k, 'brute');
        matches = a.length === b.length && a.every((nb, j) => Math.abs(nb.dist2 - b[j].dist2) < 1e-6);
      }
      const row = { n, k, buildMs: index.buildMs, kdQueryUs: median(kd), bfQueryUs: median(bf), matches };
      rows.push(row);
      onRow(row);
    } finally {
      index.free();
    }
  }
  return rows;
}
