import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, Text, TextInput, View } from 'react-native';

import { FadeIn, haptic, TypingDots } from '../components/motion';
import { RecipeCard, RecipeSheet } from '../components/recipe';
import { Bubble, Button, Muted, Screen, styles } from '../components/ui';
import { AI_SUPPORTED, loadApiKey } from '../lib/ai';
import { answerKey, askCoach, CoachError } from '../lib/coach';
import { LANG_FOR_AI } from '../lib/i18n';
import { Recipe } from '../lib/recipes';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const PROMPTS = ['coach.p1', 'coach.p2', 'coach.p3', 'coach.p4', 'coach.p5'] as const;

export default function Coach() {
  const t = useTheme();
  const store = useStore();
  const { profile, days, date, coach, recordAnswer, clearChat, t: tr, lang } = store;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Recipe | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const scroller = useRef<ScrollViewInstance>(null);

  useFocusEffect(useCallback(() => { loadApiKey().then(setApiKey); }, []));

  const ask = async (q: string) => {
    const question = q.trim();
    if (busy || !question) return;
    haptic.tap();
    setText('');
    setError('');
    const key = answerKey(question, profile, days, date, lang ?? 'en');
    const same = coach.answers[key];
    if (same) {
      recordAnswer(question, key, same); // same question, same day: same answer
      return;
    }
    setBusy(true);
    try {
      const answer = await askCoach(question, { apiKey, profile, days, date, history: coach.chat, suggested: coach.suggested, usedTips: coach.usedTips, language: LANG_FOR_AI[lang ?? 'en'] });
      recordAnswer(question, key, answer);
      haptic.success();
    } catch (e) {
      setError(e instanceof CoachError ? tr(`err.${e.code}`) : tr('err.other'));
      setText(question);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll={false} onKeyboard={() => scroller.current?.scrollToEnd({ animated: true })}>
      <View style={styles.rowBetween}>
        <Text style={[styles.brand, { color: t.ink }]}>{tr('coach.title')}</Text>
        {coach.chat.length ? <Pressable onPress={() => { haptic.tap(); clearChat(); }}><Text style={{ color: t.muted, fontWeight: '600' }}>{tr('coach.newChat')}</Text></Pressable> : null}
      </View>
      {!apiKey ? (
        <Pressable onPress={() => router.push('/profile')} style={{ backgroundColor: t.chip, borderRadius: 10, padding: 10 }}>
          <Text style={{ color: t.ink, fontSize: 13 }}>
            {AI_SUPPORTED ? tr('coach.builtIn') : tr('coach.webBuiltIn')}
            {AI_SUPPORTED ? <Text style={{ color: t.accent, fontWeight: '700' }}>{tr('coach.addKey')}</Text> : tr('coach.openPhone')}
          </Text>
        </Pressable>
      ) : null}

      <View style={{ flex: 1, gap: 10 }}>
        <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 6 }} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}>
          <Bubble role="assistant" text={tr('coach.hello')} />
          <Muted style={{ fontSize: 12, textAlign: 'center' }}>{tr('coach.savedNote')}</Muted>
          {coach.chat.map((m, i) => (
            <FadeIn key={i}>
              <View style={{ gap: 8 }}>
                <Bubble role={m.role} text={m.content} />
                {m.recipes?.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {m.recipes.map((r) => <RecipeCard key={r.id} recipe={r} width={190} onPress={() => { haptic.tap(); setOpen(r); }} />)}
                  </ScrollView>
                ) : null}
              </View>
            </FadeIn>
          ))}
          {busy ? <TypingDots /> : null}
          {error ? <Text style={{ color: t.warn, fontWeight: '600' }}>{error}</Text> : null}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ flexGrow: 0 }}>
          {PROMPTS.map((p) => <Button key={p} label={tr(p)} ghost small onPress={() => ask(tr(p))} disabled={busy} />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={text} onChangeText={setText} onSubmitEditing={() => ask(text)} returnKeyType="send"
            placeholder={tr('coach.placeholder')} placeholderTextColor={t.muted}
            style={[styles.input, { flex: 1, borderColor: t.line, color: t.ink, backgroundColor: t.surface }]}
          />
          <Button label={tr('coach.send')} onPress={() => ask(text)} disabled={busy || !text.trim()} />
        </View>
      </View>
      <RecipeSheet recipe={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

