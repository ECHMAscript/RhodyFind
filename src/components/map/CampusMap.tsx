import { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_META, URI_CENTER } from '@/data/locations';
import type { LatLng } from '@/lib/geo';
import { colors } from '@/theme';
import type { CampusMapProps } from './types';

const toCoord = (p: LatLng) => ({ latitude: p.lat, longitude: p.lng });

// Native (iOS/Android) map. The web build uses CampusMap.web.tsx instead.
const FOLLOW_ZOOM = 18;

export const CampusMap = memo(function CampusMap({
  places,
  from,
  to,
  onPlacePress,
  route,
  highlight,
  userFix,
  follow = false,
  fitTo,
  onUserPan,
  bottomInset = 0,
}: CampusMapProps) {
  const user = userFix?.position;
  const heading = userFix?.heading;
  const followUser = follow ? user : undefined;
  const ref = useRef<MapView>(null);
  const following = useRef(false);

  // Live navigation: keep the camera on the user, zooming in on the first fix only.
  useEffect(() => {
    if (!followUser) {
      following.current = false;
      return;
    }
    const center = toCoord(followUser);
    // Glide for about the time until the next fix (~1 s), so the camera never stops between fixes.
    ref.current?.animateCamera(following.current ? { center } : { center, zoom: FOLLOW_ZOOM }, { duration: 950 });
    following.current = true;
  }, [followUser]);

  const frame = useMemo(
    () => (fitTo ?? ([from, to].filter(Boolean) as LatLng[])).map(toCoord),
    [fitTo, from?.lat, from?.lng, to?.lat, to?.lng],
  );
  useEffect(() => {
    if (frame.length && !following.current) {
      ref.current?.fitToCoordinates(frame, { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true });
    }
  }, [frame]);

  const path = useMemo(
    () => (route ? route.map(toCoord) : from && to ? [toCoord(from), toCoord(to)] : undefined),
    [route, from?.lat, from?.lng, to?.lat, to?.lng],
  );
  const highlightPath = useMemo(() => highlight?.map(toCoord), [highlight]);

  return (
    <MapView
      // Covered strip at the bottom (the directions sheet): the map centers and
      // fits within the part above it.
      mapPadding={{ top: 0, right: 0, bottom: bottomInset, left: 0 }}
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={{ latitude: URI_CENTER.lat, longitude: URI_CENTER.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
      showsUserLocation={!user}
      showsPointsOfInterests={false}
      onPanDrag={followUser ? onUserPan : undefined}
    >
      {places.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat, longitude: p.lng }}
          title={p.name}
          description={p.subtitle}
          onPress={() => onPlacePress?.(p)}
          tracksViewChanges={false}
        >
          <View style={[styles.badge, p.major && styles.badgeMajor]}>
            <MaterialCommunityIcons
              name={CATEGORY_META[p.category].icon}
              size={p.major ? 20 : 16}
              color={p.major ? colors.white : colors.navy}
            />
          </View>
        </Marker>
      ))}

      {path && <Polyline coordinates={path} strokeColor={highlightPath ? 'rgba(31,95,209,0.35)' : '#1F5FD1'} strokeWidth={6} />}
      {highlightPath && <Polyline coordinates={highlightPath} strokeColor={colors.navy} strokeWidth={8} />}
      {from && <Marker coordinate={toCoord(from)} pinColor={colors.keaney} />}
      {to && <Marker coordinate={toCoord(to)} pinColor={colors.danger} />}
      {user && (
        <Marker
          // tracksViewChanges is off, so swap the marker when the dot becomes an arrow.
          key={heading === undefined ? 'user-dot' : 'user-arrow'}
          coordinate={toCoord(user)}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          rotation={heading ?? 0}
          tracksViewChanges={false}
        >
          {heading === undefined ? (
            <View style={styles.user} />
          ) : (
            <MaterialCommunityIcons name="navigation" size={30} color="#1F5FD1" />
          )}
        </Marker>
      )}
    </MapView>
  );
});

const styles = StyleSheet.create({
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMajor: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.navy },
  user: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#1F5FD1', borderWidth: 3, borderColor: colors.white },
});
