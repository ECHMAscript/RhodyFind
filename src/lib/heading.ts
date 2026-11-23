import type { LatLng } from './geo';

/** Signed difference b - a in degrees, in (-180, 180]: how far to turn from a to b. */
export function angleDelta(a: number, b: number): number {
  const d = (((b - a) % 360) + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

const norm = (deg: number) => ((deg % 360) + 360) % 360;

// The device's own course is trusted only above this speed (m/s); slower,
// phones report a jumpy course.
const DEVICE_HEADING_MIN_SPEED = 1;
// Direction from movement is fitted through the fixes of the last few
// seconds (least squares), not taken from just two of them: phone fixes
// wander +/-5 m, so with two points one fix landing behind the last made the
// arrow point backwards. The fit needs this much movement to be trusted.
const WINDOW_MS = 6000;
const MIN_TRAVEL_M = 4;
// A turn this sharp looks like a GPS glitch until a second reading agrees.
const REVERSAL_DEG = 100;
const CONFIRMATIONS = 2;
// How far each accepted reading pulls the shown heading (0..1).
const SMOOTHING = 0.5;

/**
 * Turns noisy GPS fixes into a steady direction of travel. Small changes are
 * smoothed; a sudden reversal (more than 100 degrees) is ignored until it's
 * seen twice in a row, so one stray fix can't flip the arrow, but a real
 * U-turn still shows within a few seconds.
 */
export function createHeadingFilter() {
  let recent: { t: number; p: LatLng }[] = [];
  let heading: number | undefined;
  let pending: { heading: number; count: number } | undefined;

  /** Direction of the least-squares line through the recent fixes, if they moved enough. */
  function fittedBearing(): number | undefined {
    if (recent.length < 3) return undefined;
    const o = recent[0].p;
    const kx = 111320 * Math.cos((o.lat * Math.PI) / 180);
    const ky = 110540;
    const t0 = recent[0].t;
    let st = 0, sx = 0, sy = 0, stt = 0, stx = 0, sty = 0;
    for (const { t, p } of recent) {
      const tt = (t - t0) / 1000;
      const x = (p.lng - o.lng) * kx;
      const y = (p.lat - o.lat) * ky;
      st += tt; sx += x; sy += y; stt += tt * tt; stx += tt * x; sty += tt * y;
    }
    const n = recent.length;
    const den = n * stt - st * st;
    if (den <= 0) return undefined;
    const vx = (n * stx - st * sx) / den; // m/s east
    const vy = (n * sty - st * sy) / den; // m/s north
    const span = (recent[n - 1].t - t0) / 1000;
    if (Math.hypot(vx, vy) * span < MIN_TRAVEL_M) return undefined; // standing still: keep the last heading
    return ((Math.atan2(vx, vy) * 180) / Math.PI + 360) % 360;
  }

  return {
    /** Feed one GPS fix; returns the direction of travel to show (degrees, 0 = north). */
    update(
      position: LatLng,
      time: number,
      deviceHeading?: number | null,
      speed?: number | null,
    ): number | undefined {
      recent.push({ t: time, p: position });
      recent = recent.filter((r) => time - r.t <= WINDOW_MS);

      const fromDevice =
        deviceHeading != null && deviceHeading >= 0 && !Number.isNaN(deviceHeading) && (speed ?? 0) > DEVICE_HEADING_MIN_SPEED;
      const reading = fromDevice ? deviceHeading! : fittedBearing();
      if (reading === undefined) return heading;
      if (heading === undefined) return (heading = norm(reading));

      const turn = angleDelta(heading, reading);
      if (Math.abs(turn) > REVERSAL_DEG) {
        pending =
          pending && Math.abs(angleDelta(pending.heading, reading)) < 45
            ? { heading: reading, count: pending.count + 1 }
            : { heading: reading, count: 1 };
        if (pending.count >= CONFIRMATIONS) {
          heading = norm(reading);
          pending = undefined;
        }
        return heading;
      }
      pending = undefined;
      return (heading = norm(heading + turn * SMOOTHING));
    },
    reset() {
      recent = [];
      heading = undefined;
      pending = undefined;
    },
  };
}
