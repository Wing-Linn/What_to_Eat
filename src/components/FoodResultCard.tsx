import { useAppStore } from '@/store/appStore';
import type { FoodItem } from '@/types';
import { Heart, Repeat, ThumbsDown, Check, Star } from 'lucide-react';
import { useState } from 'react';

interface Props {
  food: FoodItem;
  reason: string;
  aiDegraded: boolean;
  onRedraw: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function FoodResultCard({ food, reason, aiDegraded, onRedraw, showActions = true, compact = false }: Props) {
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const rateResult = useAppStore((s) => s.rateResult);
  const acceptResult = useAppStore((s) => s.acceptResult);
  const [accepted, setAccepted] = useState(false);
  const [rated, setRated] = useState<'like' | 'dislike' | null>(null);

  const isFavorite = favorites.some((f) => f.id === food.id);

  const priceText =
    food.priceMin != null && food.priceMax != null
      ? `¥${food.priceMin} – ${food.priceMax}`
      : '价格未知';

  const handleAccept = async () => {
    await acceptResult();
    setAccepted(true);
  };

  const handleRate = async (rating: 'like' | 'dislike') => {
    await rateResult(rating);
    setRated(rating);
  };

  return (
    <div className="animate-box-pop rounded-2xl bg-white shadow-card-hover border border-cream-200 overflow-hidden">
      <div className={`flex gap-4 ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div
          className={`${compact ? 'w-20 h-20' : 'w-24 h-24 sm:w-28 sm:h-28'} shrink-0 rounded-xl bg-primary-50 flex items-center justify-center text-3xl`}
          role="img"
          aria-label={`${food.name} 占位图`}
        >
          <FoodEmoji food={food} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-bold text-ink ${compact ? 'text-base' : 'text-xl'}`}>{food.name}</h3>
            <span className="shrink-0 rounded-full bg-accent-400/10 text-accent-600 px-3 py-0.5 text-sm font-medium whitespace-nowrap">
              {priceText}
            </span>
          </div>

          {food.description && <p className="mt-1 text-sm text-ink-soft line-clamp-2">{food.description}</p>}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {food.cuisines.slice(0, 2).map((c) => (
              <span key={c} className="rounded-md bg-primary-50 text-primary-700 px-2 py-0.5 text-xs">{c}</span>
            ))}
            {food.flavors.slice(0, 2).map((f) => (
              <span key={f} className="rounded-md bg-accent-400/10 text-accent-600 px-2 py-0.5 text-xs">{f}</span>
            ))}
            {food.foodTypes.slice(0, 1).map((t) => (
              <span key={t} className="rounded-md bg-cream-100 text-ink-soft px-2 py-0.5 text-xs">{t}</span>
            ))}
          </div>

          {reason && (
            <p className="mt-3 rounded-xl bg-cream-50 border border-cream-100 px-3 py-2 text-sm text-ink leading-relaxed">
              <Star size={12} className="inline mr-1 -mt-0.5 text-accent-500" />
              {reason}
              {aiDegraded && <span className="block text-xs text-ink-soft mt-1">AI 暂时不可用，已切换为本地推荐理由</span>}
            </p>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 border-t border-cream-100 px-5 py-3">
          <button
            type="button"
            onClick={onRedraw}
            className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-primary-400 hover:text-primary-700 transition-colors"
          >
            <Repeat size={15} />
            再给我一个惊喜
          </button>
          <button
            type="button"
            onClick={() => void toggleFavorite(food)}
            aria-pressed={isFavorite}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              isFavorite
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-cream-200 bg-white text-ink hover:border-red-300 hover:text-red-600'
            }`}
          >
            <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? '已收藏' : '先收藏起来'}
          </button>
          <button
            type="button"
            onClick={() => void handleRate('dislike')}
            disabled={rated !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink-soft transition-colors disabled:opacity-50"
          >
            <ThumbsDown size={15} />
            不喜欢
          </button>
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={accepted}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ml-auto ${
              accepted
                ? 'bg-primary-100 text-primary-700 cursor-default'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Check size={15} />
            {accepted ? '已采纳' : '今天就吃这个'}
          </button>
        </div>
      )}
    </div>
  );
}

function FoodEmoji({ food }: { food: FoodItem }) {
  const map: Record<string, string> = {
    '中式': '🥢', '川湘': '🌶️', '粤菜': '🥟', '日料': '🍱', '韩餐': '🍲',
    '西餐': '🍝', '轻食': '🥗', '面食': '🍜', '小吃': '🥟', '甜点饮品': '🍮',
    '火锅': '🍲', '汤粉': '🍜', '烧烤': '🍢', '简餐': '🍱',
  };
  return <span>{map[food.cuisines[0]] ?? '🍽️'}</span>;
}
