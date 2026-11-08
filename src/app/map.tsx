import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { BottomSheet, SHEET_HANDLE_HEIGHT, sheetPeekHeight } from '@/components/BottomSheet';
import { Header } from '@/components/Header';
import { LocationField } from '@/components/LocationField';
import { NavigationPanel } from '@/components/NavigationPanel';
import { TravelModes } from '@/components/TravelModes';
import { CampusMap } from '@/components/map/CampusMap';
import { CATEGORY_META, LOCATION_BY_ID, PLACES, type CampusLocation } from '@/data/locations';
import { PLACE_DETAILS } from '@/data/placeDetails';
import { currentPosition, decodeEndpoint, encodeEndpoint, fromLocation, type Endpoint } from '@/lib/endpoints';
import {
  arrivalTime,
  cumulativeMeters,
  distanceToPathMeters,
  formatMiles,
  haversineMeters,
  TRAVEL_MODES,
  type LatLng,
  type TravelMode,
} from '@/lib/geo';
import { buildSteps } from '@/lib/routing/directions';
import { findRoute, type Route } from '@/lib/routing/router';
import { findNearest } from '@/lib/search';
import { offCampusDistance } from '@/lib/campus';
import { useCurrentLocation } from '@/lib/useCurrentLocation';
import { useWatchPosition, type LiveFix } from '@/lib/useWatchPosition';
import { breakpoints, colors, radius, shadow } from '@/theme';

// How far the phone layout's panel overlaps the bottom of the map (its marginTop).
const PANEL_OVERLAP = 20;
const OFF_ROUTE_METERS = 30;
// Arrived when this close along the route...
const ARRIVED_METERS = 20;
// ...or this close to the destination itself, in a straight line.
const ARRIVE_RADIUS = 25;
const ARRIVE_RADIUS_CAR = 50;
// How far ahead along the route a new fix is matched (more when moving fast).
const LOOKAHEAD_METERS = 300;
// Faster than this (m/s, about 18 mph) on a walking route: probably in a car.
const DRIVING_SPEED = 8;
const REROUTE_AFTER_FIXES = 2;
const REROUTE_COOLDOWN_MS = 3000;
// Farther than this from the route, the user is clearly not on campus yet.
const FAR_AWAY_METERS = 1500;

/** The direction of travel, when the user is moving fast enough for it to be reliable. */
function movingHeading(fix: LiveFix): number | undefined {
  return (fix.speed ?? 0) > 1.5 ? fix.heading : undefined;
}

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

  // "My location" far from campus: no directions from there.
  const fromAway = useMemo(() => offCampusDistance(from), [from]);

  // One route per travel mode, so every tile shows its real travel time.
  const routes = useMemo(() => {
    if (!from || !to || fromAway !== undefined) return undefined;
    const r = {} as Record<TravelMode, Route | null>;
    for (const m of TRAVEL_MODES) r[m.id] = findRoute(from, to, m.id);
    return r;
  }, [from, to, fromAway]);
  const route = routes?.[mode] ?? null;
  // The place a "Learn more" page is about: the destination, or the building
  // a destination restroom or printer is in.
  const toPlace = to?.id ? LOCATION_BY_ID[to.id] : undefined;
  const aboutId = toPlace && (PLACE_DETAILS[toPlace.id] ? toPlace.id : toPlace.building);
  const aboutPlace = aboutId && PLACE_DETAILS[aboutId] ? LOCATION_BY_ID[aboutId] : undefined;
  const nearby = useMemo(() => (to ? findNearest(to, { k: 3, excludeId: to.id }) : []), [to]);

  // Turn-by-turn navigation. Navigation belongs to the route it was started
  // on, so it ends by itself if that route goes away.
  const [navRoute, setNavRoute] = useState<Route | null>(null);
  const navigating = !!route && navRoute === route;
  const [following, setFollowing] = useState(false);
  // True after the user drags the map; the camera stops chasing them until "Recenter".
  const [cameraFree, setCameraFree] = useState(false);
  const { fix, error: watchError } = useWatchPosition(navigating && following);
  const user = fix?.position;

  // A route recomputed from the user's live position after they left the
  // planned one. Tagged with the planned route it replaces, so picking a new
  // route drops it.
  const [rerouted, setRerouted] = useState<{ base: Route; route: Route } | null>(null);
  const liveRoute = navigating && rerouted && rerouted.base === route ? rerouted.route : null;
  const activeRoute = liveRoute ?? route;
  const steps = useMemo(
    () => (activeRoute && from && to ? buildSteps(activeRoute, liveRoute ? 'your location' : from.name, to.name) : []),
    [activeRoute, liveRoute, from, to],
  );
  const cum = useMemo(() => (activeRoute ? cumulativeMeters(activeRoute.coords) : undefined), [activeRoute]);

  // The selected step, tagged with its route: a new route starts at step 0.
  const [stepSel, setStepSel] = useState<{ route: Route | null; index: number }>({ route: null, index: 0 });
  const rawStepIndex = stepSel.route === activeRoute ? stepSel.index : 0;
  const stepIndex = Math.min(rawStepIndex, Math.max(steps.length - 1, 0));
  const setStepIndex = useCallback((index: number) => setStepSel({ route: activeRoute, index }), [activeRoute]);

  // How far along the route the user has gotten (a segment index), tagged with
  // its route. Matching a fix only near this point keeps the tracker from
  // jumping to another part of a route that passes close to itself.
  const [progress, setProgress] = useState<{ route: Route | null; segment: number }>({ route: null, segment: 0 });
  const progressSegment = progress.route === activeRoute ? progress.segment : 0;

  // Where the user is relative to the route: O(route length) per GPS fix.
  const track = useMemo(() => {
    if (!user || !activeRoute || !cum) return undefined;
    const coords = activeRoute.coords;
    const lookahead = Math.max(LOOKAHEAD_METERS, (fix?.speed ?? 0) * 15);
    let last = progressSegment;
    while (last < coords.length - 2 && cum[last + 1] - cum[progressSegment] < lookahead) last++;
    const near = distanceToPathMeters(user, coords, progressSegment - 2, last);
    if (near.meters <= OFF_ROUTE_METERS) return near;
    // Not near where we expected (a shortcut, or GPS was out for a while): look at the whole route.
    const anywhere = distanceToPathMeters(user, coords);
    return anywhere.meters < near.meters ? anywhere : near;
  }, [user, activeRoute, cum, progressSegment, fix?.speed]);
  // Don't call a fix "off route" just because the GPS itself is fuzzy.
  const offRouteLimit = Math.max(OFF_ROUTE_METERS, Math.min(fix?.accuracy ?? 0, 60));
  const farAway = !!track && track.meters >= FAR_AWAY_METERS;
  const onRoute = !!track && track.meters <= offRouteLimit;

  // Meters left along the route from the user's spot on it (to the end, and to the end of a step).
  const metersFromUserTo = useCallback(
    (index: number) => {
      if (!track || !cum || !activeRoute) return undefined;
      const next = track.segment + 1;
      if (index < next) return 0;
      return cum[index] - cum[next] + haversineMeters(track.point, activeRoute.coords[next]);
    },
    [track, cum, activeRoute],
  );
  const lastIndex = activeRoute ? activeRoute.coords.length - 1 : 0;

  // Arrival is sticky for the trip: once there, GPS wobble can't "un-arrive" or reroute.
  const [arrivedOn, setArrivedOn] = useState<Route | null>(null);
  const arrived = navigating && arrivedOn === route;
  const offRoute = !!track && !onRoute && !farAway && !arrived;
  const remainingMeters = arrived ? 0 : navigating && onRoute ? metersFromUserTo(lastIndex) : undefined;

  // Seen driving while the route is for walking or skating: offer to switch.
  const [drivingHint, setDrivingHint] = useState(false);

  // React to each new GPS fix during render (no extra commit per fix):
  //  - arrived: close enough to the destination, or at the end of the route;
  //  - on the route: move to the step the user is on;
  //  - off it (a wrong turn, a shortcut, walking the other way): reroute from
  //    where they are. Two off-route fixes in a row avoid rerouting on one GPS jump.
  const [handledFix, setHandledFix] = useState<LiveFix | undefined>(undefined);
  const [offFixes, setOffFixes] = useState(0);
  const [lastRerouteAt, setLastRerouteAt] = useState(0);
  if (fix !== handledFix) {
    setHandledFix(fix);
    if (navigating && !arrived && fix && track && activeRoute && to && route) {
      if (!drivingHint && (mode === 'walk' || mode === 'skate') && (fix.speed ?? 0) > DRIVING_SPEED) setDrivingHint(true);
      const byCar = mode === 'drive' || mode === 'shuttle';
      const radius = Math.max(byCar ? ARRIVE_RADIUS_CAR : ARRIVE_RADIUS, Math.min(fix.accuracy, 40));
      const atDestination = haversineMeters(fix.position, to) <= radius;
      const remaining = onRoute ? metersFromUserTo(lastIndex) : undefined;
      // Drivers stop where the road ends (a lot or curb), then walk the last bit.
      const parked = byCar && onRoute && track.segment >= activeRoute.networkEnd;
      if (atDestination || parked || (remaining !== undefined && remaining < ARRIVED_METERS)) {
        setArrivedOn(route);
        setStepSel({ route: activeRoute, index: steps.length - 1 });
      } else if (onRoute) {
        if (offFixes) setOffFixes(0);
        // Progress only moves forward; GPS noise near a corner can't pull it back.
        if (track.segment > progressSegment) setProgress({ route: activeRoute, segment: track.segment });
        const i = steps.findIndex((st) => track.segment >= st.startIndex && track.segment < st.endIndex);
        if (i > stepIndex) setStepSel({ route: activeRoute, index: i });
      } else if (offRoute) {
        const n = offFixes + 1;
        const r =
          n >= REROUTE_AFTER_FIXES && fix.time - lastRerouteAt >= REROUTE_COOLDOWN_MS
            ? findRoute(fix.position, to, mode, { heading: movingHeading(fix) })
            : null;
        if (r) {
          setRerouted({ base: route, route: r }); // only the current mode: a few ms
          setLastRerouteAt(fix.time);
          setOffFixes(0);
        } else {
          setOffFixes(n);
        }
      }
    }
  }

  const rerouteNow = () => {
    if (!user || !to || !route) return;
    const r = findRoute(user, to, mode, { heading: fix && movingHeading(fix) });
    if (r) {
      setRerouted({ base: route, route: r });
      setLastRerouteAt(fix?.time ?? Date.now());
    }
  };

  // Switch travel mode mid-trip, continuing from where the user is.
  const switchMode = (m: TravelMode) => {
    const base = routes?.[m];
    setMode(m);
    setDrivingHint(false);
    if (!base) return;
    setNavRoute(base);
    setStepSel({ route: base, index: 0 });
    const r = user && to ? findRoute(user, to, m, { heading: fix && movingHeading(fix) }) : null;
    setRerouted(r ? { base, route: r } : null);
  };

  const live = navigating && following && onRoute && !!track;
  // While tracking, draw only the route from the user's current segment on.
  // Cutting at a vertex (not at the 1-per-second GPS point) keeps the line
  // still under the smoothly gliding dot instead of jumping each second, and
  // the line only changes (and redraws) when the user passes a vertex.
  const cutAt = live && track ? Math.max(track.segment, progressSegment) : -1;
  const routeShown = useMemo(() => {
    if (!activeRoute) return undefined;
    return cutAt < 0 ? activeRoute.coords : activeRoute.coords.slice(cutAt);
  }, [activeRoute, cutAt]);

  const step = navigating ? steps[stepIndex] : undefined;
  const highlight = useMemo(() => {
    if (!step || !activeRoute || step.endIndex <= step.startIndex) return undefined;
    // If the user is partway through this step, start the highlight at their segment.
    if (cutAt >= step.startIndex && cutAt < step.endIndex) {
      return activeRoute.coords.slice(cutAt, step.endIndex + 1);
    }
    return activeRoute.coords.slice(step.startIndex, step.endIndex + 1);
  }, [step, activeRoute, cutAt]);
  const stepMetersLeft = live && step ? metersFromUserTo(step.endIndex) : undefined;

  const follow = navigating && following && !cameraFree && !!user && !farAway;
  const fitTo = useMemo<LatLng[] | undefined>(() => {
    if (!activeRoute) return undefined;
    if (!step) return activeRoute.coords;
    return highlight ?? [activeRoute.coords[activeRoute.coords.length - 1]];
  }, [activeRoute, step, highlight]);
  const onUserPan = useCallback(() => setCameraFree(true), []);

  const useMyLocation = async () => {
    const coords = await locate();
    if (coords) setFrom(currentPosition(coords));
  };

  // Phones: during navigation the directions are a sheet over a full-height map.
  const [sheetUp, setSheetUp] = useState(false);
  const [peekContentHeight, setPeekContentHeight] = useState(150);
  const [bodyHeight, setBodyHeight] = useState(0);
  const sheet = mobile && navigating;
  // On a short screen (a phone held sideways) the slid-down sheet shows only
  // the top of the panel, so it never covers more than about half the map.
  const peekShown = bodyHeight
    ? Math.min(peekContentHeight, Math.max(64, bodyHeight * 0.45 - SHEET_HANDLE_HEIGHT))
    : peekContentHeight;
  const peekHeight = sheetPeekHeight(peekShown);

  const startRoute = () => {
    setSheetUp(false);
    setStepSel({ route, index: 0 });
    setProgress({ route: null, segment: 0 }); // restarting the same route starts from the beginning
    setFollowing(true);
    setCameraFree(false);
    setRerouted(null);
    setArrivedOn(null);
    setDrivingHint(false);
    setNavRoute(route);
  };
  const endRoute = () => {
    setNavRoute(null);
    setFollowing(false);
    setRerouted(null);
    setArrivedOn(null);
    setDrivingHint(false);
  };

  const notice = watchError ?? (farAway ? "You're not near campus yet, so live tracking will start once you're close." : undefined);

  const planner = (
    <>
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

      {aboutPlace && (
        <Pressable
          style={({ hovered }: any) => [styles.learnMore, hovered && { backgroundColor: colors.keaneyTint }]}
          onPress={() => router.push(`/place/${aboutPlace.id}`)}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.navy} />
          <View style={{ flex: 1 }}>
            <Text style={styles.learnMoreTitle}>Learn more about {aboutPlace.name}</Text>
            <Text style={styles.learnMoreSub} numberOfLines={1}>
              Photo, floors, bathrooms and more
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.navy} />
        </Pressable>
      )}

      {fromAway !== undefined ? (
        <View style={styles.hint} accessibilityRole="alert">
          <MaterialCommunityIcons name="map-marker-off-outline" size={18} color={colors.navy} />
          <Text style={styles.hintText}>
            You’re not on campus (about {formatMiles(fromAway)} away), so we can’t give directions from your location
            {to ? ` to ${to.name}` : ''}. Choose a campus building as your starting point instead.
          </Text>
        </View>
      ) : routes ? (
        <>
          <Text style={styles.section}>Travel Options</Text>
          <TravelModes minutes={(m) => routes[m]?.minutes} selected={mode} onSelect={setMode} compact />

          {route ? (
            <>
              <View style={styles.stats}>
                <Stat icon="map-marker-distance" label="Distance" value={formatMiles(route.meters)} />
                <Stat icon="timer-outline" label="Travel time" value={`${route.minutes} min`} />
                <Stat icon="clock-outline" label="Est. arrival" value={arrivalTime(route.minutes)} />
              </View>

              <Pressable style={styles.start} onPress={startRoute}>
                <MaterialCommunityIcons name="navigation-variant" size={18} color={colors.white} />
                <Text style={styles.startText}>Start Route</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.hint}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.navy} />
              <Text style={styles.hintText}>No {TRAVEL_MODES.find((m) => m.id === mode)!.label.toLowerCase()} route between these places. Try another travel option.</Text>
            </View>
          )}
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
    </>
  );

  const navPanel =
    navigating && activeRoute && to && steps.length ? (
      <NavigationPanel
        destination={to.name}
        mode={mode}
        route={activeRoute}
        steps={steps}
        stepIndex={stepIndex}
        onStepChange={setStepIndex}
        onEnd={endRoute}
        following={following}
        onToggleFollow={() => {
          setFollowing((f) => !f);
          setCameraFree(false);
        }}
        offRoute={offRoute}
        onReroute={rerouteNow}
        remainingMeters={remainingMeters}
        stepMetersLeft={stepMetersLeft}
        arrived={arrived}
        suggestion={
          drivingHint && routes?.drive
            ? { text: 'Looks like you’re driving.', action: 'Switch to Drive', onPress: () => switchMode('drive') }
            : undefined
        }
        notice={notice}
        onPeekLayout={sheet ? setPeekContentHeight : undefined}
      />
    ) : null;

  const panel = (
    <ScrollView
      style={[styles.panel, mobile && styles.panelMobile]}
      contentContainerStyle={styles.panelContent}
      keyboardShouldPersistTaps="handled"
    >
      {navPanel ?? planner}
    </ScrollView>
  );

  const map = (
    <CampusMap
      places={PLACES}
      from={from}
      to={to}
      onPlacePress={onPlacePress}
      route={routeShown}
      highlight={highlight}
      userFix={farAway ? undefined : fix}
      trimRouteToUser={live}
      follow={follow}
      fitTo={fitTo}
      onUserPan={onUserPan}
      // Phone, sheet down: the sheet covers the bottom. Phone, planning: the
      // panel's rounded top overlaps the map by PANEL_OVERLAP.
      bottomInset={sheet ? peekHeight : mobile ? PANEL_OVERLAP : 0}
    />
  );
  // After the user drags the map mid-navigation, offer a way back to following.
  const recenter = navigating && following && cameraFree && user && !farAway && (
    <Pressable
      style={[styles.recenter, sheet && { bottom: peekHeight + 12 }]}
      onPress={() => setCameraFree(false)}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.white} />
      <Text style={styles.recenterText}>Recenter</Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <Header />
      <View style={[styles.body, mobile && styles.bodyMobile]} onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}>
        {sheet ? (
          <>
            {/* The map fills the screen behind the sheet and never changes size
                (a resize mid-zoom would redraw the route off the road); the
                camera keeps the user centered in the part above the sheet. */}
            <View style={StyleSheet.absoluteFill}>
              {map}
              {recenter}
            </View>
            <BottomSheet
              peekContentHeight={peekShown}
              maxHeight={Math.max(bodyHeight * 0.75, 0)}
              expanded={sheetUp}
              onExpandedChange={setSheetUp}
            >
              {navPanel}
            </BottomSheet>
          </>
        ) : mobile ? (
          <>
            <View style={styles.mapMobile}>
              {map}
              {recenter}
            </View>
            {panel}
          </>
        ) : (
          <>
            {panel}
            <View style={styles.map}>
              {map}
              {recenter}
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
  panelMobile: { width: '100%', flex: 1, flexGrow: 1, zIndex: 2, borderRightWidth: 0, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -PANEL_OVERLAP, ...shadow.card },
  panelContent: { padding: 20, gap: 14 },

  map: { flex: 1 },
  recenter: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
    ...shadow.card,
  },
  recenterText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  mapMobile: { height: 340 },

  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { color: colors.navy, fontWeight: '600', fontSize: 14 },

  endpoints: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 5 },
  endpointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  endpointLabel: { width: 38, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  swap: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keaneyTint },
  error: { color: colors.danger, fontSize: 13 },
  learnMore: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  learnMoreTitle: { fontSize: 14, fontWeight: '700', color: colors.navy },
  learnMoreSub: { fontSize: 12, color: colors.textMuted },

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
