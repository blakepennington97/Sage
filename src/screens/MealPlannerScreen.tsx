// src/screens/MealPlannerScreen.tsx (with logging)

import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  Box,
  Text,
  Button,
  LoadingSpinner,
  ErrorMessage,
  BottomSheet,
  RecipeCard,
} from "../components/ui";
import { WeeklyMealGrid } from "../components/WeeklyMealGrid";
import { PremiumGate } from "../components/PremiumGate";
import { useAuthStore } from "../stores/authStore";
import { useRecipes } from "../hooks/useRecipes";
import { useMealPlanByWeek, useMealPlans } from "../hooks/useMealPlans";
import { HapticService } from "../services/haptics";
import { ErrorHandler } from "../utils/errorHandling";
import {
  DailyMacroSummary,
  DailyMacros,
} from "../components/DailyMacroSummary";
import { AddFoodEntry } from "../components/AddFoodEntry";
import { MealPrepInterface } from "../components/MealPrepInterface";
import {
  useMealTracking,
  useDailyMacroProgress,
  useMealEntriesForDay,
} from "../hooks/useMealTracking";
import { MealEntry } from "../services/mealTracking";
import { MacroGoalsEditor, MacroGoals } from "../components/MacroGoalsEditor";
import { useUserProfile } from "../hooks/useUserProfile";
import {
  MealPlanRecipe,
  MealType,
  getWeekStartDate,
  formatDateForMealPlan,
} from "../types/mealPlan";

export const MealPlannerScreen: React.FC = () => {
  console.log("🔵 MealPlannerScreen: Component rendering or re-rendering.");
  const navigation = useNavigation<any>();
  const { user, profile } = useAuthStore();
  const { recipes, refetchRecipes } = useRecipes();
  const insets = useSafeAreaInsets();

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isPremium, setIsPremium] = useState(true);

  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [showFoodEntry, setShowFoodEntry] = useState(false);
  const [showMacroSummary, setShowMacroSummary] = useState(false);
  const [showMealPrepModal, setShowMealPrepModal] = useState(false);
  const [recipeToClone, setRecipeToClone] = useState<{
    recipe: MealPlanRecipe;
    mealType: MealType;
  } | null>(null);
  const [showMacroGoalsSetup, setShowMacroGoalsSetup] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateForMealPlan(new Date())
  );

  const { createMealPlan, batchUpdateMealPlan, updateMealPlan, isCreating } =
    useMealPlans();

  const getCurrentWeekStartDate = useCallback(() => {
    const today = new Date();
    today.setDate(today.getDate() + currentWeekOffset * 7);
    return getWeekStartDate(today);
  }, [currentWeekOffset]);

  const weekStartDate = getCurrentWeekStartDate();
  console.log(
    `🗓️ MealPlannerScreen: Current week start date is ${weekStartDate}`
  );

  const {
    data: mealPlan,
    isLoading: isLoadingMealPlan,
    error: mealPlanError,
    refetch: refetchMealPlan,
    isRefetching,
  } = useMealPlanByWeek(weekStartDate);

  console.log("🪝 MealPlannerScreen: useMealPlanByWeek hook state:", {
    isLoadingMealPlan,
    isRefetching,
    hasData: !!mealPlan,
    mealPlanId: mealPlan?.id,
    error: mealPlanError,
  });

  const { data: mealEntries } = useMealEntriesForDay(selectedDate);
  const { data: macroProgress } = useDailyMacroProgress(selectedDate);
  const { setMacroGoals, isLoading: macroLoading } = useUserProfile();

  useFocusEffect(
    useCallback(() => {
      console.log(
        "✨ MealPlannerScreen: Screen focused. Refetching meal plan and recipes."
      );
      refetchMealPlan();
      refetchRecipes();
    }, [refetchMealPlan, refetchRecipes])
  );

  const handleCloneRecipe = (recipe: MealPlanRecipe, mealType: MealType) => {
    console.log(
      `1️⃣ [USER ACTION] handleCloneRecipe: User wants to clone recipe "${recipe.recipe_name}"`
    );
    setRecipeToClone({ recipe, mealType });
    setShowMealPrepModal(true);
    HapticService.light();
  };

  const handleCopyToSlots = async (
    slots: { date: string; mealType: MealType }[]
  ) => {
    console.log(
      `2️⃣ [UI EVENT] handleCopyToSlots: Modal confirmed. Preparing to copy to ${slots.length} slots.`
    );
    if (!mealPlan || !recipeToClone) {
      console.error(
        "❌ ERROR: handleCopyToSlots called without mealPlan or recipeToClone."
      );
      return;
    }
    try {
      HapticService.medium();
      setShowMealPrepModal(false);
      const updateRequests = slots.map((slot) => ({
        meal_plan_id: mealPlan.id,
        date: slot.date,
        meal_type: slot.mealType,
        recipe_id: recipeToClone.recipe.recipe_id,
        servings: recipeToClone.recipe.servings,
      }));
      console.log(
        "3️⃣ [MUTATION TRIGGER] handleCopyToSlots: Calling batchUpdateMealPlan with requests:",
        updateRequests
      );
      await batchUpdateMealPlan(updateRequests);
      setRecipeToClone(null);
      HapticService.success();
      Alert.alert(
        "Recipe Copied!",
        `Successfully copied "${recipeToClone.recipe.recipe_name}" to ${
          slots.length
        } meal slot${slots.length > 1 ? "s" : ""}.`
      );
    } catch (err) {
      console.error("❌ ERROR in handleCopyToSlots:", err);
      ErrorHandler.handleError(err, "copying recipe to meal slots");
    }
  };

  const handleRefresh = useCallback(async () => {
    await refetchMealPlan();
  }, [refetchMealPlan]);

  const handleCreateMealPlan = async () => {
    if (!isPremium) {
      setShowPremiumGate(true);
      return;
    }
    HapticService.medium();
    const newPlanData = {
      title: `Week of ${new Date(weekStartDate).toLocaleDateString()}`,
      week_start_date: weekStartDate,
    };
    await createMealPlan(newPlanData);
  };

  const handleAddRecipe = (date: string, mealType: MealType) => {
    if (!isPremium) {
      setShowPremiumGate(true);
      return;
    }
    HapticService.light();
    setSelectedMealSlot({ date, mealType });
    Alert.alert("Add to Meal Plan", "What would you like to add?", [
      { text: "Cancel", style: "cancel" },
      { text: "📖 Recipe", onPress: () => setShowRecipeSelector(true) },
      {
        text: "🔍 Food Item",
        onPress: () => {
          setSelectedDate(date);
          setShowFoodEntry(true);
        },
      },
    ]);
  };

  const handleSelectRecipe = async (recipeId: string) => {
    if (!mealPlan || !selectedMealSlot || !user) return;
    try {
      HapticService.medium();
      setShowRecipeSelector(false);
      await updateMealPlan({
        meal_plan_id: mealPlan.id,
        date: selectedMealSlot.date,
        meal_type: selectedMealSlot.mealType,
        recipe_id: recipeId,
        servings: 2,
      });
      setSelectedMealSlot(null);
      HapticService.success();
      ErrorHandler.showSuccessToast("Recipe added to meal plan!");
    } catch (err) {
      ErrorHandler.handleError(err, "adding recipe to meal plan");
    }
  };

  const handleRemoveRecipe = (date: string, mealType: MealType) => {
    if (!mealPlan) return;
    Alert.alert(
      "Remove Recipe",
      "Are you sure you want to remove this recipe from your meal plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            HapticService.medium();
            await updateMealPlan({
              meal_plan_id: mealPlan.id,
              date,
              meal_type: mealType,
            });
            HapticService.success();
          },
        },
      ]
    );
  };

  const handleViewRecipe = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (recipe) {
      navigation.navigate("RecipeDetail", { recipe });
    }
  };

  const { addMealEntry } = useMealTracking();
  const handleUpgradeToPremium = () => {
    Alert.alert(
      "Upgrade to Premium",
      "This would open the subscription flow. For demo purposes, we'll enable premium features.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Enable Premium (Demo)",
          onPress: () => {
            setIsPremium(true);
            setShowPremiumGate(false);
            ErrorHandler.showSuccessToast("Premium features enabled!");
          },
        },
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
      ErrorHandler.showSuccessToast("Food item added successfully!");
    } catch (error) {
      ErrorHandler.handleError(error, "adding food item");
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

  const renderHeader = () => (
    <Box
      backgroundColor="surface"
      paddingHorizontal="lg"
      paddingVertical="md"
      borderBottomWidth={1}
      borderBottomColor="border"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="sm"
      >
        <TouchableOpacity
          onPress={() => setCurrentWeekOffset(currentWeekOffset - 1)}
          disabled={currentWeekOffset <= -4}
          style={{ opacity: currentWeekOffset <= -4 ? 0.3 : 1 }}
        >
          <Box flexDirection="row" alignItems="center" padding="xs">
            <Text fontSize={16}>←</Text>
            <Text variant="caption" color="primary" marginLeft="xs">
              Previous
            </Text>
          </Box>
        </TouchableOpacity>
        <Box flex={1} alignItems="center">
          <Text variant="h3" color="primaryText">
            {currentWeekOffset === 0
              ? "This Week"
              : currentWeekOffset === 1
              ? "Next Week"
              : currentWeekOffset > 1
              ? `${currentWeekOffset} Weeks Ahead`
              : currentWeekOffset === -1
              ? "Last Week"
              : `${Math.abs(currentWeekOffset)} Weeks Ago`}
          </Text>
        </Box>
        <TouchableOpacity
          onPress={() => setCurrentWeekOffset(currentWeekOffset + 1)}
          disabled={currentWeekOffset >= 8}
          style={{ opacity: currentWeekOffset >= 8 ? 0.3 : 1 }}
        >
          <Box flexDirection="row" alignItems="center" padding="xs">
            <Text variant="caption" color="primary" marginRight="xs">
              Next
            </Text>
            <Text fontSize={16}>→</Text>
          </Box>
        </TouchableOpacity>
      </Box>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
        marginTop="sm"
      >
        <Box flex={1}>
          <Text variant="h2" color="primaryText" marginBottom="xs">
            {mealPlan?.title ||
              `Week of ${new Date(weekStartDate).toLocaleDateString()}`}
          </Text>
          <Text variant="caption" color="secondaryText">
            {`Week of ${new Date(weekStartDate).toLocaleDateString()}`}
          </Text>
        </Box>
        {profile?.macro_goals_set && (
          <Button
            variant="secondary"
            onPress={() => setShowMacroSummary(true)}
            paddingHorizontal="sm"
            paddingVertical="xs"
          >
            <Text variant="caption" color="primaryText">
              📊 Macros
            </Text>
          </Button>
        )}
      </Box>
    </Box>
  );

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

  if (isLoadingMealPlan && !isRefetching) {
    return <LoadingSpinner message="Loading your meal plan..." />;
  }

  if (mealPlanError) {
    return (
      <ErrorMessage
        variant="fullscreen"
        title="Failed to Load Meal Plan"
        message={mealPlanError?.message || "Unknown error"}
        onRetry={refetchMealPlan}
      />
    );
  }

  if (!mealPlan) {
    return (
      <Box flex={1} backgroundColor="mainBackground">
        {renderHeader()}
        <Box flex={1} justifyContent="center" alignItems="center" padding="xl">
          <Text fontSize={64} marginBottom="lg">
            📅
          </Text>
          <Text variant="h1" textAlign="center" marginBottom="sm">
            No Plan For This Week
          </Text>
          <Text
            variant="body"
            color="secondaryText"
            textAlign="center"
            marginBottom="xl"
          >
            Create a meal plan for this week to start organizing your meals.
          </Text>
          <Button
            variant="primary"
            onPress={handleCreateMealPlan}
            disabled={isCreating}
          >
            <Text variant="button" color="primaryButtonText">
              {isCreating ? "Creating Plan..." : "Create Meal Plan"}
            </Text>
          </Button>
          {!isPremium && (
            <Text
              variant="caption"
              color="tertiaryText"
              textAlign="center"
              marginTop="md"
            >
              Premium feature - Start your free trial to begin meal planning
            </Text>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      {renderHeader()}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <WeeklyMealGrid
          mealPlan={mealPlan}
          onAddRecipe={handleAddRecipe}
          onViewRecipe={handleViewRecipe}
          onRemoveRecipe={handleRemoveRecipe}
          onCloneRecipe={handleCloneRecipe}
        />
      </ScrollView>

      {/* Bottom Sheets and Modals */}
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
              <Text
                variant="body"
                color="secondaryText"
                textAlign="center"
                marginBottom="lg"
              >
                You don't have any saved recipes yet.
              </Text>
              <Button
                variant="primary"
                onPress={() => {
                  setShowRecipeSelector(false);
                  navigation.navigate("RecipeGeneration", {
                    fromMealPlanner: true,
                    mealPlanContext: {
                      ...selectedMealSlot,
                      meal_plan_id: mealPlan.id,
                    },
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
              <Box
                marginBottom="lg"
                padding="md"
                backgroundColor="surface"
                borderRadius="lg"
                borderWidth={1}
                borderColor="border"
              >
                <Box flexDirection="row" alignItems="center" marginBottom="sm">
                  <Text fontSize={24} marginRight="sm">
                    ✨
                  </Text>
                  <Text variant="h3" flex={1}>
                    Generate New Recipe
                  </Text>
                </Box>
                <Text variant="body" color="secondaryText" marginBottom="md">
                  Create a personalized recipe just for this meal
                </Text>
                <Button
                  variant="primary"
                  onPress={() => {
                    setShowRecipeSelector(false);
                    navigation.navigate("RecipeGeneration", {
                      fromMealPlanner: true,
                      mealPlanContext: {
                        ...selectedMealSlot,
                        meal_plan_id: mealPlan.id,
                      },
                    });
                  }}
                >
                  <Text variant="button" color="primaryButtonText">
                    🔥 Generate Recipe
                  </Text>
                </Button>
              </Box>
              <Box flexDirection="row" alignItems="center" marginBottom="lg">
                <Box flex={1} height={1} backgroundColor="border" />
                <Text
                  variant="caption"
                  color="secondaryText"
                  marginHorizontal="md"
                >
                  OR CHOOSE FROM SAVED
                </Text>
                <Box flex={1} height={1} backgroundColor="border" />
              </Box>
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

      <BottomSheet
        isVisible={showFoodEntry}
        onClose={() => {
          setShowFoodEntry(false);
          setSelectedMealSlot(null);
        }}
        title={`Add Food Item to ${selectedMealSlot?.mealType} - ${selectedMealSlot?.date}`}
        snapPoints={["95%"]}
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
          mealPlan={mealPlan}
          onCopyToSlots={handleCopyToSlots}
          onClose={() => {
            setShowMealPrepModal(false);
            setRecipeToClone(null);
          }}
        />
      </BottomSheet>

      <BottomSheet
        isVisible={showMacroSummary}
        onClose={() => setShowMacroSummary(false)}
        title={`Daily Macro Progress - ${new Date(
          selectedDate
        ).toLocaleDateString()}`}
        snapPoints={["90%"]}
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
                  <Text
                    variant="body"
                    color="secondaryText"
                    textAlign="center"
                    marginBottom="lg"
                  >
                    Track your daily nutrition progress by setting your macro
                    targets in your profile.
                  </Text>
                  <Button
                    variant="primary"
                    onPress={() => {
                      setShowMacroGoalsSetup(true);
                    }}
                  >
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
                    {mealEntries.map((entry: MealEntry) => (
                      <Box
                        key={entry.id}
                        backgroundColor="surface"
                        padding="sm"
                        borderRadius="md"
                        marginBottom="sm"
                        borderWidth={1}
                        borderColor="border"
                      >
                        <Box
                          flexDirection="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box flex={1}>
                            <Text
                              variant="body"
                              color="primaryText"
                              fontWeight="600"
                            >
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
                            <Text
                              variant="caption"
                              color="secondaryText"
                              textTransform="capitalize"
                            >
                              {entry.meal_type}
                            </Text>
                            <Text
                              variant="body"
                              color="primaryText"
                              fontWeight="600"
                            >
                              {Math.round(
                                entry.calories_per_serving * entry.quantity
                              )}{" "}
                              cal
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
      <BottomSheet
        isVisible={showMacroGoalsSetup}
        onClose={() => setShowMacroGoalsSetup(false)}
        snapPoints={["100%"]}
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
