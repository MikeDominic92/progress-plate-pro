import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Utensils, MessageSquare, Settings } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/nutrition', label: 'Nutrition', icon: Utensils },
  { path: '/coach', label: 'Coach', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-white/10 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around h-14 overflow-x-auto">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          return (
            <button
              key={path}
              aria-label={label}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-2 sm:px-4 py-1.5 transition-colors min-w-0 ${
                active ? 'text-primary' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[0.6rem] font-medium truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
