// src/services/userProfile.ts - REPLACE EXISTING FILE
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileService, AuthService } from "./supabase";

export interface UserProfile {
  // Skill Assessment
  skillLevel: string;
  fears: string[];
  overallConfidence: number;

  // Kitchen Assessment
  tools: string[];
  stoveType: string;
  hasOven: boolean;
  spaceLevel: number;

  // Metadata
  onboardingCompleted: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

const PROFILE_KEY = "user_profile";
const MIGRATION_KEY = "profile_migrated_to_cloud";

export class UserProfileService {
  // Main method - tries cloud first, falls back to local
  static async getProfile(): Promise<UserProfile> {
    try {
      const user = await AuthService.getCurrentUser();

      if (user) {
        // User is authenticated - try cloud first
        const cloudProfile = await ProfileService.getProfile(user.id);

        if (cloudProfile) {
          return this.mapCloudToLocal(cloudProfile);
        }

        // No cloud profile - check if we need to migrate local data
        const localProfile = await this.getLocalProfile();
        if (localProfile && localProfile.onboardingCompleted) {
          await this.migrateToCloud(user.id, user.email!, localProfile);
          return localProfile;
        }
      }

      // Not authenticated or no profile - return local or default
      return await this.getLocalProfile();
    } catch (error) {
      console.error("Error getting profile, falling back to local:", error);
      return await this.getLocalProfile();
    }
  }

  static async saveProfile(profileData: Partial<UserProfile>): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();

      if (user) {
        // Save to cloud
        const existing = await this.getProfile();
        const updated: UserProfile = {
          ...existing,
          ...profileData,
          lastUpdated: new Date(),
        };

        await ProfileService.updateProfile(
          user.id,
          this.mapLocalToCloud(updated)
        );

        // Also save locally as backup
        await this.saveLocalProfile(updated);
      } else {
        // Not authenticated - save locally only
        await this.saveLocalProfile(profileData);
      }
    } catch (error) {
      console.error("Error saving to cloud, saving locally:", error);
      await this.saveLocalProfile(profileData);
    }
  }

  static async updateSkillData(skillData: {
    skillLevel: string;
    fears: string[];
    overallConfidence: number;
  }): Promise<void> {
    await this.saveProfile(skillData);
  }

  static async updateKitchenData(kitchenData: {
    tools: string[];
    stoveType: string;
    hasOven: boolean;
    spaceLevel: number;
  }): Promise<void> {
    await this.saveProfile({
      ...kitchenData,
      onboardingCompleted: true,
    });
  }

  static async hasCompletedOnboarding(): Promise<boolean> {
    const profile = await this.getProfile();
    return profile.onboardingCompleted;
  }

  static async clearProfile(): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        // Clear cloud profile by resetting to defaults
        await ProfileService.updateProfile(user.id, {
          skill_level: "",
          cooking_fears: [],
          confidence_level: 3,
          kitchen_tools: [],
          stove_type: "",
          has_oven: true,
          space_level: 3,
        });
      }
    } catch (error) {
      console.error("Error clearing cloud profile:", error);
    }

    // Always clear local storage
    await AsyncStorage.removeItem(PROFILE_KEY);
    await AsyncStorage.removeItem(MIGRATION_KEY);
  }

  // Local storage methods (private)
  private static async getLocalProfile(): Promise<UserProfile> {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (!stored) {
        return this.getDefaultProfile();
      }

      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.lastUpdated = new Date(parsed.lastUpdated);

      return parsed;
    } catch (error) {
      console.error("Failed to load local profile:", error);
      return this.getDefaultProfile();
    }
  }

  private static async saveLocalProfile(
    profileData: Partial<UserProfile>
  ): Promise<void> {
    try {
      const existing = await this.getLocalProfile();
      const updated: UserProfile = {
        ...existing,
        ...profileData,
        lastUpdated: new Date(),
      };

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save local profile:", error);
      throw error;
    }
  }

  private static async migrateToCloud(
    userId: string,
    email: string,
    localProfile: UserProfile
  ): Promise<void> {
    try {
      const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
      if (migrated) return; // Already migrated

      console.log("Migrating local profile to cloud...");

      await ProfileService.createProfile(
        userId,
        email,
        this.mapLocalToCloud(localProfile)
      );
      await AsyncStorage.setItem(MIGRATION_KEY, "true");

      console.log("✅ Profile migration complete");
    } catch (error) {
      console.error("Failed to migrate profile to cloud:", error);
      // Don't throw - let app continue with local profile
    }
  }

  private static getDefaultProfile(): UserProfile {
    return {
      skillLevel: "",
      fears: [],
      overallConfidence: 3,
      tools: [],
      stoveType: "",
      hasOven: true,
      spaceLevel: 3,
      onboardingCompleted: false,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
  }

  // Mapping functions between local and cloud formats
  private static mapCloudToLocal(cloudProfile: any): UserProfile {
    return {
      skillLevel: cloudProfile.skill_level || "",
      fears: cloudProfile.cooking_fears || [],
      overallConfidence: cloudProfile.confidence_level || 3,
      tools: cloudProfile.kitchen_tools || [],
      stoveType: cloudProfile.stove_type || "",
      hasOven: cloudProfile.has_oven ?? true,
      spaceLevel: cloudProfile.space_level || 3,
      onboardingCompleted: !!(
        cloudProfile.skill_level && cloudProfile.stove_type
      ), // Has completed if key fields exist
      createdAt: new Date(cloudProfile.created_at),
      lastUpdated: new Date(cloudProfile.updated_at),
    };
  }

  private static mapLocalToCloud(localProfile: UserProfile): any {
    return {
      skill_level: localProfile.skillLevel,
      cooking_fears: localProfile.fears,
      confidence_level: localProfile.overallConfidence,
      kitchen_tools: localProfile.tools,
      stove_type: localProfile.stoveType,
      has_oven: localProfile.hasOven,
      space_level: localProfile.spaceLevel,
    };
  }

  // Helper methods for AI prompts (unchanged)
  static async getSkillDescription(): Promise<string> {
    const profile = await this.getProfile();

    const skillLabels = {
      complete_beginner: "Complete beginner (rarely cooks)",
      basic_skills: "Basic skills (simple dishes)",
      developing: "Developing cook (regular cooking)",
      confident: "Confident cook (experiments often)",
    };

    return (
      skillLabels[profile.skillLevel as keyof typeof skillLabels] ||
      "Unknown skill level"
    );
  }

  static async getKitchenSummary(): Promise<string> {
    const profile = await this.getProfile();

    const essentialTools = [
      "chef_knife",
      "cutting_board",
      "measuring_cups",
      "mixing_bowls",
    ];
    const hasEssentials = essentialTools.every((tool) =>
      profile.tools.includes(tool)
    );

    const stoveDesc = {
      gas: "gas stove (precise heat control)",
      electric: "electric stove (slower heat changes)",
      induction: "induction cooktop (fast, precise)",
      none: "no stove (microwave/hotplate only)",
    };

    return `${hasEssentials ? "Well-equipped" : "Basic"} kitchen with ${stoveDesc[profile.stoveType as keyof typeof stoveDesc] || "unknown stove"}, ${profile.hasOven ? "has oven" : "no oven"}, ${profile.spaceLevel <= 2 ? "limited" : profile.spaceLevel >= 4 ? "spacious" : "moderate"} space`;
  }

  static async getFearsList(): Promise<string[]> {
    const profile = await this.getProfile();

    const fearLabels = {
      knife_skills: "using knives",
      timing: "timing multiple dishes",
      heat_control: "controlling heat",
      seasoning: "seasoning properly",
      raw_food: "handling raw meat",
      burning: "burning food",
      waste: "wasting ingredients",
      complicated: "complex recipes",
    };

    return profile.fears
      .map((fear) => fearLabels[fear as keyof typeof fearLabels])
      .filter(Boolean);
  }

  // New methods for subscription and usage tracking
  static async canGenerateRecipe(): Promise<{
    canGenerate: boolean;
    recipesUsed: number;
    limit: number;
  }> {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        return await ProfileService.canGenerateRecipe(user.id);
      }

      // Not authenticated - use local tracking
      const localCount = await this.getLocalRecipeCount();
      return { canGenerate: localCount < 5, recipesUsed: localCount, limit: 5 };
    } catch (error) {
      console.error("Error checking recipe generation limit:", error);
      return { canGenerate: true, recipesUsed: 0, limit: 5 };
    }
  }

  static async incrementRecipeCount(): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        await ProfileService.incrementRecipeCount(user.id);
      } else {
        // Local tracking for non-authenticated users
        await this.incrementLocalRecipeCount();
      }
    } catch (error) {
      console.error("Error incrementing recipe count:", error);
    }
  }

  private static async getLocalRecipeCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const stored = await AsyncStorage.getItem(`local_recipe_count_${today}`);
      return stored ? parseInt(stored) : 0;
    } catch (error) {
      return 0;
    }
  }

  private static async incrementLocalRecipeCount(): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `local_recipe_count_${today}`;
      const current = await this.getLocalRecipeCount();
      await AsyncStorage.setItem(key, (current + 1).toString());
    } catch (error) {
      console.error("Error incrementing local recipe count:", error);
    }
  }
}
