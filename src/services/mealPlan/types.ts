// Centralized meal plan types and data structures

export interface MealPlanDay {
  date: string; // ISO date string
  meals: {
    breakfast?: MealSlot;
    lunch?: MealSlot;
    dinner?: MealSlot;
    snacks?: MealSlot[];
  };
}

export interface MealSlot {
  id: string;
  recipeId?: string;
  recipeName?: string;
  servings?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  scheduledTime?: string; // ISO time string
  notes?: string;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStartDate: string; // ISO date string (Monday)
  days: MealPlanDay[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number; // For optimistic concurrency control
}

export interface MealPlanCreateRequest {
  userId: string;
  weekStartDate: string;
  days?: MealPlanDay[];
}

export interface MealPlanUpdateRequest {
  id: string;
  days: MealPlanDay[];
  version: number; // For conflict detection
}

export interface MealSlotUpdate {
  dayIndex: number; // 0-6 (Monday-Sunday)
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  slotIndex?: number; // For snacks array
  slot: Partial<MealSlot>;
  userId?: string; // Optional for internal use
  weekStartDate?: string; // Optional for internal use
}

export interface MealSlotBatchUpdate {
  updates: MealSlotUpdate[];
  version: number;
  userId?: string; // Optional for internal use
  weekStartDate?: string; // Optional for internal use
}

// Cache-specific types
export interface MealPlanCacheEntry {
  data: MealPlan;
  lastModified: number;
  optimisticUpdates: string[]; // Track pending mutations
}

// Query key factory
export const mealPlanQueryKeys = {
  all: ['mealPlans'] as const,
  byUser: (userId: string) => ['mealPlans', 'user', userId] as const,
  byWeek: (userId: string, weekStartDate: string) => 
    ['mealPlans', 'week', userId, weekStartDate] as const,
  active: (userId: string) => ['mealPlans', 'active', userId] as const,
} as const;

// Mutation types
export type MealPlanMutation = 
  | { type: 'create'; payload: MealPlanCreateRequest }
  | { type: 'update'; payload: MealPlanUpdateRequest }
  | { type: 'updateSlot'; payload: { planId: string } & MealSlotUpdate }
  | { type: 'batchUpdate'; payload: { planId: string } & MealSlotBatchUpdate }
  | { type: 'delete'; payload: { planId: string } };

// Error types
export interface MealPlanConflictError extends Error {
  name: 'MealPlanConflictError';
  currentVersion: number;
  expectedVersion: number;
  conflictingChanges: Partial<MealPlan>;
}

export interface MealPlanValidationError extends Error {
  name: 'MealPlanValidationError';
  field: string;
  value: any;
  reason: string;
}