import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  GeminiService,
  RecipeData,
  RecipeIngredient,
  RecipeInstruction,
} from "../services/ai/gemini";
import { RecipeService, UserRecipe } from "../services/supabase";
import { useAuthStore } from "../stores/authStore";

const geminiService = new GeminiService();

const reconstructMarkdownFromData = (data: RecipeData): string => {
  let content = `**Why This Recipe Is Good For You:**\n${data.whyGood}\n\n`;

  content += "**Ingredients:**\n";
  data.ingredients.forEach((ing: RecipeIngredient) => {
    content += `- ${ing.amount} ${ing.name}\n`;
  });
  content += "\n";

  content += "**Instructions:**\n";
  data.instructions.forEach((inst: RecipeInstruction) => {
    content += `${inst.step}. ${inst.text}\n`;
  });
  content += "\n";

  content += "**Success Tips for Beginners:**\n";
  data.tips.forEach((tip: string) => {
    content += `- ${tip}\n`;
  });

  return content;
};

export const useRecipes = () => {
  const { user } = useAuthStore();
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchRecipes = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const data = await RecipeService.getUserRecipes(user.id);
        setRecipes(data);
      } catch (err) {
        setError("Could not load your recipes.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    refetchRecipes();
  }, [refetchRecipes]);

  const generateAndSaveRecipe = useCallback(
    async (request: string) => {
      if (!user) {
        Alert.alert(
          "Authentication Error",
          "You must be logged in to create a recipe."
        );
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        // 1. Get structured data from the AI
        const recipeData = await geminiService.generateRecipe(request);

        // 2. Reconstruct the human-readable markdown content
        const recipeContent = reconstructMarkdownFromData(recipeData);

        // 3. Save the new recipe to the database
        const newRecipe = await RecipeService.saveRecipe(user.id, {
          recipe_name: recipeData.recipeName,
          recipe_content: recipeContent,
          recipe_request: request,
          recipe_data: recipeData, // Save the structured JSON
          difficulty_level: recipeData.difficulty,
          estimated_time: recipeData.totalTime,
        });

        setRecipes((prev) => [newRecipe, ...prev]);
        return newRecipe;
      } catch (err: any) {
        console.error("Recipe generation/saving failed:", err);
        const errorMessage = err.message || "An unknown error occurred.";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const deleteRecipe = useCallback(
    async (recipeId: string) => {
      // Optimistic UI update
      const originalRecipes = recipes;
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));

      try {
        await RecipeService.deleteRecipe(recipeId);
      } catch (err) {
        console.error("Failed to delete recipe:", err);
        // Revert if API call fails
        setRecipes(originalRecipes);
        Alert.alert("Error", "Could not delete the recipe. Please try again.");
      }
    },
    [recipes]
  );

  const toggleFavorite = useCallback(
    async (recipeId: string, currentStatus: boolean) => {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId ? { ...r, is_favorite: !currentStatus } : r
        )
      );
      try {
        await RecipeService.toggleFavorite(recipeId);
      } catch (err) {
        console.error("Failed to toggle favorite:", err);
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId ? { ...r, is_favorite: currentStatus } : r
          )
        );
        Alert.alert("Error", "Could not update favorite status.");
      }
    },
    []
  );

  return {
    recipes,
    isLoading,
    error,
    generateAndSaveRecipe,
    deleteRecipe,
    toggleFavorite,
    refetchRecipes,
  };
};
