-- Meal Plan Schema Optimizations for Single Source of Truth Architecture
-- Migration: 07_meal_plan_optimizations.sql
-- Purpose: Add version control and optimize meal plan table for new architecture

-- Add version column for optimistic concurrency control
ALTER TABLE meal_plans 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Update existing meal plans to have version 1
UPDATE meal_plans 
SET version = 1 
WHERE version IS NULL;

-- Make version column NOT NULL
ALTER TABLE meal_plans 
ALTER COLUMN version SET NOT NULL;

-- Add updated_at trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for meal_plans table
DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add index for faster version-based queries
CREATE INDEX IF NOT EXISTS idx_meal_plans_version 
ON meal_plans(id, version);

-- Add index for user + week queries (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week 
ON meal_plans(user_id, week_start_date, is_active);

-- Optimize JSONB queries for days column
CREATE INDEX IF NOT EXISTS idx_meal_plans_days_gin 
ON meal_plans USING GIN (days);

-- Add constraint to ensure version increments
CREATE OR REPLACE FUNCTION check_version_increment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check on updates, not inserts
  IF TG_OP = 'UPDATE' AND OLD.version IS NOT NULL THEN
    IF NEW.version <= OLD.version THEN
      RAISE EXCEPTION 'Version must be incremented on update. Old: %, New: %', 
        OLD.version, NEW.version;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create version increment trigger
DROP TRIGGER IF EXISTS check_meal_plan_version_increment ON meal_plans;
CREATE TRIGGER check_meal_plan_version_increment
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION check_version_increment();

-- Add helpful comments
COMMENT ON COLUMN meal_plans.version IS 'Version number for optimistic concurrency control';
COMMENT ON INDEX idx_meal_plans_version IS 'Index for version-based conflict detection';
COMMENT ON INDEX idx_meal_plans_user_week IS 'Primary access pattern: user + week queries';
COMMENT ON INDEX idx_meal_plans_days_gin IS 'GIN index for efficient JSONB days queries';

-- Verify the migration
DO $$
BEGIN
  -- Check that version column exists and has correct properties
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' 
    AND column_name = 'version' 
    AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'Migration failed: version column not properly created';
  END IF;
  
  -- Check that indexes were created
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'meal_plans' 
    AND indexname = 'idx_meal_plans_version'
  ) THEN
    RAISE EXCEPTION 'Migration failed: version index not created';
  END IF;
  
  RAISE NOTICE 'Meal plan optimization migration completed successfully';
END
$$;