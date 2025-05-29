// src/services/ai/gemini.ts - Replace your existing gemini.ts with this
import { GoogleGenerativeAI } from "@google/generative-ai";
import { APIKeyManager } from "./config";
import { UserProfileService } from "../userProfile";
import { ResponseCacheService } from "../responseCache";

export interface CookingCoachResponse {
  message: string;
  confidence: number;
  suggestions?: string[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  async initialize(): Promise<void> {
    const apiKey = await APIKeyManager.getGeminiKey();
    if (!apiKey) {
      throw new Error(
        "Gemini API key not found. Please configure in settings."
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async getCookingAdvice(
    userMessage: string,
    includeProfile: boolean = true
  ): Promise<CookingCoachResponse> {
    if (!this.model) {
      await this.initialize();
    }

    try {
      const prompt = await this.buildCookingPrompt(userMessage, includeProfile);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        message: text,
        confidence: 0.8,
        suggestions: [],
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error(
        "Failed to get cooking advice. Please check your API configuration."
      );
    }
  }

  private async buildCookingPrompt(
    userMessage: string,
    includeProfile: boolean
  ): Promise<string> {
    let contextPrompt = `You are Sage, a friendly and encouraging AI cooking coach. Your goal is to help beginners build cooking confidence.

USER MESSAGE: ${userMessage}`;

    if (includeProfile) {
      try {
        const hasCompleted = await UserProfileService.hasCompletedOnboarding();
        if (hasCompleted) {
          const skillDesc = await UserProfileService.getSkillDescription();
          const kitchenSummary = await UserProfileService.getKitchenSummary();
          const fears = await UserProfileService.getFearsList();
          const profile = await UserProfileService.getProfile();

          contextPrompt = `You are Sage, a personalized AI cooking coach. Adapt your response to this specific user's profile.

USER PROFILE:
- Skill Level: ${skillDesc}
- Kitchen Setup: ${kitchenSummary}
- Confidence Level: ${profile.overallConfidence}/5
${fears.length > 0 ? `- Cooking Concerns: ${fears.join(", ")}` : "- No specific cooking concerns"}

USER MESSAGE: ${userMessage}

PERSONALIZATION GUIDELINES:
- Match complexity to their skill level (${profile.skillLevel})
- Only suggest recipes/techniques for their available tools
- ${profile.overallConfidence <= 2 ? "Provide extra encouragement and basic explanations" : ""}
- ${fears.includes("using knives") ? "Minimize knife work or provide detailed knife safety tips" : ""}
- ${fears.includes("timing multiple dishes") ? "Suggest single-pot meals or simple timing" : ""}
- ${fears.includes("burning food") ? "Include temperature and timing reminders" : ""}
- ${!profile.hasOven ? "Only suggest stovetop/microwave recipes" : ""}
- ${profile.stoveType === "none" ? "Focus on microwave and no-cook options" : ""}`;
        }
      } catch (error) {
        console.warn("Could not load profile, using generic prompt");
      }
    }

    return `${contextPrompt}

COACHING STYLE:
- Be encouraging and supportive
- Explain techniques simply
- Give specific, actionable advice
- Keep responses conversational but helpful
- Address their specific concerns and limitations

Respond as if you're a patient cooking mentor helping a friend in their kitchen.`;
  }

  async generateRecipe(request: string, difficulty?: number): Promise<any> {
    if (!this.model) {
      await this.initialize();
    }

    try {
      // Check cache first
      const profile = await UserProfileService.getProfile();
      const profileHash = ResponseCacheService.generateProfileHash(profile);
      const cached = await ResponseCacheService.getCachedResponse(
        request,
        profileHash
      );

      if (cached) {
        return cached;
      }

      const hasCompleted = await UserProfileService.hasCompletedOnboarding();
      let profileContext = "";

      if (hasCompleted) {
        const skillDesc = await UserProfileService.getSkillDescription();
        const kitchenSummary = await UserProfileService.getKitchenSummary();
        const fears = await UserProfileService.getFearsList();

        profileContext = `
USER PROFILE:
- Skill Level: ${skillDesc}
- Kitchen: ${kitchenSummary}
- Available Tools: ${profile.tools.join(", ")}
- Confidence: ${profile.overallConfidence}/5
${fears.length > 0 ? `- Concerns: ${fears.join(", ")}` : ""}

CONSTRAINTS:
- ${!profile.hasOven ? "NO OVEN - stovetop/microwave only" : ""}
- ${profile.stoveType === "none" ? "NO STOVE - microwave/no-cook only" : ""}
- ${profile.spaceLevel <= 2 ? "Limited prep space - minimal dishes/steps" : ""}
- Match difficulty to ${profile.skillLevel} level`;
      }

      const prompt = `You are Sage, an AI cooking coach. Generate a beginner-friendly recipe based on this request: "${request}"
${profileContext}

RESPONSE FORMAT (return as structured text):
**Recipe Name:** [Name]
**Difficulty:** ${difficulty || "Auto-select based on profile"}/5
**Total Time:** X minutes
**Why This Recipe:** [Why it fits their profile]

**Ingredients:**
- [ingredient with amount]
- [ingredient with amount]

**Instructions:**
1. [Step with explanation of why/how]
2. [Step with explanation of why/how]

**Success Tips:**
- [Tip specific to their concerns]
- [Encouragement for their skill level]

Make instructions very clear for beginners. Include the "why" behind techniques. Address their specific limitations and fears.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      // Cache the response
      await ResponseCacheService.setCachedResponse(
        request,
        content,
        profileHash
      );

      return content;
    } catch (error) {
      console.error("Recipe generation error:", error);
      throw error;
    }
  }
}
