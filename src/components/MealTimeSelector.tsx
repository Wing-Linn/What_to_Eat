import { useAppStore } from '@/store/appStore';
import { MEAL_TIME_LABELS } from '@/types';
import type { MealTime } from '@/types';
import { Sun, Coffee, Moon, UtensilsCrossed, Sparkles } from 'lucide-react';

const MEAL_ICONS: Record<Exclude<MealTime, 'any'>, typeof Sun> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  late_night: UtensilsCrossed,
};

export function MealTimeSelector() {
  const mealTime = useAppStore((s) => s.preferences.mealTime);
  const setPreferences = useAppStore((s) => s.setPreferences);

  const options: Array<MealTime> = ['any', 'breakfast', 'lunch', 'dinner', 'late_night'];

  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map((option) => {
        const active = mealTime === option;
        const Icon = option === 'any' ? Sparkles : MEAL_ICONS[option as Exclude<MealTime, 'any'>];
        return (
          <button
            key={option}
            type="button"
            onClick={() => setPreferences({ mealTime: option })}
            aria-pressed={active}
            className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm transition-all ${
              active
                ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold shadow-sm'
                : 'border-cream-200 bg-white text-ink-soft hover:border-primary-300 hover:bg-primary-50/40'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            <span>{option === 'any' ? '不限' : MEAL_TIME_LABELS[option as Exclude<MealTime, 'any'>]}</span>
          </button>
        );
      })}
    </div>
  );
}
