import React from "react";
import { Box, Text } from "./ui";
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
        
        const servings = recipe.servings || 1;
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

  const formatMacroDisplay = (current: number, goal: number, unit: string = "g"): string => {
    return `${Math.round(current)}/${goal}${unit}`;
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
  const proteinProgress = getMacroPercentage(totals.protein, goals.dailyProtein);

  return (
    <Box 
      backgroundColor="surface" 
      padding="sm" 
      borderRadius="md" 
      marginTop="xs"
      borderWidth={1}
      borderColor="border"
    >
      {/* Main calories display */}
      <Box flexDirection="row" alignItems="center" justifyContent="center" marginBottom="xs">
        <Text fontSize={16} marginRight="xs">🔥</Text>
        <Text variant="body" color="primaryText" fontWeight="600">
          {formatMacroDisplay(totals.calories, goals.dailyCalories, " kcal")}
        </Text>
        <Text variant="caption" color="secondaryText" marginLeft="xs">
          ({Math.round(calorieProgress)}%)
        </Text>
      </Box>

      {/* Macro breakdown */}
      <Box flexDirection="row" justifyContent="space-around">
        <Box alignItems="center">
          <Text fontSize={12} marginBottom="xs">💪</Text>
          <Text variant="caption" color="primaryText" fontWeight="500">
            {formatMacroDisplay(totals.protein, goals.dailyProtein)}
          </Text>
          <Text variant="caption" color="tertiaryText" fontSize={10}>
            P
          </Text>
        </Box>
        
        <Box alignItems="center">
          <Text fontSize={12} marginBottom="xs">🌾</Text>
          <Text variant="caption" color="primaryText" fontWeight="500">
            {formatMacroDisplay(totals.carbs, goals.dailyCarbs)}
          </Text>
          <Text variant="caption" color="tertiaryText" fontSize={10}>
            C
          </Text>
        </Box>
        
        <Box alignItems="center">
          <Text fontSize={12} marginBottom="xs">🥑</Text>
          <Text variant="caption" color="primaryText" fontWeight="500">
            {formatMacroDisplay(totals.fat, goals.dailyFat)}
          </Text>
          <Text variant="caption" color="tertiaryText" fontSize={10}>
            F
          </Text>
        </Box>
      </Box>

      {/* Progress indicator */}
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