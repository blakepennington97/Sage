// src/hooks/useUserProfile.ts
import { useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { ProfileService } from "../services/supabase";
import { UserProfile } from "../services/supabase"; // Import the type

export const useUserProfile = () => {
  const { user, profile, setProfile, setProfileLoading, isProfileLoading } =
    useAuthStore();

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      setProfileLoading(true);
      try {
        const updatedProfile = await ProfileService.updateProfile(
          user.id,
          updates
        );
        setProfile(updatedProfile); // Update global state
        return updatedProfile;
      } catch (error) {
        console.error("Failed to update profile:", error);
        throw error;
      } finally {
        setProfileLoading(false);
      }
    },
    [user, setProfile, setProfileLoading]
  );

  // A helper to specifically complete the skill part of onboarding
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

  // A helper to complete the kitchen part and thus the whole onboarding
  const completeKitchenAssessment = async (data: {
    tools: string[];
    stoveType: string;
    hasOven: boolean;
    spaceLevel: number;
  }) => {
    // We set skill_level again just in case, to mark onboarding as complete.
    // If it's already set, it won't change.
    // A more robust way might be a separate `onboarding_completed` flag,
    // but using skill_level is a good proxy.
    const currentSkillLevel =
      useAuthStore.getState().profile?.skill_level || "";
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
    isLoading: isProfileLoading,
    updateProfile,
    completeSkillAssessment,
    completeKitchenAssessment,
  };
};
