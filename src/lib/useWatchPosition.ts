import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from './geo';

/** Streams the device position while `enabled` is true (web and native). */
export function useWatchPosition(enabled: boolean) {
  const [position, setPosition] = useState<LatLng>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!enabled) {
      setPosition(undefined);
      return;
    }
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('denied');
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3, timeInterval: 2000 },
          (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        );
        if (cancelled) sub.remove();
        setError(undefined);
      } catch {
        if (!cancelled) setError('Live location is unavailable. Use the arrows to step through the directions.');
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return { position, error };
}
