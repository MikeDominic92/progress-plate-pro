import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface ConsistencyCardProps {
  sessions: { session_date: string }[];
  weeklySessionCount: number;
  currentStreak: number;
}

export function ConsistencyCard({ sessions, weeklySessionCount, currentStreak }: ConsistencyCardProps) {
  // Build a 7-week heatmap (7 rows x 7 columns = last 49 days)
  const heatmapData = useMemo(() => {
    const sessionDates = new Set(sessions.map(s => s.session_date));
    const days: { date: string; label: string; hasSession: boolean; isToday: boolean }[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 48; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        hasSession: sessionDates.has(dateStr),
        isToday: i === 0,
      });
    }

    // Group into weeks (rows of 7)
    const weeks: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [sessions]);

  // Month labels for the heatmap
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Card className="bg-black/50 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/70 flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400" />
          Consistency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak + This Week */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xs text-white/40">This Week</p>
            <p className="text-2xl font-bold">{weeklySessionCount}/3</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40">Week Streak</p>
            <p className="text-2xl font-bold">{currentStreak}</p>
          </div>
        </div>

        {/* Heatmap */}
        <div>
          <p className="text-xs text-white/40 mb-2">Last 7 Weeks</p>
          <div className="flex gap-1">
            {/* Day labels column */}
            <div className="flex flex-col gap-1">
              {dayLabels.map((label, i) => (
                <div key={i} className="w-4 h-4 flex items-center justify-center text-[10px] text-white/30">
                  {label}
                </div>
              ))}
            </div>
            {/* Week columns */}
            {heatmapData.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-4 h-4 rounded-sm ${
                      day.isToday
                        ? day.hasSession
                          ? 'bg-green-500 ring-1 ring-white/40'
                          : 'bg-white/10 ring-1 ring-white/40'
                        : day.hasSession
                          ? 'bg-green-500/80'
                          : 'bg-white/5'
                    }`}
                    title={`${day.date}${day.hasSession ? ' - Session' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-white/5" /> No session
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-500/80" /> Session
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
