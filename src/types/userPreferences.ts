// User preferences types for advanced AI personalization

export interface DietaryPreferences {
  // Allergies & Intolerances
  allergies: string[]; // e.g., ['nuts', 'dairy', 'gluten', 'shellfish']
  intolerances: string[]; // e.g., ['lactose', 'spicy_foods']
  
  // Dietary Styles
  dietaryStyle: string; // 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'mediterranean'
  
  // Nutrition Goals
  nutritionGoals: {
    targetCalories?: number; // daily target
    targetProtein?: number; // grams per meal
    targetCarbs?: number; // grams per meal
    targetFat?: number; // grams per meal
    lowSodium: boolean;
    highFiber: boolean;
  };
  
  // Health Objectives
  healthObjectives: string[]; // 'weight_loss' | 'muscle_gain' | 'heart_healthy' | 'diabetic_friendly' | 'energy_boost'
  
  // Spice & Flavor
  spiceTolerance: 'mild' | 'medium' | 'hot' | 'fire';
  flavorPreferences: string[]; // 'savory' | 'sweet' | 'umami' | 'fresh' | 'comfort'
  
  // Custom Preferences (used by components)
  customFavoriteIngredients: string[];
  customAvoidedIngredients: string[];
  customDietaryRestrictions: string[];
}

export interface CookingContext {
  // Time Constraints
  typicalCookingTime: 'quick_15min' | 'weeknight_30min' | 'weekend_60min' | 'project_90min_plus';
  mealPrepStyle: 'fresh_daily' | 'weekly_batch' | 'freezer_friendly' | 'mixed';
  
  // Budget Considerations
  budgetLevel: 'budget_friendly' | 'mid_range' | 'premium_ok';
  
  // Serving Sizes
  typicalServings: number; // 1-8+
  
  // Lifestyle Context
  lifestyleFactors: string[]; // 'busy_parent' | 'student' | 'working_professional' | 'health_focused' | 'entertaining_host'
}

export interface KitchenCapabilities {
  // Enhanced Appliance Inventory
  appliances: {
    essential: string[]; // 'stove' | 'oven' | 'microwave' | 'refrigerator'
    specialty: string[]; // 'air_fryer' | 'instant_pot' | 'food_processor' | 'stand_mixer' | 'slow_cooker' | 'rice_cooker' | 'blender'
  };
  
  // Pantry & Storage
  pantryStaples: string[]; // 'olive_oil' | 'garlic' | 'onions' | 'soy_sauce' | 'herbs_spices' | 'rice' | 'pasta'
  storageSpace: {
    refrigerator: 'small' | 'medium' | 'large';
    freezer: 'small' | 'medium' | 'large';
    pantry: 'minimal' | 'moderate' | 'extensive';
  };
  
  // Cooking Confidence by Technique
  techniqueComfort: {
    knife_work: number; // 1-5 scale
    sauteing: number;
    roasting: number;
    baking: number;
    grilling: number;
    deep_frying: number;
    braising: number;
  };
  
  // Known Techniques and Available Appliances (for KitchenCapabilitiesEditor)
  knownTechniques: string[];
  availableAppliances: string[];
  
  // Custom Preferences (used by components)
  customAppliances: string[];
}

export interface CookingStyles {
  preferredCuisines: string[]; // 'italian' | 'asian' | 'mexican' | 'american' | 'indian' | 'mediterranean' | 'french'
  cookingMoods: string[]; // 'comfort_food' | 'healthy_fresh' | 'adventurous' | 'nostalgic' | 'impressive_guests'
  avoidedIngredients: string[]; // ingredients they dislike or avoid
  favoriteIngredients: string[]; // ingredients they love to use
  flavorIntensity: string; // 'bold' | 'mild' | 'balanced' | 'complex'
  
  // Custom Preferences (used by components)
  customCuisines: string[];
}

// Complete user preferences combining all categories
export interface UserPreferences {
  dietary: DietaryPreferences;
  cookingContext: CookingContext;
  kitchenCapabilities: KitchenCapabilities;
  cookingStyles: CookingStyles;
  
  // Metadata
  version: string; // for handling preference schema migrations
  lastUpdated: string;
  setupCompleted: boolean; // whether they've gone through preference setup
}

// Default preferences for new users
export const createDefaultPreferences = (): UserPreferences => ({
  dietary: {
    allergies: [],
    intolerances: [],
    dietaryStyle: 'omnivore',
    nutritionGoals: {
      lowSodium: false,
      highFiber: false,
    },
    healthObjectives: [],
    spiceTolerance: 'medium',
    flavorPreferences: ['savory'],
    customFavoriteIngredients: [],
    customAvoidedIngredients: [],
    customDietaryRestrictions: [],
  },
  cookingContext: {
    typicalCookingTime: 'weeknight_30min',
    mealPrepStyle: 'fresh_daily',
    budgetLevel: 'mid_range',
    typicalServings: 2,
    lifestyleFactors: [],
  },
  kitchenCapabilities: {
    appliances: {
      essential: ['stove', 'oven', 'microwave', 'refrigerator'],
      specialty: [],
    },
    pantryStaples: ['olive_oil', 'garlic', 'onions'],
    storageSpace: {
      refrigerator: 'medium',
      freezer: 'small',
      pantry: 'moderate',
    },
    techniqueComfort: {
      knife_work: 3,
      sauteing: 3,
      roasting: 2,
      baking: 2,
      grilling: 2,
      deep_frying: 1,
      braising: 1,
    },
    knownTechniques: [], // Add default empty array
    availableAppliances: [], // Add default empty array
    customAppliances: [],
  },
  cookingStyles: {
    preferredCuisines: ['american', 'italian'],
    cookingMoods: ['comfort_food'],
    avoidedIngredients: [],
    favoriteIngredients: [],
    flavorIntensity: 'balanced',
    customCuisines: [],
  },
  version: '1.0',
  lastUpdated: new Date().toISOString(),
  setupCompleted: false,
});

// Helper functions for preference management
export const validatePreferences = (preferences: Partial<UserPreferences>): boolean => {
  // Basic validation - can be expanded
  return true;
};

export const migratePreferences = (preferences: any, fromVersion: string, toVersion: string): UserPreferences => {
  // Handle preference schema migrations
  if (fromVersion === '1.0' && toVersion === '1.0') {
    return preferences as UserPreferences;
  }
  // Add migration logic for future versions
  return preferences as UserPreferences;
};