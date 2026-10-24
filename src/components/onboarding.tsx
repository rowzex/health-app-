import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthError, GUEST, sendCode, validEmail, verifyCode } from '../lib/auth';
import { deviceLang, Lang, LANGS } from '../lib/i18n';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';
import { FadeIn, haptic, PressScale } from './motion';
import { Button, Muted, Screen, styles } from './ui';

/** First launch: pick a language, then sign up or log in with email. */
export function Onboarding() {
  const { lang } = useStore();
  const [step, setStep] = useState<'lang' | 'account'>(lang ? 'account' : 'lang');
  return step === 'lang' ? <LanguageStep onNext={() => setStep('account')} /> : <AccountStep onBack={() => setStep('lang')} />;
}

function LanguageStep({ onNext }: { onNext: () => void }) {
  const t = useTheme();
  const { lang, setLang, t: tr } = useStore();
  const [picked, setPicked] = useState<Lang>(lang ?? deviceLang());
  const choose = (l: Lang) => { haptic.tap(); setPicked(l); setLang(l); };
  return (
    <Screen>
      <FadeIn>
        <View style={{ gap: 6, marginTop: 24 }}>
          <Text style={{ color: t.accent, fontSize: 34, fontWeight: '900' }}>Fuel & Form</Text>
          <Text style={[styles.brand, { color: t.ink }]}>{tr('ob.chooseLang')}</Text>
          <Muted>{tr('ob.langSub')}</Muted>
        </View>
      </FadeIn>
      {LANGS.map((l, i) => {
        const on = l.code === picked;
        return (
          <FadeIn key={l.code} delay={60 + i * 50}>
            <PressScale
              onPress={() => choose(l.code)} accessibilityRole="radio" accessibilityState={{ checked: on }}
              style={{ padding: 16, borderRadius: 12, borderWidth: 2, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.chip : t.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: t.ink, fontSize: 18, fontWeight: '700' }}>{l.name}</Text>
              <Text style={{ color: on ? t.accent : t.muted }}>{on ? '✓ ' : ''}{l.hello}</Text>
            </PressScale>
          </FadeIn>
        );
      })}
      <Button label={tr('ob.continue')} onPress={() => { setLang(picked); onNext(); }} />
    </Screen>
  );
}

function AccountStep({ onBack }: { onBack: () => void }) {
  const t = useTheme();
  const { t: tr, account, signIn } = useStore();
  const [name, setName] = useState(account?.name ?? '');
  const [email, setEmail] = useState(account?.email ?? '');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = [styles.input, { borderColor: t.line, color: t.ink, backgroundColor: t.surface }];

  const fail = (e: unknown) => setError(e instanceof AuthError ? tr(`ob.${e.code}`) : tr('ob.offline'));

  const send = async () => {
    setError('');
    if (!validEmail(email)) return setError(tr('ob.badEmail'));
    setBusy(true);
    try {
      await sendCode(email, name);
      haptic.success();
      setCode('');
      setSentTo(email.trim().toLowerCase());
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError('');
    if (code.trim().length < 6) return setError(tr('ob.badCode'));
    setBusy(true);
    try {
      const acc = await verifyCode(sentTo, code, name);
      haptic.success();
      signIn(acc);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const skip = () => { haptic.tap(); signIn(account?.mode === 'cloud' ? account : GUEST); };

  return (
    <Screen>
      <Pressable onPress={onBack} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
        <Text style={{ color: t.accent, fontWeight: '600' }}>{tr('ob.back')}</Text>
      </Pressable>
      <FadeIn key={sentTo ? 'code' : 'email'}>
        <View style={{ gap: 6 }}>
          <Text style={[styles.brand, { color: t.ink, fontSize: 28 }]}>{tr('ob.title')}</Text>
          <Muted>{sentTo ? tr('ob.codeSent', { email: sentTo }) : tr('ob.sub')}</Muted>
        </View>
      </FadeIn>
      {!sentTo ? (
        <>
          <TextInput value={name} onChangeText={setName} placeholder={tr('ob.nameOptional')} placeholderTextColor={t.muted} style={input} autoComplete="name" textContentType="name" returnKeyType="next" />
          <TextInput
            value={email} onChangeText={setEmail} placeholder={tr('ob.email')} placeholderTextColor={t.muted} style={input}
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
            returnKeyType="send" onSubmitEditing={send}
          />
          {error ? <Text style={{ color: t.warn, fontWeight: '600' }}>{error}</Text> : null}
          <Button label={busy ? '…' : tr('ob.sendCode')} onPress={send} disabled={busy} />
        </>
      ) : (
        <>
          <TextInput
            value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder={tr('ob.code')} placeholderTextColor={t.muted}
            style={[...input, { fontSize: 24, letterSpacing: 8, textAlign: 'center' }]} keyboardType="number-pad" maxLength={6}
            autoComplete="one-time-code" textContentType="oneTimeCode" autoFocus returnKeyType="go" onSubmitEditing={verify}
          />
          {error ? <Text style={{ color: t.warn, fontWeight: '600' }}>{error}</Text> : null}
          <Button label={busy ? '…' : tr('ob.verify')} onPress={verify} disabled={busy || code.length < 6} />
          <View style={[styles.rowBetween, { paddingHorizontal: 4 }]}>
            <Pressable onPress={send} disabled={busy} hitSlop={8}><Text style={{ color: t.accent, fontWeight: '600' }}>{tr('ob.resend')}</Text></Pressable>
            <Pressable onPress={() => { setSentTo(''); setError(''); }} hitSlop={8}><Text style={{ color: t.muted, fontWeight: '600' }}>{tr('ob.changeEmail')}</Text></Pressable>
          </View>
        </>
      )}
      <View style={{ height: 8 }} />
      <Button ghost label={tr('ob.skip')} onPress={skip} />
      <Muted style={{ fontSize: 12, textAlign: 'center' }}>{tr('ob.skipNote')}</Muted>
    </Screen>
  );
}
