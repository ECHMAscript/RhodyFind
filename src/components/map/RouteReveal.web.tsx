import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { angleDelta } from '@/lib/heading';
import type { LatLng, TravelMode } from '@/lib/geo';
import { MOVERS, pose } from './movers';

/**
 * When a new route appears, it isn't just shown: it draws itself from the
 * start to the destination, then a little traveler for the travel mode (a
 * sprinter, skater, cyclist, car or shuttle) races along it, easing off at
 * each corner, with the route behind it dimmed. Then the traveler fades and
 * the route settles at full strength.
 *
 * Motion after a CC0 ride-hailing demo (aicssanimations.com): the line draws
 * by dash offset over 1.2 s on cubic-bezier(0.45, 0, 0.2, 1); the traveler
 * slows to 45% at corners, always points along the path, and the route fades
 * to 25% behind it; the destination pin gives off a slow halo every 1.6 s.
 *
 * Everything is computed from elapsed time each frame, so a dropped frame
 * never desyncs the line and the traveler.
 */

// Timeline (ms).
const SETTLE_WAIT = 700; // longest wait for the map to finish framing the route
const DRAW_MS = 1200;
const HOLD_MS = 450;
const FADE_MS = 320;
// The trip, in ms: quick, longer for longer routes.
const tripMs = (meters: number) => Math.min(3400, Math.max(1600, 1300 + meters * 2.2));
// Corners: slow to this share of full speed, starting this many meters out.
const CORNER_SPEED = 0.45;
const CORNER_REACH_M = 9;
// Behind the traveler, the route at this opacity (the demo uses 25% on a dark
// map; our map is light, so a little more keeps it readable).
const TRAIL_OPACITY = 0.35;
// Stride cycles per second at full speed (the runner's legs, the wheels).
const STRIDE_HZ: Record<TravelMode, number> = { walk: 3.4, skate: 1.1, bike: 2.2, drive: 0, shuttle: 0 };

/** cubic-bezier(x1, y1, x2, y2) easing, solved for y at x by Newton steps. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const xt = (t: number) => ((ax * t + bx) * t + cx) * t;
  const yt = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (xt(t) - x) / d;
    }
    return yt(Math.min(1, Math.max(0, t)));
  };
}
const DRAW_EASE = bezier(0.45, 0, 0.2, 1);
const easeOut = bezier(0.22, 1, 0.36, 1);

const M_LAT = 110540;

/**
 * The route resampled every meter, with the time at which the traveler reaches
 * each sample: slower near corners, scaled so the whole trip takes `ms`.
 */
function plan(positions: LatLng[], ms: number) {
  const kx = 111320 * Math.cos((positions[0].lat * Math.PI) / 180);
  const xy = positions.map((p) => [(p.lng - positions[0].lng) * kx, (p.lat - positions[0].lat) * M_LAT]);
  // Resample at 1 m.
  const pts: number[][] = [xy[0]];
  for (let i = 1; i < xy.length; i++) {
    const [ax, ay] = xy[i - 1];
    const [bx, by] = xy[i];
    const len = Math.hypot(bx - ax, by - ay);
    for (let d = 1; d <= len; d++) pts.push([ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len]);
  }
  pts.push(xy[xy.length - 1]);
  const n = pts.length;
  const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  const bearing = (a: number[], b: number[]) => (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
  // How sharply the path turns at each sample, looking 5 m either way (so
  // small kinks in the map data don't count as corners).
  const turn = pts.map((_, i) => Math.abs(angleDelta(bearing(at(i - 5), at(i)), bearing(at(i), at(i + 5)))));
  const speed = pts.map((_, i) => {
    let f = 1;
    for (let j = Math.max(0, i - CORNER_REACH_M); j <= Math.min(n - 1, i + CORNER_REACH_M); j++) {
      const sharp = Math.min(1, turn[j] / 80);
      const near = 1 - Math.abs(i - j) / (CORNER_REACH_M + 1);
      f = Math.min(f, 1 - (1 - CORNER_SPEED) * sharp * near);
    }
    return f;
  });
  // Time to each sample at unit speed, then scaled to the trip length.
  const time = [0];
  for (let i = 1; i < n; i++) time.push(time[i - 1] + 1 / ((speed[i - 1] + speed[i]) / 2));
  const scale = ms / time[n - 1];
  for (let i = 0; i < n; i++) time[i] *= scale;
  const toLatLng = (p: number[]): L.LatLngTuple => [positions[0].lat + p[1] / M_LAT, positions[0].lng + p[0] / kx];
  return { pts, time, speed, n, toLatLng, at, bearing };
}

function lengthMeters(positions: LatLng[]) {
  let m = 0;
  const kx = 111320 * Math.cos((positions[0].lat * Math.PI) / 180);
  for (let i = 1; i < positions.length; i++) {
    m += Math.hypot((positions[i].lng - positions[i - 1].lng) * kx, (positions[i].lat - positions[i - 1].lat) * M_LAT);
  }
  return m;
}

const HALO_CSS = `@keyframes rf-halo{0%{transform:scale(.35);opacity:.55}100%{transform:scale(2.6);opacity:0}}
.rf-halo{position:absolute;inset:0;border-radius:50%;background:#1F5FD1;animation:rf-halo 1.6s cubic-bezier(.22,1,.36,1) infinite}
@media (prefers-reduced-motion: reduce){.rf-halo{animation:none;opacity:0}}`;
function ensureHaloCss() {
  if (typeof document === 'undefined' || document.getElementById('rf-halo-css')) return;
  const style = document.createElement('style');
  style.id = 'rf-halo-css';
  style.textContent = HALO_CSS;
  document.head.appendChild(style);
}

export function RouteReveal({
  positions,
  mode,
  style,
  destination,
  onActiveChange,
}: {
  /** The route to reveal; a new array (a new route) starts a new reveal. */
  positions: L.LatLngTuple[];
  mode: TravelMode;
  /** The route line's look, so the reveal matches it exactly. */
  style: L.PathOptions;
  destination?: L.LatLngTuple;
  /** True while the reveal draws its own line (the page hides the real one meanwhile). */
  onActiveChange: (active: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    ensureHaloCss();

    const latlngs = positions.map(([lat, lng]) => ({ lat, lng }));
    const meters = lengthMeters(latlngs);
    if (meters < 5) return;
    const trip = tripMs(meters);
    const route = plan(latlngs, trip);
    const mover = MOVERS[mode];
    const strideHz = STRIDE_HZ[mode];

    // The reveal's own layers: a dim copy for behind the traveler, and the
    // bright line that draws in, then shows only what's still ahead.
    const base = L.polyline(positions, { ...style, opacity: 0, interactive: false }).addTo(map);
    const bright = L.polyline(positions, { ...style, interactive: false }).addTo(map);
    const brightEl = bright.getElement() as SVGPathElement | undefined;
    const baseEl = base.getElement() as SVGPathElement | undefined;
    if (brightEl) brightEl.style.strokeDasharray = '0 100000';

    const icon = L.divIcon({
      className: '',
      iconSize: [mover.width, mover.height],
      iconAnchor: [mover.width / 2, mover.topDown ? mover.height / 2 : mover.height - 4],
      html: `<div class="rf-mover" style="width:${mover.width}px;height:${mover.height}px;opacity:0;transition:none;will-change:transform">${mover.svg}</div>`,
    });
    const traveler = L.marker(positions[0], { icon, interactive: false, keyboard: false, zIndexOffset: 1500 }).addTo(map);
    const halo = destination
      ? L.marker(destination, {
          icon: L.divIcon({ className: '', iconSize: [34, 34], iconAnchor: [17, 17], html: '<div style="position:relative;width:34px;height:34px"><div class="rf-halo"></div></div>' }),
          interactive: false,
          keyboard: false,
          zIndexOffset: 900,
        }).addTo(map)
      : undefined;
    onActiveChange(true);

    let raf = 0;
    let start = 0;
    let facing = 1; // side views: 1 = right, -1 = left
    let phase = 0;
    let lastNow = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      onActiveChange(false);
      // Let the real line paint under ours before ours goes.
      requestAnimationFrame(() => {
        base.remove();
        bright.remove();
        traveler.remove();
        halo?.remove();
      });
    };

    const frame = (now: number) => {
      if (!start) start = now;
      const t = now - start;
      const dt = lastNow ? Math.min(50, now - lastNow) : 16;
      lastNow = now;
      const len = brightEl?.getTotalLength?.() ?? 0;
      const el = traveler.getElement()?.querySelector<HTMLElement>('.rf-mover');

      if (t < DRAW_MS) {
        // 1. The line draws from the start to the destination; the traveler appears at the start.
        const drawn = len * DRAW_EASE(t / DRAW_MS);
        if (brightEl) brightEl.style.strokeDasharray = `${drawn} ${len + 1}`;
        if (el) {
          el.style.opacity = String(easeOut(Math.min(1, t / 300)));
          placeTraveler(el, 0, dt, 0);
        }
      } else if (t < DRAW_MS + trip) {
        // 2. The traveler races to the end; behind it the route dims to 25%.
        const tt = t - DRAW_MS;
        let i = 0;
        let lo = 0;
        let hi = route.n - 1;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (route.time[mid] <= tt) lo = mid;
          else hi = mid - 1;
        }
        i = lo;
        const frac = i < route.n - 1 ? (tt - route.time[i]) / Math.max(1e-6, route.time[i + 1] - route.time[i]) : 0;
        const s = Math.min(route.n - 1, i + frac);
        const done01 = s / (route.n - 1);
        if (baseEl) baseEl.style.opacity = String(TRAIL_OPACITY * (style.opacity ?? 1));
        if (brightEl) brightEl.style.strokeDasharray = `0 ${len * done01} ${len + 1}`;
        if (el) {
          el.style.opacity = '1';
          placeTraveler(el, s, dt, route.speed[Math.round(s)]);
        }
      } else if (t < DRAW_MS + trip + HOLD_MS + FADE_MS) {
        // 3. Arrived: hold, then the traveler fades and the route comes back to full.
        const k = Math.max(0, (t - DRAW_MS - trip - HOLD_MS) / FADE_MS);
        if (brightEl) brightEl.style.strokeDasharray = `0 ${len + 1}`;
        if (baseEl) baseEl.style.opacity = String((TRAIL_OPACITY + (1 - TRAIL_OPACITY) * easeOut(k)) * (style.opacity ?? 1));
        if (el) {
          el.style.opacity = String(1 - easeOut(k));
          placeTraveler(el, route.n - 1, dt, 0);
        }
      } else {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    function placeTraveler(el: HTMLElement, s: number, dt: number, speed: number) {
      const i = Math.floor(s);
      const a = route.at(i);
      const b = route.at(i + 1);
      const f = s - i;
      const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      traveler.setLatLng(route.toLatLng(p));
      // Direction along the path, looking a few meters each way.
      const dir = route.bearing(route.at(i - 3), route.at(i + 4));
      if (mover.topDown) {
        el.style.transform = `rotate(${dir.toFixed(1)}deg)`;
      } else {
        const dx = route.at(i + 4)[0] - route.at(i - 3)[0];
        if (Math.abs(dx) > 1.5) facing = dx >= 0 ? 1 : -1;
        el.style.transform = `scaleX(${facing})`;
        phase += (dt / 1000) * 2 * Math.PI * strideHz * Math.max(0.35, speed);
        pose(el, mode, phase);
      }
    }

    // Start once the map has finished framing the new route (or soon, if it doesn't move).
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      map.off('moveend', go);
      raf = requestAnimationFrame(frame);
    };
    map.on('moveend', go);
    const timer = setTimeout(go, SETTLE_WAIT);

    return () => {
      clearTimeout(timer);
      map.off('moveend', go);
      cancelAnimationFrame(raf);
      if (!done) {
        done = true;
        onActiveChange(false);
      }
      base.remove();
      bright.remove();
      traveler.remove();
      halo?.remove();
    };
    // A new route (a new positions array) or a new mode restarts the reveal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, mode, map]);

  return null;
}
