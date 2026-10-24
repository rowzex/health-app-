import { Meal } from './model';

export type Recipe = {
  id: string;
  title: string;
  meal: Meal;
  kcal: number; // per serving
  p: number;
  c: number;
  f: number;
  minutes: number;
  ingredients: string[];
  steps: string[];
  /** Words used to find a photo, e.g. a dish name or its main ingredient. */
  imageQuery: string;
  mainIngredient: string;
  why?: string; // the coach's reason for suggesting it
  source?: 'library' | 'coach';
};

export const RECIPES: Recipe[] = [
  {
    id: 'r-shakshuka', title: 'Shakshuka with feta', meal: 'Breakfast', kcal: 340, p: 21, c: 18, f: 20, minutes: 20,
    ingredients: ['3 eggs', '1 can chopped tomatoes', '1 red pepper, sliced', '1 small onion', '1 tsp cumin', '1 tsp paprika', '30 g feta', '1 tsp olive oil'],
    steps: ['Soften onion and pepper in the oil for 5 minutes.', 'Add cumin, paprika and tomatoes; simmer 8 minutes.', 'Make three wells, crack in the eggs, cover and cook 5 minutes.', 'Crumble feta on top and serve.'],
    imageQuery: 'Shakshuka', mainIngredient: 'Eggs',
  },
  {
    id: 'r-overnight-oats', title: 'Protein overnight oats', meal: 'Breakfast', kcal: 380, p: 28, c: 48, f: 8, minutes: 5,
    ingredients: ['50 g rolled oats', '150 g Greek yogurt', '100 ml milk', '1/2 scoop whey or 1 tbsp chia', '80 g blueberries', '1 tsp honey'],
    steps: ['Stir oats, yogurt, milk and protein together in a jar.', 'Top with blueberries and honey.', 'Refrigerate overnight; eat cold.'],
    imageQuery: 'Porridge', mainIngredient: 'Oats',
  },
  {
    id: 'r-banana-pancakes', title: 'Two-ingredient banana pancakes', meal: 'Breakfast', kcal: 250, p: 14, c: 28, f: 10, minutes: 10,
    ingredients: ['1 ripe banana', '2 eggs', 'Pinch of cinnamon', 'Spray of oil'],
    steps: ['Mash the banana and whisk in the eggs and cinnamon.', 'Cook small pancakes in a lightly oiled pan, 1 to 2 minutes per side.', 'Serve with berries or a spoon of yogurt.'],
    imageQuery: 'Pancakes', mainIngredient: 'Banana',
  },
  {
    id: 'r-chicken-bowl', title: 'Lemon chicken rice bowl', meal: 'Lunch', kcal: 520, p: 45, c: 55, f: 12, minutes: 25,
    ingredients: ['150 g chicken breast', '1 cup cooked brown rice', '1 cup broccoli', '1/2 lemon', '1 garlic clove', '1 tsp olive oil', 'Salt and pepper'],
    steps: ['Season chicken with garlic, lemon zest, salt and pepper.', 'Pan-fry in the oil 6 minutes per side, then slice.', 'Steam the broccoli 4 minutes.', 'Serve over rice with a squeeze of lemon.'],
    imageQuery: 'Chicken', mainIngredient: 'Chicken Breast',
  },
  {
    id: 'r-tuna-salad', title: 'Tuna chickpea salad', meal: 'Lunch', kcal: 410, p: 36, c: 32, f: 14, minutes: 10,
    ingredients: ['1 can tuna in water', '1/2 can chickpeas', '1 cucumber', '10 cherry tomatoes', '1/4 red onion', '1 tbsp olive oil', '1/2 lemon', 'Parsley'],
    steps: ['Drain tuna and chickpeas.', 'Chop cucumber, tomatoes, onion and parsley.', 'Toss everything with olive oil and lemon juice, season to taste.'],
    imageQuery: 'Tuna', mainIngredient: 'Tuna',
  },
  {
    id: 'r-lentil-soup', title: 'Red lentil soup', meal: 'Lunch', kcal: 330, p: 18, c: 50, f: 6, minutes: 30,
    ingredients: ['100 g red lentils', '1 carrot', '1 onion', '1 tsp cumin', '700 ml stock', '1/2 lemon', '1 tsp olive oil'],
    steps: ['Soften chopped onion and carrot in the oil.', 'Add cumin, lentils and stock; simmer 20 minutes.', 'Blend until smooth and finish with lemon juice.'],
    imageQuery: 'Lentil', mainIngredient: 'Lentils',
  },
  {
    id: 'r-chicken-wrap', title: 'Crunchy chicken hummus wrap', meal: 'Lunch', kcal: 460, p: 38, c: 42, f: 14, minutes: 10,
    ingredients: ['1 whole wheat tortilla', '120 g cooked chicken', '2 tbsp hummus', 'Handful of spinach', '1/2 grated carrot', '1/4 cucumber'],
    steps: ['Spread hummus over the tortilla.', 'Layer chicken, spinach, carrot and cucumber.', 'Roll tightly and cut in half.'],
    imageQuery: 'Wrap', mainIngredient: 'Tortillas',
  },
  {
    id: 'r-salmon-tray', title: 'Salmon, sweet potato and greens tray bake', meal: 'Dinner', kcal: 560, p: 38, c: 40, f: 26, minutes: 30,
    ingredients: ['150 g salmon fillet', '1 sweet potato, cubed', '1 cup green beans', '1 tsp olive oil', '1 tsp paprika', '1/2 lemon'],
    steps: ['Heat oven to 200 °C.', 'Roast sweet potato with oil and paprika for 15 minutes.', 'Add salmon and green beans; roast 12 minutes more.', 'Finish with lemon.'],
    imageQuery: 'Salmon', mainIngredient: 'Salmon',
  },
  {
    id: 'r-beef-stirfry', title: 'Beef and veggie stir-fry', meal: 'Dinner', kcal: 540, p: 40, c: 48, f: 18, minutes: 20,
    ingredients: ['130 g lean beef strips', '1 pepper', '1 cup broccoli', '1 carrot', '1 tbsp soy sauce', '1 tsp ginger', '1 cup cooked rice'],
    steps: ['Sear beef in a hot pan 2 minutes, then set aside.', 'Stir-fry the vegetables 4 minutes.', 'Return the beef with soy sauce and ginger; toss 1 minute.', 'Serve over rice.'],
    imageQuery: 'Beef', mainIngredient: 'Beef',
  },
  {
    id: 'r-chicken-couscous', title: 'Moroccan chicken couscous', meal: 'Dinner', kcal: 580, p: 44, c: 62, f: 14, minutes: 30,
    ingredients: ['150 g chicken thigh, skinless', '60 g couscous', '1 courgette', '1 carrot', '1/2 can chickpeas', '1 tsp ras el hanout', '1 tsp olive oil'],
    steps: ['Brown chicken with ras el hanout in the oil.', 'Add chopped vegetables, chickpeas and a splash of water; simmer 15 minutes.', 'Pour boiling water over couscous, cover 5 minutes, fluff.', 'Serve the stew over couscous.'],
    imageQuery: 'Couscous', mainIngredient: 'Couscous',
  },
  {
    id: 'r-tofu-curry', title: 'Quick tofu and spinach curry', meal: 'Dinner', kcal: 480, p: 26, c: 44, f: 22, minutes: 25,
    ingredients: ['150 g firm tofu', '200 ml light coconut milk', '1 tbsp curry paste', '2 handfuls spinach', '1/2 cup cooked rice'],
    steps: ['Cube and pan-fry tofu until golden.', 'Stir in curry paste, then coconut milk; simmer 5 minutes.', 'Wilt in spinach and serve over rice.'],
    imageQuery: 'Curry', mainIngredient: 'Tofu',
  },
  {
    id: 'r-yogurt-bowl', title: 'Greek yogurt berry bowl', meal: 'Snack', kcal: 220, p: 19, c: 26, f: 5, minutes: 3,
    ingredients: ['170 g Greek yogurt', '80 g mixed berries', '1 tbsp granola', '1 tsp honey'],
    steps: ['Spoon yogurt into a bowl.', 'Top with berries, granola and honey.'],
    imageQuery: 'Yogurt', mainIngredient: 'Greek Yogurt',
  },
  {
    id: 'r-dates-energy', title: 'Date and almond energy bites', meal: 'Snack', kcal: 180, p: 5, c: 22, f: 9, minutes: 10,
    ingredients: ['4 dates, pitted', '20 g almonds', '1 tbsp oats', '1 tsp cocoa'],
    steps: ['Blend everything until sticky.', 'Roll into 3 balls; chill 10 minutes.'],
    imageQuery: 'Dates', mainIngredient: 'Dates',
  },
  {
    id: 'r-cottage-toast', title: 'Cottage cheese and tomato toast', meal: 'Snack', kcal: 210, p: 17, c: 22, f: 5, minutes: 5,
    ingredients: ['1 slice whole wheat bread', '100 g cottage cheese', '1 tomato', 'Black pepper', 'Chili flakes'],
    steps: ['Toast the bread.', 'Spread cottage cheese, top with sliced tomato, pepper and chili.'],
    imageQuery: 'Toast', mainIngredient: 'Cottage Cheese',
  },
];

/**
 * Orders recipes by how well they fit what's left today: close to the
 * remaining calories for one meal, and more protein when protein is short.
 */
export function rankForToday(recipes: Recipe[], kcalLeft: number, proteinLeft: number, meal?: Meal): Recipe[] {
  const typical = meal === 'Snack' ? 220 : meal === 'Breakfast' ? 380 : 560;
  const mealBudget = Math.max(150, Math.min(kcalLeft, typical));
  const score = (r: Recipe) => {
    let s = -Math.abs(r.kcal - mealBudget) / 100;
    if (r.kcal > kcalLeft && kcalLeft > 0) s -= 3;
    if (proteinLeft > 20) s += r.p / 15;
    if (meal && r.meal === meal) s += 4;
    return s;
  };
  return [...recipes].sort((a, b) => score(b) - score(a));
}

export function mealForNow(): Meal {
  const h = new Date().getHours();
  return h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 21 ? 'Dinner' : 'Snack';
}
