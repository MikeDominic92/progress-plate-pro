export interface BadgeDefinition {
  id: string;
  category: 'strength' | 'consistency' | 'program' | 'volume' | 'nutrition';
  name: string;
  description: string;
  icon: string;
  threshold: number;
  checkFn: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  prCount: number;
  bestStreak: number;
  currentStreak: number;
  sessionCount: number;
  dailyVolumes: number[];
  totalVolumeAllTime: number;
  nutritionStreak: number;
  macroAccuracy: boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Strength
  {
    id: 'first_pr',
    category: 'strength',
    name: 'First Blood',
    description: 'Hit your first personal record',
    icon: 'Trophy',
    threshold: 1,
    checkFn: (s) => s.prCount >= 1,
  },
  {
    id: 'pr_10',
    category: 'strength',
    name: 'PR Machine',
    description: 'Earn 10 personal records',
    icon: 'Trophy',
    threshold: 10,
    checkFn: (s) => s.prCount >= 10,
  },
  {
    id: 'pr_25',
    category: 'strength',
    name: 'Record Breaker',
    description: 'Earn 25 personal records',
    icon: 'Trophy',
    threshold: 25,
    checkFn: (s) => s.prCount >= 25,
  },
  {
    id: 'pr_50',
    category: 'strength',
    name: 'PR Legend',
    description: 'Earn 50 personal records',
    icon: 'Crown',
    threshold: 50,
    checkFn: (s) => s.prCount >= 50,
  },

  // Consistency
  {
    id: 'streak_3',
    category: 'consistency',
    name: 'Getting Started',
    description: '3-day workout streak',
    icon: 'Flame',
    threshold: 3,
    checkFn: (s) => s.bestStreak >= 3,
  },
  {
    id: 'streak_7',
    category: 'consistency',
    name: 'Week Warrior',
    description: '7-day workout streak',
    icon: 'Flame',
    threshold: 7,
    checkFn: (s) => s.bestStreak >= 7,
  },
  {
    id: 'streak_14',
    category: 'consistency',
    name: 'Unstoppable',
    description: '14-day workout streak',
    icon: 'Flame',
    threshold: 14,
    checkFn: (s) => s.bestStreak >= 14,
  },
  {
    id: 'streak_30',
    category: 'consistency',
    name: 'Iron Discipline',
    description: '30-day workout streak',
    icon: 'Flame',
    threshold: 30,
    checkFn: (s) => s.bestStreak >= 30,
  },

  // Program
  {
    id: 'day_30',
    category: 'program',
    name: 'Month One',
    description: 'Complete 30 sessions',
    icon: 'Calendar',
    threshold: 30,
    checkFn: (s) => s.sessionCount >= 30,
  },
  {
    id: 'day_60',
    category: 'program',
    name: 'Halfway There',
    description: 'Complete 60 sessions',
    icon: 'Calendar',
    threshold: 60,
    checkFn: (s) => s.sessionCount >= 60,
  },
  {
    id: 'day_90',
    category: 'program',
    name: 'Program Complete',
    description: 'Complete all 90 sessions',
    icon: 'Award',
    threshold: 90,
    checkFn: (s) => s.sessionCount >= 90,
  },

  // Volume
  {
    id: 'vol_1k',
    category: 'volume',
    name: 'Thousand Pounder',
    description: 'Move 1,000 lb in a single session',
    icon: 'Dumbbell',
    threshold: 1000,
    checkFn: (s) => s.dailyVolumes.some(v => v >= 1000),
  },
  {
    id: 'vol_5k',
    category: 'volume',
    name: 'Heavy Hitter',
    description: 'Move 5,000 lb in a single session',
    icon: 'Dumbbell',
    threshold: 5000,
    checkFn: (s) => s.dailyVolumes.some(v => v >= 5000),
  },
  {
    id: 'vol_10k_total',
    category: 'volume',
    name: 'Iron Milestone',
    description: 'Move 10,000 lb total across all sessions',
    icon: 'Dumbbell',
    threshold: 10000,
    checkFn: (s) => s.totalVolumeAllTime >= 10000,
  },

  // Nutrition
  {
    id: 'nutrition_streak_7',
    category: 'nutrition',
    name: 'Meal Prep Pro',
    description: 'Log meals for 7 days straight',
    icon: 'Utensils',
    threshold: 7,
    checkFn: (s) => s.nutritionStreak >= 7,
  },
  {
    id: 'macro_hit',
    category: 'nutrition',
    name: 'Macro Master',
    description: 'Hit all 4 macros within 10% of target',
    icon: 'Target',
    threshold: 1,
    checkFn: (s) => s.macroAccuracy,
  },
];

export const BADGE_CATEGORIES = ['strength', 'consistency', 'program', 'volume', 'nutrition'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Strength',
  consistency: 'Consistency',
  program: 'Program',
  volume: 'Volume',
  nutrition: 'Nutrition',
};
