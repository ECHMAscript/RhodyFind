import { LOCATIONS, PLACES, type CampusLocation, type Category } from '@/data/locations';
import { haversineMeters, type LatLng } from './geo';
import { SpatialIndex, spatialEngineReady } from './spatial/engine';

export type NearestResult = { location: CampusLocation; meters: number };

// One k-d tree per category (plus one for all places), built the first time
// it's needed after the WebAssembly engine has loaded.
const indexes = new Map<Category | 'all', { index: SpatialIndex; locations: CampusLocation[] }>();

function locationIndex(category: Category | undefined) {
  const key = category ?? 'all';
  let entry = indexes.get(key);
  if (!entry && spatialEngineReady()) {
    const locations = category ? LOCATIONS.filter((l) => l.category === category) : PLACES;
    const index = SpatialIndex.fromLatLng(locations);
    if (index) indexes.set(key, (entry = { index, locations }));
  }
  return entry;
}

/**
 * Finds the k closest locations to `origin`, optionally limited to one category.
 * Without a category it searches places only (not restrooms or printers).
 *
 * This is the front end's only entry point into nearest-neighbor search. It
 * queries the C++ k-d tree (WebAssembly) when it's loaded, and otherwise falls
 * back to the brute-force scan below; both return the same places.
 */
export function findNearest(
  origin: LatLng,
  opts: { category?: Category; k?: number; excludeId?: string } = {},
): NearestResult[] {
  const { category, k = 5, excludeId } = opts;
  const entry = locationIndex(category);
  if (entry) {
    // Ask for one extra in case the excluded place is among the nearest.
    return entry.index
      .kNearest(origin, excludeId ? k + 1 : k)
      .map((n) => entry.locations[n.id])
      .filter((l) => l.id !== excludeId)
      .slice(0, k)
      .map((location) => ({ location, meters: haversineMeters(origin, location) }));
  }
  return findNearestBruteForce(origin, opts);
}

/** The baseline: measure the distance to every location and sort. */
export function findNearestBruteForce(
  origin: LatLng,
  opts: { category?: Category; k?: number; excludeId?: string } = {},
): NearestResult[] {
  const { category, k = 5, excludeId } = opts;
  return (category ? LOCATIONS.filter((l) => l.category === category) : PLACES)
    .filter((l) => l.id !== excludeId)
    .map((location) => ({ location, meters: haversineMeters(origin, location) }))
    .sort((a, b) => a.meters - b.meters)
    .slice(0, k);
}

/** Autocomplete over location names: prefix matches first, then substring matches. */
export function searchByName(query: string, limit = 6): CampusLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = LOCATIONS.map((l) => {
    const name = l.name.toLowerCase();
    const idx = name.indexOf(q);
    const wordStart = name.split(/\s+/).some((w) => w.startsWith(q));
    const score = idx === 0 ? 0 : wordStart ? 1 : idx > 0 ? 2 : -1;
    return { l, score };
  }).filter((s) => s.score >= 0);
  scored.sort((a, b) => a.score - b.score || a.l.name.localeCompare(b.l.name));
  return scored.slice(0, limit).map((s) => s.l);
}
