import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_META, type CampusLocation } from '@/data/locations';
import { searchByName } from '@/lib/search';
import { colors, radius, shadow } from '@/theme';

type Props = {
  value?: string;
  placeholder: string;
  pinColor?: string;
  onSelect: (location: CampusLocation) => void;
  /** Shows a "Use my current location" row at the top of the dropdown. */
  onUseCurrentLocation?: () => void;
  locating?: boolean;
  compact?: boolean;
  zIndex?: number;
};

/** Text field with an autocomplete dropdown of campus locations. */
export function LocationField({
  value = '',
  placeholder,
  pinColor = colors.navy,
  onSelect,
  onUseCurrentLocation,
  locating,
  compact,
  zIndex = 1,
}: Props) {
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);

  // When the selected value changes from outside, show it (adjusting state during render).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  const suggestions = useMemo(() => (query === value ? [] : searchByName(query)), [query, value]);
  const showCurrent = !!onUseCurrentLocation && focused && query === value;
  const open = focused && (suggestions.length > 0 || showCurrent);

  const choose = (l: CampusLocation) => {
    setQuery(l.name);
    setFocused(false);
    onSelect(l);
  };

  return (
    // zIndex keeps an open dropdown above the fields rendered after this one.
    <View style={{ zIndex: open ? 100 : zIndex }}>
      <View style={[styles.field, compact && styles.fieldCompact, focused && styles.fieldFocused]}>
        <MaterialCommunityIcons name="map-marker" size={compact ? 16 : 18} color={pinColor} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          onFocus={() => setFocused(true)}
          // Delay so a tap on a suggestion registers before the dropdown closes.
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onSubmitEditing={() => suggestions[0] && choose(suggestions[0])}
          style={[styles.input, compact && styles.inputCompact]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {locating ? (
          <ActivityIndicator size="small" color={colors.keaney} />
        ) : query && query !== value ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear">
            <MaterialCommunityIcons name="close" size={16} color={colors.gray} />
          </Pressable>
        ) : (
          <MaterialCommunityIcons name="magnify" size={18} color={colors.gray} />
        )}
      </View>

      {open && (
        <View style={styles.dropdown}>
          {showCurrent && (
            <Pressable
              style={({ hovered }: any) => [styles.row, hovered && styles.rowHover]}
              onPress={() => {
                setFocused(false);
                onUseCurrentLocation!();
              }}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.keaney} />
              <Text style={[styles.rowTitle, { color: colors.navy }]}>Use my current location</Text>
            </Pressable>
          )}
          {suggestions.map((l, i) => (
            <Pressable
              key={l.id}
              style={({ hovered }: any) => [styles.row, (hovered || i === 0) && styles.rowHover]}
              onPress={() => choose(l)}
            >
              <MaterialCommunityIcons name={CATEGORY_META[l.category].icon} size={16} color={colors.navy} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>{l.name}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{l.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  fieldCompact: { height: 40, paddingHorizontal: 12 },
  fieldFocused: { borderColor: colors.keaney },
  // 16 px or more: iPhone Safari zooms the whole page in when you tap a text
  // box with smaller text, and leaves it zoomed (cut off at both edges).
  input: { flex: 1, fontSize: 16, color: colors.text, outlineStyle: 'none' } as any,
  inputCompact: { fontSize: 16 },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 14 },
  rowHover: { backgroundColor: colors.keaneyTint },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
});
