import { GoogleGenerativeAI } from "@google/generative-ai";
import { AuthService, ProfileService, UserProfile, UserPreferencesService } from "../supabase";
import { APIKeyManager } from "./config";
import { UserPreferences, migratePreferences } from "../../types/userPreferences";
import { CostEstimationService } from "../costEstimation";
import { RecipeCacheService } from "./recipeCache";

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

const getSkillDescription = (profile: UserProfile): string => {
  const skillLabels: Record<string, string> = {
    complete_beginner: "Complete beginner (rarely cooks)",
    basic_skills: "Basic skills (simple dishes)",
    developing: "Developing cook (regular cooking)",
    confident: "Confident cook (experiments often)",
  };
  return skillLabels[profile.skill_level || ""] || "Unknown skill level";
};

const getKitchenSummary = (profile: UserProfile): string => {
  const userTools = profile.kitchen_tools || [];
  const hasEssentials = ["chef_knife", "cutting_board", "mixing_bowls"].every(
    (tool) => userTools.includes(tool)
  );
  const stoveDesc: Record<string, string> = {
    gas: "gas stove",
    electric: "electric stove",
    induction: "induction cooktop",
    none: "no stove/microwave only",
  };
  const spaceDesc =
    profile.space_level <= 2
      ? "limited"
      : profile.space_level >= 4
      ? "spacious"
      : "moderate";
  return `${hasEssentials ? "Well-equipped" : "Basic"} kitchen with ${
    stoveDesc[profile.stove_type] || "unknown stove"
  }, ${profile.has_oven ? "has an oven" : "no oven"}, and ${spaceDesc} space.`;
};

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

    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
  }

  private async initializeWebSearch(): Promise<any> {
    const apiKey = await APIKeyManager.getGeminiKey();
    if (!apiKey) throw new Error("API key not found in settings.");
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Create a model with web search capabilities
    return this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      tools: [{ googleSearchRetrieval: {} }],
      generationConfig: { responseMimeType: "application/json" },
    });
  }

  private async getRecipeRequestContext(request: string): Promise<{
    userContext: string;
    cacheRequest: {
      prompt: string;
      userSkillLevel?: string;
      dietaryRestrictions?: string[];
      allergies?: string[];
      kitchenTools?: string[];
      preferences?: string;
    };
  }> {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return {
        userContext: "The user is not logged in. Provide generic advice.",
        cacheRequest: { prompt: request }
      };
    }

    const profile = await ProfileService.getProfile(user.id);
    if (!profile || !profile.skill_level) {
      return {
        userContext: "The user has not completed their profile. Provide generic, beginner-friendly advice.",
        cacheRequest: { prompt: request }
      };
    }

    // Get user preferences for enhanced personalization
    let preferences: UserPreferences | null = null;
    try {
      const preferencesRecord = await UserPreferencesService.getPreferences(user.id);
      if (preferencesRecord) {
        preferences = migratePreferences(
          preferencesRecord.preferences_data, 
          preferencesRecord.version, 
          '1.0'
        );
      }
    } catch (error) {
      console.warn("Could not fetch user preferences, using basic profile only");
    }

    const userFears = profile.cooking_fears || [];
    
    // Build basic profile context with critical safety information
    let userContext = `
      USER COOKING PROFILE:
      - Skill Level: ${getSkillDescription(profile)}
      - Kitchen Setup: ${getKitchenSummary(profile)}
      - Confidence: ${profile.confidence_level}/5
      - Cooking Concerns: ${userFears.join(", ") || "None specified"}
      
      CRITICAL SAFETY INFORMATION:
      - Allergies: ${profile.allergies?.length > 0 ? profile.allergies.join(", ") : "None"}
      - Dietary Restrictions: ${profile.dietary_restrictions?.length > 0 ? profile.dietary_restrictions.join(", ") : "None"}
      
      BASIC CONSTRAINTS:
      - Match complexity to their skill level.
      - Only suggest recipes/techniques for their available tools.
      - NEVER suggest ingredients that match the user's allergies (this is critical for safety)
      - Respect all dietary restrictions listed above
      - ${profile.has_oven ? "" : "NO OVEN - stovetop/microwave only."}
      - ${profile.stove_type === "none" ? "NO STOVE - microwave/no-cook only." : ""}
      - ${profile.space_level <= 2 ? "Limited prep space - suggest one-pot or minimal dish recipes." : ""}
    `;

    // Build cache request object
    const cacheRequest = {
      prompt: request,
      userSkillLevel: profile.skill_level,
      dietaryRestrictions: profile.dietary_restrictions || [],
      allergies: profile.allergies || [],
      kitchenTools: profile.kitchen_tools || [],
      preferences: preferences ? JSON.stringify(preferences) : undefined
    };

    // Add enhanced context if preferences are available
    if (preferences && preferences.setupCompleted) {
      const { dietary, cookingContext, kitchenCapabilities, cookingStyles } = preferences;
      
      userContext += `
      
      ENHANCED PERSONALIZATION:
      
      DIETARY PREFERENCES:
      - Dietary Style: ${dietary.dietaryStyle}
      - Allergies: ${dietary.allergies.length > 0 ? dietary.allergies.map(a => a.replace(/_/g, ' ')).join(", ") : "None"}
      - Intolerances: ${dietary.intolerances.length > 0 ? dietary.intolerances.map(i => i.replace(/_/g, ' ')).join(", ") : "None"}
      - Spice Tolerance: ${dietary.spiceTolerance}
      - Health Goals: ${[
          dietary.nutritionGoals.lowSodium && "Low Sodium",
          dietary.nutritionGoals.highFiber && "High Fiber",
          dietary.nutritionGoals.targetProtein && `${dietary.nutritionGoals.targetProtein}g protein per meal`,
          dietary.nutritionGoals.targetCalories && `${dietary.nutritionGoals.targetCalories} daily calories`
        ].filter(Boolean).join(", ") || "None specified"}
      - Health Objectives: ${dietary.healthObjectives.length > 0 ? dietary.healthObjectives.map(o => o.replace(/_/g, ' ')).join(", ") : "None"}
      - Flavor Preferences: ${dietary.flavorPreferences.length > 0 ? dietary.flavorPreferences.map(f => f.replace(/_/g, ' ')).join(", ") : "None"}
      
      COOKING CONTEXT:
      - Typical Cooking Time: ${cookingContext.typicalCookingTime.replace('_', ' ')}
      - Budget Level: ${cookingContext.budgetLevel.replace('_', ' ')}
      - Typical Servings: ${cookingContext.typicalServings}
      - Meal Prep Style: ${cookingContext.mealPrepStyle.replace('_', ' ')}
      - Lifestyle: ${cookingContext.lifestyleFactors.join(", ") || "Not specified"}
      
      KITCHEN CAPABILITIES:
      - Specialty Appliances: ${kitchenCapabilities.appliances.specialty.length > 0 ? 
          kitchenCapabilities.appliances.specialty.map(a => a.replace(/_/g, ' ')).join(", ") : "None"}
      - Pantry Staples: ${kitchenCapabilities.pantryStaples.map(p => p.replace(/_/g, ' ')).join(", ")}
      - Storage: ${kitchenCapabilities.storageSpace.refrigerator} fridge, ${kitchenCapabilities.storageSpace.freezer} freezer, ${kitchenCapabilities.storageSpace.pantry} pantry
      - Technique Comfort: ${Object.entries(kitchenCapabilities.techniqueComfort)
          .map(([technique, level]) => `${technique.replace('_', ' ')}: ${level}/5`)
          .join(", ")}
      
      COOKING STYLE:
      - Preferred Cuisines: ${cookingStyles.preferredCuisines.length > 0 ? 
          cookingStyles.preferredCuisines.map(c => c.replace(/_/g, ' ')).join(", ") : "None"}
      - Cooking Moods: ${cookingStyles.cookingMoods.length > 0 ? 
          cookingStyles.cookingMoods.map(m => m.replace(/_/g, ' ')).join(", ") : "None"}
      - Favorite Ingredients: ${cookingStyles.favoriteIngredients.length > 0 ? 
          cookingStyles.favoriteIngredients.map(i => i.replace(/_/g, ' ')).join(", ") : "None specified"}
      - Avoided Ingredients: ${cookingStyles.avoidedIngredients.length > 0 ? 
          cookingStyles.avoidedIngredients.map(i => i.replace(/_/g, ' ')).join(", ") : "None"}
      
      PERSONALIZATION REQUIREMENTS:
      - SAFETY FIRST: NEVER suggest any ingredients that match the user's profile allergies or conflict with their dietary restrictions from onboarding
      - STRICTLY respect all dietary restrictions, allergies, and intolerances (both from profile and preferences)
      - Profile allergies and dietary restrictions take precedence over all other preferences
      - Match the user's preferred cuisine styles and cooking moods (including custom cuisines)
      - Consider their typical cooking time and budget constraints
      - Adapt recipes to their available appliances and storage (including custom appliances)
      - Suggest techniques within their comfort level, but offer growth opportunities
      - Include their favorite ingredients when possible (including custom ingredients)
      - Avoid ingredients they dislike (including custom avoided ingredients)
      - Match spice level to their tolerance and flavor preferences
      - Consider their health objectives and nutrition goals (including custom health goals)
      - Honor both standard and user-defined preferences with equal importance
      `;
    } else {
      userContext += `
      
      NOTE: User has not completed advanced preference setup. Using basic profile only.
      Consider suggesting they customize their preferences for better recommendations.
      `;
    }

    return { userContext, cacheRequest };
  }

  private async getUserContext(): Promise<string> {
    const user = await AuthService.getCurrentUser();
    if (!user) return "The user is not logged in. Provide generic advice.";

    const profile = await ProfileService.getProfile(user.id);
    if (!profile || !profile.skill_level) {
      return "The user has not completed their profile. Provide generic, beginner-friendly advice.";
    }

    // Get user preferences for enhanced personalization
    let preferences: UserPreferences | null = null;
    try {
      const preferencesRecord = await UserPreferencesService.getPreferences(user.id);
      if (preferencesRecord) {
        preferences = migratePreferences(
          preferencesRecord.preferences_data, 
          preferencesRecord.version, 
          '1.0'
        );
      }
    } catch (error) {
      console.warn("Could not fetch user preferences, using basic profile only");
    }

    const userFears = profile.cooking_fears || [];
    
    // Build basic profile context with critical safety information
    let context = `
      USER COOKING PROFILE:
      - Skill Level: ${getSkillDescription(profile)}
      - Kitchen Setup: ${getKitchenSummary(profile)}
      - Confidence: ${profile.confidence_level}/5
      - Cooking Concerns: ${userFears.join(", ") || "None specified"}
      
      CRITICAL SAFETY INFORMATION:
      - Allergies: ${profile.allergies?.length > 0 ? profile.allergies.join(", ") : "None"}
      - Dietary Restrictions: ${profile.dietary_restrictions?.length > 0 ? profile.dietary_restrictions.join(", ") : "None"}
      
      BASIC CONSTRAINTS:
      - Match complexity to their skill level.
      - Only suggest recipes/techniques for their available tools.
      - NEVER suggest ingredients that match the user's allergies (this is critical for safety)
      - Respect all dietary restrictions listed above
      - ${profile.has_oven ? "" : "NO OVEN - stovetop/microwave only."}
      - ${profile.stove_type === "none" ? "NO STOVE - microwave/no-cook only." : ""}
      - ${profile.space_level <= 2 ? "Limited prep space - suggest one-pot or minimal dish recipes." : ""}
    `;

    // Add enhanced context if preferences are available
    if (preferences && preferences.setupCompleted) {
      const { dietary, cookingContext, kitchenCapabilities, cookingStyles } = preferences;
      
      context += `
      
      ENHANCED PERSONALIZATION:
      
      DIETARY PREFERENCES:
      - Dietary Style: ${dietary.dietaryStyle}
      - Allergies: ${dietary.allergies.length > 0 ? dietary.allergies.map(a => a.replace(/_/g, ' ')).join(", ") : "None"}
      - Intolerances: ${dietary.intolerances.length > 0 ? dietary.intolerances.map(i => i.replace(/_/g, ' ')).join(", ") : "None"}
      - Spice Tolerance: ${dietary.spiceTolerance}
      - Health Goals: ${[
          dietary.nutritionGoals.lowSodium && "Low Sodium",
          dietary.nutritionGoals.highFiber && "High Fiber",
          dietary.nutritionGoals.targetProtein && `${dietary.nutritionGoals.targetProtein}g protein per meal`,
          dietary.nutritionGoals.targetCalories && `${dietary.nutritionGoals.targetCalories} daily calories`
        ].filter(Boolean).join(", ") || "None specified"}
      - Health Objectives: ${dietary.healthObjectives.length > 0 ? dietary.healthObjectives.map(o => o.replace(/_/g, ' ')).join(", ") : "None"}
      - Flavor Preferences: ${dietary.flavorPreferences.length > 0 ? dietary.flavorPreferences.map(f => f.replace(/_/g, ' ')).join(", ") : "None"}
      
      COOKING CONTEXT:
      - Typical Cooking Time: ${cookingContext.typicalCookingTime.replace('_', ' ')}
      - Budget Level: ${cookingContext.budgetLevel.replace('_', ' ')}
      - Typical Servings: ${cookingContext.typicalServings}
      - Meal Prep Style: ${cookingContext.mealPrepStyle.replace('_', ' ')}
      - Lifestyle: ${cookingContext.lifestyleFactors.join(", ") || "Not specified"}
      
      KITCHEN CAPABILITIES:
      - Specialty Appliances: ${kitchenCapabilities.appliances.specialty.length > 0 ? 
          kitchenCapabilities.appliances.specialty.map(a => a.replace(/_/g, ' ')).join(", ") : "None"}
      - Pantry Staples: ${kitchenCapabilities.pantryStaples.map(p => p.replace(/_/g, ' ')).join(", ")}
      - Storage: ${kitchenCapabilities.storageSpace.refrigerator} fridge, ${kitchenCapabilities.storageSpace.freezer} freezer, ${kitchenCapabilities.storageSpace.pantry} pantry
      - Technique Comfort: ${Object.entries(kitchenCapabilities.techniqueComfort)
          .map(([technique, level]) => `${technique.replace('_', ' ')}: ${level}/5`)
          .join(", ")}
      
      COOKING STYLE:
      - Preferred Cuisines: ${cookingStyles.preferredCuisines.length > 0 ? 
          cookingStyles.preferredCuisines.map(c => c.replace(/_/g, ' ')).join(", ") : "None"}
      - Cooking Moods: ${cookingStyles.cookingMoods.length > 0 ? 
          cookingStyles.cookingMoods.map(m => m.replace(/_/g, ' ')).join(", ") : "None"}
      - Favorite Ingredients: ${cookingStyles.favoriteIngredients.length > 0 ? 
          cookingStyles.favoriteIngredients.map(i => i.replace(/_/g, ' ')).join(", ") : "None specified"}
      - Avoided Ingredients: ${cookingStyles.avoidedIngredients.length > 0 ? 
          cookingStyles.avoidedIngredients.map(i => i.replace(/_/g, ' ')).join(", ") : "None"}
      
      PERSONALIZATION REQUIREMENTS:
      - SAFETY FIRST: NEVER suggest any ingredients that match the user's profile allergies or conflict with their dietary restrictions from onboarding
      - STRICTLY respect all dietary restrictions, allergies, and intolerances (both from profile and preferences)
      - Profile allergies and dietary restrictions take precedence over all other preferences
      - Match the user's preferred cuisine styles and cooking moods (including custom cuisines)
      - Consider their typical cooking time and budget constraints
      - Adapt recipes to their available appliances and storage (including custom appliances)
      - Suggest techniques within their comfort level, but offer growth opportunities
      - Include their favorite ingredients when possible (including custom ingredients)
      - Avoid ingredients they dislike (including custom avoided ingredients)
      - Match spice level to their tolerance and flavor preferences
      - Consider their health objectives and nutrition goals (including custom health goals)
      - Honor both standard and user-defined preferences with equal importance
      `;
    } else {
      context += `
      
      NOTE: User has not completed advanced preference setup. Using basic profile only.
      Consider suggesting they customize their preferences for better recommendations.
      `;
    }

    return context;
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
      const userContext = await this.getUserContext();
      const prompt = `You are Sage, a friendly and encouraging AI cooking coach. Your goal is to help beginners build confidence.
      ${userContext}
      USER MESSAGE: "${userMessage}"
      COACHING STYLE: Be encouraging, supportive, and patient. Explain techniques simply. Assume beginner knowledge. Give specific, actionable advice. Address their specific concerns and limitations based on their profile. Respond as a helpful mentor.`;
      const result = await textModel.generateContent(prompt);
      return { message: result.response.text() };
    } catch (error) {
      console.error("Gemini API Error (getCookingAdvice):", error);
      throw new Error("Failed to get cooking advice from AI.");
    }
  }

  public async generateRecipe(request: string): Promise<RecipeData> {
    await this.initialize();
    try {
      // Get user context and cache request information
      const { userContext, cacheRequest } = await this.getRecipeRequestContext(request);
      
      // Try to get cached recipe first
      const cachedRecipe = await RecipeCacheService.getCachedRecipe(cacheRequest);
      if (cachedRecipe) {
        // Apply regional cost adjustments to cached recipe
        const currentRegion = CostEstimationService.getCurrentRegion();
        if (cachedRecipe.totalCost) {
          cachedRecipe.totalCost = CostEstimationService.adjustCostForRegion(cachedRecipe.totalCost);
        }
        if (cachedRecipe.costPerServing) {
          cachedRecipe.costPerServing = CostEstimationService.adjustCostForRegion(cachedRecipe.costPerServing);
        }
        if (cachedRecipe.costBreakdown) {
          cachedRecipe.costBreakdown = cachedRecipe.costBreakdown.map(item => ({
            ...item,
            estimatedCost: CostEstimationService.adjustCostForRegion(item.estimatedCost),
          }));
        }
        return cachedRecipe;
      }
      // We can now simplify the prompt slightly as the JSON mode handles syntax.
      const prompt = `Generate a beginner-friendly recipe based on the user's request and profile, including cost analysis and nutritional information.
        USER REQUEST: "${request}"
        ${userContext}
        The JSON object must match this exact structure:
        {
          "recipeName": "A catchy but clear name for the recipe",
          "difficulty": a number between 1 and 5 (1=easiest),
          "totalTime": "string (e.g., '30 minutes')",
          "whyGood": "A short, encouraging sentence explaining why this recipe fits the user's profile.",
          "ingredients": [ { "amount": "string", "name": "string" } ],
          "instructions": [ { "step": number, "text": "string" } ],
          "tips": [ "string" ],
          "servings": number (how many servings this recipe makes),
          "totalCost": number (estimated total cost in USD for all ingredients),
          "costPerServing": number (estimated cost per serving in USD),
          "costBreakdown": [ { "ingredient": "string", "estimatedCost": number } ],
          "caloriesPerServing": number (estimated calories per serving),
          "proteinPerServing": number (grams of protein per serving, decimal),
          "carbsPerServing": number (grams of carbs per serving, decimal),
          "fatPerServing": number (grams of fat per serving, decimal),
          "sugarPerServing": number (grams of sugar per serving, decimal, optional),
          "fiberPerServing": number (grams of fiber per serving, decimal, optional),
          "sodiumPerServing": number (mg of sodium per serving, whole number, optional)
        }
        
        ENHANCED COOKING INSTRUCTION GUIDELINES:
        - Write instructions with rich sensory descriptions to guide beginners
        - Include visual cues: "until golden brown and crispy", "when the edges start to curl", "until bubbling vigorously"
        - Add auditory cues: "you'll hear gentle sizzling", "when the bubbling subsides", "listen for the popping sound"
        - Include textural guidance: "until fork-tender", "when it feels firm to the touch", "until it coats the back of a spoon"
        - Describe aromatic indicators: "when fragrant", "until you smell the garlic blooming", "when the spices become aromatic"
        - Mention timing alongside sensory cues: "Sauté for 3-4 minutes until the onions become translucent and smell sweet"
        - Help beginners know what "done" looks like: "The sauce should be thick enough to coat pasta without pooling"
        - Include confidence-building phrases: "Don't worry if it takes a bit longer", "This is normal", "You're doing great"
        - Provide alternatives for common issues: "If it's browning too fast, lower the heat", "If too thick, add a splash of water"
        
        COST ESTIMATION GUIDELINES:
        - Use average US grocery store prices for ingredients
        - Consider typical package sizes (e.g., if recipe needs 1 onion, estimate cost of 1 onion from a 3lb bag)
        - Account for pantry staples at reduced cost (spices, oil, etc.)
        - Be realistic and helpful with cost estimates
        - Round costs to nearest $0.05 for readability
        
        NUTRITIONAL CALCULATION GUIDELINES:
        - Calculate macros based on ingredient quantities and standard nutritional data
        - Account for cooking methods (oils, cooking losses, etc.)
        - Provide realistic estimates based on typical ingredient compositions
        - Round calories to nearest 5, macros to 1 decimal place
        - Consider the user's macro goals when possible: ${userContext.includes('daily_calorie_goal') ? 'User has set macro goals - try to create balanced recipes' : 'User has not set macro goals yet'}
        - Include approximate sodium content for health awareness
        - Fiber content helps with satiety and health goals`;
      const result = await this.model.generateContent(prompt);
      // The output text is now guaranteed to be a valid JSON string.
      const recipeData = JSON.parse(result.response.text()) as RecipeData;
      
      // Apply regional cost adjustments
      const currentRegion = CostEstimationService.getCurrentRegion();
      if (recipeData.totalCost) {
        recipeData.totalCost = CostEstimationService.adjustCostForRegion(recipeData.totalCost);
      }
      if (recipeData.costPerServing) {
        recipeData.costPerServing = CostEstimationService.adjustCostForRegion(recipeData.costPerServing);
      }
      if (recipeData.costBreakdown) {
        recipeData.costBreakdown = recipeData.costBreakdown.map(item => ({
          ...item,
          estimatedCost: CostEstimationService.adjustCostForRegion(item.estimatedCost),
        }));
      }
      
      // Cache the generated recipe for future use
      await RecipeCacheService.cacheRecipe(cacheRequest, recipeData);
      
      return recipeData;
    } catch (error) {
      console.error("Recipe generation error:", error);
      throw new Error(
        "Failed to generate recipe from AI. The response may not be valid JSON."
      );
    }
  }

  public async modifyRecipe(originalRecipe: RecipeData, modificationRequest: string): Promise<RecipeData> {
    await this.initialize();
    try {
      const userContext = await this.getUserContext();
      
      const prompt = `Modify an existing recipe based on the user's request while maintaining the same structure and quality.
        
        ORIGINAL RECIPE:
        ${JSON.stringify(originalRecipe, null, 2)}
        
        USER MODIFICATION REQUEST: "${modificationRequest}"
        ${userContext}
        
        MODIFICATION GUIDELINES:
        - Keep the same recipe structure and format
        - Maintain nutritional balance when possible
        - Adjust cooking times and temperatures as needed for ingredient changes
        - Update cost estimates for any ingredient changes
        - Recalculate nutritional information for ingredient/portion changes
        - Preserve the beginner-friendly nature and descriptive instructions
        - If substituting ingredients, explain why the change works in the tips
        - Maintain or improve the difficulty level (don't make it harder for beginners)
        - Keep the same serving size unless specifically requested to change
        - Update the "whyGood" field to reflect the modifications if significant
        
        Return the modified recipe in the same JSON format:
        {
          "recipeName": "string (update if significantly changed)",
          "difficulty": number (1-5, same or easier),
          "totalTime": "string (adjust if cooking time changes)",
          "whyGood": "string (update to reflect modifications)",
          "ingredients": [ { "amount": "string", "name": "string" } ],
          "instructions": [ { "step": number, "text": "string" } ],
          "tips": [ "string (include tips about modifications)" ],
          "servings": number,
          "totalCost": number,
          "costPerServing": number,
          "costBreakdown": [ { "ingredient": "string", "estimatedCost": number } ],
          "caloriesPerServing": number,
          "proteinPerServing": number,
          "carbsPerServing": number,
          "fatPerServing": number,
          "sugarPerServing": number,
          "fiberPerServing": number,
          "sodiumPerServing": number
        }
        
        ENHANCED COOKING INSTRUCTION GUIDELINES (same as generation):
        - Write instructions with rich sensory descriptions to guide beginners
        - Include visual cues: "until golden brown and crispy", "when the edges start to curl", "until bubbling vigorously"
        - Add auditory cues: "you'll hear gentle sizzling", "when the bubbling subsides", "listen for the popping sound"
        - Include textural guidance: "until fork-tender", "when it feels firm to the touch", "until it coats the back of a spoon"
        - Describe aromatic indicators: "when fragrant", "until you smell the garlic blooming", "when the spices become aromatic"
        - Mention timing alongside sensory cues: "Sauté for 3-4 minutes until the onions become translucent and smell sweet"
        - Help beginners know what "done" looks like: "The sauce should be thick enough to coat pasta without pooling"
        - Include confidence-building phrases: "Don't worry if it takes a bit longer", "This is normal", "You're doing great"
        - Provide alternatives for common issues: "If it's browning too fast, lower the heat", "If too thick, add a splash of water"`;

      const result = await this.model.generateContent(prompt);
      const modifiedRecipe = JSON.parse(result.response.text()) as RecipeData;
      
      // Apply regional cost adjustments
      const currentRegion = CostEstimationService.getCurrentRegion();
      if (modifiedRecipe.totalCost) {
        modifiedRecipe.totalCost = CostEstimationService.adjustCostForRegion(modifiedRecipe.totalCost);
      }
      if (modifiedRecipe.costPerServing) {
        modifiedRecipe.costPerServing = CostEstimationService.adjustCostForRegion(modifiedRecipe.costPerServing);
      }
      if (modifiedRecipe.costBreakdown) {
        modifiedRecipe.costBreakdown = modifiedRecipe.costBreakdown.map(item => ({
          ...item,
          estimatedCost: CostEstimationService.adjustCostForRegion(item.estimatedCost),
        }));
      }
      
      return modifiedRecipe;
    } catch (error) {
      console.error("Recipe modification error:", error);
      throw new Error(
        "Failed to modify recipe from AI. The response may not be valid JSON."
      );
    }
  }

  public async generateGroceryList(
    recipeContent: string
  ): Promise<GroceryListData> {
    await this.initialize();
    try {
      const prompt = `Analyze the recipe and generate a grocery list.
        **Recipe Content:**
        """
        ${recipeContent}
        """
        **Required JSON Output Format:**
        [
          { "category": "string", "items": ["string"] }
        ]
      `;
      const result = await this.model.generateContent(prompt);
      // The output text is now guaranteed to be a valid JSON string.
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
      
      const prompt = `Search the web for current nutritional information for this food item: "${foodQuery}"
        
        Look for official nutrition facts from:
        - Brand websites (highest priority)
        - USDA food database 
        - MyFitnessPal
        - Nutrition labels from retailer websites
        - Calorie counting apps
        
        Return the most accurate nutritional information in JSON format:
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
        - Prefer branded products if brand is mentioned in query
        - Use standard serving sizes when possible
        - Set confidence to "high" for official brand/USDA data, "medium" for nutrition apps, "low" for estimated data
        - Include brand name only if specifically identified
        - Round values to 1 decimal place for grams, whole numbers for calories and mg
        - If multiple serving sizes found, choose the most common one
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
      throw new Error("Failed to look up nutritional information. Please try a more specific food name or check your connection.");
    }
  }
}
