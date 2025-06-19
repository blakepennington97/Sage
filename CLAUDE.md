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
```

### Testing on Device
- Install Expo Go app on iOS device
- Scan QR code from development server
- Requires physical iOS device (currently iOS-first development)

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

### Code Organization
```
src/
├── components/     # Reusable UI components
├── screens/        # Application screens
├── services/       # External integrations (AI, Supabase)
├── stores/         # Zustand state management
├── hooks/          # Custom React hooks
├── constants/      # Theme and configuration
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
- **Context Awareness**: Adapts to user skill level and kitchen equipment

### Supabase Integration (`src/services/supabase.ts`)
- **Authentication**: Email/password with persistent sessions
- **Database**: User profiles, recipes, cooking sessions
- **Real-time Features**: Live cooking guidance

### State Management (`src/stores/`)
- **Zustand Stores**: Lightweight alternative to Redux
- **Auth Store**: User authentication and profile data
- **Persistent Storage**: AsyncStorage + SecureStore for sensitive data

## Design System

### Theme (`src/constants/theme.ts`)
- **Colors**: Dark theme with green primary (#4CAF50)
- **Spacing**: 8px grid system (xs:4, sm:8, md:16, lg:24, xl:32, xxl:48)
- **Typography**: Consistent font scales and weights

## Development Workflow

### File Conventions
- **Components**: PascalCase with descriptive names
- **Hooks**: Prefixed with `use` (e.g., `useRecipes`, `useUserProfile`)
- **Services**: Functional modules with clear separation
- **Types**: Organized by feature domain

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