import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { dateKey, Day, DEFAULT_PROFILE, emptyDay, Entry, Habit, Profile } from './model';

const KEY = 'fuel-and-form:v1';

type Saved = { profile: Profile; days: Record<string, Day> };

type Store = Saved & {
  ready: boolean;
  date: string;
  setDate: (key: string) => void;
  day: Day;
  addEntry: (e: Omit<Entry, 'id'>) => void;
  removeEntry: (id: string) => void;
  setWater: (n: number) => void;
  toggleHabit: (id: string) => void;
  addHabit: (name: string) => void;
  removeHabit: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
};

const Ctx = createContext<Store | null>(null);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>({ profile: DEFAULT_PROFILE, days: {} });
  const [ready, setReady] = useState(false);
  const [date, setDate] = useState(() => dateKey(new Date()));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Saved>;
        setSaved({ profile: { ...DEFAULT_PROFILE, ...parsed.profile }, days: parsed.days ?? {} });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
    }, 400);
  }, [saved, ready]);

  const editDay = useCallback(
    (fn: (d: Day) => Day) =>
      setSaved((s) => ({ ...s, days: { ...s.days, [date]: fn(s.days[date] ?? emptyDay()) } })),
    [date],
  );
  const editProfile = useCallback(
    (fn: (p: Profile) => Profile) => setSaved((s) => ({ ...s, profile: fn(s.profile) })),
    [],
  );

  const value = useMemo<Store>(
    () => ({
      ...saved,
      ready,
      date,
      setDate,
      day: saved.days[date] ?? emptyDay(),
      addEntry: (e) => editDay((d) => ({ ...d, meals: [...d.meals, { ...e, id: uid() }] })),
      removeEntry: (id) => editDay((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== id) })),
      setWater: (n) => editDay((d) => ({ ...d, water: Math.max(0, n) })),
      toggleHabit: (id) =>
        editDay((d) => ({ ...d, done: d.done.includes(id) ? d.done.filter((x) => x !== id) : [...d.done, id] })),
      addHabit: (name) =>
        editProfile((p) => ({ ...p, habits: [...p.habits, { id: 'h' + uid(), name } satisfies Habit] })),
      removeHabit: (id) => editProfile((p) => ({ ...p, habits: p.habits.filter((h) => h.id !== id) })),
      updateProfile: (patch) => editProfile((p) => ({ ...p, ...patch })),
    }),
    [saved, ready, date, editDay, editProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
