import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import {
  CUISINE_OPTIONS, FLAVOR_OPTIONS, FOOD_TYPE_OPTIONS, ALLERGEN_OPTIONS, COMMON_EXCLUSION_OPTIONS,
  MEAL_METHOD_LABELS,
} from '@/types';
import type { MealMethod } from '@/types';
import { ChevronDown, Ban } from 'lucide-react';

interface ChipGroupProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function ChipGroup({ label, options, selected, onToggle }: ChipGroupProps) {
  return (
    <div>
      <p className="text-sm font-medium text-ink mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active
                  ? 'border-primary-500 bg-primary-500 text-white font-medium'
                  : 'border-cream-200 bg-white text-ink-soft hover:border-primary-400 hover:text-primary-700'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PreferencePanel() {
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const [expanded, setExpanded] = useState(false);
  const [customExclude, setCustomExclude] = useState('');

  const toggle = (field: 'cuisines' | 'flavors' | 'foodTypes', value: string) => {
    const current = preferences[field];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setPreferences({ [field]: next });
  };

  const toggleMethod = (method: MealMethod) => {
    const next = preferences.mealMethods.includes(method)
      ? preferences.mealMethods.filter((m) => m !== method)
      : [...preferences.mealMethods, method];
    setPreferences({ mealMethods: next });
  };

  const toggleExclude = (value: string) => {
    const next = preferences.excludeIngredients.includes(value)
      ? preferences.excludeIngredients.filter((v) => v !== value)
      : [...preferences.excludeIngredients, value];
    setPreferences({ excludeIngredients: next });
  };

  const toggleAllergen = (value: string) => {
    const next = preferences.excludeAllergens.includes(value)
      ? preferences.excludeAllergens.filter((v) => v !== value)
      : [...preferences.excludeAllergens, value];
    setPreferences({ excludeAllergens: next });
  };

  const addCustomExclude = () => {
    const value = customExclude.trim();
    if (value && !preferences.excludeIngredients.includes(value)) {
      setPreferences({ excludeIngredients: [...preferences.excludeIngredients, value] });
    }
    setCustomExclude('');
  };

  return (
    <div className="rounded-2xl bg-white shadow-card border border-cream-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={expanded}
      >
        <span className="font-medium text-ink">更多筛选条件</span>
        <ChevronDown
          size={20}
          className={`text-ink-soft transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-cream-100 pt-5">
          <ChipGroup
            label="食物类型"
            options={FOOD_TYPE_OPTIONS}
            selected={preferences.foodTypes}
            onToggle={(v) => toggle('foodTypes', v)}
          />
          <div>
            <p className="text-sm font-medium text-ink mb-2">用餐方式</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MEAL_METHOD_LABELS) as MealMethod[]).map((method) => {
                const active = preferences.mealMethods.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleMethod(method)}
                    aria-pressed={active}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      active
                        ? 'border-primary-500 bg-primary-500 text-white font-medium'
                        : 'border-cream-200 bg-white text-ink-soft hover:border-primary-400 hover:text-primary-700'
                    }`}
                  >
                    {MEAL_METHOD_LABELS[method]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-red-50/60 border border-red-100 p-4 space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <Ban size={16} />
              <p className="text-sm font-medium">忌口与过敏原（严格排除，不会被打折）</p>
            </div>
            <ChipGroup
              label="过敏原（选了就一定不会出现）"
              options={ALLERGEN_OPTIONS}
              selected={preferences.excludeAllergens}
              onToggle={toggleAllergen}
            />
            <ChipGroup
              label="常被讨厌的食材"
              options={COMMON_EXCLUSION_OPTIONS}
              selected={preferences.excludeIngredients}
              onToggle={toggleExclude}
            />
            <div>
              <p className="text-sm font-medium text-ink mb-2">自定义排除</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customExclude}
                  onChange={(e) => setCustomExclude(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomExclude();
                    }
                  }}
                  placeholder="例如：香菜、动物内脏……"
                  className="flex-1 rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm placeholder:text-ink-soft/50 focus:border-primary-400"
                />
                <button
                  type="button"
                  onClick={addCustomExclude}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  添加
                </button>
              </div>
              {preferences.excludeIngredients.filter((v) => !COMMON_EXCLUSION_OPTIONS.includes(v)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.excludeIngredients
                    .filter((v) => !COMMON_EXCLUSION_OPTIONS.includes(v))
                    .map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm"
                      >
                        {v}
                        <button
                          type="button"
                          onClick={() => toggleExclude(v)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`移除排除项 ${v}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
