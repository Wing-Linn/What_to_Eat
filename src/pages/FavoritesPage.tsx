import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { FoodResultCard } from '@/components/FoodResultCard';
import { buildLocalReason } from '@/services/aiApi';
import { ArrowLeft, Heart } from 'lucide-react';

export function FavoritesPage() {
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const setPage = useAppStore((s) => s.setPage);

  useEffect(() => {
    void useAppStore.getState().loadUserData();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPage('home')}
          className="rounded-full p-2 text-ink-soft hover:bg-cream-100 transition-colors"
          aria-label="返回首页"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-ink">我的收藏</h1>
        <span className="text-sm text-ink-soft">{favorites.length} 个</span>
      </div>

      {favorites.length === 0 && (
        <div className="rounded-2xl bg-white border border-cream-200 shadow-card p-10 text-center space-y-2">
          <Heart size={36} className="mx-auto text-primary-300" />
          <p className="text-ink font-medium">还没有收藏</p>
          <p className="text-sm text-ink-soft">抽到喜欢的食物时点“先收藏起来”，它就会出现在这里。</p>
        </div>
      )}

      <div className="grid gap-3">
        {favorites.map((food) => (
          <div key={food.id} className="relative">
            <FoodResultCard
              food={food}
              reason={buildLocalReason(food, useAppStore.getState().preferences)}
              aiDegraded={false}
              onRedraw={() => void toggleFavorite(food)}
              showActions={false}
              compact
            />
            <button
              type="button"
              onClick={() => void toggleFavorite(food)}
              className="absolute top-3 right-3 rounded-full bg-red-50 text-red-600 p-2 hover:bg-red-100 transition-colors"
              aria-label={`取消收藏 ${food.name}`}
            >
              <Heart size={16} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
