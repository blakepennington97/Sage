// Types for the centralized prompt system

export interface UserContextData {
  profile?: any;
  preferences?: any;
  userId?: string;
}

export interface MacroContext {
  remainingMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface PromptContext {
  user: UserContextData;
  macro?: MacroContext;
  safety: SafetyConstraints;
}

export interface SafetyConstraints {
  allergies: string[];
  dietaryRestrictions: string[];
  profileRestrictions: string[];
  customRestrictions: string[];
}

export interface PromptTemplate {
  name: string;
  version: string;
  basePrompt: string;
  contextSections: string[];
  outputFormat?: string;
  examples?: string[];
}

export interface RecipeGenerationParams {
  request: string;
  context: PromptContext;
  history?: string[]; // Optional recent recipe titles for diversity
}

export interface CookingAdviceParams {
  userMessage: string;
  context: PromptContext;
}

export interface RecipeModificationParams {
  originalRecipe: any;
  modificationRequest: string;
  context: PromptContext;
}