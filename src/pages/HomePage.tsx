import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { MealTimeSelector } from '@/components/MealTimeSelector';
import { QuickPreferences } from '@/components/QuickPreferences';
import { PreferencePanel } from '@/components/PreferencePanel';
import { NaturalLanguageInput } from '@/components/NaturalLanguageInput';
import { BlindBoxAnimation } from '@/components/BlindBoxAnimation';
import { FoodResultCard } from '@/components/FoodResultCard';
import { EmptyState } from '@/components/EmptyState';
import { Dices, Layers3, History } from 'lucide-react';

export function HomePage() {
  const draw = useAppStore((s) => s.draw);
  const drawThree = useAppStore((s) => s.drawThree);
  const phase = useAppStore((s) => s.phase);
  const result = useAppStore((s) => s.result);
  const reason = useAppStore((s) => s.reason);
  const aiDegraded = useAppStore((s) => s.aiDegraded);
  const threeOptions = useAppStore((s) => s.threeOptions);
  const threeMode = useAppStore((s) => s.threeMode);
  const chooseThree = useAppStore((s) => s.chooseThree);
  const resetDraw = useAppStore((s) => s.resetDraw);
  const setPage = useAppStore((s) => s.setPage);

  useEffect(() => {
    void useAppStore.getState().loadUserData();
  }, []);

  const busy = phase === 'shaking';
  const showResult = phase === 'revealed' && (result != null || threeOptions.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
      <header className="text-center space-y-1 pt-4">
        <h1 className="text-3xl font-bold text-ink tracking-tight">今天吃什么</h1>
        <p className="text-ink-soft text-sm">把选择交给今天的好运气</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-ink">这是哪一餐？</h2>
        <MealTimeSelector />
      </section>

      <section className="rounded-2xl bg-white shadow-card border border-cream-200 p-5">
        <QuickPreferences />
      </section>

      <PreferencePanel />

      <section className="rounded-2xl bg-white shadow-card border border-cream-200 p-5">
        <NaturalLanguageInput />
      </section>

      <button
        type="button"
        onClick={() => void draw()}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-base font-semibold text-white shadow-card hover:bg-primary-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Dices size={20} />
        {busy ? '正在摇一摇…' : '开始抽盲盒'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => void drawThree()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm font-medium text-ink hover:border-primary-400 hover:text-primary-700 disabled:opacity-50 transition-colors"
        >
          <Layers3 size={17} />
          三选一
        </button>
        <button
          type="button"
          onClick={() => setPage('history')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm font-medium text-ink hover:border-primary-400 hover:text-primary-700 transition-colors"
        >
          <History size={17} />
          吃饭记录
        </button>
      </div>

      {phase === 'shaking' && <BlindBoxAnimation />}

      {phase === 'revealed' && threeMode && threeOptions.length === 0 && (
        <EmptyState />
      )}

      {showResult && threeMode && !result && (
        <section className="space-y-3">
          <h2 className="text-center text-sm font-medium text-ink-soft">三个都符合你的条件，选一个吧：</h2>
          <div className="grid gap-3">
            {threeOptions.map((food) => (
              <FoodResultCard
                key={food.id}
                food={food}
                reason=""
                aiDegraded={false}
                onRedraw={() => chooseThree(food)}
                showActions={false}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {showResult && result && (
        <section className="space-y-3">
          <FoodResultCard
            food={result}
            reason={reason}
            aiDegraded={aiDegraded}
            onRedraw={() => void draw()}
          />
          <p className="text-xs text-center text-ink-soft/70">
            这是根据当前偏好抽取的灵感，具体价格和食材以实际店铺为准。
          </p>
          <button
            type="button"
            onClick={resetDraw}
            className="block mx-auto text-sm text-ink-soft underline underline-offset-4 hover:text-primary-700 transition-colors"
          >
            重新开始
          </button>
        </section>
      )}

      {phase === 'revealed' && !result && !threeMode && <EmptyState />}
    </div>
  );
}
