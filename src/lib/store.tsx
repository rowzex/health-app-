import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { Turn } from './ai';
import type { CoachAnswer } from './coach';
import { dateKey, Day, DEFAULT_PROFILE, emptyDay, Entry, Habit, Profile } from './model';
import type { Recipe } from './recipes';

const KEY = 'fuel-and-form:v1';

type Coach = {
  chat: Turn[];
  suggested: string[]; // recipe titles already offered, so they aren't offered again
  usedTips: string[];
  answers: Record<string, CoachAnswer>; // same question + same day data -> same answer
};

type Saved = { profile: Profile; days: Record<string, Day>; saved: Recipe[]; coach: Coach };

const EMPTY_COACH: Coach = { chat: [], suggested: [], usedTips: [], answers: {} };

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
  toggleSaved: (r: Recipe) => void;
  recordAnswer: (question: string, key: string, answer: CoachAnswer) => void;
  clearChat: () => void;
};

const Ctx = createContext<Store | null>(null);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>({ profile: DEFAULT_PROFILE, days: {}, saved: [], coach: EMPTY_COACH });
  const [ready, setReady] = useState(false);
  const [date, setDate] = useState(() => dateKey(new Date()));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Saved>;
        setSaved({
          profile: { ...DEFAULT_PROFILE, ...parsed.profile },
          days: parsed.days ?? {},
          saved: parsed.saved ?? [],
          coach: { ...EMPTY_COACH, ...parsed.coach },
        });
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
      toggleSaved: (r) =>
        setSaved((s) => ({
          ...s,
          saved: s.saved.some((x) => x.title === r.title) ? s.saved.filter((x) => x.title !== r.title) : [r, ...s.saved],
        })),
      recordAnswer: (question, key, answer) =>
        setSaved((s) => {
          const c = s.coach;
          const keys = Object.keys(c.answers);
          const answers = { ...c.answers, [key]: answer };
          if (keys.length > 80) delete answers[keys[0]];
          return {
            ...s,
            coach: {
              chat: [...c.chat, { role: 'user' as const, content: question }, { role: 'assistant' as const, content: answer.text, recipes: answer.recipes }].slice(-60),
              suggested: [...c.suggested, ...answer.recipes.map((r) => r.title)].slice(-120),
              usedTips: [...c.usedTips, ...(answer.usedTips ?? [])].slice(-40),
              answers,
            },
          };
        }),
      clearChat: () => setSaved((s) => ({ ...s, coach: { ...s.coach, chat: [] } })),
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
