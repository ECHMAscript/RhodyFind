import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TRAVEL_MODES, arrivalTime, formatMiles, type TravelMode } from '@/lib/geo';
import { MANEUVER_ICON, type Step } from '@/lib/routing/directions';
import type { Route } from '@/lib/routing/router';
import { colors, radius } from '@/theme';

type Props = {
  destination: string;
  mode: TravelMode;
  route: Route;
  steps: Step[];
  stepIndex: number;
  onStepChange: (index: number) => void;
  onEnd: () => void;
  following: boolean;
  onToggleFollow: () => void;
  offRoute: boolean;
  onReroute: () => void;
  notice?: string;
};

/** Turn-by-turn directions shown after "Start Route". */
export function NavigationPanel({
  destination,
  mode,
  route,
  steps,
  stepIndex,
  onStepChange,
  onEnd,
  following,
  onToggleFollow,
  offRoute,
  onReroute,
  notice,
}: Props) {
  const step = steps[stepIndex];
  const modeMeta = TRAVEL_MODES.find((m) => m.id === mode)!;
  const remaining = steps.slice(stepIndex).reduce((sum, s) => sum + s.meters, 0);
  const remainingMin = Math.max(1, Math.round((route.minutes * remaining) / Math.max(route.meters, 1)));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Directions to</Text>
          <Text style={styles.title} numberOfLines={1}>{destination}</Text>
          <View style={styles.summary}>
            <MaterialCommunityIcons name={modeMeta.icon} size={14} color={colors.textMuted} />
            <Text style={styles.summaryText}>
              {formatMiles(remaining)} · {remainingMin} min · arrive {arrivalTime(remainingMin)}
            </Text>
          </View>
        </View>
        <Pressable style={styles.end} onPress={onEnd} accessibilityRole="button">
          <Text style={styles.endText}>End</Text>
        </Pressable>
      </View>

      {/* Current step */}
      <View style={styles.current}>
        <View style={styles.currentIcon}>
          <MaterialCommunityIcons name={MANEUVER_ICON[step.maneuver]} size={30} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.currentText}>{step.instruction}</Text>
          {step.meters > 0 && <Text style={styles.currentMeta}>for {formatMiles(step.meters)}</Text>}
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[styles.ctrl, stepIndex === 0 && styles.ctrlDisabled]}
          disabled={stepIndex === 0}
          onPress={() => onStepChange(stepIndex - 1)}
          accessibilityLabel="Previous step"
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.counter}>Step {stepIndex + 1} of {steps.length}</Text>
        <Pressable
          style={[styles.ctrl, stepIndex === steps.length - 1 && styles.ctrlDisabled]}
          disabled={stepIndex === steps.length - 1}
          onPress={() => onStepChange(stepIndex + 1)}
          accessibilityLabel="Next step"
        >
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.navy} />
        </Pressable>
        <Pressable style={[styles.follow, following && styles.followOn]} onPress={onToggleFollow} accessibilityRole="button">
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color={following ? colors.white : colors.navy} />
          <Text style={[styles.followText, following && { color: colors.white }]}>
            {following ? 'Following you' : 'Follow my location'}
          </Text>
        </Pressable>
      </View>

      {offRoute && (
        <Pressable style={styles.offRoute} onPress={onReroute}>
          <MaterialCommunityIcons name="map-marker-alert-outline" size={18} color={colors.danger} />
          <Text style={styles.offRouteText}>You're off the route.</Text>
          <Text style={styles.offRouteLink}>Reroute from here</Text>
        </Pressable>
      )}
      {notice && <Text style={styles.notice}>{notice}</Text>}

      {/* All steps */}
      <View style={styles.list}>
        {steps.map((s, i) => {
          const active = i === stepIndex;
          const past = i < stepIndex;
          return (
            <Pressable
              key={i}
              onPress={() => onStepChange(i)}
              style={({ hovered }: any) => [styles.row, active && styles.rowActive, hovered && !active && styles.rowHover]}
            >
              <MaterialCommunityIcons
                name={MANEUVER_ICON[s.maneuver]}
                size={18}
                color={active ? colors.navy : past ? colors.gray : colors.text}
              />
              <Text style={[styles.rowText, past && styles.rowPast, active && styles.rowTextActive]}>{s.instruction}</Text>
              {s.meters > 0 && <Text style={[styles.rowDist, past && styles.rowPast]}>{formatMiles(s.meters)}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: { fontSize: 12, color: colors.textMuted },
  title: { fontSize: 18, fontWeight: '800', color: colors.navy },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  summaryText: { fontSize: 13, color: colors.textMuted },
  end: { paddingHorizontal: 16, height: 36, borderRadius: radius.pill, backgroundColor: colors.danger, justifyContent: 'center' },
  endText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  current: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: colors.navy },
  currentIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  currentText: { color: colors.white, fontSize: 17, fontWeight: '700', lineHeight: 22 },
  currentMeta: { color: colors.keaney, fontSize: 13, marginTop: 4, fontWeight: '600' },

  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrl: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.keaneyTint, alignItems: 'center', justifyContent: 'center' },
  ctrlDisabled: { opacity: 0.4 },
  counter: { fontSize: 13, fontWeight: '600', color: colors.textMuted, minWidth: 82, textAlign: 'center' },
  follow: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  followOn: { backgroundColor: colors.keaney, borderColor: colors.keaney },
  followText: { fontSize: 13, fontWeight: '600', color: colors.navy },

  offRoute: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: '#FDECEC' },
  offRouteText: { flex: 1, color: colors.text, fontSize: 14 },
  offRouteLink: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  notice: { fontSize: 13, color: colors.textMuted },

  list: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.sm },
  rowActive: { backgroundColor: colors.keaneyTint },
  rowHover: { backgroundColor: colors.background },
  rowText: { flex: 1, fontSize: 14, color: colors.text },
  rowTextActive: { fontWeight: '700', color: colors.navy },
  rowPast: { color: colors.gray },
  rowDist: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
