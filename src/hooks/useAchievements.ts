// Custom hook for achievement system

import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRecipes } from './useRecipes';
import { AchievementService } from '../services/achievements';
import { Achievement, UserStats, ProgressRing, AchievementCategory } from '../types/achievements';

export const useAchievements = () => {
  const { profile } = useAuthStore();
  const { recipes } = useRecipes();
  
  // Calculate user statistics
  const userStats = useMemo((): UserStats | null => {
    if (!profile || !recipes) return null;
    return AchievementService.calculateUserStats(profile, recipes);
  }, [profile, recipes]);
  
  // Calculate achievements with progress
  const achievements = useMemo((): Achievement[] => {
    if (!userStats) return [];
    return AchievementService.calculateAchievements(userStats, recipes);
  }, [userStats, recipes]);
  
  // Calculate total points
  const totalPoints = useMemo(() => {
    if (achievements.length === 0) return 0;
    return AchievementService.calculateTotalPoints(achievements);
  }, [achievements]);
  
  // Get progress rings for dashboard
  const progressRings = useMemo((): ProgressRing[] => {
    if (!userStats) return [];
    return AchievementService.getProgressRings(userStats);
  }, [userStats]);
  
  // Get recently unlocked achievements
  const recentAchievements = useMemo(() => {
    return AchievementService.getRecentAchievements(achievements);
  }, [achievements]);
  
  // Get unlocked achievements
  const unlockedAchievements = useMemo(() => {
    return achievements.filter(a => a.isUnlocked);
  }, [achievements]);
  
  // Get locked achievements (sorted by progress)
  const lockedAchievements = useMemo(() => {
    return achievements
      .filter(a => !a.isUnlocked)
      .sort((a, b) => b.progress - a.progress); // Sort by closest to completion
  }, [achievements]);
  
  // Get achievements by category
  const getAchievementsByCategory = (category: AchievementCategory) => {
    return AchievementService.getAchievementsByCategory(achievements, category);
  };
  
  // Get next achievement to unlock
  const nextAchievement = useMemo(() => {
    const nextToUnlock = lockedAchievements.find(a => a.progress > 0);
    return nextToUnlock || lockedAchievements[0];
  }, [lockedAchievements]);
  
  // Get completion percentage
  const completionPercentage = useMemo(() => {
    if (achievements.length === 0) return 0;
    return Math.round((unlockedAchievements.length / achievements.length) * 100);
  }, [achievements.length, unlockedAchievements.length]);
  
  // Get user level based on total points
  const userLevel = useMemo(() => {
    if (totalPoints < 50) return { level: 1, title: 'Kitchen Newbie', emoji: '🥄' };
    if (totalPoints < 150) return { level: 2, title: 'Home Cook', emoji: '🍳' };
    if (totalPoints < 300) return { level: 3, title: 'Skilled Chef', emoji: '👨‍🍳' };
    if (totalPoints < 500) return { level: 4, title: 'Master Chef', emoji: '👑' };
    return { level: 5, title: 'Culinary Legend', emoji: '⭐' };
  }, [totalPoints]);
  
  return {
    // Data
    userStats,
    achievements,
    totalPoints,
    progressRings,
    recentAchievements,
    unlockedAchievements,
    lockedAchievements,
    nextAchievement,
    completionPercentage,
    userLevel,
    
    // Functions
    getAchievementsByCategory,
    
    // Loading state
    isLoading: !profile || !userStats,
  };
};