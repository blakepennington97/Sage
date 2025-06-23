// Centralized meal plan store - Single Source of Truth

import { QueryClient } from '@tanstack/react-query';
import { 
  MealPlan, 
  mealPlanQueryKeys,
  MealSlotUpdate,
  MealSlotBatchUpdate 
} from './types';
import { MealPlanDataLayer } from './dataLayer';
import { MealPlanMutationManager } from './mutationManager';

/**
 * Centralized store for all meal plan operations
 * Acts as the single source of truth for meal plan data
 */
export class MealPlanStore {
  private mutationManager: MealPlanMutationManager;

  constructor(private queryClient: QueryClient) {
    this.mutationManager = new MealPlanMutationManager(queryClient);
  }

  /**
   * Get meal plan for specific week
   */
  getMealPlan(userId: string, weekStartDate: string): MealPlan | undefined {
    const queryKey = mealPlanQueryKeys.byWeek(userId, weekStartDate);
    return this.queryClient.getQueryData<MealPlan>(queryKey);
  }

  /**
   * Get all meal plans for user
   */
  getAllMealPlans(userId: string): MealPlan[] | undefined {
    const queryKey = mealPlanQueryKeys.byUser(userId);
    return this.queryClient.getQueryData<MealPlan[]>(queryKey);
  }

  /**
   * Create or get meal plan for week
   */
  async ensureMealPlan(userId: string, weekStartDate: string): Promise<MealPlan> {
    // Check cache first
    const existingPlan = this.getMealPlan(userId, weekStartDate);
    if (existingPlan) {
      return existingPlan;
    }

    // Try to fetch from database
    try {
      const fetchedPlan = await MealPlanDataLayer.getMealPlanByWeek(userId, weekStartDate);
      if (fetchedPlan) {
        // Update cache
        const queryKey = mealPlanQueryKeys.byWeek(userId, weekStartDate);
        this.queryClient.setQueryData(queryKey, fetchedPlan);
        return fetchedPlan;
      }
    } catch (error) {
      console.warn('Failed to fetch meal plan, creating new one:', error);
    }

    // Create new meal plan if none exists
    return this.mutationManager.createMealPlan(userId, weekStartDate);
  }

  /**
   * Update single meal slot
   */
  async updateMealSlot(
    planId: string,
    userId: string,
    weekStartDate: string,
    update: Omit<MealSlotUpdate, 'userId' | 'weekStartDate'>
  ): Promise<MealPlan> {
    return this.mutationManager.updateMealSlot(planId, {
      ...update,
      userId,
      weekStartDate
    });
  }

  /**
   * Update multiple meal slots in batch
   */
  async batchUpdateMealSlots(
    planId: string,
    userId: string,
    weekStartDate: string,
    updates: Omit<MealSlotUpdate, 'userId' | 'weekStartDate'>[],
    version: number
  ): Promise<MealPlan> {
    return this.mutationManager.batchUpdateMealSlots(planId, {
      updates: updates.map(update => ({
        ...update,
        userId,
        weekStartDate
      })),
      version,
      userId,
      weekStartDate
    });
  }

  /**
   * Delete meal plan
   */
  async deleteMealPlan(planId: string, userId: string): Promise<void> {
    return this.mutationManager.deleteMealPlan(planId, userId);
  }

  /**
   * Refresh meal plan from server
   */
  async refreshMealPlan(userId: string, weekStartDate: string): Promise<MealPlan | null> {
    const queryKey = mealPlanQueryKeys.byWeek(userId, weekStartDate);
    
    // Only refresh if no pending mutations
    if (this.mutationManager.hasPendingMutations(queryKey)) {
      console.warn('Skipping refresh - pending mutations exist');
      return this.getMealPlan(userId, weekStartDate) || null;
    }

    try {
      const freshPlan = await MealPlanDataLayer.getMealPlanByWeek(userId, weekStartDate);
      
      if (freshPlan) {
        // Update cache with fresh data
        this.queryClient.setQueryData(queryKey, freshPlan);
      } else {
        // Remove from cache if doesn't exist on server
        this.queryClient.removeQueries({ queryKey });
      }
      
      return freshPlan;
    } catch (error) {
      console.error('Failed to refresh meal plan:', error);
      throw error;
    }
  }

  /**
   * Invalidate and refetch meal plans
   */
  async invalidateMealPlans(userId: string): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey: mealPlanQueryKeys.byUser(userId)
    });
  }

  /**
   * Get macro totals for meal plan
   */
  getMacroTotals(userId: string, weekStartDate: string): {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  } | null {
    const mealPlan = this.getMealPlan(userId, weekStartDate);
    if (!mealPlan) {
      return null;
    }

    return MealPlanDataLayer.calculateMacroTotals(mealPlan);
  }

  /**
   * Get macro totals for a specific day
   */
  getDayMacroTotals(
    userId: string, 
    weekStartDate: string, 
    dayIndex: number
  ): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null {
    const mealPlan = this.getMealPlan(userId, weekStartDate);
    if (!mealPlan || !mealPlan.days[dayIndex]) {
      return null;
    }

    const day = mealPlan.days[dayIndex];
    const { meals } = day;
    
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    // Add breakfast macros
    if (meals.breakfast) {
      calories += meals.breakfast.calories || 0;
      protein += meals.breakfast.protein || 0;
      carbs += meals.breakfast.carbs || 0;
      fat += meals.breakfast.fat || 0;
    }

    // Add lunch macros
    if (meals.lunch) {
      calories += meals.lunch.calories || 0;
      protein += meals.lunch.protein || 0;
      carbs += meals.lunch.carbs || 0;
      fat += meals.lunch.fat || 0;
    }

    // Add dinner macros
    if (meals.dinner) {
      calories += meals.dinner.calories || 0;
      protein += meals.dinner.protein || 0;
      carbs += meals.dinner.carbs || 0;
      fat += meals.dinner.fat || 0;
    }

    // Add snacks macros
    meals.snacks?.forEach(snack => {
      calories += snack.calories || 0;
      protein += snack.protein || 0;
      carbs += snack.carbs || 0;
      fat += snack.fat || 0;
    });

    return { calories, protein, carbs, fat };
  }

  /**
   * Check if meal plan has pending changes
   */
  hasPendingChanges(userId: string, weekStartDate: string): boolean {
    const queryKey = mealPlanQueryKeys.byWeek(userId, weekStartDate);
    return this.mutationManager.hasPendingMutations(queryKey);
  }

  /**
   * Get pending mutations for debugging
   */
  getPendingMutations() {
    return this.mutationManager.getPendingMutations();
  }

  /**
   * Clear all cached meal plan data (use with caution)
   */
  clearCache(): void {
    this.queryClient.removeQueries({
      queryKey: mealPlanQueryKeys.all
    });
  }

  /**
   * Preload meal plan for better performance
   */
  async preloadMealPlan(userId: string, weekStartDate: string): Promise<void> {
    const queryKey = mealPlanQueryKeys.byWeek(userId, weekStartDate);
    
    // Only preload if not already cached
    if (!this.queryClient.getQueryData(queryKey)) {
      try {
        const mealPlan = await MealPlanDataLayer.getMealPlanByWeek(userId, weekStartDate);
        if (mealPlan) {
          this.queryClient.setQueryData(queryKey, mealPlan);
        }
      } catch (error) {
        console.warn('Failed to preload meal plan:', error);
      }
    }
  }

  /**
   * Subscribe to meal plan changes
   */
  subscribeMealPlan(
    userId: string, 
    weekStartDate: string, 
    callback: (mealPlan: MealPlan | undefined) => void
  ): () => void {
    const queryKey = mealPlanQueryKeys.byWeek(userId, weekStartDate);
    
    // Get initial data
    const initialData = this.getMealPlan(userId, weekStartDate);
    callback(initialData);

    // Subscribe to cache changes
    const unsubscribe = this.queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && JSON.stringify(event.query.queryKey) === JSON.stringify(queryKey)) {
        callback(event.query.state.data as MealPlan | undefined);
      }
    });

    return unsubscribe;
  }
}