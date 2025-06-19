// Achievement calculation and progress tracking service

import { UserRecipe, UserProfile } from './supabase';
import { 
  Achievement, 
  UserStats, 
  ProgressRing,
  ACHIEVEMENT_DEFINITIONS,
  AchievementCategory 
} from '../types/achievements';

export class AchievementService {
  
  /**
   * Calculate user statistics from profile and recipes
   */
  static calculateUserStats(
    profile: UserProfile, 
    recipes: UserRecipe[]
  ): UserStats {
    const now = new Date();
    const recipesGenerated = recipes.length;
    const recipesCooked = recipes.filter(r => r.cook_count > 0).length;
    const favoriteRecipes = recipes.filter(r => r.is_favorite).length;
    
    // Calculate difficulty levels attempted
    const difficultiesAttempted = new Set(
      recipes.map(r => r.difficulty_level).filter(Boolean)
    );
    
    // Calculate current streak (simplified - would need cooking session dates in real implementation)
    const currentStreak = this.calculateCurrentStreak(recipes);
    const longestStreak = this.calculateLongestStreak(recipes);
    
    // Weekly progress (simplified - cooking this week)
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weeklyProgress = recipes.filter(recipe => {
      if (!recipe.last_cooked) return false;
      const cookedDate = new Date(recipe.last_cooked);
      return cookedDate >= weekStart;
    }).length;
    
    return {
      recipesGenerated,
      recipesCooked,
      favoriteRecipes,
      currentStreak,
      longestStreak,
      lastCookDate: this.getLastCookDate(recipes),
      skillLevel: profile.skill_level,
      totalPoints: 0, // Will be calculated from achievements
      joinedDate: profile.created_at,
      difficultiesAttempted,
      weeklyGoal: 5, // Default weekly goal
      weeklyProgress,
    };
  }
  
  /**
   * Calculate achievement progress and unlock status
   */
  static calculateAchievements(stats: UserStats, recipes: UserRecipe[]): Achievement[] {
    return ACHIEVEMENT_DEFINITIONS.map(definition => {
      const progress = this.calculateAchievementProgress(definition, stats, recipes);
      const isUnlocked = progress >= 1;
      
      return {
        ...definition,
        progress,
        isUnlocked,
        unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
      };
    });
  }
  
  /**
   * Calculate progress for a specific achievement (0-1)
   */
  private static calculateAchievementProgress(
    achievement: Omit<Achievement, 'isUnlocked' | 'unlockedAt' | 'progress'>,
    stats: UserStats,
    recipes: UserRecipe[]
  ): number {
    let current = 0;
    
    switch (achievement.id) {
      // Recipe Explorer
      case 'first_recipe':
      case 'recipe_collector':
      case 'recipe_master':
      case 'recipe_legend':
        current = stats.recipesGenerated;
        break;
        
      // Kitchen Confidence
      case 'first_cook':
      case 'confident_cook':
      case 'kitchen_pro':
        current = stats.recipesCooked;
        break;
        
      // Skill Builder
      case 'skill_explorer':
      case 'difficulty_master':
        current = stats.difficultiesAttempted.size;
        break;
      case 'expert_chef':
        current = recipes.filter(r => r.difficulty_level === 5 && r.cook_count > 0).length;
        break;
        
      // Streak Master
      case 'streak_starter':
      case 'week_warrior':
      case 'month_master':
        current = Math.max(stats.currentStreak, stats.longestStreak);
        break;
        
      // Flavor Adventurer
      case 'favorite_finder':
      case 'taste_explorer':
      case 'flavor_connoisseur':
        current = stats.favoriteRecipes;
        break;
        
      default:
        current = 0;
    }
    
    return Math.min(current / achievement.requirement, 1);
  }
  
  /**
   * Get progress rings for dashboard display
   */
  static getProgressRings(stats: UserStats): ProgressRing[] {
    return [
      {
        title: 'Weekly Goal',
        current: stats.weeklyProgress,
        target: stats.weeklyGoal,
        color: '#10B981',
        emoji: '🎯',
      },
      {
        title: 'Recipes Generated',
        current: stats.recipesGenerated,
        target: this.getNextMilestone(stats.recipesGenerated, [1, 5, 10, 25, 50, 100]),
        color: '#3B82F6',
        emoji: '📚',
      },
      {
        title: 'Cooking Streak',
        current: stats.currentStreak,
        target: this.getNextMilestone(stats.currentStreak, [3, 7, 14, 30]),
        color: '#EF4444',
        emoji: '🔥',
      },
      {
        title: 'Skill Levels',
        current: stats.difficultiesAttempted.size,
        target: 5,
        color: '#F59E0B',
        emoji: '⭐',
      },
    ];
  }
  
  /**
   * Get recently unlocked achievements (last 7 days)
   */
  static getRecentAchievements(achievements: Achievement[]): Achievement[] {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return achievements.filter(achievement => {
      if (!achievement.unlockedAt) return false;
      const unlockedDate = new Date(achievement.unlockedAt);
      return unlockedDate >= sevenDaysAgo;
    });
  }
  
  /**
   * Get achievements by category
   */
  static getAchievementsByCategory(
    achievements: Achievement[], 
    category: AchievementCategory
  ): Achievement[] {
    return achievements.filter(a => a.category === category);
  }
  
  /**
   * Calculate total points from unlocked achievements
   */
  static calculateTotalPoints(achievements: Achievement[]): number {
    return achievements
      .filter(a => a.isUnlocked)
      .reduce((total, a) => total + a.points, 0);
  }
  
  // Private helper methods
  private static calculateCurrentStreak(recipes: UserRecipe[]): number {
    // Simplified implementation - would need proper cooking session tracking
    const cookedRecipes = recipes.filter(r => r.last_cooked).sort((a, b) => 
      new Date(b.last_cooked!).getTime() - new Date(a.last_cooked!).getTime()
    );
    
    if (cookedRecipes.length === 0) return 0;
    
    // For now, return a simple calculation based on recent activity
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return cookedRecipes.filter(r => 
      new Date(r.last_cooked!) >= lastWeek
    ).length;
  }
  
  private static calculateLongestStreak(recipes: UserRecipe[]): number {
    // Simplified - in real implementation, would track daily cooking sessions
    return Math.max(this.calculateCurrentStreak(recipes), 0);
  }
  
  private static getLastCookDate(recipes: UserRecipe[]): string | undefined {
    const cookedRecipes = recipes.filter(r => r.last_cooked);
    if (cookedRecipes.length === 0) return undefined;
    
    return cookedRecipes.sort((a, b) => 
      new Date(b.last_cooked!).getTime() - new Date(a.last_cooked!).getTime()
    )[0].last_cooked!;
  }
  
  private static getNextMilestone(current: number, milestones: number[]): number {
    for (const milestone of milestones) {
      if (current < milestone) return milestone;
    }
    return milestones[milestones.length - 1] * 2; // Double the highest milestone
  }
}