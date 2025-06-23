import { useCallback } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GeminiService,
  RecipeData,
  RecipeIngredient,
  RecipeInstruction,
} from "../services/ai/gemini";
import { RecipeService, UserRecipe } from "../services/supabase";
import { useAuthStore } from "../stores/authStore";
import { ErrorHandler, withErrorHandling } from "../utils/errorHandling";

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

// Query Keys
const QUERY_KEYS = {
  recipes: (userId: string) => ['recipes', userId],
} as const;

export const useRecipes = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch recipes with TanStack Query
  const {
    data: recipes = [],
    isLoading,
    error,
    refetch: refetchRecipes,
  } = useQuery({
    queryKey: QUERY_KEYS.recipes(user?.id || ''),
    queryFn: () => RecipeService.getUserRecipes(user!.id),
    enabled: !!user, // Only run query if user exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate and save recipe mutation
  const generateRecipeMutation = useMutation({
    mutationFn: async ({ request, context }: { request: string; context?: { remainingMacros?: { calories: number; protein: number; carbs: number; fat: number } } }) => {
      if (!user) {
        throw new Error("User must be authenticated");
      }

      // 1. Get structured data from the AI
      const recipeData = await geminiService.generateRecipe(request, context);

      // 2. Reconstruct the human-readable markdown content
      const recipeContent = reconstructMarkdownFromData(recipeData);

      // 3. Save the new recipe to the database
      const newRecipe = await RecipeService.saveRecipe(user.id, {
        recipe_name: recipeData.recipeName,
        recipe_content: recipeContent,
        recipe_request: request,
        recipe_data: recipeData,
        difficulty_level: recipeData.difficulty,
        estimated_time: recipeData.totalTime,
      });

      return newRecipe;
    },
    onSuccess: (newRecipe) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        QUERY_KEYS.recipes(user!.id),
        (oldData: UserRecipe[] = []) => [newRecipe, ...oldData]
      );
    },
    onError: (error: any) => {
      ErrorHandler.handleError(error, "recipe generation");
    },
  });

  const generateAndSaveRecipe = useCallback(
    async (request: string, context?: { remainingMacros?: { calories: number; protein: number; carbs: number; fat: number } }) => {
      if (!user) {
        Alert.alert(
          "Authentication Error",
          "You must be logged in to create a recipe."
        );
        return null;
      }

      try {
        return await generateRecipeMutation.mutateAsync({ request, context });
      } catch {
        return null;
      }
    },
    [user, generateRecipeMutation]
  );

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: (recipeId: string) => RecipeService.deleteRecipe(recipeId),
    onMutate: async (recipeId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.recipes(user!.id) });

      // Snapshot the previous value
      const previousRecipes = queryClient.getQueryData(QUERY_KEYS.recipes(user!.id));

      // Optimistically update
      queryClient.setQueryData(
        QUERY_KEYS.recipes(user!.id),
        (oldData: UserRecipe[] = []) => oldData.filter((r) => r.id !== recipeId)
      );

      return { previousRecipes };
    },
    onError: (err, recipeId, context) => {
      // Revert on error
      queryClient.setQueryData(QUERY_KEYS.recipes(user!.id), context?.previousRecipes);
      Alert.alert("Error", "Could not delete the recipe. Please try again.");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recipes(user!.id) });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ recipeId }: { recipeId: string; currentStatus: boolean }) => RecipeService.toggleFavorite(recipeId),
    onMutate: async ({ recipeId, currentStatus }: { recipeId: string; currentStatus: boolean }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.recipes(user!.id) });

      // Snapshot the previous value
      const previousRecipes = queryClient.getQueryData(QUERY_KEYS.recipes(user!.id));

      // Optimistically update
      queryClient.setQueryData(
        QUERY_KEYS.recipes(user!.id),
        (oldData: UserRecipe[] = []) =>
          oldData.map((r) =>
            r.id === recipeId ? { ...r, is_favorite: !currentStatus } : r
          )
      );

      return { previousRecipes };
    },
    onError: (err, variables, context) => {
      // Revert on error
      queryClient.setQueryData(QUERY_KEYS.recipes(user!.id), context?.previousRecipes);
      Alert.alert("Error", "Could not update favorite status.");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recipes(user!.id) });
    },
  });

  // Rate recipe mutation
  const rateRecipeMutation = useMutation({
    mutationFn: ({ recipeId, rating }: { recipeId: string; rating: number }) => 
      RecipeService.rateRecipe(recipeId, rating),
    onMutate: async ({ recipeId, rating }: { recipeId: string; rating: number }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.recipes(user!.id) });

      // Snapshot the previous value
      const previousRecipes = queryClient.getQueryData(QUERY_KEYS.recipes(user!.id));

      // Optimistically update
      queryClient.setQueryData(
        QUERY_KEYS.recipes(user!.id),
        (oldData: UserRecipe[] = []) =>
          oldData.map((r) =>
            r.id === recipeId ? { ...r, user_rating: rating } : r
          )
      );

      return { previousRecipes };
    },
    onError: (err, variables, context) => {
      // Revert on error
      queryClient.setQueryData(QUERY_KEYS.recipes(user!.id), context?.previousRecipes);
      Alert.alert("Error", "Could not update recipe rating.");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recipes(user!.id) });
    },
  });

  const deleteRecipe = useCallback(
    (recipeId: string) => {
      deleteRecipeMutation.mutate(recipeId);
    },
    [deleteRecipeMutation]
  );

  const toggleFavorite = useCallback(
    (recipeId: string, currentStatus: boolean) => {
      toggleFavoriteMutation.mutate({ recipeId, currentStatus });
    },
    [toggleFavoriteMutation]
  );

  const rateRecipe = useCallback(
    (recipeId: string, rating: number) => {
      rateRecipeMutation.mutate({ recipeId, rating });
    },
    [rateRecipeMutation]
  );

  return {
    recipes,
    isLoading: isLoading || generateRecipeMutation.isPending,
    error: error?.message || null,
    generateAndSaveRecipe,
    deleteRecipe,
    toggleFavorite,
    rateRecipe,
    refetchRecipes,
    // Additional loading states for specific operations
    isGenerating: generateRecipeMutation.isPending,
    isDeleting: deleteRecipeMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isRating: rateRecipeMutation.isPending,
  };
};
