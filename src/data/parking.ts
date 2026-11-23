import type { LatLng } from '@/lib/geo';
import AREAS from './parkingAreas.json';

/**
 * Who can park in a lot, as OpenStreetMap tags it (the Emporium's two lots are
 * set from their signs and the operator's listing instead).
 */
export type ParkingKind = 'paid' | 'customers' | 'permit' | 'other';

export const PARKING_KIND_META: Record<ParkingKind, { label: string; color: string }> = {
  paid: { label: 'Paid hourly', color: '#D81B7A' },
  customers: { label: 'Customers only', color: '#C69214' },
  permit: { label: 'Permit or private', color: '#2F6FD6' },
  other: { label: 'Rules not listed', color: '#5B6573' },
};

export type ParkingArea = {
  /** OpenStreetMap way id. */
  id: number;
  kind: ParkingKind;
  /** The place id in data/locations.ts, for the lots RhodyFind lists. */
  lot?: string;
  name?: string;
  /** URI's lot number. */
  ref?: string;
  outline: LatLng[];
};

// Outlines of the parking lots around campus, from OpenStreetMap
// (© OpenStreetMap contributors, ODbL), fetched Nov 2026. Street-side parking
// is left out. Regenerate with an Overpass query for amenity=parking.
export const PARKING_AREAS: ParkingArea[] = (
  AREAS as { id: number; kind: ParkingKind; lot?: string; name?: string; ref?: string; outline: [number, number][] }[]
).map((a) => ({ ...a, outline: a.outline.map(([lat, lng]) => ({ lat, lng })) }));

/** Every corner of every lot, for framing them all on the map. */
export const PARKING_BOUNDS: LatLng[] = PARKING_AREAS.flatMap((a) => a.outline);

/** One way to pay for a stretch of time, e.g. 2 hours: $12 (total $15.78). */
export type ParkingRate = { label: string; price: number; total: number };

/** Rates, payment and rules for a lot, shown on its "Learn more" page. */
export type ParkingInfo = {
  /** Who can park, in a few words. */
  access: string;
  /** Who runs the lot. */
  operator?: string;
  spaces?: number;
  rates?: ParkingRate[];
  /** What's added to the posted rate, and when the rates apply. */
  rateNotes?: string[];
  /** How to pay, step by step. */
  payment?: string[];
  /** Pay ahead online. */
  payUrl?: string;
  /** Towing, permits and the like. */
  rules?: string[];
  /** When the rates were checked. */
  checked?: string;
};
