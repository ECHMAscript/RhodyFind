import { Image, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_META, type CampusLocation } from '@/data/locations';
import { placePhoto } from '@/data/placeDetails';
import { colors, imageFill } from '@/theme';

/**
 * A small square for a place in a list: its photo when there is one (or the
 * photo of the building a restroom or printer is in), otherwise its icon on a
 * tinted square of the same size, so rows line up either way.
 */
export function PlaceThumb({ place, size = 44 }: { place: CampusLocation; size?: number }) {
  const photo = placePhoto(place.id);
  const box = { width: size, height: size, borderRadius: Math.round(size / 4) };
  if (photo) {
    return (
      <View style={[styles.frame, box]}>
        {/* Filled absolutely: on the web an Image keeps its own aspect ratio otherwise. */}
        <Image source={photo} style={imageFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={[styles.frame, styles.iconBox, box]}>
      <MaterialCommunityIcons
        name={place.icon ?? CATEGORY_META[place.category].icon}
        size={Math.round(size * 0.45)}
        color={colors.navy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.keaneyTint },
  iconBox: { alignItems: 'center', justifyContent: 'center' },
});
