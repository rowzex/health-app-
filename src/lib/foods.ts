export type Food = { name: string; kcal: number; p: number; c: number; f: number };

// Per typical serving. kcal, protein g, carbs g, fat g.
const RAW: [string, number, number, number, number][] = [
  ['Oatmeal, 1 cup cooked', 158, 6, 27, 3],
  ['Egg, large', 72, 6.3, 0.4, 4.8],
  ['Scrambled eggs, 2', 182, 12, 2, 14],
  ['Greek yogurt, plain 170g', 100, 17, 6, 0.7],
  ['Banana, medium', 105, 1.3, 27, 0.4],
  ['Apple, medium', 95, 0.5, 25, 0.3],
  ['Blueberries, 1 cup', 84, 1.1, 21, 0.5],
  ['Whole wheat toast, 1 slice', 80, 4, 14, 1],
  ['Peanut butter, 2 tbsp', 190, 7, 7, 16],
  ['Avocado, half', 120, 1.5, 6, 11],
  ['Chicken breast, 150g grilled', 248, 46, 0, 5.4],
  ['Salmon, 150g baked', 310, 33, 0, 19],
  ['Lean beef mince, 150g', 330, 39, 0, 19],
  ['Tuna, 1 can in water', 120, 26, 0, 1],
  ['Tofu, firm 150g', 216, 24, 4, 13],
  ['White rice, 1 cup cooked', 205, 4.3, 45, 0.4],
  ['Brown rice, 1 cup cooked', 216, 5, 45, 1.8],
  ['Pasta, 1 cup cooked', 220, 8, 43, 1.3],
  ['Sweet potato, medium', 112, 2, 26, 0.1],
  ['Potatoes, 200g boiled', 174, 4, 40, 0.2],
  ['Quinoa, 1 cup cooked', 222, 8, 39, 3.6],
  ['Broccoli, 1 cup', 55, 3.7, 11, 0.6],
  ['Mixed salad, large bowl', 40, 2, 8, 0.4],
  ['Olive oil, 1 tbsp', 119, 0, 0, 13.5],
  ['Lentils, 1 cup cooked', 230, 18, 40, 0.8],
  ['Chickpeas, 1 cup', 269, 14.5, 45, 4.2],
  ['Whey protein shake, 1 scoop', 120, 24, 3, 1.5],
  ['Almonds, 28g', 164, 6, 6, 14],
  ['Dark chocolate, 2 squares', 110, 1.5, 9, 8],
  ['Milk, semi-skimmed 250ml', 122, 8.5, 12, 4.5],
  ['Cottage cheese, 1 cup', 206, 28, 8, 9],
  ['Hummus, 2 tbsp', 70, 2, 4, 5],
  ['Chicken wrap', 450, 30, 45, 16],
  ['Pizza, 2 slices', 570, 24, 70, 21],
  ['Burger with bun', 540, 30, 40, 29],
  ['Fries, medium', 365, 4, 48, 17],
  ['Couscous, 1 cup cooked', 176, 6, 36, 0.3],
  ['Dates, 3', 200, 1.8, 53, 0.2],
  ['Mint tea with sugar', 60, 0, 15, 0],
  ['Latte, medium', 190, 12, 18, 7],
  ['Orange juice, 250ml', 112, 1.7, 26, 0.5],
  ['Protein bar', 210, 20, 22, 7],
];

export const FOODS: Food[] = RAW.map(([name, kcal, p, c, f]) => ({ name, kcal, p, c, f }));

export function searchFoods(q: string, limit = 12): Food[] {
  const s = q.trim().toLowerCase();
  return (s ? FOODS.filter((f) => f.name.toLowerCase().includes(s)) : FOODS).slice(0, limit);
}
