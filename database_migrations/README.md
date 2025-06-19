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

### Verification
After running each migration, you can verify success by checking:
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_preferences', 'meal_plans', 'meal_plan_grocery_lists');

-- Check cost columns were added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'cooking_sessions' 
AND column_name IN ('estimated_savings', 'recipe_cost', 'restaurant_cost');
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

---

**Note:** Always backup your database before running migrations in production!