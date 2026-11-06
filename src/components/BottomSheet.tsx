import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Animated, Easing, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow } from '@/theme';

export const SHEET_HANDLE_HEIGHT = 30;
const BOTTOM_PADDING = 20;
// Space under the peeking content when the sheet is down. Smaller than the
// panel's 14px gap between sections, so the next section doesn't peek out.
const PEEK_GAP = 12;

type Props = {
  /** Height of the top of the content that stays visible when the sheet is down. */
  peekContentHeight: number;
  /** Tallest the sheet may get when it is up. */
  maxHeight: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children: ReactNode;
};

/** Total height the sheet covers when it is down. */
export const sheetPeekHeight = (peekContentHeight: number) => SHEET_HANDLE_HEIGHT + peekContentHeight + PEEK_GAP;

/**
 * A panel pinned to the bottom of the screen that slides between two heights:
 * down, showing only the top of its content (the map stays in view), and up,
 * showing all of it. Tap the handle, or drag it, to switch.
 */
export function BottomSheet({ peekContentHeight, maxHeight, expanded, onExpandedChange, children }: Props) {
  const [contentHeight, setContentHeight] = useState(0);
  const peek = sheetPeekHeight(peekContentHeight);
  const height = Math.max(peek, Math.min(maxHeight, SHEET_HANDLE_HEIGHT + contentHeight));
  // How far the sheet sits below its full height when it is down.
  const downOffset = height - peek;
  const canExpand = downOffset > 4;

  const [offset] = useState(() => new Animated.Value(expanded ? 0 : downOffset));
  const target = expanded || !canExpand ? 0 : downOffset;
  // Slide when the user opens or closes it; when only the content's size
  // changes (a new step, a banner), jump so the peek stays put.
  const shownExpanded = useRef(expanded);
  useEffect(() => {
    if (shownExpanded.current === expanded) {
      offset.setValue(target);
      return;
    }
    shownExpanded.current = expanded;
    Animated.timing(offset, {
      toValue: target,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [offset, target, expanded]);

  // Back to the top when it slides down, so the current step is what peeks out.
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    if (!expanded) scroll.current?.scrollTo({ y: 0, animated: true });
  }, [expanded]);

  // Rebuilt only when the sheet's sizes or state change, never mid-drag.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => offset.stopAnimation(),
        onPanResponderMove: (_, g) => offset.setValue(Math.min(downOffset, Math.max(0, target + g.dy))),
        onPanResponderRelease: (_, g) => {
          if (!canExpand) return;
          let next: boolean;
          if (Math.abs(g.dy) < 6) next = !expanded; // a tap
          else if (Math.abs(g.vy) > 0.25) next = g.vy < 0; // a flick
          else next = target + g.dy < downOffset / 2; // a drag: whichever end is closer
          if (next === expanded) {
            Animated.timing(offset, { toValue: target, duration: 200, useNativeDriver: false }).start();
          }
          onExpandedChange(next);
        },
        onPanResponderTerminate: () => {
          Animated.timing(offset, { toValue: target, duration: 200, useNativeDriver: false }).start();
        },
      }),
    [offset, target, downOffset, expanded, canExpand, onExpandedChange],
  );

  return (
    <Animated.View style={[styles.sheet, { height, transform: [{ translateY: offset }] }]}>
      <View
        {...pan.panHandlers}
        style={styles.handle}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Slide directions down' : 'Slide directions up'}
        accessibilityState={{ expanded }}
      >
        <View style={styles.grabber} />
        {canExpand && (
          <MaterialCommunityIcons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={22}
            color={colors.textMuted}
            style={styles.chevron}
          />
        )}
      </View>
      <ScrollView
        ref={scroll}
        scrollEnabled={expanded}
        contentContainerStyle={styles.content}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.card,
  },
  // On the web: a pointer cursor, no text selection or page scroll while dragging.
  handle: {
    height: SHEET_HANDLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'none',
  } as object,
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border },
  chevron: { position: 'absolute', right: 16, top: 4 },
  content: { paddingHorizontal: 20, paddingBottom: BOTTOM_PADDING },
});
