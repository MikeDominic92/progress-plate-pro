import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { SessionSummary } from '@/hooks/useAdminSessionHistory';

interface SessionDetailDialogProps {
  session: SessionSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExerciseLog {
  sets: {
    setType?: string;
    weight?: number;
    reps?: number;
    completed?: boolean;
    [key: string]: any;
  }[];
  [key: string]: any;
}

export function SessionDetailDialog({ session, open, onOpenChange }: SessionDetailDialogProps) {
  if (!session) return null;

  // Extract exercise logs from workout_data
  const logs: Record<string, ExerciseLog> = session.workout_data?.logs || {};
  const exerciseNames = Object.keys(logs);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Session - {new Date(session.session_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </DialogTitle>
        </DialogHeader>

        {/* Session summary */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Duration</p>
            <p className="font-medium">{session.duration}m</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Exercises</p>
            <p className="font-medium">{session.exerciseCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Volume</p>
            <p className="font-medium">{session.totalVolume.toLocaleString()} lb</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {session.warmup_completed && <Badge variant="outline">Warmup</Badge>}
          {session.cardio_completed && (
            <Badge variant="outline">
              Cardio{session.cardio_time ? ` ${session.cardio_time}` : ''}
              {session.cardio_calories ? ` / ${session.cardio_calories} cal` : ''}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Exercise breakdown */}
        <div className="space-y-4">
          {exerciseNames.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No exercise data recorded
            </p>
          ) : (
            exerciseNames.map(name => {
              const exercise = logs[name];
              const sets = exercise.sets || [];
              return (
                <div key={name}>
                  <h4 className="font-medium text-sm mb-2">{name}</h4>
                  <div className="space-y-1">
                    {sets.map((set: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs bg-black/20 rounded px-3 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 w-12">
                            {set.setType || `Set ${i + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {set.weight != null && (
                            <span>{set.weight} lb</span>
                          )}
                          {set.reps != null && (
                            <span>{set.reps} reps</span>
                          )}
                          {set.completed != null && (
                            <Badge
                              variant={set.completed ? 'default' : 'secondary'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {set.completed ? 'Done' : 'Skipped'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
