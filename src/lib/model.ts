export type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export type Entry = { id: string; name: string; kcal: number; p: number; c: number; f: number; meal: Meal; img?: string };
export type Day = { meals: Entry[]; water: number; done: string[] };
export type Habit = { id: string; name: string; note?: string; auto?: 'water' | 'protein' };

export type Profile = {
  sex: 'f' | 'm';
  age: number;
  height: number; // cm
  weight: number; // kg
  activity: number; // TDEE multiplier
  goal: number; // kcal per day relative to maintenance
  waterGoal: number; // glasses
  habits: Habit[];
};

export const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Drink 8 glasses of water', note: 'Ticks itself when you log 8 glasses', auto: 'water' },
  { id: 'h2', name: 'Hit protein target', note: 'Ticks itself from your food log', auto: 'protein' },
  { id: 'h3', name: 'Train or walk 30 min' },
  { id: 'h4', name: 'Sleep before 23:30' },
  { id: 'h5', name: 'No screens in bed' },
];

export const DEFAULT_PROFILE: Profile = {
  sex: 'f', age: 28, height: 165, weight: 65, activity: 1.375, goal: -250, waterGoal: 8, habits: DEFAULT_HABITS,
};

export const ACTIVITY = [
  { value: 1.2, label: 'Mostly sitting' },
  { value: 1.375, label: 'Light, 1–3 workouts a week' },
  { value: 1.55, label: 'Moderate, 3–5 a week' },
  { value: 1.725, label: 'Hard, 6–7 a week' },
];

export const GOALS = [
  { value: -500, label: 'Lose about 0.5 kg a week' },
  { value: -250, label: 'Lose slowly' },
  { value: 0, label: 'Maintain' },
  { value: 250, label: 'Build muscle' },
];

export const emptyDay = (): Day => ({ meals: [], water: 0, done: [] });

export function dateKey(d: Date): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function shiftKey(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}

export type Targets = { kcal: number; p: number; c: number; f: number; tdee: number };

/** Mifflin-St Jeor BMR × activity, adjusted for the goal. */
export function targets(p: Profile): Targets {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const tdee = bmr * p.activity;
  const kcal = Math.max(p.sex === 'm' ? 1500 : 1200, Math.round((tdee + p.goal) / 10) * 10);
  const protein = Math.round(p.weight * (p.goal > 0 ? 1.8 : 1.6));
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, p: protein, c: carbs, f: fat, tdee: Math.round(tdee) };
}

export function totals(day: Day | undefined) {
  return (day?.meals ?? []).reduce(
    (t, m) => ({ kcal: t.kcal + m.kcal, p: t.p + m.p, c: t.c + m.c, f: t.f + m.f }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

export function isDone(h: Habit, day: Day | undefined, profile: Profile): boolean {
  if (!day) return false;
  if (h.auto === 'water') return day.water >= profile.waterGoal;
  if (h.auto === 'protein') return totals(day).p >= targets(profile).p;
  return day.done.includes(h.id);
}

/** Consecutive days done, ending today. An unticked today doesn't break the streak yet. */
export function streak(h: Habit, days: Record<string, Day>, profile: Profile, today = dateKey(new Date())): number {
  let k = isDone(h, days[today], profile) ? today : shiftKey(today, -1);
  let n = 0;
  while (isDone(h, days[k], profile)) {
    n++;
    k = shiftKey(k, -1);
  }
  return n;
}
