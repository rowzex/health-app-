export type Food = { name: string; kcal: number; p: number; c: number; f: number; img?: string };

// Per typical serving: name, photo ingredient, kcal, protein g, carbs g, fat g.
const RAW: [string, string, number, number, number, number][] = [
  ['Oatmeal, 1 cup cooked', 'Rolled Oats', 158, 6, 27, 3],
  ['Egg, large', 'Egg', 72, 6.3, 0.4, 4.8],
  ['Scrambled eggs, 2', 'Eggs', 182, 12, 2, 14],
  ['Greek yogurt, plain 170g', 'Greek Yogurt', 100, 17, 6, 0.7],
  ['Banana, medium', 'Banana', 105, 1.3, 27, 0.4],
  ['Apple, medium', 'Apple', 95, 0.5, 25, 0.3],
  ['Blueberries, 1 cup', 'Blueberries', 84, 1.1, 21, 0.5],
  ['Whole wheat toast, 1 slice', 'Bread', 80, 4, 14, 1],
  ['Peanut butter, 2 tbsp', 'Peanut Butter', 190, 7, 7, 16],
  ['Avocado, half', 'Avocado', 120, 1.5, 6, 11],
  ['Chicken breast, 150g grilled', 'Chicken Breast', 248, 46, 0, 5.4],
  ['Salmon, 150g baked', 'Salmon', 310, 33, 0, 19],
  ['Lean beef mince, 150g', 'Minced Beef', 330, 39, 0, 19],
  ['Tuna, 1 can in water', 'Tuna', 120, 26, 0, 1],
  ['Tofu, firm 150g', 'Tofu', 216, 24, 4, 13],
  ['White rice, 1 cup cooked', 'Rice', 205, 4.3, 45, 0.4],
  ['Brown rice, 1 cup cooked', 'Brown Rice', 216, 5, 45, 1.8],
  ['Pasta, 1 cup cooked', 'Spaghetti', 220, 8, 43, 1.3],
  ['Sweet potato, medium', 'Sweet Potatoes', 112, 2, 26, 0.1],
  ['Potatoes, 200g boiled', 'Potatoes', 174, 4, 40, 0.2],
  ['Quinoa, 1 cup cooked', 'Quinoa', 222, 8, 39, 3.6],
  ['Broccoli, 1 cup', 'Broccoli', 55, 3.7, 11, 0.6],
  ['Mixed salad, large bowl', 'Lettuce', 40, 2, 8, 0.4],
  ['Olive oil, 1 tbsp', 'Olive Oil', 119, 0, 0, 13.5],
  ['Lentils, 1 cup cooked', 'Lentils', 230, 18, 40, 0.8],
  ['Chickpeas, 1 cup', 'Chickpeas', 269, 14.5, 45, 4.2],
  ['Whey protein shake, 1 scoop', 'Milk', 120, 24, 3, 1.5],
  ['Almonds, 28g', 'Almonds', 164, 6, 6, 14],
  ['Dark chocolate, 2 squares', 'Dark Chocolate', 110, 1.5, 9, 8],
  ['Milk, semi-skimmed 250ml', 'Milk', 122, 8.5, 12, 4.5],
  ['Cottage cheese, 1 cup', 'Cottage Cheese', 206, 28, 8, 9],
  ['Hummus, 2 tbsp', 'Chickpeas', 70, 2, 4, 5],
  ['Chicken wrap', 'Tortillas', 450, 30, 45, 16],
  ['Pizza, 2 slices', 'Mozzarella', 570, 24, 70, 21],
  ['Burger with bun', 'Beef', 540, 30, 40, 29],
  ['Fries, medium', 'Potatoes', 365, 4, 48, 17],
  ['Couscous, 1 cup cooked', 'Couscous', 176, 6, 36, 0.3],
  ['Dates, 3', 'Dates', 200, 1.8, 53, 0.2],
  ['Mint tea with sugar', 'Mint', 60, 0, 15, 0],
  ['Latte, medium', 'Coffee', 190, 12, 18, 7],
  ['Orange juice, 250ml', 'Orange', 112, 1.7, 26, 0.5],
  ['Protein bar', 'Oats', 210, 20, 22, 7],
];

export const FOODS: Food[] = RAW.map(([name, img, kcal, p, c, f]) => ({ name, img, kcal, p, c, f }));

export function searchFoods(q: string, limit = 12): Food[] {
  const s = q.trim().toLowerCase();
  return (s ? FOODS.filter((f) => f.name.toLowerCase().includes(s)) : FOODS).slice(0, limit);
}
