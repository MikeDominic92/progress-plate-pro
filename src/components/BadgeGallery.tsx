import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import { BADGE_DEFINITIONS, BADGE_CATEGORIES, CATEGORY_LABELS } from '@/data/badgeDefinitions';

interface BadgeGalleryProps {
  unlockedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  strength: '🏆',
  consistency: '🔥',
  program: '📅',
  volume: '💪',
  nutrition: '🎯',
};

export function BadgeGallery({ unlockedIds, open, onOpenChange }: BadgeGalleryProps) {
  const totalBadges = BADGE_DEFINITIONS.length;
  const unlockedCount = unlockedIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-lg text-white flex items-center gap-2">
            Badges
            <span className="text-sm font-normal text-white/40">{unlockedCount}/{totalBadges}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {BADGE_CATEGORIES.map(category => {
            const badges = BADGE_DEFINITIONS.filter(b => b.category === category);
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{CATEGORY_EMOJI[category]}</span>
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    {CATEGORY_LABELS[category]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {badges.map(badge => {
                    const unlocked = unlockedIds.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-xl border ${
                          unlocked
                            ? 'bg-white/5 border-primary/30'
                            : 'bg-white/[0.02] border-white/5 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {!unlocked && <Lock className="h-3 w-3 text-white/20" />}
                          <span className={`text-xs font-semibold ${unlocked ? 'text-white/90' : 'text-white/30'}`}>
                            {badge.name}
                          </span>
                        </div>
                        <p className={`text-[0.6rem] ${unlocked ? 'text-white/40' : 'text-white/20'}`}>
                          {badge.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
