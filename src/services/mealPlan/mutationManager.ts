// Centralized mutation management with optimistic updates and conflict resolution

import { QueryClient } from '@tanstack/react-query';
import { 
  MealPlan, 
  MealSlotUpdate, 
  MealSlotBatchUpdate,
  mealPlanQueryKeys,
  MealPlanConflictError 
} from './types';
import { MealPlanDataLayer } from './dataLayer';

interface OptimisticUpdateContext {
  queryKey: readonly string[];
  previousData: MealPlan | undefined;
  mutationId: string;
  timestamp: number;
}

/**
 * Centralized mutation manager for meal plan operations
 */
export class MealPlanMutationManager {
  private pendingMutations = new Map<string, OptimisticUpdateContext>();
  private mutationQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor(private queryClient: QueryClient) {}

  /**
   * Update a single meal slot with optimistic updates
   */
  async updateMealSlot(
    planId: string,
    update: MealSlotUpdate
  ): Promise<MealPlan> {
    const mutationId = this.generateMutationId();
    const queryKey = mealPlanQueryKeys.byWeek(update.userId || '', update.weekStartDate || '');

    try {
      // Get current data for optimistic update
      const currentData = this.queryClient.getQueryData<MealPlan>(queryKey);
      if (!currentData) {
        throw new Error('No meal plan data found for optimistic update');
      }

      // Apply optimistic update
      const optimisticData = this.applySlotUpdate(currentData, update);
      const context: OptimisticUpdateContext = {
        queryKey,
        previousData: currentData,
        mutationId,
        timestamp: Date.now()
      };

      // Store pending mutation
      this.pendingMutations.set(mutationId, context);

      // Update cache optimistically
      this.queryClient.setQueryData(queryKey, optimisticData);

      // Queue the actual mutation
      return this.enqueueMutation(async () => {
        try {
          const updatedPlan = await MealPlanDataLayer.updateMealPlan({
            id: planId,
            days: optimisticData.days,
            version: optimisticData.version
          });

          // Update cache with server response
          this.queryClient.setQueryData(queryKey, updatedPlan);
          
          // Remove from pending mutations
          this.pendingMutations.delete(mutationId);

          return updatedPlan;
        } catch (error) {
          // Handle conflicts and rollback
          await this.handleMutationError(error, context);
          throw error;
        }
      });

    } catch (error) {
      // Rollback optimistic update on immediate error
      if (this.pendingMutations.has(mutationId)) {
        const context = this.pendingMutations.get(mutationId)!;
        this.queryClient.setQueryData(context.queryKey, context.previousData);
        this.pendingMutations.delete(mutationId);
      }
      throw error;
    }
  }

  /**
   * Update multiple meal slots in batch with optimistic updates
   */
  async batchUpdateMealSlots(
    planId: string,
    batchUpdate: MealSlotBatchUpdate
  ): Promise<MealPlan> {
    const mutationId = this.generateMutationId();
    const queryKey = mealPlanQueryKeys.byWeek(batchUpdate.userId || '', batchUpdate.weekStartDate || '');

    try {
      // Get current data for optimistic update
      const currentData = this.queryClient.getQueryData<MealPlan>(queryKey);
      if (!currentData) {
        throw new Error('No meal plan data found for batch optimistic update');
      }

      // Apply all optimistic updates
      let optimisticData = { ...currentData };
      for (const update of batchUpdate.updates) {
        optimisticData = this.applySlotUpdate(optimisticData, update);
      }

      const context: OptimisticUpdateContext = {
        queryKey,
        previousData: currentData,
        mutationId,
        timestamp: Date.now()
      };

      // Store pending mutation
      this.pendingMutations.set(mutationId, context);

      // Update cache optimistically
      this.queryClient.setQueryData(queryKey, optimisticData);

      // Queue the actual mutation
      return this.enqueueMutation(async () => {
        try {
          const updatedPlan = await MealPlanDataLayer.updateMealPlan({
            id: planId,
            days: optimisticData.days,
            version: batchUpdate.version
          });

          // Update cache with server response
          this.queryClient.setQueryData(queryKey, updatedPlan);
          
          // Remove from pending mutations
          this.pendingMutations.delete(mutationId);

          return updatedPlan;
        } catch (error) {
          // Handle conflicts and rollback
          await this.handleMutationError(error, context);
          throw error;
        }
      });

    } catch (error) {
      // Rollback optimistic update on immediate error
      if (this.pendingMutations.has(mutationId)) {
        const context = this.pendingMutations.get(mutationId)!;
        this.queryClient.setQueryData(context.queryKey, context.previousData);
        this.pendingMutations.delete(mutationId);
      }
      throw error;
    }
  }

  /**
   * Create new meal plan
   */
  async createMealPlan(
    userId: string,
    weekStartDate: string
  ): Promise<MealPlan> {
    const queryKey = mealPlanQueryKeys.byWeek(userId, weekStartDate);
    
    return this.enqueueMutation(async () => {
      const newPlan = await MealPlanDataLayer.createMealPlan({
        userId,
        weekStartDate
      });

      // Update cache
      this.queryClient.setQueryData(queryKey, newPlan);
      
      // Invalidate related queries
      this.queryClient.invalidateQueries({ 
        queryKey: mealPlanQueryKeys.byUser(userId) 
      });

      return newPlan;
    });
  }

  /**
   * Delete meal plan
   */
  async deleteMealPlan(planId: string, userId: string): Promise<void> {
    return this.enqueueMutation(async () => {
      await MealPlanDataLayer.deleteMealPlan(planId);
      
      // Invalidate all meal plan queries for user
      this.queryClient.invalidateQueries({ 
        queryKey: mealPlanQueryKeys.byUser(userId) 
      });
    });
  }

  /**
   * Apply a single slot update to meal plan data
   */
  private applySlotUpdate(mealPlan: MealPlan, update: MealSlotUpdate): MealPlan {
    const updatedPlan = JSON.parse(JSON.stringify(mealPlan)); // Deep clone
    const day = updatedPlan.days[update.dayIndex];
    
    if (!day) {
      throw new Error(`Invalid day index: ${update.dayIndex}`);
    }

    if (update.mealType === 'snacks') {
      // Handle snacks array
      if (!day.meals.snacks) {
        day.meals.snacks = [];
      }
      
      if (update.slotIndex !== undefined) {
        if (update.slot === null) {
          // Remove snack
          day.meals.snacks.splice(update.slotIndex, 1);
        } else {
          // Update existing snack
          day.meals.snacks[update.slotIndex] = {
            ...day.meals.snacks[update.slotIndex],
            ...update.slot
          };
        }
      } else {
        // Add new snack
        day.meals.snacks.push({
          id: `snack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...update.slot
        });
      }
    } else {
      // Handle single meal slots
      if (update.slot === null) {
        // Remove meal
        day.meals[update.mealType] = undefined;
      } else {
        // Update meal
        day.meals[update.mealType] = {
          ...day.meals[update.mealType],
          ...update.slot
        };
      }
    }

    return updatedPlan;
  }

  /**
   * Queue mutations to prevent race conditions
   */
  private async enqueueMutation<T>(mutation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.mutationQueue.push(async () => {
        try {
          const result = await mutation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process mutation queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.mutationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.mutationQueue.length > 0) {
      const mutation = this.mutationQueue.shift()!;
      try {
        await mutation();
      } catch (error) {
        console.error('Mutation failed in queue:', error);
        // Continue processing other mutations
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Handle mutation errors and conflicts
   */
  private async handleMutationError(
    error: any, 
    context: OptimisticUpdateContext
  ): Promise<void> {
    if (error.name === 'MealPlanConflictError') {
      const conflictError = error as MealPlanConflictError;
      
      // Show conflict resolution UI or merge changes automatically
      console.warn('Meal plan conflict detected:', {
        expected: conflictError.expectedVersion,
        current: conflictError.currentVersion,
        changes: conflictError.conflictingChanges
      });

      // For now, update cache with server version and invalidate
      this.queryClient.setQueryData(context.queryKey, conflictError.conflictingChanges);
      this.queryClient.invalidateQueries({ queryKey: context.queryKey });
    } else {
      // Other errors - rollback and invalidate
      this.queryClient.setQueryData(context.queryKey, context.previousData);
      this.queryClient.invalidateQueries({ queryKey: context.queryKey });
    }

    // Remove from pending mutations
    this.pendingMutations.delete(context.mutationId);
  }

  /**
   * Generate unique mutation ID
   */
  private generateMutationId(): string {
    return `mutation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get pending mutations for debugging
   */
  getPendingMutations(): Map<string, OptimisticUpdateContext> {
    return new Map(this.pendingMutations);
  }

  /**
   * Clear all pending mutations (use with caution)
   */
  clearPendingMutations(): void {
    this.pendingMutations.clear();
  }

  /**
   * Check if there are any pending mutations for a query
   */
  hasPendingMutations(queryKey: readonly string[]): boolean {
    const keyString = JSON.stringify(queryKey);
    for (const context of this.pendingMutations.values()) {
      if (JSON.stringify(context.queryKey) === keyString) {
        return true;
      }
    }
    return false;
  }
}