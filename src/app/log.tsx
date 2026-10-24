import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button, Card, Muted, Screen, styles } from '../components/ui';
import { Food, searchFoods } from '../lib/foods';
import { Meal, MEALS } from '../lib/model';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

function defaultMeal(): Meal {
  const h = new Date().getHours();
  return h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 21 ? 'Dinner' : 'Snack';
}

export default function LogFood() {
  const t = useTheme();
  const { addEntry } = useStore();
  const [q, setQ] = useState('');
  const [meal, setMeal] = useState<Meal>(defaultMeal);
  const [added, setAdded] = useState('');
  const [custom, setCustom] = useState({ name: '', kcal: '', p: '', c: '', f: '' });

  const add = (f: Food) => {
    addEntry({ ...f, meal });
    setAdded(`Added ${f.name} to ${meal}`);
  };
  const addCustom = () => {
    const kcal = Number(custom.kcal);
    if (!custom.name.trim() || !kcal) return;
    add({ name: custom.name.trim(), kcal, p: Number(custom.p) || 0, c: Number(custom.c) || 0, f: Number(custom.f) || 0 });
    setCustom({ name: '', kcal: '', p: '', c: '', f: '' });
  };
  const input = [styles.input, { borderColor: t.line, color: t.ink, backgroundColor: t.bg }];

  return (
    <Screen>
      <Card title="Log food">
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {MEALS.map((m) => (
            <Chip key={m} label={m} on={m === meal} onPress={() => setMeal(m)} />
          ))}
        </View>
        <TextInput
          value={q} onChangeText={setQ} placeholder="Search foods: chicken, oats, banana…"
          placeholderTextColor={t.muted} style={input} autoCorrect={false} clearButtonMode="while-editing"
        />
        {added ? <Text style={{ color: t.good, fontWeight: '600' }}>{added}</Text> : null}
        <View style={{ gap: 2 }}>
          {searchFoods(q).map((f) => (
            <Pressable
              key={f.name} onPress={() => add(f)}
              style={({ pressed }) => [styles.rowBetween, { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.line, opacity: pressed ? 0.6 : 1 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink }}>{f.name}</Text>
                <Muted style={{ fontSize: 12 }}>P {f.p}g · C {f.c}g · F {f.f}g</Muted>
              </View>
              <Text style={{ color: t.ink, fontWeight: '700' }}>{f.kcal} kcal  <Text style={{ color: t.accent }}>＋</Text></Text>
            </Pressable>
          ))}
          {searchFoods(q).length === 0 ? <Muted>No match. Add it as a custom food below.</Muted> : null}
        </View>
      </Card>

      <Card title="Custom food">
        <TextInput value={custom.name} onChangeText={(name) => setCustom({ ...custom, name })} placeholder="Name, e.g. Homemade lasagna" placeholderTextColor={t.muted} style={input} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['kcal', 'p', 'c', 'f'] as const).map((k) => (
            <TextInput
              key={k} value={custom[k]} onChangeText={(v) => setCustom({ ...custom, [k]: v })} keyboardType="decimal-pad"
              placeholder={{ kcal: 'kcal', p: 'Protein g', c: 'Carbs g', f: 'Fat g' }[k]} placeholderTextColor={t.muted}
              style={[...input, { flex: 1, paddingHorizontal: 8 }]}
            />
          ))}
        </View>
        <Button label={`Add to ${meal}`} onPress={addCustom} disabled={!custom.name.trim() || !Number(custom.kcal)} />
      </Card>
    </Screen>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress} accessibilityState={{ selected: on }}
      style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accent : 'transparent' }}
    >
      <Text style={{ color: on ? t.accentInk : t.ink, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
