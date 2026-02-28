import { workoutPlan } from '@/data/workoutPlan';
import type { WorkoutDay } from '@/data/workoutPlan';
import { DAILY_TARGETS } from '@/hooks/useNutritionTracker';
import type { MealEntry } from '@/hooks/useNutritionTracker';
import type { PersonalRecord } from '@/utils/progressionEngine';

export interface CoachContext {
  completedSessionCount: number;
  allPRs: PersonalRecord[];
  latestWeight: number | null;
  weightDelta: number | null;
  goalWeight: number | null;
  weightLogs: { date: string; weight: number }[];
  nextWorkoutDay: WorkoutDay | undefined;
  recentSessions: { date: string; totalVolume: number; prCount: number; rpe?: number | null }[];
  dailyNutritionTotals: { calories: number; protein: number; carbs: number; fat: number };
  meals: MealEntry[];
  currentTime: Date;
}

export function buildCoachContext(params: {
  completedSessionCount: number;
  allPRs: PersonalRecord[];
  recentSessions: { date: string; totalVolume: number; prCount: number; rpe?: number | null }[];
  latestWeight: number | null;
  weightDelta: number | null;
  goalWeight: number | null;
  weightLogs: { date: string; weight: number }[];
  dailyNutritionTotals: { calories: number; protein: number; carbs: number; fat: number };
  meals: MealEntry[];
}): CoachContext {
  return {
    completedSessionCount: params.completedSessionCount,
    allPRs: params.allPRs,
    latestWeight: params.latestWeight,
    weightDelta: params.weightDelta,
    goalWeight: params.goalWeight,
    weightLogs: params.weightLogs,
    nextWorkoutDay: workoutPlan[params.completedSessionCount],
    recentSessions: params.recentSessions,
    dailyNutritionTotals: params.dailyNutritionTotals,
    meals: params.meals,
    currentTime: new Date(),
  };
}

function formatPRType(pr: PersonalRecord): string {
  const labels: Record<string, string> = {
    weight: 'Weight',
    reps: 'Reps',
    estimated_1rm: 'Est. 1RM',
    volume: 'Volume',
  };
  return labels[pr.prType] || pr.prType;
}

function buildPRBlock(allPRs: PersonalRecord[]): string {
  if (allPRs.length === 0) return '  No PRs yet.';
  const recent = allPRs.slice(-15).reverse();
  return recent
    .map(
      (pr) =>
        `  * ${pr.exerciseName} -- ${formatPRType(pr)} PR: ${pr.value}${pr.prType === 'weight' ? ' lb' : pr.prType === 'reps' ? ' reps' : pr.prType === 'volume' ? ' lb total volume' : ' lb est. 1RM'} (${pr.weight} lb x ${pr.reps} reps) on ${pr.date}`
    )
    .join('\n');
}

function buildWeightTrendBlock(weightLogs: { date: string; weight: number }[]): string {
  if (weightLogs.length === 0) return '  No weight entries yet.';
  const recent = weightLogs.slice(-10);
  const entries = recent.map((w) => `  ${w.date}: ${w.weight} lb`).join('\n');

  let rateLine = '';
  if (recent.length >= 4) {
    const last4 = recent.slice(-4);
    const first = last4[0];
    const last = last4[last4.length - 1];
    const daysBetween = Math.max(
      1,
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeksBetween = daysBetween / 7;
    const totalChange = last.weight - first.weight;
    const ratePerWeek = weeksBetween > 0 ? totalChange / weeksBetween : 0;
    rateLine = `\n  Rate of change (last 4 entries): ${ratePerWeek > 0 ? '+' : ''}${ratePerWeek.toFixed(2)} lb/week`;
  }

  return entries + rateLine;
}

function buildNextWorkoutBlock(wd: WorkoutDay | undefined): string {
  if (!wd) return '  Rest day or program complete.';

  const typeName = wd.type === 'high-intensity' ? 'High Intensity Strength' : 'Technique & Cardio';
  const lines: string[] = [];
  lines.push(`  Day ${wd.day}: ${typeName}`);
  lines.push(`  Cardio: ${wd.cardio}`);
  lines.push(`  Exercises:`);

  for (const e of wd.exercises) {
    lines.push(`    * ${e.name} [${e.tier}]`);
    if (e.sets) lines.push(`      Sets: ${e.sets}`);
    if (e.instructions) lines.push(`      Targets/cues: ${e.instructions}`);
  }

  return lines.join('\n');
}

function macroPercent(consumed: number, target: number): string {
  if (target === 0) return '0%';
  return `${Math.round((consumed / target) * 100)}%`;
}

export function buildSystemPrompt(ctx: CoachContext): string {
  const t = DAILY_TARGETS;
  const n = ctx.dailyNutritionTotals;

  // Weight
  const weightLine = ctx.latestWeight
    ? `${ctx.latestWeight} lb` +
      (ctx.weightDelta !== null
        ? ` (${ctx.weightDelta > 0 ? '+' : ''}${ctx.weightDelta.toFixed(1)} lb since last weigh-in)`
        : '')
    : 'not yet recorded';

  const goalLine = ctx.goalWeight ? `${ctx.goalWeight} lb` : 'not set';

  // Recent sessions
  const recentBlock =
    ctx.recentSessions.length > 0
      ? ctx.recentSessions
          .map((s) => `  ${s.date}: volume ${s.totalVolume.toLocaleString()} lb, ${s.prCount} PRs${s.rpe != null ? `, RPE ${s.rpe}/10` : ''}`)
          .join('\n')
      : '  No recent sessions yet.';

  // Nutrition: consumed, remaining, percentages
  const nutritionBlock = `  Calories: ${n.calories} / ${t.calories} kcal (${macroPercent(n.calories, t.calories)})
  Protein: ${n.protein}g / ${t.protein}g (${macroPercent(n.protein, t.protein)})
  Carbs: ${n.carbs}g / ${t.carbs}g (${macroPercent(n.carbs, t.carbs)})
  Fat: ${n.fat}g / ${t.fat}g (${macroPercent(n.fat, t.fat)})`;

  const remaining = {
    calories: Math.max(0, t.calories - n.calories),
    protein: Math.max(0, t.protein - n.protein),
    carbs: Math.max(0, t.carbs - n.carbs),
    fat: Math.max(0, t.fat - n.fat),
  };
  const remainingBlock = `  Calories: ${Math.round(remaining.calories)} kcal
  Protein: ${Math.round(remaining.protein)}g
  Carbs: ${Math.round(remaining.carbs)}g
  Fat: ${Math.round(remaining.fat)}g`;

  const overages: string[] = [];
  if (n.calories > t.calories) overages.push(`Calories over by ${Math.round(n.calories - t.calories)} kcal`);
  if (n.protein > t.protein) overages.push(`Protein over by ${Math.round(n.protein - t.protein)}g`);
  if (n.carbs > t.carbs) overages.push(`Carbs over by ${Math.round(n.carbs - t.carbs)}g`);
  if (n.fat > t.fat) overages.push(`Fat over by ${Math.round(n.fat - t.fat)}g`);
  const overageBlock = overages.length > 0 ? `\nOVERAGES:\n  ${overages.join('\n  ')}` : '';

  // Meals logged
  const mealLogBlock =
    ctx.meals.length > 0
      ? ctx.meals
          .map((m) => {
            const itemList = m.items
              .map(
                (i) =>
                  `    * ${i.name} (${i.portion}): ${i.calories} cal, ${i.protein}g P, ${i.carbs}g C, ${i.fat}g F`
              )
              .join('\n');
            return `  [${m.time}] ${m.totals.calories} cal total\n${itemList}`;
          })
          .join('\n')
      : '  No meals logged yet today.';

  // PR block
  const prBlock = buildPRBlock(ctx.allPRs);

  // Weight trend
  const weightTrendBlock = buildWeightTrendBlock(ctx.weightLogs);

  // Next workout
  const nextWorkoutBlock = buildNextWorkoutBlock(ctx.nextWorkoutDay);

  // Derived metrics
  const programPct = Math.round((ctx.completedSessionCount / 90) * 100);
  const daysRemaining = 90 - ctx.completedSessionCount;

  // Volume trend (last 3 vs prior 3)
  let volumeTrendLine = '';
  if (ctx.recentSessions.length >= 6) {
    const last3 = ctx.recentSessions.slice(-3);
    const prior3 = ctx.recentSessions.slice(-6, -3);
    const avgLast3 = last3.reduce((sum, s) => sum + s.totalVolume, 0) / 3;
    const avgPrior3 = prior3.reduce((sum, s) => sum + s.totalVolume, 0) / 3;
    const volChange = avgPrior3 > 0 ? ((avgLast3 - avgPrior3) / avgPrior3) * 100 : 0;
    volumeTrendLine = `\n  Volume trend: last 3 sessions avg ${Math.round(avgLast3).toLocaleString()} lb vs prior 3 avg ${Math.round(avgPrior3).toLocaleString()} lb (${volChange > 0 ? '+' : ''}${volChange.toFixed(1)}%)`;
  }

  // Weight pace check
  let weightPaceLine = '';
  if (ctx.goalWeight && ctx.latestWeight && ctx.weightLogs.length >= 2) {
    const startWeight = ctx.weightLogs[0].weight;
    const totalToLose = startWeight - ctx.goalWeight;
    const lostSoFar = startWeight - ctx.latestWeight;
    if (totalToLose > 0) {
      const pctTowardGoal = Math.round((lostSoFar / totalToLose) * 100);
      weightPaceLine = `\n  Weight goal progress: lost ${lostSoFar.toFixed(1)} of ${totalToLose.toFixed(1)} lb target (${pctTowardGoal}% there)`;
    }
  }

  // Current time context
  const hour = ctx.currentTime.getHours();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[ctx.currentTime.getDay()];
  let timeOfDay: string;
  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';
  else timeOfDay = 'evening';
  const isTrainingDay = ['Monday', 'Wednesday', 'Friday'].includes(dayOfWeek);
  const timeLine = `${dayOfWeek} ${timeOfDay} (${hour}:${String(ctx.currentTime.getMinutes()).padStart(2, '0')})`;

  return `You are Coach Dom -- Kara's dedicated personal fitness and nutrition coach. You are not a generic chatbot. You have studied her entire program, tracked every PR she has set, watched her weight trend week by week, and you know exactly what she ate today. You talk to her like a real coach who knows her inside and out.

===== KARA'S PROFILE =====
* Name: Kara
* Age: 20, Height: 5'0"
* Current weight: ${weightLine}
* Goal weight: ${goalLine}
* Program: 90-day glute-focused training (Mon/Wed/Fri, 3x/week)
* Daily nutrition targets: ${t.calories} cal / ${t.protein}g protein / ${t.carbs}g carbs / ${t.fat}g fat

===== CURRENT TIME =====
${timeLine}
${isTrainingDay ? 'Today is a training day.' : 'Today is a rest day.'}

===== PROGRAM PROGRESS =====
* Sessions completed: ${ctx.completedSessionCount} of 90 (${programPct}%)
* Sessions remaining: ${daysRemaining}
* Total PRs earned: ${ctx.allPRs.length}${volumeTrendLine}${weightPaceLine}

===== RECENT SESSIONS =====
${recentBlock}

===== PERSONAL RECORDS (most recent 15) =====
${prBlock}

===== WEIGHT TREND =====
${weightTrendBlock}

===== TODAY'S NUTRITION =====
Consumed vs targets:
${nutritionBlock}

Remaining to hit targets:
${remainingBlock}
${overageBlock}

===== MEALS LOGGED TODAY =====
${mealLogBlock}

===== NEXT WORKOUT =====
${nextWorkoutBlock}

===== PROGRAM STRUCTURE =====
* 90-day program cycling through 9-day blocks (3 weeks per cycle).
* High-intensity days: 4-set structure per exercise -- warm-up set, medium/primer set, heavy/top set (0-1 RIR), back-off/failure set.
* Technique & cardio days: lighter loads, 1 warm-up + 3 working sets at 12-15 reps, focus on mind-muscle connection.
* Exercise tiers: S+ (top priority, most volume), S (high priority), A (supporting), B (accessory).
* Progressive overload via double progression: hit the rep ceiling, then add weight.
* Deload week every 4th week (10% weight reduction).

===== YOUR COACHING RULES =====

VOICE & STYLE:
* You are direct, confident, and warm. Call her Kara by name.
* Structure your answers so they are scannable: use numbered lists, bullet points, line breaks. Never dump a wall of text.
* Be DETAILED and THOROUGH. Kara came to you for expert coaching, not vague platitudes. Every answer should contain specific numbers, specific foods, specific cues, or specific data pulled from the sections above.
* No emojis. No hedging. No "it depends" without following up with a concrete recommendation.
* Keep responses focused but complete. Quality over brevity.

NUTRITION COACHING:
* When Kara asks what to eat or how to close her macros, ALWAYS do the math:
  1. State what she still needs (from REMAINING TO HIT TARGETS).
  2. Suggest 2-3 specific meal or snack options. For each option, list every food item with exact portion size and its per-item macro breakdown (e.g., "6 oz chicken breast: 38g P, 0g C, 4g F, 190 cal").
  3. Show a total for each option so she can verify it adds up to (or close to) her remaining targets.
  4. Consider the time of day: ${timeOfDay === 'evening' ? 'it is evening, so suggest quick, easy snacks or a light meal she can prepare fast' : timeOfDay === 'morning' ? 'it is morning, so a full meal or breakfast is appropriate' : 'suggest a solid meal or substantial snack'}.
  5. Look at MEALS LOGGED TODAY and avoid repeating the same primary protein source she already had.
  6. If she is OVER on any macro, flag it clearly and suggest lower-fat or lower-carb alternatives for the remaining meals.

EXERCISE COACHING:
* When Kara asks about form, tips, or technique for any exercise:
  1. Give 5-6 specific form cues as a numbered list -- things she can mentally cue during the movement.
  2. List 3 common mistakes with a brief fix for each.
  3. If the exercise appears in NEXT WORKOUT, reference her exact set structure and RIR targets (e.g., "Your top set is 0-1 RIR -- pick a weight where you can barely grind out the last rep").
  4. If she has PR history on that exercise (check PERSONAL RECORDS), reference her numbers (e.g., "Last time you hit 135 lb for 8 reps, so today aim for 140 lb or push for 9 reps").
  5. Mention which muscle groups the exercise targets (from the instructions/cues field in her workout plan if available).

PROGRESS & MOTIVATION:
* When Kara asks how she is doing, reference REAL DATA from the sections above:
  * Sessions completed and program completion percentage.
  * PR count and recent PR highlights.
  * Weight trend and rate of change.
  * Nutrition adherence (macro hit percentages from today).
* If she has plateaued (same weight for 2+ weeks or volume stagnating), acknowledge it directly and give 2-3 actionable strategies.
* If she is crushing it (PRs, consistent weight loss, hitting macros), celebrate specifically with her actual numbers. Be her hype man with data to back it up.

GENERAL HEALTH & WELLBEING:
* You can discuss sleep, recovery, hydration, and stress management as they relate to her training and body composition goals.
* You know she is 20 years old, 5'0", training for body recomposition (building glutes while losing fat).
* You can discuss basic supplement guidance (creatine, protein powder, etc.) if asked.
* Always tie advice back to her specific goals and her actual numbers.

BOUNDARIES:
* Never give medical advice or diagnose conditions. If something sounds medical, tell her to see a doctor.
* If asked something outside fitness/nutrition/wellbeing, gently redirect to what you can help with.
* Never make up data. If you do not have information about something, say so.`;
}
