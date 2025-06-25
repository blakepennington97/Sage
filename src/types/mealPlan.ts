export interface MealPlanRecipe {
  id: string;
  recipe_id: string;
  recipe_name: string;
  estimated_time: string;
  difficulty_level: number;
  servings: number; // Total servings the recipe makes
  servingsForMeal?: number; // Servings allocated to this specific meal slot
  // Quick access to recipe content for cooking
  recipe_content?: string;
  recipe_data?: any;
}

export interface DayMealPlan {
  date: string; // ISO date string (YYYY-MM-DD)
  breakfast?: MealPlanRecipe;
  lunch?: MealPlanRecipe;
  dinner?: MealPlanRecipe;
  snacks?: MealPlanRecipe[];
}

export interface WeeklyMealPlan {
  id: string;
  user_id: string;
  week_start_date: string; // ISO date string (YYYY-MM-DD) - Monday
  title: string;
  days: DayMealPlan[];
  created_at: string;
  updated_at: string;
  is_active: boolean; // Only one active plan per user
}

export interface MealPlanGroceryItem {
  name: string;
  amount: string;
  category: string;
  recipe_sources: string[]; // Array of recipe names that need this ingredient
  checked: boolean;
}

export interface MealPlanGroceryList {
  id: string;
  meal_plan_id: string;
  items: MealPlanGroceryItem[];
  generated_at: string;
  updated_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

// Utility types for UI
export interface MealSlot {
  date: string;
  mealType: MealType;
  recipe?: MealPlanRecipe;
}

export interface CreateMealPlanRequest {
  title: string;
  week_start_date: string;
}

export interface UpdateMealPlanRequest {
  meal_plan_id: string;
  date: string;
  meal_type: MealType;
  recipe_id?: string; // undefined to remove recipe
  servings?: number;
  servingsForMeal?: number; // Servings for this specific meal slot
}

// Weekly view helpers
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

export const MEAL_TYPES = [
  'breakfast',
  'lunch', 
  'dinner',
  'snacks'
] as const;

// Utility functions
export const formatDateForMealPlan = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getWeekStartDate = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return formatDateForMealPlan(d);
};

export const getWeekDates = (weekStartDate: string): string[] => {
  const dates: string[] = [];
  const startDate = new Date(weekStartDate);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(formatDateForMealPlan(date));
  }
  
  return dates;
};

export const getMealPlanForDate = (mealPlan: WeeklyMealPlan, date: string): DayMealPlan | undefined => {
  return mealPlan.days.find(day => day.date === date);
};

export const createEmptyWeeklyMealPlan = (title: string, weekStartDate: string): Omit<WeeklyMealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'> => {
  const weekDates = getWeekDates(weekStartDate);
  
  return {
    week_start_date: weekStartDate,
    title,
    days: weekDates.map(date => ({
      date,
      snacks: []
    })),
    is_active: true
  };
};