import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Dumbbell, Zap } from 'lucide-react';

interface LiveEvent {
  id: string;
  event_type: string;
  event_data: any;
  timestamp: string;
  exercise_name: string | null;
  set_number: number | null;
  weight: number | null;
  reps: number | null;
  duration_seconds: number | null;
}

interface LiveSessionTabProps {
  activeSession: {
    id: string;
    current_phase: string;
    session_date: string;
    warmup_completed: boolean;
    cardio_completed: boolean;
    created_at: string;
  } | null;
  liveEvents: LiveEvent[];
  currentExercise: string | null;
  currentPhase: string | null;
  sessionDuration: number;
  exerciseCount: number;
  setsCompleted: number;
  lastPolled: Date | null;
}

export function LiveSessionTab({
  activeSession,
  liveEvents,
  currentExercise,
  currentPhase,
  sessionDuration,
  exerciseCount,
  setsCompleted,
  lastPolled,
}: LiveSessionTabProps) {
  if (!activeSession) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-lg">No active session</p>
          <p className="text-white/25 text-sm mt-1">
            Kara isn't working out right now. Polling every 12s.
          </p>
          {lastPolled && (
            <p className="text-white/20 text-xs mt-2">
              Last checked: {lastPolled.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const phaseColors: Record<string, string> = {
    cardio: 'bg-blue-500/20 text-blue-400',
    warmup: 'bg-amber-500/20 text-amber-400',
    workout: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className="space-y-4">
      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/50">Phase</span>
            </div>
            <Badge className={phaseColors[currentPhase || ''] || 'bg-white/10 text-white/60'}>
              {currentPhase || 'unknown'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/50">Duration</span>
            </div>
            <p className="text-xl font-bold">{sessionDuration}m</p>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/50">Exercises</span>
            </div>
            <p className="text-xl font-bold">{exerciseCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/50">Sets Done</span>
            </div>
            <p className="text-xl font-bold">{setsCompleted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Current exercise */}
      {currentExercise && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs text-white/50 mb-1">Currently Performing</p>
            <p className="text-lg font-semibold">{currentExercise}</p>
          </CardContent>
        </Card>
      )}

      {/* Live event feed */}
      <Card className="bg-black/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white/70">Live Event Feed</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
          {liveEvents.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No events yet</p>
          ) : (
            liveEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between text-sm border-b border-white/5 pb-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {event.event_type.replace(/_/g, ' ')}
                  </Badge>
                  {event.exercise_name && (
                    <span className="text-white/70 truncate">{event.exercise_name}</span>
                  )}
                  {event.weight != null && event.reps != null && (
                    <span className="text-white/50 text-xs shrink-0">
                      {event.weight}lb x {event.reps}
                    </span>
                  )}
                </div>
                <span className="text-white/30 text-xs shrink-0 ml-2">
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
