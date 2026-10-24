import Anthropic from '@anthropic-ai/sdk';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { MEALS } from './model';
import { Recipe } from './recipes';

const KEY_NAME = 'anthropic-api-key';

/** The AI coach runs on the phone app only; the web preview uses built-in tips. */
export const AI_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

// The user's own key, kept in the phone's secure storage and sent only to the Claude API.
export async function loadApiKey(): Promise<string | null> {
  if (!AI_SUPPORTED) return null;
  try {
    return await SecureStore.getItemAsync(KEY_NAME);
  } catch {
    return null;
  }
}

export async function saveApiKey(key: string | null): Promise<void> {
  if (!AI_SUPPORTED) return;
  if (key) await SecureStore.setItemAsync(KEY_NAME, key);
  else await SecureStore.deleteItemAsync(KEY_NAME);
}

const SYSTEM = `You are "Coach", a warm, practical nutrition and habits coach inside the Fuel & Form app.
You see the user's targets, today's food log, water and habit streaks with every message.

How to answer:
- Be specific to their numbers today: calories and protein left, what they already ate, which habits are slipping.
- Whenever you suggest a food, meal or snack, include it as a full recipe in "recipes" (0 to 3 recipes) that fits their remaining calories, with honest per-serving macros, ingredient amounts and short steps. Questions that are only about habits, sleep or motivation can have no recipes.
- "reply" is plain text under 110 words, no markdown. Short paragraphs or "- " lines are fine. Refer to recipes by title instead of repeating their ingredients.
- Every answer must be fresh. Earlier replies are in the conversation: do not reuse their wording, tips, examples or recipes. Never suggest a recipe from the "already suggested" list. Vary cuisines and ingredients.
- For each recipe set "imageQuery" to one or two words naming the dish type as a recipe site would (e.g. "Chicken curry", "Pancakes", "Salmon", "Omelette") and "mainIngredient" to its main ingredient in title case (e.g. "Chicken Breast", "Salmon", "Eggs").
- No medical diagnoses. If they mention a medical condition, pregnancy, or signs of disordered eating, be supportive and suggest a doctor or dietitian.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'recipes'],
  properties: {
    reply: { type: 'string' },
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'meal', 'kcal', 'protein', 'carbs', 'fat', 'minutes', 'ingredients', 'steps', 'imageQuery', 'mainIngredient', 'why'],
        properties: {
          title: { type: 'string' },
          meal: { type: 'string', enum: MEALS },
          kcal: { type: 'integer' },
          protein: { type: 'integer' },
          carbs: { type: 'integer' },
          fat: { type: 'integer' },
          minutes: { type: 'integer' },
          ingredients: { type: 'array', items: { type: 'string' } },
          steps: { type: 'array', items: { type: 'string' } },
          imageQuery: { type: 'string' },
          mainIngredient: { type: 'string' },
          why: { type: 'string' },
        },
      },
    },
  },
};

type Raw = {
  reply: string;
  recipes: {
    title: string; meal: Recipe['meal']; kcal: number; protein: number; carbs: number; fat: number; minutes: number;
    ingredients: string[]; steps: string[]; imageQuery: string; mainIngredient: string; why: string;
  }[];
};

export type Turn = { role: 'user' | 'assistant'; content: string; recipes?: Recipe[] };

export class CoachError extends Error {}

export async function askClaude(apiKey: string, history: Turn[], question: string, data: unknown, alreadySuggested: string[]): Promise<{ text: string; recipes: Recipe[] }> {
  const client = new Anthropic({ apiKey, maxRetries: 1 });

  const past: Anthropic.Beta.BetaMessageParam[] = history.slice(-12).map((t) => ({
    role: t.role,
    content: t.recipes?.length ? `${t.content}\n\n[Recipes suggested: ${t.recipes.map((r) => r.title).join('; ')}]` : t.content,
  }));
  // The conversation must start with the user.
  while (past.length && past[0].role === 'assistant') past.shift();

  const prompt =
    `${question}\n\n<today>\n${JSON.stringify(data)}\n</today>\n` +
    (alreadySuggested.length ? `<already_suggested>\n${alreadySuggested.slice(-40).join('\n')}\n</already_suggested>` : '');

  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      system: SYSTEM,
      messages: [...past, { role: 'user', content: prompt }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new CoachError('Your Claude API key was rejected. Check it in Targets → AI coach.');
    if (e instanceof Anthropic.PermissionDeniedError) throw new CoachError("Your API key doesn't have access to this model.");
    if (e instanceof Anthropic.RateLimitError) throw new CoachError('The coach is busy right now. Try again in a minute.');
    if (e instanceof Anthropic.APIConnectionError) throw new CoachError("Can't reach the coach. Check your internet connection.");
    if (e instanceof Anthropic.APIError) throw new CoachError(`The coach had a problem (${e.status ?? 'error'}). Try again.`);
    throw e;
  }

  if (response.stop_reason === 'refusal') throw new CoachError("The coach can't help with that one. Try asking another way.");
  const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  let raw: Raw;
  try {
    raw = JSON.parse(text) as Raw;
  } catch {
    throw new CoachError('The coach sent an incomplete answer. Try again.');
  }

  const stamp = Date.now().toString(36);
  return {
    text: raw.reply,
    recipes: raw.recipes.map((r, i) => ({
      id: `ai-${stamp}-${i}`,
      title: r.title,
      meal: r.meal,
      kcal: r.kcal,
      p: r.protein,
      c: r.carbs,
      f: r.fat,
      minutes: r.minutes,
      ingredients: r.ingredients,
      steps: r.steps,
      imageQuery: r.imageQuery,
      mainIngredient: r.mainIngredient,
      why: r.why,
      source: 'coach',
    })),
  };
}
