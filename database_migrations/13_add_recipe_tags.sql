-- Migration 13: Add recipe tagging fields for intelligent organization
-- This migration adds meal_types, cuisine_type, and main_ingredient columns
-- to the user_recipes table to enable advanced filtering and discovery

-- Add new columns for recipe tagging
ALTER TABLE public.user_recipes
ADD COLUMN IF NOT EXISTS meal_types text[],
ADD COLUMN IF NOT EXISTS cuisine_type text,
ADD COLUMN IF NOT EXISTS main_ingredient text;

-- Create indexes for faster filtering
-- GIN index for meal_types array searches
CREATE INDEX IF NOT EXISTS idx_user_recipes_meal_types 
ON public.user_recipes USING GIN (meal_types);

-- Standard indexes for cuisine_type and main_ingredient
CREATE INDEX IF NOT EXISTS idx_user_recipes_cuisine_type 
ON public.user_recipes (cuisine_type);

CREATE INDEX IF NOT EXISTS idx_user_recipes_main_ingredient 
ON public.user_recipes (main_ingredient);

-- Add comments for documentation
COMMENT ON COLUMN public.user_recipes.meal_types IS 'Array of meal types this recipe fits (Breakfast, Lunch, Dinner, Snack)';
COMMENT ON COLUMN public.user_recipes.cuisine_type IS 'Primary cuisine type for this recipe (Italian, Mexican, Asian, etc.)';
COMMENT ON COLUMN public.user_recipes.main_ingredient IS 'Primary ingredient category (chicken, vegetables, pasta, etc.)';

-- Note: This migration is backward compatible - existing recipes will have NULL values
-- for these new fields, which will be handled gracefully by the frontend