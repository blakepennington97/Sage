-- =============================================
-- Usage Tracking System for Subscription Limits
-- Migration 05: Usage tracking tables and functions
-- =============================================

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS user_usage_tracking CASCADE;

-- =============================================================================
-- TABLE: user_usage_tracking
-- Purpose: Track weekly usage limits for free/premium users
-- =============================================================================

CREATE TABLE user_usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Weekly tracking (resets every Monday at 00:00 UTC)
    week_start_date DATE NOT NULL, -- Monday of the current week
    
    -- Usage counters
    recipe_generations INTEGER DEFAULT 0 NOT NULL,
    grocery_list_generations INTEGER DEFAULT 0 NOT NULL,
    
    -- Limits (can be overridden per user if needed)
    recipe_generation_limit INTEGER DEFAULT 5 NOT NULL,
    grocery_list_limit INTEGER DEFAULT 5 NOT NULL,
    
    -- Premium status
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    premium_until TIMESTAMP WITH TIME ZONE NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, week_start_date),
    CHECK (recipe_generations >= 0),
    CHECK (grocery_list_generations >= 0),
    CHECK (recipe_generation_limit >= 0),
    CHECK (grocery_list_limit >= 0)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_usage_tracking_user_id ON user_usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_week_start ON user_usage_tracking(week_start_date);
CREATE INDEX idx_usage_tracking_user_week ON user_usage_tracking(user_id, week_start_date);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage data
CREATE POLICY "Users can view own usage tracking" ON user_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own usage data
CREATE POLICY "Users can update own usage tracking" ON user_usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own usage data
CREATE POLICY "Users can insert own usage tracking" ON user_usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get the Monday of the current week
CREATE OR REPLACE FUNCTION get_week_start_date(input_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
    -- Get the Monday of the week containing the input date
    RETURN input_date - (EXTRACT(DOW FROM input_date)::INTEGER - 1) * INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get or create usage tracking record for current week
CREATE OR REPLACE FUNCTION get_or_create_usage_tracking(p_user_id UUID)
RETURNS user_usage_tracking AS $$
DECLARE
    tracking_record user_usage_tracking;
    current_week_start DATE;
BEGIN
    current_week_start := get_week_start_date();
    
    -- Try to get existing record
    SELECT * INTO tracking_record
    FROM user_usage_tracking
    WHERE user_id = p_user_id AND week_start_date = current_week_start;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_usage_tracking (user_id, week_start_date)
        VALUES (p_user_id, current_week_start)
        RETURNING * INTO tracking_record;
    END IF;
    
    RETURN tracking_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform an action
CREATE OR REPLACE FUNCTION can_user_perform_action(
    p_user_id UUID,
    p_action_type TEXT -- 'recipe_generation' or 'grocery_list'
)
RETURNS BOOLEAN AS $$
DECLARE
    tracking_record user_usage_tracking;
    current_count INTEGER;
    current_limit INTEGER;
BEGIN
    -- Get or create tracking record
    tracking_record := get_or_create_usage_tracking(p_user_id);
    
    -- If user is premium, always allow
    IF tracking_record.is_premium AND 
       (tracking_record.premium_until IS NULL OR tracking_record.premium_until > NOW()) THEN
        RETURN TRUE;
    END IF;
    
    -- Check limits based on action type
    IF p_action_type = 'recipe_generation' THEN
        current_count := tracking_record.recipe_generations;
        current_limit := tracking_record.recipe_generation_limit;
    ELSIF p_action_type = 'grocery_list' THEN
        current_count := tracking_record.grocery_list_generations;
        current_limit := tracking_record.grocery_list_limit;
    ELSE
        RAISE EXCEPTION 'Invalid action type: %', p_action_type;
    END IF;
    
    RETURN current_count < current_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage_counter(
    p_user_id UUID,
    p_action_type TEXT -- 'recipe_generation' or 'grocery_list'
)
RETURNS BOOLEAN AS $$
DECLARE
    tracking_record user_usage_tracking;
    can_perform BOOLEAN;
BEGIN
    -- Check if user can perform action
    can_perform := can_user_perform_action(p_user_id, p_action_type);
    
    IF NOT can_perform THEN
        RETURN FALSE;
    END IF;
    
    -- Increment the appropriate counter
    IF p_action_type = 'recipe_generation' THEN
        UPDATE user_usage_tracking
        SET recipe_generations = recipe_generations + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id AND week_start_date = get_week_start_date();
    ELSIF p_action_type = 'grocery_list' THEN
        UPDATE user_usage_tracking
        SET grocery_list_generations = grocery_list_generations + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id AND week_start_date = get_week_start_date();
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage summary for a user
CREATE OR REPLACE FUNCTION get_user_usage_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    tracking_record user_usage_tracking;
    result JSON;
BEGIN
    -- Get or create tracking record
    tracking_record := get_or_create_usage_tracking(p_user_id);
    
    -- Build result JSON
    result := json_build_object(
        'is_premium', tracking_record.is_premium,
        'premium_until', tracking_record.premium_until,
        'week_start_date', tracking_record.week_start_date,
        'recipe_generations', json_build_object(
            'used', tracking_record.recipe_generations,
            'limit', tracking_record.recipe_generation_limit,
            'remaining', GREATEST(0, tracking_record.recipe_generation_limit - tracking_record.recipe_generations),
            'can_use', can_user_perform_action(p_user_id, 'recipe_generation')
        ),
        'grocery_lists', json_build_object(
            'used', tracking_record.grocery_list_generations,
            'limit', tracking_record.grocery_list_limit,
            'remaining', GREATEST(0, tracking_record.grocery_list_limit - tracking_record.grocery_list_generations),
            'can_use', can_user_perform_action(p_user_id, 'grocery_list')
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update premium status
CREATE OR REPLACE FUNCTION update_premium_status(
    p_user_id UUID,
    p_is_premium BOOLEAN,
    p_premium_until TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Get or create tracking record first
    PERFORM get_or_create_usage_tracking(p_user_id);
    
    -- Update premium status
    UPDATE user_usage_tracking
    SET is_premium = p_is_premium,
        premium_until = p_premium_until,
        updated_at = NOW()
    WHERE user_id = p_user_id AND week_start_date = get_week_start_date();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_usage_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_usage_tracking_updated_at
    BEFORE UPDATE ON user_usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_usage_tracking_updated_at();

-- =============================================================================
-- SAMPLE DATA (for development)
-- =============================================================================

-- Note: In production, usage tracking records are created automatically
-- when users first use the app or when get_or_create_usage_tracking is called

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE user_usage_tracking IS 'Tracks weekly usage limits for free/premium users';
COMMENT ON COLUMN user_usage_tracking.week_start_date IS 'Monday of the current week (resets weekly)';
COMMENT ON COLUMN user_usage_tracking.recipe_generations IS 'Number of recipes generated this week';
COMMENT ON COLUMN user_usage_tracking.grocery_list_generations IS 'Number of grocery lists generated this week';
COMMENT ON COLUMN user_usage_tracking.is_premium IS 'Whether user has premium subscription';
COMMENT ON COLUMN user_usage_tracking.premium_until IS 'When premium subscription expires (NULL = never expires)';

COMMENT ON FUNCTION get_week_start_date(DATE) IS 'Returns the Monday of the week containing the input date';
COMMENT ON FUNCTION get_or_create_usage_tracking(UUID) IS 'Gets or creates usage tracking record for current week';
COMMENT ON FUNCTION can_user_perform_action(UUID, TEXT) IS 'Checks if user can perform action based on limits';
COMMENT ON FUNCTION increment_usage_counter(UUID, TEXT) IS 'Increments usage counter if user can perform action';
COMMENT ON FUNCTION get_user_usage_summary(UUID) IS 'Returns complete usage summary as JSON';
COMMENT ON FUNCTION update_premium_status(UUID, BOOLEAN, TIMESTAMP WITH TIME ZONE) IS 'Updates user premium subscription status';

-- =============================================================================
-- GRANTS (if needed for specific roles)
-- =============================================================================

-- Grant usage to authenticated users (adjust as needed)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON TABLE user_usage_tracking TO authenticated;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================

/*
To rollback this migration:

DROP TABLE user_usage_tracking CASCADE;
DROP FUNCTION IF EXISTS get_week_start_date(DATE);
DROP FUNCTION IF EXISTS get_or_create_usage_tracking(UUID);
DROP FUNCTION IF EXISTS can_user_perform_action(UUID, TEXT);
DROP FUNCTION IF EXISTS increment_usage_counter(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_usage_summary(UUID);
DROP FUNCTION IF EXISTS update_premium_status(UUID, BOOLEAN, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS update_usage_tracking_updated_at();

*/