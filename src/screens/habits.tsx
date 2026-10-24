import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button, Card, DayHeader, Muted, Screen, styles } from '../components/ui';
import { dateKey, isDone, shiftKey, streak } from '../lib/model';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

export default function Habits() {
  const t = useTheme();
  const { profile, days, day, toggleHabit, addHabit, removeHabit } = useStore();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const today = dateKey(new Date());
  const doneCount = profile.habits.filter((h) => isDone(h, day, profile)).length;

  const submit = () => {
    if (!name.trim()) return;
    addHabit(name.trim());
    setName('');
  };

  return (
    <Screen>
      <DayHeader title="Habits" />
      <Card
        title={`${doneCount} of ${profile.habits.length} done`}
        right={<Pressable onPress={() => setEditing(!editing)}><Text style={{ color: t.accent, fontWeight: '600' }}>{editing ? 'Done' : 'Edit'}</Text></Pressable>}
      >
        {profile.habits.length === 0 ? <Muted>Add your first habit below.</Muted> : null}
        {profile.habits.map((h) => {
          const on = isDone(h, day, profile);
          const s = streak(h, days, profile);
          return (
            <View key={h.id} style={[styles.rowBetween, { gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.line }]}>
              <Pressable
                accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !!h.auto }} accessibilityLabel={h.name}
                disabled={!!h.auto} onPress={() => toggleHabit(h.id)}
                style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 2, borderColor: on ? t.good : t.line, backgroundColor: on ? t.good : 'transparent', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: on ? '#fff' : 'transparent', fontWeight: '800' }}>✓</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontWeight: '500' }}>{h.name}</Text>
                {h.note ? <Muted style={{ fontSize: 12 }}>{h.note}</Muted> : null}
                <View style={{ flexDirection: 'row', gap: 3, marginTop: 5 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const k = shiftKey(today, i - 6);
                    return <View key={k} style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: isDone(h, days[k], profile) ? t.good : t.chip }} />;
                  })}
                </View>
              </View>
              {editing ? (
                <Pressable onPress={() => removeHabit(h.id)} hitSlop={8} accessibilityLabel={`Delete ${h.name}`}>
                  <Text style={{ color: t.warn, fontWeight: '600' }}>Delete</Text>
                </Pressable>
              ) : (
                <Text style={{ color: s >= 3 ? t.accent : t.ink, fontWeight: '800', fontSize: 18, minWidth: 40, textAlign: 'right' }}>{s}d</Text>
              )}
            </View>
          );
        })}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={name} onChangeText={setName} onSubmitEditing={submit} returnKeyType="done" maxLength={60}
            placeholder="New habit, e.g. Stretch 10 min" placeholderTextColor={t.muted}
            style={[styles.input, { flex: 1, borderColor: t.line, color: t.ink, backgroundColor: t.bg }]}
          />
          <Button label="Add" onPress={submit} disabled={!name.trim()} />
        </View>
      </Card>
      <Muted>Streaks count consecutive days. Today only counts once you tick it, and an unticked today doesn't break your streak until tomorrow.</Muted>
    </Screen>
  );
}
