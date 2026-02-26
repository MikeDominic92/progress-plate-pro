import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { workoutPlan } from '@/data/workoutPlan';
import { format } from 'date-fns';

interface WorkoutCalendarProps {
  workoutDates: Date[];
  weightLogDates: Date[];
  completedDayDates?: string[];
}

export function WorkoutCalendar({ workoutDates, weightLogDates, completedDayDates = [] }: WorkoutCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDayClick = (day: Date) => {
    if (selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
    }
  };

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
          nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-white/10 text-white/60',
          nav_button_previous: 'absolute left-0',
          nav_button_next: 'absolute right-0',
          table: 'w-full border-collapse',
          head_row: 'flex',
          head_cell: 'text-white/30 rounded-md w-7 sm:w-8 font-normal text-[0.65rem]',
          row: 'flex w-full mt-1.5',
          cell: 'h-7 w-7 sm:h-8 sm:w-8 text-center text-xs p-0 relative',
          day: 'h-7 w-7 sm:h-8 sm:w-8 p-0 font-normal text-white/60 hover:bg-white/10 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer',
          day_selected: 'bg-primary text-white',
          day_today: 'bg-white/10 text-white font-semibold',
          day_outside: 'text-white/20 opacity-50',
          day_disabled: 'text-white/20 opacity-50',
          day_hidden: 'invisible',
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

      {/* Inline Day Detail */}
      {selectedDayInfo && (
        <div className="w-full mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white/90">Day {selectedDayInfo.dayNumber}</span>
            <Badge variant="outline" className={`text-[0.6rem] px-1.5 py-0 ${
              selectedDayInfo.planEntry.type === 'high-intensity'
                ? 'text-accent border-accent/50 bg-accent/10'
                : 'text-primary border-primary/50 bg-primary/10'
            }`}>
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
