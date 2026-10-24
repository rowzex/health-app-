import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { haptic, useToast } from '../components/motion';

import { Button, Card, Muted, Screen, styles } from '../components/ui';
import { AI_SUPPORTED, loadApiKey, saveApiKey } from '../lib/ai';
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
      <View style={styles.rowBetween}>
        <Text style={[styles.brand, { color: t.ink }]}>My targets</Text>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={8}>
          <Text style={{ color: t.accent, fontWeight: '600' }}>Done</Text>
        </Pressable>
      </View>

      <Card title="Daily target">
        <Text style={{ color: t.ink, fontSize: 40, fontWeight: '800' }}>{goal.kcal.toLocaleString()} <Text style={{ fontSize: 16, color: t.muted }}>kcal</Text></Text>
        <Text style={{ color: t.ink }}>Protein {goal.p} g · Carbs {goal.c} g · Fat {goal.f} g</Text>
        <Muted>Estimated with the Mifflin-St Jeor formula from the details below. It's a starting point, not medical advice.</Muted>
      </Card>

      <AiCoachCard />

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
            key={String(o.value)} onPress={() => { haptic.tap(); onChange(o.value); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
            style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.chip : 'transparent' }}
          >
            <Text style={{ color: t.ink, fontWeight: on ? '700' : '400' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AiCoachCard() {
  const t = useTheme();
  const toast = useToast();
  const [hasKey, setHasKey] = useState(false);
  const [draft, setDraft] = useState('');

  useFocusEffect(useCallback(() => { loadApiKey().then((k) => setHasKey(!!k)); }, []));

  if (!AI_SUPPORTED)
    return (
      <Card title="AI coach">
        <Muted>The AI coach works in the phone app. Open Fuel & Form in Expo Go to set it up.</Muted>
      </Card>
    );

  const save = async () => {
    const key = draft.trim();
    if (!key.startsWith('sk-ant-')) {
      toast('That doesn\'t look like a Claude API key (it starts with sk-ant-)');
      return;
    }
    await saveApiKey(key);
    setDraft('');
    setHasKey(true);
    haptic.success();
    toast('AI coach is on');
  };

  return (
    <Card title="AI coach" right={<Text style={{ color: hasKey ? t.good : t.muted, fontWeight: '700' }}>{hasKey ? 'ON' : 'OFF'}</Text>}>
      {hasKey ? (
        <>
          <Muted>Your coach uses Claude to answer with personal advice and new recipes. Your key is stored securely on this phone only.</Muted>
          <Button ghost label="Remove key" onPress={async () => { await saveApiKey(null); setHasKey(false); toast('Key removed'); }} />
        </>
      ) : (
        <>
          <Muted>
            Paste a Claude API key to turn on the AI coach. Create one at console.anthropic.com under API keys. Usage is billed to your Anthropic account, usually a fraction of a cent per question. The key stays on this phone.
          </Muted>
          <TextInput
            value={draft} onChangeText={setDraft} placeholder="sk-ant-…" placeholderTextColor={t.muted}
            autoCapitalize="none" autoCorrect={false} secureTextEntry
            style={[styles.input, { borderColor: t.line, color: t.ink, backgroundColor: t.bg }]}
          />
          <Button label="Turn on AI coach" onPress={save} disabled={!draft.trim()} />
        </>
      )}
    </Card>
  );
}
