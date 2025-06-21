-- Migration 07: Dietary Safety Fields for User Profiles
-- Purpose: Add critical safety information fields for allergies and dietary restrictions
-- Date: 2025-06-20
-- Author: Claude
-- Feature: Enhanced Onboarding Safety Collection

-- Description:
-- This migration adds essential safety fields to the user_profiles table to support
-- the new onboarding flow that collects critical dietary information for user safety.
-- These fields store data collected during the dietary restrictions onboarding step.

-- Add allergies and dietary restrictions columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.allergies IS 'Array of food allergies (critical safety information)';
COMMENT ON COLUMN user_profiles.dietary_restrictions IS 'Array of dietary restrictions (vegetarian, vegan, kosher, etc.)';

-- Create index for efficient querying of allergies (safety-critical)
CREATE INDEX IF NOT EXISTS idx_user_profiles_allergies 
ON user_profiles USING GIN (allergies);

-- Create index for dietary restrictions
CREATE INDEX IF NOT EXISTS idx_user_profiles_dietary_restrictions 
ON user_profiles USING GIN (dietary_restrictions);

-- Update the existing RLS policies to include new fields (if needed)
-- Note: The existing RLS policy on user_profiles should already cover these new columns
-- since it's typically "users can only access their own profile"

-- Verification query to check the new columns exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name IN ('allergies', 'dietary_restrictions')
    ) THEN
        RAISE NOTICE 'Successfully added dietary safety fields to user_profiles table';
    ELSE
        RAISE EXCEPTION 'Failed to add dietary safety fields to user_profiles table';
    END IF;
END $$;

-- Optional: Update existing records to have empty arrays instead of NULL
-- This ensures consistent data types for all users
UPDATE user_profiles 
SET allergies = '{}' 
WHERE allergies IS NULL;

UPDATE user_profiles 
SET dietary_restrictions = '{}' 
WHERE dietary_restrictions IS NULL;

-- Set NOT NULL constraints now that all records have been updated
ALTER TABLE user_profiles 
ALTER COLUMN allergies SET NOT NULL,
ALTER COLUMN dietary_restrictions SET NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 07 completed successfully - Dietary safety fields added to user_profiles';
END $$;