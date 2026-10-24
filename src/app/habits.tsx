import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { FadeIn, haptic, Pop, useToast } from '../components/motion';
import { Button, Card, DayHeader, Muted, Screen, styles } from '../components/ui';
import { habitText } from '../lib/i18n';
import { dateKey, isDone, shiftKey, streak } from '../lib/model';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

export default function Habits() {
  const t = useTheme();
  const { profile, days, day, toggleHabit, addHabit, removeHabit, t: tr } = useStore();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const toast = useToast();
  const today = dateKey(new Date());
  const doneCount = profile.habits.filter((h) => isDone(h, day, profile)).length;

  const submit = () => {
    if (!name.trim()) return;
    addHabit(name.trim());
    haptic.success();
    toast(tr('habits.added'));
    setName('');
  };

  return (
    <Screen>
      <DayHeader title={tr('habits.title')} />
      <Card
        title={tr('habits.count', { d: doneCount, n: profile.habits.length })}
        right={<Pressable onPress={() => setEditing(!editing)}><Text style={{ color: t.accent, fontWeight: '600' }}>{editing ? tr('done') : tr('edit')}</Text></Pressable>}
      >
        {profile.habits.length === 0 ? <Muted>{tr('habits.empty')}</Muted> : null}
        {profile.habits.map((h, i) => {
          const on = isDone(h, day, profile);
          const s = streak(h, days, profile);
          const { name, note } = habitText(h, tr);
          return (
            <FadeIn key={h.id} delay={i * 40}>
            <View style={[styles.rowBetween, { gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.line }]}>
              <Pressable
                accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !!h.auto }} accessibilityLabel={name}
                disabled={!!h.auto}
                onPress={() => {
                  if (!on) {
                    haptic.success();
                    if (s + 1 >= 2) toast(tr('habits.streak', { n: s + 1, name }));
                  } else haptic.soft();
                  toggleHabit(h.id);
                }}
                style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 2, borderColor: on ? t.good : t.line, backgroundColor: on ? t.good : 'transparent', alignItems: 'center', justifyContent: 'center' }}
              >
                <Pop trigger={on}>
                  <Text style={{ color: on ? '#fff' : 'transparent', fontWeight: '800' }}>✓</Text>
                </Pop>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontWeight: '500' }}>{name}</Text>
                {note ? <Muted style={{ fontSize: 12 }}>{note}</Muted> : null}
                <View style={{ flexDirection: 'row', gap: 3, marginTop: 5 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const k = shiftKey(today, i - 6);
                    return <View key={k} style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: isDone(h, days[k], profile) ? t.good : t.chip }} />;
                  })}
                </View>
              </View>
              {editing ? (
                <Pressable onPress={() => { haptic.soft(); removeHabit(h.id); }} hitSlop={8} accessibilityLabel={`${tr('delete')} ${name}`}>
                  <Text style={{ color: t.warn, fontWeight: '600' }}>{tr('delete')}</Text>
                </Pressable>
              ) : (
                <Pop trigger={s}>
                  <Text style={{ color: s >= 3 ? t.accent : t.ink, fontWeight: '800', fontSize: 18, minWidth: 40, textAlign: 'right' }}>{s >= 3 ? '🔥' : ''}{s}d</Text>
                </Pop>
              )}
            </View>
            </FadeIn>
          );
        })}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={name} onChangeText={setName} onSubmitEditing={submit} returnKeyType="done" maxLength={60}
            placeholder={tr('habits.new')} placeholderTextColor={t.muted}
            style={[styles.input, { flex: 1, borderColor: t.line, color: t.ink, backgroundColor: t.bg }]}
          />
          <Button label={tr('add')} onPress={submit} disabled={!name.trim()} />
        </View>
      </Card>
      <Muted>{tr('habits.note')}</Muted>
    </Screen>
  );
}

