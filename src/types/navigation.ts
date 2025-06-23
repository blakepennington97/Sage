// Enhanced navigation type definitions for the app
// These types provide comprehensive type safety for all navigation patterns

import { RecipeData } from '../services/ai/gemini';
import { MealPlanContext } from '../services/mealPlan/types';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type OnboardingStackParamList = {
  Skills: undefined;
  DietaryRestrictions: undefined;
  MacroGoals: undefined;
  Kitchen: undefined;
};

export type MainTabsParamList = {
  RecipeBook: undefined;
  MealPlanner: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  Main: undefined;
  RecipeDetail: {
    recipe: RecipeData;
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  };
  RecipeGeneration: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  };
  CookingCoach: {
    recipe: RecipeData;
  };
  Upgrade: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  App: undefined;
};

/**
 * Combined navigation parameter types for type-safe navigation
 */
export type AllParamList = AuthStackParamList & 
  OnboardingStackParamList & 
  AppStackParamList & 
  MainTabsParamList & 
  RootStackParamList;

/**
 * Navigation prop types for screens
 */
export type NavigationScreenProps<T extends keyof AllParamList> = {
  route: {
    params?: AllParamList[T];
    name: T;
    key: string;
  };
  navigation: any; // Will be refined based on specific navigator type
};

/**
 * Route parameter validation types
 */
export type RouteParams<T extends keyof AllParamList> = AllParamList[T];

/**
 * Type guards for navigation parameters
 */
export const NavigationTypeGuards = {
  hasRecipeParam: (params: any): params is { recipe: RecipeData } => {
    return params && typeof params === 'object' && 'recipe' in params;
  },

  hasMealPlanContext: (params: any): params is { mealPlanContext: MealPlanContext } => {
    return params && typeof params === 'object' && 'mealPlanContext' in params;
  },

  isFromMealPlanner: (params: any): params is { fromMealPlanner: boolean } => {
    return params && typeof params === 'object' && 'fromMealPlanner' in params;
  },
} as const;