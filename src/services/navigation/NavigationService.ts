// Centralized navigation service for consistent navigation patterns
// This service provides type-safe navigation methods and centralized route management

import { NavigationProp, NavigationState, PartialState } from '@react-navigation/native';
import { 
  AuthStackParamList, 
  OnboardingStackParamList, 
  AppStackParamList, 
  MainTabsParamList,
  RootStackParamList 
} from '../../types/navigation';
import { RecipeData } from '../ai/gemini';
import { MealPlanContext } from '../mealPlan/types';

/**
 * Centralized route constants to prevent typos and enable refactoring
 */
export const ROUTE_NAMES = {
  // Root Navigation
  Auth: 'Auth' as const,
  Onboarding: 'Onboarding' as const,
  App: 'App' as const,

  // Auth Stack
  Login: 'Login' as const,
  SignUp: 'SignUp' as const,

  // Onboarding Stack
  Skills: 'Skills' as const,
  DietaryRestrictions: 'DietaryRestrictions' as const,
  MacroGoals: 'MacroGoals' as const,
  Kitchen: 'Kitchen' as const,

  // Main Tabs
  Main: 'Main' as const,
  RecipeBook: 'RecipeBook' as const,
  MealPlanner: 'MealPlanner' as const,
  Settings: 'Settings' as const,

  // App Stack
  RecipeDetail: 'RecipeDetail' as const,
  RecipeGeneration: 'RecipeGeneration' as const,
  CookingCoach: 'CookingCoach' as const,
  Upgrade: 'Upgrade' as const,
} as const;

/**
 * Type-safe navigation parameters for all routes
 */
export interface NavigationParams {
  // Root Navigation
  [ROUTE_NAMES.Auth]: undefined;
  [ROUTE_NAMES.Onboarding]: undefined;
  [ROUTE_NAMES.App]: undefined;

  // Auth Stack
  [ROUTE_NAMES.Login]: undefined;
  [ROUTE_NAMES.SignUp]: undefined;

  // Onboarding Stack
  [ROUTE_NAMES.Skills]: undefined;
  [ROUTE_NAMES.DietaryRestrictions]: undefined;
  [ROUTE_NAMES.MacroGoals]: undefined;
  [ROUTE_NAMES.Kitchen]: undefined;

  // Main Tabs
  [ROUTE_NAMES.Main]: undefined;
  [ROUTE_NAMES.RecipeBook]: undefined;
  [ROUTE_NAMES.MealPlanner]: undefined;
  [ROUTE_NAMES.Settings]: undefined;

  // App Stack
  [ROUTE_NAMES.RecipeDetail]: {
    recipe: RecipeData;
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  };
  [ROUTE_NAMES.RecipeGeneration]: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  };
  [ROUTE_NAMES.CookingCoach]: {
    recipe: RecipeData;
  };
  [ROUTE_NAMES.Upgrade]: undefined;
}

/**
 * Navigation service interface for type-safe navigation
 */
export interface INavigationService {
  // Core navigation methods
  navigate<T extends keyof NavigationParams>(
    routeName: T,
    params?: NavigationParams[T]
  ): void;
  
  goBack(): void;
  popToTop(): void;
  reset(state: PartialState<NavigationState>): void;

  // Specialized navigation flows
  navigateToRecipeDetail(recipe: RecipeData, options?: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  }): void;

  navigateToRecipeGeneration(options?: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  }): void;

  navigateToCookingCoach(recipe: RecipeData): void;

  // Authentication flow
  navigateToLogin(): void;
  navigateToSignUp(): void;
  navigateToApp(): void;

  // Onboarding flow
  navigateToOnboarding(): void;
  navigateToSkills(): void;
  navigateToNextOnboardingStep(currentStep: keyof OnboardingStackParamList): void;

  // Upgrade flow
  navigateToUpgrade(): void;

  // Utility methods
  getCurrentRoute(): string | undefined;
  canGoBack(): boolean;
  isOnboardingComplete(): boolean;
}

/**
 * Centralized navigation service implementation
 */
export class NavigationService implements INavigationService {
  private navigationRef: React.RefObject<NavigationProp<any>> | null = null;

  /**
   * Set the navigation reference for the service
   */
  setNavigationRef(ref: React.RefObject<NavigationProp<any>>) {
    this.navigationRef = ref;
  }

  /**
   * Get the current navigation instance
   */
  private getNavigation(): NavigationProp<any> {
    if (!this.navigationRef?.current) {
      throw new Error('Navigation ref not set. Call setNavigationRef first.');
    }
    return this.navigationRef.current;
  }

  /**
   * Core navigation methods
   */
  navigate<T extends keyof NavigationParams>(
    routeName: T,
    params?: NavigationParams[T]
  ): void {
    const navigation = this.getNavigation();
    navigation.navigate(routeName as string, params);
  }

  goBack(): void {
    const navigation = this.getNavigation();
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  popToTop(): void {
    const navigation = this.getNavigation();
    if ('popToTop' in navigation) {
      (navigation as any).popToTop();
    }
  }

  reset(state: PartialState<NavigationState>): void {
    const navigation = this.getNavigation();
    navigation.reset(state);
  }

  /**
   * Specialized navigation flows
   */
  navigateToRecipeDetail(recipe: RecipeData, options?: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  }): void {
    this.navigate(ROUTE_NAMES.RecipeDetail, {
      recipe,
      fromMealPlanner: options?.fromMealPlanner,
      mealPlanContext: options?.mealPlanContext,
    });
  }

  navigateToRecipeGeneration(options?: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  }): void {
    this.navigate(ROUTE_NAMES.RecipeGeneration, {
      fromMealPlanner: options?.fromMealPlanner,
      mealPlanContext: options?.mealPlanContext,
    });
  }

  navigateToCookingCoach(recipe: RecipeData): void {
    this.navigate(ROUTE_NAMES.CookingCoach, { recipe });
  }

  /**
   * Authentication flow
   */
  navigateToLogin(): void {
    this.navigate(ROUTE_NAMES.Login);
  }

  navigateToSignUp(): void {
    this.navigate(ROUTE_NAMES.SignUp);
  }

  navigateToApp(): void {
    this.navigate(ROUTE_NAMES.App);
  }

  /**
   * Onboarding flow
   */
  navigateToOnboarding(): void {
    this.navigate(ROUTE_NAMES.Onboarding);
  }

  navigateToSkills(): void {
    this.navigate(ROUTE_NAMES.Skills);
  }

  navigateToNextOnboardingStep(currentStep: keyof OnboardingStackParamList): void {
    const onboardingFlow: (keyof OnboardingStackParamList)[] = [
      'Skills',
      'DietaryRestrictions',
      'MacroGoals',
      'Kitchen'
    ];

    const currentIndex = onboardingFlow.indexOf(currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < onboardingFlow.length) {
      const nextStep = onboardingFlow[nextIndex];
      this.navigate(nextStep);
    } else {
      // Onboarding complete, navigate to main app
      this.navigateToApp();
    }
  }

  /**
   * Upgrade flow
   */
  navigateToUpgrade(): void {
    this.navigate(ROUTE_NAMES.Upgrade);
  }

  /**
   * Utility methods
   */
  getCurrentRoute(): string | undefined {
    try {
      const navigation = this.getNavigation();
      const state = navigation.getState();
      return this.getActiveRouteName(state);
    } catch {
      return undefined;
    }
  }

  private getActiveRouteName(state: NavigationState): string {
    const route = state.routes[state.index];
    
    if (route.state && route.state.routes) {
      return this.getActiveRouteName(route.state as NavigationState);
    }
    
    return route.name;
  }

  canGoBack(): boolean {
    try {
      const navigation = this.getNavigation();
      return navigation.canGoBack();
    } catch {
      return false;
    }
  }

  isOnboardingComplete(): boolean {
    // This would typically check user profile or async storage
    // For now, return true if we're not on an onboarding screen
    const currentRoute = this.getCurrentRoute();
    const onboardingRoutes = ['Skills', 'DietaryRestrictions', 'MacroGoals', 'Kitchen'];
    return !onboardingRoutes.includes(currentRoute || '');
  }

  /**
   * Batch navigation operations
   */
  resetToAuth(): void {
    this.reset({
      index: 0,
      routes: [{ name: ROUTE_NAMES.Auth }],
    });
  }

  resetToOnboarding(): void {
    this.reset({
      index: 0,
      routes: [{ name: ROUTE_NAMES.Onboarding }],
    });
  }

  resetToApp(): void {
    this.reset({
      index: 0,
      routes: [{ name: ROUTE_NAMES.App }],
    });
  }

  /**
   * Navigation analytics and debugging
   */
  logNavigation(from: string, to: string, params?: any): void {
    if (__DEV__ || process.env.NODE_ENV === 'development') {
      console.log(`[Navigation] ${from} → ${to}`, params ? { params } : '');
    }
  }

  /**
   * Conditional navigation helpers
   */
  navigateIfLoggedIn(routeName: keyof NavigationParams, params?: any): boolean {
    // This would check auth state - simplified for now
    try {
      this.navigate(routeName, params);
      return true;
    } catch {
      this.navigateToLogin();
      return false;
    }
  }

  navigateWithUpgradeCheck(routeName: keyof NavigationParams, params?: any): boolean {
    // This would check premium status - simplified for now
    try {
      this.navigate(routeName, params);
      return true;
    } catch {
      this.navigateToUpgrade();
      return false;
    }
  }
}

/**
 * Singleton instance of navigation service
 */
export const navigationService = new NavigationService();

/**
 * React hook for accessing navigation service
 */
export function useNavigationService(): INavigationService {
  return navigationService;
}

/**
 * Common navigation patterns as utility functions
 */
export const NavigationPatterns = {
  /**
   * Complete recipe flow: Generation → Detail → Cooking Coach
   */
  startRecipeFlow: (options?: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  }) => {
    navigationService.navigateToRecipeGeneration(options);
  },

  /**
   * Complete onboarding flow
   */
  startOnboardingFlow: () => {
    navigationService.navigateToOnboarding();
  },

  /**
   * Handle authentication flow
   */
  handleAuthFlow: (isSignUp: boolean = false) => {
    if (isSignUp) {
      navigationService.navigateToSignUp();
    } else {
      navigationService.navigateToLogin();
    }
  },

  /**
   * Navigate back to meal planner with context
   */
  returnToMealPlanner: () => {
    navigationService.navigate(ROUTE_NAMES.MealPlanner);
  },

  /**
   * Navigate to recipe detail with analytics
   */
  viewRecipeDetail: (recipe: RecipeData, source: string, options?: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  }) => {
    navigationService.logNavigation(source, ROUTE_NAMES.RecipeDetail, { recipe: recipe.recipeName });
    navigationService.navigateToRecipeDetail(recipe, options);
  },
} as const;