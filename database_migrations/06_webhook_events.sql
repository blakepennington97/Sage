-- =============================================
-- Webhook Events and Subscription Management
-- Migration 06: Webhook event logging and subscription status tracking
-- =============================================

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS webhook_events CASCADE;

-- =============================================================================
-- TABLE: webhook_events
-- Purpose: Log webhook events from RevenueCat for audit and debugging
-- =============================================================================

CREATE TABLE webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event identification
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    
    -- User and product information
    app_user_id UUID NOT NULL,
    product_id VARCHAR(255),
    
    -- Environment and metadata
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('PRODUCTION', 'SANDBOX')),
    store VARCHAR(20) CHECK (store IN ('APP_STORE', 'PLAY_STORE', 'AMAZON', 'STRIPE')),
    
    -- Full event data
    event_data JSONB NOT NULL,
    
    -- Processing information
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    processing_status VARCHAR(20) DEFAULT 'success' CHECK (processing_status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_app_user_id ON webhook_events(app_user_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_environment ON webhook_events(environment);
CREATE INDEX idx_webhook_events_processed_at ON webhook_events(processed_at);
CREATE INDEX idx_webhook_events_product_id ON webhook_events(product_id);

-- GIN index for JSONB event_data queries
CREATE INDEX idx_webhook_events_event_data ON webhook_events USING GIN(event_data);

-- =============================================================================
-- ADD SUBSCRIPTION COLUMNS TO USER_PROFILES
-- =============================================================================

-- Add subscription management columns to existing user_profiles table
DO $$ 
BEGIN
    -- Add subscription_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'free' 
        CHECK (subscription_status IN ('free', 'active', 'inactive', 'billing_issue', 'cancelled'));
    END IF;
    
    -- Add premium_until column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'premium_until'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN premium_until TIMESTAMP WITH TIME ZONE NULL;
    END IF;
    
    -- Add subscription_product_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_product_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_product_id VARCHAR(255) NULL;
    END IF;
    
    -- Add subscription_period_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_period_type'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_period_type VARCHAR(20) NULL 
        CHECK (subscription_period_type IN ('NORMAL', 'TRIAL', 'INTRO'));
    END IF;
    
    -- Add revenuecat_user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'revenuecat_user_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN revenuecat_user_id VARCHAR(255) NULL;
    END IF;
    
    -- Add last_webhook_processed column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'last_webhook_processed'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN last_webhook_processed TIMESTAMP WITH TIME ZONE NULL;
    END IF;
END $$;

-- Add indexes for subscription columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_premium_until ON user_profiles(premium_until);
CREATE INDEX IF NOT EXISTS idx_user_profiles_revenuecat_user_id ON user_profiles(revenuecat_user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only allow service role to read/write webhook events (for security)
CREATE POLICY "Service role can manage webhook events" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view their own webhook events (for debugging)
CREATE POLICY "Users can view own webhook events" ON webhook_events
    FOR SELECT USING (app_user_id = auth.uid());

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get subscription status for a user
CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    profile_record user_profiles;
    result JSON;
BEGIN
    -- Get user profile
    SELECT * INTO profile_record
    FROM user_profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'status', 'not_found',
            'is_premium', false,
            'expires_at', null
        );
    END IF;
    
    -- Build result
    result := json_build_object(
        'status', COALESCE(profile_record.subscription_status, 'free'),
        'is_premium', (
            profile_record.subscription_status = 'active' AND 
            (profile_record.premium_until IS NULL OR profile_record.premium_until > NOW())
        ),
        'expires_at', profile_record.premium_until,
        'product_id', profile_record.subscription_product_id,
        'period_type', profile_record.subscription_period_type,
        'revenuecat_user_id', profile_record.revenuecat_user_id
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update subscription status from webhook
CREATE OR REPLACE FUNCTION update_subscription_from_webhook(
    p_user_id UUID,
    p_status VARCHAR(20),
    p_premium_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_product_id VARCHAR(255) DEFAULT NULL,
    p_period_type VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user profile subscription data
    UPDATE user_profiles
    SET 
        subscription_status = p_status,
        premium_until = p_premium_until,
        subscription_product_id = p_product_id,
        subscription_period_type = p_period_type,
        last_webhook_processed = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Return whether the update was successful
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old webhook events (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_events
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to automatically update updated_at on user_profiles when subscription changes
CREATE OR REPLACE FUNCTION update_user_profiles_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update timestamp if subscription-related fields changed
    IF (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
        OLD.premium_until IS DISTINCT FROM NEW.premium_until OR
        OLD.subscription_product_id IS DISTINCT FROM NEW.subscription_product_id OR
        OLD.subscription_period_type IS DISTINCT FROM NEW.subscription_period_type) THEN
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_user_profiles_subscription_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_subscription_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_subscription_updated_at();

-- =============================================================================
-- SAMPLE DATA (for development/testing)
-- =============================================================================

-- No sample data needed for webhook events

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE webhook_events IS 'Stores webhook events from RevenueCat for subscription management';
COMMENT ON COLUMN webhook_events.event_id IS 'Unique event ID from RevenueCat';
COMMENT ON COLUMN webhook_events.app_user_id IS 'User ID from our application';
COMMENT ON COLUMN webhook_events.event_data IS 'Complete webhook payload as JSONB';
COMMENT ON COLUMN webhook_events.processing_status IS 'Whether the webhook was processed successfully';

COMMENT ON FUNCTION get_user_subscription_status(UUID) IS 'Get current subscription status for a user';
COMMENT ON FUNCTION update_subscription_from_webhook(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE, VARCHAR, VARCHAR) IS 'Update user subscription status from webhook event';
COMMENT ON FUNCTION cleanup_old_webhook_events(INTEGER) IS 'Remove webhook events older than specified days';

-- =============================================================================
-- GRANTS (if needed for specific roles)
-- =============================================================================

-- Grant webhook handling permissions to service role
-- GRANT ALL ON TABLE webhook_events TO service_role;
-- GRANT EXECUTE ON FUNCTION update_subscription_from_webhook TO service_role;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================

/*
To rollback this migration:

-- Remove webhook events table
DROP TABLE webhook_events CASCADE;

-- Remove subscription columns from user_profiles
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS premium_until,
DROP COLUMN IF EXISTS subscription_product_id,
DROP COLUMN IF EXISTS subscription_period_type,
DROP COLUMN IF EXISTS revenuecat_user_id,
DROP COLUMN IF EXISTS last_webhook_processed;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_subscription_status(UUID);
DROP FUNCTION IF EXISTS update_subscription_from_webhook(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS cleanup_old_webhook_events(INTEGER);
DROP FUNCTION IF EXISTS update_user_profiles_subscription_updated_at();

*/