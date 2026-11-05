import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TRAVEL_MODES, type TravelMode } from '@/lib/geo';
import { colors, radius } from '@/theme';

type Props = {
  /** Minutes for each mode; undefined when the mode has no route. */
  minutes: (mode: TravelMode) => number | undefined;
  selected: TravelMode;
  onSelect: (mode: TravelMode) => void;
  compact?: boolean;
};

/** Row of travel-mode tiles (Walk, Bike, ...) with travel times. */
export function TravelModes({ minutes, selected, onSelect, compact }: Props) {
  return (
    <View style={styles.row}>
      {TRAVEL_MODES.map((m) => {
        const active = m.id === selected;
        const fg = active ? colors.white : colors.navy;
        return (
          <Pressable
            key={m.id}
            onPress={() => onSelect(m.id)}
            style={[styles.tile, compact && styles.tileCompact, active && styles.tileActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <MaterialCommunityIcons name={m.icon} size={compact ? 18 : 22} color={fg} />
            <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
              {compact && m.id === 'skate' ? 'Skate' : m.label}
            </Text>
            <Text style={[styles.time, { color: active ? colors.white : colors.textMuted }]}>
              {minutes(m.id) === undefined ? 'No route' : `${minutes(m.id)} min`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tileCompact: { paddingVertical: 8 },
  tileActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  label: { fontSize: 12, fontWeight: '600' },
  time: { fontSize: 11 },
});
