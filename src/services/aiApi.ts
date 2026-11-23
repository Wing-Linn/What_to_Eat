import type { FoodItem, ParsedPreference, UserPreferences } from '@/types';

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface FnResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  degraded?: boolean;
}

async function callFn<T>(name: string, body: unknown, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${FN_BASE}/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);
    const json = (await res.json()) as FnResponse<T>;
    if (!json.success || !json.data) throw new Error(json.error ?? 'AI response invalid');
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

const EMPTY_PARSED: ParsedPreference = {
  hardConstraints: [],
  softPreferences: [],
};

/** Parse natural language into structured preferences. Throws on any failure. */
export async function parsePreferencesWithAI(
  text: string,
  currentMealTime: UserPreferences['mealTime']
): Promise<ParsedPreference> {
  const data = await callFn<ParsedPreference>('ai-assistant', {
    action: 'parse-preferences',
    text,
    currentMealTime,
  });
  if (typeof data !== 'object' || data === null || !Array.isArray(data.hardConstraints)) {
    throw new Error('AI parse shape invalid');
  }
  return data;
}

/** Generate a recommendation reason. Throws on any failure. */
export async function generateRecommendationReason(
  food: FoodItem,
  prefs: UserPreferences
): Promise<string> {
  const data = await callFn<{ reason: string }>('ai-assistant', {
    action: 'recommendation-reason',
    food: {
      name: food.name,
      priceMin: food.priceMin,
      priceMax: food.priceMax,
      flavors: food.flavors,
      cuisines: food.cuisines,
      tags: food.tags,
    },
    preferenceSummary: buildPreferenceSummary(prefs),
  });
  if (!data || typeof data.reason !== 'string' || data.reason.length === 0) {
    throw new Error('AI reason shape invalid');
  }
  return data.reason.slice(0, 120);
}

export function buildLocalReason(food: FoodItem, prefs: UserPreferences): string {
  const parts: string[] = [];
  if (prefs.flavors.length > 0 && food.flavors.some((f) => prefs.flavors.includes(f))) {
    parts.push('符合你选的口味');
  }
  if (prefs.budgetMax != null && food.priceMax != null && food.priceMax <= prefs.budgetMax) {
    parts.push(`价格在${prefs.budgetMax}元以内`);
  }
  if (prefs.mealTime !== 'any' && food.mealTypes.includes(prefs.mealTime as FoodItem['mealTypes'][number])) {
    parts.push('正好适合当前时段');
  }
  if (parts.length === 0) {
    return '这道食物符合你当前的选择，可以从它开始今天的灵感。';
  }
  return `这道食物${parts.join('，也')}符合你当前的需求。`;
}

export function buildPreferenceSummary(prefs: UserPreferences): string {
  const bits: string[] = [];
  const mealLabels: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    late_night: '夜宵',
    any: '不限时段',
  };
  bits.push(mealLabels[prefs.mealTime] ?? '不限时段');
  if (prefs.budgetMax != null) bits.push(`预算${prefs.budgetMax}元以内`);
  if (prefs.cuisines.length) bits.push(`想吃${prefs.cuisines.join('、')}`);
  if (prefs.flavors.length) bits.push(`口味偏好${prefs.flavors.join('、')}`);
  if (prefs.excludeIngredients.length) bits.push(`不要${prefs.excludeIngredients.join('、')}`);
  if (prefs.mood.length) bits.push(`心情是${prefs.mood.join('、')}`);
  return bits.join('，');
}
