import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, breakpoints } from '@/theme';

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <Text style={[styles.logo, { fontSize: size }]} accessibilityRole="header">
      <Text style={{ color: colors.navy }}>Rhody</Text>
      <Text style={{ color: colors.keaney }}>Find</Text>
    </Text>
  );
}

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
] as const;

export function Header() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const compact = width < breakpoints.tablet;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={[styles.bar, compact && styles.barCompact]}>
        <Link href="/" asChild>
          <Pressable accessibilityLabel="RhodyFind home">
            <Logo size={compact ? 22 : 26} />
          </Pressable>
        </Link>
        <View style={styles.nav}>
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable style={styles.navItem}>
                  <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
                  <View style={[styles.underline, active && styles.underlineActive]} />
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, zIndex: 10 },
  bar: {
    height: 68,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  barCompact: { height: 56, paddingHorizontal: 16 },
  logo: { fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
  nav: { flexDirection: 'row', gap: 24 },
  navItem: { paddingVertical: 6, alignItems: 'center' },
  navText: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  navTextActive: { color: colors.navy, fontWeight: '700' },
  underline: { marginTop: 4, height: 3, width: '100%', borderRadius: 2, backgroundColor: 'transparent' },
  underlineActive: { backgroundColor: colors.navy },
});
