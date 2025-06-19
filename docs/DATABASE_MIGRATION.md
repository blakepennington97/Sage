# Database Migration: User Preferences Table

This document outlines the database changes needed to support the Advanced User Profile & AI Personalization feature.

## New Table: user_preferences

Create the following table in your Supabase database:

```sql
-- Create the user_preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences_data JSONB NOT NULL DEFAULT '{}',
  version VARCHAR(10) NOT NULL DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one preference record per user
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_version ON user_preferences(version);

-- Enable Row Level Security (RLS)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);
```

## Migration Notes

1. **Backward Compatibility**: The existing user_profiles table remains unchanged. User preferences are stored separately to maintain data integrity.

2. **Data Structure**: The `preferences_data` field stores a JSON object following the `UserPreferences` TypeScript interface defined in `/src/types/userPreferences.ts`.

3. **Versioning**: The `version` field allows for future schema migrations if the preferences structure needs to evolve.

4. **Security**: RLS policies ensure users can only access their own preferences data.

5. **Performance**: Indexes on `user_id` and `version` ensure fast lookups.

## Example Preferences Data Structure

```json
{
  "dietary": {
    "allergies": ["nuts", "dairy"],
    "intolerances": ["lactose"],
    "dietaryStyle": "vegetarian",
    "nutritionGoals": {
      "targetProtein": 25,
      "lowSodium": true,
      "highFiber": false
    },
    "healthObjectives": ["weight_loss", "energy_boost"],
    "spiceTolerance": "medium",
    "flavorPreferences": ["savory", "umami"]
  },
  "cookingContext": {
    "typicalCookingTime": "weeknight_30min",
    "mealPrepStyle": "fresh_daily",
    "budgetLevel": "mid_range",
    "typicalServings": 2,
    "lifestyleFactors": ["busy_parent", "health_focused"]
  },
  "kitchenCapabilities": {
    "appliances": {
      "essential": ["stove", "oven", "microwave", "refrigerator"],
      "specialty": ["air_fryer", "instant_pot"]
    },
    "pantryStaples": ["olive_oil", "garlic", "onions", "soy_sauce"],
    "storageSpace": {
      "refrigerator": "medium",
      "freezer": "small",
      "pantry": "moderate"
    },
    "techniqueComfort": {
      "knife_work": 4,
      "sauteing": 4,
      "roasting": 3,
      "baking": 2,
      "grilling": 2,
      "deep_frying": 1,
      "braising": 2
    }
  },
  "cookingStyles": {
    "preferredCuisines": ["italian", "asian", "mediterranean"],
    "cookingMoods": ["healthy_fresh", "comfort_food"],
    "avoidedIngredients": ["cilantro", "blue_cheese"],
    "favoriteIngredients": ["garlic", "lemon", "herbs"]
  },
  "version": "1.0",
  "lastUpdated": "2025-06-19T12:00:00.000Z",
  "setupCompleted": true
}
```

## Post-Migration Steps

1. **Test the Migration**: Verify that the table is created correctly and RLS policies work as expected.

2. **Update Application**: The application code is already prepared to handle the new preferences system.

3. **User Migration**: Existing users will automatically get default preferences when they first access the new system.

4. **Monitor Performance**: Watch for any performance issues with JSONB queries and adjust indexes if needed.

## Rollback Plan

If needed, the user_preferences table can be safely dropped without affecting existing functionality:

```sql
-- Rollback: Drop the user_preferences table
DROP TABLE IF EXISTS user_preferences;
```

The application will gracefully fall back to the basic profile system if preferences are not available.