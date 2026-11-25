import { Image, Platform, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';
import {
  BRUSH_FLICK,
  BRUSH_SWOOSH,
  CHERRY_BRANCH,
  CHERRY_SPRIG,
  CLOUD,
  HANOK,
  LANTERN,
  LATTICE_CORNER,
  MOUNTAINS,
  TAEGEUK,
  TOWER,
  WAVE_TILE,
  svgUri,
} from './koreanArt';

/**
 * Colors for a menu page. "board" keeps a bit of Albie's neon menu board
 * (pink and cyan on navy); "korean" uses the red and blue of the taegeuk with
 * hanok, blossom and wave decorations (Taste of Korea).
 */
export type MenuTheme = {
  key: 'board' | 'korean';
  /** Buttons, tags, the active tab's underline. */
  accent: string;
  accentGlow: string;
  /** Section bars, the hours icon. */
  second: string;
  /** The price outline on the featured card. */
  secondGlow: string;
  /** The featured card's gradient, top-left to bottom-right. */
  featured: [string, string];
  featuredDesc: string;
  /** The ring around the featured item's icon. */
  ring: string;
  thumbBg: string;
  thumbIcon: string;
  background: string;
};

export const MENU_THEMES: Record<MenuTheme['key'], MenuTheme> = {
  board: {
    key: 'board',
    accent: '#D81B7A',
    accentGlow: '#FF2E93',
    second: '#1BB5D3',
    secondGlow: '#3FE0F5',
    featured: [colors.navy, '#0D3470'],
    featuredDesc: '#CFE2F7',
    ring: '#FF2E93',
    thumbBg: colors.keaneyTint,
    thumbIcon: colors.navy,
    background: colors.background,
  },
  korean: {
    key: 'korean',
    accent: '#C8102E',
    accentGlow: '#E0283F',
    second: '#0047A0',
    secondGlow: '#C9DAF5',
    featured: ['#14224E', '#7A1D3C'],
    featuredDesc: '#E9DDE6',
    ring: '#EE5A43',
    thumbBg: '#FCE9EC',
    thumbIcon: '#C8102E',
    background: '#F3F4F9',
  },
};

const web = Platform.OS === 'web';

/** One drawing, web only (it's an SVG image; the native app shows nothing). */
function Art({ svg, style, repeat }: { svg: string; style: StyleProp<ImageStyle>; repeat?: boolean }) {
  if (!web) return null;
  return (
    <Image
      source={{ uri: svgUri(svg) }}
      style={style}
      resizeMode={repeat ? 'repeat' : 'contain'}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Behind the Korean hero: misty sky, blossoms, a hanok with a lantern, and mountains. */
export function KoreanHeroDecor({ compact, width }: { compact: boolean; width: number }) {
  // Room beside the centered title for the full hanok and brush stroke only on big screens.
  const roomy = width >= 1280;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#E9EAF5', '#F1F1F8', '#F3F4F9']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <Art svg={MOUNTAINS} style={[deco.abs, { left: -40, right: -40, bottom: -10, height: compact ? 120 : 200, opacity: 0.8 }]} />
      <Art svg={CLOUD('#B9BED8')} style={[deco.abs, { left: compact ? '40%' : '33%', top: 18, width: 120, height: 60, opacity: 0.6 }]} />
      {!compact && (
        <>
          {roomy && <Art svg={BRUSH_SWOOSH} style={[deco.abs, { right: -60, top: 150, width: 560, height: 150, opacity: 0.8 }]} />}
          <Art
            svg={HANOK}
            style={[
              deco.abs,
              roomy
                ? { right: 20, top: -6, width: 480, height: 255, opacity: 0.5 }
                : { right: -40, top: 0, width: 260, height: 138, opacity: 0.35 },
            ]}
          />
          <Art svg={LANTERN} style={[deco.abs, { right: 36, top: 0, width: 66, height: 190 }]} />
        </>
      )}
      <Art svg={CHERRY_BRANCH} style={[deco.abs, { left: -16, top: -12, width: compact ? 150 : 290, height: compact ? 112 : 218 }]} />
      {compact && <Art svg={LANTERN} style={[deco.abs, { right: 10, top: 0, width: 38, height: 110 }]} />}
    </View>
  );
}

/** Behind the whole page: mountains and a tower on the right, waves along the bottom. Stays put while the menu scrolls. */
export function KoreanBackdrop({ compact, width }: { compact: boolean; width: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Art svg={MOUNTAINS} style={[deco.abs, { left: -60, right: -60, bottom: 20, height: compact ? 140 : 240, opacity: 0.55 }]} />
      {/* Only where the page has empty margins (it's 1240 wide), so it never peeks between cards. */}
      {width >= 1500 && <Art svg={TOWER} style={[deco.abs, { right: 30, bottom: 60, width: 110, height: 290, opacity: 0.55 }]} />}
      <Art svg={WAVE_TILE} repeat style={[deco.abs, { left: 0, right: 0, bottom: 0, height: 48, opacity: 0.7 }]} />
    </View>
  );
}

/** A red-and-blue taegeuk between two thin lines, under the restaurant's name. */
export function TaegeukDivider() {
  return (
    <View style={deco.divider}>
      <View style={deco.dividerLine} />
      <Art svg={TAEGEUK} style={{ width: 30, height: 30 }} />
      <View style={deco.dividerLine} />
    </View>
  );
}

/** Waves along the bottom edge of a card. The card needs overflow: hidden. */
export function CardWaves({ height = 28 }: { height?: number }) {
  return <Art svg={WAVE_TILE} repeat style={[deco.abs, { left: 0, right: 0, bottom: 0, height, opacity: 0.45 }]} />;
}

/** A blossom sprig in a card's top-right corner. */
export function CardSprig() {
  return <Art svg={CHERRY_SPRIG} style={[deco.abs, { right: -4, top: -2, width: 96, height: 72 }]} />;
}

/** Lattice corner, cloud scrolls and a faint hanok inside the featured card. */
export function FeaturedDecor({ compact }: { compact: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Art svg={LATTICE_CORNER('#C4475B')} style={[deco.abs, { left: 10, top: 10, width: 58, height: 58, opacity: 0.8 }]} />
      <Art svg={CLOUD('#D9A64E')} style={[deco.abs, { left: 6, bottom: 8, width: 110, height: 55, opacity: 0.55 }]} />
      <Art svg={CLOUD('#9FB0E0')} style={[deco.abs, { right: 16, top: 10, width: 96, height: 48, opacity: 0.35 }]} />
      {!compact && <Art svg={HANOK} style={[deco.abs, { right: -30, bottom: 6, width: 230, height: 122, opacity: 0.22 }]} />}
    </View>
  );
}

/** A red brush flick after a section title. */
export function TitleFlick() {
  return <Art svg={BRUSH_FLICK} style={{ width: 64, height: 16, marginLeft: 10, marginTop: 8 }} />;
}

const deco = StyleSheet.create({
  abs: { position: 'absolute' } as ViewStyle as ImageStyle,
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  dividerLine: { width: 120, height: 1.5, backgroundColor: '#8D93B5', opacity: 0.6 },
});
