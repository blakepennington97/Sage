// Few-shot prompting examples for improved AI response consistency
// These examples help the AI understand the exact format and structure expected

export interface FewShotExample {
  id: string;
  userInput: string;
  expectedOutput: string;
  description: string;
}

export interface FewShotExampleSet {
  templateName: string;
  description: string;
  examples: FewShotExample[];
}

/**
 * Recipe Generation Few-Shot Examples
 * These examples show the AI exactly how to format recipe responses
 */
export const RECIPE_GENERATION_EXAMPLES: FewShotExample[] = [
  {
    id: 'simple-breakfast',
    userInput: 'I want a quick healthy breakfast with eggs',
    expectedOutput: `{
  "name": "Scrambled Eggs with Spinach",
  "description": "A quick and nutritious breakfast featuring fluffy scrambled eggs with fresh spinach, perfect for busy mornings.",
  "cookingTime": 8,
  "prepTime": 5,
  "totalTime": 13,
  "difficulty": "Easy",
  "servings": 1,
  "calories": 185,
  "macros": {
    "protein": 14,
    "carbs": 3,
    "fat": 12,
    "fiber": 2
  },
  "ingredients": [
    {
      "name": "large eggs",
      "amount": "2",
      "unit": "whole",
      "category": "protein"
    },
    {
      "name": "fresh spinach",
      "amount": "1",
      "unit": "cup",
      "category": "vegetables"
    },
    {
      "name": "butter",
      "amount": "1",
      "unit": "tsp",
      "category": "fats"
    },
    {
      "name": "salt",
      "amount": "1/4",
      "unit": "tsp",
      "category": "seasonings"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Heat butter in a non-stick pan over medium-low heat."
    },
    {
      "step": 2,
      "instruction": "Add spinach and cook for 1-2 minutes until wilted."
    },
    {
      "step": 3,
      "instruction": "Beat eggs with salt in a bowl, then pour into the pan."
    },
    {
      "step": 4,
      "instruction": "Gently scramble eggs with a spatula, stirring frequently for 2-3 minutes."
    },
    {
      "step": 5,
      "instruction": "Remove from heat when eggs are just set and serve immediately."
    }
  ],
  "tips": [
    "Keep heat low to prevent eggs from becoming tough",
    "Add spinach first to remove excess moisture"
  ],
  "tags": ["breakfast", "quick", "healthy", "protein-rich"],
  "estimatedCost": 2.50,
  "difficulty_explanation": "This recipe requires basic cooking skills and common kitchen tools.",
  "equipment": ["non-stick pan", "spatula", "mixing bowl"]
}`,
    description: 'Simple breakfast recipe with proper JSON structure and all required fields'
  },
  {
    id: 'complex-dinner',
    userInput: 'I need a dinner recipe for 4 people with chicken and vegetables, about 30 minutes',
    expectedOutput: `{
  "name": "One-Pan Herb Roasted Chicken Thighs with Vegetables",
  "description": "Juicy chicken thighs roasted with colorful vegetables in a single pan, seasoned with fresh herbs for a complete, satisfying dinner.",
  "cookingTime": 25,
  "prepTime": 10,
  "totalTime": 35,
  "difficulty": "Medium",
  "servings": 4,
  "calories": 420,
  "macros": {
    "protein": 32,
    "carbs": 18,
    "fat": 24,
    "fiber": 4
  },
  "ingredients": [
    {
      "name": "bone-in chicken thighs",
      "amount": "8",
      "unit": "pieces",
      "category": "protein"
    },
    {
      "name": "baby potatoes",
      "amount": "1.5",
      "unit": "lbs",
      "category": "vegetables"
    },
    {
      "name": "carrots",
      "amount": "4",
      "unit": "medium",
      "category": "vegetables"
    },
    {
      "name": "olive oil",
      "amount": "3",
      "unit": "tbsp",
      "category": "fats"
    },
    {
      "name": "fresh rosemary",
      "amount": "2",
      "unit": "sprigs",
      "category": "herbs"
    },
    {
      "name": "garlic powder",
      "amount": "1",
      "unit": "tsp",
      "category": "seasonings"
    },
    {
      "name": "salt",
      "amount": "1",
      "unit": "tsp",
      "category": "seasonings"
    },
    {
      "name": "black pepper",
      "amount": "1/2",
      "unit": "tsp",
      "category": "seasonings"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Preheat oven to 425°F (220°C)."
    },
    {
      "step": 2,
      "instruction": "Cut potatoes in half and carrots into 2-inch pieces."
    },
    {
      "step": 3,
      "instruction": "Toss vegetables with 2 tbsp olive oil, half the salt, and pepper."
    },
    {
      "step": 4,
      "instruction": "Season chicken thighs with remaining salt, pepper, and garlic powder."
    },
    {
      "step": 5,
      "instruction": "Heat remaining oil in a large oven-safe skillet over medium-high heat."
    },
    {
      "step": 6,
      "instruction": "Sear chicken thighs skin-side down for 3-4 minutes until golden."
    },
    {
      "step": 7,
      "instruction": "Flip chicken and add vegetables around the pan with rosemary."
    },
    {
      "step": 8,
      "instruction": "Transfer to oven and roast for 20-25 minutes until chicken reaches 165°F."
    },
    {
      "step": 9,
      "instruction": "Let rest for 5 minutes before serving."
    }
  ],
  "tips": [
    "Don't move chicken while searing to get crispy skin",
    "Cut vegetables uniformly for even cooking",
    "Use a meat thermometer to ensure chicken is fully cooked"
  ],
  "tags": ["dinner", "one-pan", "chicken", "vegetables", "family-friendly"],
  "estimatedCost": 12.75,
  "difficulty_explanation": "Requires some timing coordination and basic knife skills for vegetable prep.",
  "equipment": ["large oven-safe skillet", "cutting board", "knife", "meat thermometer"]
}`,
    description: 'Complex dinner recipe demonstrating proper structure for multi-component meals'
  }
];

/**
 * Recipe Modification Few-Shot Examples
 */
export const RECIPE_MODIFICATION_EXAMPLES: FewShotExample[] = [
  {
    id: 'make-vegetarian',
    userInput: 'Make this chicken recipe vegetarian',
    expectedOutput: `{
  "modifications": [
    {
      "type": "ingredient_substitution",
      "original": "bone-in chicken thighs",
      "replacement": "extra-firm tofu",
      "amount": "2",
      "unit": "blocks (14 oz each)",
      "reason": "Tofu provides protein and absorbs flavors well when seasoned and roasted"
    },
    {
      "type": "cooking_adjustment",
      "instruction": "Press tofu for 15 minutes, then cut into 1-inch cubes and marinate in olive oil and seasonings for 10 minutes before roasting",
      "reason": "Tofu needs pressing to remove moisture and marinating to absorb flavors"
    },
    {
      "type": "timing_adjustment",
      "original_time": 25,
      "new_time": 20,
      "reason": "Tofu cooks faster than chicken and only needs to be heated through and golden"
    }
  ],
  "nutritional_changes": {
    "calories": 340,
    "protein": 22,
    "carbs": 20,
    "fat": 18,
    "fiber": 5
  },
  "estimated_cost_change": -2.50,
  "difficulty_change": "Same",
  "notes": "This vegetarian version maintains the one-pan cooking method and herb flavors while providing plant-based protein."
}`,
    description: 'Recipe modification showing proper structure for ingredient substitutions'
  }
];

/**
 * Cooking Advice Few-Shot Examples
 */
export const COOKING_ADVICE_EXAMPLES: FewShotExample[] = [
  {
    id: 'timing-help',
    userInput: 'How do I know when my chicken is done cooking?',
    expectedOutput: `{
  "advice_type": "food_safety",
  "main_answer": "The safest way to know chicken is done is to use a meat thermometer - it should read 165°F (74°C) when inserted into the thickest part of the meat.",
  "detailed_explanation": "Visual cues can be misleading, so temperature is key. The juices should run clear when pierced, and the meat should no longer be pink inside, but these signs can vary depending on cooking method.",
  "step_by_step": [
    "Insert a meat thermometer into the thickest part of the chicken",
    "Avoid touching bones as they conduct heat differently",
    "Wait for the reading to stabilize",
    "Look for 165°F (74°C) as your target temperature",
    "If under temperature, continue cooking and check again in 2-3 minutes"
  ],
  "safety_notes": [
    "Always use a reliable meat thermometer for food safety",
    "Never rely solely on color as an indicator",
    "Let chicken rest for 3-5 minutes after cooking to allow juices to redistribute"
  ],
  "skill_level": "beginner",
  "confidence_booster": "Using a thermometer takes the guesswork out of cooking chicken and helps build your confidence in the kitchen!"
}`,
    description: 'Cooking advice with structured format and safety emphasis'
  }
];

/**
 * Grocery List Few-Shot Examples
 */
export const GROCERY_LIST_EXAMPLES: FewShotExample[] = [
  {
    id: 'organized-list',
    userInput: 'Generate grocery list for Scrambled Eggs with Spinach recipe',
    expectedOutput: `{
  "grocery_list": {
    "dairy_eggs": [
      {
        "item": "Large eggs",
        "quantity": "1 dozen",
        "notes": "You'll use 2 for this recipe, extras for other meals"
      },
      {
        "item": "Butter",
        "quantity": "1 stick pack",
        "notes": "Unsalted preferred for cooking control"
      }
    ],
    "produce": [
      {
        "item": "Fresh spinach",
        "quantity": "5 oz bag",
        "notes": "Look for bright green leaves, avoid wilted ones"
      }
    ],
    "pantry": [
      {
        "item": "Salt",
        "quantity": "1 container",
        "notes": "Sea salt or table salt work fine"
      }
    ]
  },
  "estimated_total_cost": 8.50,
  "serving_analysis": {
    "recipe_servings": 1,
    "grocery_servings": "Approximately 6 servings with purchased quantities"
  },
  "storage_tips": [
    "Store eggs in refrigerator main compartment, not door",
    "Keep spinach in crisper drawer and use within 3-5 days",
    "Butter can be frozen for longer storage"
  ],
  "meal_prep_suggestions": [
    "Pre-wash spinach and store in paper towels to extend freshness",
    "This recipe easily doubles for meal prep"
  ]
}`,
    description: 'Grocery list with proper categorization and helpful additional information'
  }
];

/**
 * Few-Shot Example Sets organized by template
 */
export const FEW_SHOT_EXAMPLE_SETS: Record<string, FewShotExampleSet> = {
  recipeGeneration: {
    templateName: 'recipeGeneration',
    description: 'Examples showing proper JSON structure for recipe generation responses',
    examples: RECIPE_GENERATION_EXAMPLES
  },
  recipeModification: {
    templateName: 'recipeModification', 
    description: 'Examples showing how to structure recipe modification responses',
    examples: RECIPE_MODIFICATION_EXAMPLES
  },
  cookingAdvice: {
    templateName: 'cookingAdvice',
    description: 'Examples showing structured cooking advice responses',
    examples: COOKING_ADVICE_EXAMPLES
  },
  groceryListGeneration: {
    templateName: 'groceryListGeneration',
    description: 'Examples showing organized grocery list responses',
    examples: GROCERY_LIST_EXAMPLES
  }
};

/**
 * Build few-shot examples string for a specific template
 */
export function buildFewShotExamplesPrompt(templateName: string, maxExamples: number = 2): string {
  const exampleSet = FEW_SHOT_EXAMPLE_SETS[templateName];
  if (!exampleSet) {
    return '';
  }

  const examples = exampleSet.examples.slice(0, maxExamples);
  
  let prompt = `\n## Response Format Examples\n\n`;
  prompt += `The following examples show the exact format and structure expected for your responses:\n\n`;

  examples.forEach((example, index) => {
    prompt += `### Example ${index + 1}: ${example.description}\n\n`;
    prompt += `**User Input:** "${example.userInput}"\n\n`;
    prompt += `**Expected Response:**\n\`\`\`json\n${example.expectedOutput}\n\`\`\`\n\n`;
  });

  prompt += `**Important:** Your response must follow this exact JSON structure and include all required fields as shown in the examples above. Pay special attention to:\n`;
  prompt += `- Proper JSON formatting with correct quotation marks and brackets\n`;
  prompt += `- All required fields present and properly typed\n`;
  prompt += `- Consistent field naming conventions\n`;
  prompt += `- Appropriate data types (numbers for numeric values, arrays for lists, etc.)\n`;
  prompt += `- Professional, helpful tone in all text fields\n\n`;

  return prompt;
}

/**
 * Get specific examples for error correction
 */
export function getErrorCorrectionExamples(templateName: string): string {
  const commonErrors: Record<string, string[]> = {
    recipeGeneration: [
      'Always include "macros" object with protein, carbs, fat, and fiber',
      'Instructions must be an array of objects with "step" and "instruction" fields',
      'Ensure all numeric values are numbers, not strings',
      'Include "estimatedCost" as a number, not a string',
      'Tags should be an array of strings, not a single string'
    ],
    groceryListGeneration: [
      'Organize items by grocery store sections (dairy_eggs, produce, pantry, etc.)',
      'Each item should have "item", "quantity", and optional "notes" fields',
      'Include "estimated_total_cost" as a number',
      'Provide "serving_analysis" with recipe vs grocery servings comparison'
    ],
    cookingAdvice: [
      'Always include "advice_type" to categorize the response',
      'Provide "step_by_step" as an array for procedural advice',
      'Include "safety_notes" array for any safety-related advice',
      'Add "confidence_booster" to encourage the user'
    ]
  };

  const errors = commonErrors[templateName];
  if (!errors) {
    return '';
  }

  let prompt = `\n## Common Formatting Errors to Avoid:\n\n`;
  errors.forEach((error, index) => {
    prompt += `${index + 1}. ${error}\n`;
  });
  prompt += `\n`;

  return prompt;
}