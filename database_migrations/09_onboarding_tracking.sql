-- Migration 09: Onboarding Step Tracking
-- Purpose: Add proper onboarding completion tracking to prevent navigation issues
-- Date: 2025-06-22
-- Author: Claude
-- Issue: Array fields default to empty arrays, breaking undefined checks

-- Add onboarding step completion tracking
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_steps_completed JSONB DEFAULT '{}';

-- Add helper function to track onboarding step completion
CREATE OR REPLACE FUNCTION mark_onboarding_step_complete(
  user_id UUID,
  step_name TEXT
) RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET onboarding_steps_completed = COALESCE(onboarding_steps_completed, '{}'::jsonb) || jsonb_build_object(step_name, true)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION mark_onboarding_step_complete(UUID, TEXT) TO authenticated;

-- Update existing users to mark completed steps based on existing data
UPDATE user_profiles 
SET onboarding_steps_completed = jsonb_build_object(
  'skills', CASE WHEN skill_level IS NOT NULL AND skill_level != '' THEN true ELSE false END,
  'dietary', true, -- Since arrays default to empty, assume completed if profile exists
  'macros', COALESCE(macro_goals_set, false),
  'kitchen', CASE WHEN stove_type IS NOT NULL AND stove_type != '' AND has_oven IS NOT NULL THEN true ELSE false END
)
WHERE onboarding_steps_completed IS NULL OR onboarding_steps_completed = '{}'::jsonb;

-- Comment
COMMENT ON COLUMN user_profiles.onboarding_steps_completed IS 'Tracks which onboarding steps have been explicitly completed';
COMMENT ON FUNCTION mark_onboarding_step_complete IS 'Helper function to mark an onboarding step as completed';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 09 completed successfully - Onboarding step tracking added';
END $$;