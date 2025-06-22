/**
 * TDEE (Total Daily Energy Expenditure) Calculator
 * Uses the Mifflin-St Jeor Equation for BMR calculation and activity multipliers
 */

export interface UserPhysicalData {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: 'male' | 'female' | 'other';
  activityLevel: ActivityLevel;
}

export type ActivityLevel = 
  | 'sedentary'     // Little to no exercise
  | 'lightly_active' // Light exercise 1-3 days/week
  | 'moderately_active' // Moderate exercise 3-5 days/week
  | 'very_active'   // Hard exercise 6-7 days/week
  | 'extremely_active'; // Very hard exercise & physical job

export interface CalorieGoals {
  maintenance: number;
  mildWeightLoss: number; // -0.5 lbs/week (250 cal deficit)
  moderateWeightLoss: number; // -1 lb/week (500 cal deficit)
  aggressiveWeightLoss: number; // -2 lbs/week (1000 cal deficit)
  mildWeightGain: number; // +0.5 lbs/week (250 cal surplus)
  moderateWeightGain: number; // +1 lb/week (500 cal surplus)
}

export interface MacroRecommendations {
  calories: CalorieGoals;
  protein: {
    sedentary: number; // 0.8g per kg
    active: number; // 1.2-1.6g per kg
    athletic: number; // 1.6-2.2g per kg
  };
  carbs: {
    lowCarb: number; // 20-30% of calories
    moderate: number; // 45-50% of calories
    highCarb: number; // 55-60% of calories
  };
  fat: {
    minimum: number; // 20% of calories (minimum for health)
    moderate: number; // 25-30% of calories
    highFat: number; // 35-40% of calories
  };
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Desk job, little to no exercise',
  lightly_active: 'Light exercise 1-3 days/week',
  moderately_active: 'Moderate exercise 3-5 days/week',
  very_active: 'Hard exercise 6-7 days/week',
  extremely_active: 'Very hard exercise, physical job',
};

export class TDEECalculator {
  /**
   * Calculate BMR using Mifflin-St Jeor Equation
   * Men: BMR = 10 × weight + 6.25 × height - 5 × age + 5
   * Women: BMR = 10 × weight + 6.25 × height - 5 × age - 161
   */
  static calculateBMR(userData: Pick<UserPhysicalData, 'age' | 'weight' | 'height' | 'gender'>): number {
    const { age, weight, height, gender } = userData;
    
    const baseBMR = 10 * weight + 6.25 * height - 5 * age;
    
    switch (gender) {
      case 'male':
        return baseBMR + 5;
      case 'female':
        return baseBMR - 161;
      case 'other':
        // Use average of male and female formulas
        return baseBMR - 78;
      default:
        return baseBMR - 78;
    }
  }

  /**
   * Calculate TDEE (BMR × Activity Multiplier)
   */
  static calculateTDEE(userData: UserPhysicalData): number {
    const bmr = this.calculateBMR(userData);
    const multiplier = ACTIVITY_MULTIPLIERS[userData.activityLevel];
    return Math.round(bmr * multiplier);
  }

  /**
   * Generate calorie goals for different objectives
   */
  static calculateCalorieGoals(userData: UserPhysicalData): CalorieGoals {
    const maintenance = this.calculateTDEE(userData);
    
    return {
      maintenance,
      mildWeightLoss: Math.max(1200, maintenance - 250), // Never below 1200
      moderateWeightLoss: Math.max(1200, maintenance - 500),
      aggressiveWeightLoss: Math.max(1200, maintenance - 1000),
      mildWeightGain: maintenance + 250,
      moderateWeightGain: maintenance + 500,
    };
  }

  /**
   * Calculate protein recommendations based on activity level and weight
   */
  static calculateProteinRecommendations(userData: UserPhysicalData): MacroRecommendations['protein'] {
    const { weight, activityLevel } = userData;
    
    // Base recommendations in grams per kg of body weight
    let sedentaryMultiplier = 0.8;
    let activeMultiplier = 1.4;
    let athleticMultiplier = 1.9;
    
    // Adjust for activity level
    if (activityLevel === 'very_active' || activityLevel === 'extremely_active') {
      activeMultiplier = 1.6;
      athleticMultiplier = 2.2;
    }
    
    return {
      sedentary: Math.round(weight * sedentaryMultiplier),
      active: Math.round(weight * activeMultiplier),
      athletic: Math.round(weight * athleticMultiplier),
    };
  }

  /**
   * Calculate carb recommendations based on calorie goals
   */
  static calculateCarbRecommendations(calories: number): MacroRecommendations['carbs'] {
    // Convert calories to grams (1g carbs = 4 calories)
    return {
      lowCarb: Math.round((calories * 0.25) / 4), // 20-30% of calories
      moderate: Math.round((calories * 0.475) / 4), // 45-50% of calories
      highCarb: Math.round((calories * 0.575) / 4), // 55-60% of calories
    };
  }

  /**
   * Calculate fat recommendations based on calorie goals
   */
  static calculateFatRecommendations(calories: number): MacroRecommendations['fat'] {
    // Convert calories to grams (1g fat = 9 calories)
    return {
      minimum: Math.round((calories * 0.2) / 9), // 20% minimum for health
      moderate: Math.round((calories * 0.275) / 9), // 25-30% of calories
      highFat: Math.round((calories * 0.375) / 9), // 35-40% of calories
    };
  }

  /**
   * Generate complete macro recommendations
   */
  static generateMacroRecommendations(userData: UserPhysicalData): MacroRecommendations {
    const calories = this.calculateCalorieGoals(userData);
    const protein = this.calculateProteinRecommendations(userData);
    const carbs = this.calculateCarbRecommendations(calories.maintenance);
    const fat = this.calculateFatRecommendations(calories.maintenance);
    
    return {
      calories,
      protein,
      carbs,
      fat,
    };
  }

  /**
   * Get smart default macro goals based on user data and goal
   */
  static getSmartDefaults(
    userData: UserPhysicalData, 
    goal: 'weight_loss' | 'maintenance' | 'muscle_gain' = 'maintenance'
  ): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    const recommendations = this.generateMacroRecommendations(userData);
    
    let calories: number;
    let proteinMultiplier: keyof MacroRecommendations['protein'];
    let carbType: keyof MacroRecommendations['carbs'];
    let fatType: keyof MacroRecommendations['fat'];
    
    switch (goal) {
      case 'weight_loss':
        calories = recommendations.calories.moderateWeightLoss;
        proteinMultiplier = 'active'; // Higher protein for muscle preservation
        carbType = 'moderate';
        fatType = 'moderate';
        break;
      case 'muscle_gain':
        calories = recommendations.calories.mildWeightGain;
        proteinMultiplier = 'athletic'; // Higher protein for muscle building
        carbType = 'highCarb'; // More carbs for energy
        fatType = 'moderate';
        break;
      case 'maintenance':
      default:
        calories = recommendations.calories.maintenance;
        proteinMultiplier = 'active';
        carbType = 'moderate';
        fatType = 'moderate';
        break;
    }
    
    const protein = recommendations.protein[proteinMultiplier];
    const carbs = this.calculateCarbRecommendations(calories)[carbType];
    const fat = this.calculateFatRecommendations(calories)[fatType];
    
    return { calories, protein, carbs, fat };
  }

  /**
   * Validate user physical data
   */
  static validateUserData(userData: Partial<UserPhysicalData>): string[] {
    const errors: string[] = [];
    
    if (!userData.age || userData.age < 13 || userData.age > 120) {
      errors.push('Age must be between 13 and 120 years');
    }
    
    if (!userData.weight || userData.weight < 30 || userData.weight > 300) {
      errors.push('Weight must be between 30 and 300 kg');
    }
    
    if (!userData.height || userData.height < 100 || userData.height > 250) {
      errors.push('Height must be between 100 and 250 cm');
    }
    
    if (!userData.gender || !['male', 'female', 'other'].includes(userData.gender)) {
      errors.push('Gender must be specified');
    }
    
    if (!userData.activityLevel || !Object.keys(ACTIVITY_MULTIPLIERS).includes(userData.activityLevel)) {
      errors.push('Activity level must be specified');
    }
    
    return errors;
  }

  /**
   * Get activity level descriptions for UI
   */
  static getActivityDescriptions() {
    return ACTIVITY_DESCRIPTIONS;
  }

  /**
   * Convert weight between units
   */
  static convertWeight(weight: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
    if (from === to) return weight;
    
    if (from === 'lbs' && to === 'kg') {
      return Math.round((weight / 2.20462) * 10) / 10;
    } else if (from === 'kg' && to === 'lbs') {
      return Math.round((weight * 2.20462) * 10) / 10;
    }
    
    return weight;
  }

  /**
   * Convert height between units
   */
  static convertHeight(height: number, from: 'cm' | 'ft', to: 'cm' | 'ft'): number {
    if (from === to) return height;
    
    if (from === 'ft' && to === 'cm') {
      return Math.round(height * 30.48);
    } else if (from === 'cm' && to === 'ft') {
      return Math.round((height / 30.48) * 10) / 10;
    }
    
    return height;
  }
}