import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ExerciseProgressChart } from '@/components/ExerciseProgressChart';
import type { WeightTrendPoint, PlateauStatus } from '@/utils/progressionEngine';

interface ExerciseProgressPanelProps {
  exerciseName: string;
  trendData: WeightTrendPoint[];
  plateauStatus: PlateauStatus;
}

export function ExerciseProgressPanel({
  exerciseName,
  trendData,
  plateauStatus,
}: ExerciseProgressPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const latestWeight = trendData.length > 0 ? trendData[trendData.length - 1].weight : 0;
  const latestReps = trendData.length > 0 ? trendData[trendData.length - 1].reps : 0;
  const sessions = new Set(trendData.map(t => t.date)).size;

  return (
    <Card className="bg-black/50 border-white/10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-white/40 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{exerciseName}</p>
            <p className="text-xs text-white/40">
              {latestWeight} lb x {latestReps} * {sessions} sessions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {plateauStatus.isPlateaued && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
              Plateau ({plateauStatus.sessionCount} sess)
            </Badge>
          )}
        </div>
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-3 px-4">
          <ExerciseProgressChart
            data={trendData}
            exerciseName={exerciseName}
            compact
          />
          {plateauStatus.isPlateaued && plateauStatus.suggestion && (
            <p className="text-xs text-amber-400/70 mt-2">
              {plateauStatus.suggestion}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
