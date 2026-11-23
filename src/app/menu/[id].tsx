import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import type { IconName } from '@/data/locations';
import { itemOptions, menuAverages, menuFor, money, type Menu, type MenuItem, type MenuOption, type MenuSection } from '@/data/menus';
import { PHOTOS } from '@/data/photos';
import { PLACE_DETAILS } from '@/data/placeDetails';
import { breakpoints, colors, imageFill, radius, shadow } from '@/theme';

// The board's neon pink and cyan, deepened enough to read on white. They keep
// a bit of the real menu's look inside the site's navy-and-Keaney design.
const PINK = '#D81B7A';
const PINK_GLOW = '#FF2E93';
const CYAN = '#1BB5D3';
const CYAN_GLOW = '#3FE0F5';
const SERIF = Platform.select({ web: 'Georgia, "Times New Roman", serif', default: undefined });

type OrderLine = { key: string; name: string; option: string; price: number; qty: number };
type AddFn = (item: MenuItem, option: MenuOption) => void;
type Featured = { label: string; blurb?: string; item: MenuItem; section: MenuSection };

/** A restaurant's menu in the RhodyFind style, with a running order estimate. */
export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const menu = id ? menuFor(id) : undefined;
  const details = id ? PLACE_DETAILS[id] : undefined;
  const { width } = useWindowDimensions();
  const compact = width < breakpoints.tablet;
  const wide = width >= 1000;

  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<OrderLine[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [active, setActive] = useState<string>();
  const [stickyHeight, setStickyHeight] = useState(0);

  // Section tabs: sections are measured on screen to scroll to them, and to
  // light up the tab of the one being read.
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const frame = useRef<ComponentRef<typeof View>>(null);
  const tabsScroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionRefs = useRef<Record<string, ComponentRef<typeof View> | null>>({});
  const tabX = useRef<Record<string, number>>({});
  const offset = useRef(0);
  const measuring = useRef(false);

  const averages = useMemo(() => (menu ? menuAverages(menu) : []), [menu]);

  const sections = useMemo(() => {
    if (!menu) return [];
    const q = query.trim().toLowerCase();
    if (!q) return menu.sections;
    return menu.sections
      .map((s) => ({ ...s, items: s.items.filter((i) => `${i.name} ${i.desc ?? ''} ${s.title}`.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length);
  }, [menu, query]);

  const featured = useMemo<Featured[]>(
    () =>
      (menu?.featured ?? []).flatMap((f) => {
        const section = menu!.sections.find((s) => s.id === f.section);
        const item = section?.items.find((i) => i.name === f.item);
        return section && item ? [{ label: f.label, blurb: f.blurb, section, item }] : [];
      }),
    [menu],
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace(id ? `/place/${id}` : '/'));

  if (!menu) {
    return (
      <View style={styles.screen}>
        <Header />
        <View style={[styles.page, { paddingTop: 40, gap: 12 }]}>
          <Text style={styles.sectionTitle}>No menu yet</Text>
          <Pressable onPress={back} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.navy} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const add: AddFn = (item, option) => {
    const key = `${item.name}|${option.label}`;
    setOrder((o) =>
      o.some((l) => l.key === key)
        ? o.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
        : [...o, { key, name: item.name, option: option.label, price: option.price, qty: 1 }],
    );
  };
  const change = (key: string, by: number) =>
    setOrder((o) => o.map((l) => (l.key === key ? { ...l, qty: l.qty + by } : l)).filter((l) => l.qty > 0));
  const countOf = (item: MenuItem) => order.filter((l) => l.name === item.name).reduce((n, l) => n + l.qty, 0);
  const countOfOption = (item: MenuItem, label: string) => order.find((l) => l.key === `${item.name}|${label}`)?.qty ?? 0;
  const count = order.reduce((n, l) => n + l.qty, 0);
  const total = order.reduce((n, l) => n + l.qty * l.price, 0);
  const phoneUrl = menu.phone && `tel:${menu.phone.replace(/[^\d+]/g, '')}`;

  const jump = (sectionId: string) => {
    setActive(sectionId);
    setQuery('');
    // Give a cleared search a moment to lay the full menu out again.
    setTimeout(
      () => {
        const node = sectionRefs.current[sectionId];
        if (!node || !frame.current) return;
        frame.current.measureInWindow((_fx, frameTop) =>
          node.measureInWindow((_x, y) => {
            scroll.current?.scrollTo({ y: Math.max(0, offset.current + (y - frameTop) - stickyHeight - 12), animated: true });
          }),
        );
      },
      query ? 60 : 0,
    );
  };

  // Light up the tab of the section at the top of the screen.
  const trackActive = () => {
    if (measuring.current || !frame.current || !sections.length) return;
    measuring.current = true;
    frame.current.measureInWindow((_fx, frameTop) => {
      const line = frameTop + stickyHeight + 40;
      const nodes = sections.map((s) => [s.id, sectionRefs.current[s.id]] as const).filter(([, n]) => n);
      if (!nodes.length) {
        measuring.current = false;
        return;
      }
      const tops: Record<string, number> = {};
      let pending = nodes.length;
      for (const [sid, node] of nodes) {
        node!.measureInWindow((_x, y) => {
          tops[sid] = y;
          if (--pending > 0) return;
          let current = nodes[0][0];
          for (const [s] of nodes) if (tops[s] <= line) current = s;
          measuring.current = false;
          setActive((a) => {
            if (a !== current && tabX.current[current] !== undefined) {
              tabsScroll.current?.scrollTo({ x: Math.max(0, tabX.current[current] - 24), animated: true });
            }
            return current;
          });
        });
      }
    });
  };

  const orderPanel = (
    <OrderPanel order={order} total={total} count={count} onChange={change} onClear={() => setOrder([])} phoneUrl={phoneUrl} />
  );
  const activeId = active ?? menu.sections[0].id;

  return (
    <View style={styles.screen}>
      <Header />
      <View ref={frame} style={{ flex: 1 }}>
        <ScrollView
          ref={scroll}
          contentContainerStyle={[styles.scroll, !wide && count > 0 && { paddingBottom: 110 }]}
          stickyHeaderIndices={[1]}
          scrollEventThrottle={64}
          onScroll={(e) => {
            offset.current = e.nativeEvent.contentOffset.y;
            trackActive();
          }}
        >
          {/* 0: Hero */}
          <Hero compact={compact} wide={wide} menu={menu} photo={details?.photo} address={details?.address} onBack={back} />

          {/* 1: Sticky section tabs + search */}
          <View style={styles.stickyWrap} onLayout={(e) => setStickyHeight(e.nativeEvent.layout.height)}>
            <View style={[styles.page, compact && styles.pageCompact]}>
              <View style={[styles.tabBar, compact && styles.tabBarCompact]}>
                <ScrollView
                  ref={tabsScroll}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabs}
                  style={compact ? undefined : { flex: 1 }}
                >
                  {menu.sections.map((s) => {
                    const on = s.id === activeId;
                    return (
                      <Pressable
                        key={s.id}
                        onLayout={(e) => (tabX.current[s.id] = e.nativeEvent.layout.x)}
                        onPress={() => jump(s.id)}
                        style={({ hovered }: any) => [styles.tab, on && styles.tabOn, !on && hovered && styles.tabHover]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <MaterialCommunityIcons name={s.icon} size={18} color={on ? colors.white : colors.navy} />
                        <Text style={[styles.tabText, on && styles.tabTextOn]}>{s.title}</Text>
                        {on && <View style={styles.tabUnderline} />}
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={[styles.search, compact && styles.searchCompact]}>
                  <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search the menu"
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                    accessibilityLabel="Search the menu"
                  />
                  {!!query && (
                    <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
                      <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* 2: Featured + quick facts, then the menu */}
          <View style={[styles.page, compact && styles.pageCompact, { gap: 30 }]}>
            {!query && (
              <View style={[styles.topRow, wide && styles.topRowWide]}>
                {featured.length > 0 && <FeaturedCard items={featured} onAdd={add} compact={compact} style={wide ? { flex: 1.5 } : undefined} />}
                <View style={[styles.infoCards, wide && { flex: 2 }]}>
                  <InfoCard icon="clock-outline" color={CYAN} title="Hours">
                    <Text style={styles.infoText}>{details?.hours?.split(' (')[0] ?? 'Not confirmed yet'}</Text>
                    <Text style={styles.infoSmall}>From the door sign. Online listings disagree, so call ahead.</Text>
                  </InfoCard>
                  <InfoCard icon="silverware-fork-knife" color={colors.navy} title="Average prices">
                    {averages
                      .filter((a) => a.label !== 'Desserts')
                      .map((a) => (
                        <View key={a.label} style={styles.avgRow}>
                          <Text style={styles.avgLabel}>{a.label}</Text>
                          <Text style={styles.avgValue}>~{money(a.average)}</Text>
                        </View>
                      ))}
                  </InfoCard>
                  {!!menu.signLines?.length && (
                    <InfoCard icon="star" color={PINK} title="On the sign">
                      {menu.signLines.map((l) => (
                        <View key={l} style={styles.signRow}>
                          <MaterialCommunityIcons name="check" size={16} color={PINK} />
                          <Text style={styles.signText}>{l}</Text>
                        </View>
                      ))}
                    </InfoCard>
                  )}
                </View>
              </View>
            )}

            <View style={[styles.body, wide && styles.bodyWide]}>
              <View style={[styles.menuCol, wide && { flex: 1 }]}>
                {sections.length === 0 && <Text style={styles.empty}>Nothing on the menu matches “{query}”.</Text>}
                {sections.map((s) => (
                  <View key={s.id} ref={(r) => void (sectionRefs.current[s.id] = r)} style={styles.section}>
                    <SectionHead section={s} />
                    <View style={styles.items}>
                      {s.items.map((item) => (
                        <ItemRow
                          key={item.name}
                          item={item}
                          section={s}
                          compact={compact}
                          count={countOf(item)}
                          countOfOption={(label) => countOfOption(item, label)}
                          onAdd={add}
                        />
                      ))}
                    </View>
                    {s.footnotes?.map((f) => (
                      <View key={f} style={styles.footnote}>
                        <MaterialCommunityIcons name="information-outline" size={18} color={colors.keaney} />
                        <Text style={styles.footnoteText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                {menu.footnote && (
                  <View style={styles.allergy}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color={PINK} />
                    <Text style={styles.allergyText}>{menu.footnote}</Text>
                  </View>
                )}
                <Text style={styles.credit}>
                  {menu.source}. Prices may have changed; totals are estimates before tax. Banner photo: The Quad ({PHOTOS.quad.credit}).
                </Text>
              </View>

              {/* Desktop: the order estimate rides along beside the menu */}
              {wide && <View style={[styles.sideCol, { top: stickyHeight + 16 } as object]}>{orderPanel}</View>}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Phones and tablets: the order estimate as a tray at the bottom */}
      {!wide && count > 0 && (
        <View style={styles.trayWrap} pointerEvents="box-none">
          <View style={styles.tray}>
            {trayOpen && <View style={styles.trayBody}>{orderPanel}</View>}
            <Pressable onPress={() => setTrayOpen((v) => !v)} style={styles.trayBar} accessibilityRole="button">
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trayTitle}>Your order</Text>
                <Text style={styles.traySub}>{trayOpen ? 'Tap to hide' : 'Tap to see items'} · before tax</Text>
              </View>
              <Text style={styles.trayTotal}>{money(total)}</Text>
              <MaterialCommunityIcons name={trayOpen ? 'chevron-down' : 'chevron-up'} size={22} color={colors.white} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

/** Quad photo fading into the page, the storefront, and the name in the site's navy. */
function Hero({
  compact,
  wide,
  menu,
  photo,
  address,
  onBack,
}: {
  compact: boolean;
  wide: boolean;
  menu: Menu;
  photo?: ImageSourcePropType;
  address?: string;
  onBack: () => void;
}) {
  const openMap = () => router.push(`/map?to=${menu.placeId}`);
  return (
    <View style={styles.hero}>
      <Image source={PHOTOS.quad.source} style={[imageFill, { opacity: 0.32 }]} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(234,243,252,0.5)', 'rgba(234,243,252,0.85)', colors.background]}
        locations={[0, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.wave, { width: 900, height: 900, right: -460, top: -620 }]} pointerEvents="none" />
      <View style={[styles.wave, { width: 700, height: 700, left: -420, top: -480, opacity: 0.6 }]} pointerEvents="none" />

      <View style={[styles.page, compact && styles.pageCompact, { gap: 16 }]}>
        <Pressable style={styles.back} onPress={onBack} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.navy} />
          <Text style={styles.backText}>Back to {menu.name}</Text>
        </Pressable>

        <View style={[styles.heroMain, wide && styles.heroMainWide]}>
          {photo && (
            <View style={[styles.heroPhoto, wide ? styles.heroPhotoWide : styles.heroPhotoNarrow]}>
              <Image source={photo} style={imageFill} resizeMode="cover" />
            </View>
          )}
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>{menu.name}</Text>
            {menu.kicker && (
              <View style={styles.kickerRow}>
                <View style={[styles.kickerLine, compact && { width: 30 }]} />
                <Text style={[styles.kicker, compact && styles.kickerCompact]}>{menu.kicker.toUpperCase()}</Text>
                <View style={[styles.kickerLine, compact && { width: 30 }]} />
              </View>
            )}
            {menu.tagline && <Text style={[styles.tagline, compact && { fontSize: 16 }]}>{menu.tagline}</Text>}
          </View>
          {/* Keeps the title centered on the page when the photo sits to its left. */}
          {wide && photo && <View style={styles.heroBalance} />}
        </View>

        <View style={styles.pills}>
          {address && <InfoPill icon="map-marker" text={address.replace(' (Kingston Emporium)', '')} onPress={openMap} />}
          {menu.phone && <InfoPill icon="phone" text={menu.phone} onPress={() => Linking.openURL(`tel:${menu.phone!.replace(/[^\d+]/g, '')}`)} />}
          {menu.website && (
            <InfoPill icon="web" text={menu.website.replace(/^https?:\/\/(www\.)?/, '')} onPress={() => Linking.openURL(menu.website!)} />
          )}
          <Pressable
            onPress={openMap}
            style={({ hovered }: any) => [styles.mapButton, hovered && { backgroundColor: colors.navySoft }]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={PINK_GLOW} />
            <Text style={styles.mapButtonText}>View on Map</Text>
            <MaterialCommunityIcons name="arrow-top-right" size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function InfoPill({ icon, text, onPress }: { icon: IconName; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ hovered }: any) => [styles.pill, hovered && styles.pillHover]} accessibilityRole="link">
      <MaterialCommunityIcons name={icon} size={18} color={colors.keaney} />
      <Text style={styles.pillText} numberOfLines={1}>
        {text}
      </Text>
    </Pressable>
  );
}

/** A rotating spotlight on a few board favorites, lit like the neon menu board. */
function FeaturedCard({ items, onAdd, compact, style }: { items: Featured[]; onAdd: AddFn; compact: boolean; style?: object }) {
  const [shown, setShown] = useState(0);
  const [paused, setPaused] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setShown((n) => (n + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [paused, items.length]);
  const i = shown % items.length;
  const f = items[i];
  const first = itemOptions(f.item, f.section)[0];
  return (
    <View
      style={[styles.featured, style]}
      // Hovering (web) pauses the rotation so it doesn't change under the pointer.
      {...({ onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) } as object)}
    >
      <LinearGradient colors={[colors.navy, '#0D3470']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.featuredInner, compact && styles.featuredInnerCompact]}>
        <View style={[styles.neonRing, compact && styles.neonRingCompact]}>
          <MaterialCommunityIcons name={f.section.icon} size={compact ? 44 : 62} color={colors.white} style={styles.neonIcon} />
        </View>
        <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
          <View style={styles.featuredTag}>
            <Text style={styles.featuredTagText}>{f.label.toUpperCase()}</Text>
          </View>
          <Text style={[styles.featuredName, compact && styles.featuredNameCompact]}>{f.item.name}</Text>
          {(f.blurb || f.item.desc) && (
            <Text style={styles.featuredDesc} numberOfLines={2}>
              {f.blurb ?? f.item.desc}
            </Text>
          )}
          {first && (
            <View style={styles.featuredActions}>
              <Text style={[styles.featuredPrice, compact && { fontSize: 20 }]}>{money(first.price)}</Text>
              <Pressable
                onPress={() => {
                  onAdd(f.item, first);
                  setJustAdded(true);
                  setTimeout(() => setJustAdded(false), 1200);
                }}
                style={({ hovered }: any) => [styles.featuredAdd, hovered && { backgroundColor: 'rgba(255,255,255,0.12)' }]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${f.item.name}, ${first.label}, ${money(first.price)}`}
              >
                <MaterialCommunityIcons name={justAdded ? 'check' : 'plus'} size={16} color={colors.white} />
                <Text style={styles.featuredAddText}>{justAdded ? 'Added' : first.label === 'Price' ? 'Add' : `Add ${first.label.toLowerCase()}`}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <View style={styles.dots}>
        {items.map((it, n) => (
          <Pressable
            key={`${it.item.name}-${n}`}
            onPress={() => setShown(n)}
            hitSlop={6}
            style={[styles.dot, n === i && styles.dotOn]}
            accessibilityRole="button"
            accessibilityLabel={`Show ${it.item.name}`}
          />
        ))}
      </View>
    </View>
  );
}

function InfoCard({ icon, color, title, children }: { icon: IconName; color: string; title: string; children: ReactNode }) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: `${color}1A` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.infoTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SectionHead({ section }: { section: MenuSection }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionBar} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.notes?.map((n) => (
          <Text key={n} style={styles.sectionNote}>
            {n}
          </Text>
        ))}
        {section.options && section.options.length > 1 && (
          <View style={styles.sharedRow}>
            {section.options.map((o) => (
              <View key={o.label} style={styles.shared}>
                <Text style={styles.sharedLabel}>{o.label}</Text>
                <Text style={styles.sharedPrice}>{money(o.price)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function ItemRow({
  item,
  section,
  compact,
  count,
  countOfOption,
  onAdd,
}: {
  item: MenuItem;
  section: MenuSection;
  compact: boolean;
  count: number;
  countOfOption: (label: string) => number;
  onAdd: AddFn;
}) {
  const options = itemOptions(item, section);
  const several = options.length > 1;
  const first = options[0];
  return (
    <View style={[styles.item, compact && styles.itemCompact, count > 0 && styles.itemOn]}>
      <View style={[styles.thumb, compact && styles.thumbCompact]}>
        <MaterialCommunityIcons name={section.icon} size={compact ? 24 : 30} color={colors.navy} />
        {item.star && (
          <View style={styles.thumbStar}>
            <MaterialCommunityIcons name="star" size={11} color={colors.white} />
          </View>
        )}
      </View>
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <View style={styles.itemNameRow}>
          <Text style={[styles.itemName, compact && { fontSize: 16 }]}>{item.name}</Text>
          {item.isNew && (
            <View style={styles.newTag}>
              <Text style={styles.newTagText}>NEW</Text>
            </View>
          )}
        </View>
        {item.desc && <Text style={styles.itemDesc}>{item.desc}</Text>}
        {several && (
          <View style={styles.options}>
            {options.map((o) => {
              const n = countOfOption(o.label);
              return (
                <Pressable
                  key={o.label}
                  onPress={() => onAdd(item, o)}
                  style={({ hovered }: any) => [styles.option, hovered && styles.optionHover, n > 0 && styles.optionOn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name}, ${o.label}, ${money(o.price)}`}
                >
                  {n > 0 ? <Text style={styles.optionCount}>{n}×</Text> : <MaterialCommunityIcons name="plus" size={14} color={PINK} />}
                  <Text style={styles.optionLabel}>{o.label}</Text>
                  <Text style={styles.optionPrice}>{money(o.price)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      {first && (
        <View style={[styles.itemRight, compact && styles.itemRightCompact]}>
          <Text style={[styles.itemPrice, compact && { fontSize: 16 }]}>
            {several && <Text style={styles.from}>from </Text>}
            {money(Math.min(...options.map((o) => o.price)))}
          </Text>
          {!several && (
            <Pressable
              onPress={() => onAdd(item, first)}
              style={({ hovered }: any) => [styles.add, compact && styles.addCompact, hovered && styles.addHover, count > 0 && styles.addOn]}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name}, ${money(first.price)}`}
            >
              <MaterialCommunityIcons name={count > 0 ? 'check' : 'plus'} size={16} color={count > 0 ? colors.white : PINK} />
              <Text style={[styles.addText, count > 0 && { color: colors.white }]}>{count > 0 ? `${count}` : 'Add'}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function OrderPanel({
  order,
  total,
  count,
  onChange,
  onClear,
  phoneUrl,
}: {
  order: OrderLine[];
  total: number;
  count: number;
  onChange: (key: string, by: number) => void;
  onClear: () => void;
  phoneUrl?: string;
}) {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHead}>
        <View style={[styles.infoIcon, { backgroundColor: `${PINK}1A` }]}>
          <MaterialCommunityIcons name="receipt-text-outline" size={22} color={PINK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Your order</Text>
          <Text style={styles.infoSmall}>An estimate to plan with; order at the counter or by phone.</Text>
        </View>
      </View>
      {count === 0 ? (
        <Text style={styles.orderEmpty}>Tap + Add on any item to build an estimate.</Text>
      ) : (
        <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 10 }}>
          {order.map((l) => (
            <View key={l.key} style={styles.line}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName}>{l.name}</Text>
                <Text style={styles.lineOption}>{l.option === 'Price' ? money(l.price) : `${l.option} · ${money(l.price)}`}</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable onPress={() => onChange(l.key, -1)} style={styles.step} accessibilityLabel={`Remove one ${l.name}`}>
                  <MaterialCommunityIcons name="minus" size={16} color={colors.navy} />
                </Pressable>
                <Text style={styles.qty}>{l.qty}</Text>
                <Pressable onPress={() => onChange(l.key, 1)} style={styles.step} accessibilityLabel={`Add one ${l.name}`}>
                  <MaterialCommunityIcons name="plus" size={16} color={colors.navy} />
                </Pressable>
              </View>
              <Text style={styles.lineTotal}>{money(l.qty * l.price)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Estimated total</Text>
        <Text style={styles.totalValue}>{money(total)}</Text>
      </View>
      <Text style={styles.infoSmall}>Before tax. Prices are from the menu board and may have changed.</Text>
      <View style={styles.orderButtons}>
        {phoneUrl && (
          <Pressable
            onPress={() => Linking.openURL(phoneUrl)}
            style={({ hovered }: any) => [styles.callButton, hovered && { backgroundColor: colors.navySoft }]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="phone" size={18} color={colors.white} />
            <Text style={styles.callText}>Call to order</Text>
          </Pressable>
        )}
        {count > 0 && (
          <Pressable onPress={onClear} style={styles.clear} accessibilityRole="button">
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const softShadow = { ...shadow.card, shadowOpacity: 0.08 };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 48 },
  page: { width: '100%', maxWidth: 1240, alignSelf: 'center', paddingHorizontal: 32 },
  pageCompact: { paddingHorizontal: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: colors.navy, fontWeight: '700', fontSize: 15 },

  // Hero
  hero: { paddingTop: 18, paddingBottom: 18, overflow: 'hidden' },
  wave: { position: 'absolute', borderRadius: 9999, borderWidth: 28, borderColor: 'rgba(104,171,232,0.16)' },
  heroMain: { alignItems: 'center', gap: 16 },
  heroMainWide: { flexDirection: 'row', justifyContent: 'center', gap: 32 },
  heroPhoto: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: colors.white,
    backgroundColor: colors.keaneyTint,
    ...shadow.card,
  },
  heroPhotoWide: { width: 250, height: 172, transform: [{ rotate: '-2deg' }] },
  heroPhotoNarrow: { width: '100%', maxWidth: 520, height: 170 },
  heroBalance: { width: 250 },
  heroText: { alignItems: 'center', gap: 8, flexShrink: 1 },
  heroTitle: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.navy,
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  heroTitleCompact: { fontSize: 44, lineHeight: 50 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  kickerLine: { width: 56, height: 3, borderRadius: 2, backgroundColor: PINK_GLOW },
  kicker: { fontSize: 16, fontWeight: '700', letterSpacing: 7, color: colors.navy },
  kickerCompact: { fontSize: 13, letterSpacing: 3 },
  tagline: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, color: colors.navy, textAlign: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    maxWidth: '100%',
    ...softShadow,
  },
  pillHover: { backgroundColor: colors.keaneyTint },
  pillText: { fontSize: 15, color: colors.text, flexShrink: 1 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
    borderBottomWidth: 3,
    borderBottomColor: PINK_GLOW,
  },
  mapButtonText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  // Sticky tabs
  stickyWrap: { paddingVertical: 10, backgroundColor: colors.background },
  tabBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 6, borderRadius: radius.pill, backgroundColor: colors.white, ...softShadow },
  tabBarCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 6, borderRadius: radius.lg },
  tabs: { gap: 4, paddingRight: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16, borderRadius: radius.pill },
  tabOn: { backgroundColor: colors.navy },
  tabHover: { backgroundColor: colors.keaneyTint },
  tabText: { fontSize: 15, fontWeight: '700', color: colors.navy },
  tabTextOn: { color: colors.white },
  tabUnderline: { position: 'absolute', left: 22, right: 22, bottom: 4, height: 3, borderRadius: 2, backgroundColor: PINK_GLOW },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 230,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  searchCompact: { width: '100%' },
  // 16px so iPhones don't zoom in on focus.
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, color: colors.text, height: '100%', outlineStyle: 'none' } as object,

  // Featured + info cards
  topRow: { gap: 16, marginTop: 8 },
  topRowWide: { flexDirection: 'row', alignItems: 'stretch' },
  featured: { borderRadius: radius.xl, overflow: 'hidden', minHeight: 220, ...shadow.card },
  featuredInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 26, padding: 26, paddingBottom: 36 },
  featuredInnerCompact: { gap: 16, padding: 18, paddingBottom: 34 },
  neonRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: PINK_GLOW,
    backgroundColor: 'rgba(255,46,147,0.08)',
    shadowColor: PINK_GLOW,
    shadowOpacity: 0.9,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  neonRingCompact: { width: 88, height: 88, borderRadius: 44, borderWidth: 3 },
  neonIcon: { textShadowColor: CYAN_GLOW, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } },
  featuredTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    height: 26,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: PINK_GLOW,
  },
  featuredTagText: { color: colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  featuredName: { color: colors.white, fontWeight: '800', fontSize: 32, lineHeight: 38 },
  featuredNameCompact: { fontSize: 23, lineHeight: 28 },
  featuredDesc: { color: '#CFE2F7', fontStyle: 'italic', fontSize: 15, lineHeight: 21 },
  featuredActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  featuredPrice: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 24,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: CYAN_GLOW,
    textShadowColor: CYAN_GLOW,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  featuredAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  featuredAddText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  dots: { position: 'absolute', right: 22, bottom: 14, flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotOn: { backgroundColor: PINK_GLOW, width: 22 },

  infoCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  infoCard: { flexGrow: 1, flexBasis: 190, gap: 6, padding: 18, borderRadius: radius.xl, backgroundColor: colors.white, ...softShadow },
  infoIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 19, fontWeight: '800', color: colors.navy },
  infoText: { fontSize: 15, lineHeight: 21, color: colors.text },
  infoSmall: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avgLabel: { fontSize: 14, color: colors.text },
  avgValue: { fontSize: 15, fontWeight: '800', color: colors.navy },
  signRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signText: { fontSize: 14, color: colors.text, flexShrink: 1 },

  // Menu body
  body: { gap: 24 },
  bodyWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 28 },
  menuCol: { gap: 34 },
  sideCol: { width: 340, position: 'sticky' } as object,
  section: { gap: 14 },
  sectionHead: { flexDirection: 'row', gap: 14 },
  sectionBar: { width: 5, borderRadius: 3, backgroundColor: CYAN },
  sectionTitle: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  sectionNote: { fontSize: 15, fontStyle: 'italic', color: colors.textMuted },
  sharedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  shared: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.keaneyTint,
  },
  sharedLabel: { fontSize: 13, color: colors.navy },
  sharedPrice: { fontSize: 13, fontWeight: '800', color: colors.navy },
  items: { gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow.card,
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  itemCompact: { gap: 12, padding: 12 },
  itemOn: { borderColor: `${PINK}55` },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.keaneyTint,
    alignSelf: 'flex-start',
  },
  thumbCompact: { width: 48, height: 48 },
  thumbStar: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PINK,
    borderWidth: 2,
    borderColor: colors.white,
  },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  itemName: { fontSize: 18, fontWeight: '800', color: colors.navy, flexShrink: 1 },
  newTag: { paddingHorizontal: 8, height: 20, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: PINK },
  newTagText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  itemDesc: { fontSize: 14, lineHeight: 20, fontStyle: 'italic', color: colors.textMuted },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionHover: { borderColor: PINK },
  optionOn: { borderColor: PINK, backgroundColor: `${PINK}12` },
  optionCount: { color: PINK, fontWeight: '900', fontSize: 13 },
  optionLabel: { fontSize: 13, color: colors.text },
  optionPrice: { fontSize: 14, fontWeight: '800', color: colors.navy },
  itemRight: { alignItems: 'flex-end', gap: 8, minWidth: 104 },
  itemRightCompact: { minWidth: 0, alignSelf: 'flex-start' },
  itemPrice: { fontSize: 19, fontWeight: '800', color: colors.navy },
  from: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  add: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 2, borderColor: PINK },
  addCompact: { height: 34, paddingHorizontal: 12 },
  addHover: { backgroundColor: `${PINK}10` },
  addOn: { backgroundColor: PINK },
  addText: { color: PINK, fontWeight: '800', fontSize: 15 },
  footnote: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.keaneyTint },
  footnoteText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.text },
  allergy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: `${PINK}40`,
    backgroundColor: colors.white,
  },
  allergyText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.navy },
  empty: { fontSize: 16, color: colors.textMuted, textAlign: 'center', paddingVertical: 30 },
  credit: { fontSize: 12, color: colors.textMuted },

  // Order
  orderCard: { gap: 12, padding: 18, borderRadius: radius.xl, backgroundColor: colors.white, ...shadow.card, shadowOpacity: 0.1 },
  orderHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderEmpty: {
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: 14,
    paddingHorizontal: 10,
    textAlign: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineName: { fontSize: 14, fontWeight: '700', color: colors.navy },
  lineOption: { fontSize: 12, color: colors.textMuted },
  lineTotal: { fontSize: 14, fontWeight: '800', color: colors.navy, minWidth: 58, textAlign: 'right' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  step: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keaneyTint },
  qty: { fontWeight: '800', color: colors.navy, minWidth: 18, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.navy },
  totalValue: { fontSize: 26, fontWeight: '900', color: colors.navy },
  orderButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
  },
  callText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  clear: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  clearText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },

  trayWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', padding: 12 },
  tray: { width: '100%', maxWidth: 560, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.navy, ...shadow.card, shadowOpacity: 0.3 },
  trayBody: { padding: 8, paddingBottom: 0 },
  trayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 3,
    borderTopColor: PINK_GLOW,
  },
  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PINK_GLOW,
  },
  badgeText: { color: colors.white, fontWeight: '900' },
  trayTitle: { color: colors.white, fontWeight: '800', fontSize: 15 },
  traySub: { color: '#B9CCE4', fontSize: 12 },
  trayTotal: { color: colors.white, fontWeight: '900', fontSize: 22 },
});
