import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { dateKey, shiftKey } from '../lib/model';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';
import { haptic, PressScale } from './motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Animates toward `value` whenever it changes. */
function useTween(value: number, duration = 650) {
  const v = useRef(new Animated.Value(value)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: value, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value, v, duration]);
  return v;
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screen, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ title, right, children, style }: { title?: string; right?: ReactNode; children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }, style]}>
      {title ? (
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: t.ink }]}>{title.toUpperCase()}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Button({ label, onPress, ghost, small, disabled }: { label: string; onPress: () => void; ghost?: boolean; small?: boolean; disabled?: boolean }) {
  const t = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={() => { haptic.tap(); onPress(); }}
      disabled={disabled}
      style={[styles.btn, small && styles.btnSmall, { backgroundColor: ghost ? t.chip : t.accent, opacity: disabled ? 0.4 : 1 }]}
    >
      <Text style={{ color: ghost ? t.ink : t.accentInk, fontWeight: '600', fontSize: small ? 13 : 15 }}>{label}</Text>
    </PressScale>
  );
}

export function Muted({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return <Text style={[{ color: t.muted, fontSize: 13 }, style]}>{children}</Text>;
}

/** Calorie ring: fills toward the target, turns warning colour when over. */
export function Ring({ value, goal, size = 168 }: { value: number; goal: number; size?: number }) {
  const t = useTheme();
  const r = 50;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  const left = Math.round(goal - value);
  const progress = useTween(pct);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={60} cy={60} r={r} stroke={t.chip} strokeWidth={14} fill="none" />
        <AnimatedCircle
          cx={60} cy={60} r={r} fill="none" strokeWidth={14} strokeLinecap="round"
          stroke={left < 0 ? t.warn : t.accent} strokeDasharray={`${c}`}
          strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [c, 0] })}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.ringNum, { color: t.ink }]}>{Math.abs(left).toLocaleString()}</Text>
        <Text style={[styles.ringLbl, { color: t.muted }]}>{left >= 0 ? 'KCAL LEFT' : 'KCAL OVER'}</Text>
      </View>
    </View>
  );
}

export function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const t = useTheme();
  const w = useTween(Math.min(100, goal ? (value / goal) * 100 : 0));
  return (
    <View style={{ gap: 5 }}>
      <View style={styles.rowBetween}>
        <Text style={{ color: t.ink, fontWeight: '600', fontSize: 13 }}>{label}</Text>
        <Text style={{ color: t.muted, fontSize: 13 }}>
          <Text style={{ color: t.ink, fontWeight: '700', fontSize: 15 }}>{Math.round(value)}</Text> / {goal} g
        </Text>
      </View>
      <View style={[styles.bar, { backgroundColor: t.chip }]}>
        <Animated.View style={{ width: w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), height: '100%', borderRadius: 4, backgroundColor: color }} />
      </View>
    </View>
  );
}

/** Previous / next day switcher shared by the Today and Habits tabs. */
export function DayHeader({ title }: { title: string }) {
  const t = useTheme();
  const { date, setDate } = useStore();
  const today = dateKey(new Date());
  const [y, m, d] = date.split('-').map(Number);
  const label =
    date === today ? 'Today' : date === shiftKey(today, -1) ? 'Yesterday'
      : new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <View style={styles.dayHeader}>
      <Text style={[styles.brand, { color: t.ink }]}>{title}</Text>
      <View style={styles.dayNav}>
        <Pressable accessibilityLabel="Previous day" onPress={() => { haptic.tap(); setDate(shiftKey(date, -1)); }} style={[styles.navBtn, { borderColor: t.line }]}>
          <Text style={{ color: t.ink, fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={[styles.dayLabel, { color: t.ink }]}>{label.toUpperCase()}</Text>
        <Pressable
          accessibilityLabel="Next day" disabled={date >= today} onPress={() => { haptic.tap(); setDate(shiftKey(date, 1)); }}
          style={[styles.navBtn, { borderColor: t.line, opacity: date >= today ? 0.35 : 1 }]}
        >
          <Text style={{ color: t.ink, fontSize: 18 }}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { padding: 16, gap: 16, paddingBottom: 32 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  btn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 6, paddingHorizontal: 10 },
  center: { alignItems: 'center', justifyContent: 'center' },
  ringNum: { fontSize: 38, fontWeight: '800', fontVariant: ['tabular-nums'] },
  ringLbl: { fontSize: 11, letterSpacing: 1, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  dayNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontWeight: '700', minWidth: 96, textAlign: 'center', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
});
