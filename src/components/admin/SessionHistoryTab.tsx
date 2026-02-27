import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import type { SessionSummary } from '@/hooks/useAdminSessionHistory';
import { SessionDetailDialog } from './SessionDetailDialog';

interface SessionHistoryTabProps {
  sessions: SessionSummary[];
  stats: {
    totalSessions: number;
    avgDuration: number;
    weeklyAvg: number;
    totalVolume: number;
    totalSets: number;
  };
}

export function SessionHistoryTab({ sessions, stats }: SessionHistoryTabProps) {
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/50">Total Sessions</span>
            </div>
            <p className="text-xl font-bold">{stats.totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/50">Avg Duration</span>
            </div>
            <p className="text-xl font-bold">{stats.avgDuration}m</p>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/50">Weekly Avg</span>
            </div>
            <p className="text-xl font-bold">{stats.weeklyAvg}/wk</p>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/50">Total Volume</span>
            </div>
            <p className="text-xl font-bold">{(stats.totalVolume / 1000).toFixed(0)}k lb</p>
          </CardContent>
        </Card>
      </div>

      {/* Session list */}
      <Card className="bg-black/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white/70">Completed Sessions</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
          {sessions.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No completed sessions yet</p>
          ) : (
            sessions.map(session => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full text-left flex items-center justify-between border-b border-white/5 pb-2 hover:bg-white/5 rounded px-2 py-1.5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(session.session_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-white/40">
                    {session.exerciseCount} exercises * {session.setCount} sets * {session.duration}m
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-white/50">
                    {session.totalVolume.toLocaleString()} lb
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {session.warmup_completed ? 'Full' : 'Partial'}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <SessionDetailDialog
        session={selectedSession}
        open={selectedSession !== null}
        onOpenChange={(open) => { if (!open) setSelectedSession(null); }}
      />
    </div>
  );
}
