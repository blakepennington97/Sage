import { GoogleGenerativeAI } from "@google/generative-ai";
import { AuthService, ProfileService, UserProfile, UserPreferencesService } from "../supabase";
import { APIKeyManager } from "./config";
import { UserPreferences, migratePreferences } from "../../types/userPreferences";

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
    
    // Build basic profile context
    let context = `
      USER COOKING PROFILE:
      - Skill Level: ${getSkillDescription(profile)}
      - Kitchen Setup: ${getKitchenSummary(profile)}
      - Confidence: ${profile.confidence_level}/5
      - Cooking Concerns: ${userFears.join(", ") || "None specified"}
      
      BASIC CONSTRAINTS:
      - Match complexity to their skill level.
      - Only suggest recipes/techniques for their available tools.
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
      - Allergies: ${dietary.allergies.length > 0 ? dietary.allergies.join(", ") : "None"}
      - Spice Tolerance: ${dietary.spiceTolerance}
      - Health Goals: ${[
          dietary.nutritionGoals.lowSodium && "Low Sodium",
          dietary.nutritionGoals.highFiber && "High Fiber",
          dietary.nutritionGoals.targetProtein && `${dietary.nutritionGoals.targetProtein}g protein per meal`,
          dietary.nutritionGoals.targetCalories && `${dietary.nutritionGoals.targetCalories} daily calories`
        ].filter(Boolean).join(", ") || "None specified"}
      - Health Objectives: ${dietary.healthObjectives.join(", ") || "None"}
      
      COOKING CONTEXT:
      - Typical Cooking Time: ${cookingContext.typicalCookingTime.replace('_', ' ')}
      - Budget Level: ${cookingContext.budgetLevel.replace('_', ' ')}
      - Typical Servings: ${cookingContext.typicalServings}
      - Meal Prep Style: ${cookingContext.mealPrepStyle.replace('_', ' ')}
      - Lifestyle: ${cookingContext.lifestyleFactors.join(", ") || "Not specified"}
      
      KITCHEN CAPABILITIES:
      - Specialty Appliances: ${kitchenCapabilities.appliances.specialty.join(", ") || "None"}
      - Pantry Staples: ${kitchenCapabilities.pantryStaples.join(", ")}
      - Storage: ${kitchenCapabilities.storageSpace.refrigerator} fridge, ${kitchenCapabilities.storageSpace.freezer} freezer, ${kitchenCapabilities.storageSpace.pantry} pantry
      - Technique Comfort: ${Object.entries(kitchenCapabilities.techniqueComfort)
          .map(([technique, level]) => `${technique.replace('_', ' ')}: ${level}/5`)
          .join(", ")}
      
      COOKING STYLE:
      - Preferred Cuisines: ${cookingStyles.preferredCuisines.join(", ")}
      - Cooking Moods: ${cookingStyles.cookingMoods.join(", ")}
      - Favorite Ingredients: ${cookingStyles.favoriteIngredients.length > 0 ? cookingStyles.favoriteIngredients.join(", ") : "None specified"}
      - Avoided Ingredients: ${cookingStyles.avoidedIngredients.length > 0 ? cookingStyles.avoidedIngredients.join(", ") : "None"}
      
      PERSONALIZATION REQUIREMENTS:
      - STRICTLY respect all dietary restrictions and allergies
      - Match the user's preferred cuisine styles and cooking moods
      - Consider their typical cooking time and budget constraints
      - Adapt recipes to their available appliances and storage
      - Suggest techniques within their comfort level, but offer growth opportunities
      - Include their favorite ingredients when possible
      - Avoid ingredients they dislike
      - Match spice level to their tolerance
      - Consider their health and nutrition goals
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
      const prompt = `Generate a beginner-friendly recipe based on the user's request and profile.
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
          "tips": [ "string" ]
        }`;
      const result = await this.model.generateContent(prompt);
      // The output text is now guaranteed to be a valid JSON string.
      return JSON.parse(result.response.text()) as RecipeData;
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
