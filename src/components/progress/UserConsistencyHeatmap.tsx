import { Card, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface HeatmapDay {
  date: string;
  hasSession: boolean;
  isToday: boolean;
}

interface UserConsistencyHeatmapProps {
  weeks: HeatmapDay[][];
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function UserConsistencyHeatmap({ weeks }: UserConsistencyHeatmapProps) {
  return (
    <Card className="bg-black/50 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-white/70">Last 7 Weeks</span>
        </div>

        <div className="flex gap-1 justify-center">
          <div className="flex flex-col gap-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center text-[10px] text-white/30">
                {label}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
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

        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30 justify-center">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-white/5" /> Rest
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500/80" /> Session
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
