// Correctness tests: the k-d tree must return exactly what brute force returns.
// Build and run: make -C cpp test
#include <cmath>
#include <cstdio>
#include <random>
#include <vector>

#include "kdtree.hpp"

using namespace rhody;

static int failures = 0;

#define CHECK(cond, ...)                          \
  do {                                            \
    if (!(cond)) {                                \
      std::printf("FAIL %s:%d: ", __FILE__, __LINE__); \
      std::printf(__VA_ARGS__);                   \
      std::printf("\n");                          \
      ++failures;                                 \
    }                                             \
  } while (0)

// Ties can be returned in a different order, so compare distances, not ids.
static bool sameDistances(const std::vector<Neighbor>& a, const std::vector<Neighbor>& b) {
  if (a.size() != b.size()) return false;
  for (std::size_t i = 0; i < a.size(); ++i)
    if (std::fabs(a[i].dist2 - b[i].dist2) > 1e-9) return false;
  return true;
}

static std::vector<Point> randomPoints(int n, std::mt19937& rng, double size, bool grid) {
  std::uniform_real_distribution<double> u(0, size);
  std::uniform_int_distribution<int> g(0, 20);  // few distinct values: many duplicates and ties
  std::vector<Point> pts;
  pts.reserve(n);
  for (int i = 0; i < n; ++i) {
    if (grid) pts.push_back({double(g(rng)), double(g(rng)), i});
    else pts.push_back({u(rng), u(rng), i});
  }
  return pts;
}

static void compareRandom(int n, int k, bool grid, unsigned seed) {
  std::mt19937 rng(seed);
  std::vector<Point> pts = randomPoints(n, rng, 2000, grid);
  KDTree tree(pts);
  BruteForce brute(pts);
  std::uniform_real_distribution<double> q(-200, 2200);  // some queries outside the data
  for (int t = 0; t < 300; ++t) {
    const double x = grid ? std::floor(q(rng) / 100) : q(rng);
    const double y = grid ? std::floor(q(rng) / 100) : q(rng);
    auto a = tree.kNearest(x, y, k);
    auto b = brute.kNearest(x, y, k);
    CHECK(sameDistances(a, b), "n=%d k=%d grid=%d query=(%.2f, %.2f)", n, k, grid, x, y);
    CHECK(int(a.size()) == std::min(n, k), "expected %d results, got %zu", std::min(n, k), a.size());
    for (std::size_t i = 1; i < a.size(); ++i) CHECK(a[i - 1].dist2 <= a[i].dist2, "results not sorted");
  }
}

int main() {
  // Edge cases.
  {
    KDTree empty({});
    CHECK(empty.kNearest(0, 0, 3).empty(), "empty tree should return nothing");
    KDTree one({{5, 5, 42}});
    auto r = one.kNearest(0, 0, 3);
    CHECK(r.size() == 1 && r[0].id == 42 && r[0].dist2 == 50, "single point");
    CHECK(one.kNearest(0, 0, 0).empty(), "k = 0 should return nothing");
    KDTree same({{1, 1, 0}, {1, 1, 1}, {1, 1, 2}});
    CHECK(same.kNearest(1, 1, 2).size() == 2, "duplicate points");
  }
  // Exact nearest on a known layout.
  {
    KDTree t({{0, 0, 0}, {10, 0, 1}, {0, 10, 2}, {7, 7, 3}, {-5, -5, 4}});
    auto r = t.kNearest(6, 6, 1);
    CHECK(r.size() == 1 && r[0].id == 3, "nearest to (6,6) should be id 3");
    auto r2 = t.kNearest(9, 1, 2);
    CHECK(r2.size() == 2 && r2[0].id == 1 && r2[1].id == 3, "two nearest to (9,1) should be 1 then 3");
  }
  // Randomized: every size the benchmark uses, several k, spread-out and clustered/duplicate data.
  unsigned seed = 1;
  for (int n : {1, 2, 3, 10, 100, 1000, 10000, 100000})
    for (int k : {1, 5, 20})
      for (bool grid : {false, true}) compareRandom(n, k, grid, seed++);

  if (failures) {
    std::printf("%d check(s) failed\n", failures);
    return 1;
  }
  std::printf("All k-d tree tests passed (results identical to brute force).\n");
  return 0;
}
