import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FadeIn, haptic, PressScale } from '../components/motion';
import { FoodThumb, RecipeCard, RecipeSheet } from '../components/recipe';
import { Card, DayHeader, MacroBar, Muted, Ring, Screen, styles } from '../components/ui';
import { MEALS, targets, totals } from '../lib/model';
import { mealForNow, rankForToday, Recipe, RECIPES } from '../lib/recipes';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

export default function Today() {
  const t = useTheme();
  const { profile, day, setWater, removeEntry, saved, t: tr } = useStore();
  const [open, setOpen] = useState<Recipe | null>(null);
  const goal = targets(profile);
  const sum = totals(day);
  const ideas = rankForToday([...saved, ...RECIPES.filter((r) => !saved.some((s) => s.title === r.title))], goal.kcal - sum.kcal, goal.p - sum.p, mealForNow()).slice(0, 5);

  return (
    <Screen>
      <DayHeader title="Fuel & Form" />
      <Pressable onPress={() => { haptic.tap(); router.push('/profile'); }} style={{ alignSelf: 'flex-start' }} accessibilityRole="link">
        <Text style={{ color: t.accent, fontWeight: '600' }}>{tr('today.targetsLink')}</Text>
      </Pressable>

      <FadeIn>
        <Card title={tr('today.fuel')} right={<Muted>{tr('today.target', { n: goal.kcal.toLocaleString() })}</Muted>}>
          <View style={{ alignItems: 'center' }}>
            <Ring value={sum.kcal} goal={goal.kcal} />
          </View>
          <View style={{ gap: 12 }}>
            <MacroBar label={tr('protein')} value={sum.p} goal={goal.p} color={t.protein} />
            <MacroBar label={tr('carbs')} value={sum.c} goal={goal.c} color={t.carbs} />
            <MacroBar label={tr('fat')} value={sum.f} goal={goal.f} color={t.fat} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Stat n={Math.round(sum.kcal).toLocaleString()} label={tr('today.eaten')} />
            <Stat n={goal.tdee.toLocaleString()} label={tr('today.burn')} />
            <Stat n={String(day.meals.length)} label={tr('today.items')} />
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={80}>
        <Card title={tr('today.water')} right={<Muted>{tr('today.glasses', { n: day.water, g: profile.waterGoal })}</Muted>}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: profile.waterGoal }, (_, i) => (
              <PressScale
                key={i}
                accessibilityLabel={tr('today.waterSet', { n: i + 1 })}
                onPress={() => {
                  const next = day.water === i + 1 ? i : i + 1;
                  next === profile.waterGoal ? haptic.success() : haptic.soft();
                  setWater(next);
                }}
                style={{
                  width: 30, height: 38, borderWidth: 2, borderColor: t.protein,
                  borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 9, borderBottomRightRadius: 9,
                  backgroundColor: i < day.water ? t.protein : 'transparent',
                }}
              >
                <View />
              </PressScale>
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={160}>
        <Card title={tr('today.ideas')} right={<Pressable onPress={() => router.push('/recipes')}><Text style={{ color: t.accent, fontWeight: '600' }}>{tr('today.allRecipes')}</Text></Pressable>}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {ideas.map((r) => <RecipeCard key={r.id} recipe={r} width={170} onPress={() => { haptic.tap(); setOpen(r); }} />)}
          </ScrollView>
        </Card>
      </FadeIn>

      <FadeIn delay={240}>
        <Card title={tr('today.meals')}>
          {MEALS.map((meal) => {
            const items = day.meals.filter((m) => m.meal === meal);
            const kcal = items.reduce((a, m) => a + m.kcal, 0);
            return (
              <View key={meal} style={{ gap: 4 }}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: t.muted, fontWeight: '700', letterSpacing: 1, fontSize: 13 }}>{tr(`meal.${meal}`).toLocaleUpperCase()}</Text>
                  <Text style={{ color: t.muted, fontWeight: '700', fontSize: 13 }}>{Math.round(kcal)} {tr('kcal').toLocaleUpperCase()}</Text>
                </View>
                {items.length === 0 ? (
                  <Muted>{tr('today.nothing')}</Muted>
                ) : (
                  items.map((m) => (
                    <FadeIn key={m.id}>
                      <View style={[styles.rowBetween, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.line, gap: 10 }]}>
                        <FoodThumb img={m.img} name={m.name} size={38} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: t.ink }}>{m.name}</Text>
                          <Muted style={{ fontSize: 12 }}>P {Math.round(m.p)}g · C {Math.round(m.c)}g · F {Math.round(m.f)}g</Muted>
                        </View>
                        <Text style={{ color: t.ink, fontWeight: '700', fontSize: 16 }}>{Math.round(m.kcal)}</Text>
                        <Pressable accessibilityLabel={tr('today.remove', { name: m.name })} onPress={() => { haptic.soft(); removeEntry(m.id); }} hitSlop={8}>
                          <Text style={{ color: t.muted, fontSize: 20 }}>×</Text>
                        </Pressable>
                      </View>
                    </FadeIn>
                  ))
                )}
              </View>
            );
          })}
        </Card>
      </FadeIn>
      <RecipeSheet recipe={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.chip, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 }}>
      <Text style={{ color: t.muted, fontSize: 12 }}>
        <Text style={{ color: t.ink, fontWeight: '700', fontSize: 15 }}>{n} </Text>
        {label}
      </Text>
    </View>
  );
}
