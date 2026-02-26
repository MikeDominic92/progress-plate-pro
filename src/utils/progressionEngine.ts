// Progressive Overload Engine - Pure computation, zero React/Supabase imports
// RIR-Gated Double Progression algorithm for KaraBaeFit

// ─── Types ──────────────────────────────────────────────────────────────────

export type ExerciseCategory = 'heavy_compound' | 'light_compound' | 'machine_isolation' | 'cable' | 'bodyweight';

export type SetType = 'Warm Up Set' | 'Medium/Primer Set' | 'Heavy/Top Set' | 'Failure/Back-Off Set';

export type ProgressionAction = 'increase' | 'maintain' | 'decrease' | 'deload' | 'first_time';

export interface ExerciseConfig {
  category: ExerciseCategory;
  weightIncrement: number; // lbs
}

export interface SetTypeConfig {
  minReps: number;
  maxReps: number;
  targetRIR: number;
  progressable: boolean; // warm-up sets don't progress
}

export interface SetRecord {
  date: string;
  weight: number;
  reps: number;
  setNumber: number;
  setType: string;
  sessionId?: string;
}

export interface ProgressionSuggestion {
  action: ProgressionAction;
  suggestedWeight: number;
  reason: string;
  lastWeight: number;
  lastReps: number;
  lastDate: string;
  isDeload: boolean;
}

export interface PersonalRecord {
  exerciseName: string;
  setType: string;
  prType: 'weight' | 'reps' | 'estimated_1rm' | 'volume';
  value: number;
  previousValue: number;
  date: string;
  weight: number;
  reps: number;
}

export interface PlateauStatus {
  isPlateaued: boolean;
  sessionCount: number;
  suggestion: string;
}

export interface WeightTrendPoint {
  date: string;
  weight: number;
  reps: number;
  estimated1RM: number;
}

// ─── Configuration Maps ─────────────────────────────────────────────────────

export const EXERCISE_CONFIG: Record<string, ExerciseConfig> = {
  // Heavy compounds
  'Romanian Deadlift (RDL)': { category: 'heavy_compound', weightIncrement: 10 },
  'Barbell Squat': { category: 'heavy_compound', weightIncrement: 10 },

  // Light compounds
  'Walking Lunge': { category: 'light_compound', weightIncrement: 5 },
  'Step-Ups': { category: 'light_compound', weightIncrement: 5 },
  'Bulgarian Split Squat': { category: 'light_compound', weightIncrement: 5 },

  // Machine/isolation
  'Machine/Barbell Hip Thrust': { category: 'machine_isolation', weightIncrement: 5 },
  'Machine Hip Abduction': { category: 'machine_isolation', weightIncrement: 5 },
  'Leg Press': { category: 'machine_isolation', weightIncrement: 10 },

  // Cable
  'Cable Kickback': { category: 'cable', weightIncrement: 2.5 },
  'Cable Pull-Through': { category: 'cable', weightIncrement: 2.5 },

  // Bodyweight
  'Glute Bridge': { category: 'bodyweight', weightIncrement: 0 },
  'Back Extension': { category: 'bodyweight', weightIncrement: 0 },
  'Single Leg Dumbbell Hip Thrust': { category: 'light_compound', weightIncrement: 5 },
};

export const SET_TYPE_CONFIG: Record<string, SetTypeConfig> = {
  'Warm Up Set': { minReps: 12, maxReps: 20, targetRIR: 5, progressable: false },
  'Medium/Primer Set': { minReps: 10, maxReps: 12, targetRIR: 3, progressable: true },
  'Heavy/Top Set': { minReps: 8, maxReps: 10, targetRIR: 1, progressable: true },
  'Failure/Back-Off Set': { minReps: 8, maxReps: 20, targetRIR: 0, progressable: true },
};

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Get exercise config, with a sensible fallback for unknown exercises
 */
export function getExerciseConfig(exerciseName: string): ExerciseConfig {
  return EXERCISE_CONFIG[exerciseName] ?? { category: 'machine_isolation', weightIncrement: 5 };
}

/**
 * Get set type config, with a sensible fallback
 */
export function getSetTypeConfig(setType: string): SetTypeConfig {
  return SET_TYPE_CONFIG[setType] ?? { minReps: 8, maxReps: 12, targetRIR: 2, progressable: true };
}

/**
 * Estimate 1RM using Brzycki (<=10 reps) or Epley (>10 reps)
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps <= 10) {
    // Brzycki formula
    return Math.round(weight * (36 / (37 - reps)));
  }
  // Epley formula
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Double progression logic: compute suggested weight for next session
 */
export function computeSuggestion(
  exerciseName: string,
  setType: string,
  history: SetRecord[],
  completedSessionCount: number
): ProgressionSuggestion {
  const config = getExerciseConfig(exerciseName);
  const setConfig = getSetTypeConfig(setType);

  // No history = first time
  if (history.length === 0) {
    return {
      action: 'first_time',
      suggestedWeight: 0,
      reason: 'First time - track your starting weight',
      lastWeight: 0,
      lastReps: 0,
      lastDate: '',
      isDeload: false,
    };
  }

  // Get most recent session data for this exercise + set type
  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last = sorted[0];

  // Deload check
  const deload = isDeloadWeek(completedSessionCount);
  if (deload) {
    const deloadWeight = applyDeload(last.weight);
    return {
      action: 'deload',
      suggestedWeight: deloadWeight,
      reason: `Deload week - reduced to ${deloadWeight} lb`,
      lastWeight: last.weight,
      lastReps: last.reps,
      lastDate: last.date,
      isDeload: true,
    };
  }

  // Warm-up sets don't progress - maintain same weight
  if (!setConfig.progressable) {
    return {
      action: 'maintain',
      suggestedWeight: last.weight,
      reason: 'Warm-up set - maintain light weight, focus on form',
      lastWeight: last.weight,
      lastReps: last.reps,
      lastDate: last.date,
      isDeload: false,
    };
  }

  // Bodyweight exercises - rep/tempo progression only
  if (config.category === 'bodyweight') {
    return {
      action: 'maintain',
      suggestedWeight: last.weight,
      reason: last.reps >= setConfig.maxReps
        ? 'Add a pause or slow tempo for progression'
        : `Aim for ${last.reps + 1} reps next time`,
      lastWeight: last.weight,
      lastReps: last.reps,
      lastDate: last.date,
      isDeload: false,
    };
  }

  // Double progression logic
  if (last.reps >= setConfig.maxReps) {
    // Hit top of rep range -> increase weight
    const newWeight = last.weight + config.weightIncrement;
    return {
      action: 'increase',
      suggestedWeight: newWeight,
      reason: `Hit ${last.reps} reps at ${last.weight} lb - increase to ${newWeight} lb`,
      lastWeight: last.weight,
      lastReps: last.reps,
      lastDate: last.date,
      isDeload: false,
    };
  }

  if (last.reps >= setConfig.minReps) {
    // Within rep range -> maintain, aim for +1
    return {
      action: 'maintain',
      suggestedWeight: last.weight,
      reason: `Aim for ${last.reps + 1} reps at ${last.weight} lb`,
      lastWeight: last.weight,
      lastReps: last.reps,
      lastDate: last.date,
      isDeload: false,
    };
  }

  // Below minimum reps -> decrease weight
  const reducedWeight = Math.max(0, last.weight - config.weightIncrement);
  return {
    action: 'decrease',
    suggestedWeight: reducedWeight,
    reason: `Only ${last.reps} reps - drop to ${reducedWeight} lb, build back up`,
    lastWeight: last.weight,
    lastReps: last.reps,
    lastDate: last.date,
    isDeload: false,
  };
}

/**
 * Detect PRs by comparing current performance against all history
 */
export function detectPRs(
  exerciseName: string,
  setType: string,
  currentWeight: number,
  currentReps: number,
  history: SetRecord[],
  today: string
): PersonalRecord[] {
  if (currentWeight <= 0 || currentReps <= 0 || history.length === 0) return [];

  const prs: PersonalRecord[] = [];

  // Find best previous values
  const bestWeight = Math.max(...history.map(h => h.weight));
  const bestReps = Math.max(...history.map(h => h.reps));
  const best1RM = Math.max(...history.map(h => estimate1RM(h.weight, h.reps)));
  const bestVolume = Math.max(...history.map(h => h.weight * h.reps));

  const current1RM = estimate1RM(currentWeight, currentReps);
  const currentVolume = currentWeight * currentReps;

  // Weight PR
  if (currentWeight > bestWeight) {
    prs.push({
      exerciseName,
      setType,
      prType: 'weight',
      value: currentWeight,
      previousValue: bestWeight,
      date: today,
      weight: currentWeight,
      reps: currentReps,
    });
  }

  // Reps PR (at same or higher weight)
  const sameOrHigherWeightHistory = history.filter(h => h.weight >= currentWeight);
  if (sameOrHigherWeightHistory.length > 0) {
    const bestRepsAtWeight = Math.max(...sameOrHigherWeightHistory.map(h => h.reps));
    if (currentReps > bestRepsAtWeight) {
      prs.push({
        exerciseName,
        setType,
        prType: 'reps',
        value: currentReps,
        previousValue: bestRepsAtWeight,
        date: today,
        weight: currentWeight,
        reps: currentReps,
      });
    }
  } else if (currentReps > bestReps) {
    // No history at this weight, check absolute reps PR
    prs.push({
      exerciseName,
      setType,
      prType: 'reps',
      value: currentReps,
      previousValue: bestReps,
      date: today,
      weight: currentWeight,
      reps: currentReps,
    });
  }

  // Estimated 1RM PR
  if (current1RM > best1RM) {
    prs.push({
      exerciseName,
      setType,
      prType: 'estimated_1rm',
      value: current1RM,
      previousValue: best1RM,
      date: today,
      weight: currentWeight,
      reps: currentReps,
    });
  }

  // Volume PR (single set)
  if (currentVolume > bestVolume) {
    prs.push({
      exerciseName,
      setType,
      prType: 'volume',
      value: currentVolume,
      previousValue: bestVolume,
      date: today,
      weight: currentWeight,
      reps: currentReps,
    });
  }

  return prs;
}

/**
 * Detect plateau: top set weight hasn't increased across 3+ sessions
 */
export function detectPlateau(
  exerciseName: string,
  history: SetRecord[]
): PlateauStatus {
  // Filter to only Heavy/Top Set entries
  const topSets = history
    .filter(h => h.setType === 'Heavy/Top Set')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (topSets.length < 3) {
    return { isPlateaued: false, sessionCount: 0, suggestion: '' };
  }

  // Group by session date to get unique sessions
  const sessionDates = [...new Set(topSets.map(s => s.date))];
  if (sessionDates.length < 3) {
    return { isPlateaued: false, sessionCount: 0, suggestion: '' };
  }

  // Check if weight has been the same for the last 3 sessions
  const recentWeights = sessionDates.slice(0, 3).map(date => {
    const sessionSets = topSets.filter(s => s.date === date);
    return Math.max(...sessionSets.map(s => s.weight));
  });

  const allSame = recentWeights.every(w => w === recentWeights[0]);
  if (allSame) {
    const config = getExerciseConfig(exerciseName);
    return {
      isPlateaued: true,
      sessionCount: 3,
      suggestion: config.category === 'bodyweight'
        ? 'Try adding tempo variations or pauses'
        : `Consider a ${config.weightIncrement / 2} lb micro-progression or add a rep`,
    };
  }

  return { isPlateaued: false, sessionCount: 0, suggestion: '' };
}

/**
 * Every 4th week is a deload week
 * Week = completedSessions / 3 (assuming 3 sessions per week)
 */
export function isDeloadWeek(completedSessionCount: number): boolean {
  if (completedSessionCount < 9) return false; // Need at least 3 weeks before deload
  const weekNumber = Math.ceil(completedSessionCount / 3);
  return weekNumber % 4 === 0;
}

/**
 * Apply deload: 10% weight reduction, rounded to nearest 2.5
 */
export function applyDeload(weight: number): number {
  const reduced = weight * 0.90;
  return Math.round(reduced / 2.5) * 2.5;
}

/**
 * Build weight trend data for charting
 */
export function buildWeightTrend(history: SetRecord[]): WeightTrendPoint[] {
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return sorted.map(record => ({
    date: record.date,
    weight: record.weight,
    reps: record.reps,
    estimated1RM: estimate1RM(record.weight, record.reps),
  }));
}
