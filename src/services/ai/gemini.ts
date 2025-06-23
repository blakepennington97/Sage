import { GoogleGenerativeAI } from "@google/generative-ai";
import { AuthService, ProfileService, UserProfile, UserPreferencesService } from "../supabase";
import { APIKeyManager } from "./config";
import { UserPreferences, migratePreferences } from "../../types/userPreferences";
import { CostEstimationService } from "../costEstimation";
import { RecipeCacheService } from "./recipeCache";
import { PromptService } from "./prompts/PromptService";

export interface RecipeInstruction {
  step: number;
  text: string;
}

export interface RecipeIngredient {
  amount: string;
  name: string;
}

export interface RecipeData {
  recipeName: string;
  difficulty: number;
  totalTime: string;
  whyGood: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  tips: string[];
  costPerServing?: number;
  totalCost?: number;
  servings?: number;
  costBreakdown?: {
    ingredient: string;
    estimatedCost: number;
  }[];
  // Macro information
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  sugarPerServing?: number;
  fiberPerServing?: number;
  sodiumPerServing?: number;
}

export interface GroceryListCategory {
  category: string;
  items: string[];
}
export type GroceryListData = GroceryListCategory[];


export interface CookingCoachResponse {
  message: string;
}

export interface FoodMacros {
  foodName: string;
  brandName?: string;
  servingSize: string;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  sugarPerServing?: number;
  fiberPerServing?: number;
  sodiumPerServing?: number;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  // This model will be configured for JSON output
  private model: any = null;

  private async initialize(): Promise<void> {
    if (this.model) return;
    const apiKey = await APIKeyManager.getGeminiKey();
    if (!apiKey) throw new Error("API key not found in settings.");
    this.genAI = new GoogleGenerativeAI(apiKey);

    // REMOVE the systemInstruction object entirely.
    // The model configuration should be simple.
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      // NO systemInstruction property here.
    });
  }

  private async initializeWebSearch(): Promise<any> {
    const apiKey = await APIKeyManager.getGeminiKey();
    if (!apiKey) throw new Error("API key not found in settings.");
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Create a model for structured responses without web search
    return this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
  }



  public async getCookingAdvice(
    userMessage: string
  ): Promise<CookingCoachResponse> {
    await this.initialize();
    try {
      // Because our main `this.model` is in JSON mode, we create a
      // temporary instance here for this specific text-based request.
      const textModel = this.genAI!.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      
      // Use PromptService to build centralized prompt
      const prompt = await PromptService.buildCookingAdvicePrompt({
        userMessage,
        context: {} as any // context will be built internally by PromptService
      });
      
      const result = await textModel.generateContent(prompt);
      return { message: result.response.text() };
    } catch (error) {
      console.error("Gemini API Error (getCookingAdvice):", error);
      throw new Error("Failed to get cooking advice from AI.");
    }
  }

  /**
   * Apply regional cost adjustments to recipe data
   */
  private applyCostAdjustments(recipeData: RecipeData): RecipeData {
    const currentRegion = CostEstimationService.getCurrentRegion();
    const adjustedRecipe = { ...recipeData };
    
    if (adjustedRecipe.totalCost) {
      adjustedRecipe.totalCost = CostEstimationService.adjustCostForRegion(adjustedRecipe.totalCost);
    }
    if (adjustedRecipe.costPerServing) {
      adjustedRecipe.costPerServing = CostEstimationService.adjustCostForRegion(adjustedRecipe.costPerServing);
    }
    if (adjustedRecipe.costBreakdown) {
      adjustedRecipe.costBreakdown = adjustedRecipe.costBreakdown.map(item => ({
        ...item,
        estimatedCost: CostEstimationService.adjustCostForRegion(item.estimatedCost),
      }));
    }
    
    return adjustedRecipe;
  }

  public async generateRecipe(request: string, context?: { remainingMacros?: { calories: number; protein: number; carbs: number; fat: number } }): Promise<RecipeData> {
    await this.initialize();
    try {
      // Get cache request information using PromptService
      const cacheRequest = await PromptService.buildCacheRequest(request);
      
      // Try to get cached recipe first
      const cachedRecipe = await RecipeCacheService.getCachedRecipe(cacheRequest);
      if (cachedRecipe) {
        // Apply regional cost adjustments to cached recipe
        return this.applyCostAdjustments(cachedRecipe);
      }

      // Use PromptService to build centralized prompt with macro context
      const prompt = await PromptService.buildRecipeGenerationPrompt({
        request,
        context: {
          user: {} as any, // will be built internally
          macro: context,
          safety: {} as any // will be built internally
        }
      });
      
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      let recipeData: any; // Use 'any' temporarily to check for an error key
      try {
        recipeData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("CRITICAL: AI response was not valid JSON.", parseError);
        // Log the raw response for debugging! This is crucial.
        console.error("RAW AI RESPONSE:", responseText);
        throw new Error(
          "The AI returned an unexpected response. Please try rephrasing your request."
        );
      }

      // NEW: Check for the structured error from our prompt instructions.
      if (recipeData.error) {
        console.warn("AI returned a structured error:", recipeData.error);
        throw new Error(`AI Error: ${recipeData.error}`);
      }

      // Validate that the response contains essential fields before proceeding
      if (!recipeData.recipeName || !recipeData.ingredients || !recipeData.instructions) {
          console.error("AI response is missing essential recipe fields.", recipeData);
          throw new Error("The AI response was incomplete. Please try again.");
      }
      
      // Validate that required fields exist and set defaults if needed
      if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients)) {
        recipeData.ingredients = [];
      }
      if (!recipeData.instructions || !Array.isArray(recipeData.instructions)) {
        recipeData.instructions = [];
      }
      if (!recipeData.tips || !Array.isArray(recipeData.tips)) {
        recipeData.tips = [];
      }
      
      // Apply regional cost adjustments
      const adjustedRecipe = this.applyCostAdjustments(recipeData);
      
      // Cache the generated recipe for future use
      await RecipeCacheService.cacheRecipe(cacheRequest, adjustedRecipe);
      
      return adjustedRecipe;
    } catch (error) {
      console.error("Recipe generation error:", error);
      // Re-throw the specific error message for the UI to display.
      throw new Error(error instanceof Error ? error.message : "Failed to generate recipe from AI.");
    }
  }

  public async modifyRecipe(originalRecipe: RecipeData, modificationRequest: string): Promise<RecipeData> {
    await this.initialize();
    try {
      // Use PromptService to build centralized prompt
      const prompt = await PromptService.buildRecipeModificationPrompt({
        originalRecipe,
        modificationRequest,
        context: {
          user: {} as any, // will be built internally
          safety: {} as any // will be built internally
        }
      });

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      let modifiedRecipe: any;
      try {
        modifiedRecipe = JSON.parse(responseText);
      } catch (parseError) {
        console.error("CRITICAL: AI recipe modification response was not valid JSON.", parseError);
        console.error("RAW AI RESPONSE:", responseText);
        throw new Error(
          "The AI returned an unexpected response while modifying the recipe. Please try rephrasing your request."
        );
      }

      // Check if the AI returned a structured error
      if (modifiedRecipe.error) {
        console.warn("AI returned a structured error during modification:", modifiedRecipe.error);
        throw new Error(`AI Error: ${modifiedRecipe.error}`);
      }

      // Validate that the response contains essential fields
      if (!modifiedRecipe.recipeName || !modifiedRecipe.ingredients || !modifiedRecipe.instructions) {
          console.error("AI modification response is missing essential recipe fields.", modifiedRecipe);
          throw new Error("The AI recipe modification was incomplete. Please try again.");
      }
      
      // Apply regional cost adjustments
      return this.applyCostAdjustments(modifiedRecipe);
    } catch (error) {
      console.error("Recipe modification error:", error);
      // Re-throw the specific error message for the UI to display.
      throw new Error(error instanceof Error ? error.message : "Failed to modify recipe from AI.");
    }
  }

  public async generateGroceryList(
    recipeContent: string
  ): Promise<GroceryListData> {
    await this.initialize();
    try {
      // Use PromptService to build centralized prompt
      const prompt = await PromptService.buildGroceryListPrompt(recipeContent);
      
      const result = await this.model.generateContent(prompt);
      return JSON.parse(result.response.text()) as GroceryListData;
    } catch (error) {
      console.error("Grocery list generation error:", error);
      throw new Error(
        "Failed to generate grocery list from AI. The response may not be valid JSON."
      );
    }
  }

  public async lookupFoodMacros(foodQuery: string): Promise<FoodMacros> {
    try {
      const webSearchModel = await this.initializeWebSearch();
      
      const prompt = `Provide nutritional information for this food item based on your knowledge: "${foodQuery}"
        
        Use your knowledge of common foods, brands, and nutritional databases to provide accurate information.
        For branded products, use typical nutritional values for that brand.
        For generic foods, use USDA or common nutritional data.
        
        Return the nutritional information in JSON format:
        {
          "foodName": "string (standardized food name)",
          "brandName": "string or null (if specific brand identified)",
          "servingSize": "string (e.g., '1 cup', '28g', '1 bar')",
          "caloriesPerServing": number,
          "proteinPerServing": number (grams),
          "carbsPerServing": number (grams),
          "fatPerServing": number (grams),
          "sugarPerServing": number (grams, optional),
          "fiberPerServing": number (grams, optional),
          "sodiumPerServing": number (mg, optional),
          "confidence": "high" | "medium" | "low" (based on source reliability),
          "source": "string (name of the source used)"
        }
        
        Guidelines:
        - For branded products (like "Big Mac"), use typical nutritional values for that specific product
        - Use standard serving sizes appropriate for the food type
        - Set confidence to "high" for well-known foods/brands, "medium" for estimated values, "low" for uncertain data
        - Include brand name only if specifically identified in the query
        - Round values to 1 decimal place for grams, whole numbers for calories and mg
        - Choose common/standard serving sizes for the food type
        - If the food is unclear, make reasonable assumptions and note lower confidence
        `;

      const result = await webSearchModel.generateContent(prompt);
      const macroData = JSON.parse(result.response.text()) as FoodMacros;
      
      // Validate the response has required fields
      if (!macroData.foodName || !macroData.servingSize || macroData.caloriesPerServing === undefined) {
        throw new Error("Incomplete nutritional data received");
      }
      
      return macroData;
    } catch (error) {
      console.error("Food macro lookup error:", error);
      throw new Error("Failed to look up nutritional information. Please try a more specific food name.");
    }
  }
}
