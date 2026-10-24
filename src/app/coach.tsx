import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, Text, TextInput, View } from 'react-native';

import { FadeIn, haptic, TypingDots } from '../components/motion';
import { RecipeCard, RecipeSheet } from '../components/recipe';
import { Button, Muted, Screen, styles } from '../components/ui';
import { AI_SUPPORTED, loadApiKey } from '../lib/ai';
import { answerKey, askCoach, CoachError } from '../lib/coach';
import { Recipe } from '../lib/recipes';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const PROMPTS = ['How am I doing today?', 'High-protein dinner idea', 'Quick healthy snack', 'Plan my meals for tomorrow', 'Which habit should I focus on?'];

export default function Coach() {
  const t = useTheme();
  const store = useStore();
  const { profile, days, date, coach, recordAnswer, clearChat } = store;
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
    const key = answerKey(question, profile, days, date);
    const same = coach.answers[key];
    if (same) {
      recordAnswer(question, key, same); // same question, same day: same answer
      return;
    }
    setBusy(true);
    try {
      const answer = await askCoach(question, { apiKey, profile, days, date, history: coach.chat, suggested: coach.suggested, usedTips: coach.usedTips });
      recordAnswer(question, key, answer);
      haptic.success();
    } catch (e) {
      setError(e instanceof CoachError ? e.message : 'Something went wrong. Try again.');
      setText(question);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.rowBetween}>
        <Text style={[styles.brand, { color: t.ink }]}>Coach</Text>
        {coach.chat.length ? <Pressable onPress={() => { haptic.tap(); clearChat(); }}><Text style={{ color: t.muted, fontWeight: '600' }}>New chat</Text></Pressable> : null}
      </View>
      {!apiKey ? (
        <Pressable onPress={() => router.push('/profile')} style={{ backgroundColor: t.chip, borderRadius: 10, padding: 10 }}>
          <Text style={{ color: t.ink, fontSize: 13 }}>
            {AI_SUPPORTED ? 'Using built-in tips. ' : 'The web preview uses built-in tips. '}
            {AI_SUPPORTED ? <Text style={{ color: t.accent, fontWeight: '700' }}>Add your Claude API key ›</Text> : 'Open the app on your phone for the AI coach.'}
          </Text>
        </Pressable>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1, gap: 10 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 6 }} onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}>
          <Bubble role="assistant" text="Hi, I'm your coach. Ask me what to eat, how to hit your protein, or how to build a habit. When I suggest food, I'll give you the recipe with a photo, and you can log it in one tap." />
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
          {PROMPTS.map((p) => <Button key={p} label={p} ghost small onPress={() => ask(p)} disabled={busy} />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={text} onChangeText={setText} onSubmitEditing={() => ask(text)} returnKeyType="send"
            placeholder="Ask your coach anything…" placeholderTextColor={t.muted}
            style={[styles.input, { flex: 1, borderColor: t.line, color: t.ink, backgroundColor: t.surface }]}
          />
          <Button label="Send" onPress={() => ask(text)} disabled={busy || !text.trim()} />
        </View>
      </KeyboardAvoidingView>
      <RecipeSheet recipe={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const t = useTheme();
  const me = role === 'user';
  return (
    <View
      style={{
        alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '88%', paddingVertical: 10, paddingHorizontal: 13, borderRadius: 16,
        borderBottomRightRadius: me ? 4 : 16, borderBottomLeftRadius: me ? 16 : 4,
        backgroundColor: me ? t.accent : t.surface, borderWidth: me ? 0 : 1, borderColor: t.line,
      }}
    >
      <Text style={{ color: me ? t.accentInk : t.ink, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}
