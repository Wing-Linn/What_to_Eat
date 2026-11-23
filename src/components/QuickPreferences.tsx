import { useAppStore } from '@/store/appStore';
import { FLAVOR_OPTIONS, CUISINE_OPTIONS } from '@/types';
import { Wallet } from 'lucide-react';

const BUDGET_OPTIONS: Array<{ label: string; value: number | undefined }> = [
  { label: '不限', value: undefined },
  { label: '15元以内', value: 15 },
  { label: '30元以内', value: 30 },
  { label: '50元以内', value: 50 },
];

export function QuickPreferences() {
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);

  const activeBudget = preferences.budgetMax;

  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink mb-2">
          <Wallet size={16} />
          预算
        </p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((option) => {
            const active = activeBudget === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setPreferences({ budgetMax: option.value })}
                aria-pressed={active}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-primary-500 bg-primary-500 text-white font-medium'
                    : 'border-cream-200 bg-white text-ink-soft hover:border-primary-400 hover:text-primary-700'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink mb-2">菜系</p>
        <div className="flex flex-wrap gap-2">
          {CUISINE_OPTIONS.map((cuisine) => {
            const active = preferences.cuisines.includes(cuisine);
            return (
              <button
                key={cuisine}
                type="button"
                onClick={() =>
                  setPreferences({
                    cuisines: active
                      ? preferences.cuisines.filter((c) => c !== cuisine)
                      : [...preferences.cuisines, cuisine],
                  })
                }
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-primary-500 bg-primary-500 text-white font-medium'
                    : 'border-cream-200 bg-white text-ink-soft hover:border-primary-400 hover:text-primary-700'
                }`}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink mb-2">口味</p>
        <div className="flex flex-wrap gap-2">
          {FLAVOR_OPTIONS.map((flavor) => {
            const active = preferences.flavors.includes(flavor);
            return (
              <button
                key={flavor}
                type="button"
                onClick={() =>
                  setPreferences({
                    flavors: active
                      ? preferences.flavors.filter((f) => f !== flavor)
                      : [...preferences.flavors, flavor],
                  })
                }
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-primary-500 bg-primary-500 text-white font-medium'
                    : 'border-cream-200 bg-white text-ink-soft hover:border-primary-400 hover:text-primary-700'
                }`}
              >
                {flavor}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
