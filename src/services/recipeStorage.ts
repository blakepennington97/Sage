// src/services/recipeStorage.ts - REPLACE EXISTING FILE
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecipeService, AuthService } from "./supabase";

export interface SavedRecipe {
  id: string;
  name: string;
  content: string;
  request: string;
  difficulty?: number;
  estimatedTime?: string;
  isFavorite: boolean;
  createdAt: Date;
  lastCooked?: Date;
  cookCount: number;
}

const RECIPES_KEY = "saved_recipes";
const MIGRATION_KEY = "recipes_migrated_to_cloud";

export class RecipeStorageService {
  // Main save method - tries cloud first, falls back to local
  static async saveRecipe(recipe: {
    content: string;
    request: string;
    name?: string;
  }): Promise<SavedRecipe> {
    try {
      const user = await AuthService.getCurrentUser();

      if (user) {
        // Save to cloud
        const cloudRecipe = await RecipeService.saveRecipe(user.id, {
          recipe_name:
            recipe.name ||
            this.extractRecipeName(recipe.content) ||
            recipe.request,
          recipe_content: recipe.content,
          recipe_request: recipe.request,
          difficulty_level: this.extractDifficulty(recipe.content),
          estimated_time: this.extractTime(recipe.content),
        });

        // Convert cloud format to local format
        const savedRecipe = this.mapCloudToLocal(cloudRecipe);

        // Also save locally as backup
        await this.saveLocalRecipe(savedRecipe);

        return savedRecipe;
      } else {
        // Not authenticated - save locally
        return await this.saveLocalRecipe(recipe);
      }
    } catch (error) {
      console.error("Error saving to cloud, saving locally:", error);
      return await this.saveLocalRecipe(recipe);
    }
  }

  // Get all recipes - cloud first, then local
  static async getAllRecipes(): Promise<SavedRecipe[]> {
    try {
      const user = await AuthService.getCurrentUser();

      if (user) {
        // Get from cloud
        const cloudRecipes = await RecipeService.getUserRecipes(user.id);
        const recipes = cloudRecipes.map(this.mapCloudToLocal);

        // Migrate local recipes if needed
        await this.migrateLocalRecipesToCloud(user.id);

        // Also cache locally
        await this.cacheRecipesLocally(recipes);

        return recipes;
      } else {
        // Not authenticated - get local recipes
        return await this.getLocalRecipes();
      }
    } catch (error) {
      console.error("Error fetching cloud recipes, using local:", error);
      return await this.getLocalRecipes();
    }
  }

  static async deleteRecipe(id: string): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();

      if (user) {
        // Delete from cloud
        await RecipeService.deleteRecipe(id);
      }

      // Also delete locally
      const recipes = await this.getLocalRecipes();
      const filtered = recipes.filter((recipe) => recipe.id !== id);
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting recipe:", error);
      throw error;
    }
  }

  static async toggleFavorite(id: string): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();

      if (user) {
        // Toggle in cloud
        await RecipeService.toggleFavorite(id);
      }

      // Also toggle locally
      const recipes = await this.getLocalRecipes();
      const updated = recipes.map((recipe) =>
        recipe.id === id
          ? { ...recipe, isFavorite: !recipe.isFavorite }
          : recipe
      );
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw error;
    }
  }

  static async markAsCooked(id: string): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();

      if (user) {
        // Mark in cloud
        await RecipeService.markAsCooked(id);
      }

      // Also mark locally
      const recipes = await this.getLocalRecipes();
      const updated = recipes.map((recipe) =>
        recipe.id === id
          ? {
              ...recipe,
              lastCooked: new Date(),
              cookCount: recipe.cookCount + 1,
            }
          : recipe
      );
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to mark as cooked:", error);
      throw error;
    }
  }

  static async getFavorites(): Promise<SavedRecipe[]> {
    try {
      const user = await AuthService.getCurrentUser();

      if (user) {
        const cloudRecipes = await RecipeService.getFavoriteRecipes(user.id);
        return cloudRecipes.map(this.mapCloudToLocal);
      } else {
        const recipes = await this.getLocalRecipes();
        return recipes.filter((recipe) => recipe.isFavorite);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      const recipes = await this.getLocalRecipes();
      return recipes.filter((recipe) => recipe.isFavorite);
    }
  }

  static async getRecentRecipes(limit: number = 5): Promise<SavedRecipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.slice(0, limit);
  }

  // Local storage methods (private)
  private static async getLocalRecipes(): Promise<SavedRecipe[]> {
    try {
      const stored = await AsyncStorage.getItem(RECIPES_KEY);
      if (!stored) return [];

      const recipes = JSON.parse(stored);
      return recipes.map((recipe: any) => ({
        ...recipe,
        createdAt: new Date(recipe.createdAt),
        lastCooked: recipe.lastCooked ? new Date(recipe.lastCooked) : undefined,
      }));
    } catch (error) {
      console.error("Failed to load local recipes:", error);
      return [];
    }
  }

  private static async saveLocalRecipe(
    recipe:
      | {
          content: string;
          request: string;
          name?: string;
        }
      | SavedRecipe
  ): Promise<SavedRecipe> {
    try {
      const existingRecipes = await this.getLocalRecipes();

      let newRecipe: SavedRecipe;

      if ("id" in recipe) {
        // Already a SavedRecipe
        newRecipe = recipe;
      } else {
        // Need to create SavedRecipe from basic recipe
        newRecipe = {
          id: Date.now().toString(),
          name:
            recipe.name ||
            this.extractRecipeName(recipe.content) ||
            recipe.request,
          content: recipe.content,
          request: recipe.request,
          difficulty: this.extractDifficulty(recipe.content),
          estimatedTime: this.extractTime(recipe.content),
          isFavorite: false,
          createdAt: new Date(),
          cookCount: 0,
        };
      }

      const updatedRecipes = [newRecipe, ...existingRecipes];
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updatedRecipes));

      return newRecipe;
    } catch (error) {
      console.error("Failed to save local recipe:", error);
      throw error;
    }
  }

  private static async cacheRecipesLocally(
    recipes: SavedRecipe[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error("Failed to cache recipes locally:", error);
    }
  }

  private static async migrateLocalRecipesToCloud(
    userId: string
  ): Promise<void> {
    try {
      const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
      if (migrated) return; // Already migrated

      const localRecipes = await this.getLocalRecipes();
      if (localRecipes.length === 0) {
        await AsyncStorage.setItem(MIGRATION_KEY, "true");
        return;
      }

      console.log(`Migrating ${localRecipes.length} local recipes to cloud...`);

      for (const recipe of localRecipes) {
        try {
          await RecipeService.saveRecipe(userId, {
            recipe_name: recipe.name,
            recipe_content: recipe.content,
            recipe_request: recipe.request,
            difficulty_level: recipe.difficulty || 1,
            estimated_time: recipe.estimatedTime || "",
          });
        } catch (error) {
          console.error(`Failed to migrate recipe ${recipe.id}:`, error);
        }
      }

      await AsyncStorage.setItem(MIGRATION_KEY, "true");
      console.log("✅ Recipe migration complete");
    } catch (error) {
      console.error("Failed to migrate recipes to cloud:", error);
    }
  }

  // Mapping functions
  private static mapCloudToLocal(cloudRecipe: any): SavedRecipe {
    return {
      id: cloudRecipe.id,
      name: cloudRecipe.recipe_name,
      content: cloudRecipe.recipe_content,
      request: cloudRecipe.recipe_request,
      difficulty: cloudRecipe.difficulty_level,
      estimatedTime: cloudRecipe.estimated_time,
      isFavorite: cloudRecipe.is_favorite,
      createdAt: new Date(cloudRecipe.created_at),
      lastCooked: cloudRecipe.last_cooked
        ? new Date(cloudRecipe.last_cooked)
        : undefined,
      cookCount: cloudRecipe.cook_count,
    };
  }

  // Extraction methods (unchanged)
  private static extractRecipeName(content: string): string | null {
    const lines = content.split("\n");
    const nameLine = lines.find(
      (line) =>
        line.includes("Recipe Name:") || line.includes("**Recipe Name:**")
    );
    if (nameLine) {
      return nameLine.replace(/\*\*Recipe Name:\*\*|Recipe Name:/, "").trim();
    }
    return null;
  }

  private static extractDifficulty(content: string): number | undefined {
    const difficultyMatch = content.match(/difficulty[:\s]*(\d+)/i);
    return difficultyMatch ? parseInt(difficultyMatch[1]) : undefined;
  }

  private static extractTime(content: string): string | undefined {
    const timeMatch = content.match(
      /total time[:\s]*(\d+\s*(?:minutes?|mins?|hours?))/i
    );
    return timeMatch ? timeMatch[1] : undefined;
  }
}
