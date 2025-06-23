// Centralized navigation exports
// This file provides easy access to all navigation utilities

export {
  NavigationService,
  navigationService,
  useNavigationService,
  ROUTE_NAMES,
  NavigationPatterns,
  type INavigationService,
  type NavigationParams,
} from './NavigationService';

export {
  useEnhancedNavigation,
  useRouteParams,
  useRecipeNavigation,
  useMealPlanNavigation,
  useOnboardingNavigation,
  useConditionalNavigation,
} from './useNavigation';

// Re-export navigation types for convenience
export type {
  AuthStackParamList,
  OnboardingStackParamList,
  AppStackParamList,
  MainTabsParamList,
  RootStackParamList,
  AllParamList,
  NavigationScreenProps,
  RouteParams,
} from '../../types/navigation';

export { NavigationTypeGuards } from '../../types/navigation';