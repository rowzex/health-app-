# Fuel & Form

A calorie and habits coach for iOS and Android, built with Expo (React Native) and Expo Router.

- **Today**: calorie ring, protein/carbs/fat bars, water glasses, and the day's meals.
- **Log food**: search ~40 common foods or add a custom one to Breakfast, Lunch, Dinner or Snack.
- **Habits**: daily check-offs with streaks and a 7-day history. Water and protein habits tick themselves.
- **Coach**: asks an AI coach about your day. Without a backend it answers with built-in tips.
- **Targets**: calorie and macro targets from age, height, weight, activity and goal (Mifflin-St Jeor).

Data is stored on the device with AsyncStorage.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone, or press `w` for the web preview.

## AI coach

The app never holds an API key. Set `EXPO_PUBLIC_COACH_URL` to a backend endpoint that accepts
`POST { messages, snapshot }` and returns `{ text }`; see `src/lib/coach.ts`.

## Checks

```bash
npm run typecheck
```
