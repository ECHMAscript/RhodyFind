import { LOCATIONS, type CampusLocation, type Category } from '@/data/locations';
import { haversineMeters, type LatLng } from './geo';

export type NearestResult = { location: CampusLocation; meters: number };

/**
 * Finds the k closest locations to `origin`, optionally limited to one category.
 *
 * This is the front end's only entry point into nearest-neighbor search. For now
 * it is a brute-force scan in JS (the project's baseline). It will be replaced by
 * the C++ k-d tree compiled to WebAssembly, keeping this same signature.
 */
export function findNearest(
  origin: LatLng,
  opts: { category?: Category; k?: number; excludeId?: string } = {},
): NearestResult[] {
  const { category, k = 5, excludeId } = opts;
  return LOCATIONS.filter((l) => (!category || l.category === category) && l.id !== excludeId)
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
