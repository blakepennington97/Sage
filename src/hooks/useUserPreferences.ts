import { useCallback, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { UserPreferencesService } from "../services/supabase";
import { 
  UserPreferences, 
  createDefaultPreferences, 
  validatePreferences,
  migratePreferences 
} from "../types/userPreferences";

export const useUserPreferences = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Query for fetching user preferences
  const {
    data: preferencesRecord,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      return await UserPreferencesService.getPreferences(user.id);
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Parse preferences from the record
  const preferences: UserPreferences | null = preferencesRecord 
    ? migratePreferences(
        preferencesRecord.preferences_data, 
        preferencesRecord.version, 
        '1.0'
      )
    : null;

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const currentPrefs = preferences || createDefaultPreferences();
      const updatedPrefs: UserPreferences = {
        ...currentPrefs,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      if (!validatePreferences(updatedPrefs)) {
        throw new Error("Invalid preferences data");
      }

      return await UserPreferencesService.updatePreferences(
        user.id,
        updatedPrefs,
        '1.0'
      );
    },
    onSuccess: () => {
      // Invalidate and refetch preferences
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.id] });
    },
    onError: (error) => {
      console.error("Failed to update preferences:", error);
    },
  });

  // Helper functions for specific preference updates
  const updateDietaryPreferences = useCallback(
    async (dietary: Partial<UserPreferences['dietary']>) => {
      const currentPrefs = preferences || createDefaultPreferences();
      return await updatePreferencesMutation.mutateAsync({
        dietary: { ...currentPrefs.dietary, ...dietary }
      });
    },
    [preferences, updatePreferencesMutation]
  );

  const updateCookingContext = useCallback(
    async (cookingContext: Partial<UserPreferences['cookingContext']>) => {
      const currentPrefs = preferences || createDefaultPreferences();
      return await updatePreferencesMutation.mutateAsync({
        cookingContext: { ...currentPrefs.cookingContext, ...cookingContext }
      });
    },
    [preferences, updatePreferencesMutation]
  );

  const updateKitchenCapabilities = useCallback(
    async (kitchenCapabilities: Partial<UserPreferences['kitchenCapabilities']>) => {
      const currentPrefs = preferences || createDefaultPreferences();
      return await updatePreferencesMutation.mutateAsync({
        kitchenCapabilities: { ...currentPrefs.kitchenCapabilities, ...kitchenCapabilities }
      });
    },
    [preferences, updatePreferencesMutation]
  );

  const updateCookingStyles = useCallback(
    async (cookingStyles: Partial<UserPreferences['cookingStyles']>) => {
      const currentPrefs = preferences || createDefaultPreferences();
      return await updatePreferencesMutation.mutateAsync({
        cookingStyles: { ...currentPrefs.cookingStyles, ...cookingStyles }
      });
    },
    [preferences, updatePreferencesMutation]
  );

  // Initialize preferences for new users
  const initializePreferences = useCallback(
    async () => {
      if (!user || preferences) return preferences;
      
      const defaultPrefs = createDefaultPreferences();
      await updatePreferencesMutation.mutateAsync(defaultPrefs);
      return defaultPrefs;
    },
    [user, preferences, updatePreferencesMutation]
  );

  // Complete preference setup
  const completePreferenceSetup = useCallback(
    async () => {
      const currentPrefs = preferences || createDefaultPreferences();
      return await updatePreferencesMutation.mutateAsync({
        setupCompleted: true
      });
    },
    [preferences, updatePreferencesMutation]
  );

  // Reset specific preference category
  const resetPreferenceCategory = useCallback(
    async (category: keyof UserPreferences) => {
      if (category === 'version' || category === 'lastUpdated' || category === 'setupCompleted') {
        throw new Error("Cannot reset metadata fields");
      }

      const defaultPrefs = createDefaultPreferences();
      const resetUpdate = { [category]: defaultPrefs[category] };
      
      return await updatePreferencesMutation.mutateAsync(resetUpdate);
    },
    [updatePreferencesMutation]
  );

  return {
    preferences,
    isLoading,
    error,
    isUpdating: updatePreferencesMutation.isPending,
    
    // Update functions
    updatePreferences: updatePreferencesMutation.mutateAsync,
    updateDietaryPreferences,
    updateCookingContext,
    updateKitchenCapabilities,
    updateCookingStyles,
    
    // Utility functions
    initializePreferences,
    completePreferenceSetup,
    resetPreferenceCategory,
    
    // Status checks
    hasPreferences: !!preferences,
    isSetupComplete: preferences?.setupCompleted || false,
  };
};