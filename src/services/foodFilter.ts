import type { FoodItem, UserPreferences } from '@/types';

/**
 * Hard filter — never loosened. Per PRD:
 * - unknown price does NOT pass a budget filter
 * - unknown allergens do NOT count as safe
 * - excluded ingredients / allergens are always removed
 */
export function filterFoods(foods: FoodItem[], prefs: UserPreferences): FoodItem[] {
  const excludes = normalizeExcludes(prefs.excludeIngredients);
  const allergens = normalizeExcludes(prefs.excludeAllergens);

  return foods.filter((food) => {
    if (prefs.mealTime !== 'any' && !food.mealTypes.includes(prefs.mealTime)) {
      return false;
    }

    if (prefs.budgetMax != null) {
      if (food.priceMax == null || food.priceMin == null) return false;
      if (food.priceMin > prefs.budgetMax) return false;
    }

    if (allergens.length > 0) {
      const foodAllergens = food.allergens.map((a) => a.toLowerCase());
      if (allergens.some((a) => foodAllergens.includes(a))) return false;
    }

    if (excludes.length > 0) {
      const foodExclusions = food.exclusions.map((e) => e.toLowerCase());
      const foodIngredients = food.ingredients.map((i) => i.toLowerCase());
      const hit = excludes.some(
        (e) => foodExclusions.includes(e) || foodIngredients.includes(e)
      );
      if (hit) return false;
    }

    return true;
  });
}

function normalizeExcludes(list: string[]): string[] {
  return list.map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/**
 * Soft preference scoring. Higher = better match, but randomness still applies.
 */
export function scoreFood(food: FoodItem, prefs: UserPreferences): number {
  let score = 0;
  if (prefs.cuisines.length > 0 && food.cuisines.some((c) => prefs.cuisines.includes(c))) score += 3;
  if (prefs.flavors.length > 0 && food.flavors.some((f) => prefs.flavors.includes(f))) score += 3;
  if (prefs.foodTypes.length > 0 && food.foodTypes.some((t) => prefs.foodTypes.includes(t))) score += 2;
  if (prefs.mealMethods.length > 0 && food.mealMethods.some((m) => prefs.mealMethods.includes(m))) score += 2;
  if (prefs.mood.length > 0 && food.tags.some((t) => prefs.mood.includes(t))) score += 1;
  return score;
}

export interface DrawOptions {
  avoidLastId?: string | null;
  hiddenFoodIds?: string[];
}

/** Weighted random draw from qualified candidates, avoiding the last result. */
export function drawRandomFood(
  candidates: FoodItem[],
  prefs: UserPreferences,
  options: DrawOptions = {}
): FoodItem | null {
  const hidden = new Set(options.hiddenFoodIds ?? []);
  let pool = candidates.filter((c) => !hidden.has(c.id));

  const fallbackUsed = pool.length === 0 && candidates.length > 0;
  if (fallbackUsed) pool = candidates;

  if (pool.length > 1 && options.avoidLastId) {
    const withoutLast = pool.filter((c) => c.id !== options.avoidLastId);
    if (withoutLast.length > 0) pool = withoutLast;
  }

  if (pool.length === 0) return null;

  const weights = pool.map((c) => {
    const base = scoreFood(c, prefs);
    return base > 0 ? base : 0.5;
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Three distinct candidates for the "pick one of three" mode. */
export function drawThreeFoods(
  candidates: FoodItem[],
  prefs: UserPreferences,
  options: DrawOptions = {}
): FoodItem[] {
  const picked: FoodItem[] = [];
  const used = new Set<string>(options.hiddenFoodIds ?? []);
  const pool = [...candidates];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const remaining = pool.filter((c) => !used.has(c.id));
    if (remaining.length === 0) break;
    const pick = drawRandomFood(remaining, prefs, { ...options, avoidLastId: null });
    if (!pick) break;
    picked.push(pick);
    used.add(pick.id);
    pool.splice(pool.findIndex((c) => c.id === pick.id), 1);
  }
  return picked;
}
