import React, { useState, useEffect } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Box, Text, Button, LoadingSpinner, ErrorMessage } from '../components/ui';
import { WeeklyMealGrid } from '../components/WeeklyMealGrid';
import { PremiumGate } from '../components/PremiumGate';
import { BottomSheet, RecipeCard } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { useRecipes } from '../hooks/useRecipes';
import { MealPlanService } from '../services/mealPlanService';
import { HapticService } from '../services/haptics';
import { ErrorHandler } from '../utils/errorHandling';
import { 
  WeeklyMealPlan, 
  MealType, 
  CreateMealPlanRequest,
  getWeekStartDate,
  formatDateForMealPlan
} from '../types/mealPlan';

export const MealPlannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { recipes } = useRecipes();
  const insets = useSafeAreaInsets();
  
  const [activeMealPlan, setActiveMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<{date: string, mealType: MealType} | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock premium status - in real app, this would come from subscription service
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadActiveMealPlan();
  }, [user]);

  const loadActiveMealPlan = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const mealPlan = await MealPlanService.getActiveMealPlan(user.id);
      setActiveMealPlan(mealPlan);
    } catch (err) {
      const error = ErrorHandler.handleError(err, 'loading meal plan');
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActiveMealPlan();
    setIsRefreshing(false);
  };

  const handleCreateMealPlan = async () => {
    if (!isPremium) {
      setShowPremiumGate(true);
      return;
    }

    if (!user) return;

    try {
      HapticService.medium();
      
      const weekStartDate = getWeekStartDate(new Date());
      const request: CreateMealPlanRequest = {
        title: `Week of ${new Date(weekStartDate).toLocaleDateString()}`,
        week_start_date: weekStartDate
      };

      const newMealPlan = await MealPlanService.createMealPlan(user.id, request);
      setActiveMealPlan(newMealPlan);
      
      HapticService.success();
      ErrorHandler.showSuccessToast('Meal plan created successfully!');
    } catch (err) {
      ErrorHandler.handleError(err, 'creating meal plan');
    }
  };

  const handleAddRecipe = (date: string, mealType: MealType) => {
    if (!isPremium) {
      setShowPremiumGate(true);
      return;
    }

    HapticService.light();
    setSelectedMealSlot({ date, mealType });
    setShowRecipeSelector(true);
  };

  const handleSelectRecipe = async (recipeId: string) => {
    if (!activeMealPlan || !selectedMealSlot || !user) return;

    try {
      HapticService.medium();
      
      const updatedMealPlan = await MealPlanService.updateMealPlan({
        meal_plan_id: activeMealPlan.id,
        date: selectedMealSlot.date,
        meal_type: selectedMealSlot.mealType,
        recipe_id: recipeId,
        servings: 2 // Default servings
      });

      setActiveMealPlan(updatedMealPlan);
      setShowRecipeSelector(false);
      setSelectedMealSlot(null);
      
      HapticService.success();
      ErrorHandler.showSuccessToast('Recipe added to meal plan!');
    } catch (err) {
      ErrorHandler.handleError(err, 'adding recipe to meal plan');
    }
  };

  const handleRemoveRecipe = async (date: string, mealType: MealType) => {
    if (!activeMealPlan) return;

    Alert.alert(
      'Remove Recipe',
      'Are you sure you want to remove this recipe from your meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              HapticService.medium();
              
              const updatedMealPlan = await MealPlanService.updateMealPlan({
                meal_plan_id: activeMealPlan.id,
                date,
                meal_type: mealType,
                // No recipe_id = remove
              });

              setActiveMealPlan(updatedMealPlan);
              HapticService.success();
            } catch (err) {
              ErrorHandler.handleError(err, 'removing recipe from meal plan');
            }
          }
        }
      ]
    );
  };

  const handleViewRecipe = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      navigation.navigate('RecipeDetail', { recipe });
    }
  };

  const handleUpgradeToPremium = () => {
    // In real app, this would navigate to subscription screen
    Alert.alert(
      'Upgrade to Premium',
      'This would open the subscription flow. For demo purposes, we\'ll enable premium features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable Premium (Demo)',
          onPress: () => {
            setIsPremium(true);
            setShowPremiumGate(false);
            ErrorHandler.showSuccessToast('Premium features enabled!');
          }
        }
      ]
    );
  };

  if (showPremiumGate) {
    return (
      <PremiumGate
        feature="Meal Planning"
        description="Plan your entire week of meals, generate smart grocery lists, and never wonder 'what's for dinner?' again."
        onUpgrade={handleUpgradeToPremium}
        onClose={() => setShowPremiumGate(false)}
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading your meal plan..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        variant="fullscreen"
        title="Failed to Load Meal Plan"
        message={error}
        onRetry={loadActiveMealPlan}
      />
    );
  }

  if (!activeMealPlan) {
    return (
      <Box 
        flex={1} 
        backgroundColor="mainBackground" 
        justifyContent="center" 
        alignItems="center"
        padding="xl"
      >
        <Text fontSize={64} marginBottom="lg">📅</Text>
        <Text variant="h1" textAlign="center" marginBottom="sm">
          Plan Your Week
        </Text>
        <Text variant="body" color="secondaryText" textAlign="center" marginBottom="xl">
          Create a weekly meal plan to organize your cooking and never wonder what's for dinner again.
        </Text>
        
        <Button variant="primary" onPress={handleCreateMealPlan}>
          <Text variant="button" color="primaryButtonText">
            Create This Week's Plan
          </Text>
        </Button>
        
        {!isPremium && (
          <Text variant="caption" color="tertiaryText" textAlign="center" marginTop="md">
            Premium feature - Start your free trial to begin meal planning
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      {/* Header */}
      <Box 
        backgroundColor="surface" 
        paddingHorizontal="lg" 
        paddingVertical="md"
        borderBottomWidth={1}
        borderBottomColor="border"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Text variant="h2" color="primaryText" marginBottom="xs">
          {activeMealPlan.title}
        </Text>
        <Text variant="caption" color="secondaryText">
          Week of {new Date(activeMealPlan.week_start_date).toLocaleDateString()}
        </Text>
      </Box>

      {/* Meal Grid */}
      <WeeklyMealGrid
        mealPlan={activeMealPlan}
        onAddRecipe={handleAddRecipe}
        onViewRecipe={handleViewRecipe}
        onRemoveRecipe={handleRemoveRecipe}
      />

      {/* Recipe Selector Sheet */}
      <BottomSheet
        isVisible={showRecipeSelector}
        onClose={() => {
          setShowRecipeSelector(false);
          setSelectedMealSlot(null);
        }}
        title={`Add ${selectedMealSlot?.mealType} for ${selectedMealSlot?.date}`}
      >
        <Box padding="md">
          {recipes.length === 0 ? (
            <Box alignItems="center" padding="xl">
              <Text variant="body" color="secondaryText" textAlign="center" marginBottom="lg">
                You don't have any saved recipes yet.
              </Text>
              <Button 
                variant="primary" 
                onPress={() => {
                  setShowRecipeSelector(false);
                  navigation.navigate('RecipeGeneration');
                }}
              >
                <Text variant="button" color="primaryButtonText">
                  Create Your First Recipe
                </Text>
              </Button>
            </Box>
          ) : (
            <>
              {/* Generate New Recipe Option */}
              <Box marginBottom="lg" padding="md" backgroundColor="surface" borderRadius="lg" borderWidth={1} borderColor="border">
                <Box flexDirection="row" alignItems="center" marginBottom="sm">
                  <Text fontSize={24} marginRight="sm">✨</Text>
                  <Text variant="h3" flex={1}>Generate New Recipe</Text>
                </Box>
                <Text variant="body" color="secondaryText" marginBottom="md">
                  Create a personalized recipe just for this meal
                </Text>
                <Button 
                  variant="primary" 
                  onPress={() => {
                    setShowRecipeSelector(false);
                    navigation.navigate('RecipeGeneration');
                  }}
                >
                  <Text variant="button" color="primaryButtonText">
                    🔥 Generate Recipe
                  </Text>
                </Button>
              </Box>

              {/* Divider */}
              <Box flexDirection="row" alignItems="center" marginBottom="lg">
                <Box flex={1} height={1} backgroundColor="border" />
                <Text variant="caption" color="secondaryText" marginHorizontal="md">
                  OR CHOOSE FROM SAVED
                </Text>
                <Box flex={1} height={1} backgroundColor="border" />
              </Box>

              {/* Existing Recipes */}
              {recipes.map((recipe) => (
                <Box key={recipe.id} marginBottom="md">
                  <RecipeCard
                    recipe={recipe}
                    onPress={() => handleSelectRecipe(recipe.id)}
                  />
                </Box>
              ))}
            </>
          )}
        </Box>
      </BottomSheet>
    </Box>
  );
};