// Native benchmark: k-d tree vs brute force at 100, 1,000, 10,000 and 100,000
// points. Writes a CSV for the report and a JSON file the app's Performance page shows.
// Run: make -C cpp bench
#include <algorithm>
#include <chrono>
#include <cstdio>
#include <random>
#include <string>
#include <vector>

#include "kdtree.hpp"

using namespace rhody;
using Clock = std::chrono::steady_clock;

namespace {

constexpr int kQueries = 1000;  // queries per measurement
constexpr int kRuns = 5;        // repeated runs; the median is reported
constexpr double kWidthM = 2500, kHeightM = 2000;  // about the size of the Kingston campus

double ms(Clock::duration d) { return std::chrono::duration<double, std::milli>(d).count(); }

double median(std::vector<double> v) {
  std::sort(v.begin(), v.end());
  return v[v.size() / 2];
}

struct Row {
  int n, k;
  double buildMs, kdQueryUs, bfQueryUs;
};

}  // namespace

int main(int argc, char** argv) {
  const char* csvPath = argc > 1 ? argv[1] : "results.csv";
  const char* jsonPath = argc > 2 ? argv[2] : "results.json";

  std::mt19937 rng(212);  // fixed seed: same points every run
  std::uniform_real_distribution<double> ux(0, kWidthM), uy(0, kHeightM);
  std::vector<std::pair<double, double>> queries(kQueries);
  for (auto& q : queries) q = {ux(rng), uy(rng)};

  std::vector<Row> rows;
  long long checksum = 0;  // keeps the compiler from optimizing the queries away
  for (int n : {100, 1000, 10000, 100000}) {
    std::vector<Point> pts(n);
    for (int i = 0; i < n; ++i) pts[i] = {ux(rng), uy(rng), i};

    std::vector<double> builds;
    for (int r = 0; r < kRuns; ++r) {
      auto t = Clock::now();
      KDTree tmp(pts);
      builds.push_back(ms(Clock::now() - t));
      checksum += tmp.size();
    }
    KDTree tree(pts);
    BruteForce brute(pts);

    for (int k : {1, 5}) {
      std::vector<double> kd, bf;
      for (int r = 0; r < kRuns; ++r) {
        auto t = Clock::now();
        for (auto& q : queries) checksum += tree.kNearest(q.first, q.second, k)[0].id;
        kd.push_back(ms(Clock::now() - t) * 1000 / kQueries);
        t = Clock::now();
        for (auto& q : queries) checksum += brute.kNearest(q.first, q.second, k)[0].id;
        bf.push_back(ms(Clock::now() - t) * 1000 / kQueries);
      }
      Row row{n, k, median(builds), median(kd), median(bf)};
      rows.push_back(row);
      std::printf("n=%-7d k=%d  build %8.3f ms   k-d %9.3f us/query   brute %10.3f us/query   %7.1fx faster\n", n, k,
                  row.buildMs, row.kdQueryUs, row.bfQueryUs, row.bfQueryUs / row.kdQueryUs);
    }
  }

  if (FILE* f = std::fopen(csvPath, "w")) {
    std::fprintf(f, "n,k,kd_build_ms,kd_query_us,bf_query_us,speedup\n");
    for (auto& r : rows)
      std::fprintf(f, "%d,%d,%.4f,%.4f,%.4f,%.2f\n", r.n, r.k, r.buildMs, r.kdQueryUs, r.bfQueryUs, r.bfQueryUs / r.kdQueryUs);
    std::fclose(f);
  }
  if (FILE* f = std::fopen(jsonPath, "w")) {
    std::fprintf(f, "{\n  \"source\": \"Native C++ (%s), %d queries x %d runs, median\",\n  \"rows\": [\n",
#if defined(__clang__)
                 "clang " __clang_version__,
#else
                 "C++",
#endif
                 kQueries, kRuns);
    for (std::size_t i = 0; i < rows.size(); ++i) {
      auto& r = rows[i];
      std::fprintf(f, "    {\"n\": %d, \"k\": %d, \"buildMs\": %.4f, \"kdQueryUs\": %.4f, \"bfQueryUs\": %.4f}%s\n", r.n, r.k,
                   r.buildMs, r.kdQueryUs, r.bfQueryUs, i + 1 < rows.size() ? "," : "");
    }
    std::fprintf(f, "  ]\n}\n");
    std::fclose(f);
  }
  std::printf("(checksum %lld)\nWrote %s and %s\n", checksum, csvPath, jsonPath);
  return 0;
}
