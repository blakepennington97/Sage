-- CLEANUP: Remove Duplicate Meal Plans
-- This script safely removes duplicate meal plans, keeping only the most recently updated one for each user/week combination
-- 
-- IMPORTANT: Run this in your Supabase SQL Editor to clean up database pollution
-- This is safe to run multiple times and will not affect properly structured data

-- Step 1: Identify duplicates before cleanup (for verification)
-- Run this first to see how many duplicates exist
SELECT 
  user_id, 
  week_start_date, 
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY updated_at DESC) as meal_plan_ids,
  array_agg(updated_at ORDER BY updated_at DESC) as update_times
FROM meal_plans
GROUP BY user_id, week_start_date
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Clean up duplicates
-- This CTE identifies all duplicate meal plans and ranks them by update time
WITH ranked_plans AS (
  SELECT
    id,
    user_id,
    week_start_date,
    updated_at,
    title,
    ROW_NUMBER() OVER(
      PARTITION BY user_id, week_start_date 
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM meal_plans
)
-- Delete all but the most recent meal plan for each user/week
DELETE FROM meal_plans
WHERE id IN (
  SELECT id
  FROM ranked_plans
  WHERE rn > 1
);

-- Step 3: Verification query
-- Run this after cleanup to confirm no duplicates remain
SELECT 
  user_id, 
  week_start_date, 
  COUNT(*) as count
FROM meal_plans
GROUP BY user_id, week_start_date
HAVING COUNT(*) > 1;
-- This should return NO ROWS if cleanup was successful

-- Step 4: Summary of remaining meal plans
SELECT 
  COUNT(*) as total_meal_plans,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT week_start_date) as unique_weeks,
  MIN(created_at) as oldest_plan,
  MAX(created_at) as newest_plan
FROM meal_plans;