-- Migration: App Configuration Management
-- Purpose: Store centralized application configuration including API keys
-- File: database_migrations/04_app_config.sql
-- Date: 2024

-- Create app_config table for centralized configuration management
CREATE TABLE IF NOT EXISTS app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_app_config_key_active ON app_config(config_key, is_active);

-- RLS Policy - Only allow authenticated users to read config (admin write only in production)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Policy for reading config (all authenticated users)
CREATE POLICY "Allow authenticated users to read config" ON app_config 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Policy for admin management (you'll need to restrict this in production)
-- For now, any authenticated user can manage config (change this for production)
CREATE POLICY "Allow config management" ON app_config 
    FOR ALL 
    USING (auth.role() = 'authenticated');

-- Insert default configuration values
INSERT INTO app_config (config_key, config_value, config_description, is_active) VALUES
    ('gemini_api_key', '', 'Centralized Gemini API key for the application', false),
    ('max_free_recipes_per_day', '5', 'Maximum free recipes per user per day', true),
    ('enable_premium_features', 'true', 'Enable premium features globally', true),
    ('maintenance_mode', 'false', 'Application maintenance mode flag', true),
    ('support_email', 'support@sage-app.com', 'Support contact email', true),
    ('gemini_rate_limit', '15', 'Requests per minute limit for Gemini API', true)
ON CONFLICT (config_key) DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_app_config_updated_at 
    BEFORE UPDATE ON app_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_app_config_updated_at();

-- Comments for documentation
COMMENT ON TABLE app_config IS 'Centralized application configuration storage';
COMMENT ON COLUMN app_config.config_key IS 'Unique configuration key identifier';
COMMENT ON COLUMN app_config.config_value IS 'Configuration value (stored as text)';
COMMENT ON COLUMN app_config.config_description IS 'Human-readable description of the config';
COMMENT ON COLUMN app_config.is_active IS 'Whether this configuration is currently active';
COMMENT ON COLUMN app_config.is_encrypted IS 'Flag indicating if the value is encrypted (for future use)';

-- Usage Instructions:
-- 1. To set the centralized Gemini API key:
--    UPDATE app_config SET config_value = 'your_api_key_here', is_active = true 
--    WHERE config_key = 'gemini_api_key';
--
-- 2. To disable centralized API key (fall back to user keys):
--    UPDATE app_config SET is_active = false WHERE config_key = 'gemini_api_key';
--
-- 3. To view current configuration:
--    SELECT * FROM app_config WHERE is_active = true;