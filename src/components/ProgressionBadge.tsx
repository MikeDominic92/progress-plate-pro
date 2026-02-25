import { TrendingUp, TrendingDown, Minus, AlertTriangle, Dumbbell } from 'lucide-react';
import type { ProgressionSuggestion } from '@/utils/progressionEngine';

interface ProgressionBadgeProps {
  suggestion: ProgressionSuggestion;
}

export function ProgressionBadge({ suggestion }: ProgressionBadgeProps) {
  const { action, suggestedWeight, reason, lastWeight, lastReps, isDeload } = suggestion;

  if (action === 'first_time') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
        <Dumbbell className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-white/70">First time - track your starting weight</span>
      </div>
    );
  }

  const iconMap = {
    increase: <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />,
    maintain: <Minus className="h-4 w-4 text-blue-400 flex-shrink-0" />,
    decrease: <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0" />,
    deload: <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />,
  };

  const labelMap = {
    increase: 'Increase',
    maintain: 'Maintain',
    decrease: 'Decrease',
    deload: 'Deload',
  };

  const borderColor = isDeload
    ? 'border-yellow-500/40'
    : action === 'increase'
    ? 'border-green-500/30'
    : action === 'decrease'
    ? 'border-red-500/30'
    : 'border-white/10';

  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg bg-white/5 border ${borderColor} text-sm`}>
      {iconMap[action] || iconMap.maintain}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white/60 text-xs">{labelMap[action] || 'Maintain'}</span>
          {suggestedWeight > 0 && (
            <span className="font-bold text-primary">{suggestedWeight} lb</span>
          )}
        </div>
        {lastWeight > 0 && (
          <p className="text-white/40 text-xs mt-0.5">
            Last: {lastWeight} lb x {lastReps}
          </p>
        )}
        <p className="text-white/50 text-xs mt-0.5 truncate">{reason}</p>
      </div>
    </div>
  );
}
