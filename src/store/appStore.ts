import { create } from 'zustand';
import type { FoodItem, HistoryRecord, MealTime, ParsedPreference, UserPreferences } from '@/types';
import { DEFAULT_PREFERENCES, MEAL_TIME_LABELS } from '@/types';
import { FOODS } from '@/data/foods';
import { filterFoods, drawRandomFood, drawThreeFoods } from '@/services/foodFilter';
import {
  loadPreferencesLocal, savePreferencesLocal,
  addHistoryRecord as dbAddHistory, updateHistoryRecord as dbUpdateHistory,
  loadHistory as dbLoadHistory, loadFavorites as dbLoadFavorites,
  addFavorite as dbAddFavorite, removeFavorite as dbRemoveFavorite,
} from '@/services/supabaseStore';
import { parsePreferencesWithAI, generateRecommendationReason, buildLocalReason } from '@/services/aiApi';

export type PageView = 'home' | 'favorites' | 'history';

export type DrawPhase = 'idle' | 'shaking' | 'revealed';

interface AppState {
  page: PageView;
  preferences: UserPreferences;
  phase: DrawPhase;
  result: FoodItem | null;
  reason: string;
  aiDegraded: boolean;
  lastCandidates: FoodItem[];
  candidatesCount: number;
  threeOptions: FoodItem[];
  threeMode: boolean;
  favorites: FoodItem[];
  history: HistoryRecord[];
  historyLoaded: boolean;
  setPage: (page: PageView) => void;
  setPreferences: (patch: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  parseWithAI: (text: string) => Promise<ParsedPreference>;
  applyParsed: (parsed: ParsedPreference) => void;
  draw: () => Promise<void>;
  drawThree: () => Promise<void>;
  chooseThree: (food: FoodItem) => void;
  resetDraw: () => void;
  acceptResult: () => Promise<void>;
  toggleFavorite: (food: FoodItem) => Promise<void>;
  rateResult: (rating: 'like' | 'dislike') => Promise<void>;
  markEaten: (recordId: string, eaten: boolean) => Promise<void>;
  loadUserData: () => Promise<void>;
}

function guessMealTime(): Exclude<MealTime, 'any'> {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 21) return 'dinner';
  return 'late_night';
}

export const useAppStore = create<AppState>((set, get) => ({
  page: 'home',
  preferences: {
    ...DEFAULT_PREFERENCES,
    mealTime: guessMealTime(),
    ...(loadPreferencesLocal() ?? {}),
  },
  phase: 'idle',
  result: null,
  reason: '',
  aiDegraded: false,
  lastCandidates: [],
  candidatesCount: 0,
  threeOptions: [],
  threeMode: false,
  favorites: [],
  history: [],
  historyLoaded: false,

  setPage: (page) => set({ page }),

  setPreferences: (patch) => {
    const next = { ...get().preferences, ...patch };
    savePreferencesLocal(next);
    set({ preferences: next });
  },

  resetPreferences: () => {
    const next = { ...DEFAULT_PREFERENCES, mealTime: get().preferences.mealTime };
    savePreferencesLocal(next);
    set({ preferences: next });
  },

  parseWithAI: async (text) => parsePreferencesWithAI(text, get().preferences.mealTime),

  applyParsed: (parsed) => {
    const patch: Partial<UserPreferences> = {};
    if (parsed.mealTime) patch.mealTime = parsed.mealTime;
    if (parsed.budgetMax != null) patch.budgetMax = parsed.budgetMax;
    if (parsed.cuisines?.length) patch.cuisines = parsed.cuisines;
    if (parsed.flavors?.length) patch.flavors = parsed.flavors;
    if (parsed.foodTypes?.length) patch.foodTypes = parsed.foodTypes;
    if (parsed.mealMethods?.length) patch.mealMethods = parsed.mealMethods as UserPreferences['mealMethods'];
    if (parsed.excludeIngredients?.length) {
      patch.excludeIngredients = Array.from(new Set([...get().preferences.excludeIngredients, ...parsed.excludeIngredients]));
    }
    if (parsed.excludeAllergens?.length) {
      patch.excludeAllergens = Array.from(new Set([...get().preferences.excludeAllergens, ...parsed.excludeAllergens]));
    }
    if (parsed.mood?.length) patch.mood = parsed.mood;
    const next = { ...get().preferences, ...patch };
    savePreferencesLocal(next);
    set({ preferences: next });
  },

  draw: async () => {
    if (get().phase === 'shaking') return;
    const prefs = get().preferences;
    const candidates = filterFoods(FOODS, prefs);
    set({ candidatesCount: candidates.length });

    if (candidates.length === 0) {
      set({ phase: 'idle', result: null, reason: '', lastCandidates: [], threeOptions: [] });
      return;
    }

    set({ phase: 'shaking', result: null, reason: '', threeOptions: [], threeMode: false });

    const pick = drawRandomFood(candidates, prefs, { avoidLastId: get().result?.id ?? null });
    if (!pick) {
      set({ phase: 'idle', result: null, lastCandidates: [] });
      return;
    }

    set({ result: pick, lastCandidates: [pick] });

    let reason = buildLocalReason(pick, prefs);
    let degraded = true;
    try {
      reason = await generateRecommendationReason(pick, prefs);
      degraded = false;
    } catch {
      // keep local reason
    }
    set({ phase: 'revealed', reason, aiDegraded: degraded });
  },

  drawThree: async () => {
    if (get().phase === 'shaking') return;
    const prefs = get().preferences;
    const candidates = filterFoods(FOODS, prefs);
    set({ candidatesCount: candidates.length });

    if (candidates.length === 0) {
      set({ phase: 'idle', result: null, reason: '', lastCandidates: [], threeOptions: [] });
      return;
    }

    set({ phase: 'shaking', result: null, reason: '', threeOptions: [], threeMode: true });
    const picks = drawThreeFoods(candidates, prefs);
    set({ phase: 'revealed', threeOptions: picks, result: null, reason: '', aiDegraded: false });
  },

  chooseThree: (food) => {
    set({ threeMode: false, threeOptions: [], result: food, phase: 'shaking' });
    void get().draw().then(() => {
      // Override the random pick with the chosen one
      set({ result: food, phase: 'revealed' });
      const prefs = get().preferences;
      let reason = buildLocalReason(food, prefs);
      try {
        void generateRecommendationReason(food, prefs).then((r) => set({ reason: r, aiDegraded: false })).catch(() => set({ reason, aiDegraded: true }));
      } catch {
        set({ reason, aiDegraded: true });
      }
    });
  },

  resetDraw: () => set({ phase: 'idle', result: null, reason: '', threeOptions: [], threeMode: false }),

  acceptResult: async () => {
    const { result, preferences } = get();
    if (!result) return;
    await dbAddHistory({
      mealTime: preferences.mealTime,
      foodId: result.id,
      foodName: result.name,
      preferenceSnapshot: { ...preferences },
      accepted: true,
    });
    const history = await dbLoadHistory();
    set({ history, historyLoaded: true });
  },

  toggleFavorite: async (food) => {
    const exists = get().favorites.some((f) => f.id === food.id);
    if (exists) {
      await dbRemoveFavorite(food.id);
      set({ favorites: get().favorites.filter((f) => f.id !== food.id) });
    } else {
      await dbAddFavorite(food);
      set({ favorites: [food, ...get().favorites] });
    }
  },

  rateResult: async (rating) => {
    const { result, history, preferences } = get();
    if (!result) return;
    const latest = history[0];
    if (latest && latest.foodId === result.id && latest.accepted) {
      await dbUpdateHistory(latest.id, { rating });
      set({ history: await dbLoadHistory() });
    } else {
      await dbAddHistory({
        mealTime: preferences.mealTime,
        foodId: result.id,
        foodName: result.name,
        preferenceSnapshot: { ...preferences },
        accepted: false,
        rating,
      });
      set({ history: await dbLoadHistory(), historyLoaded: true });
    }
  },

  markEaten: async (recordId, eaten) => {
    await dbUpdateHistory(recordId, { actuallyEaten: eaten });
    set({ history: await dbLoadHistory() });
  },

  loadUserData: async () => {
    const [favorites, history] = await Promise.all([dbLoadFavorites(), dbLoadHistory()]);
    set({ favorites, history, historyLoaded: true });
  },
}));

export { MEAL_TIME_LABELS };
