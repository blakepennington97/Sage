// src/services/supabase.ts - REPLACE EXISTING FILE
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environmentConfig } from "../config/environment";

// Create Supabase client with secure configuration (WebSocket disabled for React Native)
export const supabase: SupabaseClient = createClient(
  environmentConfig.supabaseUrl,
  environmentConfig.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      // Disable real-time to avoid WebSocket issues
      params: {
        eventsPerSecond: 0,
      },
    },
    global: {
      headers: {
        "x-application-name": "sage-cooking-coach",
      },
    },
  }
);

// Types for our database schema
export interface UserProfile {
  id: string;
  email: string;
  skill_level: string;
  cooking_fears: string[];
  confidence_level: number;
  kitchen_tools: string[];
  stove_type: string;
  has_oven: boolean;
  space_level: number;
  subscription_status: "free" | "premium";
  recipes_generated_today: number;
  last_recipe_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserRecipe {
  id: string;
  user_id: string;
  recipe_name: string;
  recipe_content: string;
  recipe_request: string;
  difficulty_level: number;
  estimated_time: string;
  is_favorite: boolean;
  cook_count: number;
  user_rating: number;
  created_at: string;
  last_cooked: string | null;
}

export interface CookingSession {
  id: string;
  user_id: string;
  recipe_id: string;
  started_at: string;
  completed_at: string | null;
  success_rating: number;
  help_requests: any;
  notes: string;
}

// Authentication Service
export class AuthService {
  static async signUp(email: string, password: string) {
    return await supabase.auth.signUp({
      email,
      password,
    });
  }

  static async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  static async signOut() {
    return await supabase.auth.signOut();
  }

  static async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  static onAuthChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  static async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email);
  }
}

// Profile Service - Complete Implementation
export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No profile found - this is okay for new users
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  static async createProfile(
    userId: string,
    email: string,
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const newProfile = {
        id: userId,
        email,
        skill_level: "",
        cooking_fears: [],
        confidence_level: 3,
        kitchen_tools: [],
        stove_type: "",
        has_oven: true,
        space_level: 3,
        subscription_status: "free" as const,
        recipes_generated_today: 0,
        last_recipe_date: new Date().toISOString().split("T")[0],
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_profiles")
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  }

  static async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  static async incrementRecipeCount(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get current profile to check date
      const profile = await this.getProfile(userId);
      if (!profile) throw new Error("Profile not found");

      let recipesToday = profile.recipes_generated_today;

      // Reset counter if it's a new day
      if (profile.last_recipe_date !== today) {
        recipesToday = 0;
      }

      await this.updateProfile(userId, {
        recipes_generated_today: recipesToday + 1,
        last_recipe_date: today,
      });
    } catch (error) {
      console.error("Error incrementing recipe count:", error);
      throw error;
    }
  }

  static async canGenerateRecipe(
    userId: string
  ): Promise<{ canGenerate: boolean; recipesUsed: number; limit: number }> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) throw new Error("Profile not found");

      const today = new Date().toISOString().split("T")[0];
      let recipesUsed = profile.recipes_generated_today;

      // Reset counter if it's a new day
      if (profile.last_recipe_date !== today) {
        recipesUsed = 0;
        // Update the profile to reset the counter
        await this.updateProfile(userId, {
          recipes_generated_today: 0,
          last_recipe_date: today,
        });
      }

      const limit = profile.subscription_status === "premium" ? 999 : 5; // Effectively unlimited for premium
      const canGenerate = recipesUsed < limit;

      return { canGenerate, recipesUsed, limit };
    } catch (error) {
      console.error("Error checking recipe generation limit:", error);
      return { canGenerate: false, recipesUsed: 0, limit: 5 };
    }
  }
}

// Recipe Service
export class RecipeService {
  static async saveRecipe(
    userId: string,
    recipeData: {
      recipe_name: string;
      recipe_content: string;
      recipe_request: string;
      difficulty_level?: number;
      estimated_time?: string;
    }
  ): Promise<UserRecipe> {
    try {
      const newRecipe = {
        user_id: userId,
        is_favorite: false,
        cook_count: 0,
        user_rating: 0,
        created_at: new Date().toISOString(),
        last_cooked: null,
        ...recipeData,
      };

      const { data, error } = await supabase
        .from("user_recipes")
        .insert([newRecipe])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving recipe:", error);
      throw error;
    }
  }

  static async getUserRecipes(
    userId: string,
    limit?: number
  ): Promise<UserRecipe[]> {
    try {
      let query = supabase
        .from("user_recipes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user recipes:", error);
      return [];
    }
  }

  static async getFavoriteRecipes(userId: string): Promise<UserRecipe[]> {
    try {
      const { data, error } = await supabase
        .from("user_recipes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_favorite", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching favorite recipes:", error);
      return [];
    }
  }

  static async toggleFavorite(recipeId: string): Promise<void> {
    try {
      // First get the current favorite status
      const { data: recipe, error: fetchError } = await supabase
        .from("user_recipes")
        .select("is_favorite")
        .eq("id", recipeId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the favorite status
      const { error: updateError } = await supabase
        .from("user_recipes")
        .update({ is_favorite: !recipe.is_favorite })
        .eq("id", recipeId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  }

  static async markAsCooked(recipeId: string): Promise<void> {
    try {
      // Get current cook count
      const { data: recipe, error: fetchError } = await supabase
        .from("user_recipes")
        .select("cook_count")
        .eq("id", recipeId)
        .single();

      if (fetchError) throw fetchError;

      // Update cook count and last cooked date
      const { error: updateError } = await supabase
        .from("user_recipes")
        .update({
          cook_count: recipe.cook_count + 1,
          last_cooked: new Date().toISOString(),
        })
        .eq("id", recipeId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error marking recipe as cooked:", error);
      throw error;
    }
  }

  static async deleteRecipe(recipeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting recipe:", error);
      throw error;
    }
  }
}

// Cooking Session Service
export class SessionService {
  static async startCookingSession(
    userId: string,
    recipeId: string
  ): Promise<CookingSession> {
    try {
      const newSession = {
        user_id: userId,
        recipe_id: recipeId,
        started_at: new Date().toISOString(),
        completed_at: null,
        success_rating: 0,
        help_requests: {},
        notes: "",
      };

      const { data, error } = await supabase
        .from("cooking_sessions")
        .insert([newSession])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error starting cooking session:", error);
      throw error;
    }
  }

  static async completeCookingSession(
    sessionId: string,
    successRating: number,
    notes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("cooking_sessions")
        .update({
          completed_at: new Date().toISOString(),
          success_rating: successRating,
          notes: notes || "",
        })
        .eq("id", sessionId);

      if (error) throw error;
    } catch (error) {
      console.error("Error completing cooking session:", error);
      throw error;
    }
  }
}
