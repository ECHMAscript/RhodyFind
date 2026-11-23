import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { haversineMeters, type LatLng } from './geo';
import { createHeadingFilter } from './heading';

export type LiveFix = {
  position: LatLng;
  /** Estimated accuracy radius in meters. */
  accuracy: number;
  /** Direction of travel in degrees (0 = north), when known. */
  heading?: number;
  /** Speed in meters per second, when known. */
  speed?: number;
  /** When the fix was taken (ms since epoch). */
  time: number;
  /** When the app received it (Date.now() clock), for animating between fixes. */
  receivedAt: number;
};

/**
 * Streams the device position as fast as the device reports it, while
 * `enabled` is true. Phones produce about one GPS fix per second, whatever is
 * requested; the map animates between fixes (see lib/motion.ts).
 */
export function useWatchPosition(enabled: boolean) {
  const [fix, setFix] = useState<LiveFix>();
  const [error, setError] = useState<string>();
  // Steady direction of travel from noisy fixes (lib/heading.ts).
  const [headingFilter] = useState(createHeadingFilter);
  const lastFix = useRef<{ position: LatLng; time: number } | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      lastFix.current = undefined;
      headingFilter.reset();
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
      // The device's own course when moving, else fitted from recent fixes;
      // a single stray fix can't flip it.
      const direction = headingFilter.update(position, time, heading, speed);
      // The device's speed if it gives one, else distance over time since the last fix.
      let metersPerSecond = speed != null && speed >= 0 && !Number.isNaN(speed) ? speed : undefined;
      const prev = lastFix.current;
      if (metersPerSecond === undefined && prev && time - prev.time >= 300 && time - prev.time <= 5000) {
        metersPerSecond = haversineMeters(prev.position, position) / ((time - prev.time) / 1000);
      }
      lastFix.current = { position, time };
      setError(undefined);
      setFix({
        position,
        accuracy: accuracy ?? 20,
        heading: direction,
        speed: metersPerSecond,
        time,
        receivedAt: Date.now(),
      });
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
          // As often as the hardware allows (about once a second on most phones).
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 0, timeInterval: 250 },
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
  }, [enabled, headingFilter]);

  return { fix, error };
}
