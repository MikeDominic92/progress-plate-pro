import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PersonalRecord, SetRecord, PlateauStatus, WeightTrendPoint } from '@/utils/progressionEngine';
import { ExerciseProgressPanel } from './ExerciseProgressPanel';

interface ProgressTabProps {
  allHistory: Record<string, SetRecord[]>;
  allPRs: PersonalRecord[];
  getWeightTrend: (name: string, setType: string) => WeightTrendPoint[];
  getPlateauStatus: (name: string) => PlateauStatus;
}

export function ProgressTab({ allHistory, allPRs, getWeightTrend, getPlateauStatus }: ProgressTabProps) {
  // Sort PRs by date descending
  const sortedPRs = useMemo(
    () => [...allPRs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
    [allPRs]
  );

  // Exercises sorted by most data
  const exercises = useMemo(() => {
    return Object.keys(allHistory)
      .filter(name => allHistory[name].length >= 2)
      .sort((a, b) => allHistory[b].length - allHistory[a].length);
  }, [allHistory]);

  // Volume over time (weekly aggregation)
  const volumeByWeek = useMemo(() => {
    const weekMap: Record<string, number> = {};
    for (const records of Object.values(allHistory)) {
      for (const r of records) {
        // Group by ISO week
        const d = new Date(r.date);
        const weekStart = new Date(d);
        const day = weekStart.getDay();
        const diff = day === 0 ? 6 : day - 1;
        weekStart.setDate(weekStart.getDate() - diff);
        const key = weekStart.toISOString().split('T')[0];
        weekMap[key] = (weekMap[key] || 0) + r.weight * r.reps;
      }
    }
    return Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, volume]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: Math.round(volume),
      }));
  }, [allHistory]);

  return (
    <div className="space-y-4">
      {/* PR Timeline */}
      <Card className="bg-black/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white/70 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            Recent Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[250px] overflow-y-auto">
          {sortedPRs.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No PRs recorded yet</p>
          ) : (
            <div className="space-y-2">
              {sortedPRs.map((pr, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-1.5">
                  <div className="min-w-0">
                    <p className="font-medium text-xs truncate">{pr.exerciseName}</p>
                    <p className="text-[10px] text-white/40">{pr.date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{pr.prType.replace('_', ' ')}</Badge>
                    <span className="text-xs font-medium text-primary">
                      {pr.value}{pr.prType === 'reps' ? ' reps' : ' lb'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volume over time */}
      {volumeByWeek.length >= 2 && (
        <Card className="bg-black/50 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Weekly Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} lb`, 'Volume']}
                />
                <Bar dataKey="volume" fill="#F06292" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-exercise panels */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-white/60 px-1">Exercise Progression</h3>
        {exercises.length === 0 ? (
          <Card className="bg-black/50 border-white/10">
            <CardContent className="p-4 text-center text-white/30 text-sm">
              Complete 2+ sessions with an exercise to see progression data
            </CardContent>
          </Card>
        ) : (
          exercises.map(name => (
            <ExerciseProgressPanel
              key={name}
              exerciseName={name}
              trendData={getWeightTrend(name, 'Heavy/Top Set')}
              plateauStatus={getPlateauStatus(name)}
            />
          ))
        )}
      </div>
    </div>
  );
}
