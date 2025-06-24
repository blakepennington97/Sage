// Centralized prompt service for building AI prompts

import { AuthService, ProfileService, UserPreferencesService } from '../../supabase';
import { UserPreferences, migratePreferences } from '../../../types/userPreferences';
import { 
  PromptContext, 
  UserContextData, 
  RecipeGenerationParams,
  CookingAdviceParams,
  RecipeModificationParams,
  MacroContext
} from './types';
import { PROMPT_TEMPLATES, INSTRUCTION_GUIDELINES, COST_ESTIMATION_GUIDELINES, NUTRITIONAL_GUIDELINES } from './templates';
import { ContextBuilder } from './contextBuilders';
import { buildFewShotExamplesPrompt, getErrorCorrectionExamples } from './examples';

export class PromptService {
  /**
   * Get user context data from current user
   */
  private static async getUserContextData(): Promise<UserContextData> {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return { userId: undefined, profile: null, preferences: null };
    }

    const profile = await ProfileService.getProfile(user.id);
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

    return {
      userId: user.id,
      profile,
      preferences
    };
  }

  /**
   * Build complete prompt context
   */
  private static async buildPromptContext(macroContext?: MacroContext): Promise<PromptContext> {
    const userData = await this.getUserContextData();
    
    const safetyConstraints = ContextBuilder.buildSafetyConstraints(
      userData.profile,
      userData.preferences
    );

    return {
      user: userData,
      macro: macroContext,
      safety: safetyConstraints
    };
  }

  /**
   * Populate a prompt template with context data
   */
  private static populateTemplate(
    templateName: string,
    params: Record<string, any>,
    context: PromptContext
  ): string {
    const template = PROMPT_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Prompt template '${templateName}' not found`);
    }

    // Build context sections
    const contextSections = template.contextSections || [];
    const builtContext = ContextBuilder.buildCompleteContext(context);
    
    // Build the context sections string
    let contextString = '';
    for (const sectionName of contextSections) {
      if (builtContext[sectionName]) {
        contextString += '\n' + builtContext[sectionName] + '\n';
      }
    }

    // Start with base prompt
    let prompt = template.basePrompt;

    // Replace template variables
    prompt = prompt.replace('{{contextSections}}', contextString);
    
    // Replace other parameters
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Add guidelines for recipe generation
    if (templateName === 'recipeGeneration') {
      prompt += '\n\n' + INSTRUCTION_GUIDELINES;
      prompt += '\n\n' + COST_ESTIMATION_GUIDELINES;
      prompt += '\n\n' + NUTRITIONAL_GUIDELINES;
    }

    // Add few-shot examples for better JSON consistency
    const fewShotExamples = this.buildFewShotExamples(templateName);
    if (fewShotExamples) {
      prompt += '\n\n' + fewShotExamples;
    }

    return prompt;
  }

  /**
   * Generate recipe generation prompt
   */
  static async buildRecipeGenerationPrompt(params: RecipeGenerationParams): Promise<string> {
    const context = await this.buildPromptContext(params.context.macro);
    
    // Build history context string if history is provided
    let historyContext = '';
    if (params.history && params.history.length > 0) {
      historyContext = `RECIPE HISTORY CONTEXT:
For context, the user has recently generated the following recipes: ${params.history.join(', ')}. 
Please provide something new and distinct to avoid repetition.`;
    }
    
    return this.populateTemplate('recipeGeneration', {
      userRequest: params.request,
      historyContext: historyContext
    }, context);
  }

  /**
   * Generate recipe modification prompt
   */
  static async buildRecipeModificationPrompt(params: RecipeModificationParams): Promise<string> {
    const context = await this.buildPromptContext();
    
    return this.populateTemplate('recipeModification', {
      originalRecipe: JSON.stringify(params.originalRecipe, null, 2),
      modificationRequest: params.modificationRequest
    }, context);
  }

  /**
   * Generate cooking advice prompt
   */
  static async buildCookingAdvicePrompt(params: CookingAdviceParams): Promise<string> {
    const context = await this.buildPromptContext();
    
    return this.populateTemplate('cookingAdvice', {
      userMessage: params.userMessage
    }, context);
  }

  /**
   * Generate grocery list prompt
   */
  static async buildGroceryListPrompt(recipeContent: string): Promise<string> {
    return this.populateTemplate('groceryListGeneration', {
      recipeContent
    }, {
      user: { userId: undefined, profile: null, preferences: null },
      safety: { allergies: [], dietaryRestrictions: [], profileRestrictions: [], customRestrictions: [] }
    });
  }

  /**
   * Get cache request data for recipe caching
   */
  static async buildCacheRequest(request: string): Promise<{
    prompt: string;
    userSkillLevel?: string;
    dietaryRestrictions?: string[];
    allergies?: string[];
    kitchenTools?: string[];
    preferences?: string;
  }> {
    const userData = await this.getUserContextData();
    
    return {
      prompt: request,
      userSkillLevel: userData.profile?.skill_level,
      dietaryRestrictions: userData.profile?.dietary_restrictions || [],
      allergies: userData.profile?.allergies || [],
      kitchenTools: userData.profile?.kitchen_tools || [],
      preferences: userData.preferences ? JSON.stringify(userData.preferences) : undefined
    };
  }

  /**
   * Validate prompt safety constraints
   */
  static validatePromptSafety(prompt: string, context: PromptContext): boolean {
    const { safety } = context;
    
    // Check if prompt contains any forbidden allergies or restrictions
    const allRestrictions = [
      ...safety.allergies,
      ...safety.dietaryRestrictions,
      ...safety.profileRestrictions,
      ...safety.customRestrictions
    ];

    // This is a basic check - could be enhanced with more sophisticated validation
    for (const restriction of allRestrictions) {
      if (prompt.toLowerCase().includes(restriction.toLowerCase())) {
        console.warn(`Prompt safety check: Found potential restriction '${restriction}' in prompt`);
        return false;
      }
    }

    return true;
  }

  /**
   * Build enhanced few-shot examples for better JSON consistency
   */
  static buildFewShotExamples(templateName: string): string {
    const fewShotPrompt = buildFewShotExamplesPrompt(templateName, 2);
    const errorCorrection = getErrorCorrectionExamples(templateName);
    
    if (!fewShotPrompt && !errorCorrection) {
      return '';
    }

    let result = '';
    if (fewShotPrompt) {
      result += fewShotPrompt;
    }
    if (errorCorrection) {
      result += errorCorrection;
    }

    return result;
  }
}