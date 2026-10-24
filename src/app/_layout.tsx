import { StatusBar } from 'expo-status-bar';
import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { haptic, ToastProvider } from '../components/motion';
import { StoreProvider } from '../lib/store';
import { useTheme } from '../theme';

const ICONS: Record<string, string> = { index: '◎', log: '+', recipes: '❋', habits: '✓', coach: '✦' };

export default function RootLayout() {
  const t = useTheme();
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ToastProvider>
          <StatusBar style="auto" />
          <Tabs
            screenListeners={{ tabPress: () => haptic.tap() }}
            screenOptions={({ route }) => ({
              headerShown: false,
              animation: 'shift',
              tabBarActiveTintColor: t.accent,
              tabBarInactiveTintColor: t.muted,
              tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{ICONS[route.name] ?? '•'}</Text>,
            })}
          >
            <Tabs.Screen name="index" options={{ title: 'Today' }} />
            <Tabs.Screen name="log" options={{ title: 'Log food' }} />
            <Tabs.Screen name="recipes" options={{ title: 'Recipes' }} />
            <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
            <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
            <Tabs.Screen name="profile" options={{ title: 'Targets', href: null }} />
          </Tabs>
        </ToastProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
