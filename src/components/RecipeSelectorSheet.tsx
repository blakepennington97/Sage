import React from "react";
import { Box, Text, Button, BottomSheet, RecipeCard } from "./ui";
import { UserRecipe } from "../services/supabase";
import { MealType } from "../types/mealPlan";

interface RecipeSelectorSheetProps {
  isVisible: boolean;
  onClose: () => void;
  selectedMealSlot: { date: string; mealType: MealType } | null;
  recipes: UserRecipe[];
  onRecipeSelect: (recipeId: string) => void;
  onGenerateNewRecipe: () => void;
}

export const RecipeSelectorSheet: React.FC<RecipeSelectorSheetProps> = ({
  isVisible,
  onClose,
  selectedMealSlot,
  recipes,
  onRecipeSelect,
  onGenerateNewRecipe,
}) => {
  const formatMealSlotTitle = () => {
    if (!selectedMealSlot) return "Add Recipe";
    return `Add ${selectedMealSlot.mealType} for ${selectedMealSlot.date}`;
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      title={formatMealSlotTitle()}
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
            <Button variant="primary" onPress={onGenerateNewRecipe}>
              <Text variant="button" color="primaryButtonText">
                Create Your First Recipe
              </Text>
            </Button>
          </Box>
        ) : (
          <>
            {/* Generate New Recipe Section */}
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
              <Button variant="primary" onPress={onGenerateNewRecipe}>
                <Text variant="button" color="primaryButtonText">
                  🔥 Generate Recipe
                </Text>
              </Button>
            </Box>

            {/* Divider */}
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

            {/* Saved Recipes List */}
            {recipes.map((recipe) => (
              <Box key={recipe.id} marginBottom="md">
                <RecipeCard
                  recipe={recipe}
                  onPress={() => onRecipeSelect(recipe.id)}
                />
              </Box>
            ))}
          </>
        )}
      </Box>
    </BottomSheet>
  );
};