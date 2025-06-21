/**
 * Usage Tracking Hook
 * 
 * React hook for managing subscription limits and usage tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usageTrackingService, UsageData, ActionType } from '../services/usageTracking';
import { isFeatureEnabled } from '../config/features';

export interface UseUsageTrackingReturn {
  // Data
  usageData: UsageData | null;
  isPremium: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  canPerformAction: (actionType: ActionType) => boolean;
  incrementUsage: (actionType: ActionType) => Promise<boolean>;
  getRemainingUsage: (actionType: ActionType) => number;
  getUsageDisplayText: (actionType: ActionType) => string;
  refreshUsage: () => void;
  
  // Premium helpers
  isPremiumExpiringSoon: boolean;
  premiumExpiryText: string;
  daysUntilExpiry: number | null;
}

export function useUsageTracking(): UseUsageTrackingReturn {
  const queryClient = useQueryClient();
  
  // If usage tracking is disabled, return unlimited access
  const isUsageTrackingEnabled = isFeatureEnabled('usageTracking');
  
  // Query for usage data
  const {
    data: usageData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['usage-tracking'],
    queryFn: () => usageTrackingService.getUserUsageSummary(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: isUsageTrackingEnabled, // Only run if feature is enabled
  });

  // Mutation for incrementing usage
  const incrementUsageMutation = useMutation({
    mutationFn: (actionType: ActionType) => 
      usageTrackingService.incrementUsageCounter(actionType),
    onSuccess: () => {
      // Invalidate and refetch usage data
      queryClient.invalidateQueries({ queryKey: ['usage-tracking'] });
    },
  });

  // Computed values
  const isPremium = usageData?.is_premium && (
    !usageData.premium_until || 
    new Date(usageData.premium_until) > new Date()
  ) || false;

  const isPremiumExpiringSoon = usageData?.premium_until ? 
    usageTrackingService.getDaysUntilPremiumExpiry(usageData.premium_until) !== null &&
    usageTrackingService.getDaysUntilPremiumExpiry(usageData.premium_until)! <= 7 : false;

  const premiumExpiryText = usageData?.premium_until ? 
    usageTrackingService.formatPremiumExpiry(usageData.premium_until) : '';

  const daysUntilExpiry = usageData?.premium_until ? 
    usageTrackingService.getDaysUntilPremiumExpiry(usageData.premium_until) : null;

  // Helper functions
  const canPerformAction = useCallback((actionType: ActionType): boolean => {
    // If usage tracking is disabled, always allow
    if (!isUsageTrackingEnabled) return true;
    
    if (!usageData) return false;
    
    if (isPremium) return true;
    
    const actionData = actionType === 'recipe_generation' 
      ? usageData.recipe_generations 
      : usageData.grocery_lists;
    
    return actionData.can_use;
  }, [usageData, isPremium, isUsageTrackingEnabled]);

  const getRemainingUsage = useCallback((actionType: ActionType): number => {
    // If usage tracking is disabled, return unlimited
    if (!isUsageTrackingEnabled) return Infinity;
    
    if (!usageData) return 0;
    
    if (isPremium) return Infinity;
    
    const actionData = actionType === 'recipe_generation' 
      ? usageData.recipe_generations 
      : usageData.grocery_lists;
    
    return actionData.remaining;
  }, [usageData, isPremium, isUsageTrackingEnabled]);

  const getUsageDisplayText = useCallback((actionType: ActionType): string => {
    // If usage tracking is disabled, show unlimited
    if (!isUsageTrackingEnabled) return 'Unlimited';
    
    if (!usageData) return '';
    
    if (isPremium) return 'Unlimited';
    
    const actionData = actionType === 'recipe_generation' 
      ? usageData.recipe_generations 
      : usageData.grocery_lists;
    
    return `${actionData.remaining} left this week`;
  }, [usageData, isPremium, isUsageTrackingEnabled]);

  const incrementUsage = useCallback(async (actionType: ActionType): Promise<boolean> => {
    // If usage tracking is disabled, always allow
    if (!isUsageTrackingEnabled) return true;
    
    if (!canPerformAction(actionType)) {
      return false;
    }
    
    try {
      const result = await incrementUsageMutation.mutateAsync(actionType);
      return result;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }, [canPerformAction, incrementUsageMutation, isUsageTrackingEnabled]);

  const refreshUsage = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // Data
    usageData: usageData || null,
    isPremium,
    isLoading,
    error: error as Error | null,
    
    // Actions
    canPerformAction,
    incrementUsage,
    getRemainingUsage,
    getUsageDisplayText,
    refreshUsage,
    
    // Premium helpers
    isPremiumExpiringSoon,
    premiumExpiryText,
    daysUntilExpiry,
  };
}

/**
 * Hook specifically for checking if an action can be performed
 * Useful for conditional rendering without subscribing to full usage data
 */
export function useCanPerformAction(actionType: ActionType) {
  const { canPerformAction, isLoading } = useUsageTracking();
  
  return {
    canPerform: canPerformAction(actionType),
    isLoading,
  };
}

/**
 * Hook for getting usage display text
 * Useful for showing remaining usage in UI components
 */
export function useUsageDisplay(actionType: ActionType) {
  const { getUsageDisplayText, getRemainingUsage, isPremium, isLoading } = useUsageTracking();
  
  return {
    displayText: getUsageDisplayText(actionType),
    remaining: getRemainingUsage(actionType),
    isPremium,
    isLoading,
  };
}