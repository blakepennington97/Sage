// src/services/userProfile.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export class UserProfileService {
  static async saveProfile(profileData: Partial<UserProfile>): Promise<void> {
    try {
      const existing = await this.getProfile();
      const updated: UserProfile = {
        ...existing,
        ...profileData,
        lastUpdated: new Date(),
      };

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save profile:", error);
      throw error;
    }
  }

  static async getProfile(): Promise<UserProfile> {
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
      console.error("Failed to load profile:", error);
      return this.getDefaultProfile();
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
    await AsyncStorage.removeItem(PROFILE_KEY);
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

  // Helper methods for AI prompts
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
}
