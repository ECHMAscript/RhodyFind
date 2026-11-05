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
