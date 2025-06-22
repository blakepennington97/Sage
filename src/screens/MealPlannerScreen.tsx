import React, { useState, useEffect, useCallback } from 'react';
import { Alert, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Box, Text, Button, LoadingSpinner, ErrorMessage } from '../components/ui';
import { WeeklyMealGrid } from '../components/WeeklyMealGrid';
import { PremiumGate } from '../components/PremiumGate';
import { BottomSheet, RecipeCard } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { useRecipes } from '../hooks/useRecipes';
import { MealPlanService } from '../services/mealPlanService';
import { HapticService } from '../services/haptics';
import { ErrorHandler } from '../utils/errorHandling';
import { DailyMacroSummary, DailyMacros } from '../components/DailyMacroSummary';
import { AddFoodEntry } from '../components/AddFoodEntry';
import { MealPrepInterface } from '../components/MealPrepInterface';
import { useMealTracking, useMealEntriesForDay, useDailyMacroProgress } from '../hooks/useMealTracking';
import { MacroGoalsEditor, MacroGoals } from '../components/MacroGoalsEditor';
import { useUserProfile } from '../hooks/useUserProfile';
import { 
  WeeklyMealPlan, 
  MealPlanRecipe,
  MealType, 
  CreateMealPlanRequest,
  getWeekStartDate,
  formatDateForMealPlan
} from '../types/mealPlan';

export const MealPlannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, profile } = useAuthStore();
  const { recipes } = useRecipes();
  const insets = useSafeAreaInsets();
  
  const [activeMealPlan, setActiveMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<{date: string, mealType: MealType} | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFoodEntry, setShowFoodEntry] = useState(false);
  const [showMacroSummary, setShowMacroSummary] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateForMealPlan(new Date()));
  const [showMealPrepModal, setShowMealPrepModal] = useState(false);
  const [recipeToClone, setRecipeToClone] = useState<{recipe: MealPlanRecipe, mealType: MealType} | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = this week, 1 = next week, etc.
  const [showMacroGoalsSetup, setShowMacroGoalsSetup] = useState(false);

  // Mock premium status - in real app, this would come from subscription service
  const [isPremium, setIsPremium] = useState(false);

  // Meal tracking hooks
  const { addMealEntry } = useMealTracking();
  const { data: mealEntries } = useMealEntriesForDay(selectedDate);
  const { data: macroProgress } = useDailyMacroProgress(selectedDate);
  const { setMacroGoals, isLoading: macroLoading } = useUserProfile();

  const loadActiveMealPlan = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Calculate the target week date based on offset
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (currentWeekOffset * 7));
      const weekStartDate = getWeekStartDate(targetDate);
      
      // Try to get existing meal plan for this week
      let mealPlan = await MealPlanService.getMealPlanByWeek(user.id, weekStartDate);
      
      // If no meal plan exists for this week, create one
      if (!mealPlan && currentWeekOffset >= 0) {
        const request: CreateMealPlanRequest = {
          title: currentWeekOffset === 0 
            ? `This Week (${new Date(weekStartDate).toLocaleDateString()})`
            : `Week of ${new Date(weekStartDate).toLocaleDateString()}`,
          week_start_date: weekStartDate
        };
        mealPlan = await MealPlanService.createMealPlan(user.id, request);
      }
      
      setActiveMealPlan(mealPlan);
    } catch (err) {
      const error = ErrorHandler.handleError(err, 'loading meal plan');
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWeekOffset]);

  useEffect(() => {
    loadActiveMealPlan();
  }, [loadActiveMealPlan]);

  // Refresh meal plan when screen comes into focus (e.g., returning from recipe generation)
  useFocusEffect(
    useCallback(() => {
      loadActiveMealPlan();
    }, [loadActiveMealPlan])
  );

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
    
    // Show options: Add Recipe or Add Food Item
    Alert.alert(
      "Add to Meal Plan",
      "What would you like to add?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "📖 Recipe",
          onPress: () => setShowRecipeSelector(true)
        },
        {
          text: "🔍 Food Item",
          onPress: () => {
            setSelectedDate(date);
            setShowFoodEntry(true);
          }
        }
      ]
    );
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

  const handleCloneRecipe = (recipe: MealPlanRecipe, mealType: MealType) => {
    setRecipeToClone({ recipe, mealType });
    setShowMealPrepModal(true);
    HapticService.light();
  };

  const generateSmartSuggestions = () => {
    if (!activeMealPlan || !profile) return [];
    
    // Analyze current meal plan for gaps and patterns
    const suggestions = [];
    const weekDates = require('../types/mealPlan').getWeekDates(activeMealPlan.week_start_date);
    
    // Count current meals per type
    const mealCounts = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
    activeMealPlan.days.forEach(day => {
      if (day.breakfast) mealCounts.breakfast++;
      if (day.lunch) mealCounts.lunch++;
      if (day.dinner) mealCounts.dinner++;
      if (day.snacks?.length) mealCounts.snacks += day.snacks.length;
    });

    // Suggest based on meal frequency
    if (mealCounts.breakfast < 5) {
      suggestions.push({
        type: 'meal_frequency',
        title: '🍳 Morning Fuel Needed',
        description: `You only have ${mealCounts.breakfast} breakfasts planned. Add quick, protein-rich morning meals?`,
        action: 'Generate breakfast recipes',
        priority: 'high'
      });
    }

    if (mealCounts.dinner < 6) {
      suggestions.push({
        type: 'meal_frequency', 
        title: '🍽️ Dinner Planning',
        description: `Plan ${7 - mealCounts.dinner} more dinners for complete week coverage.`,
        action: 'Suggest dinner recipes',
        priority: 'medium'
      });
    }

    // Suggest meal prep opportunities
    const hasRepeatedRecipes = activeMealPlan.days.some(day => 
      activeMealPlan.days.some(otherDay => 
        day.date !== otherDay.date && 
        day.dinner?.recipe_id === otherDay.dinner?.recipe_id
      )
    );

    if (!hasRepeatedRecipes && mealCounts.dinner >= 4) {
      suggestions.push({
        type: 'meal_prep',
        title: '📋 Meal Prep Opportunity',
        description: 'Make cooking easier by using the same recipe for multiple days.',
        action: 'Clone a recipe',
        priority: 'low'
      });
    }

    // Suggest nutritional balance
    if (macroProgress?.goal_protein && macroProgress.total_protein < macroProgress.goal_protein * 0.8) {
      suggestions.push({
        type: 'nutrition',
        title: '💪 Protein Boost Needed',
        description: 'Your current meal plan may be low in protein. Add protein-rich options?',
        action: 'Find high-protein recipes',
        priority: 'high'
      });
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
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

  const handleFoodAdded = async (foodData: any) => {
    try {
      await addMealEntry(
        foodData,
        foodData.quantity,
        foodData.mealType,
        foodData.date
      );
      setShowFoodEntry(false);
      setSelectedMealSlot(null);
      HapticService.success();
      ErrorHandler.showSuccessToast('Food item added successfully!');
    } catch (error) {
      ErrorHandler.handleError(error, 'adding food item');
    }
  };

  const getDailyMacros = (): DailyMacros | null => {
    if (!profile?.macro_goals_set || !macroProgress) return null;
    
    return {
      calories: {
        current: macroProgress.total_calories || 0,
        goal: macroProgress.goal_calories || 2000,
      },
      protein: {
        current: macroProgress.total_protein || 0,
        goal: macroProgress.goal_protein || 100,
      },
      carbs: {
        current: macroProgress.total_carbs || 0,
        goal: macroProgress.goal_carbs || 200,
      },
      fat: {
        current: macroProgress.total_fat || 0,
        goal: macroProgress.goal_fat || 70,
      },
    };
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
        <Box>
          {/* Week Navigation */}
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="sm">
            <TouchableOpacity 
              onPress={() => setCurrentWeekOffset(currentWeekOffset - 1)}
              disabled={currentWeekOffset <= -4} // Limit to 4 weeks in the past
              style={{ opacity: currentWeekOffset <= -4 ? 0.3 : 1 }}
            >
              <Box flexDirection="row" alignItems="center" padding="xs">
                <Text fontSize={16}>←</Text>
                <Text variant="caption" color="primary" marginLeft="xs">Previous</Text>
              </Box>
            </TouchableOpacity>
            
            <Box flex={1} alignItems="center">
              <Text variant="h3" color="primaryText">
                {currentWeekOffset === 0 ? "This Week" : 
                 currentWeekOffset === 1 ? "Next Week" :
                 currentWeekOffset > 1 ? `${currentWeekOffset} Weeks Ahead` :
                 currentWeekOffset === -1 ? "Last Week" :
                 `${Math.abs(currentWeekOffset)} Weeks Ago`}
              </Text>
            </Box>
            
            <TouchableOpacity 
              onPress={() => setCurrentWeekOffset(currentWeekOffset + 1)}
              disabled={currentWeekOffset >= 8} // Limit to 8 weeks ahead
              style={{ opacity: currentWeekOffset >= 8 ? 0.3 : 1 }}
            >
              <Box flexDirection="row" alignItems="center" padding="xs">
                <Text variant="caption" color="primary" marginRight="xs">Next</Text>
                <Text fontSize={16}>→</Text>
              </Box>
            </TouchableOpacity>
          </Box>

          {/* Meal Plan Title and Macros */}
          <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Text variant="h2" color="primaryText" marginBottom="xs">
                {activeMealPlan.title}
              </Text>
              <Text variant="caption" color="secondaryText">
                Week of {new Date(activeMealPlan.week_start_date).toLocaleDateString()}
              </Text>
            </Box>
            
            {profile?.macro_goals_set && (
              <Button 
                variant="secondary" 
                onPress={() => setShowMacroSummary(true)}
                paddingHorizontal="sm"
                paddingVertical="xs"
              >
                <Text variant="caption" color="primaryText">📊 Macros</Text>
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Meal Grid */}
      <ScrollView 
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Smart Suggestions */}
        {(() => {
          const suggestions = generateSmartSuggestions();
          if (suggestions.length === 0) return null;
          
          return (
            <Box padding="lg" paddingBottom="md">
              <Text variant="h3" color="primaryText" marginBottom="md">
                🧠 Smart Suggestions
              </Text>
              
              {suggestions.map((suggestion, index) => (
                <Box 
                  key={index}
                  backgroundColor="surface" 
                  padding="md" 
                  borderRadius="md" 
                  marginBottom="sm"
                  borderLeftWidth={4}
                  style={{ 
                    borderLeftColor: suggestion.priority === 'high' 
                      ? '#FF6B35' 
                      : suggestion.priority === 'medium' 
                        ? '#FF9800' 
                        : '#4CAF50' 
                  }}
                >
                  <Text variant="h3" color="primaryText" marginBottom="xs">
                    {suggestion.title}
                  </Text>
                  <Text variant="body" color="secondaryText" marginBottom="md">
                    {suggestion.description}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Handle suggestion actions
                      if (suggestion.type === 'meal_frequency') {
                        const mealType = suggestion.title.includes('breakfast') ? 'breakfast' : 'dinner';
                        // Find first empty slot of this meal type
                        const weekDates = require('../types/mealPlan').getWeekDates(activeMealPlan.week_start_date);
                        const emptySlot = weekDates.find((date: string) => {
                          const dayPlan = activeMealPlan.days.find(day => day.date === date);
                          return !dayPlan?.[mealType];
                        });
                        if (emptySlot) {
                          handleAddRecipe(emptySlot, mealType);
                        }
                      } else if (suggestion.type === 'nutrition') {
                        // Navigate to recipe generator with protein focus
                        navigation.navigate('RecipeGenerator', { 
                          initialPrompt: 'Generate a high-protein recipe for my meal plan' 
                        });
                      }
                      HapticService.light();
                    }}
                  >
                    <Box 
                      backgroundColor="primary" 
                      paddingHorizontal="md" 
                      paddingVertical="sm" 
                      borderRadius="sm"
                      alignSelf="flex-start"
                    >
                      <Text variant="caption" color="primaryButtonText" fontWeight="600">
                        {suggestion.action}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                </Box>
              ))}
            </Box>
          );
        })()}

        <WeeklyMealGrid
          mealPlan={activeMealPlan}
          onAddRecipe={handleAddRecipe}
          onViewRecipe={handleViewRecipe}
          onRemoveRecipe={handleRemoveRecipe}
          onCloneRecipe={handleCloneRecipe}
        />
      </ScrollView>

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
                  navigation.navigate('RecipeGeneration', { 
                    fromMealPlanner: true,
                    mealPlanContext: selectedMealSlot 
                  });
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
                    navigation.navigate('RecipeGeneration', { 
                      fromMealPlanner: true,
                      mealPlanContext: selectedMealSlot 
                    });
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

      {/* Food Entry Sheet */}
      <BottomSheet
        isVisible={showFoodEntry}
        onClose={() => {
          setShowFoodEntry(false);
          setSelectedMealSlot(null);
        }}
        title={`Add Food Item to ${selectedMealSlot?.mealType} - ${selectedMealSlot?.date}`}
        snapPoints={['95%']}
      >
        {selectedMealSlot && (
          <AddFoodEntry
            mealType={selectedMealSlot.mealType}
            date={selectedMealSlot.date}
            onFoodAdded={handleFoodAdded}
            onCancel={() => {
              setShowFoodEntry(false);
              setSelectedMealSlot(null);
            }}
          />
        )}
      </BottomSheet>

      {/* Macro Summary Sheet */}
      <BottomSheet
        isVisible={showMacroSummary}
        onClose={() => setShowMacroSummary(false)}
        title={`Daily Macro Progress - ${new Date(selectedDate).toLocaleDateString()}`}
        snapPoints={['90%']}
      >
        <Box padding="md">
          {(() => {
            const dailyMacros = getDailyMacros();
            if (!dailyMacros) {
              return (
                <Box alignItems="center" padding="xl">
                  <Text variant="h3" color="primaryText" marginBottom="sm">
                    🎯 Set Your Macro Goals
                  </Text>
                  <Text variant="body" color="secondaryText" textAlign="center" marginBottom="lg">
                    Track your daily nutrition progress by setting your macro targets in your profile.
                  </Text>
                  <Button variant="primary" onPress={() => {
                    setShowMacroGoalsSetup(true);
                  }}>
                    <Text variant="button" color="primaryButtonText">
                      Set Macro Goals
                    </Text>
                  </Button>
                </Box>
              );
            }

            return (
              <ScrollView showsVerticalScrollIndicator={false}>
                <DailyMacroSummary
                  macros={dailyMacros}
                  date={new Date(selectedDate).toLocaleDateString()}
                  showDate={true}
                />
                
                {mealEntries && mealEntries.length > 0 && (
                  <Box marginTop="lg">
                    <Text variant="h3" color="primaryText" marginBottom="md">
                      📝 Today's Food Log
                    </Text>
                    {mealEntries.map((entry, index) => (
                      <Box 
                        key={entry.id} 
                        backgroundColor="surface" 
                        padding="sm" 
                        borderRadius="md" 
                        marginBottom="sm"
                        borderWidth={1}
                        borderColor="border"
                      >
                        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
                            <Text variant="body" color="primaryText" fontWeight="600">
                              {entry.food_name}
                            </Text>
                            {entry.brand_name && (
                              <Text variant="caption" color="primaryGreen">
                                {entry.brand_name}
                              </Text>
                            )}
                            <Text variant="caption" color="secondaryText">
                              {entry.quantity} × {entry.serving_size}
                            </Text>
                          </Box>
                          <Box alignItems="flex-end">
                            <Text variant="caption" color="secondaryText" textTransform="capitalize">
                              {entry.meal_type}
                            </Text>
                            <Text variant="body" color="primaryText" fontWeight="600">
                              {Math.round(entry.calories_per_serving * entry.quantity)} cal
                            </Text>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </ScrollView>
            );
          })()}
        </Box>
      </BottomSheet>

      {/* Meal Prep Modal */}
      <BottomSheet
        isVisible={showMealPrepModal}
        onClose={() => {
          setShowMealPrepModal(false);
          setRecipeToClone(null);
        }}
      >
        <MealPrepInterface
          recipe={recipeToClone?.recipe}
          originalMealType={recipeToClone?.mealType}
          mealPlan={activeMealPlan}
          onCopyToSlots={async (slots) => {
            if (!activeMealPlan || !recipeToClone) return;
            
            try {
              HapticService.medium();
              
              // Update meal slots sequentially to avoid race conditions
              for (const slot of slots) {
                try {
                  await MealPlanService.updateMealPlan({
                    meal_plan_id: activeMealPlan.id,
                    date: slot.date,
                    meal_type: slot.mealType,
                    recipe_id: recipeToClone.recipe.recipe_id,
                    servings: recipeToClone.recipe.servings,
                  });
                  console.log(`Successfully copied recipe to ${slot.date} ${slot.mealType}`);
                } catch (slotError) {
                  console.error(`Failed to copy recipe to ${slot.date} ${slot.mealType}:`, slotError);
                  throw slotError; // Re-throw to handle in outer catch
                }
              }
              
              // Reload the meal plan and wait for it to complete
              console.log('Reloading meal plan after recipe copying...');
              await loadActiveMealPlan();
              
              setShowMealPrepModal(false);
              setRecipeToClone(null);
              
              HapticService.success();
              ErrorHandler.showSuccessToast(`Recipe copied to ${slots.length} meal${slots.length > 1 ? 's' : ''}!`);
            } catch (err) {
              console.error('Error in meal prep copying:', err);
              ErrorHandler.handleError(err, 'copying recipe to meal slots');
              // Don't close modal on error so user can try again
            }
          }}
          onClose={() => {
            setShowMealPrepModal(false);
            setRecipeToClone(null);
          }}
        />
      </BottomSheet>

      {/* Macro Goals Setup Modal */}
      <BottomSheet
        isVisible={showMacroGoalsSetup}
        onClose={() => setShowMacroGoalsSetup(false)}
        snapPoints={['100%']}
        scrollable={false}
      >
        <MacroGoalsEditor
          onSave={async (goals: MacroGoals) => {
            await setMacroGoals({
              dailyCalorieGoal: goals.dailyCalories,
              dailyProteinGoal: goals.dailyProtein,
              dailyCarbsGoal: goals.dailyCarbs,
              dailyFatGoal: goals.dailyFat,
            });
            setShowMacroGoalsSetup(false);
            // Refresh the macro summary modal to show the new goals
            setShowMacroSummary(true);
          }}
          onCancel={() => setShowMacroGoalsSetup(false)}
          isLoading={macroLoading}
          showTDEECalculator={true}
          title="🎯 Set Macro Goals"
          subtitle="Set your daily macro targets to track nutrition progress"
        />
      </BottomSheet>
    </Box>
  );
};