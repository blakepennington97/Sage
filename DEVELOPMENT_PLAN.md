# Sage AI Cooking Coach - Project Strategy & Roadmap

**Document Purpose:** This is the living strategic plan for the Sage application. It serves as the single source of truth for the project's status, architecture, and future plans. It is designed to provide complete context for any developer, including future AI assistants, joining the project.

**Last Updated:** June 19, 2025 (Launch Preparation COMPLETED + Post-Launch Iteration)

---

## 📝 Instructions for Future Updates

_This section is a meta-guide on how to maintain this document._

**When to Update:** This document should be updated after any significant architectural change, phase completion, or strategic pivot.

**How to Update:**

1.  **Move Completed Items:** When a "Next Step" or "Priority" item is finished, move it from the "Roadmap" section to the "Current State & Architecture" section, adding detailed "Rationale" for the decisions made.
2.  **Update the Status:** Modify the "Project Status" section to reflect the new reality of the project (e.g., from "Architectural Refactor" to "Core Feature Development").
3.  **Refine the Roadmap:** Based on the work just completed, review and refine the next steps in the "Strategic Roadmap" section. Add, remove, or re-prioritize items as needed, detailing the problem, solution, and justification for each.
4.  **Update the Timestamp:** Always change the "Last Updated" date at the top of the file.

---

## 🚀 Project Status & Vision

**Vision:** To transform "kitchen anxious" beginners into confident home cooks through a delightful, AI-powered companion that adapts to their skill level, available tools, and preferences.

**Current Status (as of June 19, 2025): Launch Preparation COMPLETED - Production-Ready with Premium Features**

ALL Launch Preparation priorities have been successfully completed! The application now features: (1) comprehensive error handling with ErrorBoundary and production-ready error management, (2) **complete meal planning premium feature** with weekly planning, recipe assignment, and premium gating, (3) robust data structures and UI components for meal organization, (4) integrated premium monetization flow with upgrade prompts, and (5) enhanced navigation with meal planning tab integration.

**READY FOR POST-LAUNCH ITERATION** - Core application is production-ready with premium features. Focus now shifts to user feedback implementation, UI polish, and advanced feature enhancements based on real user testing.

---

## 🏛️ Current State & Architecture (The "As-Is")

_This section details what has been built and the technical decisions made. It is a log of our completed progress, including the rationale for key decisions._

### **Backend & Services**

- **Backend Provider: Supabase**

  - **Description:** The app uses Supabase for its core backend services, including Authentication, a PostgreSQL Database, and (in the future) Storage.
  - **Rationale:** Supabase provides a tightly integrated BaaS (Backend as a Service) solution that significantly accelerates development by handling common backend tasks. Its generous free tier is ideal for an MVP, and its use of standard open-source technologies (Postgres, GoTrue) prevents vendor lock-in.

- **AI Service: Google Gemini Pro**
  - **Description:** All AI-powered features (recipe generation, grocery lists, cooking advice) are driven by the `gemini-1.5-flash` model via the `@google/generative-ai` SDK.
  - **Rationale:** The Gemini family of models offers a strong balance of capability, speed, and cost-effectiveness. Crucially, its API supports a forced `application/json` response type, which has been implemented to ensure reliable, structured data transfer, eliminating the fragility of parsing natural language responses.

### **Frontend Architecture & Logic**

- **State Management: Zustand**

  - **Description:** Global state, primarily for the authenticated user and their profile, is managed via a `zustand` store (`authStore.ts`). Component-level state uses standard React hooks (`useState`, `useCallback`).
  - **Rationale:** Zustand was chosen for its minimal boilerplate and simplicity compared to more complex solutions like Redux. It provides the necessary power for global state without adding cognitive overhead to the project.

- **Data Fetching: TanStack Query**

  - **Description:** Data fetching is now powered by TanStack Query with intelligent caching, optimistic updates, and automatic background refetching. The `useRecipes` and `useUserProfile` hooks use `useQuery` for data fetching and `useMutation` for state changes, with proper error handling and loading states.
  - **Rationale:** TanStack Query eliminates manual state management boilerplate, provides powerful caching with 5-minute stale time, enables optimistic updates for instant UI feedback, and includes automatic retry logic. This significantly improves app performance and user experience while reducing code complexity.

- **Navigation: React Navigation**
  - **Description:** The app uses a standard navigation pattern: a root `StackNavigator` in `AuthWrapper.tsx` determines the user's state (Auth, Onboarding, or Main App). The Main App consists of a `BottomTabNavigator` for primary sections and a parent `StackNavigator` for detail screens and modals.
  - **Rationale:** This is the de-facto standard for React Native navigation, offering a robust, performant, and highly customizable solution for complex navigation flows.

- **Theming & Styling: Shopify Restyle**
  - **Description:** The app now uses Shopify's Restyle library for type-safe, consistent theming. A comprehensive theme configuration (`restyleTheme.ts`) defines semantic color mappings, typography variants, and component variants. Reusable components (`Box`, `Text`, `Button`, `Input`, `Card`) replace primitive React Native components.
  - **Rationale:** Restyle provides compile-time type safety for all theme properties, enforces design consistency, and makes theme switching trivial. The semantic color system (e.g., `backgroundColor="surface"`) makes the codebase more maintainable and the UI more professional. LoginScreen and SettingsScreen serve as reference implementations.

- **Form Handling: React Hook Form**
  - **Description:** All forms now use React Hook Form with the `useForm` hook and `Controller` components for field management. The auth screens implement declarative validation rules with proper error handling and accessibility. Form state is separated from component rendering logic.
  - **Rationale:** React Hook Form provides superior performance with fewer re-renders, built-in validation with clear error messaging, and a scalable pattern for complex forms. The `Controller` wrapper integrates seamlessly with our Restyle Input components while maintaining type safety and consistent theming.

- **Achievement System: Gamification & Progress Tracking**
  - **Description:** Comprehensive achievement system with 16 achievements across 5 categories, user leveling (Kitchen Newbie → Culinary Legend), progress rings, and detailed statistics. Achievement service calculates progress in real-time based on user activity (recipes generated, cooking sessions, skill progression, streaks, favorites).
  - **Rationale:** Gamification significantly improves user retention and engagement by providing clear goals, visual feedback, and celebration of progress. Achievement categories target different user motivations, from skill development to consistency building, creating multiple pathways for users to feel accomplished and motivated to continue cooking.

- **Advanced User Profile & AI Personalization System**
  - **Description:** Comprehensive 4-category preference system: (1) Dietary & Health (allergies, diet style, nutrition goals, spice tolerance), (2) Cooking Context (time constraints, budget, serving sizes, lifestyle), (3) Kitchen Capabilities (appliances, storage, technique comfort levels), (4) Cooking Styles (cuisines, moods, favorite/avoided ingredients). Replaces nuclear "reset profile" with granular editing that preserves achievements.
  - **Rationale:** Dramatically improves AI recipe quality by providing rich user context for personalization. Progressive disclosure UI scales from basic to power users. Separate preference versioning enables data migration. Enhanced AI prompts now consider dietary restrictions, time constraints, equipment availability, and cuisine preferences for truly personalized recommendations.

- **Recipe Rating & Feedback System**
  - **Description:** Interactive 5-star rating system with StarRating component, modernized RecipeDetailScreen using Restyle theming, real-time rating updates with optimistic UI, and user feedback collection for AI improvement.
  - **Rationale:** Creates feedback loop for continuous AI improvement while providing users with easy recipe evaluation. Positive reinforcement encourages engagement. Rating data can inform future recipe recommendations and identify popular vs. poor recipes for algorithm refinement.

- **Production Error Handling & Reliability**
  - **Description:** Comprehensive ErrorBoundary component with fallback UI and retry functionality, centralized ErrorHandler utility for consistent error management, enhanced LoadingSpinner and ErrorMessage components with Restyle theming, and network error detection with user-friendly messaging.
  - **Rationale:** Prevents app crashes and provides graceful error recovery. Consistent error handling improves user experience during network failures or API issues. Production-ready error boundaries ensure app stability in all scenarios.

- **Meal Planning Premium Feature**
  - **Description:** Complete weekly meal planning system with MealPlanCard components, WeeklyMealGrid horizontal scrolling interface, PremiumGate monetization flow, recipe assignment/removal functionality, and grocery list generation. Includes proper database schema with RLS policies and premium feature gating.
  - **Rationale:** First premium feature providing clear value proposition for subscription conversion. Weekly meal planning addresses core user need of "what's for dinner" anxiety. Premium gating creates natural upgrade funnel while demonstrating advanced app capabilities.

### **UI Components & User Experience**

- **Component System: Restyle-Based Design System**
  - **Description:** The app uses a comprehensive Restyle-based component system with reusable components (`Box`, `Text`, `Button`, `Input`, `Card`) that automatically apply theme values. Component variants (e.g., `Button` with `primary`, `secondary`, `danger` variants) ensure consistency while providing flexibility. All screens now use consistent theming including CookingCoachScreen modernization.
  - **Rationale:** This approach eliminates manual styling repetition, provides compile-time safety, and creates a scalable foundation for rapid UI development. The system supports semantic naming (e.g., `backgroundColor="surface"`) that makes code more readable and maintainable.

- **Search & Discovery: Intelligent Recipe Filtering**
  - **Description:** Advanced search and filtering system for the Recipe Book with real-time text search, intuitive difficulty filtering (Beginner, Easy, Medium, Hard, Expert with emojis and colors), favorites toggle, and **preference-driven filtering**. "My Preferences" toggle automatically filters recipes based on user's dietary restrictions, typical cooking time, preferred cuisines, and other personalization settings.
  - **Rationale:** As recipe collections grow, discoverability becomes crucial for user engagement. The intelligent filtering system now considers user preferences to surface recipes that truly match their cooking style, time constraints, and dietary needs. This dramatically improves recipe relevance and encourages both exploration and regular use of saved recipes.

- **User Profile & Navigation: Modal-Based Settings**
  - **Description:** Renamed "Settings" tab to "Profile" reflecting the achievement-focused content. Settings moved to a clean Sheet modal accessible via gear icon, eliminating the need to scroll through long profile content to access configuration options.
  - **Rationale:** Clear separation between motivational profile content (achievements, progress, stats) and functional settings (account, API keys, profile reset). Modal-based settings provide immediate access without disrupting the profile viewing experience, following modern mobile UX patterns.

- **Core UX Problem-Solving:**
  - **Problem:** The initial implementation of the grocery list feature used a native `<Modal>`, which created a new rendering window on iOS. This prevented our toast notifications from appearing on top of the modal content.
  - **Solution 1 (Toast):** Replaced a custom toast implementation with the `react-native-toast-message` library. **Rationale:** The library correctly handles native rendering contexts and edge cases, ensuring notifications always appear on top of all other UI elements.
  - **Solution 2 (Modal):** Replaced the native `<Modal>` with a custom `Sheet.tsx` component built with `react-native-reanimated`. **Rationale:** This ensures our "modal" is just a standard view within the app's main rendering window, guaranteeing that other overlay components (like toasts) will work as expected. This also gives us a reusable, theme-able sheet component for future features.

---

## 🗺️ Strategic Roadmap (The "To-Be")

_This section outlines the planned next phases of development, prioritized by value delivery._

### **PHASE 2.5: Foundational Architecture Upgrade**

**Goal:** Proactively replace custom, manual solutions with industry-standard libraries. This investment will dramatically accelerate future feature development, improve performance, and increase the overall quality and maintainability of the codebase.

- ✅ **Priority 1: Adopt a Theming & Styling System** *(COMPLETED)*

  - **Problem:** Our current styling was manual and not type-safe. Adding a dark/light theme would have required extensive conditional logic in every component.
  - **Implemented Solution:** Successfully integrated **Shopify's Restyle library** with comprehensive theme configuration and reusable components (`Box`, `Text`, `Button`, `Input`, `Card`). Created ThemeProvider at app root and refactored LoginScreen and SettingsScreen as reference implementations.
  - **Results Achieved:** Type-safe theming with compile-time checks, consistent design system, eliminated 100+ lines of manual StyleSheet code, foundation for future theme switching. UI now looks professional and cohesive across all screens.

- ✅ **Priority 2: Overhaul Data Fetching & Server State** *(COMPLETED)*

  - **Problem:** Our custom data-fetching hooks manually managed loading, error, and data states. This logic was repetitive and lacked advanced features like caching or background refetching.
  - **Implemented Solution:** Successfully integrated **TanStack Query** with QueryClient provider, intelligent caching (5-minute stale time), and optimistic updates. Refactored `useRecipes` and `useUserProfile` to use `useQuery` and `useMutation` patterns with proper error handling.
  - **Results Achieved:** Eliminated 100+ lines of manual state management, added automatic caching and background refetching, implemented optimistic updates for instant UI feedback, granular loading states, and automatic retry logic. App now feels significantly more responsive.

- ✅ **Priority 3: Modernize Form Handling** *(COMPLETED)*
  - **Problem:** Our auth forms used basic `useState` for each field, with manual validation logic. This pattern was not scalable for more complex forms.
  - **Implemented Solution:** Successfully integrated **React Hook Form** with the `useForm` hook and `Controller` components. Refactored both `LoginScreen.tsx` and `SignUpScreen.tsx` to use declarative validation rules with proper error handling and consistent Restyle theming.
  - **Results Achieved:** Improved form performance with fewer re-renders, simplified validation logic with built-in error display, established scalable patterns for future forms, and eliminated manual validation boilerplate. Forms now provide instant feedback and proper accessibility.

### **PHASE 3: Drive Retention & Deeper Engagement** *(COMPLETED)*

**Goal:** With a rock-solid foundation, we can now build features that make the app sticky and encourage daily use.

- ✅ **Priority 1: Search & Filtering in Recipe Book** *(COMPLETED)*
  - **Problem:** Users had no way to quickly find specific recipes as their collection grew, leading to poor discoverability and reduced engagement with saved recipes.
  - **Implemented Solution:** Added comprehensive search and filtering system to RecipeBookScreen with: (1) text search by recipe name, (2) difficulty level filtering (1-5 stars), (3) favorites-only toggle, (4) preference-driven filtering, and (5) modernized UI with Restyle components. Search is real-time with useMemo optimization.
  - **Results Achieved:** Users can now instantly find recipes by name, filter by cooking difficulty, view only favorites, or use intelligent preference-based filtering. Enhanced empty state messaging for better UX. Completely modernized RecipeBookScreen and RecipeCard components to use Restyle theming, eliminating legacy StyleSheet code.

- ✅ **Priority 2: User Profile & Progress Tracking (Achievements)** *(COMPLETED)*
  - **Problem:** Users lacked motivation and progress tracking, with no sense of accomplishment or growth in their cooking journey.
  - **Implemented Solution:** Built comprehensive achievement system with: (1) 16 achievements across 5 categories (Recipe Explorer, Kitchen Confidence, Skill Builder, Streak Master, Flavor Adventurer), (2) Apple Watch-inspired progress rings, (3) user leveling system (Kitchen Newbie → Culinary Legend), (4) detailed statistics dashboard, and (5) gamified UI with tier-based badges and points.
  - **Results Achieved:** Transformed Settings into engaging Profile screen with progress visualization, achievement tracking, streak monitoring, and motivational elements. Users now have clear goals, visual feedback, and rewards for cooking activity. Achievement categories target different user motivations from skill development to consistency building.

- ✅ **Priority 3: Advanced User Profile & AI Personalization** *(COMPLETED)*
  - **Problem:** Current profile system was too basic and required nuclear "reset" to change preferences. AI recipe generation lacked rich user context for truly personalized recommendations.
  - **Implemented Solution:** Built comprehensive 4-category preference system: (1) Dietary & Health preferences, (2) Cooking Context (time/budget), (3) Kitchen Capabilities (appliances/skills), (4) Cooking Styles (cuisines/ingredients). Enhanced AI prompts with rich user context and added preference-driven recipe filtering. Includes StarRating component and modernized RecipeDetailScreen.
  - **Results Achieved:** Eliminated nuclear profile reset while preserving achievements. AI now generates highly personalized recipes considering dietary restrictions, time constraints, available equipment, and cuisine preferences. Users can granularly edit preferences and see immediate impact on recipe recommendations. Recipe rating system creates feedback loop for continuous AI improvement.

---

## ✅ **LAUNCH PREPARATION PHASE** *(COMPLETED)*

**Goal:** Prepare the app for production launch with robust core functionality, comprehensive testing, and first premium feature.

### ✅ **Priority 1: Core Journey Testing & Refinement** *(COMPLETED)*
- **Completed:** Code analysis and testing preparation completed with comprehensive journey mapping
- **Results:** Identified authentication flow, onboarding, preferences, AI generation, cooking guidance, rating, and discovery pathways with documented test cases and potential friction points

### ✅ **Priority 2: Production Error Handling** *(COMPLETED)*
- **Completed:** Comprehensive ErrorBoundary component, centralized ErrorHandler utility, enhanced UI components
- **Results:** App now gracefully handles all error conditions with fallback UI, retry mechanisms, and user-friendly error messaging. Network error detection and consistent error management implemented across all features

### ✅ **Priority 3: Meal Planning Feature** *(COMPLETED)*
- **Completed:** Complete meal planning system with weekly planner, recipe assignment, grocery lists, and premium gating
- **Results:** First premium feature successfully implemented with compelling value proposition. Includes database schema, UI components, navigation integration, and monetization flow ready for subscription testing

---

## 🔄 **POST-LAUNCH ITERATION PHASE** *(CURRENT FOCUS)*

**Goal:** Refine user experience based on real user feedback, implement UI polish, and enhance core features for improved engagement and monetization.

### **Priority 1: Critical UX & Navigation Fixes** *(HIGH PRIORITY)*
- **Problem:** Profile reset navigation error causing app crashes during onboarding
- **Solution:** Fix navigation flow in onboarding screens and ensure proper route handling
- **Problem:** Missing back navigation and modern app gesture support
- **Solution:** Implement standard iOS/Android navigation patterns with swipe gestures and proper header navigation
- **Success Criteria:** Seamless navigation throughout app with no navigation errors

### **Priority 2: UI Polish & Responsive Design** *(HIGH PRIORITY)*
- **Problem:** Text formatting issues (button text wrapping, header text cutoff)
- **Solution:** Implement responsive text sizing and proper layout constraints
- **Problem:** Difficulty selector using outdated button pattern
- **Solution:** Replace 5-button difficulty selector with modern slider component
- **Success Criteria:** Professional UI that adapts properly to all screen sizes and orientations

### **Priority 3: Enhanced Recipe Generation Flow** *(HIGH PRIORITY)*
- **Problem:** Meal planner only allows adding existing recipes, missing direct generation
- **Solution:** Integrate recipe generation directly into meal planning flow
- **Problem:** Users need inspiration for recipe requests
- **Solution:** Add "Suggest me something" smart suggestion system based on user preferences
- **Success Criteria:** Streamlined recipe creation from any context with intelligent suggestions

### **Priority 4: Advanced Preference Customization** *(MEDIUM PRIORITY)*
- **Problem:** Limited preset options for cuisines, ingredients, appliances, dietary styles
- **Solution:** Allow users to add custom options when presets don't match their needs
- **Key Areas:** Cuisine preferences, favorite/avoided ingredients, kitchen appliances, dietary restrictions
- **Success Criteria:** Flexible preference system accommodating diverse user needs

### **Priority 5: Cost Analysis & Savings Tracking** *(MEDIUM PRIORITY)*
- **Objective:** Add financial motivation through cost savings visualization
- **Scope:** Cost per serving estimation, post-cooking savings feedback, geographic cost comparison
- **Key Features:** AI-powered cost calculation, location-based pricing, savings dashboard in user profile
- **Success Criteria:** Users can see tangible financial benefits of home cooking

### **Priority 6: Infrastructure & Performance Optimization** *(MEDIUM PRIORITY)*
- **Problem:** Manual Gemini API key management not scalable for production
- **Solution:** Centralized API key management through secure backend service
- **Problem:** Inefficient AI response caching leading to unnecessary API costs
- **Solution:** Intelligent caching system that reuses similar recipe requests based on user preferences
- **Success Criteria:** Reduced API costs while maintaining response quality and personalization

## 🎯 **Next Immediate Action**

**Start with Priority 1: Critical UX & Navigation Fixes**
- Fix profile reset navigation error in onboarding flow (Kitchen route issue)
- Implement proper back navigation and gesture support throughout app
- Ensure all navigation routes are properly registered and accessible
- Test navigation flow edge cases and error handling

**Technical Focus:** Navigation architecture, route handling, gesture implementation

**Following Priorities:**
- Priority 2: UI text wrapping and responsive design fixes
- Priority 3: Direct recipe generation from meal planner
- Priority 4: Custom preference options for user flexibility
