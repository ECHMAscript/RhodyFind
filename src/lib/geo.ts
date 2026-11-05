import type { IconName } from '@/data/locations';

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in meters. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function formatMiles(meters: number): string {
  const miles = meters / 1609.344;
  return miles < 0.1 ? `${Math.round(meters * 3.281)} ft` : `${miles.toFixed(1)} mi`;
}

export type TravelMode = 'walk' | 'bike' | 'skate' | 'shuttle' | 'drive';

export const TRAVEL_MODES: { id: TravelMode; label: string; icon: IconName; mph: number; overheadMin: number }[] = [
  { id: 'walk', label: 'Walk', icon: 'walk', mph: 3, overheadMin: 0 },
  { id: 'bike', label: 'Bike', icon: 'bike', mph: 10, overheadMin: 1 },
  { id: 'skate', label: 'Skateboard', icon: 'skateboard', mph: 8, overheadMin: 0 },
  { id: 'shuttle', label: 'Shuttle', icon: 'bus', mph: 12, overheadMin: 4 },
  { id: 'drive', label: 'Drive', icon: 'car', mph: 15, overheadMin: 2 },
];

// Paths on campus are not straight lines; this inflates crow-flies distance
// until real routing is added.
const PATH_FACTOR = 1.3;

/** Rough travel time in whole minutes (at least 1). */
export function travelMinutes(meters: number, mode: TravelMode): number {
  const m = TRAVEL_MODES.find((t) => t.id === mode)!;
  const miles = (meters * PATH_FACTOR) / 1609.344;
  return Math.max(1, Math.round((miles / m.mph) * 60 + m.overheadMin));
}

export function arrivalTime(minutes: number, from = new Date()): string {
  const t = new Date(from.getTime() + minutes * 60_000);
  return t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Closest point of a path to p: its distance, the index of the path segment
 * (path[i] -> path[i + 1]) it lies on, and the point itself.
 */
export function distanceToPathMeters(p: LatLng, path: LatLng[]): { meters: number; segment: number; point: LatLng } {
  // Flat-earth projection around p; accurate to well under a meter at campus scale.
  const kx = 111_320 * Math.cos(toRad(p.lat));
  const ky = 110_540;
  let best = { meters: Infinity, segment: 0, point: path[0] ?? p };
  for (let i = 0; i < path.length - 1; i++) {
    const ax = (path[i].lng - p.lng) * kx;
    const ay = (path[i].lat - p.lat) * ky;
    const bx = (path[i + 1].lng - p.lng) * kx;
    const by = (path[i + 1].lat - p.lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best.meters) {
      best = {
        meters: d,
        segment: i,
        point: { lat: path[i].lat + t * (path[i + 1].lat - path[i].lat), lng: path[i].lng + t * (path[i + 1].lng - path[i].lng) },
      };
    }
  }
  return best;
}

/** cum[i] = meters along the path from path[0] to path[i]. */
export function cumulativeMeters(path: LatLng[]): Float64Array {
  const cum = new Float64Array(path.length);
  for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + haversineMeters(path[i - 1], path[i]);
  return cum;
}

/** Compass bearing from a to b in degrees, 0 = north. */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
