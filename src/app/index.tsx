import { useMemo, useState } from 'react';
import { Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { LocationField } from '@/components/LocationField';
import { TravelModes } from '@/components/TravelModes';
import { CATEGORY_META, QUICK_CATEGORIES, type Category, type IconName } from '@/data/locations';
import { PHOTOS, type Photo } from '@/data/photos';
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

// One soft color per tile, drawn from the Rhody palette (Keaney blue, gold,
// navy) plus two accents. `fg` is the icon and label color on `bg`.
const TILE: Record<string, { bg: string; fg: string; label?: string; icon?: IconName }> = {
  restroom: { bg: '#E3F0FC', fg: '#1D5C9E' },
  dining: { bg: '#FBEFD5', fg: '#8A5D00', label: 'Restaurants' },
  printing: { bg: '#ECE8FA', fg: '#5640A8' },
  library: { bg: '#E0F2EA', fg: '#0B6B42' },
  academic: { bg: '#E2E9F5', fg: colors.navy },
  parking: { bg: '#E5EEF8', fg: '#14427A', icon: 'alpha-p-circle' },
};

// A photo for the result card, by category.
const CATEGORY_PHOTO: Partial<Record<Category, Photo>> = {
  restroom: PHOTOS.memorialUnion,
  dining: PHOTOS.memorialUnion,
  printing: PHOTOS.carothers,
  library: PHOTOS.carothers,
  academic: PHOTOS.greenHall,
  parking: PHOTOS.aerial,
};

const AROUND_CAMPUS: { id: string; name: string; caption: string; photo: Photo }[] = [
  { id: 'green-hall', name: 'Green Hall', caption: 'Granite landmark on the Quad, 1937', photo: PHOTOS.greenHall },
  { id: 'carothers', name: 'Carothers Library', caption: 'Study spaces and a 24-hour room', photo: PHOTOS.carothers },
  { id: 'memorial-union', name: 'Memorial Union', caption: 'Food, the campus store and more', photo: PHOTOS.memorialUnion },
];

export default function Home() {
  const { width } = useWindowDimensions();
  const mobile = width < breakpoints.tablet;

  const [origin, setOrigin] = useState<Endpoint>();
  const [category, setCategory] = useState<Category>('restroom');
  const [mode, setMode] = useState<TravelMode>('walk');
  const { state: geo, locate } = useCurrentLocation();

  // The C++ k-d tree (lib/search.ts) answers this for the chosen category.
  const nearest = useMemo(
    () => (origin ? findNearest(origin, { category, k: 4, excludeId: origin.id }) : []),
    [origin, category],
  );
  const closest = nearest[0];
  const meta = CATEGORY_META[category];
  const label = (TILE[category]?.label ?? meta.label).toLowerCase();

  const locateMe = async () => {
    const coords = await locate();
    if (coords) setOrigin(currentPosition(coords));
  };

  // A tile answers "what's closest to me?": without a starting point yet, use the user's location.
  const pickCategory = (c: Category) => {
    setCategory(c);
    if (!origin && geo.status !== 'locating') locateMe();
  };

  const swap = () => {
    if (closest) setOrigin(fromLocation(closest.location));
  };

  const photo = CATEGORY_PHOTO[category];

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <ImageBackground
          source={PHOTOS.quad.source}
          resizeMode="cover"
          style={[styles.hero, mobile && styles.heroMobile]}
          accessibilityLabel="The Quad at URI"
        >
          <LinearGradient
            colors={['rgba(4,30,66,0.78)', 'rgba(11,45,92,0.30)', 'rgba(4,30,66,0.55)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.heroTitle, mobile && styles.heroTitleMobile]}>Find Your Way Around URI</Text>
          <Text style={[styles.heroSub, mobile && styles.heroSubMobile]}>
            Campus navigation for students, visitors, and the URI community.
          </Text>
        </ImageBackground>

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
                  onUseCurrentLocation={locateMe}
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

          {/* See what's closest to you */}
          <View style={[styles.card, styles.closestCard, mobile && styles.closestCardMobile]}>
            <View style={[styles.closestTitleBox, mobile && styles.closestTitleBoxMobile]}>
              <Text style={[styles.closestTitle, mobile && styles.closestTitleMobile]}>See what’s closest to you</Text>
              <View style={styles.underline} />
            </View>
            <View style={[styles.tiles, mobile && styles.tilesMobile]}>
              {QUICK_CATEGORIES.map((c) => {
                const t = TILE[c];
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => pickCategory(c)}
                    style={({ hovered }: any) => [
                      styles.tile,
                      mobile && styles.tileMobile,
                      { backgroundColor: active ? t.fg : t.bg },
                      hovered && !active && styles.tileHover,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Closest ${(t.label ?? CATEGORY_META[c].label).toLowerCase()}`}
                    accessibilityState={{ selected: active }}
                  >
                    <MaterialCommunityIcons
                      name={t.icon ?? CATEGORY_META[c].icon}
                      size={mobile ? 28 : 34}
                      color={active ? colors.white : t.fg}
                    />
                    <View style={styles.tileLabelRow}>
                      <Text style={[styles.tileText, mobile && styles.tileTextMobile, { color: active ? colors.white : colors.navy }]} numberOfLines={1}>
                        {t.label ?? CATEGORY_META[c].label}
                      </Text>
                      {!mobile && (
                        <MaterialCommunityIcons name="chevron-right" size={18} color={active ? colors.white : colors.navy} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Closest result + travel times */}
          <View style={[styles.card, styles.routeCard, mobile && styles.routeCardMobile]}>
            {closest ? (
              <>
                <Pressable style={styles.routeInfo} onPress={() => openMap(origin, fromLocation(closest.location), mode)}>
                  {photo ? (
                    <Image source={photo.source} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
                  ) : (
                    <View style={[styles.thumb, styles.thumbIcon]}>
                      <MaterialCommunityIcons name={meta.icon} size={30} color={colors.white} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeEyebrow}>Closest {label} · route to</Text>
                    <Text style={styles.routeTitle} numberOfLines={1}>{closest.location.name}</Text>
                    <Text style={styles.routeMeta} numberOfLines={2}>
                      {formatMiles(closest.meters)} · {travelMinutes(closest.meters, mode)} min {mode === 'walk' ? 'walk' : ''}
                      {closest.location.building ? ` · ${closest.location.subtitle}` : ''}
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
                <View style={[styles.thumb, styles.thumbIcon, { backgroundColor: colors.keaneyTint }]}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={28} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle}>
                    {geo.status === 'locating' ? 'Finding your location…' : `Find the closest ${label}`}
                  </Text>
                  <Text style={styles.routeMeta}>Pick a tile above, or set a starting point.</Text>
                </View>
                <Pressable style={styles.locateBtn} onPress={locateMe} accessibilityRole="button" accessibilityLabel="Use my location">
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
                More {label} near {origin?.name}
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

          {/* Around campus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Around campus</Text>
            <View style={[styles.photoRow, mobile && styles.photoRowMobile]}>
              {AROUND_CAMPUS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/place/${p.id}`)}
                  style={({ hovered }: any) => [styles.photoCard, hovered && styles.photoCardHover]}
                  accessibilityRole="button"
                  accessibilityLabel={`Learn more about ${p.name}`}
                >
                  <View style={styles.photoImg}>
                    <Image source={p.photo.source} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  </View>
                  <View style={styles.photoBody}>
                    <Text style={styles.photoName}>{p.name}</Text>
                    <Text style={styles.photoCaption}>{p.caption}</Text>
                    <View style={styles.photoMore}>
                      <Text style={styles.photoMoreText}>Learn more</Text>
                      <MaterialCommunityIcons name="arrow-right" size={14} color={colors.navy} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={styles.credits}>
            Photos from Wikimedia Commons:{' '}
            {[
              { name: 'The Quad', photo: PHOTOS.quad },
              ...AROUND_CAMPUS,
              ...(photo === PHOTOS.aerial ? [{ name: 'Aerial view', photo: PHOTOS.aerial }] : []),
            ].map((p, i, all) => (
              <Text key={p.name}>
                <Text style={styles.creditLink} onPress={() => Linking.openURL(p.photo.url)}>
                  {p.name}
                </Text>{' '}
                ({p.photo.credit}){i < all.length - 1 ? '; ' : '.'}
              </Text>
            ))}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 420, alignItems: 'center', paddingTop: 54, paddingHorizontal: 24 },
  heroMobile: { height: 330, paddingTop: 34 },
  heroTitle: { color: colors.white, fontSize: 48, fontWeight: '800', textAlign: 'center', letterSpacing: -1 },
  heroTitleMobile: { fontSize: 31 },
  heroSub: { color: 'rgba(255,255,255,0.92)', fontSize: 17, marginTop: 10, textAlign: 'center' },
  heroSubMobile: { fontSize: 15 },

  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 32, marginTop: -250, gap: 18 },
  contentMobile: { paddingHorizontal: 16, marginTop: -200, gap: 14 },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 22, ...shadow.card },
  cardMobile: { padding: 16 },
  searchCard: { zIndex: 5, maxWidth: 900, width: '100%', alignSelf: 'center' },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: colors.navy },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swap: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keaneyTint },
  error: { marginTop: 10, color: colors.danger, fontSize: 13 },

  closestCard: { flexDirection: 'row', alignItems: 'center', gap: 20, borderRadius: radius.xl, padding: 18 },
  closestCardMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12, padding: 14 },
  closestTitleBox: { width: 190, paddingLeft: 8 },
  closestTitleBoxMobile: { width: 'auto', paddingLeft: 2 },
  closestTitle: { fontSize: 26, lineHeight: 30, fontWeight: '800', color: colors.navy },
  closestTitleMobile: { fontSize: 21, lineHeight: 26 },
  underline: { width: 56, height: 5, borderRadius: 3, backgroundColor: colors.keaney, marginTop: 10 },

  tiles: { flex: 1, flexDirection: 'row', gap: 10 },
  tilesMobile: { flex: undefined, flexWrap: 'wrap', gap: 8 },
  tile: { flex: 1, minWidth: 0, height: 96, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 6 },
  tileMobile: { flex: undefined, flexBasis: '31%', flexGrow: 1, height: 84, gap: 6 },
  tileHover: { transform: [{ translateY: -2 }], ...shadow.card, shadowOpacity: 0.1 },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tileText: { fontSize: 14, fontWeight: '700' },
  tileTextMobile: { fontSize: 13 },

  routeCard: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 16 },
  routeCardMobile: { padding: 12 },
  routeInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 84, height: 64, borderRadius: radius.md, backgroundColor: colors.keaneyTint },
  thumbIcon: { backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
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

  section: { gap: 12, marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.navy },
  photoRow: { flexDirection: 'row', gap: 16 },
  photoRowMobile: { flexDirection: 'column', gap: 12 },
  photoCard: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card, shadowOpacity: 0.08 },
  photoCardHover: { transform: [{ translateY: -2 }], shadowOpacity: 0.16 },
  photoImg: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', backgroundColor: colors.keaneyTint },
  photoBody: { padding: 14, gap: 3 },
  photoName: { fontSize: 16, fontWeight: '700', color: colors.navy },
  photoCaption: { fontSize: 13, color: colors.textMuted },
  photoMore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  photoMoreText: { fontSize: 13, fontWeight: '700', color: colors.navy },

  credits: { fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: 4 },
  creditLink: { textDecorationLine: 'underline' },
});
