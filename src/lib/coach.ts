import { CoachError, Turn, askClaude } from './ai';
import { Day, dateKey, isDone, Profile, streak, targets, totals } from './model';
import { mealForNow, rankForToday, Recipe, RECIPES } from './recipes';

/** Everything the coach knows about the user's day, sent with each question. */
export function snapshot(profile: Profile, days: Record<string, Day>, date: string) {
  const day = days[date];
  const t = targets(profile);
  const s = totals(day);
  const r = Math.round;
  return {
    date,
    localTime: new Date().toTimeString().slice(0, 5),
    targets: t,
    eaten: { kcal: r(s.kcal), protein: r(s.p), carbs: r(s.c), fat: r(s.f) },
    left: { kcal: r(t.kcal - s.kcal), protein: r(t.p - s.p) },
    foods: (day?.meals ?? []).map((m) => `${m.meal}: ${m.name} (${r(m.kcal)} kcal)`),
    water: `${day?.water ?? 0}/${profile.waterGoal} glasses`,
    habits: profile.habits.map((h) => ({ name: h.name, doneToday: isDone(h, day, profile), streakDays: streak(h, days, profile) })),
    profile: { sex: profile.sex === 'm' ? 'male' : 'female', age: profile.age, heightCm: profile.height, weightKg: profile.weight, dailyKcalVsMaintenance: profile.goal },
  };
}

/** Same question on the same day with the same log gives the same answer; anything else gets a fresh one. */
export function answerKey(question: string, profile: Profile, days: Record<string, Day>, date: string, lang = 'en'): string {
  const day = days[date];
  const s = totals(day);
  const done = profile.habits.filter((h) => isDone(h, day, profile)).length;
  // Strip punctuation only, so Arabic and accented questions still match themselves.
  const q = question.toLowerCase().replace(/[.,!?;:'"()¿¡،؟«»…-]/g, '').replace(/\s+/g, ' ').trim();
  return `${lang}|${date}|${Math.round(s.kcal)}|${Math.round(s.p)}|${day?.water ?? 0}|${done}|${q}`;
}

export type CoachAnswer = { text: string; recipes: Recipe[]; usedTips?: string[] };

export type CoachContext = {
  apiKey: string | null;
  profile: Profile;
  days: Record<string, Day>;
  date: string;
  history: Turn[];
  suggested: string[];
  usedTips: string[];
  language: string; // e.g. 'French', for the AI's replies
};

export async function askCoach(question: string, ctx: CoachContext): Promise<CoachAnswer> {
  if (ctx.apiKey) {
    return askClaude(ctx.apiKey, ctx.history, question, snapshot(ctx.profile, ctx.days, ctx.date), ctx.suggested, ctx.language);
  }
  return builtInAnswer(question, ctx);
}

export { CoachError };

// ---------- built-in coach (no API key) ----------

type Tip = { id: string; text: string };

const pickFresh = (tips: Tip[], used: string[]): Tip => tips.find((t) => !used.includes(t.id)) ?? tips[Math.floor(Math.random() * tips.length)];

function builtInAnswer(question: string, ctx: CoachContext): CoachAnswer {
  const { profile, days, date, suggested, usedTips } = ctx;
  const day = days[date];
  const t = targets(profile);
  const s = totals(day);
  const left = Math.round(t.kcal - s.kcal);
  const pLeft = Math.round(t.p - s.p);
  const logged = (day?.meals.length ?? 0) > 0;
  const q = question.toLowerCase();
  const parts: Tip[] = [];

  const status: Tip[] = !logged
    ? [
        { id: 's-empty-1', text: "Nothing logged yet today. Add what you've eaten so far, even rough numbers help me help you." },
        { id: 's-empty-2', text: 'Your log is empty, so let\'s start fresh: log your first meal and I\'ll tailor ideas to it.' },
      ]
    : left < 0
      ? [
          { id: 's-over-1', text: `You're ${-left} kcal over today. One day won't undo your progress; keep the next meal light and protein-first.` },
          { id: 's-over-2', text: `${-left} kcal above target. Tomorrow is a clean slate. A walk after dinner and plenty of water will help you feel better tonight.` },
        ]
      : [
          { id: 's-left-1', text: `You have ${left} kcal left and ${Math.max(0, pLeft)} g of protein to go.` },
          { id: 's-left-2', text: `Room for ${left} more kcal today. Protein still needed: ${Math.max(0, pLeft)} g.` },
          { id: 's-left-3', text: `Nice work so far. ${left} kcal remain, so plan your next meal around that.` },
        ];
  parts.push(pickFresh(status, usedTips));

  const habitQ = /habit|streak|motivat|sleep|routine|focus/.test(q);
  if (habitQ) {
    const focus = profile.habits.filter((h) => !h.auto).sort((a, b) => streak(a, days, profile) - streak(b, days, profile))[0];
    if (focus)
      parts.push(
        pickFresh(
          [
            { id: `h1-${focus.id}`, text: `Focus on "${focus.name}". Shrink it until it feels almost too easy, then do it right after something you already do daily.` },
            { id: `h2-${focus.id}`, text: `"${focus.name}" needs the most love. Set a reminder at the same time each day and tick it here the moment you're done.` },
            { id: `h3-${focus.id}`, text: `Try "never miss twice" with "${focus.name}": a missed day is fine, two in a row is the thing to avoid.` },
          ],
          usedTips,
        ),
      );
  } else if (logged && pLeft > 15) {
    parts.push(
      pickFresh(
        [
          { id: 'p-1', text: 'Protein is lagging, so the recipes below lean high-protein.' },
          { id: 'p-2', text: `To close the ${pLeft} g protein gap, build your next plate around a palm-sized protein portion.` },
        ],
        usedTips,
      ),
    );
  }
  if ((day?.water ?? 0) < 4 && date === dateKey(new Date()) && new Date().getHours() >= 13)
    parts.push(pickFresh([{ id: 'w-1', text: 'Water is behind, so have a glass now.' }, { id: 'w-2', text: 'Keep a bottle on your desk; you are under half your water goal.' }], usedTips));

  const recipes = habitQ
    ? []
    : rankForToday(
        RECIPES.filter((r) => !suggested.includes(r.title)),
        left,
        pLeft,
        /breakfast/.test(q) ? 'Breakfast' : /lunch/.test(q) ? 'Lunch' : /dinner/.test(q) ? 'Dinner' : /snack/.test(q) ? 'Snack' : mealForNow(),
      ).slice(0, 2);
  if (recipes.length) parts.push({ id: '', text: `Ideas that fit: ${recipes.map((r) => r.title).join(' and ')}.` });
  else if (!habitQ) parts.push({ id: '', text: "You've seen all my built-in recipes. Add a Claude API key in Targets and I'll create new ones for you." });

  return { text: parts.map((p) => p.text).join('\n\n'), recipes, usedTips: parts.map((p) => p.id).filter(Boolean) };
}
