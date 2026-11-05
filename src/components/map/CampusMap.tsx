import { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_META, URI_CENTER } from '@/data/locations';
import { colors } from '@/theme';
import type { CampusMapProps } from './types';

// Native (iOS/Android) map. The web build uses CampusMap.web.tsx instead.
export const CampusMap = memo(function CampusMap({ places, from, to, onPlacePress }: CampusMapProps) {
  const ref = useRef<MapView>(null);

  useEffect(() => {
    const pts = [from, to].filter(Boolean).map((p) => ({ latitude: p!.lat, longitude: p!.lng }));
    if (pts.length) {
      ref.current?.fitToCoordinates(pts, { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true });
    }
  }, [from?.lat, from?.lng, to?.lat, to?.lng]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={{ latitude: URI_CENTER.lat, longitude: URI_CENTER.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
      showsUserLocation
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

      {from && to && (
        <Polyline
          coordinates={[
            { latitude: from.lat, longitude: from.lng },
            { latitude: to.lat, longitude: to.lng },
          ]}
          strokeColor="#1F5FD1"
          strokeWidth={6}
        />
      )}
      {from && <Marker coordinate={{ latitude: from.lat, longitude: from.lng }} pinColor={colors.keaney} />}
      {to && <Marker coordinate={{ latitude: to.lat, longitude: to.lng }} pinColor={colors.danger} />}
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
});
