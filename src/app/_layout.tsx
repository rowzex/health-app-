import { StatusBar } from 'expo-status-bar';
import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider } from '../lib/store';
import { useTheme } from '../theme';

const ICONS: Record<string, string> = { index: '◎', log: '+', habits: '✓', coach: '✦', profile: '◐' };

export default function RootLayout() {
  const t = useTheme();
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: t.accent,
            tabBarInactiveTintColor: t.muted,
            tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{ICONS[route.name] ?? '•'}</Text>,
          })}
        >
          <Tabs.Screen name="index" options={{ title: 'Today' }} />
          <Tabs.Screen name="log" options={{ title: 'Log food' }} />
          <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
          <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
          <Tabs.Screen name="profile" options={{ title: 'Targets' }} />
        </Tabs>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
