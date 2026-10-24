// Snack entry point: same screens as the main app, with a simple built-in tab bar instead of Expo Router.
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StoreProvider } from './src/lib/store';
import Coach from './src/screens/coach';
import Habits from './src/screens/habits';
import Today from './src/screens/index';
import LogFood from './src/screens/log';
import Targets from './src/screens/profile';
import { useTheme } from './src/theme';

const TABS = [
  { key: 'today', title: 'Today', icon: '◎', Screen: Today },
  { key: 'log', title: 'Log food', icon: '+', Screen: LogFood },
  { key: 'habits', title: 'Habits', icon: '✓', Screen: Habits },
  { key: 'coach', title: 'Coach', icon: '✦', Screen: Coach },
  { key: 'targets', title: 'Targets', icon: '◐', Screen: Targets },
];

function Shell() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('today');
  const Active = TABS.find((x) => x.key === tab)!.Screen;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="auto" />
      <View style={{ flex: 1 }}>
        <Active />
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.line, paddingBottom: insets.bottom }}>
        {TABS.map((x) => {
          const on = x.key === tab;
          const color = on ? t.accent : t.muted;
          return (
            <Pressable key={x.key} onPress={() => setTab(x.key)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{x.icon}</Text>
              <Text style={{ color, fontSize: 11, marginTop: 2 }}>{x.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
