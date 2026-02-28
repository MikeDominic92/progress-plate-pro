import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import type { MealFavorite } from '@/hooks/useMealFavorites';

interface FavoritesSectionProps {
  favorites: MealFavorite[];
  onQuickLog: (fav: MealFavorite) => void;
  onRemove: (id: string) => void;
  loading: boolean;
}

export default function FavoritesSection({ favorites, onQuickLog, onRemove, loading }: FavoritesSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading || favorites.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-semibold text-white/70">Favorites ({favorites.length})</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {favorites.map(fav => (
              <div
                key={fav.id}
                className="flex-shrink-0 w-36 p-2.5 rounded-lg bg-black/30 border border-white/10 relative group"
              >
                <button
                  onClick={() => onRemove(fav.id)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove favorite"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-[0.65rem] text-white/70 font-medium truncate mb-1">{fav.name}</p>
                <p className="text-[0.6rem] text-white/40 mb-2">{Math.round(fav.totals.calories)} cal</p>
                <button
                  onClick={() => onQuickLog(fav)}
                  className="w-full flex items-center justify-center gap-1 py-1 rounded-md bg-primary/20 border border-primary/30 text-primary text-[0.65rem] font-semibold hover:bg-primary/30 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Log
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
