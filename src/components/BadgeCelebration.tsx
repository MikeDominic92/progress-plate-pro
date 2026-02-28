import { useEffect, useState } from 'react';
import { BADGE_DEFINITIONS } from '@/data/badgeDefinitions';

interface BadgeCelebrationProps {
  badgeIds: string[];
  onClose: () => void;
}

export function BadgeCelebration({ badgeIds, onClose }: BadgeCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible || badgeIds.length === 0) return null;

  const badge = BADGE_DEFINITIONS.find(b => b.id === badgeIds[0]);
  if (!badge) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => { setVisible(false); onClose(); }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${1.5 + Math.random() * 1.5}s`,
              backgroundColor: ['#F06292', '#F48FB1', '#FF8A80', '#FFD54F', '#69F0AE', '#CE93D8'][i % 6],
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      <div className="relative text-center px-8 py-10 max-w-sm mx-4 animate-pr-entrance">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-yellow-400/40 rounded-full blur-2xl animate-pulse" />
          <div className="relative text-5xl">
            {badge.category === 'strength' ? '🏆' : badge.category === 'consistency' ? '🔥' : badge.category === 'program' ? '📅' : badge.category === 'volume' ? '💪' : '🎯'}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-2 bg-gradient-to-r from-yellow-300 via-primary to-yellow-300 bg-clip-text text-transparent">
          BADGE UNLOCKED!
        </h2>

        <p className="text-white text-lg font-semibold mb-1">{badge.name}</p>
        <p className="text-white/60 text-sm">{badge.description}</p>

        {badgeIds.length > 1 && (
          <p className="text-primary/70 text-xs mt-3">+{badgeIds.length - 1} more badge{badgeIds.length > 2 ? 's' : ''} unlocked!</p>
        )}

        <p className="text-white/40 text-xs mt-4">Tap anywhere to close</p>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
        @keyframes pr-entrance {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pr-entrance {
          animation: pr-entrance 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
