import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from './geo';

type State =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ok'; coords: LatLng }
  | { status: 'error'; message: string };

/** Asks for permission and reads the device position once (works on web and native). */
export function useCurrentLocation() {
  const [state, setState] = useState<State>({ status: 'idle' });

  const locate = useCallback(async (): Promise<LatLng | null> => {
    setState({ status: 'locating' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ status: 'error', message: 'Location permission was denied. Choose where you are instead.' });
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setState({ status: 'ok', coords });
      return coords;
    } catch {
      setState({ status: 'error', message: 'Could not get your location. Choose where you are instead.' });
      return null;
    }
  }, []);

  return { state, locate };
}
