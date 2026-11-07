import type { Category } from '@/data/locations';
import type { LatLng, TravelMode } from './geo';
import { findRoute, type Route } from './routing/router';
import { findNearest, type NearestResult } from './search';

export type RankedResult = NearestResult & {
  /** The route there for the chosen mode, or null if the mode can't get there. */
  route: Route | null;
};

/**
 * Closest places by actual travel time, not straight-line distance.
 *
 * Filter and refine:
 *  1. Filter: the C++ k-d tree returns the `candidates` nearest places in a
 *     straight line (O(log n) each, instead of measuring every place).
 *  2. Refine: A* finds the real route to each candidate over the campus path
 *     network, and the candidates are re-ranked by travel time.
 *
 * Asking for about 3x as many candidates as are shown means a place that's
 * close on foot but slightly farther in a straight line still makes the cut.
 */
export function findNearestByRoute(
  origin: LatLng,
  opts: { category?: Category; k?: number; mode?: TravelMode; excludeId?: string; candidates?: number },
): RankedResult[] {
  const { category, k = 4, mode = 'walk', excludeId } = opts;
  const candidates = opts.candidates ?? Math.max(8, k * 3);
  const pool = findNearest(origin, { category, k: candidates, excludeId });
  const ranked = pool.map((r) => ({ ...r, route: findRoute(origin, r.location, mode) }));
  // Places the mode can't reach go last, in straight-line order.
  ranked.sort((a, b) => (a.route?.seconds ?? Infinity) - (b.route?.seconds ?? Infinity) || a.meters - b.meters);
  return ranked.slice(0, k);
}
