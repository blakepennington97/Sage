-- Migration 10: Atomic Meal Plan Creation Function
-- This migration adds a database function to atomically handle meal plan creation
-- and resolve the unique_active_meal_plan_per_user constraint conflict

-- Function to atomically deactivate existing active meal plans and create a new one
CREATE OR REPLACE FUNCTION create_meal_plan_atomic(
  p_user_id UUID,
  p_title TEXT,
  p_week_start_date DATE,
  p_days JSONB,
  p_is_active BOOLEAN DEFAULT true
) RETURNS TABLE(
  id UUID,
  user_id UUID,
  title TEXT,
  week_start_date DATE,
  days JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- First, deactivate any existing active meal plans for this user
  UPDATE meal_plans 
  SET is_active = false, updated_at = NOW()
  WHERE meal_plans.user_id = p_user_id AND meal_plans.is_active = true;
  
  -- Then insert the new meal plan and return it
  RETURN QUERY
  INSERT INTO meal_plans (user_id, title, week_start_date, days, is_active, created_at, updated_at)
  VALUES (p_user_id, p_title, p_week_start_date, p_days, p_is_active, NOW(), NOW())
  RETURNING meal_plans.id, meal_plans.user_id, meal_plans.title, meal_plans.week_start_date, 
            meal_plans.days, meal_plans.is_active, meal_plans.created_at, meal_plans.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_meal_plan_atomic(UUID, TEXT, DATE, JSONB, BOOLEAN) TO authenticated;