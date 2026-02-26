import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Scale, Target, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { workoutPlan } from '@/data/workoutPlan';
import { format } from 'date-fns';
import type { DayContentProps } from 'react-day-picker';

interface WeightLog {
  date: string;
  weight: number;
}

interface WorkoutCalendarProps {
  workoutDates: Date[];
  weightLogDates: Date[];
  completedDayDates?: string[];
  weightLogs?: WeightLog[];
  goalWeight?: number | null;
  selectedDate?: Date | null;
  onSelectDate?: (date: Date | null) => void;
}

export function WorkoutCalendar({
  workoutDates,
  weightLogDates,
  completedDayDates = [],
  weightLogs = [],
  goalWeight = null,
  selectedDate: externalSelected,
  onSelectDate,
}: WorkoutCalendarProps) {
  const [internalSelected, setInternalSelected] = useState<Date | null>(null);
  const selectedDate = externalSelected !== undefined ? externalSelected : internalSelected;
  const setSelectedDate = onSelectDate || setInternalSelected;

  // Build lookup: date string -> { weight, gained }
  const weightByDate = useMemo(() => {
    const map = new Map<string, { weight: number; gained: boolean }>();
    const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < sorted.length; i++) {
      const gained = i > 0 && sorted[i].weight > sorted[i - 1].weight;
      map.set(sorted[i].date, { weight: sorted[i].weight, gained });
    }
    return map;
  }, [weightLogs]);

  const sortedLogs = useMemo(
    () => [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [weightLogs],
  );

  const startingLog = sortedLogs.length > 0 ? sortedLogs[0] : null;
  const latestLog = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1] : null;
  const totalChange = startingLog && latestLog ? latestLog.weight - startingLog.weight : null;

  const handleDayClick = (day: Date) => {
    if (selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
    }
  };

  // Custom day content that shows weight below the date number
  function CustomDayContent(props: DayContentProps) {
    const dateStr = format(props.date, 'yyyy-MM-dd');
    const entry = weightByDate.get(dateStr);
    return (
      <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
        <span className="text-[0.7rem]">{props.date.getDate()}</span>
        {entry ? (
          <span
            className={`text-[0.5rem] font-semibold leading-none tracking-tight ${
              entry.gained ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {entry.weight}
          </span>
        ) : (
          <span className="text-[0.5rem] leading-none invisible">0</span>
        )}
      </div>
    );
  }

  // Compute detail info for selected date
  const selectedDayInfo = (() => {
    if (!selectedDate || completedDayDates.length === 0) return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const sorted = [...completedDayDates].sort();
    const index = sorted.indexOf(dateStr);
    if (index === -1) return null;
    const dayNumber = index + 1;
    const planEntry = workoutPlan[index];
    if (!planEntry) return null;
    return { dayNumber, planEntry };
  })();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-3 flex flex-col items-center">
      <Calendar
        modifiers={{
          workout: workoutDates,
          weightLog: weightLogDates,
        }}
        modifiersClassNames={{
          workout: 'bg-primary/30 text-white',
          weightLog: 'ring-2 ring-green-400/50',
        }}
        onDayClick={handleDayClick}
        className="!p-0"
        classNames={{
          months: 'flex flex-col',
          month: 'space-y-2',
          caption: 'flex justify-center pt-1 relative items-center',
          caption_label: 'text-xs font-medium text-white/70',
          nav: 'space-x-1 flex items-center',
          nav_button:
            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-white/10 text-white/60',
          nav_button_previous: 'absolute left-0',
          nav_button_next: 'absolute right-0',
          table: 'w-full border-collapse',
          head_row: 'flex',
          head_cell: 'text-white/30 rounded-md w-10 sm:w-11 font-normal text-[0.65rem]',
          row: 'flex w-full mt-0.5',
          cell: 'h-11 w-10 sm:h-12 sm:w-11 text-center text-xs p-0 relative',
          day: 'h-11 w-10 sm:h-12 sm:w-11 p-0 font-normal text-white/60 hover:bg-white/10 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer',
          day_selected: 'bg-primary text-white',
          day_today: 'bg-white/10 text-white font-semibold',
          day_outside: 'text-white/20 opacity-50',
          day_disabled: 'text-white/20 opacity-50',
          day_hidden: 'invisible',
        }}
        components={{
          DayContent: CustomDayContent,
        }}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[0.65rem] sm:text-xs text-white/40">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary/50 inline-block" />
          Workout
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full ring-1 ring-green-400/60 bg-transparent inline-block" />
          Weighed
        </span>
      </div>

      {/* Weight Summary */}
      {sortedLogs.length > 0 && (
        <div className="w-full mt-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="h-3.5 w-3.5 text-primary" />
            <span className="text-[0.7rem] font-semibold text-white/70 uppercase tracking-wider">Weight Progress</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Starting Weight */}
            {startingLog && (
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-white/[0.03]">
                <span className="text-[0.6rem] text-white/35 uppercase tracking-wide">Starting</span>
                <span className="text-sm font-bold text-white/80">{startingLog.weight} <span className="text-[0.6rem] font-normal text-white/30">lb</span></span>
                <span className="text-[0.55rem] text-white/25">{format(new Date(startingLog.date + 'T00:00:00'), 'M/d/yyyy')}</span>
              </div>
            )}

            {/* Today's Weight */}
            {latestLog && (
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-white/[0.03]">
                <span className="text-[0.6rem] text-white/35 uppercase tracking-wide">Current</span>
                <span className={`text-sm font-bold ${totalChange !== null && totalChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {latestLog.weight} <span className="text-[0.6rem] font-normal opacity-60">lb</span>
                </span>
                <span className="text-[0.55rem] text-white/25">{format(new Date(latestLog.date + 'T00:00:00'), 'M/d/yyyy')}</span>
              </div>
            )}

            {/* Goal */}
            {goalWeight !== null && (
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-white/[0.03]">
                <span className="text-[0.6rem] text-white/35 uppercase tracking-wide">Goal</span>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-yellow-400/70" />
                  <span className="text-sm font-bold text-yellow-400">{goalWeight} <span className="text-[0.6rem] font-normal opacity-60">lb</span></span>
                </div>
              </div>
            )}

            {/* Remaining */}
            {goalWeight !== null && latestLog && latestLog.weight > goalWeight && (
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-white/[0.03]">
                <span className="text-[0.6rem] text-white/35 uppercase tracking-wide">To Go</span>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-yellow-400/70" />
                  <span className="text-sm font-bold text-yellow-400">{(latestLog.weight - goalWeight).toFixed(1)} <span className="text-[0.6rem] font-normal opacity-60">lb</span></span>
                </div>
              </div>
            )}

            {/* Goal reached */}
            {goalWeight !== null && latestLog && latestLog.weight <= goalWeight && (
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-green-400/5 border border-green-400/10">
                <span className="text-[0.6rem] text-green-400/50 uppercase tracking-wide">Status</span>
                <span className="text-sm font-bold text-green-400">Goal reached!</span>
              </div>
            )}
          </div>

          {/* Total change */}
          {totalChange !== null && sortedLogs.length >= 2 && (
            <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-white/[0.05]">
              {totalChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-400/70" />
              ) : totalChange < 0 ? (
                <TrendingDown className="h-3 w-3 text-green-400/70" />
              ) : (
                <Minus className="h-3 w-3 text-white/30" />
              )}
              <span className={`text-xs font-semibold ${totalChange > 0 ? 'text-red-400' : totalChange < 0 ? 'text-green-400' : 'text-white/40'}`}>
                {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)} lb since start
              </span>
            </div>
          )}
        </div>
      )}

      {/* Inline Day Detail */}
      {selectedDayInfo && (
        <div className="w-full mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white/90">Day {selectedDayInfo.dayNumber}</span>
            <Badge
              variant="outline"
              className={`text-[0.6rem] px-1.5 py-0 ${
                selectedDayInfo.planEntry.type === 'high-intensity'
                  ? 'text-accent border-accent/50 bg-accent/10'
                  : 'text-primary border-primary/50 bg-primary/10'
              }`}
            >
              {selectedDayInfo.planEntry.type === 'high-intensity' ? 'High Intensity' : 'Technique & Cardio'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground/60 mb-2">{selectedDayInfo.planEntry.cardio}</p>
          <div className="flex flex-wrap gap-1">
            {selectedDayInfo.planEntry.exercises.map((ex) => (
              <span
                key={ex.name}
                className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50"
              >
                {ex.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
