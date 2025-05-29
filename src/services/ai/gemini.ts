// src/services/ai/gemini.ts - Replace your existing gemini.ts with this
import { GoogleGenerativeAI } from "@google/generative-ai";
import { APIKeyManager } from "./config";

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
    userProfile?: any
  ): Promise<CookingCoachResponse> {
    if (!this.model) {
      await this.initialize();
    }

    try {
      const prompt = this.buildCookingPrompt(userMessage, userProfile);

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

  private buildCookingPrompt(userMessage: string, userProfile?: any): string {
    return `You are Sage, a friendly and encouraging AI cooking coach. Your goal is to help beginners build cooking confidence.

USER MESSAGE: ${userMessage}

COACHING STYLE:
- Be encouraging and supportive
- Explain techniques simply  
- Offer reassurance for cooking anxiety
- Give specific, actionable advice
- Keep responses conversational but helpful

Respond as if you're a patient cooking mentor helping a friend in their kitchen.`;
  }

  async generateRecipe(request: string, userProfile: any): Promise<any> {
    if (!this.model) {
      await this.initialize();
    }

    const prompt = `You are Sage, an AI cooking coach. Generate a beginner-friendly recipe based on this request: "${request}"

USER PROFILE:
- Experience Level: ${userProfile.experienceLevel || "Beginner"}
- Available Time: ${userProfile.timeAvailable || "30 minutes"}
- Kitchen Tools: ${userProfile.kitchenTools?.join(", ") || "Basic tools"}

RESPONSE FORMAT (return as JSON-like structure):
{
  "recipeName": "...",
  "difficulty": 1-5,
  "totalTime": "X minutes",
  "ingredients": ["...", "..."],
  "steps": ["Step 1: ...", "Step 2: ..."],
  "tips": ["Tip 1", "Tip 2"],
  "whyRecommended": "Why this recipe fits the user's profile"
}

Make instructions very clear for beginners. Include the "why" behind techniques.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Recipe generation error:", error);
      throw error;
    }
  }
}
