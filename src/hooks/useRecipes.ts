import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { RecipeService, UserRecipe } from "../services/supabase";
import { GeminiService } from "../services/ai";
import { Alert } from "react-native";

const geminiService = new GeminiService();

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
        const recipeContent = await geminiService.generateRecipe(request);
        const nameMatch = recipeContent.match(/\*\*Recipe Name:\*\*\s*(.*)/);
        const difficultyMatch = recipeContent.match(
          /\*\*Difficulty:\*\*\s*(\d)/
        );
        const timeMatch = recipeContent.match(/\*\*Total Time:\*\*\s*(.*)/);

        const recipeName = nameMatch ? nameMatch[1].trim() : "Untitled Recipe";
        const difficultyLevel = difficultyMatch
          ? parseInt(difficultyMatch[1], 10)
          : 1;
        const estimatedTime = timeMatch ? timeMatch[1].trim() : "N/A";

        const newRecipe = await RecipeService.saveRecipe(user.id, {
          recipe_name: recipeName,
          recipe_content: recipeContent,
          recipe_request: request,
          difficulty_level: difficultyLevel,
          estimated_time: estimatedTime,
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
