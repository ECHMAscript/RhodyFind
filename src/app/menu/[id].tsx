import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { itemOptions, menuAverages, menuFor, money, type MenuItem, type MenuSection } from '@/data/menus';
import { breakpoints } from '@/theme';

// The look of the real board: black, a hot-pink frame, cyan headings with a
// pink glow, white item names, pink descriptions.
const NEON = {
  bg: '#050505',
  panel: '#0E0E10',
  pink: '#FF2E93',
  cyan: '#3FE0F5',
  white: '#FFFFFF',
  dim: '#9A9AA5',
  line: '#2A2A30',
};
const DISPLAY_FONT = Platform.select({
  web: 'Impact, "Arial Narrow Bold", "Arial Black", sans-serif',
  default: undefined,
});

type OrderLine = {
  key: string;
  name: string;
  option: string;
  price: number;
  qty: number;
};

/** A restaurant's menu, styled after its menu board, with a running order estimate. */
export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const menu = id ? menuFor(id) : undefined;
  const { width } = useWindowDimensions();
  const compact = width < breakpoints.tablet;

  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<OrderLine[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  // For the section chips: each section is measured on screen when its chip
  // is tapped, and the scroll moves by its distance below the sticky bar.
  const frame = useRef<ComponentRef<typeof View>>(null);
  const sectionRefs = useRef<Record<string, ComponentRef<typeof View> | null>>({});
  const offset = useRef(0);
  const stickyHeight = useRef(0);

  const averages = useMemo(() => (menu ? menuAverages(menu) : []), [menu]);

  const sections = useMemo(() => {
    if (!menu) return [];
    const q = query.trim().toLowerCase();
    if (!q) return menu.sections;
    return menu.sections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => `${i.name} ${i.desc ?? ''} ${s.title}`.toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length);
  }, [menu, query]);

  // Two columns on wider screens, filled shortest-first so they end up about
  // the same height (like the board), one column on phones.
  const columns = useMemo(() => {
    const n = compact ? 1 : 2;
    const cols: MenuSection[][] = Array.from({ length: n }, () => []);
    const heights = new Array(n).fill(0);
    for (const sec of sections) {
      const i = heights.indexOf(Math.min(...heights));
      cols[i].push(sec);
      heights[i] +=
        3 + (sec.notes?.length ?? 0) + (sec.footnotes?.length ?? 0) * 1.5 + sec.items.reduce((h, it) => h + (it.desc ? 2.4 : 1.8), 0);
    }
    return cols;
  }, [sections, compact]);

  const back = () => (router.canGoBack() ? router.back() : router.replace(id ? `/place/${id}` : '/'));

  if (!menu) {
    return (
      <View style={styles.screen}>
        <Header />
        <View style={styles.missing}>
          <Text style={styles.heading}>No menu yet</Text>
          <Pressable onPress={back} style={styles.backRow}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={NEON.cyan} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const add = (item: MenuItem, option: { label: string; price: number }) => {
    const key = `${item.name}|${option.label}`;
    setOrder((o) =>
      o.some((l) => l.key === key)
        ? o.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
        : [
            ...o,
            {
              key,
              name: item.name,
              option: option.label,
              price: option.price,
              qty: 1,
            },
          ],
    );
  };
  const change = (key: string, by: number) =>
    setOrder((o) => o.map((l) => (l.key === key ? { ...l, qty: l.qty + by } : l)).filter((l) => l.qty > 0));
  const inOrder = (item: MenuItem, label: string) => order.find((l) => l.key === `${item.name}|${label}`)?.qty ?? 0;

  const count = order.reduce((n, l) => n + l.qty, 0);
  const total = order.reduce((n, l) => n + l.qty * l.price, 0);

  const jump = (sectionId: string) => {
    setQuery('');
    // Give a cleared search a moment to lay the full menu out again.
    setTimeout(
      () => {
        const node = sectionRefs.current[sectionId];
        if (!node || !frame.current) return;
        frame.current.measureInWindow((_fx, frameTop) =>
          node.measureInWindow((_x, y) => {
            const target = offset.current + (y - frameTop) - stickyHeight.current - 10;
            scroll.current?.scrollTo({
              y: Math.max(0, target),
              animated: true,
            });
          }),
        );
      },
      query ? 60 : 0,
    );
  };

  return (
    <View style={styles.screen}>
      <Header />
      <View ref={frame} style={{ flex: 1 }}>
        <ScrollView
          ref={scroll}
          contentContainerStyle={[styles.scroll, count > 0 && { paddingBottom: 120 }]}
          stickyHeaderIndices={[1]}
          scrollEventThrottle={32}
          onScroll={(e) => (offset.current = e.nativeEvent.contentOffset.y)}
        >
          {/* Title block */}
          <View style={[styles.page, compact && styles.pageCompact]}>
            <Pressable onPress={back} style={styles.backRow} accessibilityRole="button">
              <MaterialCommunityIcons name="arrow-left" size={18} color={NEON.cyan} />
              <Text style={styles.backText}>Back to {menu.name}</Text>
            </Pressable>
            <View style={[styles.frame, styles.titleFrame]}>
              <Text style={[styles.brand, compact && styles.brandCompact]}>{menu.name.toUpperCase()}</Text>
              <View style={styles.contactRow}>
                {menu.phone && (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${menu.phone!.replace(/[^\d+]/g, '')}`)}
                    style={styles.contact}
                    accessibilityRole="link"
                  >
                    <MaterialCommunityIcons name="phone" size={16} color={NEON.pink} />
                    <Text style={styles.contactText}>{menu.phone}</Text>
                  </Pressable>
                )}
                {menu.website && (
                  <Pressable onPress={() => Linking.openURL(menu.website!)} style={styles.contact} accessibilityRole="link">
                    <MaterialCommunityIcons name="web" size={16} color={NEON.pink} />
                    <Text style={styles.contactText}>{menu.website.replace(/^https?:\/\/(www\.)?/, '')}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.averages}>
                {averages.map((a) => (
                  <View key={a.label} style={styles.average}>
                    <Text style={styles.averageLabel}>{a.label.toUpperCase()}</Text>
                    <Text style={styles.averageValue}>{money(a.average)}</Text>
                    <Text style={styles.averageNote}>avg of {a.count}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.hint}>Tap a price to add it to your order estimate.</Text>
            </View>
          </View>

          {/* Sticky: search + section chips */}
          <View style={styles.stickyBar} onLayout={(e) => (stickyHeight.current = e.nativeEvent.layout.height)}>
            <View style={[styles.page, compact && styles.pageCompact, styles.stickyInner]}>
              <View style={styles.search}>
                <MaterialCommunityIcons name="magnify" size={20} color={NEON.dim} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search the menu (e.g. chicken, fries)"
                  placeholderTextColor={NEON.dim}
                  style={styles.searchInput}
                  accessibilityLabel="Search the menu"
                />
                {!!query && (
                  <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={NEON.dim} />
                  </Pressable>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {menu.sections.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => jump(s.id)}
                    style={({ hovered }: any) => [styles.chip, hovered && styles.chipHover]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.chipText}>{s.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* The board */}
          <View style={[styles.page, compact && styles.pageCompact]}>
            {sections.length === 0 && <Text style={styles.empty}>Nothing on the menu matches “{query}”.</Text>}
            <View style={[styles.board, !compact && styles.boardWide]}>
              {columns.map((col, i) => (
                <View key={i} style={styles.column}>
                  {col.map((sec) => (
                    <View key={sec.id} ref={(r) => void (sectionRefs.current[sec.id] = r)} style={styles.frame}>
                      <SectionBlock section={sec} onAdd={add} inOrder={inOrder} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
            {menu.footnote && <Text style={styles.footnoteBig}>{menu.footnote.toUpperCase()}</Text>}
            <Text style={styles.source}>{menu.source}. Prices may have changed; totals are estimates before tax.</Text>
          </View>
        </ScrollView>
      </View>

      {/* Order estimate tray */}
      {count > 0 && (
        <View style={styles.trayWrap} pointerEvents="box-none">
          <View style={[styles.tray, compact && styles.trayCompact]}>
            {trayOpen && (
              <ScrollView style={styles.trayList} contentContainerStyle={{ gap: 8 }}>
                {order.map((l) => (
                  <View key={l.key} style={styles.line}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineName}>{l.name}</Text>
                      <Text style={styles.lineOption}>{l.option === 'Price' ? money(l.price) : `${l.option} · ${money(l.price)}`}</Text>
                    </View>
                    <View style={styles.stepper}>
                      <Pressable onPress={() => change(l.key, -1)} style={styles.step} accessibilityLabel={`Remove one ${l.name}`}>
                        <MaterialCommunityIcons name="minus" size={16} color={NEON.white} />
                      </Pressable>
                      <Text style={styles.qty}>{l.qty}</Text>
                      <Pressable onPress={() => change(l.key, 1)} style={styles.step} accessibilityLabel={`Add one ${l.name}`}>
                        <MaterialCommunityIcons name="plus" size={16} color={NEON.white} />
                      </Pressable>
                    </View>
                    <Text style={styles.lineTotal}>{money(l.qty * l.price)}</Text>
                  </View>
                ))}
                <Pressable onPress={() => setOrder([])} style={styles.clear} accessibilityRole="button">
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={NEON.dim} />
                  <Text style={styles.clearText}>Clear order</Text>
                </Pressable>
              </ScrollView>
            )}
            <Pressable onPress={() => setTrayOpen((v) => !v)} style={styles.trayBar} accessibilityRole="button">
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trayTitle}>Order estimate</Text>
                <Text style={styles.traySub}>{trayOpen ? 'Tap to hide' : 'Tap to see items'} · before tax</Text>
              </View>
              <Text style={styles.trayTotal}>{money(total)}</Text>
              <MaterialCommunityIcons name={trayOpen ? 'chevron-down' : 'chevron-up'} size={22} color={NEON.white} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function SectionBlock({
  section,
  onAdd,
  inOrder,
}: {
  section: MenuSection;
  onAdd: (item: MenuItem, option: { label: string; price: number }) => void;
  inOrder: (item: MenuItem, label: string) => number;
}) {
  const shared = section.options;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={styles.heading}>{section.title.toUpperCase()}</Text>
        {section.notes?.map((n) => (
          <Text key={n} style={styles.note}>
            {n}
          </Text>
        ))}
        {shared && (
          <View style={styles.sharedRow}>
            {shared.map((o) => (
              <Text key={o.label} style={styles.sharedPrice}>
                {o.label} <Text style={styles.sharedPriceValue}>{money(o.price)}</Text>
              </Text>
            ))}
          </View>
        )}
      </View>
      {section.items.map((item) => (
        <View key={item.name} style={styles.item}>
          <View style={styles.itemHead}>
            {item.star && <MaterialCommunityIcons name="star" size={14} color={NEON.pink} style={{ marginTop: 3 }} />}
            <Text style={styles.itemName}>
              {item.name.toUpperCase()}
              {item.isNew && <Text style={styles.newTag}> NEW!</Text>}
            </Text>
          </View>
          {item.desc && <Text style={styles.itemDesc}>{item.desc}</Text>}
          <View style={styles.options}>
            {itemOptions(item, section).map((o) => {
              const n = inOrder(item, o.label);
              return (
                <Pressable
                  key={o.label}
                  onPress={() => onAdd(item, o)}
                  style={({ hovered, pressed }: any) => [
                    styles.option,
                    (hovered || pressed) && styles.optionHover,
                    n > 0 && styles.optionOn,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name}${o.label === 'Price' ? '' : `, ${o.label}`}, ${money(o.price)}`}
                >
                  {n > 0 ? (
                    <Text style={styles.optionCount}>{n}×</Text>
                  ) : (
                    <MaterialCommunityIcons name="plus" size={14} color={NEON.pink} />
                  )}
                  {(item.options ?? shared ?? []).length > 1 || o.label !== 'Price' ? (
                    <Text style={styles.optionLabel}>{o.label}</Text>
                  ) : null}
                  <Text style={styles.optionPrice}>{money(o.price)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {section.footnotes?.map((f) => (
        <Text key={f} style={styles.footnote}>
          {f}
        </Text>
      ))}
    </View>
  );
}

const glow = {
  textShadowColor: NEON.pink,
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 10,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NEON.bg },
  scroll: { paddingBottom: 40 },
  page: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 18,
    gap: 16,
  },
  pageCompact: { paddingHorizontal: 12, paddingTop: 12, gap: 12 },
  missing: { padding: 32, gap: 16 },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: { color: NEON.cyan, fontWeight: '700', fontSize: 15 },

  frame: {
    borderWidth: 3,
    borderColor: NEON.pink,
    borderRadius: 14,
    backgroundColor: NEON.panel,
    padding: 18,
  },
  titleFrame: { alignItems: 'center', gap: 12, paddingVertical: 22 },
  brand: {
    fontFamily: DISPLAY_FONT,
    fontSize: 54,
    lineHeight: 60,
    color: NEON.white,
    letterSpacing: 2,
    textAlign: 'center',
    ...glow,
  },
  brandCompact: { fontSize: 38, lineHeight: 44 },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: NEON.line,
  },
  contactText: { color: NEON.white, fontWeight: '700', fontSize: 14 },
  averages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  average: {
    alignItems: 'center',
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NEON.line,
    backgroundColor: NEON.bg,
  },
  averageLabel: {
    color: NEON.cyan,
    fontFamily: DISPLAY_FONT,
    fontSize: 15,
    letterSpacing: 1,
  },
  averageValue: { color: NEON.white, fontSize: 26, fontWeight: '800' },
  averageNote: { color: NEON.dim, fontSize: 11 },
  hint: { color: NEON.dim, fontSize: 13, textAlign: 'center' },

  stickyBar: {
    backgroundColor: NEON.bg,
    borderBottomWidth: 1,
    borderBottomColor: NEON.line,
    paddingBottom: 10,
  },
  stickyInner: { paddingTop: 10, gap: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: NEON.line,
    backgroundColor: NEON.panel,
  },
  // 16px so iPhones don't zoom in on focus.
  searchInput: {
    flex: 1,
    color: NEON.white,
    fontSize: 16,
    height: '100%',
    outlineStyle: 'none',
  } as any,
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: NEON.cyan,
  },
  chipHover: { backgroundColor: 'rgba(63,224,245,0.12)' },
  chipText: { color: NEON.cyan, fontWeight: '800', fontSize: 13 },

  board: { gap: 14 },
  boardWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1, minWidth: 0, gap: 14 },
  heading: {
    fontFamily: DISPLAY_FONT,
    fontSize: 30,
    lineHeight: 34,
    color: NEON.cyan,
    letterSpacing: 1,
    ...glow,
  },
  note: {
    color: NEON.pink,
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  sharedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 2,
    marginTop: 2,
  },
  sharedPrice: { color: NEON.dim, fontSize: 12, fontWeight: '700' },
  sharedPriceValue: { color: NEON.white },

  item: {
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: NEON.line,
  },
  itemHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  itemName: {
    flex: 1,
    color: NEON.white,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  newTag: { color: NEON.pink, fontWeight: '900' },
  itemDesc: { color: NEON.pink, fontSize: 13, lineHeight: 18 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: NEON.line,
    backgroundColor: NEON.bg,
  },
  optionHover: { borderColor: NEON.pink },
  optionOn: {
    borderColor: NEON.pink,
    backgroundColor: 'rgba(255,46,147,0.16)',
  },
  optionCount: { color: NEON.pink, fontWeight: '900', fontSize: 13 },
  optionLabel: { color: NEON.dim, fontSize: 12, fontWeight: '700' },
  optionPrice: { color: NEON.white, fontWeight: '800', fontSize: 14 },
  footnote: {
    color: NEON.dim,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },

  empty: {
    color: NEON.white,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 30,
  },
  footnoteBig: {
    color: NEON.white,
    fontFamily: DISPLAY_FONT,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 6,
  },
  source: { color: NEON.dim, fontSize: 12, textAlign: 'center' },

  trayWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    padding: 12,
  },
  tray: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: NEON.pink,
    backgroundColor: '#141417',
    overflow: 'hidden',
    shadowColor: NEON.pink,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  trayCompact: { maxWidth: '100%' },
  trayList: {
    maxHeight: 300,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: NEON.line,
  },
  trayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEON.pink,
  },
  badgeText: { color: NEON.white, fontWeight: '900' },
  trayTitle: { color: NEON.white, fontWeight: '800', fontSize: 15 },
  traySub: { color: NEON.dim, fontSize: 12 },
  trayTotal: { color: NEON.white, fontWeight: '900', fontSize: 22 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineName: { color: NEON.white, fontWeight: '700', fontSize: 14 },
  lineOption: { color: NEON.dim, fontSize: 12 },
  lineTotal: {
    color: NEON.white,
    fontWeight: '800',
    fontSize: 14,
    minWidth: 64,
    textAlign: 'right',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  step: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: NEON.line,
  },
  qty: {
    color: NEON.white,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  clearText: { color: NEON.dim, fontSize: 13, fontWeight: '700' },
});
