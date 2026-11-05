import { LOCATION_BY_ID, type CampusLocation } from '@/data/locations';
import type { LatLng } from './geo';

/** A route endpoint: either a known campus location or the user's own position. */
export type Endpoint = LatLng & { name: string; id?: string };

export const fromLocation = (l: CampusLocation): Endpoint => ({ id: l.id, name: l.name, lat: l.lat, lng: l.lng });

export const currentPosition = (c: LatLng): Endpoint => ({ name: 'My location', lat: c.lat, lng: c.lng });

// Endpoints travel through the URL (?from=...&to=...) so map links can be shared:
// a location id, or "me:<lat>,<lng>" for the user's position.
export function encodeEndpoint(e: Endpoint): string {
  return e.id ?? `me:${e.lat.toFixed(6)},${e.lng.toFixed(6)}`;
}

export function decodeEndpoint(param: string | string[] | undefined): Endpoint | undefined {
  const s = Array.isArray(param) ? param[0] : param;
  if (!s) return undefined;
  if (s.startsWith('me:')) {
    const [lat, lng] = s.slice(3).split(',').map(Number);
    return Number.isFinite(lat) && Number.isFinite(lng) ? currentPosition({ lat, lng }) : undefined;
  }
  const loc = LOCATION_BY_ID[s];
  return loc ? fromLocation(loc) : undefined;
}
