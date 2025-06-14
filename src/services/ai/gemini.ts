import { GoogleGenerativeAI } from "@google/generative-ai";
import { APIKeyManager } from "./config";
import { AuthService, ProfileService, UserProfile } from "../supabase";

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
  private model: any = null;

  private async initialize(): Promise<void> {
    if (this.model) return;
    const apiKey = await APIKeyManager.getGeminiKey();
    if (!apiKey) throw new Error("API key not found in settings.");
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  private async getUserContext(): Promise<string> {
    const user = await AuthService.getCurrentUser();
    if (!user) return "The user is not logged in. Provide generic advice.";

    const profile = await ProfileService.getProfile(user.id);
    if (!profile || !profile.skill_level) {
      return "The user has not completed their profile. Provide generic, beginner-friendly advice.";
    }

    const userFears = profile.cooking_fears || [];

    return `
      USER PROFILE:
      - Skill Level: ${getSkillDescription(profile)}
      - Kitchen Setup: ${getKitchenSummary(profile)}
      - Confidence: ${profile.confidence_level}/5
      - Cooking Concerns: ${userFears.join(", ") || "None specified"}
      
      CONSTRAINTS:
      - Match complexity to their skill level.
      - Only suggest recipes/techniques for their available tools.
      - ${profile.has_oven ? "" : "NO OVEN - stovetop/microwave only."}
      - ${
        profile.stove_type === "none"
          ? "NO STOVE - microwave/no-cook only."
          : ""
      }
      - ${
        profile.space_level <= 2
          ? "Limited prep space - suggest one-pot or minimal dish recipes."
          : ""
      }
    `;
  }

  public async getCookingAdvice(
    userMessage: string
  ): Promise<CookingCoachResponse> {
    await this.initialize();
    try {
      const userContext = await this.getUserContext();
      const prompt = `You are Sage, a friendly and encouraging AI cooking coach. Your goal is to help beginners build confidence.
      ${userContext}
      USER MESSAGE: "${userMessage}"
      COACHING STYLE: Be encouraging, supportive, and patient. Explain techniques simply. Assume beginner knowledge. Give specific, actionable advice. Address their specific concerns and limitations based on their profile. Respond as a helpful mentor.`;
      const result = await this.model.generateContent(prompt);
      return { message: result.response.text() };
    } catch (error) {
      console.error("Gemini API Error (getCookingAdvice):", error);
      throw new Error("Failed to get cooking advice from AI.");
    }
  }

  public async generateRecipe(request: string): Promise<string> {
    await this.initialize();
    try {
      const userContext = await this.getUserContext();
      const prompt = `You are Sage, an AI cooking coach. Generate a beginner-friendly recipe based on the user's request, tailored to their profile.

        USER REQUEST: "${request}"

        ${userContext}

        RESPONSE FORMAT (must be structured markdown, do not add any other text or introductions):
        **Recipe Name:** [Catchy Name]
        **Difficulty:** [1-5]/5 (auto-select based on user's profile skill level)
        **Total Time:** [e.g., 30 minutes]
        **Why This Recipe Is Good For You:** [Explain why it fits their skill, tools, and concerns]
        **Ingredients:**
        - [amount] [ingredient]
        - [amount] [ingredient]
        **Instructions:**
        1. [Clear, simple step. Explain the 'why' behind the technique.]
        2. [Another clear step...]
        **Success Tips for Beginners:**
        - [A tip that directly addresses one of their concerns, if applicable]
        - [A general tip for success with this recipe]`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Recipe generation error:", error);
      throw new Error("Failed to generate recipe from AI.");
    }
  }

  public async generateGroceryList(recipeContent: string): Promise<string> {
    await this.initialize();
    try {
      const prompt = `You are a helpful kitchen assistant. Analyze the following recipe content and generate a grocery list.

      **Instructions:**
      1.  Extract **only the ingredients** and their quantities from the recipe.
      2.  Group the ingredients into logical supermarket categories (e.g., **Produce**, **Meat & Seafood**, **Dairy & Eggs**, **Pantry**, **Spices**).
      3.  Format the output as a clean markdown list. Use bold for category titles.

      **Recipe Content:**
      """
      ${recipeContent}
      """

      **Example Output:**
      **Produce**
      - 1 large onion
      - 2 cloves garlic

      **Pantry**
      - 1 cup of rice
      - 2 tbsp olive oil
      `;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Grocery list generation error:", error);
      throw new Error("Failed to generate grocery list from AI.");
    }
  }
}
