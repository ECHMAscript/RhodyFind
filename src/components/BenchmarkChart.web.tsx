import { useState } from 'react';
import type { BenchRow } from '@/lib/spatial/benchmark';

// Validated pair (dataviz palette slots 1 and 2; all six checks pass on white).
export const SERIES = {
  kd: { label: 'k-d tree', color: '#2a78d6' },
  bf: { label: 'Brute force', color: '#eb6834' },
};

const INK = '#0b0b0b';
const INK_2 = '#52514e';
const GRID = '#e6e5e1';
const SURFACE = '#ffffff';

const W = 640;
const H = 320;
const M = { top: 16, right: 104, bottom: 44, left: 64 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const fmtN = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n));
export const fmtUs = (us: number) =>
  us >= 1000 ? `${(us / 1000).toFixed(us >= 10_000 ? 0 : 1)} ms` : us >= 10 ? `${us.toFixed(0)} µs` : `${us.toFixed(2)} µs`;
const fmtTick = (us: number) => (us >= 1000 ? `${us / 1000} ms` : `${us} µs`);

/**
 * Time per search vs number of points, both axes logarithmic: brute force rises
 * in step with n, the k-d tree stays nearly flat. Hover a column for exact values.
 */
export function BenchmarkChart({ rows }: { rows: BenchRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!rows.length) return null;

  const ns = rows.map((r) => r.n);
  const values = rows.flatMap((r) => [r.kdQueryUs, r.bfQueryUs]);
  const xMin = Math.log10(Math.min(...ns));
  const xMax = Math.log10(Math.max(...ns));
  const yMin = Math.floor(Math.log10(Math.min(...values)));
  const yMax = Math.ceil(Math.log10(Math.max(...values)));
  const x = (n: number) => M.left + (xMax === xMin ? PW / 2 : ((Math.log10(n) - xMin) / (xMax - xMin)) * PW);
  const y = (us: number) => M.top + PH - ((Math.log10(us) - yMin) / Math.max(1, yMax - yMin)) * PH;
  const yTicks = Array.from({ length: yMax - yMin + 1 }, (_, i) => 10 ** (yMin + i));

  const line = (key: 'kdQueryUs' | 'bfQueryUs') => rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.n)},${y(r[key])}`).join(' ');
  const last = rows[rows.length - 1];
  // Keep the two end labels from overlapping.
  let kdLabelY = y(last.kdQueryUs);
  let bfLabelY = y(last.bfQueryUs);
  if (Math.abs(kdLabelY - bfLabelY) < 16) {
    const mid = (kdLabelY + bfLabelY) / 2;
    const kdBelow = kdLabelY >= bfLabelY;
    kdLabelY = mid + (kdBelow ? 8 : -8);
    bfLabelY = mid + (kdBelow ? -8 : 8);
  }

  const h = hover === null ? null : rows[hover];
  const colW = rows.length > 1 ? PW / (rows.length - 1) : PW;

  return (
    <div style={{ position: 'relative', width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 8, fontSize: 13, color: INK_2 }}>
        {[SERIES.bf, SERIES.kd].map((s) => (
          <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Microseconds per search versus number of points, for brute force and the k-d tree">
        {/* Grid and y axis */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={M.left + PW} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={M.left - 8} y={y(t)} fontSize={11} fill={INK_2} textAnchor="end" dominantBaseline="middle">
              {fmtTick(t)}
            </text>
          </g>
        ))}
        {/* x axis */}
        {rows.map((r) => (
          <text key={r.n} x={x(r.n)} y={M.top + PH + 18} fontSize={11} fill={INK_2} textAnchor="middle">
            {fmtN(r.n)}
          </text>
        ))}
        <text x={M.left + PW / 2} y={H - 6} fontSize={11} fill={INK_2} textAnchor="middle">
          Number of points (log scale)
        </text>
        <text
          x={14}
          y={M.top + PH / 2}
          fontSize={11}
          fill={INK_2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${M.top + PH / 2})`}
        >
          Time per search (log scale)
        </text>

        {/* Crosshair */}
        {h && <line x1={x(h.n)} x2={x(h.n)} y1={M.top} y2={M.top + PH} stroke={INK_2} strokeWidth={1} strokeDasharray="3 3" />}

        {/* Series */}
        {(['bfQueryUs', 'kdQueryUs'] as const).map((key) => {
          const s = key === 'kdQueryUs' ? SERIES.kd : SERIES.bf;
          return (
            <g key={key}>
              <path d={line(key)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {rows.map((r, i) => (
                <circle
                  key={r.n}
                  cx={x(r.n)}
                  cy={y(r[key])}
                  r={hover === i ? 5.5 : 4}
                  fill={s.color}
                  stroke={SURFACE}
                  strokeWidth={2}
                />
              ))}
            </g>
          );
        })}

        {/* Direct labels at the line ends: text in ink, identity from the swatch */}
        {[
          { s: SERIES.bf, ly: bfLabelY },
          { s: SERIES.kd, ly: kdLabelY },
        ].map(({ s, ly }) => (
          <g key={s.label}>
            <rect x={x(last.n) + 12} y={ly - 1.5} width={10} height={3} rx={1.5} fill={s.color} />
            <text x={x(last.n) + 26} y={ly} fontSize={12} fill={INK} dominantBaseline="middle">
              {s.label}
            </text>
          </g>
        ))}

        {/* Hover targets: one column per size, wider than the marks */}
        {rows.map((r, i) => (
          <rect
            key={r.n}
            x={x(r.n) - colW / 2}
            y={M.top}
            width={colW}
            height={PH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {h && (
        <div
          style={{
            position: 'absolute',
            left: `${(x(h.n) / W) * 100}%`,
            top: 28,
            transform: `translateX(${hover === rows.length - 1 ? '-105%' : hover === 0 ? '5%' : '-50%'})`,
            background: SURFACE,
            border: `1px solid ${GRID}`,
            borderRadius: 8,
            boxShadow: '0 4px 14px rgba(4,30,66,.12)',
            padding: '8px 10px',
            fontSize: 12,
            color: INK,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{h.n.toLocaleString()} points</div>
          {[
            { s: SERIES.bf, v: h.bfQueryUs },
            { s: SERIES.kd, v: h.kdQueryUs },
          ].map(({ s, v }) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: INK_2 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: s.color, display: 'inline-block' }} />
              {s.label}: <span style={{ color: INK, fontWeight: 600 }}>{fmtUs(v)}</span>
            </div>
          ))}
          <div style={{ marginTop: 4, color: INK }}>
            k-d tree is <b>{(h.bfQueryUs / h.kdQueryUs).toFixed(1)}×</b> faster
          </div>
        </div>
      )}
    </div>
  );
}
