import { ReactNode, RefObject, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, LayoutAnimation, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, TextInput, TextStyle, View, ViewInstance, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { LOCALE } from '../lib/i18n';
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

/**
 * How much of `ref`'s view the keyboard covers. Measured against the keyboard's top edge,
 * so it works whether or not the phone also resizes the window (Android edge-to-edge doesn't).
 */
function useKeyboardInset(ref: RefObject<ViewInstance | null>, onShown?: (keyboardTop: number) => void) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      const top = e.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, h) => {
        if (ios) LayoutAnimation.configureNext(LayoutAnimation.create(e.duration || 250, 'keyboard', 'opacity'));
        setInset(Math.max(0, Math.round(y + h - top)));
        setTimeout(() => onShown?.(top), ios ? (e.duration || 250) + 30 : 60);
      });
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (e) => {
      if (ios) LayoutAnimation.configureNext(LayoutAnimation.create(e.duration || 250, 'keyboard', 'opacity'));
      setInset(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, [ref, onShown]);
  return inset;
}

/** Page wrapper. Keeps the focused text box above the phone keyboard. */
export function Screen({ children, scroll = true, onKeyboard }: { children: ReactNode; scroll?: boolean; onKeyboard?: () => void }) {
  const t = useTheme();
  const box = useRef<ViewInstance>(null);
  const scroller = useRef<ScrollViewInstance>(null);
  const offset = useRef(0);
  const shown = useRef((keyboardTop: number) => {
    onKeyboard?.();
    // Scroll the focused field into view if it is still under the keyboard.
    const input = TextInput.State.currentlyFocusedInput?.();
    if (!input || !scroller.current) return;
    input.measureInWindow((_x, y, _w, h) => {
      const hidden = y + h + 12 - keyboardTop;
      if (hidden > 0) scroller.current?.scrollTo({ y: offset.current + hidden, animated: true });
    });
  }).current;
  const inset = useKeyboardInset(box, shown);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <View ref={box} style={{ flex: 1, paddingBottom: inset }}>
        {scroll ? (
          <ScrollView
            ref={scroller} contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
            onScroll={(e) => { offset.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={32}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.screen, { flex: 1, paddingBottom: 12 }]}>{children}</View>
        )}
      </View>
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
  const { t: tr } = useStore();
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
        <Text style={[styles.ringLbl, { color: t.muted }]}>{left >= 0 ? tr('ring.left') : tr('ring.over')}</Text>
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
  const { date, setDate, t: tr, lang } = useStore();
  const today = dateKey(new Date());
  const [y, m, d] = date.split('-').map(Number);
  const label =
    date === today ? tr('day.today') : date === shiftKey(today, -1) ? tr('day.yesterday')
      : new Date(y, m - 1, d).toLocaleDateString(LOCALE[lang ?? 'en'], { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <View style={styles.dayHeader}>
      <Text style={[styles.brand, { color: t.ink }]}>{title}</Text>
      <View style={styles.dayNav}>
        <Pressable accessibilityLabel={tr('day.prev')} onPress={() => { haptic.tap(); setDate(shiftKey(date, -1)); }} style={[styles.navBtn, { borderColor: t.line }]}>
          <Text style={{ color: t.ink, fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={[styles.dayLabel, { color: t.ink }]}>{label.toLocaleUpperCase()}</Text>
        <Pressable
          accessibilityLabel={tr('day.next')} disabled={date >= today} onPress={() => { haptic.tap(); setDate(shiftKey(date, 1)); }}
          style={[styles.navBtn, { borderColor: t.line, opacity: date >= today ? 0.35 : 1 }]}
        >
          <Text style={{ color: t.ink, fontSize: 18 }}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** One chat message, used by the Coach tab and the Calendar. */
export function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const t = useTheme();
  const me = role === 'user';
  return (
    <View
      style={{
        alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '88%', paddingVertical: 10, paddingHorizontal: 13, borderRadius: 16,
        borderBottomRightRadius: me ? 4 : 16, borderBottomLeftRadius: me ? 16 : 4,
        backgroundColor: me ? t.accent : t.surface, borderWidth: me ? 0 : 1, borderColor: t.line,
      }}
    >
      <Text style={{ color: me ? t.accentInk : t.ink, lineHeight: 20 }}>{text}</Text>
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
