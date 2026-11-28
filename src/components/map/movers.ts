import type { TravelMode } from '@/lib/geo';

/**
 * The little traveler that races along a new route (RouteReveal.web.tsx),
 * one per travel mode, as inline SVG. Car and shuttle are seen from above and
 * turn to point along the road; the runner, skater and cyclist are side views
 * that face the way they're heading, with limbs posed every frame.
 *
 * All original drawings. Parts that move carry a data-part attribute and are
 * posed by `pose()`, which only sets transforms (no re-rendering).
 */
export type Mover = {
  /** SVG markup, drawn facing up (top-down) or right (side view). */
  svg: string;
  width: number;
  height: number;
  /** Top-down movers rotate to the road; side views flip left/right instead. */
  topDown: boolean;
};

const INK = '#13213F';
const SKIN = '#F2C7A5';
const SHIRT = '#1F5FD1';
const SHORTS = '#13213F';

const limb = (x1: number, y1: number, x2: number, y2: number, w: number, color: string) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;

/** A sprinter, leaning into the run. Hips at (24, 27), shoulders at (27, 15). */
const RUNNER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="44" height="44">
  <ellipse cx="24" cy="45" rx="11" ry="2.2" fill="rgba(0,0,0,0.18)"/>
  <g data-part="legBack">${limb(24, 27, 24, 36, 4.6, SHORTS)}<g data-part="shinBack">${limb(24, 36, 24, 44, 3.6, SKIN)}${limb(24, 44, 28, 44, 3.4, INK)}</g></g>
  <g data-part="armBack">${limb(27, 16, 27, 23, 3.4, SHIRT)}<g data-part="foreBack">${limb(27, 23, 27, 29, 3, SKIN)}</g></g>
  <path d="M22 28 L25 14 Q28 12 30 15 L27 29 Z" fill="${SHIRT}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="30" cy="9" r="4.6" fill="${SKIN}" stroke="${INK}" stroke-width="0.8"/>
  <path d="M25.6 8 Q27 3.6 31.6 4.4 Q34.6 5.4 34 8 Q30.6 6.2 25.6 8 Z" fill="${INK}"/>
  <g data-part="legFront">${limb(24, 27, 24, 36, 4.6, SHORTS)}<g data-part="shinFront">${limb(24, 36, 24, 44, 3.6, SKIN)}${limb(24, 44, 28, 44, 3.4, '#E0262B')}</g></g>
  <g data-part="armFront">${limb(27, 16, 27, 23, 3.4, SHIRT)}<g data-part="foreFront">${limb(27, 23, 27, 29, 3, SKIN)}</g></g>
</svg>`;

/** A skateboarder in a low stance, back foot kicking. */
const SKATER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 48" width="46" height="44">
  <ellipse cx="26" cy="46" rx="14" ry="2" fill="rgba(0,0,0,0.18)"/>
  <g data-part="board">
    <path d="M8 39 Q10 41.5 13 41.5 L39 41.5 Q42 41.5 44 39" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="15" cy="44" r="2.2" fill="#FFD23F" stroke="${INK}" stroke-width="0.8"/>
    <circle cx="37" cy="44" r="2.2" fill="#FFD23F" stroke="${INK}" stroke-width="0.8"/>
  </g>
  <g data-part="legBack">${limb(25, 26, 20, 33, 4.4, SHORTS)}<g data-part="shinBack">${limb(20, 33, 18, 40, 3.6, SKIN)}</g></g>
  ${limb(27, 26, 32, 33, 4.4, SHORTS)}${limb(32, 33, 33, 40, 3.6, SKIN)}
  <path d="M23 27 L25 14 Q28 12 30 15 L29 28 Z" fill="#E0262B" stroke="${INK}" stroke-width="0.8"/>
  <g data-part="armBack">${limb(27, 16, 20, 21, 3.2, '#E0262B')}</g>
  <g data-part="armFront">${limb(28, 16, 35, 20, 3.2, '#E0262B')}</g>
  <circle cx="29" cy="9" r="4.6" fill="${SKIN}" stroke="${INK}" stroke-width="0.8"/>
  <path d="M24 8.6 Q25 3 30.4 3.4 Q34.6 4.4 34 8.4 Z" fill="${INK}"/>
  <path d="M33 7.6 L37 8.4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

/** A cyclist: wheels and cranks turn as they ride. */
const CYCLIST = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 48" width="50" height="44">
  <ellipse cx="28" cy="46" rx="18" ry="2" fill="rgba(0,0,0,0.16)"/>
  <g data-part="wheelBack"><circle cx="13" cy="37" r="8" fill="none" stroke="${INK}" stroke-width="2.2"/>${limb(13, 29, 13, 45, 0.9, INK)}${limb(5, 37, 21, 37, 0.9, INK)}</g>
  <g data-part="wheelFront"><circle cx="43" cy="37" r="8" fill="none" stroke="${INK}" stroke-width="2.2"/>${limb(43, 29, 43, 45, 0.9, INK)}${limb(35, 37, 51, 37, 0.9, INK)}</g>
  <path d="M13 37 L26 37 L36 24 L22 24 Z M26 37 L22 22 M36 24 L43 37 M34 20 L38 20" fill="none" stroke="#E0262B" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M20 22 L25 22" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <g data-part="crank">${limb(26, 37, 26, 32, 2, INK)}${limb(26, 37, 26, 42, 2, INK)}</g>
  <g data-part="legBack">${limb(23, 21, 29, 30, 4, SHORTS)}<g data-part="shinBack">${limb(29, 30, 26, 37, 3.4, SKIN)}</g></g>
  <path d="M21 22 L29 11 Q32 10 33 13 L26 23 Z" fill="${SHIRT}" stroke="${INK}" stroke-width="0.8"/>
  ${limb(31, 13, 37, 20, 3.2, SHIRT)}
  <g data-part="legFront">${limb(23, 21, 29, 30, 4, SHORTS)}<g data-part="shinFront">${limb(29, 30, 26, 37, 3.4, SKIN)}</g></g>
  <circle cx="34" cy="7.6" r="4.4" fill="${SKIN}" stroke="${INK}" stroke-width="0.8"/>
  <path d="M29.4 7 Q30 2.4 35 2.6 Q39 3.4 38.6 6.8 Z" fill="${SHIRT}" stroke="${INK}" stroke-width="0.8"/>
</svg>`;

/** A white hatchback from above, nose up. */
const CAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 48" width="22" height="41">
  <rect x="2" y="3" width="22" height="43" rx="7" fill="rgba(0,0,0,0.22)" transform="translate(1.2 1.6)"/>
  <rect x="2" y="2" width="22" height="43" rx="7" fill="#FFFFFF" stroke="#9AA6C0" stroke-width="1"/>
  <path d="M5 13 Q13 9 21 13 L20 19 Q13 17 6 19 Z" fill="${INK}"/>
  <path d="M6 33 Q13 35 20 33 L21 38 Q13 41 5 38 Z" fill="${INK}"/>
  <rect x="6" y="20" width="14" height="12" rx="2.5" fill="#E9EEF7"/>
  <rect x="4" y="2.6" width="5" height="2.4" rx="1" fill="#FFF3B0"/><rect x="17" y="2.6" width="5" height="2.4" rx="1" fill="#FFF3B0"/>
  <rect x="4" y="42.4" width="5" height="2.2" rx="1" fill="#E0262B"/><rect x="17" y="42.4" width="5" height="2.2" rx="1" fill="#E0262B"/>
</svg>`;

/** A campus shuttle bus from above, nose up. */
const SHUTTLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 64" width="24" height="55">
  <rect x="2" y="3" width="24" height="59" rx="5" fill="rgba(0,0,0,0.22)" transform="translate(1.2 1.6)"/>
  <rect x="2" y="2" width="24" height="59" rx="5" fill="#1F5FD1" stroke="#0E3A8A" stroke-width="1"/>
  <rect x="5" y="9" width="18" height="47" rx="3" fill="#F4F7FC"/>
  <path d="M4.5 4 Q14 1.6 23.5 4 L22.5 8.4 Q14 7 5.5 8.4 Z" fill="${INK}"/>
  ${[16, 26, 36, 46].map((y) => `<rect x="9" y="${y}" width="10" height="5" rx="1.2" fill="#C9D6EE"/>`).join('')}
  <rect x="3.6" y="58" width="5" height="2" rx="1" fill="#E0262B"/><rect x="19.4" y="58" width="5" height="2" rx="1" fill="#E0262B"/>
</svg>`;

export const MOVERS: Record<TravelMode, Mover> = {
  walk: { svg: RUNNER, width: 44, height: 44, topDown: false },
  skate: { svg: SKATER, width: 46, height: 44, topDown: false },
  bike: { svg: CYCLIST, width: 50, height: 44, topDown: false },
  drive: { svg: CAR, width: 22, height: 41, topDown: true },
  shuttle: { svg: SHUTTLE, width: 24, height: 55, topDown: true },
};

const rot = (el: Element | null, deg: number, cx: number, cy: number) => el?.setAttribute('transform', `rotate(${deg.toFixed(1)} ${cx} ${cy})`);

/** Poses the mover's moving parts for a stride phase (radians). */
export function pose(root: Element, mode: TravelMode, phase: number) {
  const q = (name: string) => root.querySelector(`[data-part="${name}"]`);
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  switch (mode) {
    case 'walk': {
      // Thighs swing ±40°, knees fold most on the back-swing, arms counter-swing.
      rot(q('legFront'), 40 * s, 24, 27);
      rot(q('legBack'), -40 * s, 24, 27);
      rot(q('shinFront'), 10 + 55 * Math.max(0, -s), 24, 36);
      rot(q('shinBack'), 10 + 55 * Math.max(0, s), 24, 36);
      rot(q('armFront'), -45 * s, 27, 16);
      rot(q('armBack'), 45 * s, 27, 16);
      rot(q('foreFront'), -70, 27, 23);
      rot(q('foreBack'), -70, 27, 23);
      root.querySelector('svg')?.setAttribute('style', `transform: translateY(${(-1.5 * Math.abs(c)).toFixed(2)}px)`);
      break;
    }
    case 'skate': {
      // One push every cycle: the back leg kicks down and back, then glides.
      const kick = Math.max(0, s);
      rot(q('legBack'), 25 * kick, 25, 26);
      rot(q('shinBack'), -20 * kick, 20, 33);
      rot(q('armBack'), -15 * s, 27, 16);
      rot(q('armFront'), 12 * s, 28, 16);
      break;
    }
    case 'bike': {
      const deg = (phase * 180) / Math.PI;
      rot(q('wheelBack'), deg * 2, 13, 37);
      rot(q('wheelFront'), deg * 2, 43, 37);
      rot(q('crank'), deg, 26, 37);
      rot(q('legFront'), 14 * s, 23, 21);
      rot(q('legBack'), -14 * s, 23, 21);
      rot(q('shinFront'), 18 * c, 29, 30);
      rot(q('shinBack'), -18 * c, 29, 30);
      break;
    }
    default:
      break;
  }
}
