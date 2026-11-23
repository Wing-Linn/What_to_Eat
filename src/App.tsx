import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { HomePage } from '@/pages/HomePage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { Home, Heart, ClipboardList } from 'lucide-react';

export default function App() {
  const page = useAppStore((s) => s.page);
  const setPage = useAppStore((s) => s.setPage);
  const loadUserData = useAppStore((s) => s.loadUserData);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c2a26]">
      <main>{page === 'home' ? <HomePage /> : page === 'favorites' ? <FavoritesPage /> : <HistoryPage />}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-cream-200 bg-white/95 backdrop-blur-sm"
        aria-label="主导航"
      >
        <div className="max-w-2xl mx-auto grid grid-cols-3">
          <NavButton active={page === 'home'} onClick={() => setPage('home')} icon={<Home size={20} />} label="首页" />
          <NavButton
            active={page === 'favorites'}
            onClick={() => setPage('favorites')}
            icon={<Heart size={20} />}
            label="收藏"
          />
          <NavButton
            active={page === 'history'}
            onClick={() => setPage('history')}
            icon={<ClipboardList size={20} />}
            label="记录"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
        active ? 'text-primary-700 font-medium' : 'text-ink-soft hover:text-primary-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
