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
      { name: 'Machine Hip Thrust', tier: 'A-Tier' },
      { name: 'Walking Lunge', tier: 'S+ Tier' },
      { name: 'Romanian Deadlift (RDL)', tier: 'A-Tier' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier' },
      { name: 'Step-Ups', tier: 'A-Tier' }
    ]
  },
  {
    day: 2,
    date: getWorkoutDate(2),
    type: 'technique-cardio',
    title: 'Day 2: Wednesday (Technique & Cardio)',
    cardio: '10-minute warm-up + 20-25 minutes moderate cardio after workout',
    exercises: [
      { name: 'Bulgarian Split Squat', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: '45-Degree Back Extension', tier: 'S-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Barbell Back Squat', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Cable Kickback', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Single-Leg Dumbbell Hip Thrust', tier: 'A-Tier', sets: '3 sets of 12-15 reps' }
    ]
  },
  {
    day: 3,
    date: getWorkoutDate(3),
    type: 'high-intensity',
    title: 'Day 3: Friday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Smith Machine Lunge (Front Foot Elevated)', tier: 'S-Tier' },
      { name: 'Machine Hip Thrust', tier: 'A-Tier' },
      { name: 'Romanian Deadlift (RDL)', tier: 'A-Tier' },
      { name: 'Smith Machine Squat', tier: 'A-Tier' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier' }
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
      { name: 'Walking Lunge', tier: 'S+ Tier' },
      { name: 'Barbell Back Squat', tier: 'A-Tier' },
      { name: '45-Degree Back Extension', tier: 'S-Tier' },
      { name: 'Single-Leg Dumbbell Hip Thrust', tier: 'A-Tier' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier' }
    ]
  },
  {
    day: 5,
    date: getWorkoutDate(5),
    type: 'technique-cardio',
    title: 'Day 5: Wednesday (Technique & Cardio)',
    cardio: '10-minute warm-up + 25-30 minutes moderate cardio after workout',
    exercises: [
      { name: 'Smith Machine Lunge (Front Foot Elevated)', tier: 'S-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Machine Hip Thrust', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Step-Ups', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Cable Kickback', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Romanian Deadlift (RDL)', tier: 'A-Tier', sets: '3 sets of 12-15 reps' }
    ]
  },
  {
    day: 6,
    date: getWorkoutDate(6),
    type: 'high-intensity',
    title: 'Day 6: Friday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Bulgarian Split Squat', tier: 'A-Tier' },
      { name: 'Smith Machine Squat', tier: 'A-Tier' },
      { name: '45-Degree Back Extension', tier: 'S-Tier' },
      { name: 'Single-Leg Dumbbell Hip Thrust', tier: 'A-Tier' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier' }
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
      { name: 'Machine Hip Thrust', tier: 'A-Tier' },
      { name: 'Walking Lunge', tier: 'S+ Tier' },
      { name: 'Romanian Deadlift (RDL)', tier: 'A-Tier' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier' },
      { name: 'Step-Ups', tier: 'A-Tier' }
    ]
  },
  {
    day: 8,
    date: getWorkoutDate(8),
    type: 'technique-cardio',
    title: 'Day 8: Wednesday (Technique & Cardio)',
    cardio: '10-minute warm-up + 30 minutes moderate cardio after workout',
    exercises: [
      { name: 'Bulgarian Split Squat', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: '45-Degree Back Extension', tier: 'S-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Barbell Back Squat', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Cable Kickback', tier: 'A-Tier', sets: '3 sets of 12-15 reps' },
      { name: 'Single-Leg Dumbbell Hip Thrust', tier: 'A-Tier', sets: '3 sets of 12-15 reps' }
    ]
  },
  {
    day: 9,
    date: getWorkoutDate(9),
    type: 'high-intensity',
    title: 'Day 9: Friday (High Intensity)',
    cardio: '10-minute warm-up',
    exercises: [
      { name: 'Smith Machine Lunge (Front Foot Elevated)', tier: 'S-Tier' },
      { name: 'Machine Hip Thrust', tier: 'A-Tier' },
      { name: 'Romanian Deadlift (RDL)', tier: 'A-Tier' },
      { name: 'Smith Machine Squat', tier: 'A-Tier' },
      { name: 'Machine Hip Abduction', tier: 'S-Tier' }
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