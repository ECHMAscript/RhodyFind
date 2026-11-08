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

// ---------------------------------------------------------------------------
// Accurate timing. Browsers coarsen their clock (to about 0.1 ms, plus jitter)
// so a page can't time things precisely. A single fast measurement is then
// mostly rounding: 1,000 k-d tree searches take under 1 ms, about the size of
// one clock tick. These repeat the work until at least `minMs` has passed and
// divide by how many times it ran, so one tick is a tiny share of the total.

}  // extern "C"

namespace {

// Runs `step` (one unit of work) until minMs has passed; returns ms per unit.
// The clock is read after 1, 2, 4, ... units, capped at 1024, so reading it
// costs almost nothing next to the work, and stopping overshoots by at most
// a quarter of the target.
template <class Step>
double timePerUnit(double minMs, Step step) {
  long long done = 0;
  long long stride = 1;
  const double start = emscripten_get_now();
  double elapsed = 0;
  for (;;) {
    for (long long i = 0; i < stride; ++i) step(done + i);
    done += stride;
    elapsed = emscripten_get_now() - start;
    if (elapsed >= minMs) break;
    if (elapsed < minMs / 4 && stride < 1024) stride *= 2;
  }
  return elapsed / double(done);
}

}  // namespace

extern "C" {

// Milliseconds per query: repeats the nq queries (cycling through them) until
// at least minMs has passed.
EMSCRIPTEN_KEEPALIVE double kd_time_query(int h, const double* qxy, int nq, int k, double minMs) {
  Index* ix = get(h);
  if (!ix || nq <= 0) return -1;
  return timePerUnit(minMs, [&](long long i) {
    const int q = int(i % nq);
    sink += ix->tree.kNearest(qxy[2 * q], qxy[2 * q + 1], k).size();
  });
}

EMSCRIPTEN_KEEPALIVE double bf_time_query(int h, const double* qxy, int nq, int k, double minMs) {
  Index* ix = get(h);
  if (!ix || nq <= 0) return -1;
  return timePerUnit(minMs, [&](long long i) {
    const int q = int(i % nq);
    sink += ix->brute.kNearest(qxy[2 * q], qxy[2 * q + 1], k).size();
  });
}

// Milliseconds per tree build over the index's points: builds a fresh tree
// (including copying the points into it, as KDTree's constructor does)
// until at least minMs has passed.
EMSCRIPTEN_KEEPALIVE double kd_time_build(int h, double minMs) {
  Index* ix = get(h);
  if (!ix) return -1;
  const std::vector<Point>& pts = ix->brute.points();
  return timePerUnit(minMs, [&](long long) {
    KDTree tree(pts);
    sink += static_cast<long long>(tree.size());
  });
}

}  // extern "C"
