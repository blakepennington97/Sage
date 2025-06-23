// Context builders for populating prompt templates with user data

import { UserPreferences, migratePreferences } from '../../../types/userPreferences';
import { UserContextData, SafetyConstraints, PromptContext } from './types';

export class ContextBuilder {
  /**
   * Build complete safety constraints from all sources
   */
  static buildSafetyConstraints(profile: any, preferences?: UserPreferences): SafetyConstraints {
    const constraints: SafetyConstraints = {
      allergies: [],
      dietaryRestrictions: [],
      profileRestrictions: [],
      customRestrictions: []
    };

    // Profile-level constraints (highest priority)
    if ((profile?.allergies || []).length > 0) {
      constraints.allergies = [...(profile.allergies || [])];
      constraints.profileRestrictions.push(...(profile.allergies || []).map((a: string) => `ALLERGY: ${a}`));
    }
    
    if ((profile?.dietary_restrictions || []).length > 0) {
      constraints.dietaryRestrictions = [...(profile.dietary_restrictions || [])];
      constraints.profileRestrictions.push(...(profile.dietary_restrictions || []).map((d: string) => `DIET: ${d}`));
    }

    // Preference-level constraints
    if (preferences?.dietary) {
      const { dietary } = preferences;
      
      if ((dietary.allergies || []).length > 0) {
        constraints.allergies.push(...(dietary.allergies || []));
        constraints.customRestrictions.push(...(dietary.allergies || []).map(a => `ALLERGY: ${a}`));
      }
      
      if ((dietary.intolerances || []).length > 0) {
        constraints.customRestrictions.push(...(dietary.intolerances || []).map(i => `INTOLERANCE: ${i}`));
      }
      
      if ((dietary.customDietaryRestrictions || []).length > 0) {
        constraints.customRestrictions.push(...(dietary.customDietaryRestrictions || []).map(c => `CUSTOM: ${c}`));
      }
    }

    return constraints;
  }

  /**
   * Get skill level description
   */
  static getSkillDescription(profile: any): string {
    const skillLabels: Record<string, string> = {
      complete_beginner: "Complete beginner (rarely cooks)",
      basic_skills: "Basic skills (simple dishes)",
      developing: "Developing cook (regular cooking)",
      confident: "Confident cook (experiments often)",
    };
    return skillLabels[profile?.skill_level || ""] || "Unknown skill level";
  }

  /**
   * Get kitchen setup summary
   */
  static getKitchenSummary(profile: any): string {
    const userTools = profile?.kitchen_tools || [];
    const hasEssentials = ["chef_knife", "cutting_board", "mixing_bowls"].every(
      (tool) => userTools.includes(tool)
    );
    
    const stoveDesc: Record<string, string> = {
      gas: "gas stove",
      electric: "electric stove", 
      induction: "induction cooktop",
      none: "no stove/microwave only",
    };
    
    const spaceDesc = profile?.space_level <= 2 ? "limited" : profile?.space_level >= 4 ? "spacious" : "moderate";
    
    return `${hasEssentials ? "Well-equipped" : "Basic"} kitchen with ${
      stoveDesc[profile?.stove_type] || "unknown stove"
    }, ${profile?.has_oven ? "has an oven" : "no oven"}, and ${spaceDesc} space.`;
  }

  /**
   * Build user profile context section
   */
  static buildUserProfileContext(profile: any): string {
    const userFears = profile?.cooking_fears || [];
    
    return `
USER COOKING PROFILE:
- Skill Level: ${this.getSkillDescription(profile)}
- Kitchen Setup: ${this.getKitchenSummary(profile)}
- Confidence: ${profile?.confidence_level || "Unknown"}/5
- Cooking Concerns: ${(userFears || []).join(", ") || "None specified"}
    `.trim();
  }

  /**
   * Build safety constraints context section
   */
  static buildSafetyContext(constraints: SafetyConstraints): string {
    const profileAllergies = constraints.allergies.length > 0 ? constraints.allergies.join(", ") : "None";
    const profileRestrictions = constraints.dietaryRestrictions.length > 0 ? constraints.dietaryRestrictions.join(", ") : "None";
    const customRestrictions = constraints.customRestrictions.length > 0 ? constraints.customRestrictions.join(", ") : "None";

    return `
🛡️ CRITICAL SAFETY INFORMATION:
- Profile Allergies: ${profileAllergies}
- Profile Dietary Restrictions: ${profileRestrictions}
- Additional Custom Restrictions: ${customRestrictions}

⚠️ SAFETY REQUIREMENTS:
- NEVER suggest ingredients that match ANY allergy or restriction listed above
- Profile safety constraints take absolute precedence over all other preferences
- When in doubt about safety, err on the side of caution
- Always double-check ingredients against the complete restriction list
    `.trim();
  }

  /**
   * Build kitchen constraints context section
   */
  static buildKitchenConstraintsContext(profile: any, preferences?: UserPreferences): string {
    const availableTools = (profile?.kitchen_tools || []).join(", ") || "Basic tools";
    const ovenStatus = profile?.has_oven ? "" : "NO OVEN - stovetop/microwave only";
    const stoveStatus = profile?.stove_type === "none" ? "NO STOVE - microwave/no-cook only" : "";
    const spaceConstraints = profile?.space_level <= 2 ? "Limited prep space - suggest one-pot or minimal dish recipes" : "";
    
    const specialtyAppliances = (preferences?.kitchenCapabilities?.appliances?.specialty || []).length 
      ? (preferences?.kitchenCapabilities?.appliances?.specialty || []).map(a => a.replace(/_/g, ' ')).join(", ")
      : "None";
      
    const customAppliances = (preferences?.kitchenCapabilities?.customAppliances || []).length
      ? (preferences?.kitchenCapabilities?.customAppliances || []).map(a => a.replace(/_/g, ' ')).join(", ")
      : "None";

    return `
🏠 KITCHEN CONSTRAINTS:
- Available Tools: ${availableTools}
${ovenStatus ? `- ${ovenStatus}` : ''}
${stoveStatus ? `- ${stoveStatus}` : ''}
${spaceConstraints ? `- ${spaceConstraints}` : ''}
- Specialty Appliances: ${specialtyAppliances}
- Custom Appliances: ${customAppliances}

CONSTRAINT REQUIREMENTS:
- Only suggest recipes/techniques compatible with available equipment
- Adapt complexity to match tool availability
- Suggest alternatives when preferred tools aren't available
    `.trim();
  }

  /**
   * Build dietary preferences context section
   */
  static buildDietaryPreferencesContext(preferences?: UserPreferences): string {
    if (!preferences?.dietary) {
      return "DIETARY PREFERENCES: User has not completed advanced preference setup. Using basic profile only.";
    }

    const { dietary } = preferences;
    
    const nutritionGoals = [
      dietary.nutritionGoals.lowSodium && "Low Sodium",
      dietary.nutritionGoals.highFiber && "High Fiber", 
      dietary.nutritionGoals.targetProtein && `${dietary.nutritionGoals.targetProtein}g protein per meal`,
      dietary.nutritionGoals.targetCalories && `${dietary.nutritionGoals.targetCalories} daily calories`
    ].filter(Boolean).join(", ") || "None specified";

    const favoriteIngredients = [
      ...(dietary.customFavoriteIngredients || []),
      ...(preferences.cookingStyles?.favoriteIngredients || [])
    ].map(i => i.replace(/_/g, ' ')).join(", ") || "None specified";

    const avoidedIngredients = [
      ...(dietary.customAvoidedIngredients || []),
      ...(preferences.cookingStyles?.avoidedIngredients || [])
    ].map(i => i.replace(/_/g, ' ')).join(", ") || "None";

    return `
🥗 DIETARY PREFERENCES:
- Dietary Style: ${dietary.dietaryStyle}
- Spice Tolerance: ${dietary.spiceTolerance}
- Nutrition Goals: ${nutritionGoals}
- Health Objectives: ${(dietary.healthObjectives || []).map(o => o.replace(/_/g, ' ')).join(", ") || "None"}
- Flavor Preferences: ${(dietary.flavorPreferences || []).map(f => f.replace(/_/g, ' ')).join(", ") || "None"}
- Favorite Ingredients: ${favoriteIngredients}
- Avoided Ingredients: ${avoidedIngredients}
- Custom Dietary Needs: ${(dietary.customDietaryRestrictions || []).map(c => c.replace(/_/g, ' ')).join(", ") || "None"}
    `.trim();
  }

  /**
   * Build cooking context section
   */
  static buildCookingContextSection(preferences?: UserPreferences): string {
    if (!preferences?.cookingContext) {
      return "COOKING CONTEXT: User has not completed advanced preference setup.";
    }

    const { cookingContext } = preferences;
    
    return `
⏱️ COOKING CONTEXT:
- Typical Cooking Time: ${cookingContext.typicalCookingTime.replace('_', ' ')}
- Budget Level: ${cookingContext.budgetLevel.replace('_', ' ')}
- Typical Servings: ${cookingContext.typicalServings}
- Meal Prep Style: ${cookingContext.mealPrepStyle.replace('_', ' ')}
- Lifestyle Factors: ${(cookingContext.lifestyleFactors || []).join(", ") || "Not specified"}
    `.trim();
  }

  /**
   * Build kitchen capabilities section
   */
  static buildKitchenCapabilitiesSection(preferences?: UserPreferences): string {
    if (!preferences?.kitchenCapabilities) {
      return "KITCHEN CAPABILITIES: User has not completed advanced preference setup.";
    }

    const { kitchenCapabilities } = preferences;
    
    const techniqueComfort = Object.entries(kitchenCapabilities.techniqueComfort)
      .map(([technique, level]) => `${technique.replace('_', ' ')}: ${level}/5`)
      .join(", ");
      
    return `
👨‍🍳 KITCHEN CAPABILITIES:
- Technique Comfort Levels: ${techniqueComfort}
- Pantry Staples: ${(kitchenCapabilities.pantryStaples || []).map(p => p.replace(/_/g, ' ')).join(", ")}
- Storage: ${kitchenCapabilities.storageSpace?.refrigerator || "unknown"} fridge, ${kitchenCapabilities.storageSpace?.freezer || "unknown"} freezer, ${kitchenCapabilities.storageSpace?.pantry || "unknown"} pantry
- Custom Equipment: ${(kitchenCapabilities.customAppliances || []).map(a => a.replace(/_/g, ' ')).join(", ") || "None"}
    `.trim();
  }

  /**
   * Build cooking styles section
   */
  static buildCookingStylesSection(preferences?: UserPreferences): string {
    if (!preferences?.cookingStyles) {
      return "COOKING STYLE PREFERENCES: User has not completed advanced preference setup.";
    }

    const { cookingStyles } = preferences;
    
    const allCuisines = [
      ...(cookingStyles.preferredCuisines || []),
      ...(cookingStyles.customCuisines || [])
    ].map(c => c.replace(/_/g, ' ')).join(", ") || "None";

    return `
🌍 COOKING STYLE PREFERENCES:
- Preferred Cuisines: ${allCuisines}
- Cooking Moods: ${(cookingStyles.cookingMoods || []).map(m => m.replace(/_/g, ' ')).join(", ") || "None"}
- Flavor Intensity: ${cookingStyles.flavorIntensity}
    `.trim();
  }

  /**
   * Build macro context section
   */
  static buildMacroContextSection(macroContext?: { remainingMacros?: { calories: number; protein: number; carbs: number; fat: number } }): string {
    if (!macroContext?.remainingMacros) {
      return "";
    }

    const { remainingMacros } = macroContext;
    
    return `
📊 DAILY MACRO CONTEXT:
The user has already planned other meals for today. Generate a recipe that helps them meet their remaining nutritional goals:
- Remaining Calories: ${remainingMacros.calories}
- Remaining Protein: ${remainingMacros.protein}g
- Remaining Carbs: ${remainingMacros.carbs}g
- Remaining Fat: ${remainingMacros.fat}g

MACRO OPTIMIZATION REQUIREMENTS:
- Recipe should fit within remaining calorie budget
- Prioritize hitting remaining protein goals while balancing other macros
- If remaining calories are low, focus on nutrient-dense, lower-calorie options
- If remaining protein is high, emphasize protein-rich ingredients and methods
    `.trim();
  }

  /**
   * Build complete context for prompt template
   */
  static buildCompleteContext(contextData: PromptContext): Record<string, string> {
    const { user, macro, safety } = contextData;
    
    return {
      userProfile: this.buildUserProfileContext(user.profile),
      safetyConstraints: this.buildSafetyContext(safety),
      kitchenConstraints: this.buildKitchenConstraintsContext(user.profile, user.preferences),
      dietaryPreferences: this.buildDietaryPreferencesContext(user.preferences),
      cookingContext: this.buildCookingContextSection(user.preferences),
      kitchenCapabilities: this.buildKitchenCapabilitiesSection(user.preferences),
      cookingStyles: this.buildCookingStylesSection(user.preferences),
      macroContext: this.buildMacroContextSection(macro)
    };
  }
}