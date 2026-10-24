import { StatusBar } from 'expo-status-bar';
import { Tabs } from 'expo-router/js-tabs';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { haptic, ToastProvider } from '../components/motion';
import { Onboarding } from '../components/onboarding';
import { StoreProvider, useStore } from '../lib/store';
import { useTheme } from '../theme';

const ICONS: Record<string, string> = { index: '◎', log: '+', recipes: '❋', habits: '✓', coach: '✦', calendar: '▦' };

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ToastProvider>
          <StatusBar style="auto" />
          <Gate />
        </ToastProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

/** Shows language choice and sign-up until the user has an account, then the app. */
function Gate() {
  const t = useTheme();
  const { ready, lang, signedIn, t: tr } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: t.bg }} />;
  if (!lang || !signedIn) return <Onboarding />;
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptic.tap() }}
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{ICONS[route.name] ?? '•'}</Text>,
      })}
    >
      <Tabs.Screen name="index" options={{ title: tr('tab.today') }} />
      <Tabs.Screen name="log" options={{ title: tr('tab.log') }} />
      <Tabs.Screen name="recipes" options={{ title: tr('tab.recipes') }} />
      <Tabs.Screen name="habits" options={{ title: tr('tab.habits') }} />
      <Tabs.Screen name="coach" options={{ title: tr('tab.coach') }} />
      <Tabs.Screen name="calendar" options={{ title: tr('tab.calendar') }} />
      <Tabs.Screen name="profile" options={{ title: tr('tab.targets'), href: null }} />
    </Tabs>
  );
}
