import { GoogleGenerativeAI } from "@google/generative-ai";
import { AuthService, ProfileService, UserProfile, UserPreferencesService } from "../supabase";
import { APIKeyManager } from "./config";
import { UserPreferences, migratePreferences } from "../../types/userPreferences";
import { CostEstimationService } from "../costEstimation";

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
      const userContext = await this.getUserContext();
      // We can now simplify the prompt slightly as the JSON mode handles syntax.
      const prompt = `Generate a beginner-friendly recipe based on the user's request and profile, including cost analysis.
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
          "costBreakdown": [ { "ingredient": "string", "estimatedCost": number } ]
        }
        
        COST ESTIMATION GUIDELINES:
        - Use average US grocery store prices for ingredients
        - Consider typical package sizes (e.g., if recipe needs 1 onion, estimate cost of 1 onion from a 3lb bag)
        - Account for pantry staples at reduced cost (spices, oil, etc.)
        - Be realistic and helpful with cost estimates
        - Round costs to nearest $0.05 for readability`;
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
      
      return recipeData;
    } catch (error) {
      console.error("Recipe generation error:", error);
      throw new Error(
        "Failed to generate recipe from AI. The response may not be valid JSON."
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
}
