-- Database Migration 08: Macro Tracking and Nutrition Goals
-- Add macro tracking, nutrition goals, and enhanced meal planning capabilities
-- Run this migration in your Supabase SQL Editor after previous migrations

-- Add macro goals to user profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS daily_calorie_goal INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_protein_goal INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_carbs_goal INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_fat_goal INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS macro_goals_set BOOLEAN DEFAULT FALSE;

-- Add macro information to user_recipes table
ALTER TABLE user_recipes
ADD COLUMN IF NOT EXISTS calories_per_serving INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS protein_per_serving DECIMAL(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS carbs_per_serving DECIMAL(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fat_per_serving DECIMAL(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sugar_per_serving DECIMAL(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fiber_per_serving DECIMAL(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sodium_per_serving DECIMAL(6,2) DEFAULT NULL;

-- Create meal_entries table for non-recipe meal tracking
CREATE TABLE IF NOT EXISTS meal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  
  -- Entry details
  food_name TEXT NOT NULL,
  brand_name TEXT DEFAULT NULL,
  serving_size TEXT NOT NULL,
  quantity DECIMAL(6,2) DEFAULT 1,
  
  -- Nutritional information
  calories_per_serving INTEGER NOT NULL,
  protein_per_serving DECIMAL(6,2) DEFAULT 0,
  carbs_per_serving DECIMAL(6,2) DEFAULT 0,
  fat_per_serving DECIMAL(6,2) DEFAULT 0,
  sugar_per_serving DECIMAL(6,2) DEFAULT 0,
  fiber_per_serving DECIMAL(6,2) DEFAULT 0,
  sodium_per_serving DECIMAL(6,2) DEFAULT 0,
  
  -- Metadata
  source TEXT DEFAULT 'manual', -- 'manual', 'web_search', 'barcode'
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date ON meal_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_meal_entries_meal_plan ON meal_entries(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_meal_type ON meal_entries(meal_type);

-- Enable RLS on meal_entries
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for meal_entries
CREATE POLICY "Users can view own meal entries" ON meal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal entries" ON meal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal entries" ON meal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal entries" ON meal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create daily_macro_totals view for easy querying
CREATE OR REPLACE VIEW daily_macro_totals AS
SELECT 
  user_id,
  entry_date,
  meal_type,
  
  -- Manual entry totals only (meal plans handled separately)
  COALESCE(SUM(
    me.calories_per_serving * me.quantity
  ), 0) as manual_calories,
  
  COALESCE(SUM(
    me.protein_per_serving * me.quantity
  ), 0) as manual_protein,
  
  COALESCE(SUM(
    me.carbs_per_serving * me.quantity
  ), 0) as manual_carbs,
  
  COALESCE(SUM(
    me.fat_per_serving * me.quantity
  ), 0) as manual_fat

FROM meal_entries me
GROUP BY user_id, entry_date, meal_type;

-- Create function to get user's daily macro progress
CREATE OR REPLACE FUNCTION get_daily_macro_progress(
  target_user_id UUID,
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  goal_calories INTEGER,
  goal_protein INTEGER,
  goal_carbs INTEGER,
  goal_fat INTEGER,
  calories_progress NUMERIC,
  protein_progress NUMERIC,
  carbs_progress NUMERIC,
  fat_progress NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    target_date as date,
    
    -- Total macros for the day (from meal_entries only for now)
    COALESCE(SUM(dmt.manual_calories), 0) as total_calories,
    COALESCE(SUM(dmt.manual_protein), 0) as total_protein,
    COALESCE(SUM(dmt.manual_carbs), 0) as total_carbs,
    COALESCE(SUM(dmt.manual_fat), 0) as total_fat,
    
    -- User's goals
    up.daily_calorie_goal,
    up.daily_protein_goal,
    up.daily_carbs_goal,
    up.daily_fat_goal,
    
    -- Progress percentages
    CASE 
      WHEN up.daily_calorie_goal > 0 THEN 
        (COALESCE(SUM(dmt.manual_calories), 0) / up.daily_calorie_goal::NUMERIC) * 100
      ELSE NULL
    END as calories_progress,
    
    CASE 
      WHEN up.daily_protein_goal > 0 THEN 
        (COALESCE(SUM(dmt.manual_protein), 0) / up.daily_protein_goal::NUMERIC) * 100
      ELSE NULL
    END as protein_progress,
    
    CASE 
      WHEN up.daily_carbs_goal > 0 THEN 
        (COALESCE(SUM(dmt.manual_carbs), 0) / up.daily_carbs_goal::NUMERIC) * 100
      ELSE NULL
    END as carbs_progress,
    
    CASE 
      WHEN up.daily_fat_goal > 0 THEN 
        (COALESCE(SUM(dmt.manual_fat), 0) / up.daily_fat_goal::NUMERIC) * 100
      ELSE NULL
    END as fat_progress
    
  FROM user_profiles up
  LEFT JOIN daily_macro_totals dmt ON dmt.user_id = up.id AND dmt.entry_date = target_date
  WHERE up.id = target_user_id
  GROUP BY up.daily_calorie_goal, up.daily_protein_goal, up.daily_carbs_goal, up.daily_fat_goal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_daily_macro_progress(UUID, DATE) TO authenticated;

-- Update the updated_at timestamp for meal_entries
CREATE OR REPLACE FUNCTION update_meal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meal_entries_updated_at
  BEFORE UPDATE ON meal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_entries_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_recipes_macros ON user_recipes(calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving);

COMMENT ON TABLE meal_entries IS 'Non-recipe meal tracking for comprehensive daily macro monitoring';
COMMENT ON VIEW daily_macro_totals IS 'Aggregated daily macro totals from both recipes and manual entries';
COMMENT ON FUNCTION get_daily_macro_progress IS 'Calculate daily macro progress against user goals';