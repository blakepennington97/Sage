import { useCallback } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMealPlans } from "./useMealPlans";
import { HapticService } from "../services/haptics";
import { ErrorHandler } from "../utils/errorHandling";
import { WeeklyMealPlan, MealPlanRecipe, MealType } from "../types/mealPlan";

interface UseMealPlanActionsProps {
  mealPlan: WeeklyMealPlan | null;
  userId?: string;
}

interface MealPlanActions {
  handleAddRecipe: (
    date: string,
    mealType: MealType,
    onShowPremiumGate: () => void,
    onShowRecipeSelector: () => void,
    onShowFoodEntry: () => void,
    setSelectedMealSlot: (slot: { date: string; mealType: MealType } | null) => void,
    setSelectedDate: (date: string) => void,
    isPremium: boolean
  ) => void;
  handleSelectRecipe: (
    recipeId: string,
    selectedMealSlot: { date: string; mealType: MealType } | null,
    onSuccess: () => void
  ) => Promise<void>;
  handleRemoveRecipe: (date: string, mealType: MealType) => void;
  handleCloneRecipe: (
    recipe: MealPlanRecipe,
    mealType: MealType,
    onShowMealPrepModal: () => void,
    setRecipeToClone: (data: { recipe: MealPlanRecipe; mealType: MealType }) => void
  ) => void;
  handleCopyToSlots: (
    slots: { date: string; mealType: MealType }[],
    recipeToClone: { recipe: MealPlanRecipe; mealType: MealType } | null,
    onSuccess: () => void
  ) => Promise<void>;
  handleServingsChange: (
    date: string,
    mealType: MealType,
    newServings: number
  ) => Promise<void>;
}

export const useMealPlanActions = ({
  mealPlan,
  userId,
}: UseMealPlanActionsProps): MealPlanActions => {
  const navigation = useNavigation<any>();
  const { updateMealPlan, batchUpdateMealPlan } = useMealPlans();

  const handleAddRecipe = useCallback(
    (
      date: string,
      mealType: MealType,
      onShowPremiumGate: () => void,
      onShowRecipeSelector: () => void,
      onShowFoodEntry: () => void,
      setSelectedMealSlot: (slot: { date: string; mealType: MealType } | null) => void,
      setSelectedDate: (date: string) => void,
      isPremium: boolean
    ) => {
      if (!isPremium) {
        onShowPremiumGate();
        return;
      }
      HapticService.light();
      setSelectedMealSlot({ date, mealType });
      Alert.alert("Add to Meal Plan", "What would you like to add?", [
        { text: "Cancel", style: "cancel" },
        { text: "📖 Recipe", onPress: onShowRecipeSelector },
        {
          text: "🔍 Food Item",
          onPress: () => {
            setSelectedDate(date);
            onShowFoodEntry();
          },
        },
      ]);
    },
    []
  );

  const handleSelectRecipe = useCallback(
    async (
      recipeId: string,
      selectedMealSlot: { date: string; mealType: MealType } | null,
      onSuccess: () => void
    ) => {
      if (!mealPlan || !selectedMealSlot || !userId) return;
      try {
        HapticService.medium();
        await updateMealPlan({
          meal_plan_id: mealPlan.id,
          date: selectedMealSlot.date,
          meal_type: selectedMealSlot.mealType,
          recipe_id: recipeId,
          servings: 2,
          servingsForMeal: 1, // Default to 1 serving for this meal
        });
        onSuccess();
        HapticService.success();
        ErrorHandler.showSuccessToast("Recipe added to meal plan!");
      } catch (err) {
        ErrorHandler.handleError(err, "adding recipe to meal plan");
      }
    },
    [mealPlan, userId, updateMealPlan]
  );

  const handleRemoveRecipe = useCallback(
    (date: string, mealType: MealType) => {
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
    },
    [mealPlan, updateMealPlan]
  );

  const handleCloneRecipe = useCallback(
    (
      recipe: MealPlanRecipe,
      mealType: MealType,
      onShowMealPrepModal: () => void,
      setRecipeToClone: (data: { recipe: MealPlanRecipe; mealType: MealType }) => void
    ) => {
      console.log(
        `1️⃣ [USER ACTION] handleCloneRecipe: User wants to clone recipe "${recipe.recipe_name}"`
      );
      setRecipeToClone({ recipe, mealType });
      onShowMealPrepModal();
      HapticService.light();
    },
    []
  );

  const handleCopyToSlots = useCallback(
    async (
      slots: { date: string; mealType: MealType }[],
      recipeToClone: { recipe: MealPlanRecipe; mealType: MealType } | null,
      onSuccess: () => void
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
        onSuccess();
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
    },
    [mealPlan, batchUpdateMealPlan]
  );

  const handleServingsChange = useCallback(
    async (date: string, mealType: MealType, newServings: number) => {
      if (!mealPlan) return;
      
      try {
        // Find the current recipe in the meal plan
        const dayPlan = mealPlan.days.find((d: any) => d.date === date);
        const currentRecipe = dayPlan?.[mealType];
        
        if (currentRecipe) {
          // Handle the case where currentRecipe could be an array (for snacks)
          if (Array.isArray(currentRecipe)) {
            // For snacks, we would need to handle multiple items differently
            // For now, we'll skip this case as it's more complex
            console.warn('Serving adjustment not supported for snacks with multiple items');
            return;
          }
          
          // Update the meal plan with the new servingsForMeal value
          await updateMealPlan({
            meal_plan_id: mealPlan.id,
            date,
            meal_type: mealType,
            recipe_id: currentRecipe.recipe_id,
            servings: currentRecipe.servings, // Keep original total servings
            servingsForMeal: newServings, // Update the servings for this meal
          });
          
          HapticService.light();
        }
      } catch (err) {
        console.error("Error updating meal servings:", err);
        ErrorHandler.handleError(err, "updating meal servings");
      }
    },
    [mealPlan, updateMealPlan]
  );

  return {
    handleAddRecipe,
    handleSelectRecipe,
    handleRemoveRecipe,
    handleCloneRecipe,
    handleCopyToSlots,
    handleServingsChange,
  };
};