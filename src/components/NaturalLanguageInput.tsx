import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Wand2, Loader2 } from 'lucide-react';

export function NaturalLanguageInput() {
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const applyParsed = useAppStore((s) => s.applyParsed);
  const [value, setValue] = useState(preferences.naturalLanguageInput ?? '');
  const [parsing, setParsing] = useState(false);
  const [feedback, setFeedback] = useState<null | { ok: boolean; text: string }>(null);

  const handleParse = async () => {
    const text = value.trim();
    if (!text) return;
    setParsing(true);
    setFeedback(null);
    try {
      const parsed = await useAppStore.getState().parseWithAI(text);
      applyParsed(parsed);
      setPreferences({ naturalLanguageInput: text });
      setFeedback({ ok: true, text: '已根据你的描述更新了偏好' });
    } catch {
      setFeedback({
        ok: false,
        text: 'AI 暂时休息了，你可以在下方手动挑选偏好，或直接开始抽盲盒。',
      });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="nl-input" className="block text-sm font-medium text-ink">
        想说得具体点？用一句话告诉我们
      </label>
      <div className="flex gap-2">
        <input
          id="nl-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleParse();
            }
          }}
          placeholder="比如：今天想吃热乎的，不要辣，30 元以内……"
          className="flex-1 rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm placeholder:text-ink-soft/50 focus:border-primary-400"
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || value.trim().length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary-500 bg-primary-50 px-4 text-sm font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {parsing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          智能解析
        </button>
      </div>
      {feedback && (
        <p className={`text-sm ${feedback.ok ? 'text-primary-700' : 'text-accent-600'}`}>{feedback.text}</p>
      )}
    </div>
  );
}
