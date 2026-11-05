import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RootLayout() {
  // The web map draws its pins with this icon font, so load it before rendering.
  const [loaded] = useFonts(MaterialCommunityIcons.font);
  if (!loaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'RhodyFind' }} />
        <Stack.Screen name="map" options={{ title: 'Map · RhodyFind' }} />
      </Stack>
    </>
  );
}
