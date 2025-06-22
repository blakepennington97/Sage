-- Fix for get_daily_macro_progress function type mismatches
-- This resolves the "integer does not match expected type numeric" error

DROP FUNCTION IF EXISTS get_daily_macro_progress(UUID, DATE);

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
  calorie_progress NUMERIC,
  protein_progress NUMERIC,
  carb_progress NUMERIC,
  fat_progress NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    target_date as date,
    
    -- Totals from manual entries (recipes handled separately in app)
    COALESCE(SUM(dmt.manual_calories), 0) as total_calories,
    COALESCE(SUM(dmt.manual_protein), 0) as total_protein,
    COALESCE(SUM(dmt.manual_carbs), 0) as total_carbs,
    COALESCE(SUM(dmt.manual_fat), 0) as total_fat,
    
    -- Goals from user profile (keep as INTEGER to match table schema)
    up.daily_calorie_goal as goal_calories,
    up.daily_protein_goal as goal_protein,
    up.daily_carbs_goal as goal_carbs,
    up.daily_fat_goal as goal_fat,
    
    -- Progress percentages (only if goals are set)
    CASE 
      WHEN up.daily_calorie_goal > 0 THEN 
        (COALESCE(SUM(dmt.manual_calories), 0) / up.daily_calorie_goal::NUMERIC) * 100
      ELSE NULL
    END as calorie_progress,
    
    CASE 
      WHEN up.daily_protein_goal > 0 THEN 
        (COALESCE(SUM(dmt.manual_protein), 0) / up.daily_protein_goal::NUMERIC) * 100
      ELSE NULL
    END as protein_progress,
    
    CASE 
      WHEN up.daily_carbs_goal > 0 THEN 
        (COALESCE(SUM(dmt.manual_carbs), 0) / up.daily_carbs_goal::NUMERIC) * 100
      ELSE NULL
    END as carb_progress,
    
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

-- Comment
COMMENT ON FUNCTION get_daily_macro_progress IS 'Calculate daily macro progress against user goals - TYPE CONSISTENCY FIX';