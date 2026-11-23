import { useMemo, useState, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { CATEGORY_META, LOCATION_BY_ID, type CampusLocation, type Category, type IconName } from '@/data/locations';
import { PHOTOS } from '@/data/photos';
import { menuAverages, menuFor, money } from '@/data/menus';
import type { ParkingInfo } from '@/data/parking';
import { PLACE_DETAILS } from '@/data/placeDetails';
import { encodeEndpoint, fromLocation } from '@/lib/endpoints';
import { formatMiles, travelMinutes } from '@/lib/geo';
import { findRoute } from '@/lib/routing/router';
import { findNearest } from '@/lib/search';
import { breakpoints, colors, imageFill, radius, shadow } from '@/theme';

const NOT_CONFIRMED = 'Not confirmed yet';
// Accent colors for the fact tiles and actions, picked to sit with the Rhody palette.
const ACCENT = { coral: '#F08A5D', teal: '#0F8F7E', orange: '#E2703A', blue: '#2F6FD6', green: '#1E8F55', gold: colors.gold };

// Businesses and services get Hours / Phone / Website tiles instead of the
// building ones (built, floors, classrooms).
// The neon pink of the menu pages, for the buttons that open them.
const MENU_PINK = '#FF2E93';

const SERVICE_CATEGORIES: Category[] = ['dining', 'store', 'worship', 'parking'];

type Tile = { icon: IconName; color: string; label: string; value?: string; url?: string };

/** "Learn more" about a place: photos, key facts, and how to get there. */
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const compact = width < breakpoints.tablet;
  const wide = width >= 980;
  const place = id ? LOCATION_BY_ID[id] : undefined;
  const details = id ? PLACE_DETAILS[id] : undefined;
  const [shareNote, setShareNote] = useState<string>();

  // Nearest parking lot and bathrooms, from the k-d tree (lib/search).
  const nearby = useMemo(() => {
    if (!place) return undefined;
    const lot = findNearest(place, { category: 'parking', k: 1, excludeId: place.id })[0];
    // Real walking time from the lot (A* over the campus paths), not a straight-line guess.
    const lotWalkMin = lot ? (findRoute(lot.location, place, 'walk')?.minutes ?? travelMinutes(lot.meters, 'walk')) : undefined;
    const inside = LOCATION_BY_ID[`restroom-${place.id}`];
    const restroom = inside ? { location: inside, meters: 0 } : findNearest(place, { category: 'restroom', k: 1 })[0];
    return { lot, lotWalkMin, restroom, restroomInside: !!inside };
  }, [place]);

  const menu = id ? menuFor(id) : undefined;
  const averages = useMemo(() => (menu ? menuAverages(menu) : []), [menu]);

  const back = () => (router.canGoBack() ? router.back() : router.replace(place ? `/map?to=${place.id}` : '/'));

  if (!place) {
    return (
      <View style={styles.screen}>
        <Header />
        <View style={[styles.page, compact && styles.pageCompact]}>
          <Text style={styles.title}>Place not found</Text>
          <Pressable style={styles.back} onPress={() => router.replace('/')}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.navy} />
            <Text style={styles.backText}>Back to Search</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const meta = CATEGORY_META[place.category];
  const service = SERVICE_CATEGORIES.includes(place.category);
  const tiles: Tile[] = details
    ? service
      ? [
          { icon: 'clock-outline', color: ACCENT.teal, label: place.category === 'worship' ? 'Friday prayer' : 'Hours', value: details.hours },
          { icon: 'phone', color: ACCENT.orange, label: 'Phone', value: details.phone, url: details.phone && `tel:${details.phone.replace(/[^\d+]/g, '')}` },
          { icon: 'web', color: ACCENT.blue, label: 'Website', value: details.website?.replace(/^https?:\/\/(www\.)?/, ''), url: details.website },
          { icon: 'human-male-female', color: ACCENT.gold, label: 'Bathrooms', value: details.bathrooms },
          { icon: 'wheelchair-accessibility', color: ACCENT.green, label: 'Accessibility', value: details.accessibility },
        ].filter((t) => t.value) as Tile[]
      : [
          { icon: 'calendar-blank-outline', color: ACCENT.teal, label: 'Built', value: details.built },
          { icon: 'stairs', color: ACCENT.orange, label: 'Floors', value: details.floors },
          { icon: 'google-classroom', color: ACCENT.blue, label: 'Classrooms', value: details.classrooms },
          { icon: 'human-male-female', color: ACCENT.gold, label: 'Bathrooms', value: details.bathrooms },
          { icon: 'wheelchair-accessibility', color: ACCENT.green, label: 'Elevator & access', value: details.accessibility },
        ]
    : [];

  const share = async () => {
    const url =
      typeof window !== 'undefined' && window.location ? window.location.href : `https://echmascript.github.io/RhodyFind/place/${place.id}`;
    try {
      await Share.share({ title: place.name, message: `${place.name} on RhodyFind: ${url}`, url });
    } catch {
      // No share sheet (most desktop browsers): copy the link instead.
      try {
        await navigator.clipboard.writeText(url);
        setShareNote('Link copied');
      } catch {
        setShareNote(url);
      }
      setTimeout(() => setShareNote(undefined), 2500);
    }
  };

  const walkFromTo = (from: CampusLocation, to: CampusLocation) =>
    router.push({ pathname: '/map', params: { from: encodeEndpoint(fromLocation(from)), to: encodeEndpoint(fromLocation(to)), mode: 'walk' } });

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Banner compact={compact} />

        <View style={[styles.page, compact && styles.pageCompact]}>
          <Pressable style={styles.back} onPress={back} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.navy} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          {/* Hero: photos on one side, the essentials on the other */}
          <View style={[styles.card, styles.hero, wide && styles.heroWide, compact && styles.cardCompact]}>
            <View style={wide ? styles.heroPhotos : undefined}>
              <Gallery
                name={place.name}
                photos={details?.gallery ?? (details?.photo ? [{ source: details.photo, caption: '' }] : [])}
                credit={details?.photoCredit}
                creditUrl={details?.photoCreditUrl}
                photoLink={details?.photoLink}
              />
            </View>

            <View style={[styles.heroInfo, wide && styles.heroInfoWide]}>
              <View style={styles.chip}>
                <MaterialCommunityIcons name={place.icon ?? meta.icon} size={16} color={colors.navy} />
                <Text style={styles.chipText}>{meta.label}</Text>
              </View>
              <View>
                <Text style={[styles.title, compact && styles.titleCompact]}>{place.name}</Text>
                <View style={styles.titleAccent} />
              </View>
              <View style={styles.addressRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.navy} />
                <Text style={styles.address}>{details?.address ?? place.subtitle}</Text>
              </View>

              <View style={styles.buttons}>
                <Pressable
                  style={({ hovered }: any) => [styles.directions, hovered && styles.directionsHover]}
                  onPress={() => router.push(`/map?to=${place.id}`)}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="navigation-variant" size={18} color={colors.white} />
                  <Text style={styles.directionsText}>Get directions</Text>
                </Pressable>
                <Pressable
                  style={({ hovered }: any) => [styles.iconButton, hovered && styles.iconButtonHover]}
                  onPress={share}
                  accessibilityRole="button"
                  accessibilityLabel={`Share ${place.name}`}
                >
                  <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.navy} />
                </Pressable>
                {menu && (
                  <Pressable
                    style={({ hovered }: any) => [styles.menuButton, hovered && styles.menuButtonHover]}
                    onPress={() => router.push(`/menu/${place.id}`)}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={MENU_PINK} />
                    <Text style={styles.menuButtonText}>View menu</Text>
                  </Pressable>
                )}
                {shareNote && <Text style={styles.shareNote}>{shareNote}</Text>}
              </View>

              <View style={styles.about}>
                <Text style={styles.aboutText}>{details?.about ?? `More details about ${place.name} are coming soon.`}</Text>
              </View>

              {tiles.length > 0 && (
                <View style={styles.tiles}>
                  {tiles.map((t) => (
                    <FactTile key={t.label} tile={t} />
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Average prices, from the transcribed menu */}
          {menu && averages.length > 0 && (
            <View style={[styles.card, styles.pricesCard, compact && styles.cardCompact]}>
              <View style={styles.pricesHead}>
                <View style={{ flex: 1, minWidth: 200, gap: 2 }}>
                  <Text style={styles.cardTitle}>Average prices</Text>
                  <Text style={styles.pricesSub}>
                    Each item counted once at its base price (e.g. the plain sub, not the combo), before tax.
                  </Text>
                </View>
                <Pressable
                  style={({ hovered }: any) => [styles.menuButton, hovered && styles.menuButtonHover]}
                  onPress={() => router.push(`/menu/${place.id}`)}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="book-open-page-variant-outline" size={18} color={MENU_PINK} />
                  <Text style={styles.menuButtonText}>Full menu</Text>
                </Pressable>
              </View>
              <View style={styles.prices}>
                {averages.map((a) => (
                  <View key={a.label} style={styles.price}>
                    <Text style={styles.priceLabel}>{a.label}</Text>
                    <Text style={styles.priceValue}>{money(a.average)}</Text>
                    <Text style={styles.priceRange}>
                      {money(a.low)}–{money(a.high)} · {a.count} items
                    </Text>
                    {a.note && <Text style={styles.priceNote}>{a.note}</Text>}
                  </View>
                ))}
              </View>
              <Text style={styles.credit}>{menu.source}. Prices may have changed.</Text>
            </View>
          )}

          {details?.parking && <ParkingCard info={details.parking} compact={compact} />}

          {/* Getting there */}
          <View style={[styles.card, styles.locationCard, wide && styles.locationCardWide, compact && styles.cardCompact]}>
            <View style={[styles.locationMain, wide && styles.locationMainWide]}>
              <MiniMap place={place} wide={wide} />
              <View style={[styles.locationText, wide && styles.locationTextWide]}>
                <Text style={styles.cardTitle}>Location</Text>
                <Text style={styles.locationAddress}>{details?.address ?? place.subtitle}</Text>
              </View>
            </View>
            <View style={[styles.actions, wide && styles.actionsWide]}>
              <ActionTile
                icon="directions"
                color={ACCENT.teal}
                title="Directions"
                subtitle="Walk, bike or drive"
                detail="Open in the map"
                onPress={() => router.push(`/map?to=${place.id}`)}
              />
              {nearby?.lot && (
                <ActionTile
                  icon="parking"
                  color={ACCENT.blue}
                  title="Parking"
                  subtitle={nearby.lot.location.name}
                  detail={`${nearby.lotWalkMin} min walk from the lot`}
                  onPress={() => walkFromTo(nearby.lot!.location, place)}
                />
              )}
              {nearby?.restroom && (
                <ActionTile
                  icon="human-male-female"
                  color={ACCENT.coral}
                  title="Bathrooms"
                  subtitle={
                    nearby.restroomInside
                      ? 'In this building'
                      : ((nearby.restroom.location.building && LOCATION_BY_ID[nearby.restroom.location.building]?.name) ??
                        nearby.restroom.location.name)
                  }
                  detail={nearby.restroomInside ? nearby.restroom.location.subtitle : `${formatMiles(nearby.restroom.meters)} away`}
                  onPress={() =>
                    nearby.restroomInside
                      ? router.push(`/map?to=${nearby.restroom!.location.id}`)
                      : walkFromTo(place, nearby.restroom!.location)
                  }
                />
              )}
            </View>
          </View>

          {/* Good to know + sources */}
          {details && (
            <View style={[styles.card, styles.moreCard, wide && styles.moreCardWide, compact && styles.cardCompact]}>
              {!!details.highlights?.length && (
                <Section title="Good to know" icon="lightbulb-on-outline" style={wide ? { flex: 1.3 } : undefined}>
                  {details.highlights.map((h) => (
                    <View key={h} style={styles.bullet}>
                      <View style={styles.bulletDot}>
                        <MaterialCommunityIcons name="check" size={13} color={colors.white} />
                      </View>
                      <Text style={styles.bulletText}>{h}</Text>
                    </View>
                  ))}
                </Section>
              )}
              <Section title="Sources" icon="book-open-variant" style={wide ? { flex: 1 } : undefined}>
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
                <Text style={styles.bannerCredit}>
                  Banner photo: The Quad ({PHOTOS.quad.credit}) · Map tiles © OpenStreetMap contributors
                </Text>
              </Section>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** A soft photo of the Quad fading into the page, with Keaney-blue waves. */
function Banner({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.banner, compact && styles.bannerCompact]} pointerEvents="none">
      <Image source={PHOTOS.quad.source} style={[imageFill, styles.bannerPhoto]} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(234,243,252,0.55)', 'rgba(234,243,252,0.85)', colors.background]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.wave, styles.waveOne]} />
      <View style={[styles.wave, styles.waveTwo]} />
    </View>
  );
}

function Gallery({
  name,
  photos,
  credit,
  creditUrl,
  photoLink,
}: {
  name: string;
  photos: { source: ImageSourcePropType; caption: string }[];
  credit?: string;
  creditUrl?: string;
  photoLink?: { label: string; url: string };
}) {
  const [shown, setShown] = useState(0);
  if (!photos.length) {
    return (
      <View style={[styles.mainPhoto, styles.photoEmpty]}>
        <MaterialCommunityIcons name="image-filter-hdr" size={52} color={colors.keaney} />
        <Text style={styles.photoEmptyText}>Photo coming soon</Text>
        {photoLink && (
          <Text style={styles.photoLink} onPress={() => Linking.openURL(photoLink.url)} accessibilityRole="link">
            {photoLink.label}
          </Text>
        )}
      </View>
    );
  }
  const i = Math.min(shown, photos.length - 1);
  const current = photos[i];
  const go = (d: number) => setShown((i + d + photos.length) % photos.length);
  return (
    <View style={styles.galleryBlock}>
      <View style={styles.mainPhoto}>
        <Image
          source={current.source}
          style={imageFill}
          resizeMode="cover"
          accessibilityLabel={current.caption ? `${name}: ${current.caption}` : `Photo of ${name}`}
        />
        {photos.length > 1 && (
          <View style={styles.photoCount}>
            <MaterialCommunityIcons name="image-multiple-outline" size={15} color={colors.white} />
            <Text style={styles.photoCountText}>
              {i + 1} / {photos.length}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.credit} numberOfLines={2}>
        {current.caption ? <Text style={styles.caption}>{current.caption} · </Text> : null}
        <Text
          onPress={creditUrl ? () => Linking.openURL(creditUrl) : undefined}
          accessibilityRole={creditUrl ? 'link' : undefined}
        >
          {credit}
          {creditUrl ? ' · Wikimedia Commons' : ''}
        </Text>
      </Text>
      {photos.length > 1 && (
        <View style={styles.thumbRow}>
          <RoundButton icon="chevron-left" label="Previous photo" onPress={() => go(-1)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs} style={{ flex: 1 }}>
            {photos.map((p, j) => (
              <Pressable
                key={j}
                onPress={() => setShown(j)}
                style={[styles.thumb, j === i && styles.thumbActive]}
                accessibilityRole="button"
                accessibilityLabel={`Show photo ${j + 1}${p.caption ? `: ${p.caption}` : ''}`}
                accessibilityState={{ selected: j === i }}
              >
                <Image source={p.source} style={imageFill} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
          <RoundButton icon="chevron-right" label="Next photo" onPress={() => go(1)} />
        </View>
      )}
    </View>
  );
}

function RoundButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => [styles.round, hovered && styles.iconButtonHover]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colors.navy} />
    </Pressable>
  );
}

function FactTile({ tile }: { tile: Tile }) {
  const link = !!(tile.value && tile.url);
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${tile.color}1A` }]}>
        <MaterialCommunityIcons name={tile.icon} size={22} color={tile.color} />
      </View>
      <Text style={styles.tileLabel}>{tile.label}</Text>
      <Text
        style={[styles.tileValue, !tile.value && styles.tileMissing, link && styles.tileLink]}
        onPress={link ? () => Linking.openURL(tile.url!) : undefined}
        accessibilityRole={link ? 'link' : undefined}
      >
        {tile.value ?? NOT_CONFIRMED}
      </Text>
    </View>
  );
}

function ActionTile({
  icon,
  color,
  title,
  subtitle,
  detail,
  onPress,
}: {
  icon: IconName;
  color: string;
  title: string;
  subtitle: string;
  /** A second short line, e.g. the distance. */
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => [styles.action, { backgroundColor: `${color}12` }, hovered && { backgroundColor: `${color}22` }]}
      accessibilityRole="button"
    >
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub} numberOfLines={1}>
          {subtitle}
        </Text>
        {detail && (
          <Text style={styles.actionDetail} numberOfLines={1}>
            {detail}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.navy} />
    </Pressable>
  );
}

function Section({ title, icon, style, children }: { title: string; icon: IconName; style?: object; children: ReactNode }) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.keaney} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/**
 * A small, non-interactive map of where the place is: OpenStreetMap tiles
 * around the point (3 x 3 at zoom 17), shifted so the point sits in the middle.
 */
function MiniMap({ place, wide }: { place: CampusLocation; wide: boolean }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const Z = 17;
  const n = 2 ** Z;
  const xt = ((place.lng + 180) / 360) * n;
  const latRad = (place.lat * Math.PI) / 180;
  const yt = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const ix = Math.floor(xt);
  const iy = Math.floor(yt);
  const offX = size.w / 2 - (xt - ix) * 256;
  const offY = size.h / 2 - (yt - iy) * 256;
  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push(
        <Image
          key={`${dx},${dy}`}
          source={{ uri: `https://tile.openstreetmap.org/${Z}/${ix + dx}/${iy + dy}.png` }}
          style={{ position: 'absolute', width: 256, height: 256, left: offX + dx * 256, top: offY + dy * 256 }}
        />,
      );
    }
  }
  return (
    <View
      style={[styles.miniMap, wide && styles.miniMapWide]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      accessibilityLabel={`Map showing where ${place.name} is`}
    >
      {size.w > 0 && tiles}
      <View style={styles.miniPin}>
        <View style={styles.miniPinHead}>
          <MaterialCommunityIcons name={place.icon ?? CATEGORY_META[place.category].icon} size={18} color={colors.white} />
        </View>
        <View style={styles.miniPinTip} />
      </View>
    </View>
  );
}

const PAID_PINK = '#D81B7A';

/** A parking lot's rates, how to pay, and its rules. */
function ParkingCard({ info, compact }: { info: ParkingInfo; compact: boolean }) {
  return (
    <View style={[styles.card, styles.pricesCard, compact && styles.cardCompact]}>
      <View style={styles.pricesHead}>
        <View style={{ flex: 1, minWidth: 200, gap: 8 }}>
          <Text style={styles.cardTitle}>Parking here</Text>
          <View style={styles.parkFacts}>
            <View style={[styles.parkChip, info.rates && styles.parkChipPaid]}>
              <MaterialCommunityIcons name={info.rates ? 'cash-clock' : 'store-outline'} size={16} color={info.rates ? PAID_PINK : colors.navy} />
              <Text style={[styles.parkChipText, info.rates && { color: PAID_PINK }]}>{info.access}</Text>
            </View>
            {info.spaces !== undefined && (
              <View style={styles.parkChip}>
                <MaterialCommunityIcons name="car-multiple" size={16} color={colors.navy} />
                <Text style={styles.parkChipText}>{info.spaces} spaces</Text>
              </View>
            )}
            {info.operator && (
              <View style={styles.parkChip}>
                <MaterialCommunityIcons name="domain" size={16} color={colors.navy} />
                <Text style={styles.parkChipText}>Run by {info.operator}</Text>
              </View>
            )}
          </View>
        </View>
        {info.payUrl && (
          <Pressable
            style={({ hovered }: any) => [styles.payButton, hovered && { opacity: 0.9 }]}
            onPress={() => Linking.openURL(info.payUrl!)}
            accessibilityRole="link"
          >
            <MaterialCommunityIcons name="cellphone-check" size={18} color={colors.white} />
            <Text style={styles.payButtonText}>Pay online</Text>
          </Pressable>
        )}
      </View>

      {info.rates && (
        <>
          <Text style={styles.parkHeading}>Cost</Text>
          <View style={styles.prices}>
            {info.rates.map((r) => (
              <View key={r.label} style={[styles.price, styles.rate]}>
                <Text style={styles.priceLabel}>Up to {r.label}</Text>
                <Text style={styles.priceValue}>{money(r.price)}</Text>
                <Text style={styles.priceRange}>{money(r.total)} with fees & tax</Text>
              </View>
            ))}
          </View>
          {info.rateNotes?.map((n) => (
            <Text key={n} style={styles.pricesSub}>
              {n}
            </Text>
          ))}
        </>
      )}

      {info.payment && (
        <>
          <Text style={styles.parkHeading}>How to pay</Text>
          <View style={{ gap: 8 }}>
            {info.payment.map((step, i) => (
              <View key={step} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {info.rules && (
        <View style={styles.parkRules}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.parkRulesTitle}>Before you leave the car</Text>
            {info.rules.map((r) => (
              <Text key={r} style={styles.parkRule}>
                {'\u2022'} {r}
              </Text>
            ))}
          </View>
        </View>
      )}
      {info.checked && <Text style={styles.credit}>{info.checked}. Prices can change; the sign and checkout have the final word.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },

  banner: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, overflow: 'hidden' },
  bannerCompact: { height: 220 },
  bannerPhoto: { opacity: 0.35 },
  wave: { position: 'absolute', borderRadius: 9999, borderWidth: 28, borderColor: 'rgba(104,171,232,0.16)' },
  waveOne: { width: 900, height: 900, right: -420, top: -640 },
  waveTwo: { width: 700, height: 700, left: -380, top: -520, borderColor: 'rgba(104,171,232,0.10)' },

  page: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 20, gap: 20 },
  pageCompact: { paddingHorizontal: 14, paddingTop: 14, gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: colors.navy, fontWeight: '700', fontSize: 15 },

  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 24, ...shadow.card },
  cardCompact: { padding: 14, borderRadius: radius.lg },

  hero: { gap: 22 },
  heroWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 32 },
  heroPhotos: { flex: 1.1 },
  heroInfo: { gap: 14 },
  heroInfoWide: { flex: 1, paddingTop: 4 },

  galleryBlock: { gap: 8 },
  mainPhoto: { width: '100%', aspectRatio: 16 / 10, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.keaneyTint },
  photoEmpty: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoEmptyText: { color: colors.navy, fontWeight: '700', fontSize: 15 },
  photoLink: { color: colors.navy, fontSize: 13, textDecorationLine: 'underline', textAlign: 'center', paddingHorizontal: 16 },
  photoCount: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 28, borderRadius: radius.pill, backgroundColor: 'rgba(4,30,66,0.72)' },
  photoCountText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  credit: { fontSize: 11, color: colors.textMuted },
  caption: { color: colors.text, fontWeight: '700' },
  thumbRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  thumbs: { gap: 10, paddingVertical: 3, paddingHorizontal: 2 },
  thumb: { width: 96, height: 68, borderRadius: radius.md, overflow: 'hidden', borderWidth: 2.5, borderColor: 'transparent', backgroundColor: colors.keaneyTint, opacity: 0.7 },
  thumbActive: { borderColor: colors.navy, opacity: 1 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keaneyTint },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 14, height: 34, borderRadius: radius.pill, backgroundColor: colors.keaneyTint },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.navy },
  title: { fontSize: 40, lineHeight: 46, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  titleCompact: { fontSize: 30, lineHeight: 36 },
  titleAccent: { width: 72, height: 5, borderRadius: 3, backgroundColor: ACCENT.coral, marginTop: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  address: { flex: 1, fontSize: 16, lineHeight: 22, color: colors.text },

  buttons: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  directions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 50, paddingHorizontal: 30, borderRadius: radius.pill, backgroundColor: colors.navy, ...shadow.card, shadowOpacity: 0.18 },
  directionsHover: { backgroundColor: colors.navySoft },
  directionsText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  iconButton: { width: 50, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keaneyTint },
  iconButtonHover: { backgroundColor: '#D6E8FA' },
  menuButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 20, borderRadius: radius.pill, backgroundColor: '#111', borderWidth: 2, borderColor: MENU_PINK },
  menuButtonHover: { backgroundColor: '#222' },
  menuButtonText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  pricesCard: { gap: 14 },
  parkFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  parkChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: '#F3F8FE' },
  parkChipPaid: { backgroundColor: '#FDE8F2' },
  parkChipText: { fontSize: 13, fontWeight: '700', color: colors.navy },
  parkHeading: { fontSize: 16, fontWeight: '800', color: colors.navy, marginTop: 4 },
  rate: { flexBasis: 120, minWidth: 110, borderTopWidth: 3, borderTopColor: PAID_PINK },
  payButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 20, borderRadius: radius.pill, backgroundColor: PAID_PINK },
  payButtonText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.text, paddingTop: 2 },
  parkRules: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#F7C9CB' },
  parkRulesTitle: { fontSize: 15, fontWeight: '800', color: colors.navy },
  parkRule: { fontSize: 14, lineHeight: 20, color: colors.text },
  pricesHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  pricesSub: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  prices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  price: { flexGrow: 1, flexBasis: 150, minWidth: 140, gap: 2, padding: 14, borderRadius: radius.lg, backgroundColor: '#F3F8FE' },
  priceLabel: { fontSize: 14, fontWeight: '800', color: colors.navy },
  priceValue: { fontSize: 28, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  priceRange: { fontSize: 12, color: colors.textMuted },
  priceNote: { fontSize: 12, fontWeight: '700', color: ACCENT.teal, marginTop: 2 },
  shareNote: { fontSize: 13, fontWeight: '600', color: ACCENT.green },

  about: { borderLeftWidth: 3, borderLeftColor: colors.keaney, paddingLeft: 14, paddingVertical: 2 },
  aboutText: { fontSize: 15, lineHeight: 23, color: colors.text },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: '#F3F8FE' },
  tile: { flexGrow: 1, flexBasis: 130, minWidth: 130, gap: 4, padding: 10, borderRadius: radius.md, backgroundColor: colors.white },
  tileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  tileLabel: { fontSize: 14, fontWeight: '800', color: colors.navy },
  tileValue: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  tileMissing: { fontStyle: 'italic', color: colors.gray },
  tileLink: { color: colors.navy, textDecorationLine: 'underline', fontWeight: '600' },

  locationCard: { gap: 16 },
  locationCardWide: { gap: 18 },
  locationMain: { gap: 12 },
  locationMainWide: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  locationText: { gap: 4, flexShrink: 1 },
  locationTextWide: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.navy },
  locationAddress: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  miniMapWide: { width: 280 },
  miniMap: { width: '100%', maxWidth: 300, height: 120, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.keaneyTint, alignItems: 'center', justifyContent: 'center' },
  miniPin: { alignItems: 'center', marginTop: -30 },
  miniPinHead: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy, borderWidth: 3, borderColor: colors.white },
  miniPinTip: { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.navy, marginTop: -2 },
  actions: { gap: 10 },
  actionsWide: { flexDirection: 'row', flex: 1 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, minHeight: 64 },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '800', color: colors.navy },
  actionSub: { fontSize: 13, color: colors.text },
  actionDetail: { fontSize: 12, color: colors.textMuted },

  moreCard: { gap: 24 },
  moreCardWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 40 },
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.navy },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keaney, marginTop: 1 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.text },
  source: { fontSize: 13, lineHeight: 19, color: colors.navy, textDecorationLine: 'underline' },
  sourcePlain: { fontSize: 13, lineHeight: 19, color: colors.text },
  bannerCredit: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});
