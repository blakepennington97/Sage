# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Philosophy

**Always think deeply on the problem, considering multiple solutions using best, modern practices, before finalizing on the best solution.**

When approaching any development task:
1. **Investigate thoroughly** - Understand the root cause, not just symptoms
2. **Consider multiple approaches** - Evaluate different architectural patterns and solutions
3. **Use modern best practices** - Leverage established libraries, patterns, and techniques
4. **Think about edge cases** - Consider error scenarios, race conditions, and user experience
5. **Implement robust solutions** - Build systems that are maintainable, scalable, and future-proof

## Project Overview

Sage is an AI-powered personal cooking coach React Native application built with Expo SDK 53. It helps beginners build cooking confidence through personalized guidance, real-time support, and skill development.

## Development Commands

### Essential Commands
```bash
# Start development server
npm start

# Platform-specific development
npm run ios        # iOS development
npm run android    # Android development

# Code quality
npm run lint       # Run ESLint
npx tsc --noEmit   # TypeScript compilation check
```

### Development Workflow
1. **Always run TypeScript check** before committing: `npx tsc --noEmit`
2. **Test on device**: Use Expo Go app on iOS device (scan QR code)
3. **At checkpoints**: Update documentation, commit changes, push to GitHub, clear context

### Git Push Setup
To push commits to GitHub, configure the remote with the access token:
```bash
# User must provide the actual GitHub Personal Access Token
git remote set-url origin https://YOUR_GITHUB_TOKEN@github.com/blakepennington97/Sage.git
git push origin main
```
**Note**: User should provide their GitHub Personal Access Token for push access to the repository

## Database Migrations

### Database Schema Setup
All database migrations are organized in the `database_migrations/` folder:

```bash
database_migrations/
├── README.md                    # Migration documentation and instructions
├── 01_user_preferences.sql      # User preferences table (Advanced Personalization)
├── 02_meal_planning.sql         # Meal planning tables (Premium Feature)
└── 03_cost_analysis.sql         # Cost tracking and savings (Financial Motivation)
```

**Important:** Run migrations in numerical order in your Supabase SQL Editor. Each migration is idempotent and safe to run multiple times. See `database_migrations/README.md` for detailed instructions.

## Environment Setup

### Required Environment Variables
Create `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Prerequisites
- Node.js (LTS version)
- Expo CLI: `npm install -g @expo/cli`
- Google Gemini API key from Google AI Studio
- Supabase project with URL and anon key

## Architecture Overview

### Tech Stack
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand stores
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI Service**: Google Gemini (gemini-1.5-flash model)
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)
- **Theming**: Shopify Restyle (type-safe design system)
- **Data Fetching**: TanStack Query (caching, optimistic updates)
- **Form Handling**: React Hook Form (declarative validation, performance)
- **User Preferences**: Advanced customization with dynamic custom options

### Code Organization
```
src/
├── components/     # Reusable UI components
│   └── ui/         # Restyle design system components
├── screens/        # Application screens
├── services/       # External integrations (AI, Supabase)
├── stores/         # Zustand state management
├── hooks/          # Custom React hooks
├── constants/      # Theme and configuration
│   └── restyleTheme.ts  # Restyle theme configuration
├── config/         # Environment configuration
├── types/          # TypeScript definitions
└── utils/          # Utility functions
```

### Navigation Structure
1. **AuthWrapper** - Main navigation controller
2. **AuthNavigator** - Login/SignUp stack
3. **OnboardingNavigator** - Skill evaluation + kitchen assessment
4. **AppNavigator** - Main app stack
5. **MainTabs** - Bottom tab navigation

## Key Services

### AI Integration (`src/services/ai/`)
- **Gemini Service**: Recipe generation and cooking guidance
- **Response Caching**: Optimized API usage
- **Advanced Personalization**: Adapts to user skill level, kitchen equipment, and custom preferences
- **Custom Preference Integration**: Processes custom cuisines, ingredients, appliances, and dietary restrictions

### Data Fetching (`src/hooks/`)
- **TanStack Query**: Intelligent caching with 5-minute stale time
- **Optimistic Updates**: Instant UI feedback for mutations
- **Query Keys**: Organized cache invalidation (`['recipes', userId]`)
- **Automatic Retry**: Built-in error recovery and background refetching

### Supabase Integration (`src/services/supabase.ts`)
- **Authentication**: Email/password with persistent sessions
- **Database**: User profiles, recipes, cooking sessions
- **Real-time Features**: Live cooking guidance

### State Management (`src/stores/`)
- **Zustand Stores**: Global state (auth, profile)
- **TanStack Query**: Server state with caching
- **Persistent Storage**: AsyncStorage + SecureStore for sensitive data

## Design System

### Restyle Theme (`src/constants/restyleTheme.ts`)
- **Type-Safe Components**: `Box`, `Text`, `Button`, `Input`, `Card` with semantic props
- **Colors**: Dark theme with semantic mappings (`primaryText`, `surface`, `border`)
- **Spacing**: 8px grid system (xs:4, sm:8, md:16, lg:24, xl:32, xxl:48)
- **Typography**: Variants (h1, h2, h3, body, caption, button)
- **Component Variants**: Button (primary, secondary, danger), Card (primary, secondary)

### Usage Pattern
```tsx
// Type-safe, semantic styling
<Box backgroundColor="surface" padding="md" borderRadius="lg">
  <Text variant="h2" color="primaryText">Title</Text>
  <Button variant="primary" marginTop="sm">
    <Text variant="button" color="primaryButtonText">Action</Text>
  </Button>
</Box>
```

## Development Workflow

### Core Principles
1. **Continuous Improvement**: At any checkpoint, improve design, architecture, or code flow
2. **Documentation-Driven**: Update CLAUDE.md and DEVELOPMENT_PLAN.md after major changes
3. **Checkpoint Pattern**: After solid progress, commit changes and clear context
4. **Type Safety First**: Always run `npx tsc --noEmit` before committing

### File Conventions
- **Components**: PascalCase with descriptive names
- **Hooks**: Prefixed with `use` (e.g., `useRecipes`, `useUserProfile`)
- **Services**: Functional modules with clear separation
- **Types**: Organized by feature domain
- **Styling**: Use Restyle components instead of StyleSheet (prefer `Box` over `View`)

### Code Quality
- TypeScript strict mode enabled
- ESLint with Expo configuration
- Consistent import organization
- Component-based architecture with custom hooks

### Development Philosophy
- **Don't Reinvent the Wheel**: Always prefer well-established, community-tested libraries over custom implementations for standard functionality (sliders, date pickers, modals, etc.)
- **Community Libraries First**: When choosing between building custom vs using proven libraries, choose libraries that are:
  - Actively maintained with recent updates
  - Have good TypeScript support
  - Are compatible with our tech stack (Expo, React Native)
  - Have strong community adoption and documentation
- **Modern UI Libraries Used**:
  - `@react-native-community/slider` - Native sliders instead of custom gesture handling
  - `@gorhom/bottom-sheet` - Modern bottom sheets/modals with smooth animations
  - `react-native-toast-notifications` - Professional toast system with custom theming
  - `react-native-super-grid` - Optimized grid layouts with FlatList performance

## Payment System (Currently Disabled)

### Feature Flags
The payment system is fully implemented but currently disabled via feature flags in `src/config/features.ts`. To enable payment features when ready for App Store deployment:

1. **Update feature flags:**
   ```typescript
   export const FEATURE_FLAGS: FeatureFlags = {
     paymentSystem: true,     // Enable payment processing
     usageTracking: true,     // Enable usage limits
     premiumFeatures: true,   // Enable premium features
     upgradePrompts: true,    // Enable upgrade prompts
   };
   ```

2. **Configure RevenueCat API keys** in `src/services/payment.ts`
3. **Run database migrations** 05-06 for usage tracking and webhooks
4. **Set up App Store/Play Store products** (see `PAYMENT_SETUP.md`)
5. **Deploy webhook endpoints** for subscription management

### Current Behavior
- All users have unlimited access (no usage limits)
- No payment prompts or upgrade screens
- Payment code exists but is inactive
- Ready to activate when App Store publishing is desired

## Important Implementation Notes

### Security
- API keys stored in Expo SecureStore (production)
- Environment variables for configuration
- Supabase RLS policies for data protection

### Performance
- Image optimization with Expo Image
- Response caching for AI requests
- Offline detection and handling

### User Experience
- Haptic feedback for interactions
- Loading states and error handling
- Bottom sheet modals for complex interactions
- Toast notifications for user feedback

## Business Context

The app targets "kitchen anxious" users transitioning from takeout to home cooking. Features include personalized recipe generation, step-by-step cooking guidance, and skill development tracking. The freemium model offers 2 free guided sessions per week, with premium unlimited access at $9.99/month.

## Advanced Features

### User Preference System (`src/components/PreferencesEditor.tsx`)
- **Custom Cuisines**: Dynamic input fields for user-defined cuisine preferences
- **Custom Ingredients**: Favorite and avoided ingredient management with Alert.prompt interface
- **Custom Appliances**: Kitchen equipment beyond preset options with normalized storage
- **Custom Dietary Restrictions**: Allergies, intolerances, and health objectives
- **AI Integration**: Custom preferences processed with equal priority to preset options

### Production Infrastructure
- **API Key Management**: Centralized Gemini API key management for production scale
- **Intelligent Caching**: Smart response caching based on recipe similarity and user preferences
- **Cost Optimization**: Usage monitoring and cost reduction strategies
- **Performance**: Optimized data fetching and background processing

### Future Development Priorities
1. **Cost Analysis Features**: Recipe cost estimation and savings tracking
2. **Enhanced Meal Planning**: Advanced premium features and social sharing
3. **Infrastructure Optimization**: Scalable API management and intelligent caching