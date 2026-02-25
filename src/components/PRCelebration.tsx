import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import type { PersonalRecord } from '@/utils/progressionEngine';

interface PRCelebrationProps {
  prs: PersonalRecord[];
  onClose: () => void;
}

const PR_TYPE_LABELS: Record<string, string> = {
  weight: 'Weight PR',
  reps: 'Rep PR',
  estimated_1rm: 'Estimated 1RM PR',
  volume: 'Volume PR',
};

export function PRCelebration({ prs, onClose }: PRCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible || prs.length === 0) return null;

  const mainPR = prs[0]; // Show the most significant PR prominently

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => { setVisible(false); onClose(); }}
    >
      {/* CSS Confetti */}
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

      {/* Modal Content */}
      <div className="relative text-center px-8 py-10 max-w-sm mx-4 animate-pr-entrance">
        {/* Trophy with glow */}
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-primary/40 rounded-full blur-2xl animate-pulse" />
          <Trophy className="relative h-16 w-16 text-primary drop-shadow-[0_0_20px_rgba(240,98,146,0.6)]" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black mb-2 bg-gradient-to-r from-primary via-yellow-300 to-accent bg-clip-text text-transparent">
          NEW PERSONAL RECORD!
        </h2>

        {/* PR Details */}
        <div className="space-y-2 mb-4">
          <p className="text-white text-lg font-semibold">
            {mainPR.exerciseName}
          </p>
          <p className="text-white/80 text-sm">
            {PR_TYPE_LABELS[mainPR.prType] || mainPR.prType}: {mainPR.weight} lb x {mainPR.reps}
          </p>
          {mainPR.previousValue > 0 && (
            <p className="text-success text-sm font-medium">
              +{Math.round(mainPR.value - mainPR.previousValue)} {mainPR.prType === 'weight' ? 'lb' : mainPR.prType === 'reps' ? 'reps' : 'lb e1RM'}
            </p>
          )}
          {prs.length > 1 && (
            <p className="text-primary/70 text-xs">
              +{prs.length - 1} more PR{prs.length > 2 ? 's' : ''} hit!
            </p>
          )}
        </div>

        <p className="text-white/40 text-xs">Tap anywhere to close</p>
      </div>

      {/* Confetti + PR entrance animations */}
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
