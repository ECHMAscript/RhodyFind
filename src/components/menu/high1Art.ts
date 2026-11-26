// Hand-drawn SVG decorations for High 1's menu page, after the shop itself: a
// coral pizza-slice sign ("love at first slice"), string lights and woven
// pendant lamps inside, gelato, and a giraffe mascot (shown here only as a
// spot pattern). All original drawings, as SVG strings.

import { svg } from './artKit';

const CORAL = '#E5553D';

/** A point on a quadratic curve. */
const quad = (t: number, a: number[], c: number[], b: number[]) => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1],
];

/** Café string lights sagging across the top in two swags, with warm bulbs. */
export const STRING_LIGHTS = (() => {
  const swags = [
    [
      [0, 14],
      [300, 120],
      [600, 30],
    ],
    [
      [600, 30],
      [900, 120],
      [1200, 14],
    ],
  ];
  let wire = '';
  let bulbs = '';
  for (const [a, c, b] of swags) {
    wire += `<path d="M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}" fill="none" stroke="#4A3B2E" stroke-width="2.5"/>`;
    for (let i = 1; i < 8; i++) {
      const [x, y] = quad(i / 8, a, c, b);
      bulbs +=
        `<circle cx="${x}" cy="${y + 16}" r="15" fill="#FFD98A" opacity="0.28"/>` +
        `<rect x="${x - 3.5}" y="${y}" width="7" height="7" rx="1.5" fill="#4A3B2E"/>` +
        `<ellipse cx="${x}" cy="${y + 14}" rx="6" ry="8" fill="#FFE3A3" stroke="#F2B84B" stroke-width="1.5"/>`;
    }
  }
  return svg('0 0 1200 150', wire + bulbs);
})();

/** A woven (rattan) pendant lamp on a cord, glowing underneath. */
export const WICKER_LAMP = svg(
  '0 0 140 220',
  `<line x1="70" y1="0" x2="70" y2="88" stroke="#3A2E25" stroke-width="2.5"/>` +
    `<ellipse cx="70" cy="196" rx="58" ry="16" fill="#FFD98A" opacity="0.35"/>` +
    `<path d="M22 150 Q22 92 70 88 Q118 92 118 150 Z" fill="#D9A15F"/>` +
    Array.from(
      { length: 6 },
      (_, i) =>
        `<path d="M${26 + i * 2} ${142 - i * 9} Q70 ${130 - i * 9} ${114 - i * 2} ${142 - i * 9}" fill="none" stroke="#A86F35" stroke-width="2"/>`,
    ).join('') +
    Array.from(
      { length: 9 },
      (_, i) => `<line x1="${30 + i * 10}" y1="${150}" x2="${54 + i * 4}" y2="${94}" stroke="#B97E40" stroke-width="1.3" opacity="0.8"/>`,
    ).join('') +
    `<path d="M22 150 L118 150" stroke="#8A5627" stroke-width="3"/>` +
    `<ellipse cx="70" cy="153" rx="26" ry="6" fill="#FFE7AE"/>`,
);

/** A pizza slice: golden crust, melted cheese, pepperoni. */
export const SLICE = svg(
  '0 0 100 110',
  `<path d="M8 18 Q50 2 92 18 L50 106 Z" fill="#F7C65A" stroke="#C9822F" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M8 18 Q50 2 92 18 L88 27 Q50 13 12 27 Z" fill="#D98A3A"/>` +
    `<path d="M30 46 q4 10 -2 18 M66 52 q-3 9 3 15" fill="none" stroke="#F9DD8E" stroke-width="4" stroke-linecap="round"/>` +
    [
      [38, 38],
      [60, 36],
      [48, 60],
      [52, 82],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="${CORAL}"/><circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#F48B72"/>`)
      .join(''),
);

/** Two scoops of gelato in a waffle cone, with a cherry. */
export const GELATO = svg(
  '0 0 90 140',
  `<path d="M20 64 L45 136 L70 64 Z" fill="#E2A55B" stroke="#B9782F" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M28 70 L56 120 M40 66 L62 104 M52 66 L66 84 M62 70 L34 120 M50 66 L28 104 M38 66 L24 84" stroke="#B9782F" stroke-width="1.6"/>` +
    `<circle cx="45" cy="52" r="24" fill="#A8E0C4"/>` +
    `<path d="M21 58 q8 8 16 0 q8 8 16 0 q8 8 16 0" fill="#A8E0C4" stroke="#7CC6A3" stroke-width="2"/>` +
    `<circle cx="45" cy="30" r="20" fill="#F7A1B5"/>` +
    `<path d="M25 36 q7 7 13 0 q7 7 14 0 q7 7 13 0" fill="#F7A1B5" stroke="#EE7F9A" stroke-width="2"/>` +
    `<path d="M45 12 q4 -8 10 -10" fill="none" stroke="#5B3A2A" stroke-width="2"/>` +
    `<circle cx="45" cy="13" r="6" fill="#D7263D"/>`,
);

/** One tile of giraffe spots: rounded brown patches on tan; repeats seamlessly. */
export const GIRAFFE_TILE = svg(
  '0 0 120 80',
  `<rect width="120" height="80" fill="#F7E4C4"/>` +
    [
      'M6 6 L30 4 L36 22 L22 34 L4 28 Z',
      'M44 4 L72 6 L76 26 L56 34 L40 22 Z',
      'M86 4 L114 6 L116 30 L96 34 L82 20 Z',
      'M4 40 L24 40 L34 56 L26 76 L4 74 Z',
      'M42 42 L66 40 L76 60 L64 76 L40 72 L36 56 Z',
      'M84 42 L112 40 L116 62 L104 76 L82 72 L78 56 Z',
    ]
      .map((d) => `<path d="${d}" fill="#C98A4B" stroke="#B5763A" stroke-width="2" stroke-linejoin="round"/>`)
      .join(''),
  120,
  80,
);

/** A few large, soft giraffe spots for the page background. */
export const BIG_SPOTS = svg(
  '0 0 600 400',
  [
    'M40 60 L150 40 L180 120 L120 180 L30 150 Z',
    'M420 30 L540 50 L560 150 L470 190 L400 120 Z',
    'M230 250 L350 230 L390 320 L300 380 L210 340 Z',
    'M480 270 L580 260 L600 360 L520 400 L460 340 Z',
  ]
    .map((d) => `<path d="${d}" fill="#E7B98A" opacity="0.35" stroke-linejoin="round"/>`)
    .join(''),
);

/** A short coral brush underline for section titles. */
export const CORAL_FLICK = svg('0 0 120 30', `<path d="M2 22 C40 10 82 8 118 10 C88 16 52 22 14 28 C8 29 3 27 2 22 Z" fill="${CORAL}"/>`);
