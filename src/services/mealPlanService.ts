import { supabase, RecipeService } from './supabase';
import { 
  WeeklyMealPlan, 
  MealPlanGroceryList,
  CreateMealPlanRequest,
  UpdateMealPlanRequest,
  createEmptyWeeklyMealPlan,
  formatDateForMealPlan
} from '../types/mealPlan';

export class MealPlanService {
  // Get user's meal plans
  static async getUserMealPlans(userId: string): Promise<WeeklyMealPlan[]> {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false });

    if (error) {
      console.error('Error fetching meal plans:', error);
      throw new Error(`Failed to fetch meal plans: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Parse the days field for each meal plan if it's a JSON string
    return data.map(mealPlan => {
      if (mealPlan.days && typeof mealPlan.days === 'string') {
        try {
          mealPlan.days = JSON.parse(mealPlan.days);
        } catch (parseError) {
          console.error('❌ Failed to parse days field in getUserMealPlans:', parseError);
          // Return meal plan with empty days array if parsing fails
          mealPlan.days = [];
        }
      }
      return mealPlan;
    });
  }

  // Get active meal plan for user
  static async getActiveMealPlan(userId: string): Promise<WeeklyMealPlan | null> {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active meal plan found
        return null;
      }
      console.error('Error fetching active meal plan:', error);
      throw new Error(`Failed to fetch active meal plan: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Parse the days field if it's a JSON string
    if (data.days && typeof data.days === 'string') {
      try {
        data.days = JSON.parse(data.days);
      } catch (parseError) {
        console.error('❌ Failed to parse days field in getActiveMealPlan:', parseError);
        throw new Error(`Failed to parse meal plan days: ${parseError}`);
      }
    }

    return data;
  }

  // Get meal plan for specific week
  static async getMealPlanByWeek(userId: string, weekStartDate: string): Promise<WeeklyMealPlan | null> {
    console.log(`🔍 getMealPlanByWeek called with:`, { userId, weekStartDate });
    
    // First, let's see all meal plans for this user to debug
    const { data: allPlans } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId);
    console.log(`🔍 All meal plans for user:`, allPlans);
    
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .eq('is_active', true)
      .single();

    console.log(`🔍 getMealPlanByWeek query result:`, { data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        // No meal plan found for this week
        return null;
      }
      console.error('Error fetching meal plan by week:', error);
      throw new Error(`Failed to fetch meal plan by week: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // CRITICAL FIX: Parse the days field if it's a JSON string
    if (data.days && typeof data.days === 'string') {
      try {
        console.log(`🔧 Parsing days field from JSON string to array...`);
        data.days = JSON.parse(data.days);
        console.log(`✅ Successfully parsed days field:`, data.days);
      } catch (parseError) {
        console.error('❌ Failed to parse days field:', parseError);
        throw new Error(`Failed to parse meal plan days: ${parseError}`);
      }
    }

    return data;
  }

  // Create new meal plan
  static async createMealPlan(userId: string, request: CreateMealPlanRequest): Promise<WeeklyMealPlan> {
    const newMealPlan = createEmptyWeeklyMealPlan(request.title, request.week_start_date);

    // Use a database function to atomically deactivate existing plans and create new one
    const { data, error } = await supabase.rpc('create_meal_plan_atomic', {
      p_user_id: userId,
      p_title: newMealPlan.title,
      p_week_start_date: newMealPlan.week_start_date,
      p_days: JSON.stringify(newMealPlan.days),
      p_is_active: newMealPlan.is_active
    });

    if (error) {
      console.error('Error creating meal plan:', error);
      throw new Error(`Failed to create meal plan: ${error.message}`);
    }

    // The RPC function returns a table (array), so we need the first item
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Failed to create meal plan: No data returned');
    }

    return data[0];
  }

  // Update meal plan (add/remove recipes)
  static async updateMealPlan(request: UpdateMealPlanRequest): Promise<WeeklyMealPlan> {
    console.log(`🔧 MealPlanService.updateMealPlan called with:`, request);
    
    // First, get the current meal plan
    const { data: currentPlan, error: fetchError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', request.meal_plan_id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching meal plan for update:', fetchError);
      throw new Error(`Failed to fetch meal plan: ${fetchError.message}`);
    }
    
    console.log(`📋 Found meal plan to update: ${currentPlan.title} (ID: ${currentPlan.id})`);
    console.log(`📅 Plan week: ${currentPlan.week_start_date}, Target date: ${request.date}`);

    // Parse the days field if it's a JSON string
    if (currentPlan.days && typeof currentPlan.days === 'string') {
      try {
        currentPlan.days = JSON.parse(currentPlan.days);
        console.log(`🔧 Parsed days field from JSON string in updateMealPlan`);
      } catch (parseError) {
        console.error('❌ Failed to parse days field in updateMealPlan:', parseError);
        throw new Error(`Failed to parse meal plan days: ${parseError}`);
      }
    }

    // Find the target day and update it
    let recipeData = null;
    if (request.recipe_id) {
      // Fetch recipe data to populate meal plan entry
      recipeData = await RecipeService.getRecipeById(request.recipe_id);
    }

    // Update the days array
    const updatedDays = currentPlan.days.map((day: any) => {
      if (day.date === request.date) {
        const updatedDay = { ...day };
        
        if (request.recipe_id && recipeData) {
          const mealPlanRecipe = {
            id: `${request.meal_plan_id}-${request.date}-${request.meal_type}`,
            recipe_id: request.recipe_id,
            recipe_name: recipeData.recipe_name || 'Unknown Recipe',
            estimated_time: recipeData.estimated_time || '30 min',
            difficulty_level: recipeData.difficulty_level || 3,
            servings: request.servings || 1,
            recipe_content: recipeData.recipe_content,
            recipe_data: recipeData.recipe_data
          };

          // Add/update recipe for the meal type
          if (request.meal_type === 'snacks') {
            // For snacks, add to array
            updatedDay.snacks = updatedDay.snacks || [];
            updatedDay.snacks.push({
              ...mealPlanRecipe,
              id: `${request.meal_plan_id}-${request.date}-${request.meal_type}-${Date.now()}`
            });
          } else {
            // For main meals, replace single recipe
            updatedDay[request.meal_type] = mealPlanRecipe;
          }
        } else {
          // Remove recipe
          if (request.meal_type === 'snacks') {
            updatedDay.snacks = [];
          } else {
            delete updatedDay[request.meal_type];
          }
        }
        
        return updatedDay;
      }
      return day;
    });

    console.log(`🔄 Updating meal plan in database...`);
    console.log(`📊 Updated days structure:`, JSON.stringify(updatedDays, null, 2));
    
    // Update the meal plan in database
    const { data, error } = await supabase
      .from('meal_plans')
      .update({ 
        days: updatedDays,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.meal_plan_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating meal plan in database:', error);
      throw new Error(`Failed to update meal plan: ${error.message}`);
    }

    console.log(`✅ Meal plan updated successfully in database! Recipe added to ${request.date} ${request.meal_type}`);
    return data;
  }

  // Delete meal plan
  static async deleteMealPlan(mealPlanId: string): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId);

    if (error) {
      console.error('Error deleting meal plan:', error);
      throw new Error(`Failed to delete meal plan: ${error.message}`);
    }
  }

  // Deactivate current active meal plan
  static async deactivateCurrentMealPlan(userId: string): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error deactivating meal plan:', error);
      throw new Error(`Failed to deactivate meal plan: ${error.message}`);
    }
  }

  // Generate grocery list for meal plan
  static async generateGroceryList(mealPlanId: string): Promise<MealPlanGroceryList> {
    // This would integrate with the AI service to analyze all recipes in the meal plan
    // and generate a consolidated grocery list
    
    // For now, return a placeholder
    const groceryList: MealPlanGroceryList = {
      id: `grocery-${mealPlanId}`,
      meal_plan_id: mealPlanId,
      items: [
        {
          name: "Chicken breast",
          amount: "2 lbs",
          category: "Meat",
          recipe_sources: ["Grilled Chicken", "Chicken Stir Fry"],
          checked: false
        },
        {
          name: "Rice",
          amount: "2 cups",
          category: "Grains",
          recipe_sources: ["Chicken Stir Fry", "Rice Bowl"],
          checked: false
        }
      ],
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return groceryList;
  }

  // Get grocery list for meal plan
  static async getGroceryList(mealPlanId: string): Promise<MealPlanGroceryList | null> {
    const { data, error } = await supabase
      .from('meal_plan_grocery_lists')
      .select('*')
      .eq('meal_plan_id', mealPlanId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No grocery list found
        return null;
      }
      console.error('Error fetching grocery list:', error);
      throw new Error(`Failed to fetch grocery list: ${error.message}`);
    }

    return data;
  }

  // Update grocery list (check/uncheck items)
  static async updateGroceryList(groceryListId: string, items: any[]): Promise<MealPlanGroceryList> {
    const { data, error } = await supabase
      .from('meal_plan_grocery_lists')
      .update({ 
        items,
        updated_at: new Date().toISOString()
      })
      .eq('id', groceryListId)
      .select()
      .single();

    if (error) {
      console.error('Error updating grocery list:', error);
      throw new Error(`Failed to update grocery list: ${error.message}`);
    }

    return data;
  }
}