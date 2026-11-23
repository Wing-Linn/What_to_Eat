import { useAppStore } from '@/store/appStore';
import { SlidersHorizontal, PackageOpen, Ban } from 'lucide-react';

export function EmptyState() {
  const candidatesCount = useAppStore((s) => s.candidatesCount);
  const preferences = useAppStore((s) => s.preferences);
  const resetPreferences = useAppStore((s) => s.resetPreferences);
  const setPreferences = useAppStore((s) => s.setPreferences);

  if (candidatesCount > 0) return null;

  const hints: string[] = [];
  if (preferences.budgetMax != null) hints.push(`预算上限 ${preferences.budgetMax} 元`);
  if (preferences.mealTime !== 'any') hints.push('当前时段');
  if (preferences.cuisines.length) hints.push(`选中的菜系（${preferences.cuisines.join('、')}）`);
  if (preferences.excludeAllergens.length) hints.push('过敏原排除（不会自动放宽）');
  if (preferences.excludeIngredients.length) hints.push('忌口食材（不会自动放宽）');

  const relaxBudget = () => setPreferences({ budgetMax: undefined });
  const clearSoftPrefs = () =>
    setPreferences({ cuisines: [], flavors: [], foodTypes: [], mealMethods: [] });
  const widenMealTime = () => setPreferences({ mealTime: 'any' });

  return (
    <div className="rounded-2xl bg-white border border-cream-200 shadow-card p-6 text-center space-y-4">
      <PackageOpen size={40} className="mx-auto text-primary-400" />
      <div>
        <p className="font-medium text-ink">这次条件有点严格，给我一点选择空间吧。</p>
        <p className="text-sm text-ink-soft mt-1">当前条件组合下没有符合的食物。可能和这些设置有关：</p>
      </div>
      <ul className="text-sm text-ink-soft space-y-1 text-left max-w-sm mx-auto">
        {hints.map((hint) => (
          <li key={hint} className="flex items-center gap-2">
            <Ban size={13} className="shrink-0 text-accent-500" />
            {hint}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        {preferences.budgetMax != null && (
          <button
            type="button"
            onClick={relaxBudget}
            className="rounded-full border border-primary-500 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            放宽预算
          </button>
        )}
        {(preferences.cuisines.length > 0 || preferences.flavors.length > 0 || preferences.foodTypes.length > 0 || preferences.mealMethods.length > 0) && (
          <button
            type="button"
            onClick={clearSoftPrefs}
            className="rounded-full border border-primary-500 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            清除普通偏好
          </button>
        )}
        {preferences.mealTime !== 'any' && (
          <button
            type="button"
            onClick={widenMealTime}
            className="rounded-full border border-primary-500 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            扩大到任何时段
          </button>
        )}
        <button
          type="button"
          onClick={resetPreferences}
          className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink-soft transition-colors"
        >
          <SlidersHorizontal size={15} />
          全部重置
        </button>
      </div>
      <p className="text-xs text-ink-soft/70">
        过敏原和忌口属于硬性限制，我们不会自动帮你放宽，需要你手动调整。
      </p>
    </div>
  );
}
