import { Day, dateKey, isDone, Profile, streak, targets, totals } from './model';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Everything the coach knows about the user's day, sent with each question. */
export function snapshot(profile: Profile, days: Record<string, Day>, date: string) {
  const day = days[date];
  const t = targets(profile);
  const s = totals(day);
  const r = Math.round;
  return {
    date,
    targets: t,
    eaten: { kcal: r(s.kcal), protein: r(s.p), carbs: r(s.c), fat: r(s.f) },
    foods: (day?.meals ?? []).map((m) => `${m.meal}: ${m.name} (${r(m.kcal)} kcal)`),
    water: `${day?.water ?? 0}/${profile.waterGoal} glasses`,
    habits: profile.habits.map((h) => ({
      name: h.name,
      doneToday: isDone(h, day, profile),
      streakDays: streak(h, days, profile),
    })),
    profile: { sex: profile.sex === 'm' ? 'male' : 'female', age: profile.age, heightCm: profile.height, weightKg: profile.weight, dailyKcalVsMaintenance: profile.goal },
  };
}

/**
 * Asks the AI coach through a small backend (EXPO_PUBLIC_COACH_URL) so no API
 * key ships inside the app. Without one configured, it answers with built-in tips.
 */
export async function askCoach(history: ChatMessage[], profile: Profile, days: Record<string, Day>, date: string): Promise<string> {
  const url = process.env.EXPO_PUBLIC_COACH_URL;
  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10), snapshot: snapshot(profile, days, date) }),
      });
      if (res.ok) {
        const body = (await res.json()) as { text?: string };
        if (body.text) return body.text;
      }
    } catch {
      // fall through to built-in tips
    }
  }
  return builtInTips(profile, days, date);
}

export function builtInTips(profile: Profile, days: Record<string, Day>, date: string): string {
  const day = days[date];
  const t = targets(profile);
  const s = totals(day);
  const out: string[] = [];
  const left = Math.round(t.kcal - s.kcal);
  const proteinLeft = Math.round(t.p - s.p);
  const logged = (day?.meals.length ?? 0) > 0;

  if (!logged) out.push("Nothing logged yet. Start with what you've eaten so far; rough numbers are fine.");
  else if (left < 0) out.push(`You're ${-left} kcal over target. One day doesn't undo progress. Keep the next meal light and high in protein.`);
  else out.push(`You have ${left} kcal left today.`);

  if (logged && proteinLeft > 0)
    out.push(`Protein is ${proteinLeft} g short. Greek yogurt, a can of tuna or a chicken breast closes most of that gap.`);

  if ((day?.water ?? 0) < 4 && date === dateKey(new Date()) && new Date().getHours() >= 13)
    out.push('Water is behind. Have a glass now and one with every meal.');

  const focus = profile.habits
    .filter((h) => !h.auto)
    .sort((a, b) => streak(a, days, profile) - streak(b, days, profile))[0];
  if (focus)
    out.push(`Focus habit: "${focus.name}". Make it small enough that you can't fail, and tie it to something you already do every day.`);

  return out.join('\n\n');
}
