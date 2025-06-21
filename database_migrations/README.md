# Database Migrations

This folder contains all database schema migrations for the Sage AI Cooking Coach application using Supabase (PostgreSQL).

## 📁 Migration Files

### Migration Order
Run these migrations in numerical order. Each migration is designed to be idempotent (safe to run multiple times).

| File | Description | Feature | Status |
|------|-------------|---------|--------|
| `01_user_preferences.sql` | User preferences table for AI personalization | Advanced Preference Customization | ✅ Required |
| `02_meal_planning.sql` | Meal planning and grocery list tables | Premium Meal Planning | ✅ Required |
| `03_cost_analysis.sql` | Cost tracking and savings analysis | Cost Analysis & Financial Motivation | ✅ Required |
| `04_app_config.sql` | Centralized application configuration management | API Key Management & Config | ✅ Required |
| `05_usage_tracking.sql` | Usage tracking and subscription limits | Free Tier Limits & Premium Features | ✅ Required |
| `06_webhook_events.sql` | Webhook event logging and subscription management | Payment Integration & Webhooks | ✅ Required |
| `07_dietary_safety_fields.sql` | Dietary safety fields for onboarding | Enhanced Safety Collection | ✅ Required |

## 🚀 How to Run Migrations

### Prerequisites
- Supabase project with authentication enabled
- Basic tables (`user_profiles`, `user_recipes`, `cooking_sessions`) already created

### Steps
1. **Open Supabase Dashboard** → Navigate to your project
2. **Go to SQL Editor** (left sidebar)
3. **Run migrations in order:**
   - Copy contents of `01_user_preferences.sql` → Paste → Run
   - Copy contents of `02_meal_planning.sql` → Paste → Run  
   - Copy contents of `03_cost_analysis.sql` → Paste → Run
   - Copy contents of `04_app_config.sql` → Paste → Run
   - Copy contents of `05_usage_tracking.sql` → Paste → Run
   - Copy contents of `06_webhook_events.sql` → Paste → Run
   - Copy contents of `07_dietary_safety_fields.sql` → Paste → Run

### Verification
After running each migration, you can verify success by checking:
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_preferences', 'meal_plans', 'meal_plan_grocery_lists', 'app_config', 'user_usage_tracking', 'webhook_events');

-- Check cost columns were added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'cooking_sessions' 
AND column_name IN ('estimated_savings', 'recipe_cost', 'restaurant_cost');

-- Check dietary safety columns were added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('allergies', 'dietary_restrictions');
```

## 📋 Migration Details

### 01_user_preferences.sql
**Purpose:** Advanced User Profile & AI Personalization
- Creates `user_preferences` table with JSONB preferences data
- Enables comprehensive dietary restrictions, cooking context, and style preferences
- Supports custom user-defined options beyond presets
- Version field for future schema evolution

**Tables Created:**
- `user_preferences` - Stores user cooking preferences and dietary requirements

### 02_meal_planning.sql  
**Purpose:** Premium Meal Planning Feature
- Creates meal planning system with weekly meal grids
- Supports grocery list generation from meal plans
- Enables premium subscription workflow
- Includes proper RLS for multi-user security

**Tables Created:**
- `meal_plans` - Weekly meal planning data
- `meal_plan_grocery_lists` - Generated grocery lists from meal plans

### 03_cost_analysis.sql
**Purpose:** Cost Analysis & Financial Motivation
- Adds cost tracking to existing tables
- Enables savings calculation and dashboard
- Supports regional pricing and currency formatting
- Creates analytics views and helper functions

**Tables Modified:**
- `cooking_sessions` - Adds savings tracking columns
- `user_recipes` - Adds cost analysis columns (optional)

**Additional Objects:**
- `user_savings_summary` view for analytics
- `get_user_savings()` function for savings calculations
- Performance indexes and triggers

### 04_app_config.sql
**Purpose:** Centralized Application Configuration Management
- Creates centralized config management system
- Enables storing API keys and app settings in Supabase
- Supports caching and encrypted config values
- Provides fallback to local storage for API keys

**Tables Created:**
- `app_config` - Centralized application configuration storage

**Features:**
- Centralized Gemini API key management
- Configuration versioning and activation flags
- Secure storage with encryption support
- RLS policies for secure access

### 05_usage_tracking.sql
**Purpose:** Usage Tracking & Subscription Limits
- Creates usage tracking system for free/premium tiers
- Enables weekly usage limits for recipe generation and grocery lists
- Supports premium subscription management
- Provides usage analytics and limit enforcement

**Tables Created:**
- `user_usage_tracking` - Weekly usage tracking and premium status

**Functions Created:**
- `get_week_start_date()` - Calculate Monday of current week
- `get_or_create_usage_tracking()` - Get/create usage record for current week
- `can_user_perform_action()` - Check if user can perform action based on limits
- `increment_usage_counter()` - Increment usage counter if allowed
- `get_user_usage_summary()` - Get complete usage summary as JSON
- `update_premium_status()` - Update user premium subscription status

**Features:**
- Weekly usage limits (5 recipe generations + 5 grocery lists for free users)
- Premium user unlimited access
- Automatic weekly reset (Monday 00:00 UTC)
- Comprehensive usage analytics and reporting

### 06_webhook_events.sql
**Purpose:** Webhook Event Logging & Subscription Management
- Creates webhook event logging system for RevenueCat integration
- Adds subscription status columns to user_profiles table
- Enables automatic subscription status synchronization
- Provides audit trail for all subscription events

**Tables Created:**
- `webhook_events` - Logs all webhook events from RevenueCat

**Tables Modified:**
- `user_profiles` - Adds subscription status and management columns

**Functions Created:**
- `get_user_subscription_status()` - Get current subscription status for user
- `update_subscription_from_webhook()` - Update subscription from webhook event
- `cleanup_old_webhook_events()` - Maintenance function for old events

**Features:**
- Complete webhook event logging with audit trail
- Subscription status tracking with expiration dates
- Integration with RevenueCat user IDs
- Automatic subscription synchronization
- Maintenance functions for data cleanup

### 07_dietary_safety_fields.sql
**Purpose:** Enhanced Onboarding Safety Collection
- Adds critical dietary safety fields to user_profiles table
- Supports the new onboarding flow that collects allergy and dietary restriction data
- Ensures user safety by collecting this information before recipe generation
- Provides indexed access for efficient safety filtering

**Tables Modified:**
- `user_profiles` - Adds allergies and dietary_restrictions array columns

**Features:**
- Critical safety information collection during onboarding
- Array-based storage for multiple allergies and dietary restrictions
- GIN indexes for efficient array querying and filtering
- NOT NULL constraints to ensure data consistency
- Automatic migration of existing records with empty arrays

## 🔧 Database Schema Overview

After running all migrations, your database will include:

### Core Tables
- `auth.users` (Supabase managed)
- `user_profiles` (basic user info)
- `user_recipes` (generated recipes)
- `cooking_sessions` (cooking activity tracking)

### Feature Tables  
- `user_preferences` (AI personalization data)
- `meal_plans` (weekly meal planning)
- `meal_plan_grocery_lists` (grocery lists)
- `app_config` (centralized configuration management)
- `user_usage_tracking` (usage limits & premium status)
- `webhook_events` (payment webhook event logging)

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Proper foreign key constraints and cascading deletes

## 🛡️ Rollback Plans

Each migration includes rollback instructions if needed:

### Rollback 01 (User Preferences)
```sql
DROP TABLE IF EXISTS user_preferences;
```

### Rollback 02 (Meal Planning)
```sql
DROP TABLE IF EXISTS meal_plan_grocery_lists;
DROP TABLE IF EXISTS meal_plans;
```

### Rollback 03 (Cost Analysis)
```sql
-- Remove added columns
ALTER TABLE cooking_sessions 
DROP COLUMN IF EXISTS estimated_savings,
DROP COLUMN IF EXISTS recipe_cost,
DROP COLUMN IF EXISTS restaurant_cost;

ALTER TABLE user_recipes
DROP COLUMN IF EXISTS cost_per_serving,
DROP COLUMN IF EXISTS total_cost,
DROP COLUMN IF EXISTS servings;

-- Drop created objects
DROP VIEW IF EXISTS user_savings_summary;
DROP FUNCTION IF EXISTS get_user_savings(TEXT);
```

### Rollback 04 (App Config)
```sql
DROP TABLE IF EXISTS app_config;
```

### Rollback 05 (Usage Tracking)
```sql
DROP TABLE IF EXISTS user_usage_tracking CASCADE;
DROP FUNCTION IF EXISTS get_week_start_date(DATE);
DROP FUNCTION IF EXISTS get_or_create_usage_tracking(UUID);
DROP FUNCTION IF EXISTS can_user_perform_action(UUID, TEXT);
DROP FUNCTION IF EXISTS increment_usage_counter(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_usage_summary(UUID);
DROP FUNCTION IF EXISTS update_premium_status(UUID, BOOLEAN, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS update_usage_tracking_updated_at();
```

### Rollback 06 (Webhook Events)
```sql
-- Remove webhook events table
DROP TABLE IF EXISTS webhook_events CASCADE;

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
```

### Rollback 07 (Dietary Safety Fields)
```sql
-- Remove dietary safety columns from user_profiles
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS allergies,
DROP COLUMN IF EXISTS dietary_restrictions;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_profiles_allergies;
DROP INDEX IF EXISTS idx_user_profiles_dietary_restrictions;
```

## 📊 Performance Considerations

- All tables include appropriate indexes for common query patterns
- JSONB fields use GIN indexes where beneficial
- RLS policies are optimized for user_id lookups
- Triggers maintain data consistency automatically

## 🔍 Troubleshooting

### Common Issues

**"relation already exists"**
- Migrations are idempotent - this is expected on re-runs
- Use `IF NOT EXISTS` clauses to avoid errors

**RLS policy errors**
- Ensure `auth.uid()` is available (user is authenticated)
- Check that foreign key relationships are properly set up

**Performance issues**
- Monitor query performance with `EXPLAIN ANALYZE`
- Add additional indexes if needed for your specific query patterns

### Getting Help
If you encounter issues:
1. Check the error message carefully
2. Verify prerequisites are met
3. Run verification queries to check current state
4. Consult the individual migration file comments

## 📈 Migration History

| Date | Migration | Developer | Notes |
|------|-----------|-----------|-------|
| 2025-06-19 | 01_user_preferences | Claude | Advanced preference customization system |
| 2025-06-19 | 02_meal_planning | Claude | Premium meal planning feature |
| 2025-06-19 | 03_cost_analysis | Claude | Cost analysis & financial motivation |
| 2025-06-19 | 04_app_config | Claude | Centralized configuration and API key management |
| 2025-06-20 | 05_usage_tracking | Claude | Usage tracking and subscription limits system |
| 2025-06-20 | 06_webhook_events | Claude | Webhook event logging and subscription management |
| 2025-06-20 | 07_dietary_safety_fields | Claude | Enhanced onboarding with dietary safety collection |

---

**Note:** Always backup your database before running migrations in production!