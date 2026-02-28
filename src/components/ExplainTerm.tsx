import { useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

const TERM_EXPLANATIONS: Record<string, string> = {
  'RPE': 'Rate of Perceived Exertion -- how hard the workout felt on a scale of 1-10. 1 is barely trying, 10 is the hardest you could possibly go.',
  'PR': 'Personal Record -- your all-time best for an exercise. Could be heaviest weight, most reps, or highest total volume.',
  'PRs': 'Personal Records -- your all-time bests for exercises. Could be heaviest weight, most reps, or highest total volume.',
  'Volume': 'Total weight moved in a session. Calculated by multiplying weight x reps for every set, then adding them all up.',
  'Macros': 'Short for macronutrients -- protein, carbs, and fat. These are the three main nutrients your body uses for energy and muscle building.',
  'Macro Adherence': 'How close you hit your daily protein, carbs, fat, and calorie targets. A "hit" day means all 4 were within 10% of your goal.',
  'Streak': 'How many days in a row you have worked out without missing a day.',
  'Deload': 'A planned lighter week where you reduce weight by 10%. Gives your body time to recover and come back stronger.',
  'TDEE': 'Total Daily Energy Expenditure -- the total calories your body burns in a day including exercise. Your calorie target is set below this to create a deficit for weight loss.',
  'Deficit': 'Eating fewer calories than your body burns. A 1,000 calorie deficit per day equals about 2 pounds of weight loss per week.',
  'Plateau': 'When your weight on an exercise stays the same for 3+ sessions. Usually means it is time to change something up.',
  'RIR': 'Reps In Reserve -- how many more reps you could have done before failing. RIR 1 means you had 1 rep left in the tank.',
  '1RM': 'One Rep Max -- the heaviest weight you could lift for a single rep. Used to estimate your strength level.',
  'Progressive Overload': 'Gradually increasing the difficulty of your workouts over time by adding weight or reps. This is how muscles get stronger.',
};

interface ExplainTermProps {
  term: string;
  children: React.ReactNode;
  className?: string;
}

export default function ExplainTerm({ term, children, className = '' }: ExplainTermProps) {
  const [open, setOpen] = useState(false);
  const explanation = TERM_EXPLANATIONS[term];

  if (!explanation) return <>{children}</>;

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
        className={`inline-flex items-center gap-0.5 cursor-pointer ${className}`}
        aria-label={`Explain: ${term}`}
      >
        {children}
        <HelpCircle className="h-3 w-3 text-white/20 flex-shrink-0" />
      </span>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-4 mb-4 sm:mb-0 w-full max-w-sm p-4 rounded-2xl bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">{term}</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-white/30 hover:text-white/60 transition-colors"
                aria-label="Close explanation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{explanation}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
