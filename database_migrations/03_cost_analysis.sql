-- Database migrations for Cost Analysis & Financial Motivation features
-- Run these commands in your Supabase SQL editor
-- FIXED VERSION - Safe to run multiple times

-- 1. Add cost tracking columns to cooking_sessions table
ALTER TABLE cooking_sessions 
ADD COLUMN IF NOT EXISTS estimated_savings DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS recipe_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS restaurant_cost DECIMAL(10,2);

-- 2. Add cost fields to user_recipes table (optional - for querying performance)
-- Note: Cost data is also stored in recipe_data JSONB field
ALTER TABLE user_recipes 
ADD COLUMN IF NOT EXISTS cost_per_serving DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS servings INTEGER;

-- 3. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_savings 
ON cooking_sessions(user_id, completed_at) 
WHERE estimated_savings IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_recipes_cost 
ON user_recipes(user_id, cost_per_serving) 
WHERE cost_per_serving IS NOT NULL;

-- 4. Create view for savings analytics (optional but useful)
CREATE OR REPLACE VIEW user_savings_summary AS
SELECT 
    user_id,
    COUNT(*) as total_cooking_sessions,
    COALESCE(SUM(estimated_savings), 0) as total_savings,
    COALESCE(AVG(estimated_savings), 0) as average_savings_per_meal,
    COALESCE(SUM(CASE 
        WHEN completed_at >= CURRENT_DATE - INTERVAL '30 days' 
        THEN estimated_savings 
        ELSE 0 
    END), 0) as monthly_savings,
    MAX(completed_at) as last_cooking_session
FROM cooking_sessions 
WHERE completed_at IS NOT NULL 
AND estimated_savings IS NOT NULL
GROUP BY user_id;

-- 5. Grant permissions on view (views inherit RLS from underlying tables)
GRANT SELECT ON user_savings_summary TO authenticated;

-- 6. Create function for getting user savings (alternative to TypeScript service)
CREATE OR REPLACE FUNCTION get_user_savings(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalSavings', COALESCE(SUM(estimated_savings), 0),
        'totalCookingSessions', COUNT(*),
        'averageSavingsPerMeal', COALESCE(AVG(estimated_savings), 0),
        'monthlySavings', COALESCE(SUM(CASE 
            WHEN completed_at >= CURRENT_DATE - INTERVAL '30 days' 
            THEN estimated_savings 
            ELSE 0 
        END), 0)
    )
    INTO result
    FROM cooking_sessions 
    WHERE user_id = p_user_id 
    AND completed_at IS NOT NULL 
    AND estimated_savings IS NOT NULL;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permission on function
GRANT EXECUTE ON FUNCTION get_user_savings(TEXT) TO authenticated;

-- 8. Create trigger function to sync cost data from JSONB to columns
CREATE OR REPLACE FUNCTION update_recipe_cost_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract cost data from recipe_data JSONB and update dedicated columns
    IF NEW.recipe_data IS NOT NULL THEN
        NEW.cost_per_serving = COALESCE((NEW.recipe_data->>'costPerServing')::DECIMAL(10,2), NEW.cost_per_serving);
        NEW.total_cost = COALESCE((NEW.recipe_data->>'totalCost')::DECIMAL(10,2), NEW.total_cost);
        NEW.servings = COALESCE((NEW.recipe_data->>'servings')::INTEGER, NEW.servings);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_update_recipe_cost ON user_recipes;
CREATE TRIGGER trigger_update_recipe_cost
    BEFORE INSERT OR UPDATE ON user_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_cost_columns();

-- 10. Backfill existing recipes with cost data from JSONB (safe to run multiple times)
UPDATE user_recipes 
SET 
    cost_per_serving = (recipe_data->>'costPerServing')::DECIMAL(10,2),
    total_cost = (recipe_data->>'totalCost')::DECIMAL(10,2),
    servings = (recipe_data->>'servings')::INTEGER
WHERE recipe_data IS NOT NULL 
AND (
    cost_per_serving IS NULL OR 
    total_cost IS NULL OR 
    servings IS NULL
)
AND (
    recipe_data->>'costPerServing' IS NOT NULL OR
    recipe_data->>'totalCost' IS NOT NULL OR
    recipe_data->>'servings' IS NOT NULL
);

-- Verification queries (uncomment to test after running migrations):
-- SELECT 'cooking_sessions' as table_name, COUNT(*) as total_rows, COUNT(estimated_savings) as rows_with_savings FROM cooking_sessions
-- UNION ALL
-- SELECT 'user_recipes' as table_name, COUNT(*) as total_rows, COUNT(cost_per_serving) as rows_with_cost FROM user_recipes;

-- Check if columns were added successfully:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cooking_sessions' AND column_name IN ('estimated_savings', 'recipe_cost', 'restaurant_cost');

-- Test the savings function (replace 'your-user-id' with actual user ID):
-- SELECT get_user_savings('your-user-id');

-- Migration completed successfully! 
-- The cost analysis features are now ready to use.