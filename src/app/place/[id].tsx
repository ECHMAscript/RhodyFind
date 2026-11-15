import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { CATEGORY_META, LOCATION_BY_ID, type Category, type IconName } from '@/data/locations';
import { PLACE_DETAILS } from '@/data/placeDetails';
import { breakpoints, colors, imageFill, radius, shadow } from '@/theme';

const NOT_CONFIRMED = 'Not confirmed yet';

// Businesses and services get Hours / Phone / Website rows instead of the
// building rows (built, floors, classrooms).
const SERVICE_CATEGORIES: Category[] = ['dining', 'store', 'worship'];

/** "Learn more" about a campus building: photo, floors, bathrooms and more. */
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const compact = width < breakpoints.tablet;
  const place = id ? LOCATION_BY_ID[id] : undefined;
  const details = id ? PLACE_DETAILS[id] : undefined;
  // The main photo plus any gallery photos; tapping a thumbnail shows it large.
  const photos = details?.gallery ?? (details?.photo ? [{ source: details.photo, caption: '' }] : []);
  const [shown, setShown] = useState(0);
  const current = photos[Math.min(shown, photos.length - 1)];

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

        {details && current ? (
          <View style={styles.photoBlock}>
            <View style={[styles.photo, styles.photoFrame]}>
              <Image
                source={current.source}
                style={imageFill}
                resizeMode="cover"
                accessibilityLabel={current.caption ? `${place.name}: ${current.caption}` : `Photo of ${place.name}`}
              />
              {photos.length > 1 && (
                <View style={styles.photoCount}>
                  <MaterialCommunityIcons name="image-multiple" size={14} color={colors.white} />
                  <Text style={styles.photoCountText}>
                    {Math.min(shown, photos.length - 1) + 1} / {photos.length}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.credit}>
              {current.caption ? <Text style={styles.caption}>{current.caption} · </Text> : null}
              <Text
                onPress={details.photoCreditUrl ? () => Linking.openURL(details.photoCreditUrl!) : undefined}
                accessibilityRole={details.photoCreditUrl ? 'link' : undefined}
              >
                {details.photoCredit}
                {details.photoCreditUrl ? ' · Wikimedia Commons' : ''}
              </Text>
            </Text>
            {photos.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                {photos.map((p, i) => {
                  const active = i === Math.min(shown, photos.length - 1);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setShown(i)}
                      style={[styles.galleryItem, active && styles.galleryItemActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`Show photo ${i + 1}: ${p.caption}`}
                      accessibilityState={{ selected: active }}
                    >
                      <Image source={p.source} style={imageFill} resizeMode="cover" />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
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
            <MaterialCommunityIcons name={place.icon ?? meta.icon} size={14} color={colors.navy} />
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

            {SERVICE_CATEGORIES.includes(place.category) ? (
              <ServiceFacts
                rows={[
                  { icon: 'clock-outline', label: place.category === 'worship' ? 'Friday prayer' : 'Hours', value: details.hours },
                  { icon: 'phone', label: 'Phone', value: details.phone, url: details.phone && `tel:${details.phone.replace(/[^\d+]/g, '')}` },
                  { icon: 'web', label: 'Website', value: details.website?.replace(/^https?:\/\/(www\.)?/, ''), url: details.website },
                  { icon: 'human-male-female', label: 'Bathrooms', value: details.bathrooms },
                  { icon: 'wheelchair-accessibility', label: 'Access', value: details.accessibility },
                ]}
              />
            ) : (
              <View style={styles.card}>
                <Fact icon="calendar-blank-outline" label="Built" value={details.built} />
                <Fact icon="stairs" label="Floors" value={details.floors} />
                <Fact icon="google-classroom" label="Classrooms" value={details.classrooms} />
                <Fact icon="human-male-female" label="Bathrooms" value={details.bathrooms} />
                <Fact icon="wheelchair-accessibility" label="Elevator & access" value={details.accessibility} last />
              </View>
            )}

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
              {details.sources.map((s) =>
                s.url ? (
                  <Text key={s.label} style={styles.source} onPress={() => Linking.openURL(s.url!)} accessibilityRole="link">
                    {s.label}
                  </Text>
                ) : (
                  <Text key={s.label} style={styles.sourcePlain}>
                    {s.label}
                  </Text>
                ),
              )}
            </View>
          </>
        ) : (
          <Text style={styles.about}>More details about {place.name} are coming soon.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
  last,
  url,
}: {
  icon: IconName;
  label: string;
  value?: string;
  last?: boolean;
  /** Makes the value a link (a phone number or website). */
  url?: string;
}) {
  return (
    <View style={[styles.fact, !last && styles.factDivider]}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.navy} />
      <Text style={styles.factLabel}>{label}</Text>
      <Text
        style={[styles.factValue, !value && styles.factMissing, !!(value && url) && styles.factLink]}
        onPress={value && url ? () => Linking.openURL(url) : undefined}
        accessibilityRole={value && url ? 'link' : undefined}
      >
        {value ?? NOT_CONFIRMED}
      </Text>
    </View>
  );
}

/** Hours, phone and website for a business: only the rows we actually know. */
function ServiceFacts({ rows }: { rows: { icon: IconName; label: string; value?: string; url?: string }[] }) {
  const known = rows.filter((r) => r.value);
  if (!known.length) return null;
  return (
    <View style={styles.card}>
      {known.map((r, i) => (
        <Fact key={r.label} {...r} last={i === known.length - 1} />
      ))}
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
  photoFrame: { overflow: 'hidden' },
  photoBlock: { gap: 6 },
  photoCount: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: radius.pill, backgroundColor: 'rgba(4,30,66,0.7)' },
  photoCountText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  caption: { color: colors.text, fontWeight: '600' },
  gallery: { gap: 8, paddingVertical: 2 },
  galleryItem: { width: 72, height: 72, borderRadius: radius.md, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.keaneyTint, opacity: 0.75 },
  galleryItemActive: { borderColor: colors.navy, opacity: 1 },
  factLink: { color: colors.navy, textDecorationLine: 'underline' },
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
  sourcePlain: { fontSize: 13, color: colors.text },
});
