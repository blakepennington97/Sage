// src/services/recipeStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export class RecipeStorageService {
  static async saveRecipe(recipe: {
    content: string;
    request: string;
    name?: string;
  }): Promise<SavedRecipe> {
    try {
      const existingRecipes = await this.getAllRecipes();

      const newRecipe: SavedRecipe = {
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

      const updatedRecipes = [newRecipe, ...existingRecipes];
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updatedRecipes));

      return newRecipe;
    } catch (error) {
      console.error("Failed to save recipe:", error);
      throw error;
    }
  }

  static async getAllRecipes(): Promise<SavedRecipe[]> {
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
      console.error("Failed to load recipes:", error);
      return [];
    }
  }

  static async deleteRecipe(id: string): Promise<void> {
    try {
      const recipes = await this.getAllRecipes();
      const filtered = recipes.filter((recipe) => recipe.id !== id);
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      throw error;
    }
  }

  static async toggleFavorite(id: string): Promise<void> {
    try {
      const recipes = await this.getAllRecipes();
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
      const recipes = await this.getAllRecipes();
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
    const recipes = await this.getAllRecipes();
    return recipes.filter((recipe) => recipe.isFavorite);
  }

  static async getRecentRecipes(limit: number = 5): Promise<SavedRecipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.slice(0, limit);
  }

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
