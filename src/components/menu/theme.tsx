import { useEffect, type ReactNode } from 'react';
import { Image, Platform, StyleSheet, View, type ImageStyle, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';
import { svgUri } from './artKit';
import { BOLT, FLYING_PIZZA, HALFTONE_TILE, SKYLINE, SPEED_LINES, STAR, STARBURST, ZIGZAG_TILE } from './comicArt';
import { BIG_SPOTS, CORAL_FLICK, GELATO, GIRAFFE_TILE, SLICE, STRING_LIGHTS, WICKER_LAMP } from './high1Art';
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
} from './koreanArt';

/**
 * A menu page's look, designed after each restaurant's own:
 * - board: Albie's neon menu board (pink and cyan on navy).
 * - korean: Taste of Korea, taegeuk red and blue with hanok, blossoms and waves.
 * - giraffe: High 1, its coral pizza-slice sign, café string lights, woven
 *   lamps, gelato and giraffe spots (its mascot is a giraffe).
 * - comic: Kingston Pizza, whose logo is a superhero shield and mascot a
 *   flying pizza man: comic-book yellow, red and blue with halftone dots.
 */
export type MenuTheme = {
  key: 'board' | 'korean' | 'giraffe' | 'comic';
  /** Buttons, tags, the active tab's underline. */
  accent: string;
  accentGlow: string;
  /** Section bars. */
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
  /** Headings and prices. */
  ink: string;
  hoursIcon: string;
  pillIcon: string;
  /** Cards get a decorated band along the bottom (and room for it). */
  cardBand: boolean;
  /** The restaurant's name in the hero. */
  title: TextStyle;
  tagline?: TextStyle;
  /** Google Fonts families to load on the web, e.g. "Bangers". */
  fonts?: string[];
  /** Credit line for the page's art; absent means the Quad banner photo. */
  artCredit?: string;
};

const baseTitle: TextStyle = { fontWeight: '900', fontStyle: 'italic', letterSpacing: -1.5 };

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
    ink: colors.navy,
    hoursIcon: '#1BB5D3',
    pillIcon: colors.keaney,
    cardBand: false,
    title: baseTitle,
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
    ink: colors.navy,
    hoursIcon: '#C8102E',
    pillIcon: '#0047A0',
    cardBand: true,
    title: baseTitle,
    artCredit: 'Illustrations: RhodyFind.',
  },
  giraffe: {
    key: 'giraffe',
    accent: '#E5553D',
    accentGlow: '#FF7A5C',
    second: '#3A3F47',
    secondGlow: '#FFC9A8',
    featured: ['#2B2F36', '#8C3A2B'],
    featuredDesc: '#F3DDD3',
    ring: '#FF7A5C',
    thumbBg: '#FFEDE6',
    thumbIcon: '#E5553D',
    background: '#FBF6F1',
    ink: '#2B2E34',
    hoursIcon: '#E5553D',
    pillIcon: '#E5553D',
    cardBand: true,
    title: { fontFamily: 'Chewy, "Comic Sans MS", system-ui, sans-serif', fontWeight: '400', letterSpacing: 1 },
    tagline: { fontFamily: 'Caveat, "Segoe Print", cursive', fontStyle: 'normal', fontSize: 30, color: '#E5553D' },
    fonts: ['Chewy', 'Caveat:wght@700'],
    artCredit: 'Illustrations: RhodyFind.',
  },
  comic: {
    key: 'comic',
    accent: '#E0262B',
    accentGlow: '#FF3B3B',
    second: '#1D3FAE',
    secondGlow: '#FFD23F',
    featured: ['#13237A', '#2A4FD0'],
    featuredDesc: '#DCE4FF',
    ring: '#FFD23F',
    thumbBg: '#FFF4C7',
    thumbIcon: '#E0262B',
    background: '#FFFBEA',
    ink: '#13237A',
    hoursIcon: '#1D3FAE',
    pillIcon: '#E0262B',
    cardBand: true,
    title: {
      fontFamily: 'Bangers, Impact, "Arial Black", sans-serif',
      fontWeight: '400',
      letterSpacing: 3,
      textTransform: 'uppercase',
      textShadowColor: '#FFD23F',
      textShadowOffset: { width: 4, height: 4 },
      textShadowRadius: 0,
    },
    tagline: {
      fontFamily: 'Bangers, Impact, "Arial Black", sans-serif',
      fontStyle: 'normal',
      letterSpacing: 2,
      color: '#E0262B',
      fontSize: 24,
    },
    fonts: ['Bangers'],
    artCredit: 'Illustrations: RhodyFind.',
  },
};

const web = Platform.OS === 'web';

/** Loads a theme's Google Fonts on the web (once per page). */
export function useThemeFonts(t: MenuTheme) {
  useEffect(() => {
    if (!web || !t.fonts?.length || typeof document === 'undefined') return;
    const id = `menu-fonts-${t.key}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${t.fonts.map((f) => `family=${f.replace(/ /g, '+')}`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }, [t]);
}

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

const Fill = ({ children }: { children: ReactNode }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {children}
  </View>
);

// ---------------------------------------------------------------- Hero

/** Behind the hero. Albie's ("board") keeps the Quad photo, drawn by the page. */
export function HeroDecor({ t, compact, width }: { t: MenuTheme; compact: boolean; width: number }) {
  // Room beside the centered title for the big pieces only on big screens.
  const roomy = width >= 1280;
  switch (t.key) {
    case 'korean':
      return (
        <Fill>
          <LinearGradient colors={['#E9EAF5', '#F1F1F8', '#F3F4F9']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <Art svg={MOUNTAINS} style={[deco.abs, { left: -40, right: -40, bottom: -10, height: compact ? 120 : 200, opacity: 0.8 }]} />
          <Art
            svg={CLOUD('#B9BED8')}
            style={[deco.abs, { left: compact ? '40%' : '33%', top: 18, width: 120, height: 60, opacity: 0.6 }]}
          />
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
        </Fill>
      );
    case 'giraffe':
      return (
        <Fill>
          <LinearGradient colors={['#FFF1E6', '#FCF3EA', '#FBF6F1']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <Art svg={BIG_SPOTS} style={[deco.abs, { left: -40, top: 30, width: 520, height: 350, opacity: 0.8 }]} />
          {roomy && <Art svg={BIG_SPOTS} style={[deco.abs, { right: -60, top: 60, width: 460, height: 310, opacity: 0.7 }]} />}
          <Art svg={STRING_LIGHTS} style={[deco.abs, { left: 0, right: 0, top: -6, height: compact ? 70 : 130 }]} />
          {!compact && (
            <>
              <Art svg={WICKER_LAMP} style={[deco.abs, { right: roomy ? 120 : 30, top: 0, width: 110, height: 172 }]} />
              {roomy && <Art svg={WICKER_LAMP} style={[deco.abs, { right: 250, top: -40, width: 90, height: 140 }]} />}
              <Art
                svg={GELATO}
                style={[deco.abs, { right: roomy ? 60 : 16, bottom: 26, width: 70, height: 108, transform: [{ rotate: '12deg' }] }]}
              />
              {roomy && (
                <Art svg={SLICE} style={[deco.abs, { left: 70, bottom: 40, width: 70, height: 78, transform: [{ rotate: '-18deg' }] }]} />
              )}
            </>
          )}
          {compact && (
            <Art svg={SLICE} style={[deco.abs, { right: 12, top: 40, width: 46, height: 52, transform: [{ rotate: '14deg' }] }]} />
          )}
        </Fill>
      );
    case 'comic':
      return (
        <Fill>
          <LinearGradient colors={['#FFF3B8', '#FFF8D9', '#FFFBEA']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <Art svg={HALFTONE_TILE('#E0262B', 0.16)} repeat style={[deco.abs, { left: 0, right: 0, top: 0, bottom: 0 }]} />
          <Art svg={SPEED_LINES} style={[deco.abs, { left: '50%', top: compact ? 120 : 0, width: 1500, height: 520, marginLeft: -750 }]} />
          <Art svg={STAR()} style={[deco.abs, { left: compact ? 10 : 60, top: compact ? 64 : 24, width: 34, height: 34 }]} />
          <Art svg={STAR('#FFFFFF', '#1D3FAE')} style={[deco.abs, { left: compact ? 30 : 120, top: compact ? 100 : 60, width: 22, height: 22 }]} />
          {!compact && (
            <>
              <Art
                svg={FLYING_PIZZA}
                style={[deco.abs, { right: roomy ? 60 : -10, top: 20, width: roomy ? 300 : 210, height: roomy ? 170 : 120 }]}
              />
              <Art
                svg={STARBURST('SINCE 1984!')}
                style={[
                  deco.abs,
                  {
                    right: roomy ? 110 : 30,
                    bottom: 20,
                    width: roomy ? 190 : 140,
                    height: roomy ? 126 : 94,
                    transform: [{ rotate: '8deg' }],
                  },
                ]}
              />
              <Art svg={STAR('#FFFFFF', '#E0262B')} style={[deco.abs, { right: roomy ? 400 : 230, top: 40, width: 26, height: 26 }]} />
            </>
          )}
          {compact && <Art svg={FLYING_PIZZA} style={[deco.abs, { right: -6, top: 26, width: 120, height: 68 }]} />}
        </Fill>
      );
    default:
      return null;
  }
}

/** Behind the whole page; stays put while the menu scrolls. */
export function Backdrop({ t, compact, width }: { t: MenuTheme; compact: boolean; width: number }) {
  // Tall pieces only where the page (1240 wide) leaves empty margins, so they never peek between cards.
  const margins = width >= 1500;
  switch (t.key) {
    case 'korean':
      return (
        <Fill>
          <Art svg={MOUNTAINS} style={[deco.abs, { left: -60, right: -60, bottom: 20, height: compact ? 140 : 240, opacity: 0.55 }]} />
          {margins && <Art svg={TOWER} style={[deco.abs, { right: 30, bottom: 60, width: 110, height: 290, opacity: 0.55 }]} />}
          <Art svg={WAVE_TILE} repeat style={[deco.abs, { left: 0, right: 0, bottom: 0, height: 48, opacity: 0.7 }]} />
        </Fill>
      );
    case 'giraffe':
      return (
        <Fill>
          <Art svg={BIG_SPOTS} style={[deco.abs, { left: -80, bottom: -40, width: 600, height: 400, opacity: 0.6 }]} />
          <Art svg={BIG_SPOTS} style={[deco.abs, { right: -100, top: 120, width: 600, height: 400, opacity: 0.45 }]} />
          {margins && <Art svg={GELATO} style={[deco.abs, { left: 40, bottom: 60, width: 90, height: 140, opacity: 0.8 }]} />}
          {margins && (
            <Art
              svg={SLICE}
              style={[deco.abs, { right: 50, bottom: 80, width: 90, height: 100, opacity: 0.8, transform: [{ rotate: '16deg' }] }]}
            />
          )}
        </Fill>
      );
    case 'comic':
      return (
        <Fill>
          <Art svg={HALFTONE_TILE('#1D3FAE', 0.07)} repeat style={[deco.abs, { left: 0, right: 0, top: 0, bottom: 0 }]} />
          <Art svg={SKYLINE} style={[deco.abs, { left: -40, right: -40, bottom: 0, height: compact ? 110 : 200 }]} />
          {margins && (
            <Art
              svg={STARBURST('POW!', '#FFFFFF', '#1D3FAE', '#E0262B')}
              style={[deco.abs, { left: 30, top: 300, width: 130, height: 86, opacity: 0.9 }]}
            />
          )}
        </Fill>
      );
    default:
      return null;
  }
}

/** Under the restaurant's name: a small motif between two thin lines. */
export function Divider({ t }: { t: MenuTheme }) {
  const motif = t.key === 'korean' ? TAEGEUK : t.key === 'giraffe' ? SLICE : t.key === 'comic' ? STAR() : undefined;
  if (!motif) return null;
  return (
    <View style={deco.divider}>
      <View style={[deco.dividerLine, { backgroundColor: t.key === 'korean' ? '#8D93B5' : t.accent }]} />
      <Art svg={motif} style={{ width: 30, height: 30 }} />
      {t.key === 'comic' && <Art svg={STAR('#FFFFFF', '#1D3FAE')} style={{ width: 22, height: 22 }} />}
      <View style={[deco.dividerLine, { backgroundColor: t.key === 'korean' ? '#8D93B5' : t.accent }]} />
    </View>
  );
}

// ---------------------------------------------------------------- Cards

/** A decorated band along a card's bottom edge. The card needs overflow: hidden. */
export function CardBand({ t, height = 28 }: { t: MenuTheme; height?: number }) {
  const tile = t.key === 'korean' ? WAVE_TILE : t.key === 'giraffe' ? GIRAFFE_TILE : t.key === 'comic' ? ZIGZAG_TILE : undefined;
  if (!tile) return null;
  return (
    <Art
      svg={tile}
      repeat
      style={[
        deco.abs,
        { left: 0, right: 0, bottom: 0, height: t.key === 'giraffe' ? 18 : height, opacity: t.key === 'korean' ? 0.45 : 0.7 },
      ]}
    />
  );
}

/** A small piece in a card's top-right corner. */
export function CardCorner({ t }: { t: MenuTheme }) {
  switch (t.key) {
    case 'korean':
      return <Art svg={CHERRY_SPRIG} style={[deco.abs, { right: -4, top: -2, width: 96, height: 72 }]} />;
    case 'giraffe':
      return <Art svg={GELATO} style={[deco.abs, { right: 10, top: 8, width: 40, height: 62, transform: [{ rotate: '10deg' }] }]} />;
    case 'comic':
      return (
        <Art svg={STARBURST('WOW!')} style={[deco.abs, { right: 6, top: 6, width: 74, height: 50, transform: [{ rotate: '10deg' }] }]} />
      );
    default:
      return null;
  }
}

/** Decorations inside the featured card. */
export function FeaturedDecor({ t, compact }: { t: MenuTheme; compact: boolean }) {
  switch (t.key) {
    case 'korean':
      return (
        <Fill>
          <Art svg={LATTICE_CORNER('#C4475B')} style={[deco.abs, { left: 10, top: 10, width: 58, height: 58, opacity: 0.8 }]} />
          <Art svg={CLOUD('#D9A64E')} style={[deco.abs, { left: 6, bottom: 8, width: 110, height: 55, opacity: 0.55 }]} />
          <Art svg={CLOUD('#9FB0E0')} style={[deco.abs, { right: 16, top: 10, width: 96, height: 48, opacity: 0.35 }]} />
          {!compact && <Art svg={HANOK} style={[deco.abs, { right: -30, bottom: 6, width: 230, height: 122, opacity: 0.22 }]} />}
        </Fill>
      );
    case 'giraffe':
      return (
        <Fill>
          <Art svg={STRING_LIGHTS} style={[deco.abs, { left: -20, right: -20, top: -14, height: 70, opacity: 0.9 }]} />
          <Art svg={GIRAFFE_TILE} repeat style={[deco.abs, { left: 0, right: 0, bottom: 0, height: 12, opacity: 0.55 }]} />
          {!compact && (
            <Art
              svg={SLICE}
              style={[deco.abs, { right: 18, bottom: 26, width: 64, height: 70, opacity: 0.35, transform: [{ rotate: '18deg' }] }]}
            />
          )}
        </Fill>
      );
    case 'comic':
      return (
        <Fill>
          <Art svg={HALFTONE_TILE('#FFFFFF', 0.12)} repeat style={[deco.abs, { left: 0, right: 0, top: 0, bottom: 0 }]} />
          <Art svg={STAR()} style={[deco.abs, { left: 14, top: 14, width: 26, height: 26 }]} />
          {!compact && <Art svg={FLYING_PIZZA} style={[deco.abs, { right: -10, bottom: 18, width: 170, height: 96, opacity: 0.35 }]} />}
        </Fill>
      );
    default:
      return null;
  }
}

/** A flourish after a section title. */
export function TitleFlourish({ t }: { t: MenuTheme }) {
  switch (t.key) {
    case 'korean':
      return <Art svg={BRUSH_FLICK} style={{ width: 64, height: 16, marginLeft: 10, marginTop: 8 }} />;
    case 'giraffe':
      return <Art svg={CORAL_FLICK} style={{ width: 64, height: 16, marginLeft: 10, marginTop: 8 }} />;
    case 'comic':
      return <Art svg={BOLT} style={{ width: 44, height: 30, marginLeft: 10 }} />;
    default:
      return null;
  }
}

/** The kicker line under the name, in the theme's own lettering where it has one. */
export function themeKicker(t: MenuTheme): TextStyle | undefined {
  return t.key === 'comic' ? { fontFamily: t.title.fontFamily, fontWeight: '400', letterSpacing: 6, fontSize: 20 } : undefined;
}

const deco = StyleSheet.create({
  abs: { position: 'absolute' } as ViewStyle as ImageStyle,
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  dividerLine: { width: 120, height: 1.5, opacity: 0.6 },
});
