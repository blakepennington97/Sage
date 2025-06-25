// src/services/mealPlanService.ts (with logging)

import {
  createEmptyWeeklyMealPlan,
  CreateMealPlanRequest,
  MealPlanRecipe,
  UpdateMealPlanRequest,
  WeeklyMealPlan,
} from "../types/mealPlan";
import { RecipeService, supabase } from "./supabase";

export class MealPlanService {
  static async getMealPlanByWeek(
    userId: string,
    weekStartDate: string
  ): Promise<WeeklyMealPlan | null> {
    console.log(
      `📞 [SERVICE] getMealPlanByWeek: Called for user ${userId}, week ${weekStartDate}`
    );
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start_date", weekStartDate)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(
        `❌ [SERVICE] getMealPlanByWeek: Error fetching plan.`,
        error
      );
      throw new Error(`Failed to fetch meal plan by week: ${error.message}`);
    }
    if (!data) {
      console.log(
        `🟡 [SERVICE] getMealPlanByWeek: No plan found for this week.`
      );
      return null;
    }
    console.log(
      `✅ [SERVICE] getMealPlanByWeek: Found plan with ID ${data.id}.`
    );
    if (data.days && typeof data.days === "string") {
      try {
        data.days = JSON.parse(data.days);
      } catch (e) {
        console.error(
          `❌ [SERVICE] getMealPlanByWeek: Failed to parse 'days' JSON for plan ${data.id}.`,
          e
        );
        data.days = [];
      }
    }
    return data;
  }

  static async batchUpdateMealPlan(
    requests: UpdateMealPlanRequest[]
  ): Promise<WeeklyMealPlan> {
    console.log(
      `📞 [SERVICE] batchUpdateMealPlan: Called with ${requests.length} requests.`
    );
    const mealPlanId = requests[0].meal_plan_id;
    console.log(`  - Fetching current plan with ID: ${mealPlanId}`);
    const { data: currentPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", mealPlanId)
      .single();

    if (fetchError) {
      console.error(
        `❌ [SERVICE] batchUpdateMealPlan: Failed to fetch current plan.`,
        fetchError
      );
      throw new Error(`Failed to fetch meal plan: ${fetchError.message}`);
    }
    console.log(`  - Successfully fetched plan. Title: "${currentPlan.title}"`);

    const recipeIds = [
      ...new Set(requests.map((r) => r.recipe_id).filter(Boolean)),
    ] as string[];
    console.log(`  - Fetching details for ${recipeIds.length} unique recipes.`);
    const { data: recipes, error: recipeError } = await supabase
      .from("user_recipes")
      .select("*")
      .in("id", recipeIds);

    if (recipeError) {
      console.error(
        `❌ [SERVICE] batchUpdateMealPlan: Failed to fetch recipes.`,
        recipeError
      );
      throw new Error(`Failed to fetch recipes: ${recipeError.message}`);
    }
    console.log(`  - Successfully fetched ${recipes.length} recipes.`);

    const recipesMap = new Map(recipes.map((r) => [r.id, r]));

    let updatedDays = Array.isArray(currentPlan.days)
      ? JSON.parse(JSON.stringify(currentPlan.days))
      : [];

    requests.forEach((request) => {
      const dayIndex = updatedDays.findIndex(
        (d: any) => d.date === request.date
      );
      if (dayIndex === -1) {
        console.warn(`  - ⚠️ Could not find day ${request.date} in plan.`);
        return;
      }

      const recipeData = recipesMap.get(request.recipe_id!);
      if (!recipeData) {
        console.warn(
          `  - ⚠️ Could not find recipe data for ID ${request.recipe_id}.`
        );
        return;
      }

      const mealPlanRecipe: MealPlanRecipe = {
        id: `${request.meal_plan_id}-${request.date}-${
          request.meal_type
        }-${Date.now()}`,
        recipe_id: request.recipe_id!,
        recipe_name: recipeData.recipe_name,
        estimated_time: recipeData.estimated_time,
        difficulty_level: recipeData.difficulty_level,
        servings: request.servings || 2,
        servingsForMeal: request.servingsForMeal || 1,
        recipe_content: recipeData.recipe_content,
        recipe_data: recipeData.recipe_data,
      };

      const dayToUpdate = updatedDays[dayIndex];
      console.log(
        `  - Applying update to ${request.date}, meal: ${request.meal_type}`
      );
      if (request.meal_type === "snacks") {
        if (!dayToUpdate.snacks) dayToUpdate.snacks = [];
        dayToUpdate.snacks.push(mealPlanRecipe);
      } else {
        dayToUpdate[request.meal_type] = mealPlanRecipe;
      }
    });

    console.log(`  - Preparing to update database with new 'days' structure.`);
    const { data, error } = await supabase
      .from("meal_plans")
      .update({ days: updatedDays, updated_at: new Date().toISOString() })
      .eq("id", mealPlanId)
      .select()
      .single();

    if (error) {
      console.error(
        `❌ [SERVICE] batchUpdateMealPlan: Failed to update plan in DB.`,
        error
      );
      throw new Error(`Failed to apply batch update: ${error.message}`);
    }
    console.log(
      `✅ [SERVICE] batchUpdateMealPlan: Successfully updated plan ${data.id}. Returning new data.`
    );
    return data;
  }

  // ... (all other methods remain the same)
  static async getUserMealPlans(userId: string): Promise<WeeklyMealPlan[]> {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .order("week_start_date", { ascending: false });
    if (error) {
      console.error("Error fetching meal plans:", error);
      throw new Error(`Failed to fetch meal plans: ${error.message}`);
    }
    if (!data) return [];
    return data.map((mealPlan) => {
      if (mealPlan.days && typeof mealPlan.days === "string") {
        try {
          mealPlan.days = JSON.parse(mealPlan.days);
        } catch (e) {
          mealPlan.days = [];
        }
      }
      return mealPlan;
    });
  }

  static async getActiveMealPlan(
    userId: string
  ): Promise<WeeklyMealPlan | null> {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();
    if (error && error.code !== "PGRST116")
      throw new Error(`Failed to fetch active meal plan: ${error.message}`);
    if (!data) return null;
    if (data.days && typeof data.days === "string")
      data.days = JSON.parse(data.days);
    return data;
  }

  static async createMealPlan(
    userId: string,
    request: CreateMealPlanRequest
  ): Promise<WeeklyMealPlan> {
    const newMealPlan = createEmptyWeeklyMealPlan(
      request.title,
      request.week_start_date
    );
    const { data, error } = await supabase.rpc("create_meal_plan_atomic", {
      p_user_id: userId,
      p_title: newMealPlan.title,
      p_week_start_date: newMealPlan.week_start_date,
      p_days: newMealPlan.days,
      p_is_active: newMealPlan.is_active,
    });
    if (error) throw new Error(`Failed to create meal plan: ${error.message}`);
    if (!data || !Array.isArray(data) || data.length === 0)
      throw new Error("Failed to create meal plan: No data returned");
    return data[0];
  }

  static async updateMealPlan(
    request: UpdateMealPlanRequest
  ): Promise<WeeklyMealPlan> {
    const { data: currentPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", request.meal_plan_id)
      .single();
    if (fetchError)
      throw new Error(`Failed to fetch meal plan: ${fetchError.message}`);

    let recipeData = null;
    if (request.recipe_id) {
      recipeData = await RecipeService.getRecipeById(request.recipe_id);
    }

    let updatedDays = Array.isArray(currentPlan.days)
      ? JSON.parse(JSON.stringify(currentPlan.days))
      : [];
    const dayIndex = updatedDays.findIndex((d: any) => d.date === request.date);
    if (dayIndex === -1) throw new Error("Day not found in meal plan");

    const newDay = updatedDays[dayIndex];

    if (request.recipe_id && recipeData) {
      const mealPlanRecipe: MealPlanRecipe = {
        id: `${request.meal_plan_id}-${request.date}-${request.meal_type}`,
        recipe_id: request.recipe_id,
        recipe_name: recipeData.recipe_name,
        estimated_time: recipeData.estimated_time,
        difficulty_level: recipeData.difficulty_level,
        servings: request.servings || 2,
        servingsForMeal: request.servingsForMeal || 1,
        recipe_content: recipeData.recipe_content,
        recipe_data: recipeData.recipe_data,
      };
      newDay[request.meal_type] = mealPlanRecipe;
    } else {
      delete newDay[request.meal_type];
    }
    updatedDays[dayIndex] = newDay;

    const { data, error } = await supabase
      .from("meal_plans")
      .update({ days: updatedDays, updated_at: new Date().toISOString() })
      .eq("id", request.meal_plan_id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update meal plan: ${error.message}`);
    return data;
  }

  static async deleteMealPlan(
    mealPlanId: string
  ): Promise<WeeklyMealPlan | null> {
    const { data, error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", mealPlanId)
      .select()
      .single();
    if (error) throw new Error(`Failed to delete meal plan: ${error.message}`);
    return data;
  }

  static async getMealPlanById(
    mealPlanId: string
  ): Promise<WeeklyMealPlan | null> {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", mealPlanId)
      .single();
    if (error) return null;
    return data;
  }
}
