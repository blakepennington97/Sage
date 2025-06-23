import { useCallback } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MealPlanService } from "../services/mealPlanService";
import { supabase } from "../services/supabase";
import { WeeklyMealPlan, CreateMealPlanRequest, UpdateMealPlanRequest } from "../types/mealPlan";
import { useAuthStore } from "../stores/authStore";
import { ErrorHandler } from "../utils/errorHandling";

// Query Keys
const QUERY_KEYS = {
  mealPlans: (userId: string) => ['mealPlans', userId],
  activeMealPlan: (userId: string) => ['mealPlans', 'active', userId],
  mealPlanByWeek: (userId: string, weekStartDate: string) => ['mealPlans', 'week', userId, weekStartDate],
} as const;

export const useMealPlans = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch all meal plans
  const {
    data: mealPlans = [],
    isLoading: isLoadingMealPlans,
    error: mealPlansError,
    refetch: refetchMealPlans,
  } = useQuery({
    queryKey: QUERY_KEYS.mealPlans(user?.id || ''),
    queryFn: () => MealPlanService.getUserMealPlans(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes for meal plans
  });

  // Fetch active meal plan
  const {
    data: activeMealPlan,
    isLoading: isLoadingActiveMealPlan,
    error: activeMealPlanError,
    refetch: refetchActiveMealPlan,
  } = useQuery({
    queryKey: QUERY_KEYS.activeMealPlan(user?.id || ''),
    queryFn: () => MealPlanService.getActiveMealPlan(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create meal plan mutation
  const createMealPlanMutation = useMutation({
    mutationFn: async (request: CreateMealPlanRequest) => {
      if (!user) {
        throw new Error("User must be authenticated");
      }
      return MealPlanService.createMealPlan(user.id, request);
    },
    onSuccess: (newMealPlan) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        QUERY_KEYS.mealPlans(user!.id),
        (oldData: WeeklyMealPlan[] = []) => [newMealPlan, ...oldData]
      );
      
      // Update active meal plan cache
      queryClient.setQueryData(
        QUERY_KEYS.activeMealPlan(user!.id),
        newMealPlan
      );
    },
    onError: (error: any) => {
      ErrorHandler.handleError(error, "meal plan creation");
    },
  });

  // Update meal plan mutation (add/remove recipes)
  const updateMealPlanMutation = useMutation({
    mutationFn: (request: UpdateMealPlanRequest) => MealPlanService.updateMealPlan(request),
    onMutate: async (request: UpdateMealPlanRequest) => {
      // Cancel any outgoing refetches for all relevant cache keys
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.mealPlans(user!.id) });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.activeMealPlan(user!.id) });
      
      // Cancel queries for specific week plans (we'll update all week queries that exist)
      await queryClient.cancelQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'mealPlans' && 
          query.queryKey[1] === 'week' && 
          query.queryKey[2] === user!.id 
      });

      // Snapshot the previous values
      const previousMealPlans = queryClient.getQueryData(QUERY_KEYS.mealPlans(user!.id));
      const previousActiveMealPlan = queryClient.getQueryData(QUERY_KEYS.activeMealPlan(user!.id));
      
      // Get all existing week-based meal plan queries to update them
      const allWeekQueries = queryClient.getQueriesData({
        predicate: (query) => 
          query.queryKey[0] === 'mealPlans' && 
          query.queryKey[1] === 'week' && 
          query.queryKey[2] === user!.id
      });

      // Optimistically update both meal plans list and active meal plan
      queryClient.setQueryData(
        QUERY_KEYS.mealPlans(user!.id),
        (oldData: WeeklyMealPlan[] = []) =>
          oldData.map((plan) => {
            if (plan.id !== request.meal_plan_id) return plan;
            
            // Update the specific day
            const updatedDays = plan.days.map((day: any) => {
              if (day.date !== request.date) return day;
              
              const updatedDay = { ...day };
              
              if (request.recipe_id) {
                // Add/update recipe for the meal type
                if (request.meal_type === 'snacks') {
                  updatedDay.snacks = updatedDay.snacks || [];
                  updatedDay.snacks.push({
                    id: `${request.meal_plan_id}-${request.date}-${request.meal_type}-${Date.now()}`,
                    recipe_id: request.recipe_id,
                    servings: request.servings || 1
                  });
                } else {
                  updatedDay[request.meal_type] = {
                    id: `${request.meal_plan_id}-${request.date}-${request.meal_type}`,
                    recipe_id: request.recipe_id,
                    servings: request.servings || 1
                  };
                }
              } else {
                // Remove recipe
                if (request.meal_type === 'snacks') {
                  updatedDay.snacks = [];
                } else {
                  delete updatedDay[request.meal_type];
                }
              }
              
              return updatedDay;
            });

            return { ...plan, days: updatedDays, updated_at: new Date().toISOString() };
          })
      );

      // Update active meal plan if it's the one being modified
      const currentActiveMealPlan = queryClient.getQueryData(QUERY_KEYS.activeMealPlan(user!.id)) as WeeklyMealPlan;
      if (currentActiveMealPlan && currentActiveMealPlan.id === request.meal_plan_id) {
        const updatedActivePlan = { ...currentActiveMealPlan };
        updatedActivePlan.days = updatedActivePlan.days.map((day: any) => {
          if (day.date !== request.date) return day;
          
          const updatedDay = { ...day };
          
          if (request.recipe_id) {
            if (request.meal_type === 'snacks') {
              updatedDay.snacks = updatedDay.snacks || [];
              updatedDay.snacks.push({
                id: `${request.meal_plan_id}-${request.date}-${request.meal_type}-${Date.now()}`,
                recipe_id: request.recipe_id,
                servings: request.servings || 1
              });
            } else {
              updatedDay[request.meal_type] = {
                id: `${request.meal_plan_id}-${request.date}-${request.meal_type}`,
                recipe_id: request.recipe_id,
                servings: request.servings || 1
              };
            }
          } else {
            if (request.meal_type === 'snacks') {
              updatedDay.snacks = [];
            } else {
              delete updatedDay[request.meal_type];
            }
          }
          
          return updatedDay;
        });
        
        queryClient.setQueryData(QUERY_KEYS.activeMealPlan(user!.id), updatedActivePlan);
      }

      // Update all week-based meal plan queries that contain the meal plan being modified
      allWeekQueries.forEach(([queryKey, weekMealPlan]) => {
        if (weekMealPlan && (weekMealPlan as WeeklyMealPlan).id === request.meal_plan_id) {
          const updatedWeekPlan = { ...weekMealPlan as WeeklyMealPlan };
          updatedWeekPlan.days = updatedWeekPlan.days.map((day: any) => {
            if (day.date !== request.date) return day;
            
            const updatedDay = { ...day };
            
            if (request.recipe_id) {
              if (request.meal_type === 'snacks') {
                updatedDay.snacks = updatedDay.snacks || [];
                updatedDay.snacks.push({
                  id: `${request.meal_plan_id}-${request.date}-${request.meal_type}-${Date.now()}`,
                  recipe_id: request.recipe_id,
                  servings: request.servings || 1
                });
              } else {
                updatedDay[request.meal_type] = {
                  id: `${request.meal_plan_id}-${request.date}-${request.meal_type}`,
                  recipe_id: request.recipe_id,
                  servings: request.servings || 1
                };
              }
            } else {
              if (request.meal_type === 'snacks') {
                updatedDay.snacks = [];
              } else {
                delete updatedDay[request.meal_type];
              }
            }
            
            return updatedDay;
          });
          
          queryClient.setQueryData(queryKey, updatedWeekPlan);
        }
      });

      return { 
        previousMealPlans, 
        previousActiveMealPlan, 
        previousWeekQueries: allWeekQueries 
      };
    },
    onError: (err, variables, context) => {
      // Revert on error
      queryClient.setQueryData(QUERY_KEYS.mealPlans(user!.id), context?.previousMealPlans);
      queryClient.setQueryData(QUERY_KEYS.activeMealPlan(user!.id), context?.previousActiveMealPlan);
      
      // Revert week queries
      context?.previousWeekQueries?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
      
      ErrorHandler.handleError(err, "meal plan update");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mealPlans(user!.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeMealPlan(user!.id) });
      
      // Invalidate all week-based queries for this user
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'mealPlans' && 
          query.queryKey[1] === 'week' && 
          query.queryKey[2] === user!.id 
      });
    },
  });

  // Batch update meal plan mutation (for cloning multiple slots)
  const batchUpdateMealPlanMutation = useMutation({
    mutationFn: async (requests: UpdateMealPlanRequest[]) => {
      if (!user) {
        throw new Error("User must be authenticated");
      }
      if (requests.length === 0) {
        return null; // Nothing to update
      }

      console.log(`🔄 Batch update starting for ${requests.length} requests.`);

      // 1. Get the current meal plan state ONCE.
      const mealPlanId = requests[0].meal_plan_id;
      const { data: currentPlan, error: fetchError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', mealPlanId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch meal plan for batch update: ${fetchError.message}`);
      }

      // Parse the days field if it's a JSON string
      if (currentPlan.days && typeof currentPlan.days === 'string') {
        try {
          currentPlan.days = JSON.parse(currentPlan.days);
        } catch (parseError) {
          throw new Error(`Failed to parse meal plan days: ${parseError}`);
        }
      }

      // 2. Get all necessary recipe data in a single query.
      const recipeIds = [...new Set(requests.map(r => r.recipe_id).filter(Boolean))] as string[];
      const { data: recipes, error: recipeError } = await supabase
        .from('user_recipes')
        .select('*')
        .in('id', recipeIds);

      if (recipeError) {
        throw new Error(`Failed to fetch recipes for batch update: ${recipeError.message}`);
      }

      const recipesMap = new Map(recipes.map(r => [r.id, r]));

      // 3. Apply ALL changes in memory.
      const updatedDays = currentPlan.days.map((day: any) => {
        const requestsForDay = requests.filter(r => r.date === day.date);
        if (requestsForDay.length === 0) {
          return day;
        }

        const newDay = { ...day };
        for (const request of requestsForDay) {
          const recipeData = recipesMap.get(request.recipe_id!);
          if (recipeData) {
            const mealPlanRecipe = {
              id: `${request.meal_plan_id}-${request.date}-${request.meal_type}`,
              recipe_id: request.recipe_id,
              recipe_name: recipeData.recipe_name || 'Unknown Recipe',
              estimated_time: recipeData.estimated_time || '30 min',
              difficulty_level: recipeData.difficulty_level || 3,
              servings: request.servings || 1,
              recipe_content: recipeData.recipe_content,
              recipe_data: recipeData.recipe_data
            };
            newDay[request.meal_type] = mealPlanRecipe;
          }
        }
        return newDay;
      });

      // 4. Make a SINGLE update call with the final state.
      const { data: updatedPlan, error: updateError } = await supabase
        .from('meal_plans')
        .update({
          days: updatedDays,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mealPlanId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to apply batch update: ${updateError.message}`);
      }

      console.log(`✅ Batch update completed successfully for ${requests.length} requests`);
      return updatedPlan;
    },
    onSuccess: () => {
      console.log(`🔄 Batch update successful! Invalidating caches for user: ${user!.id}`);
      
      // Invalidate all meal plan caches to refetch fresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mealPlans(user!.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeMealPlan(user!.id) });
      
      // CRITICAL: Also invalidate all week-based queries for this user
      const weekQueries = queryClient.getQueriesData({
        predicate: (query) => 
          query.queryKey[0] === 'mealPlans' && 
          query.queryKey[1] === 'week' && 
          query.queryKey[2] === user!.id 
      });
      
      console.log(`📋 Found ${weekQueries.length} week-based queries to invalidate:`, weekQueries.map(([key]) => key));
      
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'mealPlans' && 
          query.queryKey[1] === 'week' && 
          query.queryKey[2] === user!.id 
      });
      
      console.log(`✨ All meal plan caches invalidated! UI should refresh with new data.`);
    },
    onError: (error: any) => {
      ErrorHandler.handleError(error, "batch meal plan update");
    },
  });

  // Delete meal plan mutation
  const deleteMealPlanMutation = useMutation({
    mutationFn: (mealPlanId: string) => MealPlanService.deleteMealPlan(mealPlanId),
    onMutate: async (mealPlanId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.mealPlans(user!.id) });

      // Snapshot the previous value
      const previousMealPlans = queryClient.getQueryData(QUERY_KEYS.mealPlans(user!.id));

      // Optimistically update
      queryClient.setQueryData(
        QUERY_KEYS.mealPlans(user!.id),
        (oldData: WeeklyMealPlan[] = []) => oldData.filter((plan) => plan.id !== mealPlanId)
      );

      // Clear active meal plan if it's the one being deleted
      const activePlan = queryClient.getQueryData(QUERY_KEYS.activeMealPlan(user!.id)) as WeeklyMealPlan;
      if (activePlan?.id === mealPlanId) {
        queryClient.setQueryData(QUERY_KEYS.activeMealPlan(user!.id), null);
      }

      return { previousMealPlans };
    },
    onError: (err, mealPlanId, context) => {
      // Revert on error
      queryClient.setQueryData(QUERY_KEYS.mealPlans(user!.id), context?.previousMealPlans);
      Alert.alert("Error", "Could not delete the meal plan. Please try again.");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mealPlans(user!.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeMealPlan(user!.id) });
    },
  });

  // Convenience functions
  const createMealPlan = useCallback(
    async (request: CreateMealPlanRequest) => {
      if (!user) {
        Alert.alert("Authentication Error", "You must be logged in to create a meal plan.");
        return null;
      }

      try {
        return await createMealPlanMutation.mutateAsync(request);
      } catch {
        return null;
      }
    },
    [user, createMealPlanMutation]
  );

  const updateMealPlan = useCallback(
    (request: UpdateMealPlanRequest) => {
      updateMealPlanMutation.mutate(request);
    },
    [updateMealPlanMutation]
  );

  const batchUpdateMealPlan = useCallback(
    async (requests: UpdateMealPlanRequest[]) => {
      if (!user) {
        Alert.alert("Authentication Error", "You must be logged in to update meal plans.");
        throw new Error("User not authenticated");
      }

      try {
        return await batchUpdateMealPlanMutation.mutateAsync(requests);
      } catch (error) {
        console.error("Batch update meal plan failed:", error);
        Alert.alert(
          "Update Failed", 
          "Failed to copy recipe to meal plan slots. Please try again."
        );
        throw error;
      }
    },
    [user, batchUpdateMealPlanMutation]
  );

  const deleteMealPlan = useCallback(
    (mealPlanId: string) => {
      deleteMealPlanMutation.mutate(mealPlanId);
    },
    [deleteMealPlanMutation]
  );

  const getMealPlanByWeek = useCallback(
    (weekStartDate: string) => {
      return queryClient.fetchQuery({
        queryKey: QUERY_KEYS.mealPlanByWeek(user?.id || '', weekStartDate),
        queryFn: () => MealPlanService.getMealPlanByWeek(user!.id, weekStartDate),
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    },
    [user, queryClient]
  );

  return {
    // Data
    mealPlans,
    activeMealPlan,
    
    // Loading states
    isLoading: isLoadingMealPlans || isLoadingActiveMealPlan,
    isLoadingMealPlans,
    isLoadingActiveMealPlan,
    isCreating: createMealPlanMutation.isPending,
    isUpdating: updateMealPlanMutation.isPending,
    isBatchUpdating: batchUpdateMealPlanMutation.isPending,
    isDeleting: deleteMealPlanMutation.isPending,
    
    // Error states
    error: mealPlansError?.message || activeMealPlanError?.message || null,
    
    // Actions
    createMealPlan,
    updateMealPlan,
    batchUpdateMealPlan,
    deleteMealPlan,
    getMealPlanByWeek,
    refetchMealPlans,
    refetchActiveMealPlan,
  };
};

// Utility function to get meal plan by week with caching
export const useMealPlanByWeek = (weekStartDate: string) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.mealPlanByWeek(user?.id || '', weekStartDate),
    queryFn: () => MealPlanService.getMealPlanByWeek(user!.id, weekStartDate),
    enabled: !!user && !!weekStartDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};