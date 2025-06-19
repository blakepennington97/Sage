import { supabase } from './supabase';
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

    return data || [];
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

    return data;
  }

  // Create new meal plan
  static async createMealPlan(userId: string, request: CreateMealPlanRequest): Promise<WeeklyMealPlan> {
    // First, deactivate any existing active meal plan
    await this.deactivateCurrentMealPlan(userId);

    const newMealPlan = createEmptyWeeklyMealPlan(request.title, request.week_start_date);

    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        ...newMealPlan
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meal plan:', error);
      throw new Error(`Failed to create meal plan: ${error.message}`);
    }

    return data;
  }

  // Update meal plan (add/remove recipes)
  static async updateMealPlan(request: UpdateMealPlanRequest): Promise<WeeklyMealPlan> {
    // First, get the current meal plan
    const { data: currentPlan, error: fetchError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', request.meal_plan_id)
      .single();

    if (fetchError) {
      console.error('Error fetching meal plan for update:', fetchError);
      throw new Error(`Failed to fetch meal plan: ${fetchError.message}`);
    }

    // Update the days array
    const updatedDays = currentPlan.days.map((day: any) => {
      if (day.date === request.date) {
        const updatedDay = { ...day };
        
        if (request.recipe_id) {
          // Add/update recipe for the meal type
          if (request.meal_type === 'snacks') {
            // For snacks, add to array
            updatedDay.snacks = updatedDay.snacks || [];
            updatedDay.snacks.push({
              id: `${request.meal_plan_id}-${request.date}-${request.meal_type}-${Date.now()}`,
              recipe_id: request.recipe_id,
              servings: request.servings || 1
            });
          } else {
            // For main meals, replace single recipe
            updatedDay[request.meal_type] = {
              id: `${request.meal_plan_id}-${request.date}-${request.meal_type}`,
              recipe_id: request.recipe_id,
              servings: request.servings || 1
            };
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
      console.error('Error updating meal plan:', error);
      throw new Error(`Failed to update meal plan: ${error.message}`);
    }

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