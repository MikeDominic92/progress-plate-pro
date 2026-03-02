import React, { useState, useEffect, useRef } from 'react';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Weight, Repeat, Pencil } from 'lucide-react';
import { ProgressionBadge } from '@/components/ProgressionBadge';
import type { ProgressionSuggestion } from '@/utils/progressionEngine';

interface WorkoutSet {
  type: string;
  instructions: string;
  weight: string;
  reps: string;
  confirmed?: boolean;
}

interface SetLogProps {
  set: WorkoutSet;
  onLogChange: (field: string, value: string) => void;
  onSetComplete?: () => void;
  onUnlock?: () => void;
  suggestion?: ProgressionSuggestion;
  disabled?: boolean;
  lastSet?: { weight: number; reps: number };
  autoFocus?: boolean;
}

export const SetLog = React.memo(function SetLog({ set, onLogChange, onSetComplete, onUnlock, suggestion, disabled = false, lastSet, autoFocus = false }: SetLogProps) {
  const [weightInput, setWeightInput] = useState<string>(set.weight ?? '');
  const [repsInput, setRepsInput] = useState<string>(set.reps ?? '');
  const [isWeightFocused, setIsWeightFocused] = useState(false);
  const [isRepsFocused, setIsRepsFocused] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isWeightFocused) setWeightInput(set.weight ?? '');
  }, [set.weight, isWeightFocused]);

  useEffect(() => {
    if (!isRepsFocused) setRepsInput(set.reps ?? '');
  }, [set.reps, isRepsFocused]);

  // Auto-focus the weight input for the first incomplete set
  useEffect(() => {
    if (autoFocus && !set.confirmed && !disabled && weightInputRef.current) {
      weightInputRef.current.focus();
    }
  }, [autoFocus, set.confirmed, disabled]);

  const isWarmUp = set.type === 'Warm Up Set';
  const isComplete = Boolean(weightInput && repsInput);
  const isConfirmed = set.confirmed;

  // Soft validation warnings
  const weightNum = parseFloat(weightInput) || 0;
  const repsNum = parseInt(repsInput) || 0;
  const showWeightWarning = weightNum > 500;
  const showRepsWarning = repsNum > 50;

  return (
    <Card className={`transition-all duration-300 backdrop-blur-glass border-white/10 bg-black ${
      isWarmUp ? 'border-primary/30 shadow-glass' : 'shadow-md'
    } ${
      isConfirmed ? 'ring-1 ring-green-500/30 bg-green-500/10 border-green-500/20' :
      isComplete && !disabled ? 'ring-1 ring-primary/40' :
      disabled ? 'opacity-50' : ''
    }`}>
      <CardContent className="p-3 sm:p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-white md:text-lg">{set.type}</h4>
            <p className="text-sm text-gray-300">{set.instructions}</p>
            {lastSet && lastSet.weight > 0 && (
              <p className="text-xs md:text-sm text-muted-foreground">
                Last: {lastSet.weight} lb x {lastSet.reps}
              </p>
            )}
          </div>
          {isConfirmed && (
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-green-400 border-green-500/50 bg-green-500/10">
                Done
              </Badge>
              {onUnlock && (
                <button
                  onClick={onUnlock}
                  className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                  aria-label="Unlock set for editing"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {suggestion && !isConfirmed && (
          <div className="mb-3">
            <ProgressionBadge suggestion={suggestion} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-1">
          <FitnessInput
            ref={weightInputRef}
            label="Weight"
            icon={<Weight className="h-4 w-4" />}
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={weightInput}
            onFocus={() => setIsWeightFocused(true)}
            onBlur={() => {
              setIsWeightFocused(false);
              if (!isConfirmed && !disabled) {
                onLogChange('weight', weightInput);
              }
            }}
            onChange={(e) => {
              let v = e.target.value.replace(/[^0-9.]/g, '');
              const firstDot = v.indexOf('.');
              if (firstDot !== -1) {
                v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
              }
              setWeightInput(v);
            }}
            variant={weightInput ? 'success' : 'default'}
            disabled={isConfirmed || disabled}
          />
          <FitnessInput
            label="Reps"
            icon={<Repeat className="h-4 w-4" />}
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={repsInput}
            onFocus={() => setIsRepsFocused(true)}
            onBlur={() => {
              setIsRepsFocused(false);
              if (!isConfirmed && !disabled) {
                onLogChange('reps', repsInput);
              }
            }}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '');
              setRepsInput(v);
            }}
            variant={repsInput ? 'success' : 'default'}
            disabled={isConfirmed || disabled}
          />
        </div>

        {/* Soft validation warnings */}
        {(showWeightWarning || showRepsWarning) && (
          <div className="mb-2 space-y-0.5">
            {showWeightWarning && (
              <p className="text-xs md:text-sm text-yellow-500">Double-check: {weightNum} lb</p>
            )}
            {showRepsWarning && (
              <p className="text-xs md:text-sm text-yellow-500">Double-check: {repsNum} reps</p>
            )}
          </div>
        )}

        {!isConfirmed && isComplete && !disabled && onSetComplete && (
          <Button
            onClick={onSetComplete}
            className="w-full"
            variant="default"
          >
            Complete Set
          </Button>
        )}
      </CardContent>
    </Card>
  );
});
