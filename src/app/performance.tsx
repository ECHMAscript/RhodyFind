import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { BenchmarkChart, SERIES, fmtUs } from '@/components/BenchmarkChart';
import nativeResults from '@/data/benchmarkNative.json';
import {
  BENCH_METHOD,
  BENCH_SIZES,
  MAX_BENCH_POINTS,
  MAX_BENCH_SIZES,
  parsePointCount,
  runWasmBenchmark,
  type BenchRow,
} from '@/lib/spatial/benchmark';
import { onSpatialEngineReady, spatialEngineReady } from '@/lib/spatial/engine';
import { breakpoints, colors, radius, shadow } from '@/theme';

type Source = 'native' | 'live';

const NATIVE_ROWS = nativeResults.rows as BenchRow[];

export default function PerformanceScreen() {
  const { width } = useWindowDimensions();
  const compact = width < breakpoints.tablet;

  const [engineReady, setEngineReady] = useState(spatialEngineReady);
  useEffect(() => onSpatialEngineReady(() => setEngineReady(true)), []);

  const [source, setSource] = useState<Source>('native');
  const [k, setK] = useState<1 | 5>(1);
  const [live, setLive] = useState<Record<number, BenchRow[]>>({});
  const [running, setRunning] = useState(false);

  // Point counts to test in the browser, editable.
  const [sizes, setSizes] = useState<number[]>(BENCH_SIZES);
  const [runSizes, setRunSizes] = useState<number[]>(BENCH_SIZES);
  const [sizeText, setSizeText] = useState('');
  const [sizeError, setSizeError] = useState<string>();
  const addSize = () => {
    const n = parsePointCount(sizeText);
    if (n === undefined) {
      setSizeError(`Enter a whole number from 1 to ${MAX_BENCH_POINTS.toLocaleString()} (for example 5000, 25k or 1m).`);
      return;
    }
    if (sizes.includes(n)) {
      setSizeError(`${n.toLocaleString()} is already in the list.`);
      return;
    }
    if (sizes.length >= MAX_BENCH_SIZES) {
      setSizeError(`Up to ${MAX_BENCH_SIZES} sizes at a time. Remove one first.`);
      return;
    }
    setSizes([...sizes, n].sort((a, b) => a - b));
    setSizeText('');
    setSizeError(undefined);
  };
  const removeSize = (n: number) => setSizes(sizes.filter((x) => x !== n));
  const largeRun = Math.max(...sizes) > 500_000;

  const rows = source === 'native' ? NATIVE_ROWS.filter((r) => r.k === k) : (live[k] ?? []);
  const largest = rows[rows.length - 1];

  const run = async () => {
    if (!sizes.length) return;
    setSource('live');
    setRunning(true);
    setRunSizes(sizes);
    setLive((l) => ({ ...l, [k]: [] }));
    await runWasmBenchmark(k, (row) => setLive((l) => ({ ...l, [k]: [...(l[k] ?? []), row] })), sizes);
    setRunning(false);
  };

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]}>
        <Text style={styles.eyebrow}>Performance</Text>
        <Text style={[styles.title, compact && styles.titleCompact]}>k-d tree vs. brute force</Text>
        <Text style={styles.lead}>
          Finding the closest place means comparing distances. Brute force checks every point, so it slows down as the
          map grows. The k-d tree splits the map into halves, then quarters, and so on, and skips whole regions that
          can&apos;t contain a closer point. Both always return the same answer.
        </Text>

        <View style={[styles.engine, engineReady ? styles.engineOn : styles.engineOff]}>
          <MaterialCommunityIcons
            name={engineReady ? 'check-circle' : 'information-outline'}
            size={18}
            color={engineReady ? '#0E7A4B' : colors.navy}
          />
          <Text style={styles.engineText}>
            {engineReady
              ? 'The C++ k-d tree is running in this browser (WebAssembly). Campus search and route snapping use it.'
              : 'The C++ k-d tree (WebAssembly) isn’t loaded here, so the app is using brute force. Recorded native results are shown below.'}
          </Text>
        </View>

        {/* Controls: one row above the chart */}
        <View style={styles.controls}>
          <Segmented
            value={source}
            onChange={setSource}
            options={[
              { value: 'native', label: 'Native C++ (recorded)' },
              { value: 'live', label: 'Live in this browser', disabled: !engineReady },
            ]}
          />
          <Segmented
            value={k}
            onChange={setK}
            options={[
              { value: 1, label: 'Closest 1' },
              { value: 5, label: 'Closest 5' },
            ]}
          />
        </View>

        <View style={styles.card}>
          {source === 'live' && rows.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {running ? 'Running…' : 'Run the benchmark to measure both methods in this browser.'}
              </Text>
            </View>
          ) : (
            <>
              {largest && (
                <View style={[styles.tiles, compact && styles.tilesCompact]}>
                  <Tile
                    value={`${(largest.bfQueryUs / largest.kdQueryUs).toFixed(0)}×`}
                    label={`faster at ${largest.n.toLocaleString()} points`}
                  />
                  <Tile value={fmtUs(largest.kdQueryUs)} label="k-d tree, per search" swatch={SERIES.kd.color} />
                  <Tile value={fmtUs(largest.bfQueryUs)} label="brute force, per search" swatch={SERIES.bf.color} />
                </View>
              )}
              <BenchmarkChart rows={rows} />
              <Table rows={rows} running={running && source === 'live'} sizes={runSizes} />
            </>
          )}

          {/* Point counts to test */}
          <View style={styles.sizes}>
            <Text style={styles.sizesTitle}>Points to test</Text>
            <View style={styles.chips}>
              {sizes.map((n) => (
                <View key={n} style={styles.chip}>
                  <Text style={styles.chipText}>{n.toLocaleString()}</Text>
                  <Pressable
                    onPress={() => removeSize(n)}
                    disabled={running}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${n.toLocaleString()} points`}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="close" size={14} color={colors.navy} />
                  </Pressable>
                </View>
              ))}
              {!sizes.length && <Text style={styles.note}>Add at least one size to run the benchmark.</Text>}
            </View>
            <View style={styles.addRow}>
              <TextInput
                value={sizeText}
                onChangeText={(t) => {
                  setSizeText(t);
                  setSizeError(undefined);
                }}
                onSubmitEditing={addSize}
                placeholder="e.g. 5000, 25k or 1m"
                placeholderTextColor={colors.gray}
                inputMode="numeric"
                editable={!running}
                style={styles.input}
                accessibilityLabel="Number of points to add"
              />
              <Pressable
                style={[styles.addBtn, (!sizeText.trim() || running) && styles.runDisabled]}
                disabled={!sizeText.trim() || running}
                onPress={addSize}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
                <Text style={styles.addText}>Add</Text>
              </Pressable>
              <Pressable
                style={styles.resetBtn}
                disabled={running}
                onPress={() => {
                  setSizes(BENCH_SIZES);
                  setSizeError(undefined);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>
            {sizeError && <Text style={styles.sizeError}>{sizeError}</Text>}
            {largeRun && !sizeError && (
              <Text style={styles.note}>Sizes over 500,000 points can take several seconds each to set up and measure.</Text>
            )}
          </View>

          <View style={styles.runRow}>
            <Pressable
              style={[styles.run, (!engineReady || running || !sizes.length) && styles.runDisabled]}
              disabled={!engineReady || running || !sizes.length}
              onPress={run}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="play" size={18} color={colors.white} />
              <Text style={styles.runText}>{running ? 'Running…' : 'Run benchmark in this browser'}</Text>
            </Pressable>
            <Text style={styles.note}>
              {source === 'native'
                ? `${nativeResults.source}. Points are random over an area the size of campus.`
                : `Both methods run inside WebAssembly on the same random points. Browsers round their clock to about 0.1 ms, so each timing repeats the searches (cycling through ${BENCH_METHOD.queries.toLocaleString()} query points) until at least ${BENCH_METHOD.minSampleMs} ms has passed. The fastest of ${BENCH_METHOD.samples} tries is shown, since other activity on the computer can only slow a try down.`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Segmented<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; disabled?: boolean }[];
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive, o.disabled && styles.segmentDisabled]}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: o.disabled }}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Tile({ value, label, swatch }: { value: string; label: string; swatch?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <View style={styles.tileLabelRow}>
        {swatch && <View style={[styles.swatch, { backgroundColor: swatch }]} />}
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
    </View>
  );
}

function Table({ rows, running, sizes }: { rows: BenchRow[]; running: boolean; sizes: number[] }) {
  return (
    <View style={styles.table} accessibilityRole="summary">
      <View style={[styles.tr, styles.thead]}>
        <Text style={[styles.th, styles.cellN]}>Points</Text>
        <Text style={styles.th}>Brute force</Text>
        <Text style={styles.th}>k-d tree</Text>
        <Text style={styles.th}>Speedup</Text>
        <Text style={styles.th}>Tree build</Text>
      </View>
      {rows.map((r) => (
        <View key={r.n} style={styles.tr}>
          <Text style={[styles.td, styles.cellN]}>{r.n.toLocaleString()}</Text>
          <Text style={styles.td}>{fmtUs(r.bfQueryUs)}</Text>
          <Text style={styles.td}>{fmtUs(r.kdQueryUs)}</Text>
          <Text style={[styles.td, styles.tdStrong]}>{(r.bfQueryUs / r.kdQueryUs).toFixed(1)}×</Text>
          <Text style={styles.td}>
            {r.buildMs < 1 ? `${(r.buildMs * 1000).toFixed(0)} µs` : `${r.buildMs.toFixed(1)} ms`}
            {r.matches === false ? '  ⚠ mismatch' : ''}
          </Text>
        </View>
      ))}
      {running && rows.length < sizes.length && (
        <View style={styles.tr}>
          <Text style={[styles.td, styles.cellN]}>{[...sizes].sort((a, b) => a - b)[rows.length].toLocaleString()}</Text>
          <Text style={[styles.td, styles.muted]}>measuring…</Text>
        </View>
      )}
      {rows.some((r) => r.matches !== undefined) && (
        <Text style={styles.verified}>
          {rows.every((r) => r.matches !== false)
            ? '✓ The k-d tree returned exactly the same results as brute force on every checked search.'
            : '⚠ The k-d tree disagreed with brute force on at least one search.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 32, gap: 16, maxWidth: 960, width: '100%', alignSelf: 'center' },
  contentCompact: { padding: 16 },
  eyebrow: { fontSize: 13, fontWeight: '700', color: colors.keaney, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '800', color: colors.navy },
  titleCompact: { fontSize: 26 },
  lead: { fontSize: 15, lineHeight: 22, color: colors.textMuted, maxWidth: 720 },

  engine: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: radius.md },
  engineOn: { backgroundColor: '#E7F6EE' },
  engineOff: { backgroundColor: colors.keaneyTint },
  engineText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },

  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  segmented: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, padding: 3 },
  segment: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  segmentActive: { backgroundColor: colors.navy },
  segmentDisabled: { opacity: 0.4 },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.navy },
  segmentTextActive: { color: colors.white },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, gap: 16, ...shadow.card },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.textMuted },

  tiles: { flexDirection: 'row', gap: 12 },
  tilesCompact: { flexDirection: 'column' },
  tile: { flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: colors.background },
  tileValue: { fontSize: 28, fontWeight: '800', color: colors.navy },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  tileLabel: { fontSize: 13, color: colors.textMuted },
  swatch: { width: 10, height: 10, borderRadius: 5 },

  table: { borderTopWidth: 1, borderTopColor: colors.border },
  tr: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  thead: { paddingVertical: 6 },
  th: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textMuted, textAlign: 'right' },
  td: { flex: 1, fontSize: 14, color: colors.text, textAlign: 'right', fontVariant: ['tabular-nums'] },
  tdStrong: { fontWeight: '700', color: colors.navy },
  cellN: { textAlign: 'left' },
  muted: { color: colors.textMuted },
  verified: { fontSize: 13, color: '#0E7A4B', marginTop: 10 },

  sizes: { gap: 10, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
  sizesTitle: { fontSize: 14, fontWeight: '700', color: colors.navy, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12, paddingRight: 8, height: 32, borderRadius: radius.pill, backgroundColor: colors.keaneyTint },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.navy, fontVariant: ['tabular-nums'] },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  input: { flexGrow: 1, flexBasis: 180, maxWidth: 280, height: 40, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, fontSize: 14, color: colors.text, backgroundColor: colors.white },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 40, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.navy },
  addText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  resetBtn: { height: 40, paddingHorizontal: 12, justifyContent: 'center' },
  resetText: { color: colors.navy, fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },
  sizeError: { fontSize: 13, color: colors.danger },
  runRow: { gap: 8 },
  run: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: radius.pill, backgroundColor: colors.navy, alignSelf: 'flex-start', paddingHorizontal: 20 },
  runDisabled: { opacity: 0.45 },
  runText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  note: { fontSize: 12, color: colors.textMuted },
});
