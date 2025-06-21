import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MealTrackingService, MealEntry, DailyMacroProgress } from "../services/mealTracking";
import { FoodMacros } from "../services/ai/gemini";

export const useMealTracking = () => {
  const queryClient = useQueryClient();

  // Add meal entry mutation
  const addMealEntryMutation = useMutation({
    mutationFn: async (data: {
      food: FoodMacros;
      quantity: number;
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
      date: string;
    }) => {
      const entryData = MealTrackingService.createMealEntryFromFood(
        data.food,
        data.quantity,
        data.mealType,
        data.date
      );
      return await MealTrackingService.addMealEntry(entryData);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['meal-entries', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['daily-macro-progress', variables.date] });
    },
  });

  // Update meal entry mutation
  const updateMealEntryMutation = useMutation({
    mutationFn: async (data: {
      entryId: string;
      updates: Partial<MealEntry>;
      date: string;
    }) => {
      return await MealTrackingService.updateMealEntry(data.entryId, data.updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meal-entries', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['daily-macro-progress', variables.date] });
    },
  });

  // Delete meal entry mutation
  const deleteMealEntryMutation = useMutation({
    mutationFn: async (data: { entryId: string; date: string }) => {
      return await MealTrackingService.deleteMealEntry(data.entryId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meal-entries', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['daily-macro-progress', variables.date] });
    },
  });

  // Helper functions
  const addMealEntry = async (
    food: FoodMacros,
    quantity: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    date: string
  ) => {
    return await addMealEntryMutation.mutateAsync({
      food,
      quantity,
      mealType,
      date,
    });
  };

  const updateMealEntry = async (
    entryId: string,
    updates: Partial<MealEntry>,
    date: string
  ) => {
    return await updateMealEntryMutation.mutateAsync({
      entryId,
      updates,
      date,
    });
  };

  const deleteMealEntry = async (entryId: string, date: string) => {
    return await deleteMealEntryMutation.mutateAsync({
      entryId,
      date,
    });
  };

  return {
    addMealEntry,
    updateMealEntry,
    deleteMealEntry,
    isLoading: 
      addMealEntryMutation.isPending ||
      updateMealEntryMutation.isPending ||
      deleteMealEntryMutation.isPending,
  };
};

// Hook for fetching meal entries for a specific day
export const useMealEntriesForDay = (date: string) => {
  return useQuery({
    queryKey: ['meal-entries', date],
    queryFn: () => MealTrackingService.getMealEntriesForDay(date),
    enabled: !!date,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching daily macro progress
export const useDailyMacroProgress = (date: string) => {
  return useQuery({
    queryKey: ['daily-macro-progress', date],
    queryFn: () => MealTrackingService.getDailyMacroProgress(date),
    enabled: !!date,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching meal entries for a date range
export const useMealEntriesForRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['meal-entries-range', startDate, endDate],
    queryFn: () => MealTrackingService.getMealEntriesForDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 10, // 10 minutes for range queries
  });
};