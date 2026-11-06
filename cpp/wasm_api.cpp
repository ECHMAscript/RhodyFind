// C interface compiled to WebAssembly (make -C cpp wasm) and called from
// src/lib/spatial/kdtree.ts. An "index" holds the same points twice: as a
// k-d tree and as a brute-force list, so both can be queried and benchmarked.
//
// Memory: JS allocates its input/output arrays with malloc/free in the module's
// heap and passes pointers; results are written into the arrays it provides.
#include <emscripten/emscripten.h>

#include <memory>
#include <vector>

#include "kdtree.hpp"

using namespace rhody;

namespace {

struct Index {
  KDTree tree;
  BruteForce brute;
};

std::vector<std::unique_ptr<Index>> indexes;  // handle = position in this list
double lastBuildMs = 0;

Index* get(int h) { return h >= 0 && h < int(indexes.size()) ? indexes[h].get() : nullptr; }

int write(const std::vector<Neighbor>& r, int* outIds, double* outDist2) {
  for (std::size_t i = 0; i < r.size(); ++i) {
    outIds[i] = r[i].id;
    outDist2[i] = r[i].dist2;
  }
  return int(r.size());
}

}  // namespace

extern "C" {

// Builds an index over n points given as xy = [x0, y0, x1, y1, ...]; point i gets id i.
EMSCRIPTEN_KEEPALIVE int kd_create(const double* xy, int n) {
  std::vector<Point> pts(n);
  for (int i = 0; i < n; ++i) pts[i] = {xy[2 * i], xy[2 * i + 1], i};
  const double t = emscripten_get_now();
  KDTree tree(pts);
  lastBuildMs = emscripten_get_now() - t;
  indexes.push_back(std::make_unique<Index>(Index{std::move(tree), BruteForce(std::move(pts))}));
  return int(indexes.size()) - 1;
}

// Time the last kd_create spent building the tree, in milliseconds.
EMSCRIPTEN_KEEPALIVE double kd_last_build_ms() { return lastBuildMs; }

EMSCRIPTEN_KEEPALIVE void kd_free(int h) {
  if (get(h)) indexes[h].reset();
}

EMSCRIPTEN_KEEPALIVE int kd_size(int h) {
  Index* ix = get(h);
  return ix ? int(ix->tree.size()) : 0;
}

// k nearest to (x, y), nearest first. Writes up to k ids and squared distances; returns the count.
EMSCRIPTEN_KEEPALIVE int kd_knn(int h, double x, double y, int k, int* outIds, double* outDist2) {
  Index* ix = get(h);
  return ix ? write(ix->tree.kNearest(x, y, k), outIds, outDist2) : 0;
}

// Same answer by checking every point (the baseline).
EMSCRIPTEN_KEEPALIVE int bf_knn(int h, double x, double y, int k, int* outIds, double* outDist2) {
  Index* ix = get(h);
  return ix ? write(ix->brute.kNearest(x, y, k), outIds, outDist2) : 0;
}

// Benchmarks run entirely inside WebAssembly so JS call overhead isn't measured.
// Queries are qxy = [x0, y0, ...]; returns total milliseconds for all nq queries.
static long long sink = 0;

EMSCRIPTEN_KEEPALIVE double kd_bench(int h, const double* qxy, int nq, int k) {
  Index* ix = get(h);
  if (!ix) return -1;
  const double t = emscripten_get_now();
  for (int i = 0; i < nq; ++i) sink += ix->tree.kNearest(qxy[2 * i], qxy[2 * i + 1], k).size();
  return emscripten_get_now() - t;
}

EMSCRIPTEN_KEEPALIVE double bf_bench(int h, const double* qxy, int nq, int k) {
  Index* ix = get(h);
  if (!ix) return -1;
  const double t = emscripten_get_now();
  for (int i = 0; i < nq; ++i) sink += ix->brute.kNearest(qxy[2 * i], qxy[2 * i + 1], k).size();
  return emscripten_get_now() - t;
}

}  // extern "C"
