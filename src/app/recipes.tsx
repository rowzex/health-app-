import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FadeIn, haptic } from '../components/motion';
import { RecipePhoto, RecipeSheet } from '../components/recipe';
import { Card, Muted, Screen, styles } from '../components/ui';
import { Meal, MEALS, targets, totals } from '../lib/model';
import { rankForToday, Recipe, RECIPES } from '../lib/recipes';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

type Filter = 'For you' | 'Saved' | 'High protein' | Meal;
const FILTERS: Filter[] = ['For you', 'Saved', 'High protein', ...MEALS];

export default function Recipes() {
  const t = useTheme();
  const { profile, day, saved } = useStore();
  const [filter, setFilter] = useState<Filter>('For you');
  const [open, setOpen] = useState<Recipe | null>(null);
  const goal = targets(profile);
  const sum = totals(day);
  const kcalLeft = Math.round(goal.kcal - sum.kcal);

  const all = [...saved, ...RECIPES.filter((r) => !saved.some((s) => s.title === r.title))];
  const list =
    filter === 'For you' ? rankForToday(all, kcalLeft, goal.p - sum.p)
    : filter === 'Saved' ? saved
    : filter === 'High protein' ? [...all].filter((r) => (r.p * 4) / r.kcal >= 0.3).sort((a, b) => b.p - a.p)
    : all.filter((r) => r.meal === filter);

  return (
    <Screen>
      <Text style={[styles.brand, { color: t.ink }]}>Recipes</Text>
      <Muted>{kcalLeft > 0 ? `${kcalLeft} kcal left today. "For you" puts the best fits first.` : 'You have reached your target today. Lighter options are first.'}</Muted>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {FILTERS.map((f) => (
          <Pressable
            key={f} onPress={() => { haptic.tap(); setFilter(f); }} accessibilityState={{ selected: f === filter }}
            style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: f === filter ? t.accent : t.line, backgroundColor: f === filter ? t.accent : 'transparent' }}
          >
            <Text style={{ color: f === filter ? t.accentInk : t.ink, fontWeight: '600', fontSize: 13 }}>{f}{f === 'Saved' && saved.length ? ` (${saved.length})` : ''}</Text>
          </Pressable>
        ))}
      </View>

      {list.length === 0 ? (
        <Card>
          <Muted>No saved recipes yet. Open any recipe, or one the coach suggests, and tap Save.</Muted>
        </Card>
      ) : (
        list.map((r, i) => (
          <FadeIn key={`${filter}-${r.id}`} delay={Math.min(i, 6) * 50}>
            <Pressable onPress={() => { haptic.tap(); setOpen(r); }} accessibilityRole="button" accessibilityLabel={r.title}>
              {({ pressed }) => (
                <View style={{ backgroundColor: t.surface, borderRadius: 14, borderWidth: 1, borderColor: t.line, overflow: 'hidden', opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }}>
                  <RecipePhoto recipe={r} height={170} radius={0} />
                  <View style={{ padding: 12, gap: 4 }}>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: t.ink, fontWeight: '800', fontSize: 16, flex: 1 }}>{r.title}</Text>
                      {r.source === 'coach' ? <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}>FROM COACH</Text> : null}
                    </View>
                    <Muted>
                      {r.meal} · {r.minutes} min · <Text style={{ color: t.accent, fontWeight: '700' }}>{r.kcal} kcal</Text> · P {r.p} g · C {r.c} g · F {r.f} g
                    </Muted>
                  </View>
                </View>
              )}
            </Pressable>
          </FadeIn>
        ))
      )}
      <Muted style={{ fontSize: 11 }}>Photos from TheMealDB, matched by dish type, so they show a similar dish rather than this exact recipe.</Muted>
      <RecipeSheet recipe={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}
