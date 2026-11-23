export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'late_night' | 'any';

export type MealMethod = 'dine_in' | 'takeout' | 'cook';

export interface FoodItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'late_night'>;
  cuisines: string[];
  flavors: string[];
  foodTypes: string[];
  mealMethods: MealMethod[];
  priceMin?: number;
  priceMax?: number;
  ingredients: string[];
  allergens: string[];
  exclusions: string[];
  tags: string[];
  isActive: boolean;
}

export interface UserPreferences {
  mealTime: MealTime;
  budgetMax?: number;
  cuisines: string[];
  flavors: string[];
  foodTypes: string[];
  mealMethods: MealMethod[];
  excludeIngredients: string[];
  excludeAllergens: string[];
  mood: string[];
  naturalLanguageInput?: string;
}

export interface HistoryRecord {
  id: string;
  createdAt: string;
  mealTime: string;
  foodId: string;
  foodName: string;
  preferenceSnapshot: Partial<UserPreferences>;
  accepted: boolean;
  actuallyEaten?: boolean;
  rating?: 'like' | 'dislike' | 'neutral';
  dislikeReason?: string;
}

export interface ParsedPreference {
  mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'late_night' | 'any';
  budgetMax?: number;
  cuisines?: string[];
  flavors?: string[];
  foodTypes?: string[];
  mealMethods?: string[];
  includeTags?: string[];
  excludeIngredients?: string[];
  excludeAllergens?: string[];
  mood?: string[];
  hardConstraints: string[];
  softPreferences: string[];
  clarificationNeeded?: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  mealTime: 'any',
  cuisines: [],
  flavors: [],
  foodTypes: [],
  mealMethods: [],
  excludeIngredients: [],
  excludeAllergens: [],
  mood: [],
};

export const MEAL_TIME_LABELS: Record<Exclude<MealTime, 'any'>, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  late_night: '夜宵',
};

export const MEAL_METHOD_LABELS: Record<MealMethod, string> = {
  dine_in: '堂食',
  takeout: '外卖',
  cook: '自己做',
};

export const CUISINE_OPTIONS = [
  '中式', '川湘', '粤菜', '日料', '韩餐', '西餐', '轻食', '面食', '小吃', '甜点饮品',
];

export const FLAVOR_OPTIONS = ['清淡', '微辣', '重辣', '酸甜', '咸香', '随便'];

export const FOOD_TYPE_OPTIONS = ['主食', '面食', '米饭', '汤粉', '烧烤', '小食', '饮品', '甜点', '火锅', '简餐'];

export const ALLERGEN_OPTIONS = ['花生', '坚果', '海鲜', '鸡蛋', '牛奶', '大豆', '麸质', '芒果'];

export const COMMON_EXCLUSION_OPTIONS = ['香菜', '动物内脏', '肥肉', '生姜', '葱', '蒜'];
