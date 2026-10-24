import { Pressable, Text, View } from 'react-native';

import { Card, DayHeader, MacroBar, Muted, Ring, Screen, styles } from '../components/ui';
import { MEALS, targets, totals } from '../lib/model';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

export default function Today() {
  const t = useTheme();
  const { profile, day, setWater, removeEntry } = useStore();
  const goal = targets(profile);
  const sum = totals(day);

  return (
    <Screen>
      <DayHeader title="Fuel & Form" />

      <Card title="Fuel" right={<Muted>Target {goal.kcal.toLocaleString()} kcal</Muted>}>
        <View style={{ alignItems: 'center' }}>
          <Ring value={sum.kcal} goal={goal.kcal} />
        </View>
        <View style={{ gap: 12 }}>
          <MacroBar label="Protein" value={sum.p} goal={goal.p} color={t.protein} />
          <MacroBar label="Carbs" value={sum.c} goal={goal.c} color={t.carbs} />
          <MacroBar label="Fat" value={sum.f} goal={goal.f} color={t.fat} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Stat n={Math.round(sum.kcal).toLocaleString()} label="eaten" />
          <Stat n={goal.tdee.toLocaleString()} label="burn estimate" />
          <Stat n={String(day.meals.length)} label="items" />
        </View>
      </Card>

      <Card title="Water" right={<Muted>{day.water} / {profile.waterGoal} glasses</Muted>}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: profile.waterGoal }, (_, i) => (
            <Pressable
              key={i}
              accessibilityLabel={`Set water to ${i + 1} glasses`}
              onPress={() => setWater(day.water === i + 1 ? i : i + 1)}
              style={{
                width: 30, height: 38, borderWidth: 2, borderColor: t.protein,
                borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 9, borderBottomRightRadius: 9,
                backgroundColor: i < day.water ? t.protein : 'transparent',
              }}
            />
          ))}
        </View>
      </Card>

      <Card title="Meals">
        {MEALS.map((meal) => {
          const items = day.meals.filter((m) => m.meal === meal);
          const kcal = items.reduce((a, m) => a + m.kcal, 0);
          return (
            <View key={meal} style={{ gap: 4 }}>
              <View style={styles.rowBetween}>
                <Text style={{ color: t.muted, fontWeight: '700', letterSpacing: 1, fontSize: 13 }}>{meal.toUpperCase()}</Text>
                <Text style={{ color: t.muted, fontWeight: '700', fontSize: 13 }}>{Math.round(kcal)} KCAL</Text>
              </View>
              {items.length === 0 ? (
                <Muted>Nothing logged yet.</Muted>
              ) : (
                items.map((m) => (
                  <View key={m.id} style={[styles.rowBetween, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.line, gap: 10 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.ink }}>{m.name}</Text>
                      <Muted style={{ fontSize: 12 }}>
                        P {Math.round(m.p)}g · C {Math.round(m.c)}g · F {Math.round(m.f)}g
                      </Muted>
                    </View>
                    <Text style={{ color: t.ink, fontWeight: '700', fontSize: 16 }}>{Math.round(m.kcal)}</Text>
                    <Pressable accessibilityLabel={`Remove ${m.name}`} onPress={() => removeEntry(m.id)} hitSlop={8}>
                      <Text style={{ color: t.muted, fontSize: 20 }}>×</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </Card>
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
