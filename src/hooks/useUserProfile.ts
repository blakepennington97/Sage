import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { ProfileService, UserProfile } from "../services/supabase";

export const useUserProfile = () => {
  const { user, setProfile, profile, isProfileLoading } = useAuthStore();
  const queryClient = useQueryClient();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<UserProfile, "id" | "email" | "created_at">>) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return await ProfileService.updateProfile(user.id, updates);
    },
    onSuccess: (updatedProfile) => {
      // Update Zustand store
      setProfile(updatedProfile);
      // Invalidate any profile-related queries if we add them later
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
    },
  });

  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, "id" | "email" | "created_at">>) => {
      return await updateProfileMutation.mutateAsync(updates);
    },
    [updateProfileMutation]
  );

  const completeSkillAssessment = async (data: {
    skillLevel: string;
    fears: string[];
    overallConfidence: number;
  }) => {
    return updateProfile({
      skill_level: data.skillLevel,
      cooking_fears: data.fears,
      confidence_level: data.overallConfidence,
    });
  };

  const completeDietaryRestrictions = async (data: {
    allergies: string[];
    dietaryRestrictions: string[];
  }) => {
    return updateProfile({
      allergies: data.allergies,
      dietary_restrictions: data.dietaryRestrictions,
    });
  };

  const setMacroGoals = async (data: {
    dailyCalorieGoal: number;
    dailyProteinGoal: number;
    dailyCarbsGoal: number;
    dailyFatGoal: number;
  }) => {
    return updateProfile({
      daily_calorie_goal: data.dailyCalorieGoal,
      daily_protein_goal: data.dailyProteinGoal,
      daily_carbs_goal: data.dailyCarbsGoal,
      daily_fat_goal: data.dailyFatGoal,
      macro_goals_set: true,
    });
  };

  const completeKitchenAssessment = async (data: {
    tools: string[];
    stoveType: string;
    hasOven: boolean;
    spaceLevel: number;
  }) => {
    const currentSkillLevel =
      useAuthStore.getState().profile?.skill_level || "basic_skills";
    return updateProfile({
      skill_level: currentSkillLevel,
      kitchen_tools: data.tools,
      stove_type: data.stoveType,
      has_oven: data.hasOven,
      space_level: data.spaceLevel,
    });
  };

  return {
    profile,
    isLoading: isProfileLoading || updateProfileMutation.isPending,
    updateProfile,
    completeSkillAssessment,
    completeDietaryRestrictions,
    setMacroGoals,
    completeKitchenAssessment,
    // Additional loading state for profile operations
    isUpdating: updateProfileMutation.isPending,
  };
};
