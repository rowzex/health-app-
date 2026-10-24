import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthError, CLOUD_AUTH, logIn, signUp, validEmail } from '../lib/auth';
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
  const [mode, setMode] = useState<'signup' | 'login'>(account ? 'login' : 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(account?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const input = [styles.input, { borderColor: t.line, color: t.ink, backgroundColor: t.surface }];

  const submit = async () => {
    setError('');
    setInfo('');
    if (mode === 'signup' && !name.trim()) return setError(tr('ob.needName'));
    if (!validEmail(email)) return setError(tr('ob.badEmail'));
    if (password.length < 8) return setError(tr('ob.shortPass'));
    setBusy(true);
    try {
      const acc = mode === 'signup' ? await signUp(name, email, password, account ?? undefined) : await logIn(email, password, account ?? undefined);
      haptic.success();
      signIn(acc);
    } catch (e) {
      if (e instanceof AuthError && e.code === 'confirm') {
        setInfo(tr('ob.confirm'));
        setMode('login');
      } else setError(e instanceof AuthError ? tr(`ob.${e.code}`) : tr('ob.offline'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Pressable onPress={onBack} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
        <Text style={{ color: t.accent, fontWeight: '600' }}>{tr('ob.back')}</Text>
      </Pressable>
      <FadeIn key={mode}>
        <View style={{ gap: 6 }}>
          <Text style={[styles.brand, { color: t.ink, fontSize: 28 }]}>{mode === 'signup' ? tr('ob.signupTitle') : tr('ob.loginTitle')}</Text>
          <Muted>{tr('ob.signupSub')}</Muted>
        </View>
      </FadeIn>
      {mode === 'signup' ? (
        <TextInput value={name} onChangeText={setName} placeholder={tr('ob.name')} placeholderTextColor={t.muted} style={input} autoComplete="name" textContentType="name" returnKeyType="next" />
      ) : null}
      <TextInput
        value={email} onChangeText={setEmail} placeholder={tr('ob.email')} placeholderTextColor={t.muted} style={input}
        autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" returnKeyType="next"
      />
      <TextInput
        value={password} onChangeText={setPassword} placeholder={tr('ob.password')} placeholderTextColor={t.muted} style={input}
        secureTextEntry autoCapitalize="none" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        textContentType={mode === 'signup' ? 'newPassword' : 'password'} returnKeyType="go" onSubmitEditing={submit}
      />
      {error ? <Text style={{ color: t.warn, fontWeight: '600' }}>{error}</Text> : null}
      {info ? <Text style={{ color: t.good, fontWeight: '600' }}>{info}</Text> : null}
      <Button label={busy ? '…' : mode === 'signup' ? tr('ob.signup') : tr('ob.login')} onPress={submit} disabled={busy} />
      <Pressable onPress={() => { haptic.tap(); setError(''); setMode(mode === 'signup' ? 'login' : 'signup'); }} hitSlop={8} style={{ alignSelf: 'center', padding: 6 }}>
        <Text style={{ color: t.accent, fontWeight: '600' }}>{mode === 'signup' ? tr('ob.haveAccount') : tr('ob.noAccount')}</Text>
      </Pressable>
      {!CLOUD_AUTH ? <Muted style={{ fontSize: 11, textAlign: 'center' }}>{tr('prof.localNote')}</Muted> : null}
    </Screen>
  );
}
