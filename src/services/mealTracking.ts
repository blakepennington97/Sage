import { supabase } from "./supabase";
import { FoodMacros } from "./ai/gemini";

export interface MealEntry {
  id: string;
  user_id: string;
  meal_plan_id?: string;
  entry_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  food_name: string;
  brand_name?: string;
  serving_size: string;
  quantity: number;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  sugar_per_serving?: number;
  fiber_per_serving?: number;
  sodium_per_serving?: number;
  source: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyMacroProgress {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  goal_calories?: number;
  goal_protein?: number;
  goal_carbs?: number;
  goal_fat?: number;
  calories_progress?: number;
  protein_progress?: number;
  carbs_progress?: number;
  fat_progress?: number;
}

export class MealTrackingService {
  static async addMealEntry(
    data: Omit<MealEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<MealEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: entry, error } = await supabase
      .from('meal_entries')
      .insert([{
        user_id: user.id,
        ...data,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding meal entry:", error);
      throw new Error("Failed to add meal entry");
    }

    return entry;
  }

  static async getMealEntriesForDay(date: string): Promise<MealEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: entries, error } = await supabase
      .from('meal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching meal entries:", error);
      throw new Error("Failed to fetch meal entries");
    }

    return entries || [];
  }

  static async getMealEntriesForDateRange(
    startDate: string, 
    endDate: string
  ): Promise<MealEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: entries, error } = await supabase
      .from('meal_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching meal entries:", error);
      throw new Error("Failed to fetch meal entries");
    }

    return entries || [];
  }

  static async updateMealEntry(
    entryId: string,
    updates: Partial<Omit<MealEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<MealEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: entry, error } = await supabase
      .from('meal_entries')
      .update(updates)
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating meal entry:", error);
      throw new Error("Failed to update meal entry");
    }

    return entry;
  }

  static async deleteMealEntry(entryId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from('meal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error deleting meal entry:", error);
      throw new Error("Failed to delete meal entry");
    }
  }

  static async getDailyMacroProgress(date: string): Promise<DailyMacroProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: progress, error } = await supabase
      .rpc('get_daily_macro_progress', {
        target_user_id: user.id,
        target_date: date
      });

    if (error) {
      console.error("Error fetching daily macro progress:", error);
      throw new Error("Failed to fetch daily macro progress");
    }

    return progress && progress.length > 0 ? progress[0] : null;
  }

  static calculateMealEntryTotals(entries: MealEntry[]): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    fiber: number;
    sodium: number;
  } {
    return entries.reduce(
      (totals, entry) => ({
        calories: totals.calories + (entry.calories_per_serving * entry.quantity),
        protein: totals.protein + (entry.protein_per_serving * entry.quantity),
        carbs: totals.carbs + (entry.carbs_per_serving * entry.quantity),
        fat: totals.fat + (entry.fat_per_serving * entry.quantity),
        sugar: totals.sugar + ((entry.sugar_per_serving || 0) * entry.quantity),
        fiber: totals.fiber + ((entry.fiber_per_serving || 0) * entry.quantity),
        sodium: totals.sodium + ((entry.sodium_per_serving || 0) * entry.quantity),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0 }
    );
  }

  static groupEntriesByMealType(entries: MealEntry[]): Record<string, MealEntry[]> {
    return entries.reduce((groups, entry) => {
      const mealType = entry.meal_type;
      if (!groups[mealType]) {
        groups[mealType] = [];
      }
      groups[mealType].push(entry);
      return groups;
    }, {} as Record<string, MealEntry[]>);
  }

  // Helper to convert FoodMacros to MealEntry format
  static createMealEntryFromFood(
    food: FoodMacros,
    quantity: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    date: string
  ): Omit<MealEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
    return {
      entry_date: date,
      meal_type: mealType,
      food_name: food.foodName,
      brand_name: food.brandName || undefined,
      serving_size: food.servingSize,
      quantity,
      calories_per_serving: food.caloriesPerServing,
      protein_per_serving: food.proteinPerServing,
      carbs_per_serving: food.carbsPerServing,
      fat_per_serving: food.fatPerServing,
      sugar_per_serving: food.sugarPerServing,
      fiber_per_serving: food.fiberPerServing,
      sodium_per_serving: food.sodiumPerServing,
      source: food.source,
    };
  }
}