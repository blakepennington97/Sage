# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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