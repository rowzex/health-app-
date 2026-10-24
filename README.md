# Fuel & Form

A calorie and habits coach for iOS and Android, built with Expo (React Native) and Expo Router.

- **Today**: animated calorie ring and macro bars, water glasses, recipe ideas that fit what's left, and the day's meals with photos.
- **Log food**: search ~40 common foods (with photos) or add a custom one to Breakfast, Lunch, Dinner or Snack.
- **Recipes**: built-in and saved recipes with photos, ranked for your remaining calories; open one to see ingredients and steps and log it in one tap.
- **Habits**: daily check-offs with streaks and a 7-day history. Water and protein habits tick themselves.
- **Coach**: an AI coach (Claude) that reads your day and answers with recipe cards. It doesn't repeat itself: earlier answers and suggested recipes are sent as context, and the same question on the same day returns the same answer. Without an API key it uses built-in tips that rotate.
- **Targets** (link on Today): calorie and macro targets from age, height, weight, activity and goal (Mifflin-St Jeor), plus the AI coach key.

Data is stored on the device with AsyncStorage.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone, or press `w` for the web preview.

## AI coach

In the phone app, open **Today → My targets & AI coach** and paste a Claude API key from
console.anthropic.com. The key is kept in the phone's secure storage and sent only to the Claude API
(`src/lib/ai.ts`). This suits a personal app; before publishing to the app stores, move the call behind
a small server so users don't need their own key.

Food and recipe photos come from TheMealDB's free API, matched by dish type.

## Checks

```bash
npm run typecheck
```
