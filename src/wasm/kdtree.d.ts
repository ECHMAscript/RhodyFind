// Types for the Emscripten module built from cpp/wasm_api.cpp (see src/lib/spatial/engine.ts).
export type KDTreeModule = {
  _malloc(bytes: number): number;
  _free(ptr: number): void;
  _kd_create(xyPtr: number, n: number): number;
  _kd_free(handle: number): void;
  _kd_size(handle: number): number;
  _kd_knn(handle: number, x: number, y: number, k: number, outIds: number, outDist2: number): number;
  _bf_knn(handle: number, x: number, y: number, k: number, outIds: number, outDist2: number): number;
  _kd_bench(handle: number, qPtr: number, nq: number, k: number): number;
  _bf_bench(handle: number, qPtr: number, nq: number, k: number): number;
  _kd_last_build_ms(): number;
  HEAPF64: Float64Array;
  HEAP32: Int32Array;
};

declare const createKDTreeModule: ((options?: object) => Promise<KDTreeModule>) | null;
export default createKDTreeModule;
