import { Card, CardContent } from '@/components/ui/card';
import ExplainTerm from '@/components/ExplainTerm';

interface MacroAdherenceCardProps {
  pct: number;
  days: { date: string; hit: boolean }[];
}

export function MacroAdherenceCard({ pct, days }: MacroAdherenceCardProps) {
  const hitCount = days.filter(d => d.hit).length;

  return (
    <Card className="bg-black/50 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <ExplainTerm term="Macro Adherence"><span className="text-sm font-semibold text-white/70">Macro Adherence</span></ExplainTerm>
          <span className="text-xs text-white/40">{hitCount}/7 days</span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          {days.map((day, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-medium ${
                day.hit
                  ? 'bg-green-500/80 text-white'
                  : 'bg-white/5 text-white/30'
              }`}
              title={`${day.date}: ${day.hit ? 'All macros within 10%' : 'Missed'}`}
            >
              {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-white/40">{pct}% adherence this week</p>
      </CardContent>
    </Card>
  );
}
