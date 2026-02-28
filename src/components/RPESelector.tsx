import ExplainTerm from '@/components/ExplainTerm';

interface RPESelectorProps {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

const RPE_LABELS: Record<number, string> = {
  1: 'Minimal effort',
  2: 'Very easy',
  3: 'Easy',
  4: 'Moderate',
  5: 'Challenging',
  6: 'Hard',
  7: 'Very hard',
  8: 'Extremely hard',
  9: 'Near max',
  10: 'Maximum effort',
};

function getRPEColor(n: number): string {
  if (n <= 3) return 'bg-green-500 border-green-400 text-white';
  if (n <= 6) return 'bg-yellow-500 border-yellow-400 text-white';
  if (n <= 8) return 'bg-orange-500 border-orange-400 text-white';
  return 'bg-red-500 border-red-400 text-white';
}

function getRPEColorText(n: number): string {
  if (n <= 3) return 'text-green-400';
  if (n <= 6) return 'text-yellow-400';
  if (n <= 8) return 'text-orange-400';
  return 'text-red-400';
}

export default function RPESelector({ value, onChange, disabled, compact }: RPESelectorProps) {
  if (compact && value !== null) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getRPEColor(value)}`}>
          {value}
        </div>
        <div>
          <ExplainTerm term="RPE"><span className={`text-sm font-medium ${getRPEColorText(value)}`}>RPE {value}</span></ExplainTerm>
          <span className="text-[0.65rem] text-white/40 ml-1.5">{RPE_LABELS[value]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap justify-center">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const selected = value === n;
          return (
            <button
              key={n}
              onClick={() => !disabled && onChange(n)}
              disabled={disabled}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                selected
                  ? getRPEColor(n) + ' scale-110 shadow-lg'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {value !== null && (
        <p className={`text-center text-sm font-medium ${getRPEColorText(value)}`}>
          {RPE_LABELS[value]}
        </p>
      )}
    </div>
  );
}
