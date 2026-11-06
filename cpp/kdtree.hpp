// RhodyFind spatial search: a 2-D k-d tree and the brute-force baseline it is
// measured against. Header-only so the same code builds natively (tests and
// benchmarks) and to WebAssembly (the web app).
//
// Coordinates are planar meters (the app projects lat/lng around campus before
// building), so squared Euclidean distance orders points correctly.
#pragma once

#include <algorithm>
#include <cstddef>
#include <queue>
#include <vector>

namespace rhody {

struct Point {
  double x;
  double y;
  int id;  // caller's identifier (e.g. index into the locations list)
};

struct Neighbor {
  int id;
  double dist2;  // squared distance to the query
  // Max-heap order: the farthest current candidate is on top.
  bool operator<(const Neighbor& o) const { return dist2 < o.dist2; }
};

inline double dist2(const Point& p, double x, double y) {
  const double dx = p.x - x;
  const double dy = p.y - y;
  return dx * dx + dy * dy;
}

// Keeps the k best (smallest dist2) candidates seen so far: O(log k) per offer.
class BoundedMaxHeap {
 public:
  explicit BoundedMaxHeap(int k) : k_(k) {}
  bool full() const { return static_cast<int>(heap_.size()) >= k_; }
  // Distance a candidate must beat to get in (infinity while not full; with
  // k <= 0 nothing can get in, so it is below every distance).
  double worst() const {
    if (k_ <= 0) return -1;
    return full() ? heap_.top().dist2 : kInfinity;
  }
  void offer(int id, double d2) {
    if (k_ <= 0) return;
    if (!full()) {
      heap_.push({id, d2});
    } else if (d2 < heap_.top().dist2) {
      heap_.pop();
      heap_.push({id, d2});
    }
  }
  // Results nearest-first.
  std::vector<Neighbor> sorted() {
    std::vector<Neighbor> out(heap_.size());
    for (std::size_t i = out.size(); i-- > 0;) {
      out[i] = heap_.top();
      heap_.pop();
    }
    return out;
  }

 private:
  static constexpr double kInfinity = 1e300;
  int k_;
  std::priority_queue<Neighbor> heap_;
};

// Baseline: compare the query against every point. O(n log k) per query.
class BruteForce {
 public:
  explicit BruteForce(std::vector<Point> points) : pts_(std::move(points)) {}

  std::vector<Neighbor> kNearest(double x, double y, int k) const {
    BoundedMaxHeap best(k);
    for (const Point& p : pts_) best.offer(p.id, dist2(p, x, y));
    return best.sorted();
  }

  std::size_t size() const { return pts_.size(); }

 private:
  std::vector<Point> pts_;
};

// 2-D k-d tree stored implicitly in one array: the node for range [lo, hi) is
// the median element at mid = (lo + hi) / 2, its left subtree is [lo, mid) and
// its right subtree is [mid + 1, hi). Levels alternate splitting on x and y.
//
// Build: O(n log n) using std::nth_element (linear-time median) per level.
// Query: about O(log n) on average for well-spread points; a subtree is only
// searched when the splitting line is closer than the current k-th best.
class KDTree {
 public:
  explicit KDTree(std::vector<Point> points) : pts_(std::move(points)), axis_(pts_.size()) {
    build(0, static_cast<int>(pts_.size()), 0);
  }

  std::vector<Neighbor> kNearest(double x, double y, int k) const {
    BoundedMaxHeap best(k);
    search(0, static_cast<int>(pts_.size()), x, y, best);
    return best.sorted();
  }

  std::size_t size() const { return pts_.size(); }

 private:
  void build(int lo, int hi, int depth) {
    if (hi - lo <= 0) return;
    const int mid = lo + (hi - lo) / 2;
    const unsigned char axis = depth % 2;
    // Put the median (by this level's axis) at mid; smaller to the left, larger to the right.
    std::nth_element(pts_.begin() + lo, pts_.begin() + mid, pts_.begin() + hi,
                     [axis](const Point& a, const Point& b) { return axis == 0 ? a.x < b.x : a.y < b.y; });
    axis_[mid] = axis;
    build(lo, mid, depth + 1);
    build(mid + 1, hi, depth + 1);
  }

  void search(int lo, int hi, double x, double y, BoundedMaxHeap& best) const {
    if (hi - lo <= 0) return;
    const int mid = lo + (hi - lo) / 2;
    const Point& p = pts_[mid];
    best.offer(p.id, dist2(p, x, y));

    // Signed distance from the query to this node's splitting line.
    const double diff = axis_[mid] == 0 ? x - p.x : y - p.y;
    const bool goLeft = diff < 0;
    // Search the side the query is on first: it most likely holds the answer.
    if (goLeft) search(lo, mid, x, y, best);
    else search(mid + 1, hi, x, y, best);
    // Pruning: the other side can only hold something closer if the splitting
    // line itself is closer than the current k-th best.
    if (diff * diff < best.worst()) {
      if (goLeft) search(mid + 1, hi, x, y, best);
      else search(lo, mid, x, y, best);
    }
  }

  std::vector<Point> pts_;
  std::vector<unsigned char> axis_;  // split axis of the node stored at each index
};

}  // namespace rhody
