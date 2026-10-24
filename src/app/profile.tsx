import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { haptic, useToast } from '../components/motion';

import { Button, Card, Muted, Screen, styles } from '../components/ui';
import { AI_SUPPORTED, loadApiKey, saveApiKey } from '../lib/ai';
import { signOut as endSession } from '../lib/auth';
import { LANGS } from '../lib/i18n';
import { ACTIVITY, GOALS, Profile, targets } from '../lib/model';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

export default function Targets() {
  const t = useTheme();
  const { profile, updateProfile, t: tr, lang, setLang, account, signOut } = useStore();
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
        <Text style={[styles.brand, { color: t.ink }]}>{tr('prof.title')}</Text>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={8}>
          <Text style={{ color: t.accent, fontWeight: '600' }}>{tr('done')}</Text>
        </Pressable>
      </View>

      <Card title={tr('prof.daily')}>
        <Text style={{ color: t.ink, fontSize: 40, fontWeight: '800' }}>{goal.kcal.toLocaleString()} <Text style={{ fontSize: 16, color: t.muted }}>{tr('kcal')}</Text></Text>
        <Text style={{ color: t.ink }}>{tr('protein')} {goal.p} g · {tr('carbs')} {goal.c} g · {tr('fat')} {goal.f} g</Text>
        <Muted>{tr('prof.formula')}</Muted>
      </Card>

      <AiCoachCard />

      <Card title={tr('prof.about')}>
        <Options value={profile.sex} options={[{ value: 'f', label: tr('prof.female') }, { value: 'm', label: tr('prof.male') }]} onChange={(sex) => updateProfile({ sex })} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {num('age', tr('prof.age'))}
          {num('height', tr('prof.height'))}
          {num('weight', tr('prof.weight'))}
        </View>
      </Card>

      <Card title={tr('prof.activity')}>
        <Options value={profile.activity} options={ACTIVITY.map((a) => ({ ...a, label: tr(`act.${a.value}` as 'act.1.2') }))} onChange={(activity) => updateProfile({ activity })} />
      </Card>

      <Card title={tr('prof.goal')}>
        <Options value={profile.goal} options={GOALS.map((g) => ({ ...g, label: tr(`goal.${g.value}` as 'goal.0') }))} onChange={(g) => updateProfile({ goal: g })} />
      </Card>

      <Card title={tr('prof.water')}>
        {num('waterGoal', tr('prof.glassesDay'))}
      </Card>

      <Card title={tr('prof.language')}>
        <Options value={lang ?? 'en'} options={LANGS.map((l) => ({ value: l.code, label: l.name }))} onChange={setLang} />
      </Card>

      {account ? (
        <Card title={tr('prof.account')}>
          <Text style={{ color: t.ink, fontWeight: '700' }}>{account.name}</Text>
          <Muted>{account.email}</Muted>
          <Muted>{account.mode === 'cloud' ? tr('prof.cloudNote') : tr('prof.localNote')}</Muted>
          <Button ghost label={tr('prof.signOut')} onPress={async () => { await endSession(); signOut(); }} />
        </Card>
      ) : null}
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
  const { t: tr } = useStore();
  const [hasKey, setHasKey] = useState(false);
  const [draft, setDraft] = useState('');

  useFocusEffect(useCallback(() => { loadApiKey().then((k) => setHasKey(!!k)); }, []));

  if (!AI_SUPPORTED)
    return (
      <Card title={tr('ai.title')}>
        <Muted>{tr('ai.phoneOnly')}</Muted>
      </Card>
    );

  const save = async () => {
    const key = draft.trim();
    if (!key.startsWith('sk-ant-')) {
      toast(tr('ai.badKey'));
      return;
    }
    await saveApiKey(key);
    setDraft('');
    setHasKey(true);
    haptic.success();
    toast(tr('ai.isOn'));
  };

  return (
    <Card title={tr('ai.title')} right={<Text style={{ color: hasKey ? t.good : t.muted, fontWeight: '700' }}>{hasKey ? 'ON' : 'OFF'}</Text>}>
      {hasKey ? (
        <>
          <Muted>{tr('ai.on')}</Muted>
          <Button ghost label={tr('ai.remove')} onPress={async () => { await saveApiKey(null); setHasKey(false); toast(tr('ai.removed')); }} />
        </>
      ) : (
        <>
          <Muted>{tr('ai.off')}</Muted>
          <TextInput
            value={draft} onChangeText={setDraft} placeholder="sk-ant-…" placeholderTextColor={t.muted}
            autoCapitalize="none" autoCorrect={false} secureTextEntry
            style={[styles.input, { borderColor: t.line, color: t.ink, backgroundColor: t.bg }]}
          />
          <Button label={tr('ai.turnOn')} onPress={save} disabled={!draft.trim()} />
        </>
      )}
    </Card>
  );
}
