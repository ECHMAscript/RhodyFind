import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * The phone's compass: which way it's pointing, many times a second. This is
 * what makes the arrow turn the instant you turn (as in Google Maps); GPS only
 * knows your direction after you've walked a few meters that way.
 *
 * Readings skip React: the map subscribes and turns the arrow directly.
 */
export type Compass = {
  /** Called with each reading, in degrees clockwise from north. Returns an unsubscribe. */
  subscribe(fn: (deg: number) => void): () => void;
  /** The last reading and when it came (Date.now()), if any. */
  latest(): { deg: number; at: number } | undefined;
};

// How strongly each reading pulls the shown direction (0..1). Readings come
// ~60 times a second, so at 0.55 a turn is 80% shown after two readings
// (~33 ms) and all there within ~80 ms, while the compass's own jitter of a
// degree or two is still smoothed away.
const SMOOTHING = 0.55;

function createCompass() {
  const listeners = new Set<(deg: number) => void>();
  let last: { deg: number; at: number } | undefined;
  // Smoothed as a unit vector, so 359 -> 1 degrees averages to 0, not 180.
  let vx = 0;
  let vy = 0;
  return {
    compass: {
      subscribe(fn: (deg: number) => void) {
        listeners.add(fn);
        return () => void listeners.delete(fn);
      },
      latest: () => last,
    } as Compass,
    push(deg: number) {
      const r = (deg * Math.PI) / 180;
      const fresh = !last || Date.now() - last.at > 1000;
      vx = fresh ? Math.sin(r) : vx + (Math.sin(r) - vx) * SMOOTHING;
      vy = fresh ? Math.cos(r) : vy + (Math.cos(r) - vy) * SMOOTHING;
      const shown = ((Math.atan2(vx, vy) * 180) / Math.PI + 360) % 360;
      last = { deg: shown, at: Date.now() };
      for (const fn of listeners) fn(shown);
    },
    reset() {
      last = undefined;
    },
  };
}

/**
 * Compass heading from a device orientation (alpha, beta, gamma in degrees,
 * alpha measured from north), corrected for how far the phone is tilted
 * (W3C Device Orientation spec, "compass heading" example).
 */
export function compassHeading(alpha: number, beta: number, gamma: number): number {
  const d = Math.PI / 180;
  const cA = Math.cos(alpha * d);
  const sA = Math.sin(alpha * d);
  const sB = Math.sin(beta * d);
  const cG = Math.cos(gamma * d);
  const sG = Math.sin(gamma * d);
  const rA = -cA * sG - sA * sB * cG;
  const rB = -sA * sG + cA * sB * cG;
  // Lying flat (or nearly), the tilt terms vanish and the formula is 0/0;
  // then the heading is simply the rotation about the vertical axis.
  if (Math.hypot(rA, rB) < 0.05) return (360 - alpha + 360) % 360;
  let h = Math.atan(rA / rB);
  if (rB < 0) h += Math.PI;
  else if (rA < 0) h += 2 * Math.PI;
  return (h / d + 360) % 360;
}

/** How far the screen is rotated from portrait (landscape is 90 or 270). */
function screenAngle(): number {
  if (typeof window === 'undefined') return 0;
  const a = window.screen?.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0;
  return Number.isFinite(a) ? a : 0;
}

type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number };

/**
 * iPhones only send compass readings to a web page after the user allows it,
 * and the request has to come from a tap. Call this from a tap handler (Start
 * Route); elsewhere it does nothing.
 */
export function requestCompassPermission() {
  if (Platform.OS !== 'web' || typeof DeviceOrientationEvent === 'undefined') return;
  const req = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
  if (typeof req === 'function') req.call(DeviceOrientationEvent).catch(() => {});
}

/** Streams compass readings while `enabled` (live navigation). */
export function useCompass(enabled: boolean): Compass {
  const [store] = useState(createCompass);

  useEffect(() => {
    if (!enabled) {
      store.reset();
      return;
    }

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      const onOrientation = (e: Event) => {
        const o = e as OrientationEvt;
        let deg: number | undefined;
        // iPhone: Safari works the compass heading out itself.
        if (typeof o.webkitCompassHeading === 'number' && o.webkitCompassHeading >= 0) deg = o.webkitCompassHeading;
        // Android: alpha is measured from north only on "absolute" readings.
        else if ((o.absolute || e.type === 'deviceorientationabsolute') && o.alpha != null && o.beta != null && o.gamma != null) {
          deg = compassHeading(o.alpha, o.beta, o.gamma);
        }
        if (deg !== undefined && Number.isFinite(deg)) store.push((deg + screenAngle()) % 360);
      };
      // Android Chrome sends north-referenced readings as their own event;
      // when it does, the plain one (relative to wherever the page loaded) is ignored.
      const absolute = 'ondeviceorientationabsolute' in window;
      const type = absolute ? 'deviceorientationabsolute' : 'deviceorientation';
      window.addEventListener(type, onOrientation);
      return () => window.removeEventListener(type, onOrientation);
    }

    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      if (Number.isFinite(deg) && deg >= 0) store.push(deg);
    })
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled, store]);

  return store.compass;
}
