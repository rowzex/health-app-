import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FadeIn, haptic, PressScale } from '../components/motion';
import { FoodThumb, RecipeCard, RecipeSheet } from '../components/recipe';
import { Bubble, Button, Card, MacroBar, Muted, Ring, Screen, styles } from '../components/ui';
import { habitText, LOCALE } from '../lib/i18n';
import { dateKey, Day, isDone, MEALS, targets, totals } from '../lib/model';
import { Recipe } from '../lib/recipes';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const tracked = (d?: Day) => !!d && (d.meals.length > 0 || d.water > 0 || d.done.length > 0);

/** Month view of every tracked day. Tap a day to see its food, water, habits and coach chat. */
export default function Calendar() {
  const t = useTheme();
  const { profile, days, coach, setDate, t: tr, lang } = useStore();
  const today = dateKey(new Date());
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(today);
  const [open, setOpen] = useState<Recipe | null>(null);
  const locale = LOCALE[lang ?? 'en'];
  const goal = targets(profile);

  const y = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // weeks start on Monday
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(y, m, i + 1)))];
  while (cells.length % 7) cells.push(null);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));
  const trackedCount = cells.filter((k) => k && (tracked(days[k]) || coach.log[k]?.length)).length;
  const isThisMonth = y === new Date().getFullYear() && m === new Date().getMonth();

  const dotColor = (k: string) => {
    const d = days[k];
    if (!d?.meals.length) return tracked(d) || coach.log[k]?.length ? t.muted : null;
    const kcal = totals(d).kcal;
    return kcal > goal.kcal * 1.1 ? t.warn : kcal >= goal.kcal * 0.85 ? t.good : t.muted;
  };

  const shift = (n: number) => { haptic.tap(); setMonth(new Date(y, m + n, 1)); };

  return (
    <Screen>
      <View style={styles.rowBetween}>
        <Text style={[styles.brand, { color: t.ink }]}>{tr('cal.title')}</Text>
        <View style={styles.dayNav}>
          <Pressable accessibilityLabel={tr('cal.prevMonth')} onPress={() => shift(-1)} style={[styles.navBtn, { borderColor: t.line }]}>
            <Text style={{ color: t.ink, fontSize: 18 }}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={tr('cal.nextMonth')} disabled={isThisMonth} onPress={() => shift(1)}
            style={[styles.navBtn, { borderColor: t.line, opacity: isThisMonth ? 0.35 : 1 }]}
          >
            <Text style={{ color: t.ink, fontSize: 18 }}>›</Text>
          </Pressable>
        </View>
      </View>

      <Card title={month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })} right={<Muted>{tr('cal.tracked', { n: trackedCount })}</Muted>}>
        <View style={{ flexDirection: 'row' }}>
          {weekdays.map((w, i) => (
            <Text key={i} style={{ flex: 1, textAlign: 'center', color: t.muted, fontSize: 12, fontWeight: '700' }}>{w}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((k, i) => {
            if (!k) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
            const future = k > today;
            const on = k === selected;
            const dot = dotColor(k);
            return (
              <View key={k} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                <PressScale
                  disabled={future} onPress={() => { haptic.tap(); setSelected(k); }} accessibilityLabel={k} accessibilityState={{ selected: on }}
                  style={{
                    flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 3,
                    backgroundColor: on ? t.accent : k === today ? t.chip : 'transparent', opacity: future ? 0.3 : 1,
                  }}
                >
                  <Text style={{ color: on ? t.accentInk : t.ink, fontWeight: k === today || on ? '800' : '500' }}>{Number(k.slice(8))}</Text>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot ? (on ? t.accentInk : dot) : 'transparent' }} />
                </PressScale>
              </View>
            );
          })}
        </View>
        <Muted style={{ fontSize: 11 }}>{tr('cal.legend')}</Muted>
      </Card>

      <DayDetail key={selected} k={selected} onOpenRecipe={setOpen} onOpenDay={() => { setDate(selected); router.navigate('/'); }} />
      <RecipeSheet recipe={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

function DayDetail({ k, onOpenRecipe, onOpenDay }: { k: string; onOpenRecipe: (r: Recipe) => void; onOpenDay: () => void }) {
  const t = useTheme();
  const { profile, days, coach, t: tr, lang } = useStore();
  const day = days[k];
  const chat = coach.log[k] ?? [];
  const goal = targets(profile);
  const sum = totals(day);
  const [y, m, d] = k.split('-').map(Number);
  const title = new Date(y, m - 1, d).toLocaleDateString(LOCALE[lang ?? 'en'], { weekday: 'long', day: 'numeric', month: 'long' });
  const habitsDone = profile.habits.filter((h) => isDone(h, day, profile));

  return (
    <FadeIn>
      <View style={{ gap: 16 }}>
        <View style={styles.rowBetween}>
          <Text style={{ color: t.ink, fontSize: 18, fontWeight: '800', flex: 1 }}>{title}</Text>
          <Button small ghost label={tr('cal.open')} onPress={onOpenDay} />
        </View>

        {!tracked(day) && !chat.length ? (
          <Card><Muted>{tr('cal.empty')}</Muted></Card>
        ) : null}

        {tracked(day) ? (
          <Card title={tr('today.fuel')} right={<Muted>{tr('today.target', { n: goal.kcal.toLocaleString() })}</Muted>}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Ring value={sum.kcal} goal={goal.kcal} size={120} />
              <View style={{ flex: 1, gap: 10 }}>
                <MacroBar label={tr('protein')} value={sum.p} goal={goal.p} color={t.protein} />
                <MacroBar label={tr('carbs')} value={sum.c} goal={goal.c} color={t.carbs} />
                <MacroBar label={tr('fat')} value={sum.f} goal={goal.f} color={t.fat} />
              </View>
            </View>
            <Text style={{ color: t.ink }}>💧 {tr('cal.water', { n: day!.water, g: profile.waterGoal })}</Text>
          </Card>
        ) : null}

        {day?.meals.length ? (
          <Card title={tr('cal.meals')}>
            {MEALS.map((meal) => {
              const items = day.meals.filter((x) => x.meal === meal);
              if (!items.length) return null;
              return (
                <View key={meal} style={{ gap: 4 }}>
                  <Text style={{ color: t.muted, fontWeight: '700', fontSize: 13 }}>{tr(`meal.${meal}`).toLocaleUpperCase()}</Text>
                  {items.map((x) => (
                    <View key={x.id} style={[styles.rowBetween, { gap: 10, paddingVertical: 4 }]}>
                      <FoodThumb img={x.img} name={x.name} size={32} />
                      <Text style={{ color: t.ink, flex: 1 }}>{x.name}</Text>
                      <Text style={{ color: t.ink, fontWeight: '700' }}>{Math.round(x.kcal)}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </Card>
        ) : null}

        {tracked(day) ? (
          <Card title={tr('cal.habits')} right={<Muted>{habitsDone.length} / {profile.habits.length}</Muted>}>
            {profile.habits.map((h) => {
              const done = isDone(h, day, profile);
              return (
                <Text key={h.id} style={{ color: done ? t.ink : t.muted }}>
                  <Text style={{ color: done ? t.good : t.muted, fontWeight: '800' }}>{done ? '✓' : '○'}</Text>  {habitText(h, tr).name}
                </Text>
              );
            })}
          </Card>
        ) : null}

        <Card title={tr('cal.chat')}>
          {chat.length === 0 ? <Muted>{tr('cal.noChat')}</Muted> : null}
          {chat.map((msg, i) => (
            <View key={i} style={{ gap: 6 }}>
              {msg.at && msg.role === 'user' ? <Muted style={{ fontSize: 11, textAlign: 'center' }}>{msg.at}</Muted> : null}
              <Bubble role={msg.role} text={msg.content} />
              {msg.recipes?.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {msg.recipes.map((r) => <RecipeCard key={r.id} recipe={r} width={160} onPress={() => { haptic.tap(); onOpenRecipe(r); }} />)}
                </ScrollView>
              ) : null}
            </View>
          ))}
        </Card>
      </View>
    </FadeIn>
  );
}
