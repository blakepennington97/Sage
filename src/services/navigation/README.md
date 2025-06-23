# Centralized Navigation Service

A comprehensive navigation service that provides type-safe navigation patterns, centralized route management, and consistent navigation flows throughout the Sage application.

## Overview

The navigation service centralizes all navigation logic to provide:
- **Type Safety**: Full TypeScript support with comprehensive parameter validation
- **Consistency**: Unified navigation patterns across the entire app
- **Maintainability**: Centralized route names and parameters
- **Developer Experience**: Specialized hooks for different navigation flows

## Architecture

### Core Components

1. **NavigationService** - Main service class with navigation methods
2. **ROUTE_NAMES** - Centralized route constants
3. **Navigation Hooks** - Specialized hooks for different use cases
4. **Type Definitions** - Comprehensive TypeScript support

### Key Features

- ✅ **Type-safe navigation** with full parameter validation
- ✅ **Centralized route constants** to prevent typos
- ✅ **Specialized navigation flows** for recipes, meal planning, onboarding
- ✅ **Conditional navigation** with upgrade checks
- ✅ **Navigation analytics** and debugging support
- ✅ **Batch operations** for complex navigation scenarios

## Usage

### Basic Navigation

```typescript
import { useEnhancedNavigation, ROUTE_NAMES } from '@/services/navigation';

function MyComponent() {
  const { navigateToRecipeDetail, goBack } = useEnhancedNavigation();

  const handleRecipePress = (recipe: RecipeData) => {
    navigateToRecipeDetail(recipe);
  };

  return (
    <View>
      <Button onPress={handleRecipePress} title="View Recipe" />
      <Button onPress={goBack} title="Go Back" />
    </View>
  );
}
```

### Recipe Navigation

```typescript
import { useRecipeNavigation } from '@/services/navigation';

function RecipeScreen() {
  const { startCookingSession, viewRecipeFromMealPlan } = useRecipeNavigation();

  const handleStartCooking = () => {
    startCookingSession(); // Automatically uses current recipe
  };

  const handleViewFromMealPlan = (recipe: RecipeData, context: MealPlanContext) => {
    viewRecipeFromMealPlan(recipe, context);
  };

  return (
    <View>
      <Button onPress={handleStartCooking} title="Start Cooking" />
    </View>
  );
}
```

### Meal Plan Navigation

```typescript
import { useMealPlanNavigation } from '@/services/navigation';

function MealPlannerScreen() {
  const { startRecipeGenerationForMealPlan } = useMealPlanNavigation();

  const handleAddRecipe = (dayIndex: number, mealType: string) => {
    const mealPlanContext = {
      dayIndex,
      mealType,
      weekStartDate: getCurrentWeekStart(),
    };

    startRecipeGenerationForMealPlan(mealPlanContext);
  };

  return (
    <View>
      <Button onPress={() => handleAddRecipe(0, 'breakfast')} title="Add Breakfast" />
    </View>
  );
}
```

### Onboarding Navigation

```typescript
import { useOnboardingNavigation } from '@/services/navigation';

function OnboardingScreen() {
  const { proceedToNextStep, isOnOnboardingScreen } = useOnboardingNavigation();

  const handleContinue = () => {
    proceedToNextStep(); // Automatically navigates to next onboarding step
  };

  return (
    <View>
      {isOnOnboardingScreen && (
        <Button onPress={handleContinue} title="Continue" />
      )}
    </View>
  );
}
```

### Conditional Navigation with Upgrade Checks

```typescript
import { useConditionalNavigation } from '@/services/navigation';

function PremiumFeatureScreen() {
  const { navigateWithUpgradeCheck } = useConditionalNavigation();
  const { navigateToRecipeGeneration } = useEnhancedNavigation();

  const handlePremiumFeature = () => {
    const success = navigateWithUpgradeCheck(
      () => navigateToRecipeGeneration(),
      true, // Is premium feature
      userIsPremium // User's premium status
    );

    if (!success) {
      // User was redirected to upgrade screen
      console.log('User needs to upgrade');
    }
  };

  return (
    <Button onPress={handlePremiumFeature} title="Use Premium Feature" />
  );
}
```

## Navigation Patterns

### Recipe Flow Patterns

```typescript
import { NavigationPatterns } from '@/services/navigation';

// Start complete recipe generation flow
NavigationPatterns.startRecipeFlow({
  fromMealPlanner: true,
  mealPlanContext: { dayIndex: 0, mealType: 'breakfast' }
});

// View recipe with analytics
NavigationPatterns.viewRecipeDetail(recipe, 'RecipeBook');

// Return to meal planner
NavigationPatterns.returnToMealPlanner();
```

### Authentication Patterns

```typescript
// Handle authentication flow
NavigationPatterns.handleAuthFlow(true); // true for sign up, false for login

// Reset to authentication
navigationService.resetToAuth();
```

## Route Constants

All route names are centralized in `ROUTE_NAMES`:

```typescript
import { ROUTE_NAMES } from '@/services/navigation';

// Instead of hardcoded strings
navigation.navigate('RecipeDetail', { recipe });

// Use centralized constants
navigation.navigate(ROUTE_NAMES.RecipeDetail, { recipe });
```

### Available Routes

```typescript
const ROUTE_NAMES = {
  // Root Navigation
  Auth: 'Auth',
  Onboarding: 'Onboarding',
  App: 'App',

  // Auth Stack
  Login: 'Login',
  SignUp: 'SignUp',

  // Onboarding Stack
  Skills: 'Skills',
  DietaryRestrictions: 'DietaryRestrictions',
  MacroGoals: 'MacroGoals',
  Kitchen: 'Kitchen',

  // Main Tabs
  Main: 'Main',
  RecipeBook: 'RecipeBook',
  MealPlanner: 'MealPlanner',
  Settings: 'Settings',

  // App Stack
  RecipeDetail: 'RecipeDetail',
  RecipeGeneration: 'RecipeGeneration',
  CookingCoach: 'CookingCoach',
  Upgrade: 'Upgrade',
};
```

## Type Safety

### Parameter Types

```typescript
// Comprehensive parameter typing
interface NavigationParams {
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
  // ... other routes
}
```

### Type Guards

```typescript
import { NavigationTypeGuards } from '@/services/navigation';

// Validate route parameters
if (NavigationTypeGuards.hasRecipeParam(route.params)) {
  const recipe = route.params.recipe; // TypeScript knows this is RecipeData
}

if (NavigationTypeGuards.isFromMealPlanner(route.params)) {
  const fromMealPlanner = route.params.fromMealPlanner; // TypeScript knows this is boolean
}
```

## Advanced Features

### Navigation Analytics

```typescript
// Automatic navigation logging in development
navigationService.logNavigation('RecipeBook', 'RecipeDetail', { recipe: recipe.name });
```

### Batch Operations

```typescript
// Reset navigation state
navigationService.resetToApp();
navigationService.resetToAuth();
navigationService.resetToOnboarding();
```

### Utility Methods

```typescript
const currentRoute = navigationService.getCurrentRoute();
const canGoBack = navigationService.canGoBack();
const isOnboarding = navigationService.isOnboardingComplete();
```

## Migration Guide

### From Direct Navigation

```typescript
// OLD - Direct navigation calls
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('RecipeDetail', { recipe });

// NEW - Centralized service
import { useEnhancedNavigation } from '@/services/navigation';

const { navigateToRecipeDetail } = useEnhancedNavigation();
navigateToRecipeDetail(recipe);
```

### From Hardcoded Routes

```typescript
// OLD - Hardcoded route strings
navigation.navigate('RecipeDetail', { recipe });

// NEW - Centralized constants
import { ROUTE_NAMES } from '@/services/navigation';
navigation.navigate(ROUTE_NAMES.RecipeDetail, { recipe });
```

## Benefits

### Type Safety
- Prevents navigation errors at compile time
- Comprehensive parameter validation
- IntelliSense support for all navigation methods

### Consistency
- Unified navigation patterns across the app
- Centralized route management
- Consistent parameter passing

### Maintainability
- Single source of truth for navigation logic
- Easy to refactor route names and parameters
- Clear separation of navigation concerns

### Developer Experience
- Specialized hooks for different use cases
- Rich TypeScript support
- Built-in debugging and analytics

## Best Practices

1. **Always use centralized route constants** instead of hardcoded strings
2. **Use specialized hooks** for specific navigation flows
3. **Validate parameters** using type guards when needed
4. **Leverage conditional navigation** for premium features
5. **Use navigation patterns** for common flows
6. **Initialize navigation service** in your root component

## Integration with Existing Code

The navigation service is designed to work alongside existing React Navigation code. You can gradually migrate to the centralized service while maintaining compatibility with existing navigation patterns.

This centralized approach provides a robust foundation for navigation that scales with your application's growth while maintaining type safety and consistency.