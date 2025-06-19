-- Meal Planning Database Schema
-- Run these commands in your Supabase SQL editor

-- 1. Create meal_plans table
CREATE TABLE meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    title TEXT NOT NULL,
    days JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure only one active meal plan per user
    CONSTRAINT unique_active_meal_plan_per_user 
        EXCLUDE (user_id WITH =) WHERE (is_active = true)
);

-- 2. Create meal_plan_grocery_lists table
CREATE TABLE meal_plan_grocery_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one grocery list per meal plan
    CONSTRAINT unique_grocery_list_per_meal_plan UNIQUE (meal_plan_id)
);

-- 3. Add indexes for performance
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_week_start_date ON meal_plans(week_start_date);
CREATE INDEX idx_meal_plans_is_active ON meal_plans(is_active);
CREATE INDEX idx_meal_plan_grocery_lists_meal_plan_id ON meal_plan_grocery_lists(meal_plan_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_grocery_lists ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for meal_plans
-- Users can only see their own meal plans
CREATE POLICY "Users can view their own meal plans" ON meal_plans
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own meal plans
CREATE POLICY "Users can insert their own meal plans" ON meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own meal plans
CREATE POLICY "Users can update their own meal plans" ON meal_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own meal plans
CREATE POLICY "Users can delete their own meal plans" ON meal_plans
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for meal_plan_grocery_lists
-- Users can only see grocery lists for their own meal plans
CREATE POLICY "Users can view their own grocery lists" ON meal_plan_grocery_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_grocery_lists.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

-- Users can insert grocery lists for their own meal plans
CREATE POLICY "Users can insert their own grocery lists" ON meal_plan_grocery_lists
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_grocery_lists.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

-- Users can update grocery lists for their own meal plans
CREATE POLICY "Users can update their own grocery lists" ON meal_plan_grocery_lists
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_grocery_lists.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

-- Users can delete grocery lists for their own meal plans
CREATE POLICY "Users can delete their own grocery lists" ON meal_plan_grocery_lists
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_grocery_lists.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

-- 7. Create updated_at trigger function (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
CREATE TRIGGER update_meal_plans_updated_at 
    BEFORE UPDATE ON meal_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_grocery_lists_updated_at 
    BEFORE UPDATE ON meal_plan_grocery_lists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Optional: Add some sample data structure comments for JSONB fields
COMMENT ON COLUMN meal_plans.days IS 'Array of day objects: [{"date":"2024-01-01","breakfast":{"id":"...","recipe_id":"...","recipe_name":"...","servings":2},"lunch":null,"dinner":null,"snacks":[]}]';
COMMENT ON COLUMN meal_plan_grocery_lists.items IS 'Array of grocery items: [{"name":"Chicken","amount":"2 lbs","category":"Meat","recipe_sources":["Recipe 1"],"checked":false}]';