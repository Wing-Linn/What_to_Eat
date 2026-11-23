import { supabase } from '@/services/supabase';
import type { FoodItem, HistoryRecord, UserPreferences } from '@/types';

/**
 * App-level store backed by Supabase (data persistence) with a localStorage
 * mirror for instant paint. All writes go to Supabase; localStorage is a
 * fast-path cache only.
 */
const PREFS_KEY = 'food-blindbox:preferences';
const FAVORITES_KEY = 'food-blindbox:favorites';
const HISTORY_KEY = 'food-blindbox:history';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function loadFavorites(): Promise<FoodItem[]> {
  const { data, error } = await supabase.from('favorites').select('food').order('created_at', { ascending: false });
  if (error || !data) return readLocal<FoodItem[]>(FAVORITES_KEY, []);
  return data.map((row: { food: FoodItem }) => row.food);
}

export async function addFavorite(food: FoodItem): Promise<boolean> {
  writeLocal(FAVORITES_KEY, [food, ...readLocal<FoodItem[]>(FAVORITES_KEY, [])]);
  const { error } = await supabase.from('favorites').insert({ food_id: food.id, food });
  return !error;
}

export async function removeFavorite(foodId: string): Promise<boolean> {
  writeLocal(
    FAVORITES_KEY,
    readLocal<FoodItem[]>(FAVORITES_KEY, []).filter((f) => f.id !== foodId)
  );
  const { error } = await supabase.from('favorites').delete().eq('food_id', foodId);
  return !error;
}

export async function loadHistory(): Promise<HistoryRecord[]> {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error || !data) return readLocal<HistoryRecord[]>(HISTORY_KEY, []);
  return data.map(
    (row: {
      id: string;
      created_at: string;
      meal_time: string;
      food_id: string;
      food_name: string;
      preference_snapshot: Partial<UserPreferences>;
      accepted: boolean;
      actually_eaten: boolean | null;
      rating: string | null;
      dislike_reason: string | null;
    }) => ({
      id: row.id,
      createdAt: row.created_at,
      mealTime: row.meal_time,
      foodId: row.food_id,
      foodName: row.food_name,
      preferenceSnapshot: row.preference_snapshot ?? {},
      accepted: row.accepted,
      actuallyEaten: row.actually_eaten ?? undefined,
      rating: (row.rating as HistoryRecord['rating']) ?? undefined,
      dislikeReason: row.dislike_reason ?? undefined,
    })
  );
}

export async function addHistoryRecord(
  record: Omit<HistoryRecord, 'id' | 'createdAt'>
): Promise<HistoryRecord[]> {
  const { data, error } = await supabase
    .from('history')
    .insert({
      meal_time: record.mealTime,
      food_id: record.foodId,
      food_name: record.foodName,
      preference_snapshot: record.preferenceSnapshot,
      accepted: record.accepted,
    })
    .select()
    .single();
  if (error || !data) {
    const localRecord: HistoryRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return [localRecord, ...readLocal<HistoryRecord[]>(HISTORY_KEY, [])];
  }
  const mapped: HistoryRecord = {
    id: data.id,
    createdAt: data.created_at,
    mealTime: data.meal_time,
    foodId: data.food_id,
    foodName: data.food_name,
    preferenceSnapshot: data.preference_snapshot ?? {},
    accepted: data.accepted,
    actuallyEaten: data.actually_eaten ?? undefined,
    rating: (data.rating as HistoryRecord['rating']) ?? undefined,
    dislikeReason: data.dislike_reason ?? undefined,
  };
  return [mapped, ...readLocal<HistoryRecord[]>(HISTORY_KEY, [])];
}

export async function updateHistoryRecord(id: string, patch: Partial<HistoryRecord>): Promise<HistoryRecord[]> {
  const db: Record<string, unknown> = {};
  if (patch.accepted !== undefined) db.accepted = patch.accepted;
  if (patch.actuallyEaten !== undefined) db.actually_eaten = patch.actuallyEaten;
  if (patch.rating !== undefined) db.rating = patch.rating;
  if (patch.dislikeReason !== undefined) db.dislike_reason = patch.dislikeReason;
  if (Object.keys(db).length > 0) {
    await supabase.from('history').update(db).eq('id', id);
  }
  const next = readLocal<HistoryRecord[]>(HISTORY_KEY, []).map((r) =>
    r.id === id ? { ...r, ...patch } : r
  );
  writeLocal(HISTORY_KEY, next);
  return next;
}

export function savePreferencesLocal(prefs: UserPreferences): void {
  writeLocal(PREFS_KEY, prefs);
}

export function loadPreferencesLocal(): UserPreferences | null {
  return readLocal<UserPreferences | null>(PREFS_KEY, null);
}
