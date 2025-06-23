// Centralized data layer for meal plans with validation and normalization

import { supabase } from '../supabase';
import { 
  MealPlan, 
  MealPlanCreateRequest, 
  MealPlanUpdateRequest,
  MealPlanDay,
  MealSlot,
  MealPlanConflictError
} from './types';

/**
 * Data normalization and validation utilities
 */
export class MealPlanDataLayer {
  
  /**
   * Normalize raw database data to consistent MealPlan structure
   */
  static normalizeMealPlan(rawData: any): MealPlan {
    if (!rawData) {
      throw new MealPlanValidationError('Invalid meal plan data: null or undefined');
    }

    // Parse days if it's a JSON string (defensive parsing)
    let days: MealPlanDay[];
    if (typeof rawData.days === 'string') {
      try {
        days = JSON.parse(rawData.days);
      } catch (error) {
        console.warn('Failed to parse meal plan days JSON, using empty array', error);
        days = [];
      }
    } else if (Array.isArray(rawData.days)) {
      days = rawData.days;
    } else {
      days = [];
    }

    // Validate and normalize days structure
    days = this.normalizeDays(days);

    return {
      id: rawData.id,
      userId: rawData.user_id,
      weekStartDate: rawData.week_start_date,
      days,
      isActive: rawData.is_active ?? true,
      createdAt: rawData.created_at,
      updatedAt: rawData.updated_at,
      version: rawData.version ?? 1,
    };
  }

  /**
   * Normalize days array to ensure consistent structure
   */
  private static normalizeDays(days: any[]): MealPlanDay[] {
    if (!Array.isArray(days)) {
      return this.createEmptyWeek();
    }

    // Ensure we have exactly 7 days (Monday-Sunday)
    const normalizedDays: MealPlanDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dayData = days[i];
      
      if (dayData && typeof dayData === 'object') {
        normalizedDays.push({
          date: dayData.date || this.getDateForDayIndex(i),
          meals: this.normalizeMeals(dayData.meals || {})
        });
      } else {
        // Create empty day if data is missing or invalid
        normalizedDays.push({
          date: this.getDateForDayIndex(i),
          meals: {
            breakfast: undefined,
            lunch: undefined,
            dinner: undefined,
            snacks: []
          }
        });
      }
    }

    return normalizedDays;
  }

  /**
   * Normalize meals object to ensure consistent structure
   */
  private static normalizeMeals(meals: any): MealPlanDay['meals'] {
    const normalized: MealPlanDay['meals'] = {
      breakfast: meals.breakfast ? this.normalizeMealSlot(meals.breakfast) : undefined,
      lunch: meals.lunch ? this.normalizeMealSlot(meals.lunch) : undefined,
      dinner: meals.dinner ? this.normalizeMealSlot(meals.dinner) : undefined,
      snacks: Array.isArray(meals.snacks) 
        ? meals.snacks.map(this.normalizeMealSlot).filter(Boolean)
        : []
    };

    return normalized;
  }

  /**
   * Normalize individual meal slot
   */
  private static normalizeMealSlot(slot: any): MealSlot | undefined {
    if (!slot || typeof slot !== 'object') {
      return undefined;
    }

    return {
      id: slot.id || this.generateSlotId(),
      recipeId: slot.recipeId || slot.recipe_id,
      recipeName: slot.recipeName || slot.recipe_name,
      servings: typeof slot.servings === 'number' ? slot.servings : 1,
      calories: typeof slot.calories === 'number' ? slot.calories : undefined,
      protein: typeof slot.protein === 'number' ? slot.protein : undefined,
      carbs: typeof slot.carbs === 'number' ? slot.carbs : undefined,
      fat: typeof slot.fat === 'number' ? slot.fat : undefined,
      scheduledTime: slot.scheduledTime || slot.scheduled_time,
      notes: slot.notes
    };
  }

  /**
   * Create empty week structure
   */
  private static createEmptyWeek(): MealPlanDay[] {
    return Array.from({ length: 7 }, (_, index) => ({
      date: this.getDateForDayIndex(index),
      meals: {
        breakfast: undefined,
        lunch: undefined,
        dinner: undefined,
        snacks: []
      }
    }));
  }

  /**
   * Get ISO date string for day index (0 = current Monday)
   */
  private static getDateForDayIndex(dayIndex: number): string {
    const today = new Date();
    const monday = new Date(today);
    const daysSinceMonday = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    monday.setDate(today.getDate() - daysSinceMonday + dayIndex);
    return monday.toISOString().split('T')[0];
  }

  /**
   * Generate unique slot ID
   */
  private static generateSlotId(): string {
    return `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Database operations with proper error handling and normalization
   */

  /**
   * Create new meal plan
   */
  static async createMealPlan(request: MealPlanCreateRequest): Promise<MealPlan> {
    const days = request.days || this.createEmptyWeek();
    
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: request.userId,
        week_start_date: request.weekStartDate,
        days: JSON.stringify(days),
        is_active: true,
        version: 1
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create meal plan: ${error.message}`);
    }

    return this.normalizeMealPlan(data);
  }

  /**
   * Update existing meal plan with optimistic concurrency control
   */
  static async updateMealPlan(request: MealPlanUpdateRequest): Promise<MealPlan> {
    const { data, error } = await supabase
      .from('meal_plans')
      .update({
        days: JSON.stringify(request.days),
        version: request.version + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id)
      .eq('version', request.version) // Optimistic concurrency control
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        // Version conflict - fetch current version
        const { data: currentData } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('id', request.id)
          .single();

        if (currentData) {
          const conflictError = new Error('Meal plan has been modified by another process') as MealPlanConflictError;
          conflictError.name = 'MealPlanConflictError';
          conflictError.currentVersion = currentData.version;
          conflictError.expectedVersion = request.version;
          conflictError.conflictingChanges = this.normalizeMealPlan(currentData);
          throw conflictError;
        }
      }
      throw new Error(`Failed to update meal plan: ${error.message}`);
    }

    return this.normalizeMealPlan(data);
  }

  /**
   * Fetch meal plan by week
   */
  static async getMealPlanByWeek(userId: string, weekStartDate: string): Promise<MealPlan | null> {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch meal plan: ${error.message}`);
    }

    return this.normalizeMealPlan(data);
  }

  /**
   * Fetch all active meal plans for user
   */
  static async getMealPlans(userId: string): Promise<MealPlan[]> {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('week_start_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch meal plans: ${error.message}`);
    }

    return (data || []).map(this.normalizeMealPlan);
  }

  /**
   * Delete meal plan (soft delete by setting is_active = false)
   */
  static async deleteMealPlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('id', planId);

    if (error) {
      throw new Error(`Failed to delete meal plan: ${error.message}`);
    }
  }

  /**
   * Validation utilities
   */

  /**
   * Validate meal plan data before operations
   */
  static validateMealPlan(mealPlan: Partial<MealPlan>): void {
    if (!mealPlan.userId) {
      throw new MealPlanValidationError('User ID is required');
    }

    if (!mealPlan.weekStartDate) {
      throw new MealPlanValidationError('Week start date is required');
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(mealPlan.weekStartDate)) {
      throw new MealPlanValidationError('Week start date must be in YYYY-MM-DD format');
    }

    // Validate days structure if provided
    if (mealPlan.days) {
      if (!Array.isArray(mealPlan.days) || mealPlan.days.length !== 7) {
        throw new MealPlanValidationError('Days must be an array of exactly 7 elements');
      }
    }
  }

  /**
   * Calculate macro totals for a meal plan
   */
  static calculateMacroTotals(mealPlan: MealPlan): {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  } {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    mealPlan.days.forEach(day => {
      const { meals } = day;
      
      // Add breakfast macros
      if (meals.breakfast) {
        totalCalories += meals.breakfast.calories || 0;
        totalProtein += meals.breakfast.protein || 0;
        totalCarbs += meals.breakfast.carbs || 0;
        totalFat += meals.breakfast.fat || 0;
      }

      // Add lunch macros
      if (meals.lunch) {
        totalCalories += meals.lunch.calories || 0;
        totalProtein += meals.lunch.protein || 0;
        totalCarbs += meals.lunch.carbs || 0;
        totalFat += meals.lunch.fat || 0;
      }

      // Add dinner macros
      if (meals.dinner) {
        totalCalories += meals.dinner.calories || 0;
        totalProtein += meals.dinner.protein || 0;
        totalCarbs += meals.dinner.carbs || 0;
        totalFat += meals.dinner.fat || 0;
      }

      // Add snacks macros
      meals.snacks?.forEach(snack => {
        totalCalories += snack.calories || 0;
        totalProtein += snack.protein || 0;
        totalCarbs += snack.carbs || 0;
        totalFat += snack.fat || 0;
      });
    });

    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat
    };
  }
}

// Custom error classes
class MealPlanValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any, public reason?: string) {
    super(message);
    this.name = 'MealPlanValidationError';
  }
}