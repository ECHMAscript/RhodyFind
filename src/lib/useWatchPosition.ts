import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { bearingDeg, haversineMeters, type LatLng } from './geo';

export type LiveFix = {
  position: LatLng;
  /** Estimated accuracy radius in meters. */
  accuracy: number;
  /** Direction of travel in degrees (0 = north), when known. */
  heading?: number;
  /** When the fix was taken (ms since epoch). */
  time: number;
};

// Below this much movement, a bearing between two fixes is mostly GPS noise.
const HEADING_MIN_MOVE_M = 3;

/** Streams the device position as fast as the device reports it, while `enabled` is true. */
export function useWatchPosition(enabled: boolean) {
  const [fix, setFix] = useState<LiveFix>();
  const [error, setError] = useState<string>();
  const lastForHeading = useRef<LatLng | undefined>(undefined);
  const lastHeading = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      lastForHeading.current = undefined;
      lastHeading.current = undefined;
      return;
    }
    let cancelled = false;
    const fail = () => {
      if (!cancelled) setError('Live location is unavailable. Use the arrows to step through the directions.');
    };

    const onFix = (
      time: number,
      lat: number,
      lng: number,
      accuracy: number | null,
      heading: number | null,
      speed: number | null,
    ) => {
      if (cancelled) return;
      const position = { lat, lng };
      // Prefer the device's own heading while moving; otherwise derive it from movement.
      if (heading != null && heading >= 0 && !Number.isNaN(heading) && (speed ?? 0) > 0.5) {
        lastHeading.current = heading;
        lastForHeading.current = position;
      } else if (!lastForHeading.current) {
        lastForHeading.current = position;
      } else if (haversineMeters(lastForHeading.current, position) >= HEADING_MIN_MOVE_M) {
        lastHeading.current = bearingDeg(lastForHeading.current, position);
        lastForHeading.current = position;
      }
      setError(undefined);
      setFix({ position, accuracy: accuracy ?? 20, heading: lastHeading.current, time });
    };

    // On the web, talk to the browser directly: no caching, no throttling.
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        fail();
        return;
      }
      const id = navigator.geolocation.watchPosition(
        (p) => onFix(p.timestamp, p.coords.latitude, p.coords.longitude, p.coords.accuracy, p.coords.heading, p.coords.speed),
        fail,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
      );
      return () => {
        cancelled = true;
        navigator.geolocation.clearWatch(id);
        setFix(undefined);
      };
    }

    let sub: Location.LocationSubscription | undefined;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('denied');
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 1, timeInterval: 1000 },
          (p) => onFix(p.timestamp, p.coords.latitude, p.coords.longitude, p.coords.accuracy, p.coords.heading, p.coords.speed),
        );
        if (cancelled) sub.remove();
      } catch {
        fail();
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
      setFix(undefined);
    };
  }, [enabled]);

  return { fix, error };
}
