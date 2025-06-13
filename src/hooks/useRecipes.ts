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

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      RecipeService.getUserRecipes(user.id)
        .then(setRecipes)
        .catch(() => setError("Could not load your recipes."))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

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
        const recipeName = nameMatch ? nameMatch[1].trim() : request;
        const newRecipe = await RecipeService.saveRecipe(user.id, {
          recipe_name: recipeName,
          recipe_content: recipeContent,
          recipe_request: request,
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
      // Optimistic UI update
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId ? { ...r, is_favorite: !currentStatus } : r
        )
      );

      try {
        await RecipeService.toggleFavorite(recipeId);
      } catch (err) {
        console.error("Failed to toggle favorite:", err);
        // Revert on failure
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
  };
};
