import { workoutPlan } from '@/data/workoutPlan';
import { ExerciseIndexItem } from '@/hooks/useExerciseIndex';

export interface ExerciseToSync {
  name: string;
  tier: string;
  video_url: string; // Make this required since we only sync exercises with videos
  category: 'workout';
  subcategory?: string;
  instructions?: string;
  is_custom: boolean;
  created_by: string;
}

export const extractUniqueExercises = (username: string): ExerciseToSync[] => {
  const exerciseMap = new Map<string, ExerciseToSync>();

  workoutPlan.forEach(day => {
    day.exercises.forEach(exercise => {
      if (!exerciseMap.has(exercise.name)) {
        exerciseMap.set(exercise.name, {
          name: exercise.name,
          tier: exercise.tier,
          video_url: exercise.video_url,
          category: 'workout',
          subcategory: day.type === 'high-intensity' ? 'High Intensity' : 'Technique & Cardio',
          instructions: exercise.instructions || exercise.sets,
          is_custom: false,
          created_by: username
        });
      } else {
        // Update with video URL if it exists and current doesn't have one
        const existing = exerciseMap.get(exercise.name)!;
        if (exercise.video_url && !existing.video_url) {
          existing.video_url = exercise.video_url;
        }
      }
    });
  });

  return Array.from(exerciseMap.values()).filter(exercise => exercise.video_url); // Only sync exercises with videos
};

export const getExerciseSyncStats = (username: string) => {
  const uniqueExercises = extractUniqueExercises(username);
  const exercisesWithVideos = uniqueExercises.filter(ex => ex.video_url);
  
  return {
    totalExercises: uniqueExercises.length,
    exercisesWithVideos: exercisesWithVideos.length,
    exerciseNames: uniqueExercises.map(ex => ex.name)
  };
};