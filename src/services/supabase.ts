import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environmentConfig } from "../config/environment";

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
    realtime: { params: { eventsPerSecond: 0 } },
    global: { headers: { "x-application-name": "sage-cooking-coach" } },
  }
);

// Types
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

export interface UserPreferencesRecord {
  id: string;
  user_id: string;
  preferences_data: any; // JSON field containing UserPreferences
  version: string;
  created_at: string;
  updated_at: string;
}
export interface UserRecipe {
  id: string;
  user_id: string;
  recipe_name: string;
  recipe_content: string;
  recipe_request: string;
  recipe_data: any;
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
  estimated_savings?: number;
  recipe_cost?: number;
  restaurant_cost?: number;
}

// Auth Service
export class AuthService {
  static async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  }
  static async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
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
}

// Profile Service
export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  static async updateProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, "id" | "created_at">>
  ): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error upserting profile:", error);
      throw error;
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
      recipe_data: any;
      difficulty_level: number;
      estimated_time: string;
    }
  ): Promise<UserRecipe> {
    const newRecipe = {
      user_id: userId,
      ...recipeData,
      cook_count: 0,
      is_favorite: false,
    };
    const { data, error } = await supabase
      .from("user_recipes")
      .insert(newRecipe)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async getUserRecipes(userId: string): Promise<UserRecipe[]> {
    const { data, error } = await supabase
      .from("user_recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async markAsCooked(recipeId: string): Promise<void> {
    try {
      const { data: recipe, error: fetchError } = await supabase
        .from("user_recipes")
        .select("cook_count")
        .eq("id", recipeId)
        .single();
      if (fetchError || !recipe)
        throw fetchError || new Error("Recipe not found");
      const newCookCount = (recipe.cook_count || 0) + 1;
      const { error: updateError } = await supabase
        .from("user_recipes")
        .update({
          cook_count: newCookCount,
          last_cooked: new Date().toISOString(),
        })
        .eq("id", recipeId);
      if (updateError) throw updateError;
    } catch (error) {
      console.error("Failed to mark as cooked:", error);
    }
  }

  // --- ADD THESE TWO METHODS ---
  static async deleteRecipe(recipeId: string): Promise<void> {
    const { error } = await supabase
      .from("user_recipes")
      .delete()
      .eq("id", recipeId);
    if (error) throw error;
  }

  static async toggleFavorite(recipeId: string): Promise<void> {
    // Read-then-write to safely toggle the boolean
    const { data: recipe, error: fetchError } = await supabase
      .from("user_recipes")
      .select("is_favorite")
      .eq("id", recipeId)
      .single();
    if (fetchError || !recipe)
      throw fetchError || new Error("Recipe not found");

    const { error: updateError } = await supabase
      .from("user_recipes")
      .update({ is_favorite: !recipe.is_favorite })
      .eq("id", recipeId);
    if (updateError) throw updateError;
  }

  static async rateRecipe(recipeId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const { error } = await supabase
      .from("user_recipes")
      .update({ user_rating: rating })
      .eq("id", recipeId);
    if (error) throw error;
  }
}

// User Preferences Service
export class UserPreferencesService {
  static async getPreferences(userId: string): Promise<UserPreferencesRecord | null> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error fetching preferences:", error);
      throw error;
    }
  }

  static async updatePreferences(
    userId: string,
    preferencesData: any,
    version: string = '1.0'
  ): Promise<UserPreferencesRecord> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          preferences_data: preferencesData,
          version,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error upserting preferences:", error);
      throw error;
    }
  }

  static async deletePreferences(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_preferences")
        .delete()
        .eq("user_id", userId);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error deleting preferences:", error);
      throw error;
    }
  }
}

// Session Service
export class SessionService {
  static async startCookingSession(
    userId: string,
    recipeId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("cooking_sessions")
        .insert({ user_id: userId, recipe_id: recipeId })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error starting cooking session:", error);
      return null;
    }
  }
  static async completeCookingSession(
    sessionId: string,
    successRating: number,
    savingsData?: {
      recipeCost: number;
      restaurantCost: number;
      estimatedSavings: number;
    }
  ): Promise<void> {
    try {
      const updateData: any = {
        completed_at: new Date().toISOString(),
        success_rating: successRating,
      };
      
      if (savingsData) {
        updateData.recipe_cost = savingsData.recipeCost;
        updateData.restaurant_cost = savingsData.restaurantCost;
        updateData.estimated_savings = savingsData.estimatedSavings;
      }
      
      const { error } = await supabase
        .from("cooking_sessions")
        .update(updateData)
        .eq("id", sessionId);
      if (error) throw error;
    } catch (error) {
      console.error("Error completing cooking session:", error);
      throw error;
    }
  }

  static async getUserSavings(userId: string): Promise<{
    totalSavings: number;
    totalCookingSessions: number;
    averageSavingsPerMeal: number;
    monthlySavings: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("cooking_sessions")
        .select("estimated_savings, recipe_cost, restaurant_cost, completed_at")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .not("estimated_savings", "is", null);
      
      if (error) throw error;
      
      const sessions = data || [];
      const totalSavings = sessions.reduce((sum, session) => sum + (session.estimated_savings || 0), 0);
      const totalCookingSessions = sessions.length;
      const averageSavingsPerMeal = totalCookingSessions > 0 ? totalSavings / totalCookingSessions : 0;
      
      // Calculate monthly savings (sessions in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSessions = sessions.filter(session => 
        new Date(session.completed_at) >= thirtyDaysAgo
      );
      const monthlySavings = recentSessions.reduce((sum, session) => sum + (session.estimated_savings || 0), 0);
      
      return {
        totalSavings,
        totalCookingSessions,
        averageSavingsPerMeal,
        monthlySavings,
      };
    } catch (error) {
      console.error("Error getting user savings:", error);
      return {
        totalSavings: 0,
        totalCookingSessions: 0,
        averageSavingsPerMeal: 0,
        monthlySavings: 0,
      };
    }
  }
}
