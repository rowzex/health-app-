import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewInstance, Text, TextInput, View } from 'react-native';

import { Button, Muted, Screen, styles } from '../components/ui';
import { askCoach, ChatMessage } from '../lib/coach';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const PROMPTS = ['How am I doing today?', 'Suggest a high-protein dinner that fits', 'Which habit should I focus on?', "Plan tomorrow's meals"];
const GREETING: ChatMessage = {
  role: 'assistant',
  content: "Hi, I'm your coach. Log what you eat, tick habits as you go, and ask me anything: what to eat next, how to stay on track, or how to build a new routine.",
};

export default function Coach() {
  const t = useTheme();
  const { profile, days, date } = useStore();
  const [chat, setChat] = useState<ChatMessage[]>([GREETING]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);

  const ask = async (q: string) => {
    if (busy || !q.trim()) return;
    const next: ChatMessage[] = [...chat, { role: 'user', content: q.trim() }];
    setChat(next);
    setText('');
    setBusy(true);
    const answer = await askCoach(next.slice(1), profile, days, date);
    setChat([...next, { role: 'assistant', content: answer }]);
    setBusy(false);
  };

  return (
    <Screen scroll={false}>
      <Text style={[styles.brand, { color: t.ink }]}>Coach</Text>
      <KeyboardAvoidingView style={{ flex: 1, gap: 10 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }} onContentSizeChange={() => scroller.current?.scrollToEnd()}>
          {chat.map((m, i) => (
            <View
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', padding: 12, borderRadius: 12,
                backgroundColor: m.role === 'user' ? t.accent : t.surface, borderWidth: m.role === 'user' ? 0 : 1, borderColor: t.line,
              }}
            >
              <Text style={{ color: m.role === 'user' ? t.accentInk : t.ink, lineHeight: 20 }}>{m.content}</Text>
            </View>
          ))}
          {busy ? <Muted>Coach is thinking…</Muted> : null}
        </ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {PROMPTS.map((p) => <Button key={p} label={p} ghost small onPress={() => ask(p)} disabled={busy} />)}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={text} onChangeText={setText} onSubmitEditing={() => ask(text)} returnKeyType="send"
            placeholder="Ask your coach anything…" placeholderTextColor={t.muted}
            style={[styles.input, { flex: 1, borderColor: t.line, color: t.ink, backgroundColor: t.surface }]}
          />
          <Button label="Send" onPress={() => ask(text)} disabled={busy || !text.trim()} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
