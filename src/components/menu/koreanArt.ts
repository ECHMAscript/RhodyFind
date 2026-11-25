// Hand-drawn SVG decorations for the Korean-themed menu page (Taste of Korea):
// cherry blossoms, a hanok roofline, a lantern, layered mountains, a city
// tower on a hill, cheonghaepa (wave) tiles, cloud scrolls, a lattice corner,
// a taegeuk circle and brush strokes. All original drawings, as SVG strings.

const svg = (viewBox: string, body: string, w?: number, h?: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${w ? ` width="${w}" height="${h}"` : ''}>${body}</svg>`;

export const svgUri = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

/** A five-petal blossom centered at (x, y). */
function blossom(x: number, y: number, r: number, rot = 0, fill = '#F6B7C8') {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = rot + i * 72;
    petals += `<ellipse cx="0" cy="${-r * 0.55}" rx="${r * 0.42}" ry="${r * 0.55}" transform="rotate(${a})" fill="${fill}" stroke="#E68AA6" stroke-width="${r * 0.05}"/>`;
  }
  return (
    `<g transform="translate(${x} ${y})">${petals}` +
    `<circle r="${r * 0.22}" fill="#F7E3A1"/>` +
    [0, 72, 144, 216, 288]
      .map((a) => `<circle cx="0" cy="${-r * 0.3}" r="${r * 0.05}" fill="#C2185B" transform="rotate(${a + 36})"/>`)
      .join('') +
    `</g>`
  );
}
const bud = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#F08FAE"/>`;

/** Cherry blossom branch reaching in from the top-left corner. */
export const CHERRY_BRANCH = svg(
  '0 0 320 240',
  `<g fill="none" stroke="#5B3A3A" stroke-linecap="round">` +
    `<path d="M-10 20 C40 30 80 50 120 90 S190 150 250 160" stroke-width="7"/>` +
    `<path d="M70 48 C80 20 100 10 125 4" stroke-width="4"/>` +
    `<path d="M120 90 C125 120 120 150 105 180" stroke-width="4"/>` +
    `<path d="M190 140 C210 120 235 112 262 112" stroke-width="3.5"/>` +
    `<path d="M250 160 C270 168 290 185 300 205" stroke-width="3"/>` +
    `</g>` +
    blossom(122, 8, 15, 10) +
    blossom(92, 48, 18, 30) +
    blossom(140, 104, 17, 5) +
    blossom(104, 176, 15, 40) +
    blossom(196, 140, 16, 20) +
    blossom(262, 110, 14, 50) +
    blossom(252, 160, 18, 15) +
    blossom(300, 204, 13, 0) +
    blossom(40, 32, 14, 60) +
    bud(160, 128, 5) +
    bud(222, 124, 4.5) +
    bud(118, 150, 4) +
    bud(282, 190, 4.5) +
    bud(66, 30, 4),
);

/** A small sprig of blossoms, for card corners. */
export const CHERRY_SPRIG = svg(
  '0 0 120 90',
  `<path d="M120 4 C90 20 70 40 52 70" fill="none" stroke="#5B3A3A" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M88 26 C70 22 55 26 40 34" fill="none" stroke="#5B3A3A" stroke-width="2.2" stroke-linecap="round"/>` +
    blossom(52, 70, 11, 20) +
    blossom(40, 34, 10, 0) +
    blossom(96, 20, 10, 40) +
    blossom(72, 46, 8, 10) +
    bud(112, 10, 3.5) +
    bud(26, 40, 3),
);

/** A hanok (traditional Korean building): two curved-eave roofs over a lattice front. */
export const HANOK = svg(
  '0 0 640 340',
  `<defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55648F"/><stop offset="1" stop-color="#8E9ABD"/></linearGradient></defs>` +
    // upper roof
    `<path d="M140 92 Q320 40 500 92 Q560 104 600 88 Q585 112 540 120 L100 120 Q55 112 40 88 Q80 104 140 92 Z" fill="url(#r)"/>` +
    `<path d="M150 92 Q320 52 490 92" fill="none" stroke="#3E4C78" stroke-width="3"/>` +
    // upper wall
    `<rect x="170" y="120" width="300" height="46" fill="#C9CFE2"/>` +
    Array.from(
      { length: 9 },
      (_, i) => `<rect x="${180 + i * 32}" y="126" width="24" height="34" fill="none" stroke="#7C88AE" stroke-width="2"/>`,
    ).join('') +
    // lower roof
    `<path d="M60 186 Q320 140 580 186 Q620 194 640 182 Q628 206 590 214 L50 214 Q12 206 0 182 Q20 194 60 186 Z" fill="url(#r)"/>` +
    // lower front: posts and lattice doors
    `<rect x="70" y="214" width="500" height="126" fill="#D7DCEA"/>` +
    Array.from({ length: 7 }, (_, i) => `<rect x="${70 + i * 80}" y="214" width="12" height="126" fill="#8F5C4E"/>`).join('') +
    Array.from({ length: 6 }, (_, i) => {
      const x = 90 + i * 80;
      let g = `<rect x="${x}" y="232" width="56" height="92" fill="#EEF0F6" stroke="#7C88AE" stroke-width="2"/>`;
      for (let k = 1; k < 4; k++)
        g += `<line x1="${x + k * 14}" y1="232" x2="${x + k * 14}" y2="324" stroke="#7C88AE" stroke-width="1.4"/>`;
      for (let k = 1; k < 6; k++)
        g += `<line x1="${x}" y1="${232 + k * 15.3}" x2="${x + 56}" y2="${232 + k * 15.3}" stroke="#7C88AE" stroke-width="1.4"/>`;
      return g;
    }).join('') +
    `<rect x="70" y="214" width="500" height="10" fill="#B3474A" opacity="0.8"/>`,
);

/** A red silk lantern on a cord, with gold ribs and a tassel. */
export const LANTERN = svg(
  '0 0 90 260',
  `<line x1="45" y1="0" x2="45" y2="48" stroke="#3A2A2A" stroke-width="3"/>` +
    `<rect x="28" y="46" width="34" height="12" rx="3" fill="#2E2A3A"/>` +
    `<path d="M18 62 Q45 52 72 62 Q86 110 72 160 Q45 170 18 160 Q4 110 18 62 Z" fill="#D7263D"/>` +
    `<path d="M18 62 Q45 52 72 62 Q86 110 72 160 Q45 170 18 160 Q4 110 18 62 Z" fill="none" stroke="#8E1424" stroke-width="2"/>` +
    [30, 45, 60]
      .map((x) => `<path d="M${x} 58 Q${x + (x - 45) * 0.9} 110 ${x} 164" fill="none" stroke="#F2C14E" stroke-width="2"/>`)
      .join('') +
    `<ellipse cx="45" cy="110" rx="16" ry="20" fill="#F6E2A0" opacity="0.45"/>` +
    `<rect x="28" y="160" width="34" height="12" rx="3" fill="#2E2A3A"/>` +
    `<line x1="45" y1="172" x2="45" y2="190" stroke="#B3202F" stroke-width="3"/>` +
    `<path d="M37 190 L53 190 L57 252 L33 252 Z" fill="#C8102E"/>` +
    Array.from(
      { length: 5 },
      (_, i) => `<line x1="${37 + i * 4}" y1="196" x2="${35 + i * 5}" y2="252" stroke="#8E1424" stroke-width="1"/>`,
    ).join(''),
);

/** Three misty ridges, back to front. */
export const MOUNTAINS = svg(
  '0 0 1200 320',
  `<path d="M0 220 L90 150 L170 190 L280 90 L380 170 L470 120 L560 180 L640 140 L760 200 L860 110 L980 190 L1080 140 L1200 180 L1200 320 L0 320 Z" fill="#C9CDE3" opacity="0.55"/>` +
    `<path d="M0 260 L120 190 L230 240 L330 170 L450 240 L560 200 L700 260 L820 190 L940 250 L1060 200 L1200 240 L1200 320 L0 320 Z" fill="#B6BBD8" opacity="0.6"/>` +
    `<path d="M0 300 L150 250 L300 290 L420 250 L600 300 L760 260 L900 300 L1050 265 L1200 295 L1200 320 L0 320 Z" fill="#A6ACCD" opacity="0.6"/>`,
);

/** A broadcast tower on a forested hill. */
export const TOWER = svg(
  '0 0 160 420',
  `<path d="M0 420 Q30 340 80 330 Q130 340 160 420 Z" fill="#A6ACCD" opacity="0.75"/>` +
    `<rect x="76" y="20" width="8" height="60" fill="#8F96BC"/>` +
    `<rect x="70" y="80" width="20" height="14" rx="3" fill="#8F96BC"/>` +
    `<path d="M60 94 L100 94 L96 128 L64 128 Z" fill="#8F96BC"/>` +
    `<rect x="72" y="128" width="16" height="206" fill="#8F96BC"/>` +
    `<rect x="66" y="180" width="28" height="10" fill="#8F96BC"/>`,
);

/** One tile of the cheonghaepa (blue-sea wave) pattern; repeats seamlessly. */
export const WAVE_TILE = svg(
  '0 0 48 24',
  ['0 24', '48 24', '24 12', '0 0', '48 0']
    .map((c) => {
      const [x, y] = c.split(' ').map(Number);
      return [22, 17, 12, 7]
        .map((r, i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i === 0 ? '#F4F5FA' : 'none'}" stroke="#AEB5D3" stroke-width="1.6"/>`)
        .join('');
    })
    .join(''),
  48,
  24,
);

/** A curling cloud scroll (gureummunui). */
export const CLOUD = (stroke: string) =>
  svg(
    '0 0 140 70',
    `<g fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round">` +
      `<path d="M10 58 L120 58"/>` +
      `<path d="M30 58 C10 58 10 30 30 30 C42 30 46 44 36 48 C30 50 26 44 30 40"/>` +
      `<path d="M58 58 C40 58 42 18 70 16 C96 14 104 46 86 50 C76 52 72 40 80 36"/>` +
      `<path d="M104 58 C120 58 132 48 128 38 C124 30 112 32 112 40"/>` +
      `</g>`,
  );

/** A stepped lattice (key-pattern) corner, as on a carved window frame. */
export const LATTICE_CORNER = (stroke: string) =>
  svg(
    '0 0 90 90',
    `<g fill="none" stroke="${stroke}" stroke-width="3">` +
      `<path d="M4 86 L4 4 L86 4"/>` +
      `<path d="M14 70 L14 14 L70 14"/>` +
      `<path d="M14 40 L40 40 L40 14"/>` +
      `<path d="M24 40 L24 24 L40 24"/>` +
      `<path d="M14 56 L28 56 L28 70"/>` +
      `<path d="M56 14 L56 28 L70 28"/>` +
      `</g>`,
  );

/** The taegeuk: red above, blue below, divided by an S-curve. */
export const TAEGEUK = svg(
  '-50 -50 100 100',
  `<circle r="48" fill="#0047A0"/>` +
    `<path d="M-48 0 A48 48 0 0 1 48 0 A24 24 0 0 1 0 0 A24 24 0 0 0 -48 0 Z" fill="#CD2E3A"/>` +
    `<circle r="48" fill="none" stroke="#FFFFFF" stroke-width="3"/>`,
);

/** A tapered brush stroke, red over blue. */
export const BRUSH_SWOOSH = svg(
  '0 0 600 160',
  `<path d="M0 120 C120 60 300 40 600 10 C470 50 300 80 120 140 C70 156 20 150 0 120 Z" fill="#CD2E3A" opacity="0.85"/>` +
    `<path d="M40 150 C180 110 360 80 600 50 C480 90 320 120 160 156 Z" fill="#0047A0" opacity="0.75"/>`,
);

/** A short red brush flick, for after a section title. */
export const BRUSH_FLICK = svg('0 0 120 30', `<path d="M2 24 C40 10 80 6 118 4 C90 12 52 20 14 28 C8 29 3 28 2 24 Z" fill="#CD2E3A"/>`);
