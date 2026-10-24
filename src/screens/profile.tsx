import { Pressable, Text, TextInput, View } from 'react-native';

import { Card, Muted, Screen, styles } from '../components/ui';
import { ACTIVITY, GOALS, Profile, targets } from '../lib/model';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

export default function Targets() {
  const t = useTheme();
  const { profile, updateProfile } = useStore();
  const goal = targets(profile);

  const num = (key: 'age' | 'height' | 'weight' | 'waterGoal', label: string) => (
    <View style={{ flex: 1, gap: 4 }}>
      <Muted style={{ fontSize: 12 }}>{label}</Muted>
      <TextInput
        defaultValue={String(profile[key])} keyboardType="decimal-pad"
        onChangeText={(v) => { const n = Number(v); if (n > 0) updateProfile({ [key]: key === 'waterGoal' ? Math.min(16, Math.round(n)) : n } as Partial<Profile>); }}
        style={[styles.input, { borderColor: t.line, color: t.ink, backgroundColor: t.bg }]}
      />
    </View>
  );

  return (
    <Screen>
      <Text style={[styles.brand, { color: t.ink }]}>My targets</Text>

      <Card title="Daily target">
        <Text style={{ color: t.ink, fontSize: 40, fontWeight: '800' }}>{goal.kcal.toLocaleString()} <Text style={{ fontSize: 16, color: t.muted }}>kcal</Text></Text>
        <Text style={{ color: t.ink }}>Protein {goal.p} g · Carbs {goal.c} g · Fat {goal.f} g</Text>
        <Muted>Estimated with the Mifflin-St Jeor formula from the details below. It's a starting point, not medical advice.</Muted>
      </Card>

      <Card title="About you">
        <Options value={profile.sex} options={[{ value: 'f', label: 'Female' }, { value: 'm', label: 'Male' }]} onChange={(sex) => updateProfile({ sex })} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {num('age', 'Age')}
          {num('height', 'Height cm')}
          {num('weight', 'Weight kg')}
        </View>
      </Card>

      <Card title="Activity">
        <Options value={profile.activity} options={ACTIVITY} onChange={(activity) => updateProfile({ activity })} />
      </Card>

      <Card title="Goal">
        <Options value={profile.goal} options={GOALS} onChange={(g) => updateProfile({ goal: g })} />
      </Card>

      <Card title="Water">
        {num('waterGoal', 'Glasses per day')}
      </Card>
    </Screen>
  );
}

function Options<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)} onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{ checked: on }}
            style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.chip : 'transparent' }}
          >
            <Text style={{ color: t.ink, fontWeight: on ? '700' : '400' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
