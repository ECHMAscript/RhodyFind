import createKDTreeModule, { type KDTreeModule } from '@/wasm/kdtree';
import { URI_CENTER } from '@/data/locations';
import type { LatLng } from '@/lib/geo';

/**
 * Bridge to the C++ k-d tree (cpp/kdtree.hpp) compiled to WebAssembly.
 *
 * The module loads asynchronously once at startup (loadSpatialEngine in the root
 * layout). Until it is ready, or where WebAssembly isn't available (the native
 * app's JS engine), callers fall back to brute force in JS; both give the same
 * answers, so nothing on screen changes, only how fast it was found.
 */

let mod: KDTreeModule | null = null;
let loading: Promise<KDTreeModule | null> | null = null;
const readyListeners = new Set<() => void>();

export function loadSpatialEngine(): Promise<KDTreeModule | null> {
  if (!loading) {
    loading = (async () => {
      if (typeof createKDTreeModule !== 'function' || typeof WebAssembly === 'undefined') return null;
      try {
        mod = await createKDTreeModule();
        readyListeners.forEach((fn) => fn());
        return mod;
      } catch (e) {
        console.warn('k-d tree WebAssembly module failed to load; using brute force', e);
        return null;
      }
    })();
  }
  return loading;
}

/** True once the C++ k-d tree can be used. */
export function spatialEngineReady(): boolean {
  return mod !== null;
}

/** Calls fn once the engine is ready (immediately if it already is). */
export function onSpatialEngineReady(fn: () => void): () => void {
  if (mod) fn();
  else readyListeners.add(fn);
  return () => readyListeners.delete(fn);
}

// Planar meters around campus. Over a few kilometers this equirectangular
// projection is accurate to well under a meter, so nearest-by-meters in the
// plane is nearest on the ground.
const KX = 111_320 * Math.cos((URI_CENTER.lat * Math.PI) / 180);
const KY = 110_540;
export const toXY = (p: LatLng): [number, number] => [(p.lng - URI_CENTER.lng) * KX, (p.lat - URI_CENTER.lat) * KY];

export type Neighbor = { id: number; dist2: number };

/** One set of points held in WebAssembly memory, as a k-d tree and as a brute-force list. */
export class SpatialIndex {
  private constructor(
    private readonly m: KDTreeModule,
    private readonly handle: number,
    readonly size: number,
    /** Time the C++ side spent building the tree. */
    readonly buildMs: number,
  ) {}

  private outIds = 0;
  private outDist = 0;
  private outCap = 0;

  /** Builds an index over points given as [x0, y0, x1, y1, ...] (meters); point i gets id i. Null if the engine isn't ready. */
  static fromXY(xy: Float64Array): SpatialIndex | null {
    const m = mod;
    if (!m) return null;
    const n = xy.length / 2;
    const ptr = m._malloc(Math.max(xy.byteLength, 8));
    m.HEAPF64.set(xy, ptr / 8);
    const handle = m._kd_create(ptr, n);
    m._free(ptr);
    return new SpatialIndex(m, handle, n, m._kd_last_build_ms());
  }

  static fromLatLng(points: LatLng[]): SpatialIndex | null {
    const xy = new Float64Array(points.length * 2);
    points.forEach((p, i) => {
      const [x, y] = toXY(p);
      xy[2 * i] = x;
      xy[2 * i + 1] = y;
    });
    return SpatialIndex.fromXY(xy);
  }

  /** k nearest points to (x, y), nearest first, using the k-d tree (or brute force, for comparison). */
  kNearestXY(x: number, y: number, k: number, method: 'kdtree' | 'brute' = 'kdtree'): Neighbor[] {
    if (k <= 0) return [];
    this.ensureOutput(k);
    const m = this.m;
    const count = (method === 'kdtree' ? m._kd_knn : m._bf_knn)(this.handle, x, y, k, this.outIds, this.outDist);
    // Read the heap views after the call: they are replaced if wasm memory grew.
    const ids = m.HEAP32;
    const d = m.HEAPF64;
    const out: Neighbor[] = [];
    for (let i = 0; i < count; i++) out.push({ id: ids[this.outIds / 4 + i], dist2: d[this.outDist / 8 + i] });
    return out;
  }

  kNearest(p: LatLng, k: number): Neighbor[] {
    const [x, y] = toXY(p);
    return this.kNearestXY(x, y, k);
  }

  /** Runs nq queries ([x0, y0, ...]) inside WebAssembly; returns total milliseconds. */
  bench(queries: Float64Array, k: number, method: 'kdtree' | 'brute'): number {
    const m = this.m;
    const ptr = m._malloc(Math.max(queries.byteLength, 8));
    m.HEAPF64.set(queries, ptr / 8);
    const ms = (method === 'kdtree' ? m._kd_bench : m._bf_bench)(this.handle, ptr, queries.length / 2, k);
    m._free(ptr);
    return ms;
  }

  /**
   * Accurate time per query in milliseconds: runs the queries (cycling
   * through them) inside WebAssembly until at least minMs has passed. Long
   * runs make the browser's coarse ~0.1 ms clock a negligible error.
   */
  timeQuery(queries: Float64Array, k: number, method: 'kdtree' | 'brute', minMs: number): number {
    const m = this.m;
    const ptr = m._malloc(Math.max(queries.byteLength, 8));
    m.HEAPF64.set(queries, ptr / 8);
    const ms = (method === 'kdtree' ? m._kd_time_query : m._bf_time_query)(this.handle, ptr, queries.length / 2, k, minMs);
    m._free(ptr);
    return ms;
  }

  /** Accurate time per tree build in milliseconds (rebuilds until at least minMs has passed). */
  timeBuild(minMs: number): number {
    return this.m._kd_time_build(this.handle, minMs);
  }

  free() {
    if (this.outCap) {
      this.m._free(this.outIds);
      this.m._free(this.outDist);
      this.outCap = 0;
    }
    this.m._kd_free(this.handle);
  }

  private ensureOutput(k: number) {
    if (k <= this.outCap) return;
    if (this.outCap) {
      this.m._free(this.outIds);
      this.m._free(this.outDist);
    }
    this.outIds = this.m._malloc(k * 4);
    this.outDist = this.m._malloc(k * 8);
    this.outCap = k;
  }
}
