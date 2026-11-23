import { useAppStore } from '@/store/appStore';
import { Gift } from 'lucide-react';

export function BlindBoxAnimation() {
  const phase = useAppStore((s) => s.phase);

  if (phase !== 'shaking') return null;

  return (
    <div
      className="flex flex-col items-center justify-center py-12 gap-4"
      role="status"
      aria-label="正在抽取结果"
    >
      <div className="animate-box-shake">
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-card-hover flex items-center justify-center">
          <Gift size={56} className="text-white" strokeWidth={1.6} />
        </div>
      </div>
      <p className="text-ink-soft text-sm">正在摇一摇，看看今天吃什么呢…</p>
    </div>
  );
}
