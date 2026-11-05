import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { LocationField } from '@/components/LocationField';
import { TravelModes } from '@/components/TravelModes';
import { CampusMap } from '@/components/map/CampusMap';
import { CATEGORY_META, LOCATIONS, type CampusLocation } from '@/data/locations';
import { currentPosition, decodeEndpoint, encodeEndpoint, fromLocation, type Endpoint } from '@/lib/endpoints';
import { arrivalTime, formatMiles, haversineMeters, travelMinutes, TRAVEL_MODES, type TravelMode } from '@/lib/geo';
import { findNearest } from '@/lib/search';
import { useCurrentLocation } from '@/lib/useCurrentLocation';
import { breakpoints, colors, radius, shadow } from '@/theme';

const GOOGLE_MODE: Record<TravelMode, string> = {
  walk: 'walking',
  bike: 'bicycling',
  skate: 'walking',
  shuttle: 'transit',
  drive: 'driving',
};

export default function MapScreen() {
  const params = useLocalSearchParams<{ from?: string; to?: string; mode?: TravelMode }>();
  const { width } = useWindowDimensions();
  const mobile = width < breakpoints.laptop;

  const [from, setFromState] = useState<Endpoint | undefined>(() => decodeEndpoint(params.from));
  const [to, setToState] = useState<Endpoint | undefined>(() => decodeEndpoint(params.to));
  const [mode, setMode] = useState<TravelMode>(
    TRAVEL_MODES.some((m) => m.id === params.mode) ? (params.mode as TravelMode) : 'walk',
  );
  const { state: geo, locate } = useCurrentLocation();

  // Keep the URL in sync so a route can be shared or reloaded.
  const setFrom = (e: Endpoint | undefined) => {
    setFromState(e);
    router.setParams({ from: e ? encodeEndpoint(e) : undefined });
  };
  const setTo = (e: Endpoint | undefined) => {
    setToState(e);
    router.setParams({ to: e ? encodeEndpoint(e) : undefined });
  };
  // Stable so the memoized map doesn't re-render when only the panel changes.
  const onPlacePress = useCallback((p: CampusLocation) => {
    setToState(fromLocation(p));
    router.setParams({ to: p.id });
  }, []);

  const meters = from && to ? haversineMeters(from, to) : undefined;
  const minutes = meters !== undefined ? travelMinutes(meters, mode) : undefined;
  const nearby = useMemo(() => (to ? findNearest(to, { k: 3, excludeId: to.id }) : []), [to]);

  const useMyLocation = async () => {
    const coords = await locate();
    if (coords) setFrom(currentPosition(coords));
  };

  const startRoute = () => {
    if (!from || !to) return;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=${GOOGLE_MODE[mode]}`,
    );
  };

  const panel = (
    <ScrollView
      style={[styles.panel, mobile && styles.panelMobile]}
      contentContainerStyle={styles.panelContent}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
        <MaterialCommunityIcons name="arrow-left" size={16} color={colors.navy} />
        <Text style={styles.backText}>Back to Search</Text>
      </Pressable>

      <View style={styles.endpoints}>
        <View style={{ flex: 1, gap: 10 }}>
          <View style={[styles.endpointRow, { zIndex: 3 }]}>
            <Text style={styles.endpointLabel}>From</Text>
            <View style={{ flex: 1 }}>
              <LocationField
                compact
                value={from?.name}
                placeholder="Choose a starting point"
                pinColor={colors.keaney}
                onSelect={(l) => setFrom(fromLocation(l))}
                onUseCurrentLocation={useMyLocation}
                locating={geo.status === 'locating'}
                zIndex={3}
              />
            </View>
          </View>
          <View style={[styles.endpointRow, { zIndex: 2 }]}>
            <Text style={styles.endpointLabel}>To</Text>
            <View style={{ flex: 1 }}>
              <LocationField
                compact
                value={to?.name}
                placeholder="Choose a destination"
                pinColor={colors.danger}
                onSelect={(l) => setTo(fromLocation(l))}
                zIndex={2}
              />
            </View>
          </View>
        </View>
        <Pressable
          style={styles.swap}
          onPress={() => {
            setFrom(to);
            setTo(from);
          }}
          accessibilityLabel="Swap start and destination"
        >
          <MaterialCommunityIcons name="swap-vertical" size={20} color={colors.navy} />
        </Pressable>
      </View>
      {geo.status === 'error' && <Text style={styles.error}>{geo.message}</Text>}

      {meters !== undefined && minutes !== undefined ? (
        <>
          <Text style={styles.section}>Travel Options</Text>
          <TravelModes meters={meters} selected={mode} onSelect={setMode} compact />

          <View style={styles.stats}>
            <Stat icon="map-marker-distance" label="Distance" value={formatMiles(meters)} />
            <Stat icon="timer-outline" label="Travel time" value={`~${minutes} min`} />
            <Stat icon="clock-outline" label="Est. arrival" value={arrivalTime(minutes)} />
          </View>

          <Pressable style={styles.start} onPress={startRoute}>
            <MaterialCommunityIcons name="navigation-variant" size={18} color={colors.white} />
            <Text style={styles.startText}>Start Route</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.hint}>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.navy} />
          <Text style={styles.hintText}>
            {from ? 'Choose a destination, or tap a place on the map.' : 'Choose a starting point, or use your current location.'}
          </Text>
        </View>
      )}

      {to && nearby.length > 0 && (
        <>
          <Text style={styles.section}>Near {to.name}</Text>
          {nearby.map(({ location, meters: m }) => (
            <Pressable
              key={location.id}
              style={({ hovered }: any) => [styles.nearRow, hovered && { backgroundColor: colors.keaneyTint }]}
              onPress={() => setTo(fromLocation(location))}
            >
              <MaterialCommunityIcons name={CATEGORY_META[location.category].icon} size={18} color={colors.navy} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nearTitle} numberOfLines={1}>{location.name}</Text>
                <Text style={styles.nearSub}>{location.subtitle}</Text>
              </View>
              <Text style={styles.nearDist}>{formatMiles(m)}</Text>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <Header />
      <View style={[styles.body, mobile && styles.bodyMobile]}>
        {mobile ? (
          <>
            <View style={styles.mapMobile}>
              <CampusMap places={LOCATIONS} from={from} to={to} onPlacePress={onPlacePress} />
            </View>
            {panel}
          </>
        ) : (
          <>
            {panel}
            <View style={styles.map}>
              <CampusMap places={LOCATIONS} from={from} to={to} onPlacePress={onPlacePress} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.navy} />
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, flexDirection: 'row' },
  bodyMobile: { flexDirection: 'column' },

  panel: { width: 400, flexGrow: 0, backgroundColor: colors.white, borderRightWidth: 1, borderRightColor: colors.border },
  panelMobile: { width: '100%', flex: 1, flexGrow: 1, zIndex: 2, borderRightWidth: 0, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -20, ...shadow.card },
  panelContent: { padding: 20, gap: 14 },

  map: { flex: 1 },
  mapMobile: { height: 340 },

  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { color: colors.navy, fontWeight: '600', fontSize: 14 },

  endpoints: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 5 },
  endpointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  endpointLabel: { width: 38, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  swap: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keaneyTint },
  error: { color: colors.danger, fontSize: 13 },

  section: { marginTop: 6, fontSize: 15, fontWeight: '700', color: colors.navy },

  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { fontSize: 11, color: colors.textMuted },
  statValue: { fontSize: 14, fontWeight: '700', color: colors.text },

  start: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: radius.pill, backgroundColor: colors.navy },
  startText: { color: colors.white, fontWeight: '700', fontSize: 16 },

  hint: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: radius.md, backgroundColor: colors.keaneyTint },
  hintText: { flex: 1, color: colors.navy, fontSize: 14 },

  nearRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 6, borderRadius: radius.sm },
  nearTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  nearSub: { fontSize: 12, color: colors.textMuted },
  nearDist: { fontSize: 13, fontWeight: '600', color: colors.navy },
});
