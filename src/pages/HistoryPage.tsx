import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { MEAL_TIME_LABELS } from '@/types';
import { ArrowLeft, ThumbsUp, ThumbsDown, Check } from 'lucide-react';

type Filter = 'all' | 'accepted' | 'liked' | 'disliked';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'accepted', label: '已采纳' },
  { key: 'liked', label: '喜欢' },
  { key: 'disliked', label: '不喜欢' },
];

export function HistoryPage() {
  const history = useAppStore((s) => s.history);
  const markEaten = useAppStore((s) => s.markEaten);
  const setPage = useAppStore((s) => s.setPage);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    switch (filter) {
      case 'accepted': return history.filter((r) => r.accepted);
      case 'liked': return history.filter((r) => r.rating === 'like');
      case 'disliked': return history.filter((r) => r.rating === 'dislike');
      default: return history;
    }
  }, [history, filter]);

  const total = history.length;
  const acceptedCount = history.filter((r) => r.accepted).length;
  const likeCount = history.filter((r) => r.rating === 'like').length;
  const dislikeCount = history.filter((r) => r.rating === 'dislike').length;

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const mealLabel = (key: string) =>
    key in MEAL_TIME_LABELS ? MEAL_TIME_LABELS[key as keyof typeof MEAL_TIME_LABELS] : '不限';

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
        <h1 className="text-xl font-bold text-ink">吃饭记录</h1>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatCard label="总抽取" value={String(total)} />
          <StatCard label="采纳率" value={total > 0 ? `${Math.round((acceptedCount / total) * 100)}%` : '—'} />
          <StatCard label="喜欢" value={String(likeCount)} />
          <StatCard label="不喜欢" value={String(dislikeCount)} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              filter === f.key
                ? 'border-primary-500 bg-primary-500 text-white font-medium'
                : 'border-cream-200 bg-white text-ink-soft hover:border-primary-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-white border border-cream-200 shadow-card p-10 text-center space-y-2">
          <p className="text-ink font-medium">这里还是空的</p>
          <p className="text-sm text-ink-soft">抽到结果后点“今天就吃这个”，就会记录下来。</p>
        </div>
      )}

      <div className="grid gap-3">
        {filtered.map((record) => (
          <div
            key={record.id}
            className="rounded-2xl bg-white border border-cream-200 shadow-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{record.foodName}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {formatTime(record.createdAt)} · {mealLabel(record.mealTime)}
                  {record.accepted && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-primary-700">
                      <Check size={11} /> 已采纳
                    </span>
                  )}
                </p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                  record.rating === 'like'
                    ? 'bg-primary-50 text-primary-700'
                    : record.rating === 'dislike'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-cream-100 text-ink-soft'
                }`}
              >
                {record.rating === 'like' ? (
                  <><ThumbsUp size={11} /> 喜欢</>
                ) : record.rating === 'dislike' ? (
                  <><ThumbsDown size={11} /> 不喜欢</>
                ) : (
                  '未评价'
                )}
              </span>
            </div>

            {record.accepted && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void markEaten(record.id, true)}
                  disabled={record.actuallyEaten === true}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    record.actuallyEaten === true
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-cream-200 bg-white text-ink-soft hover:border-primary-400'
                  }`}
                >
                  实际吃了
                </button>
                <button
                  type="button"
                  onClick={() => void markEaten(record.id, false)}
                  disabled={record.actuallyEaten === false}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    record.actuallyEaten === false
                      ? 'border-cream-200 bg-cream-100 text-ink-soft font-medium'
                      : 'border-cream-200 bg-white text-ink-soft hover:border-ink-soft'
                  }`}
                >
                  没吃
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-cream-200 shadow-card px-2 py-3">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
