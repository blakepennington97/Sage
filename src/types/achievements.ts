// Achievement system types and definitions

export type AchievementCategory = 
  | 'recipe_explorer'
  | 'kitchen_confidence' 
  | 'skill_builder'
  | 'streak_master'
  | 'flavor_adventurer';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirement: number;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0-1 (percentage complete)
}

export interface UserStats {
  recipesGenerated: number;
  recipesCooked: number;
  favoriteRecipes: number;
  currentStreak: number;
  longestStreak: number;
  lastCookDate?: string;
  skillLevel: string;
  totalPoints: number;
  joinedDate: string;
  difficultiesAttempted: Set<number>;
  weeklyGoal: number;
  weeklyProgress: number;
}

export interface ProgressRing {
  title: string;
  current: number;
  target: number;
  color: string;
  emoji: string;
}

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'isUnlocked' | 'unlockedAt' | 'progress'>[] = [
  // Recipe Explorer Category
  {
    id: 'first_recipe',
    title: 'First Recipe',
    description: 'Generate your very first recipe',
    emoji: '🥄',
    category: 'recipe_explorer',
    tier: 'bronze',
    requirement: 1,
    points: 10,
  },
  {
    id: 'recipe_collector',
    title: 'Recipe Collector',
    description: 'Generate 10 recipes',
    emoji: '📚',
    category: 'recipe_explorer',
    tier: 'silver',
    requirement: 10,
    points: 25,
  },
  {
    id: 'recipe_master',
    title: 'Recipe Master',
    description: 'Generate 50 recipes',
    emoji: '👨‍🍳',
    category: 'recipe_explorer',
    tier: 'gold',
    requirement: 50,
    points: 100,
  },
  {
    id: 'recipe_legend',
    title: 'Recipe Legend',
    description: 'Generate 100 recipes',
    emoji: '⭐',
    category: 'recipe_explorer',
    tier: 'platinum',
    requirement: 100,
    points: 250,
  },

  // Kitchen Confidence Category
  {
    id: 'first_cook',
    title: 'First Cook',
    description: 'Complete your first cooking session',
    emoji: '🔥',
    category: 'kitchen_confidence',
    tier: 'bronze',
    requirement: 1,
    points: 15,
  },
  {
    id: 'confident_cook',
    title: 'Confident Cook',
    description: 'Complete 25 cooking sessions',
    emoji: '👩‍🍳',
    category: 'kitchen_confidence',
    tier: 'silver',
    requirement: 25,
    points: 50,
  },
  {
    id: 'kitchen_pro',
    title: 'Kitchen Pro',
    description: 'Complete 100 cooking sessions',
    emoji: '🏆',
    category: 'kitchen_confidence',
    tier: 'gold',
    requirement: 100,
    points: 150,
  },

  // Skill Builder Category
  {
    id: 'skill_explorer',
    title: 'Skill Explorer',
    description: 'Try recipes from 3 different difficulty levels',
    emoji: '🎯',
    category: 'skill_builder',
    tier: 'bronze',
    requirement: 3,
    points: 20,
  },
  {
    id: 'difficulty_master',
    title: 'Difficulty Master',
    description: 'Try recipes from all 5 difficulty levels',
    emoji: '🌟',
    category: 'skill_builder',
    tier: 'silver',
    requirement: 5,
    points: 40,
  },
  {
    id: 'expert_chef',
    title: 'Expert Chef',
    description: 'Complete 10 Expert level recipes',
    emoji: '👑',
    category: 'skill_builder',
    tier: 'gold',
    requirement: 10,
    points: 75,
  },

  // Streak Master Category
  {
    id: 'streak_starter',
    title: 'Streak Starter',
    description: 'Cook for 3 days in a row',
    emoji: '🔥',
    category: 'streak_master',
    tier: 'bronze',
    requirement: 3,
    points: 30,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Cook for 7 days in a row',
    emoji: '⚡',
    category: 'streak_master',
    tier: 'silver',
    requirement: 7,
    points: 60,
  },
  {
    id: 'month_master',
    title: 'Month Master',
    description: 'Cook for 30 days in a row',
    emoji: '💎',
    category: 'streak_master',
    tier: 'gold',
    requirement: 30,
    points: 200,
  },

  // Flavor Adventurer Category
  {
    id: 'favorite_finder',
    title: 'Favorite Finder',
    description: 'Mark 5 recipes as favorites',
    emoji: '❤️',
    category: 'flavor_adventurer',
    tier: 'bronze',
    requirement: 5,
    points: 15,
  },
  {
    id: 'taste_explorer',
    title: 'Taste Explorer',
    description: 'Mark 20 recipes as favorites',
    emoji: '🌶️',
    category: 'flavor_adventurer',
    tier: 'silver',
    requirement: 20,
    points: 35,
  },
  {
    id: 'flavor_connoisseur',
    title: 'Flavor Connoisseur',
    description: 'Mark 50 recipes as favorites',
    emoji: '🍷',
    category: 'flavor_adventurer',
    tier: 'gold',
    requirement: 50,
    points: 80,
  },
];

// Helper functions
export const getTierColor = (tier: AchievementTier): string => {
  switch (tier) {
    case 'bronze': return '#CD7F32';
    case 'silver': return '#C0C0C0';
    case 'gold': return '#FFD700';
    case 'platinum': return '#E5E4E2';
    default: return '#CD7F32';
  }
};

export const getCategoryColor = (category: AchievementCategory): string => {
  switch (category) {
    case 'recipe_explorer': return '#10B981';
    case 'kitchen_confidence': return '#3B82F6';
    case 'skill_builder': return '#F59E0B';
    case 'streak_master': return '#EF4444';
    case 'flavor_adventurer': return '#8B5CF6';
    default: return '#6B7280';
  }
};

export const getCategoryTitle = (category: AchievementCategory): string => {
  switch (category) {
    case 'recipe_explorer': return 'Recipe Explorer';
    case 'kitchen_confidence': return 'Kitchen Confidence';
    case 'skill_builder': return 'Skill Builder';
    case 'streak_master': return 'Streak Master';
    case 'flavor_adventurer': return 'Flavor Adventurer';
    default: return 'Unknown';
  }
};