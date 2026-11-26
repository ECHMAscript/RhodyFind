// Hand-drawn SVG decorations for Kingston Pizza's menu page. The shop's logo
// is a yellow, red and blue superhero shield and its mascot a flying "pizza
// man", so the page reads like a comic book: halftone dots, starbursts, speed
// lines, a caped flying pizza slice and a night skyline. All original
// drawings (no copy of the shop's logo or mascot), as SVG strings.

import { svg } from './artKit';

const RED = '#E0262B';
const YELLOW = '#FFD23F';
const BLUE = '#1D3FAE';
const INK = '#13237A';

/** One tile of halftone dots; repeats seamlessly. */
export const HALFTONE_TILE = (color: string, opacity = 0.18) =>
  svg(
    '0 0 16 16',
    `<circle cx="4" cy="4" r="2.6" fill="${color}" opacity="${opacity}"/><circle cx="12" cy="12" r="2.6" fill="${color}" opacity="${opacity}"/>`,
    16,
    16,
  );

/** A spiky comic starburst with a shout in the middle. */
export const STARBURST = (text: string, fill = YELLOW, stroke = RED, textColor = RED) => {
  const pts: string[] = [];
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 ? 0.72 : 1;
    pts.push(`${(120 + Math.cos(a) * 116 * r).toFixed(1)},${(80 + Math.sin(a) * 76 * r).toFixed(1)}`);
  }
  return svg(
    '0 0 240 160',
    `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="6" stroke-linejoin="round"/>` +
      `<text x="120" y="92" text-anchor="middle" font-family="Impact, 'Arial Black', 'Helvetica Neue', sans-serif" font-weight="900" font-size="30" fill="${textColor}" transform="rotate(-6 120 80)">${text}</text>`,
  );
};

/** Speed lines bursting out from the middle. */
export const SPEED_LINES = svg(
  '0 0 1200 420',
  Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const x1 = 600 + Math.cos(a) * 170;
    const y1 = 210 + Math.sin(a) * 90;
    const x2 = 600 + Math.cos(a) * 900;
    const y2 = 210 + Math.sin(a) * 500;
    return `<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="${BLUE}" stroke-width="${i % 3 ? 3 : 7}" opacity="0.09"/>`;
  }).join(''),
);

/** A pizza slice flying by with a red cape and speed streaks. */
export const FLYING_PIZZA = svg(
  '0 0 300 170',
  [20, 46, 72]
    .map(
      (y, i) =>
        `<line x1="${10 + i * 14}" y1="${y + 40}" x2="${90 + i * 10}" y2="${y + 40}" stroke="${BLUE}" stroke-width="5" stroke-linecap="round" opacity="0.5"/>`,
    )
    .join('') +
    `<path d="M150 70 C120 40 80 60 60 40 C70 80 100 110 150 104 Z" fill="${RED}" stroke="#9E1418" stroke-width="3" stroke-linejoin="round"/>` +
    `<g transform="rotate(-24 200 90)">` +
    `<path d="M140 60 L270 76 L150 130 Z" fill="#FFC94A" stroke="#C9822F" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M140 60 L150 130 L138 128 L128 62 Z" fill="#D98A3A" stroke="#B06A26" stroke-width="3" stroke-linejoin="round"/>` +
    [
      [178, 82],
      [214, 86],
      [176, 108],
      [236, 80],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${RED}"/>`)
      .join('') +
    `</g>`,
);

/** A five-point star with a comic outline. */
export const STAR = (fill = YELLOW, stroke = RED) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 9 : 20;
    pts.push(`${(22 + Math.cos(a) * r).toFixed(1)},${(23 + Math.sin(a) * r).toFixed(1)}`);
  }
  return svg(
    '0 0 44 44',
    `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`,
  );
};

/** A lightning bolt, for after section titles. */
export const BOLT = svg(
  '0 0 60 40',
  `<path d="M4 22 L30 4 L26 18 L56 14 L22 36 L28 22 Z" fill="${YELLOW}" stroke="${RED}" stroke-width="3" stroke-linejoin="round"/>`,
);

/** A night skyline in comic blue, for the bottom of the page. */
export const SKYLINE = svg(
  '0 0 1200 220',
  `<path d="M0 220 L0 150 L40 150 L40 110 L80 110 L80 160 L120 160 L120 80 L150 80 L150 60 L170 60 L170 80 L200 80 L200 170 L240 170 L240 120 L300 120 L300 150 L340 150 L340 70 L390 70 L390 160 L430 160 L430 100 L470 100 L470 40 L490 40 L490 100 L520 100 L520 170 L580 170 L580 130 L640 130 L640 90 L680 90 L680 150 L720 150 L720 60 L770 60 L770 160 L820 160 L820 110 L860 110 L860 140 L900 140 L900 80 L950 80 L950 170 L990 170 L990 120 L1040 120 L1040 70 L1060 70 L1060 120 L1100 120 L1100 150 L1150 150 L1150 100 L1200 100 L1200 220 Z" fill="${INK}" opacity="0.14"/>` +
    Array.from({ length: 26 }, (_, i) => {
      const x = 130 + ((i * 173) % 1000);
      const y = 120 + ((i * 37) % 60);
      return `<rect x="${x}" y="${y}" width="6" height="8" fill="${YELLOW}" opacity="0.5"/>`;
    }).join(''),
);

/** A comic-strip band: yellow with a red zigzag edge; repeats seamlessly. */
export const ZIGZAG_TILE = svg(
  '0 0 40 26',
  `<rect y="8" width="40" height="18" fill="${YELLOW}" opacity="0.75"/>` +
    `<path d="M0 10 L10 2 L20 10 L30 2 L40 10" fill="none" stroke="${RED}" stroke-width="3" stroke-linejoin="round" opacity="0.8"/>` +
    `<circle cx="10" cy="18" r="2" fill="${RED}" opacity="0.35"/><circle cx="30" cy="18" r="2" fill="${RED}" opacity="0.35"/>`,
  40,
  26,
);
