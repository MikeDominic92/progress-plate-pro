export interface WorkoutDay {
  day: number;
  date: string;
  type: 'high-intensity' | 'technique-cardio';
  title: string;
  cardio: string;
  exercises: {
    name: string;
    tier: string;
    sets?: string;
    instructions?: string;
    video_url?: string;
  }[];
}

// Calculate dates starting from September 22, 2025 (Mon/Wed/Fri schedule)
const getWorkoutDate = (dayNumber: number): string => {
  const startDate = new Date('2025-09-22'); // Starting Monday
  const daysToAdd = Math.floor((dayNumber - 1) / 3) * 7 + ((dayNumber - 1) % 3) * 2;
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + daysToAdd);
  
  return targetDate.toLocaleDateString('en-US', { 
    month: 'numeric', 
    day: 'numeric', 
    year: '2-digit' 
  });
};

export const workoutPlan: WorkoutDay[] = [
  // Week 1
  {
    day: 1,
    date: getWorkoutDate(1),
    type: 'high-intensity',
    title: 'Day 1: Monday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Walking Lunge', tier: 'S+ Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=565s', instructions: 'Upper + All glutes' },
      { name: 'Machine Hip Thrust', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=230s', instructions: 'Lower glutes' },
      { name: 'Barbell Back Squat', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=324s', instructions: 'All glutes' },
      { name: 'Romanian Deadlift (RDL)', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=700s', instructions: 'Mid + Lower glutes' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=500s', instructions: 'Medius (side/stability)' }
    ]
  },
  {
    day: 2,
    date: getWorkoutDate(2),
    type: 'technique-cardio',
    title: 'Day 2: Wednesday (Technique & Cardio)',
    cardio: '10-minute warm-up + 20-25 minutes moderate cardio after workout',
    exercises: [
      { name: 'Smith Machine Lunge (Front Foot Elevated)', tier: 'S-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=623s', instructions: 'Upper glutes' },
      { name: 'Bulgarian Split Squat', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=376s', instructions: 'Upper + All glutes' },
      { name: 'Single-Leg Dumbbell Hip Thrust', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=261s', instructions: 'Lower glutes' },
      { name: 'Step-Ups', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=475s', instructions: 'Upper + All glutes' },
      { name: '45-Degree Back Extension', tier: 'S-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=728s', instructions: 'Mid glutes' }
    ]
  },
  {
    day: 3,
    date: getWorkoutDate(3),
    type: 'high-intensity',
    title: 'Day 3: Friday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Walking Lunge', tier: 'S+ Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=565s', instructions: 'Upper + All glutes' },
      { name: 'Machine Hip Thrust', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=230s', instructions: 'Lower glutes' },
      { name: 'Smith Machine Squat', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=368s', instructions: 'Mid glutes' },
      { name: 'Cable Kickback', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=443s', instructions: 'Upper + Medius glutes' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=500s', instructions: 'Medius (side/stability)' }
    ]
  },
  // Week 2
  {
    day: 4,
    date: getWorkoutDate(4),
    type: 'high-intensity',
    title: 'Day 4: Monday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Smith Machine Lunge (Front Foot Elevated)', tier: 'S-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=623s', instructions: 'Upper glutes' },
      { name: 'Barbell Back Squat', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=324s', instructions: 'All glutes' },
      { name: 'Romanian Deadlift (RDL)', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=700s', instructions: 'Mid + Lower glutes' },
      { name: 'Single-Leg Dumbbell Hip Thrust', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=261s', instructions: 'Lower glutes' },
      { name: '45-Degree Back Extension', tier: 'S-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=728s', instructions: 'Mid glutes' }
    ]
  },
  {
    day: 5,
    date: getWorkoutDate(5),
    type: 'technique-cardio',
    title: 'Day 5: Wednesday (Technique & Cardio)',
    cardio: '10-minute warm-up + 25-30 minutes moderate cardio after workout',
    exercises: [
      { name: 'Walking Lunge', tier: 'S+ Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=565s', instructions: 'Upper + All glutes' },
      { name: 'Bulgarian Split Squat', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=376s', instructions: 'Upper + All glutes' },
      { name: 'Machine Hip Thrust', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=230s', instructions: 'Lower glutes' },
      { name: 'Glute Bridge', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=284s', instructions: 'Lower glutes' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=500s', instructions: 'Medius (side/stability)' }
    ]
  },
  {
    day: 6,
    date: getWorkoutDate(6),
    type: 'high-intensity',
    title: 'Day 6: Friday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Smith Machine Lunge (Front Foot Elevated)', tier: 'S-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=623s', instructions: 'Upper glutes' },
      { name: 'Romanian Deadlift (RDL)', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=700s', instructions: 'Mid + Lower glutes' },
      { name: 'Smith Machine Squat', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=368s', instructions: 'Mid glutes' },
      { name: 'Cable Kickback', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=443s', instructions: 'Upper + Medius glutes' },
      { name: '45-Degree Back Extension', tier: 'S-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=728s', instructions: 'Mid glutes' }
    ]
  },
  // Week 3
  {
    day: 7,
    date: getWorkoutDate(7),
    type: 'high-intensity',
    title: 'Day 7: Monday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Walking Lunge', tier: 'S+ Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=565s', instructions: 'Upper + All glutes' },
      { name: 'Machine Hip Thrust', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=230s', instructions: 'Lower glutes' },
      { name: 'Barbell Back Squat', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=324s', instructions: 'All glutes' },
      { name: 'Bulgarian Split Squat', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=376s', instructions: 'Upper + All glutes' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=500s', instructions: 'Medius (side/stability)' }
    ]
  },
  {
    day: 8,
    date: getWorkoutDate(8),
    type: 'technique-cardio',
    title: 'Day 8: Wednesday (Technique & Cardio)',
    cardio: '10-minute warm-up + 30 minutes moderate cardio after workout',
    exercises: [
      { name: 'Smith Machine Lunge (Front Foot Elevated)', tier: 'S-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=623s', instructions: 'Upper glutes' },
      { name: 'Single-Leg Dumbbell Hip Thrust', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=261s', instructions: 'Lower glutes' },
      { name: 'Step-Ups', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=475s', instructions: 'Upper + All glutes' },
      { name: 'Glute Bridge', tier: 'A-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=284s', instructions: 'Lower glutes' },
      { name: '45-Degree Back Extension', tier: 'S-Tier', sets: '3 sets of 12-15 reps', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=728s', instructions: 'Mid glutes' }
    ]
  },
  {
    day: 9,
    date: getWorkoutDate(9),
    type: 'high-intensity',
    title: 'Day 9: Friday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Walking Lunge', tier: 'S+ Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=565s', instructions: 'Upper + All glutes' },
      { name: 'Machine Hip Thrust', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=230s', instructions: 'Lower glutes' },
      { name: 'Smith Machine Squat', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=368s', instructions: 'Mid glutes' },
      { name: 'Cable Kickback', tier: 'A-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=443s', instructions: 'Upper + Medius glutes' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier', video_url: 'https://www.youtube.com/watch?v=3ryh7PNhz3E&t=500s', instructions: 'Medius (side/stability)' }
    ]
  }
];

// Generate remaining days (10-40) with cycling pattern
for (let day = 10; day <= 40; day++) {
  const cycleDay = ((day - 1) % 9) + 1;
  const baseworkout = workoutPlan[cycleDay - 1];
  
  workoutPlan.push({
    ...baseworkout,
    day,
    date: getWorkoutDate(day),
    title: baseworkout.title.replace(`Day ${cycleDay}`, `Day ${day}`)
  });
}