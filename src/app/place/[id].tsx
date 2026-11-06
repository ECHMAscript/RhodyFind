import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { CATEGORY_META, LOCATION_BY_ID, type IconName } from '@/data/locations';
import { PLACE_DETAILS } from '@/data/placeDetails';
import { breakpoints, colors, radius, shadow } from '@/theme';

const NOT_CONFIRMED = 'Not confirmed yet';

/** "Learn more" about a campus building: photo, floors, bathrooms and more. */
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const compact = width < breakpoints.tablet;
  const place = id ? LOCATION_BY_ID[id] : undefined;
  const details = id ? PLACE_DETAILS[id] : undefined;

  const back = () => (router.canGoBack() ? router.back() : router.replace(place ? `/map?to=${place.id}` : '/'));

  if (!place) {
    return (
      <View style={styles.screen}>
        <Header />
        <View style={[styles.content, compact && styles.contentCompact]}>
          <Text style={styles.title}>Place not found</Text>
          <Pressable style={styles.back} onPress={() => router.replace('/')}>
            <MaterialCommunityIcons name="arrow-left" size={16} color={colors.navy} />
            <Text style={styles.backText}>Back to Search</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const meta = CATEGORY_META[place.category];

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]}>
        <Pressable style={styles.back} onPress={back} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={16} color={colors.navy} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {details?.photo ? (
          <View>
            <Image
              source={details.photo}
              style={styles.photo}
              resizeMode="cover"
              accessibilityLabel={`Photo of ${place.name}`}
            />
            {details.photoCredit && <Text style={styles.credit}>{details.photoCredit}</Text>}
          </View>
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <MaterialCommunityIcons name="office-building" size={56} color={colors.keaney} />
            <Text style={styles.photoEmptyText}>Photo coming soon</Text>
            {details?.photoLink && (
              <Text
                style={styles.photoLink}
                onPress={() => Linking.openURL(details.photoLink!.url)}
                accessibilityRole="link"
              >
                {details.photoLink.label}
              </Text>
            )}
          </View>
        )}

        <View style={styles.heading}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name={meta.icon} size={14} color={colors.navy} />
            <Text style={styles.chipText}>{meta.label}</Text>
          </View>
          <Text style={[styles.title, compact && styles.titleCompact]}>{place.name}</Text>
          <Text style={styles.subtitle}>{details?.address ?? place.subtitle}</Text>
        </View>

        <Pressable
          style={styles.directions}
          onPress={() => router.push(`/map?to=${place.id}`)}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="directions" size={18} color={colors.white} />
          <Text style={styles.directionsText}>Get directions</Text>
        </Pressable>

        {details ? (
          <>
            <Text style={styles.about}>{details.about}</Text>

            <View style={styles.card}>
              <Fact icon="calendar-blank-outline" label="Built" value={details.built} />
              <Fact icon="stairs" label="Floors" value={details.floors} />
              <Fact icon="google-classroom" label="Classrooms" value={details.classrooms} />
              <Fact icon="human-male-female" label="Bathrooms" value={details.bathrooms} />
              <Fact icon="wheelchair-accessibility" label="Elevator & access" value={details.accessibility} last />
            </View>

            {!!details.highlights?.length && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Good to know</Text>
                {details.highlights.map((h) => (
                  <View key={h} style={styles.bullet}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.keaney} />
                    <Text style={styles.bulletText}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sources</Text>
              {details.sources.map((s) => (
                <Text key={s.url} style={styles.source} onPress={() => Linking.openURL(s.url)} accessibilityRole="link">
                  {s.label}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.about}>More details about {place.name} are coming soon.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function Fact({ icon, label, value, last }: { icon: IconName; label: string; value?: string; last?: boolean }) {
  return (
    <View style={[styles.fact, !last && styles.factDivider]}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.navy} />
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, !value && styles.factMissing]}>{value ?? NOT_CONFIRMED}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 32, gap: 18, maxWidth: 760, width: '100%', alignSelf: 'center' },
  contentCompact: { padding: 16 },

  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { color: colors.navy, fontWeight: '600', fontSize: 14 },

  photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: colors.keaneyTint },
  photoEmpty: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoEmptyText: { color: colors.navy, fontWeight: '600', fontSize: 14 },
  photoLink: { color: colors.navy, fontSize: 13, textDecorationLine: 'underline', textAlign: 'center', paddingHorizontal: 16 },
  credit: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  heading: { gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.keaneyTint },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.navy },
  title: { fontSize: 32, fontWeight: '800', color: colors.navy },
  titleCompact: { fontSize: 26 },
  subtitle: { fontSize: 15, color: colors.textMuted },

  directions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, paddingHorizontal: 22, borderRadius: radius.pill, backgroundColor: colors.navy, alignSelf: 'flex-start' },
  directionsText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  about: { fontSize: 15, lineHeight: 23, color: colors.text },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: 16, ...shadow.card },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  factDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  factLabel: { width: 130, fontSize: 14, fontWeight: '700', color: colors.navy },
  factValue: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
  factMissing: { color: colors.textMuted, fontStyle: 'italic' },

  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.navy },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
  source: { fontSize: 13, color: colors.navy, textDecorationLine: 'underline' },
});
