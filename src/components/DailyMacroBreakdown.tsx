import React from "react";
import { ScrollView } from "react-native";
import { Box, Text } from "./ui";
import { MacroProgressRing } from "./MacroProgressRing";
import { DayMealPlan, MealPlanRecipe } from "../types/mealPlan";

interface MacroGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

interface DailyMacroBreakdownProps {
  dayPlan: DayMealPlan;
  goals: MacroGoals;
  isLoading?: boolean;
}

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const DailyMacroBreakdown: React.FC<DailyMacroBreakdownProps> = ({
  dayPlan,
  goals,
  isLoading = false,
}) => {
  const calculateMacroTotals = (): MacroTotals => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const addRecipeMacros = (recipe: MealPlanRecipe) => {
      if (recipe.recipe_data) {
        // Try to extract nutritional data from recipe_data
        const recipeData = typeof recipe.recipe_data === 'string' 
          ? JSON.parse(recipe.recipe_data) 
          : recipe.recipe_data;
        
        // Use servingsForMeal if available, fallback to 1 serving for this meal
        const servings = recipe.servingsForMeal || 1;
        totals.calories += (recipeData.caloriesPerServing || 0) * servings;
        totals.protein += (recipeData.proteinPerServing || 0) * servings;
        totals.carbs += (recipeData.carbsPerServing || 0) * servings;
        totals.fat += (recipeData.fatPerServing || 0) * servings;
      }
    };

    // Add macros from each meal
    if (dayPlan.breakfast) addRecipeMacros(dayPlan.breakfast);
    if (dayPlan.lunch) addRecipeMacros(dayPlan.lunch);
    if (dayPlan.dinner) addRecipeMacros(dayPlan.dinner);
    if (dayPlan.snacks && dayPlan.snacks.length > 0) {
      dayPlan.snacks.forEach(addRecipeMacros);
    }

    return totals;
  };

  const getMacroPercentage = (current: number, goal: number): number => {
    return goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  };

  if (isLoading) {
    return (
      <Box 
        backgroundColor="surface" 
        padding="sm" 
        borderRadius="md" 
        marginTop="xs"
        opacity={0.7}
      >
        <Text variant="caption" color="secondaryText" textAlign="center">
          Loading nutrition data...
        </Text>
      </Box>
    );
  }

  const totals = calculateMacroTotals();

  // Don't render if no meals are planned
  const hasMeals = dayPlan.breakfast || dayPlan.lunch || dayPlan.dinner || 
    (dayPlan.snacks && dayPlan.snacks.length > 0);
  
  if (!hasMeals) {
    return (
      <Box 
        backgroundColor="surface" 
        padding="sm" 
        borderRadius="md" 
        marginTop="xs"
        borderWidth={1}
        borderColor="border"
      >
        <Text variant="caption" color="tertiaryText" textAlign="center">
          No meals planned
        </Text>
      </Box>
    );
  }

  const calorieProgress = getMacroPercentage(totals.calories, goals.dailyCalories);

  return (
    <Box 
      backgroundColor="surface" 
      padding="sm" 
      borderRadius="md" 
      marginTop="xs"
      borderWidth={1}
      borderColor="border"
    >
      {/* Apple Watch-style Progress Rings */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
      >
        <MacroProgressRing
          label="Calories"
          current={totals.calories}
          goal={goals.dailyCalories}
          unit="kcal"
          color="#2196f3"
          size={60}
          strokeWidth={4}
        />
        <MacroProgressRing
          label="Protein"
          current={totals.protein}
          goal={goals.dailyProtein}
          unit="g"
          color="#c62828"
          size={60}
          strokeWidth={4}
        />
        <MacroProgressRing
          label="Carbs"
          current={totals.carbs}
          goal={goals.dailyCarbs}
          unit="g"
          color="#fb8c00"
          size={60}
          strokeWidth={4}
        />
        <MacroProgressRing
          label="Fat"
          current={totals.fat}
          goal={goals.dailyFat}
          unit="g"
          color="#4caf50"
          size={60}
          strokeWidth={4}
        />
      </ScrollView>

      {/* Daily progress indicator */}
      {calorieProgress > 90 && (
        <Box marginTop="xs" alignItems="center">
          <Text variant="caption" color="primaryGreen" fontSize={10}>
            ✓ Daily goal reached
          </Text>
        </Box>
      )}
    </Box>
  );
};