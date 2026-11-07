import type { Endpoint } from './endpoints';
import type { LatLng } from './geo';
import { findNearest } from './search';

// Farther than this from every place on the map counts as off campus. The
// map's places cover the Kingston campus and the village next to it, so this
// leaves room for the edges of campus (fields, lots, the outer dorms).
export const ON_CAMPUS_METERS = 800;

/** How far `p` is from the nearest place on the map (k-d tree), in meters. */
export function metersFromCampus(p: LatLng): number {
  return findNearest(p, { k: 1 })[0]?.meters ?? Infinity;
}

/**
 * Off campus: the user's own position, when it's far from every campus place.
 * A building picked from the list is always on campus.
 */
export function offCampusDistance(e: Endpoint | undefined): number | undefined {
  if (!e || e.id) return undefined;
  const m = metersFromCampus(e);
  return m > ON_CAMPUS_METERS ? m : undefined;
}
