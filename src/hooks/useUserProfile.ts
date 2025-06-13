import { useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { ProfileService, UserProfile } from "../services/supabase";

export const useUserProfile = () => {
  const { user, setProfile, setProfileLoading, isProfileLoading } =
    useAuthStore();

  const updateProfile = useCallback(
    async (
      updates: Partial<Omit<UserProfile, "id" | "email" | "created_at">>
    ) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      setProfileLoading(true);
      try {
        const updatedProfile = await ProfileService.updateProfile(
          user.id,
          updates
        );
        setProfile(updatedProfile);
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
    profile: useAuthStore.getState().profile,
    isLoading: isProfileLoading,
    updateProfile,
    completeSkillAssessment,
    completeKitchenAssessment,
  };
};
