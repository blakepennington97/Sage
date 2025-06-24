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
import { RecipeSelectorSheet } from "../components/RecipeSelectorSheet";
import { useAuthStore } from "../stores/authStore";
import { useRecipes } from "../hooks/useRecipes";
import { useMealPlanByWeek, useMealPlans } from "../hooks/useMealPlans";
import { useMealPlanActions } from "../hooks/useMealPlanActions";
import { HapticService } from "../services/haptics";
import { ErrorHandler } from "../utils/errorHandling";
import { DailyMacroSummary } from "../components/DailyMacroSummary";
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
  const [showMealPrepModal, setShowMealPrepModal] = useState(false);
  const [recipeToClone, setRecipeToClone] = useState<{
    recipe: MealPlanRecipe;
    mealType: MealType;
  } | null>(null);
  const [showMacroGoalsSetup, setShowMacroGoalsSetup] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateForMealPlan(new Date())
  );

  const getCurrentWeekStartDate = useCallback(() => {
    const today = new Date();
    today.setDate(today.getDate() + currentWeekOffset * 7);
    return getWeekStartDate(today);
  }, [currentWeekOffset]);

  const weekStartDate = getCurrentWeekStartDate();
  console.log(
    `🗓️ MealPlannerScreen: Current week start date is ${weekStartDate}`
  );

  // Sync selectedDate with the current week being viewed
  useEffect(() => {
    const today = formatDateForMealPlan(new Date());
    const weekStart = new Date(weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // If current selectedDate is not within the current week, update it to the first day of the week
    const selected = new Date(selectedDate);
    if (selected < weekStart || selected > weekEnd) {
      setSelectedDate(weekStartDate);
    }
  }, [weekStartDate, selectedDate]);

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

  const { createMealPlan, isCreating } = useMealPlans();
  
  // Extract meal plan actions to custom hook
  const mealPlanActions = useMealPlanActions({
    mealPlan: mealPlan || null,
    userId: user?.id,
  });

  const { data: mealEntries } = useMealEntriesForDay(selectedDate);
  const { data: macroProgress, refetch: refetchMacroProgress } = useDailyMacroProgress(selectedDate);
  const { setMacroGoals, isLoading: macroLoading } = useUserProfile();

  useFocusEffect(
    useCallback(() => {
      console.log(
        "✨ MealPlannerScreen: Screen focused. Refetching meal plan, recipes, and macro progress."
      );
      refetchMealPlan();
      refetchRecipes();
      refetchMacroProgress();
    }, [refetchMealPlan, refetchRecipes, refetchMacroProgress])
  );

  const handleCloneRecipe = (recipe: MealPlanRecipe, mealType: MealType) => {
    mealPlanActions.handleCloneRecipe(
      recipe,
      mealType,
      () => setShowMealPrepModal(true),
      setRecipeToClone
    );
  };

  const handleCopyToSlots = async (
    slots: { date: string; mealType: MealType }[]
  ) => {
    await mealPlanActions.handleCopyToSlots(
      slots,
      recipeToClone,
      () => {
        setShowMealPrepModal(false);
        setRecipeToClone(null);
      }
    );
  };

  const handleRefresh = useCallback(async () => {
    await refetchMealPlan();
    await refetchMacroProgress();
  }, [refetchMealPlan, refetchMacroProgress]);

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
    mealPlanActions.handleAddRecipe(
      date,
      mealType,
      () => setShowPremiumGate(true),
      () => setShowRecipeSelector(true),
      () => setShowFoodEntry(true),
      setSelectedMealSlot,
      setSelectedDate,
      isPremium
    );
  };

  const handleSelectRecipe = async (recipeId: string) => {
    await mealPlanActions.handleSelectRecipe(
      recipeId,
      selectedMealSlot,
      () => {
        setShowRecipeSelector(false);
        setSelectedMealSlot(null);
      }
    );
  };

  const handleRemoveRecipe = (date: string, mealType: MealType) => {
    mealPlanActions.handleRemoveRecipe(date, mealType);
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
          macroGoals={profile?.macro_goals_set ? {
            dailyCalories: profile.daily_calorie_goal || 2000,
            dailyProtein: profile.daily_protein_goal || 100,
            dailyCarbs: profile.daily_carbs_goal || 200,
            dailyFat: profile.daily_fat_goal || 70,
          } : undefined}
          onAddRecipe={handleAddRecipe}
          onViewRecipe={handleViewRecipe}
          onRemoveRecipe={handleRemoveRecipe}
          onCloneRecipe={handleCloneRecipe}
        />
      </ScrollView>

      {/* Bottom Sheets and Modals */}
      <RecipeSelectorSheet
        isVisible={showRecipeSelector}
        onClose={() => {
          setShowRecipeSelector(false);
          setSelectedMealSlot(null);
        }}
        selectedMealSlot={selectedMealSlot}
        recipes={recipes}
        onRecipeSelect={handleSelectRecipe}
        onGenerateNewRecipe={() => {
          setShowRecipeSelector(false);
          navigation.navigate("RecipeGeneration", {
            fromMealPlanner: true,
            mealPlanContext: {
              ...selectedMealSlot,
              meal_plan_id: mealPlan?.id,
            },
          });
        }}
      />

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
