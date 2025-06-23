// Enhanced navigation hooks with type safety and centralized patterns
// Provides convenient hooks for accessing navigation functionality

import { useNavigation as useRNNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { navigationService, ROUTE_NAMES, NavigationPatterns } from './NavigationService';
import { AllParamList, NavigationTypeGuards, RouteParams } from '../../types/navigation';
import { RecipeData } from '../ai/gemini';
import { MealPlanContext } from '../mealPlan/types';

/**
 * Enhanced navigation hook with type safety and centralized methods
 */
export function useEnhancedNavigation() {
  const navigation = useRNNavigation();
  const route = useRoute();

  // Initialize navigation service reference
  useMemo(() => {
    if (navigation) {
      navigationService.setNavigationRef({ current: navigation as any });
    }
  }, [navigation]);

  // Core navigation methods with type safety
  const navigateToRecipeDetail = useCallback((
    recipe: RecipeData,
    options?: {
      fromMealPlanner?: boolean;
      mealPlanContext?: MealPlanContext;
    }
  ) => {
    navigationService.navigateToRecipeDetail(recipe, options);
  }, []);

  const navigateToRecipeGeneration = useCallback((options?: {
    fromMealPlanner?: boolean;
    mealPlanContext?: MealPlanContext;
  }) => {
    navigationService.navigateToRecipeGeneration(options);
  }, []);

  const navigateToCookingCoach = useCallback((recipe: RecipeData) => {
    navigationService.navigateToCookingCoach(recipe);
  }, []);

  // Authentication navigation
  const navigateToLogin = useCallback(() => {
    navigationService.navigateToLogin();
  }, []);

  const navigateToSignUp = useCallback(() => {
    navigationService.navigateToSignUp();
  }, []);

  // Onboarding navigation
  const navigateToNextOnboardingStep = useCallback(() => {
    const currentRouteName = route.name as keyof AllParamList;
    if (currentRouteName in ROUTE_NAMES) {
      navigationService.navigateToNextOnboardingStep(currentRouteName as any);
    }
  }, [route.name]);

  // Utility navigation
  const navigateToUpgrade = useCallback(() => {
    navigationService.navigateToUpgrade();
  }, []);

  const goBack = useCallback(() => {
    navigationService.goBack();
  }, []);

  const popToTop = useCallback(() => {
    navigationService.popToTop();
  }, []);

  // Route information
  const currentRoute = useMemo(() => navigationService.getCurrentRoute(), [route]);
  const canGoBack = useMemo(() => navigationService.canGoBack(), [navigation]);

  // Parameter validation helpers
  const getRecipeParam = useCallback((): RecipeData | null => {
    if (NavigationTypeGuards.hasRecipeParam(route.params)) {
      return route.params.recipe;
    }
    return null;
  }, [route.params]);

  const getMealPlanContext = useCallback((): MealPlanContext | null => {
    if (NavigationTypeGuards.hasMealPlanContext(route.params)) {
      return route.params.mealPlanContext;
    }
    return null;
  }, [route.params]);

  const isFromMealPlanner = useCallback((): boolean => {
    if (NavigationTypeGuards.isFromMealPlanner(route.params)) {
      return route.params.fromMealPlanner === true;
    }
    return false;
  }, [route.params]);

  return {
    // Core navigation
    navigateToRecipeDetail,
    navigateToRecipeGeneration,
    navigateToCookingCoach,
    navigateToLogin,
    navigateToSignUp,
    navigateToNextOnboardingStep,
    navigateToUpgrade,
    goBack,
    popToTop,

    // Route information
    currentRoute,
    canGoBack,
    routeName: route.name,
    routeParams: route.params,

    // Parameter utilities
    getRecipeParam,
    getMealPlanContext,
    isFromMealPlanner,

    // Pattern shortcuts
    startRecipeFlow: NavigationPatterns.startRecipeFlow,
    handleAuthFlow: NavigationPatterns.handleAuthFlow,
    returnToMealPlanner: NavigationPatterns.returnToMealPlanner,
    viewRecipeDetail: NavigationPatterns.viewRecipeDetail,

    // Advanced utilities
    navigationService,
    ROUTE_NAMES,
  };
}

/**
 * Hook for type-safe route parameters
 */
export function useRouteParams<T extends keyof AllParamList>(): RouteParams<T> | undefined {
  const route = useRoute();
  return route.params as RouteParams<T> | undefined;
}

/**
 * Hook for navigation patterns specific to recipe flows
 */
export function useRecipeNavigation() {
  const { navigateToRecipeDetail, navigateToCookingCoach, getRecipeParam } = useEnhancedNavigation();

  const startCookingSession = useCallback(() => {
    const recipe = getRecipeParam();
    if (recipe) {
      navigateToCookingCoach(recipe);
    }
  }, [getRecipeParam, navigateToCookingCoach]);

  const viewRecipeFromSearch = useCallback((recipe: RecipeData) => {
    navigateToRecipeDetail(recipe);
  }, [navigateToRecipeDetail]);

  const viewRecipeFromMealPlan = useCallback((
    recipe: RecipeData,
    mealPlanContext: MealPlanContext
  ) => {
    navigateToRecipeDetail(recipe, {
      fromMealPlanner: true,
      mealPlanContext,
    });
  }, [navigateToRecipeDetail]);

  return {
    startCookingSession,
    viewRecipeFromSearch,
    viewRecipeFromMealPlan,
    currentRecipe: getRecipeParam(),
  };
}

/**
 * Hook for navigation patterns specific to meal planning flows
 */
export function useMealPlanNavigation() {
  const { navigateToRecipeGeneration, getMealPlanContext, isFromMealPlanner, returnToMealPlanner } = useEnhancedNavigation();

  const startRecipeGenerationForMealPlan = useCallback((mealPlanContext: MealPlanContext) => {
    navigateToRecipeGeneration({
      fromMealPlanner: true,
      mealPlanContext,
    });
  }, [navigateToRecipeGeneration]);

  const backToMealPlannerIfNeeded = useCallback(() => {
    if (isFromMealPlanner()) {
      returnToMealPlanner();
    }
  }, [isFromMealPlanner, returnToMealPlanner]);

  return {
    startRecipeGenerationForMealPlan,
    backToMealPlannerIfNeeded,
    currentMealPlanContext: getMealPlanContext(),
    isFromMealPlanner: isFromMealPlanner(),
  };
}

/**
 * Hook for navigation patterns specific to onboarding flows
 */
export function useOnboardingNavigation() {
  const { navigateToNextOnboardingStep, currentRoute } = useEnhancedNavigation();

  const proceedToNextStep = useCallback(() => {
    navigateToNextOnboardingStep();
  }, [navigateToNextOnboardingStep]);

  const isOnOnboardingScreen = useMemo(() => {
    const onboardingRoutes = [
      ROUTE_NAMES.Skills,
      ROUTE_NAMES.DietaryRestrictions,
      ROUTE_NAMES.MacroGoals,
      ROUTE_NAMES.Kitchen,
    ];
    return onboardingRoutes.includes(currentRoute as any);
  }, [currentRoute]);

  return {
    proceedToNextStep,
    isOnOnboardingScreen,
    currentStep: currentRoute,
  };
}

/**
 * Hook for conditional navigation with upgrade checks
 */
export function useConditionalNavigation() {
  const { navigateToUpgrade } = useEnhancedNavigation();

  const navigateWithUpgradeCheck = useCallback((
    navigationFn: () => void,
    isPremiumFeature: boolean = false,
    userIsPremium: boolean = false
  ) => {
    if (isPremiumFeature && !userIsPremium) {
      navigateToUpgrade();
      return false;
    }
    
    navigationFn();
    return true;
  }, [navigateToUpgrade]);

  return {
    navigateWithUpgradeCheck,
  };
}