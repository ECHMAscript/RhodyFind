import type { LatLng } from './geo';

/**
 * Phone GPS reports about once per second, so drawing each fix as it arrives
 * makes the dot jump (11 m per jump at 25 mph). Between fixes we predict where
 * the user is from their last speed and heading (dead reckoning), and ease the
 * drawn dot toward that prediction every animation frame.
 */
export type Motion = {
  position: LatLng;
  /** Meters per second, when known. */
  speed?: number;
  /** Degrees, 0 = north, when known. */
  heading?: number;
  /** When this fix arrived (Date.now() clock). */
  receivedAt: number;
};

// Don't predict further than this past the last fix: if fixes stop, the dot stops.
const MAX_PREDICT_S = 1.5;
// Below this speed, movement between fixes is mostly GPS noise.
const MIN_PREDICT_SPEED = 0.7;
// How quickly the drawn dot catches up with the prediction (time constant).
const SMOOTH_MS = 140;
// A jump bigger than this (e.g. GPS recovering indoors) is drawn at once, not glided.
const SNAP_METERS = 120;

const M_PER_DEG_LAT = 110_540;
const mPerDegLng = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

/** Where the user probably is at `now`, given their last fix. */
export function predictPosition(m: Motion, now: number): LatLng {
  const { position, speed, heading } = m;
  if (speed === undefined || heading === undefined || speed < MIN_PREDICT_SPEED) return position;
  const seconds = Math.min(Math.max(0, (now - m.receivedAt) / 1000), MAX_PREDICT_S);
  const meters = speed * seconds;
  const rad = (heading * Math.PI) / 180;
  return {
    lat: position.lat + (meters * Math.cos(rad)) / M_PER_DEG_LAT,
    lng: position.lng + (meters * Math.sin(rad)) / mPerDegLng(position.lat),
  };
}

/** One animation-frame step of the drawn position toward the target. */
export function smoothToward(shown: LatLng, target: LatLng, frameMs: number): LatLng {
  const dy = (target.lat - shown.lat) * M_PER_DEG_LAT;
  const dx = (target.lng - shown.lng) * mPerDegLng(shown.lat);
  if (dx * dx + dy * dy > SNAP_METERS * SNAP_METERS) return target;
  const a = 1 - Math.exp(-frameMs / SMOOTH_MS);
  return { lat: shown.lat + (target.lat - shown.lat) * a, lng: shown.lng + (target.lng - shown.lng) * a };
}
