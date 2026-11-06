import type { BenchRow } from '@/lib/spatial/benchmark';

// Same colors as the web chart, used by the page's table swatches.
export const SERIES = {
  kd: { label: 'k-d tree', color: '#2a78d6' },
  bf: { label: 'Brute force', color: '#eb6834' },
};

export const fmtUs = (us: number) =>
  us >= 1000 ? `${(us / 1000).toFixed(us >= 10_000 ? 0 : 1)} ms` : us >= 10 ? `${us.toFixed(0)} µs` : `${us.toFixed(2)} µs`;

// The chart is drawn with SVG on the web (BenchmarkChart.web.tsx). In the native
// app the Performance page shows the same numbers in its table.
export function BenchmarkChart(_props: { rows: BenchRow[] }) {
  return null;
}
