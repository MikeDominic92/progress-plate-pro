import { Card, CardContent } from '@/components/ui/card';
import { Flame, Trophy, Zap } from 'lucide-react';
import ExplainTerm from '@/components/ExplainTerm';

interface WeekStatsRowProps {
  sessionsThisWeek: number;
  prsThisWeek: number;
  currentStreak: number;
}

export function WeekStatsRow({ sessionsThisWeek, prsThisWeek, currentStreak }: WeekStatsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-3 text-center">
          <Flame className="h-4 w-4 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold">{sessionsThisWeek}</p>
          <p className="text-[0.6rem] text-white/40">This Week</p>
        </CardContent>
      </Card>
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-3 text-center">
          <Trophy className="h-4 w-4 text-yellow-300 mx-auto mb-1" />
          <p className="text-lg font-bold">{prsThisWeek}</p>
          <ExplainTerm term="PRs"><p className="text-[0.6rem] text-white/40">PRs</p></ExplainTerm>
        </CardContent>
      </Card>
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-3 text-center">
          <Zap className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold">{currentStreak}</p>
          <ExplainTerm term="Streak"><p className="text-[0.6rem] text-white/40">Streak</p></ExplainTerm>
        </CardContent>
      </Card>
    </div>
  );
}
