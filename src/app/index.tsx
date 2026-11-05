import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { LocationField } from '@/components/LocationField';
import { TravelModes } from '@/components/TravelModes';
import { CATEGORY_META, QUICK_CATEGORIES, type Category } from '@/data/locations';
import { currentPosition, encodeEndpoint, fromLocation, type Endpoint } from '@/lib/endpoints';
import { formatMiles, travelMinutes, type TravelMode } from '@/lib/geo';
import { findNearest } from '@/lib/search';
import { useCurrentLocation } from '@/lib/useCurrentLocation';
import { breakpoints, colors, radius, shadow } from '@/theme';

function openMap(from: Endpoint | undefined, to: Endpoint, mode: TravelMode) {
  router.push({
    pathname: '/map',
    params: { ...(from && { from: encodeEndpoint(from) }), to: encodeEndpoint(to), mode },
  });
}

export default function Home() {
  const { width } = useWindowDimensions();
  const mobile = width < breakpoints.tablet;

  const [origin, setOrigin] = useState<Endpoint>();
  const [category, setCategory] = useState<Category>('dining');
  const [mode, setMode] = useState<TravelMode>('walk');
  const { state: geo, locate } = useCurrentLocation();

  const nearest = useMemo(
    () => (origin ? findNearest(origin, { category, k: 4, excludeId: origin.id }) : []),
    [origin, category],
  );
  const closest = nearest[0];

  const useMyLocation = async () => {
    const coords = await locate();
    if (coords) setOrigin(currentPosition(coords));
  };

  const swap = () => {
    if (closest) setOrigin(fromLocation(closest.location));
  };

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={[colors.navy, colors.navySoft, '#3E7DBF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, mobile && styles.heroMobile]}
        >
          <MaterialCommunityIcons name="map-marker-radius" size={mobile ? 180 : 320} color="rgba(104,171,232,0.12)" style={styles.heroArt} />
          <Text style={[styles.heroTitle, mobile && styles.heroTitleMobile]}>Find Your Way Around URI</Text>
          <Text style={styles.heroSub}>Campus navigation for students, visitors, and the URI community.</Text>
        </LinearGradient>

        <View style={[styles.content, mobile && styles.contentMobile]}>
          {/* Search card */}
          <View style={[styles.card, styles.searchCard, mobile && styles.cardMobile]}>
            <View style={styles.cardLabelRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.navy} />
              <Text style={styles.cardLabel}>Where are you starting?</Text>
            </View>
            <View style={[styles.searchRow, mobile && { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={{ flex: mobile ? undefined : 1.15, zIndex: 3 }}>
                <LocationField
                  value={origin?.name}
                  placeholder={mobile ? 'Search a building' : 'Search a building, or use your location'}
                  onSelect={(l) => setOrigin(fromLocation(l))}
                  onUseCurrentLocation={useMyLocation}
                  locating={geo.status === 'locating'}
                  zIndex={3}
                />
              </View>
              {!mobile && (
                <Pressable
                  onPress={swap}
                  disabled={!closest}
                  style={styles.swap}
                  accessibilityLabel="Start from the destination instead"
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color={closest ? colors.navy : colors.gray} />
                </Pressable>
              )}
              <View style={{ flex: mobile ? undefined : 1, zIndex: 2 }}>
                <LocationField
                  placeholder="Where are you going on campus?"
                  pinColor={colors.danger}
                  onSelect={(l) => openMap(origin, fromLocation(l), mode)}
                  zIndex={2}
                />
              </View>
            </View>
            {geo.status === 'error' && <Text style={styles.error}>{geo.message}</Text>}
          </View>

          {/* Category chips */}
          <View style={[styles.chips, mobile && styles.chipsMobile]}>
            {QUICK_CATEGORIES.map((c) => {
              const active = c === category;
              const meta = CATEGORY_META[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, mobile && styles.chipMobile, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <MaterialCommunityIcons name={meta.icon} size={mobile ? 20 : 22} color={active ? colors.white : colors.navy} />
                  <Text style={[styles.chipText, mobile && { fontSize: 12 }, active && { color: colors.white }]}>{meta.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Closest result + travel times */}
          <View style={[styles.card, styles.routeCard, mobile && styles.routeCardMobile]}>
            {closest ? (
              <>
                <Pressable style={styles.routeInfo} onPress={() => openMap(origin, fromLocation(closest.location), mode)}>
                  <View style={styles.thumb}>
                    <MaterialCommunityIcons name={CATEGORY_META[category].icon} size={30} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeEyebrow}>Closest {CATEGORY_META[category].label.toLowerCase()} · route to</Text>
                    <Text style={styles.routeTitle} numberOfLines={1}>{closest.location.name}</Text>
                    <Text style={styles.routeMeta}>
                      {formatMiles(closest.meters)} · {travelMinutes(closest.meters, mode)} min {mode === 'walk' ? 'walk' : ''}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gray} />
                </Pressable>
                {!mobile && (
                  <View style={{ flex: 1.3 }}>
                    <TravelModes minutes={(m) => travelMinutes(closest.meters, m)} selected={mode} onSelect={setMode} />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.routeInfo}>
                <View style={[styles.thumb, { backgroundColor: colors.keaneyTint }]}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={28} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle}>See what&apos;s closest to you</Text>
                  <Text style={styles.routeMeta}>Set a starting point above, or use your current location.</Text>
                </View>
                <Pressable style={styles.locateBtn} onPress={useMyLocation}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.white} />
                  {!mobile && <Text style={styles.locateText}>Use my location</Text>}
                </Pressable>
              </View>
            )}
          </View>

          {/* Other nearby results */}
          {nearest.length > 1 && (
            <View style={[styles.card, styles.listCard, mobile && styles.cardMobile]}>
              <Text style={styles.listTitle}>
                More {CATEGORY_META[category].label.toLowerCase()} near {origin?.name}
              </Text>
              {nearest.slice(1).map(({ location, meters }) => (
                <Pressable
                  key={location.id}
                  style={({ hovered }: any) => [styles.listRow, hovered && { backgroundColor: colors.keaneyTint }]}
                  onPress={() => openMap(origin, fromLocation(location), mode)}
                >
                  <MaterialCommunityIcons name={CATEGORY_META[location.category].icon} size={18} color={colors.navy} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{location.name}</Text>
                    <Text style={styles.rowSub}>{location.subtitle}</Text>
                  </View>
                  <Text style={styles.rowDist}>{formatMiles(meters)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 340, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 70, overflow: 'hidden' },
  heroMobile: { height: 250, paddingBottom: 50 },
  heroArt: { position: 'absolute', right: '8%', top: -30 },
  heroTitle: { color: colors.white, fontSize: 48, fontWeight: '800', textAlign: 'center', letterSpacing: -1 },
  heroTitleMobile: { fontSize: 32 },
  heroSub: { color: 'rgba(255,255,255,0.88)', fontSize: 17, marginTop: 10, textAlign: 'center' },

  content: { width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 32, marginTop: -78, gap: 18 },
  contentMobile: { paddingHorizontal: 16, marginTop: -56, gap: 14 },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 22, ...shadow.card },
  cardMobile: { padding: 16 },
  searchCard: { zIndex: 5 },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: colors.navy },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swap: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keaneyTint },
  error: { marginTop: 10, color: colors.danger, fontSize: 13 },

  chips: { flexDirection: 'row', gap: 14 },
  chipsMobile: { gap: 8 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    ...shadow.card,
    shadowOpacity: 0.07,
  },
  chipMobile: { flexDirection: 'column', height: 64, gap: 4 },
  chipActive: { backgroundColor: colors.navy },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.navy },

  routeCard: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 16 },
  routeCardMobile: { padding: 12 },
  routeInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 84, height: 64, borderRadius: radius.md, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  routeEyebrow: { fontSize: 12, color: colors.textMuted },
  routeTitle: { fontSize: 17, fontWeight: '700', color: colors.navy, marginTop: 1 },
  routeMeta: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  locateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy, paddingHorizontal: 14, height: 40, borderRadius: radius.pill },
  locateText: { color: colors.white, fontWeight: '600', fontSize: 14 },

  listCard: { paddingVertical: 14, gap: 2 },
  listTitle: { fontSize: 14, fontWeight: '700', color: colors.navy, marginBottom: 6, paddingHorizontal: 8 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.sm },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted },
  rowDist: { fontSize: 13, fontWeight: '600', color: colors.navy },
});
