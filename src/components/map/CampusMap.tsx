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
export const CampusMap = memo(function CampusMap({ places, from, to, onPlacePress, route, highlight, user, fitTo }: CampusMapProps) {
  const ref = useRef<MapView>(null);

  const frame = useMemo(
    () => (fitTo ?? ([from, to].filter(Boolean) as LatLng[])).map(toCoord),
    [fitTo, from?.lat, from?.lng, to?.lat, to?.lng],
  );
  useEffect(() => {
    if (frame.length) {
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
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={{ latitude: URI_CENTER.lat, longitude: URI_CENTER.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
      showsUserLocation={!user}
      showsPointsOfInterests={false}
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
        <Marker coordinate={toCoord(user)} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.user} />
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
