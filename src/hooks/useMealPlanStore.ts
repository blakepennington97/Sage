// React hook for accessing the centralized meal plan store

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MealPlanStore, MealPlan, MealSlotUpdate } from '../services/mealPlan';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook providing centralized access to meal plan store
 */
export const useMealPlanStore = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Create store instance (memoized to prevent recreation)
  const store = useMemo(() => new MealPlanStore(queryClient), [queryClient]);

  return store;
};

/**
 * Hook for specific week meal plan with real-time updates
 */
export const useMealPlan = (weekStartDate: string) => {
  const store = useMealPlanStore();
  const { user } = useAuthStore();
  const [mealPlan, setMealPlan] = useState<MealPlan | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setMealPlan(undefined);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Subscribe to meal plan changes
    const unsubscribe = store.subscribeMealPlan(
      user.id, 
      weekStartDate, 
      (updatedPlan) => {
        if (isMounted) {
          setMealPlan(updatedPlan);
          setIsLoading(false);
        }
      }
    );

    // Ensure meal plan exists
    store.ensureMealPlan(user.id, weekStartDate)
      .then((plan) => {
        if (isMounted) {
          setMealPlan(plan);
          setIsLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [store, user?.id, weekStartDate]);

  // Actions
  const actions = useMemo(() => ({
    updateMealSlot: async (update: Omit<MealSlotUpdate, 'userId' | 'weekStartDate'>) => {
      if (!user?.id || !mealPlan) return;
      
      try {
        await store.updateMealSlot(mealPlan.id, user.id, weekStartDate, update);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },

    batchUpdateMealSlots: async (updates: Omit<MealSlotUpdate, 'userId' | 'weekStartDate'>[]) => {
      if (!user?.id || !mealPlan) return;
      
      try {
        await store.batchUpdateMealSlots(mealPlan.id, user.id, weekStartDate, updates, mealPlan.version);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },

    refreshMealPlan: async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const freshPlan = await store.refreshMealPlan(user.id, weekStartDate);
        setMealPlan(freshPlan || undefined);
        setError(null);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },

    deleteMealPlan: async () => {
      if (!user?.id || !mealPlan) return;
      
      try {
        await store.deleteMealPlan(mealPlan.id, user.id);
        setMealPlan(undefined);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    }
  }), [store, user?.id, weekStartDate, mealPlan]);

  // Computed values
  const macroTotals = useMemo(() => {
    if (!user?.id || !mealPlan) return null;
    return store.getMacroTotals(user.id, weekStartDate);
  }, [store, user?.id, weekStartDate, mealPlan]);

  const hasPendingChanges = useMemo(() => {
    if (!user?.id) return false;
    return store.hasPendingChanges(user.id, weekStartDate);
  }, [store, user?.id, weekStartDate, mealPlan]);

  return {
    mealPlan,
    isLoading,
    error,
    macroTotals,
    hasPendingChanges,
    actions
  };
};

/**
 * Hook for day-specific macro calculations
 */
export const useDayMacros = (weekStartDate: string, dayIndex: number) => {
  const store = useMealPlanStore();
  const { user } = useAuthStore();
  const [macros, setMacros] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setMacros(null);
      return;
    }

    // Subscribe to meal plan changes for this specific day
    const unsubscribe = store.subscribeMealPlan(
      user.id,
      weekStartDate,
      () => {
        const dayMacros = store.getDayMacroTotals(user.id!, weekStartDate, dayIndex);
        setMacros(dayMacros);
      }
    );

    return unsubscribe;
  }, [store, user?.id, weekStartDate, dayIndex]);

  return macros;
};

/**
 * Hook for all user meal plans
 */
export const useAllMealPlans = () => {
  const store = useMealPlanStore();
  const { user } = useAuthStore();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setMealPlans([]);
      setIsLoading(false);
      return;
    }

    // Get cached data first
    const cachedPlans = store.getAllMealPlans(user.id);
    if (cachedPlans) {
      setMealPlans(cachedPlans);
    }

    // Invalidate and refresh
    store.invalidateMealPlans(user.id)
      .then(() => {
        const freshPlans = store.getAllMealPlans(user.id!) || [];
        setMealPlans(freshPlans);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [store, user?.id]);

  return {
    mealPlans,
    isLoading,
    error
  };
};