# Sage AI Cooking Coach - Project Strategy & Roadmap

**Document Purpose:** This is the living strategic plan for the Sage application. It serves as the single source of truth for the project's status, architecture, and future plans. It is designed to provide complete context for any developer, including future AI assistants, joining the project.

**Last Updated:** June 19, 2025 (Advanced Preference Customization COMPLETED + Enhanced AI Personalization)

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

**Current Status (as of June 19, 2025): Advanced Preference Customization COMPLETED - Enhanced AI Personalization**

MAJOR ENHANCEMENT: **Advanced Preference Customization** feature completed! The application now features: (1) **dynamic custom preference inputs** allowing users to add custom cuisines, ingredients, appliances, and dietary restrictions beyond preset options, (2) **enhanced AI personalization** with custom preferences fully integrated into recipe generation and cooking advice, (3) **comprehensive dietary management** including custom allergies, health objectives, and intolerances, and (4) **flexible user preferences** accommodating diverse needs with custom options stored and processed seamlessly.

**ENHANCED AI PERSONALIZATION** - AI now processes both standard and custom user preferences with equal importance. Recipe generation and cooking advice adapt to user-defined cuisines, custom appliances, personal dietary restrictions, and unique ingredient preferences. Significantly improved personalization quality for diverse user needs.

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

- **Modern Navigation & UX System**
  - **Description:** Comprehensive navigation system with gesture-based controls, swipe navigation, proper header back buttons, and crash-free onboarding flow. Includes fixed profile reset navigation error and modern app interaction patterns throughout all screens.
  - **Rationale:** Essential for production app quality. Modern gesture-based navigation meets user expectations and prevents app crashes. Proper navigation flow ensures smooth onboarding and user retention.

- **Modern UI Component System**
  - **Description:** Advanced UI components including gesture-based Slider component replacing 5-button arrays, responsive text handling with proper constraints, safe area support for all screen sizes, and modern interaction patterns. Text wrapping issues resolved across all buttons and headers.
  - **Rationale:** Professional UI appearance and smooth interactions are critical for user engagement. Modern sliders provide better user experience than button arrays. Responsive design ensures app works correctly on all device sizes.

- **Enhanced Recipe Generation Flow**
  - **Description:** Streamlined recipe creation with direct generation option in meal planner, intelligent "Suggest me something" system with 10 contextual recipe suggestions, and seamless integration between meal planning and recipe generation workflows.
  - **Rationale:** Reduces friction in core user workflow. Direct generation from meal planner eliminates navigation steps. Smart suggestions help users who lack inspiration, increasing engagement with recipe generation feature.

- **Advanced Preference Customization System**
  - **Description:** Comprehensive custom preference system allowing users to add unlimited custom options beyond presets: (1) Custom cuisines with inline input and validation, (2) Custom favorite and avoided ingredients with Alert.prompt interface, (3) Custom kitchen appliances with space/underscore normalization, (4) Custom dietary restrictions including allergies, intolerances, and health objectives. Enhanced AI prompts process all custom preferences with proper formatting (underscore to space conversion) and equal priority to standard options.
  - **Rationale:** Eliminates restriction to preset options, accommodating diverse user needs and cultural preferences. Custom cuisines support global food cultures beyond standard Western options. Custom appliances recognize modern kitchen tools and emerging cooking equipment. Custom dietary restrictions handle specific allergies, cultural dietary laws, and personal health goals. AI integration ensures custom preferences drive recipe personalization with same importance as preset options, dramatically improving relevance for users with unique needs.

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

## 🚀 **ENHANCEMENT PHASE** *(CURRENT FOCUS)*

**Goal:** Expand app capabilities with advanced features, system optimizations, and user customization options to drive engagement and prepare for scale.

### ✅ **COMPLETED: Post-Launch Critical Fixes** *(ALL COMPLETED JUNE 19, 2025)*

- ✅ **Navigation System Overhaul**: Fixed all navigation crashes, implemented gesture-based controls, proper back navigation, and modern app interaction patterns
- ✅ **UI Modernization**: Replaced 5-button arrays with gesture-based sliders, fixed text wrapping issues, implemented responsive design with safe area support
- ✅ **Recipe Generation Enhancement**: Added direct generation from meal planner, implemented intelligent "Suggest me something" system with contextual suggestions
- ✅ **User Experience Polish**: Comprehensive UX improvements based on user feedback, seamless navigation flow, modern interaction patterns

**Results Achieved:** App now provides professional, crash-free user experience with modern interaction patterns. All critical user friction points resolved. Ready for advanced feature development.

### ✅ **Priority 1: Advanced Preference Customization** *(COMPLETED JUNE 19, 2025)*
- **Problem:** Limited preset options for cuisines, ingredients, appliances, dietary styles restrict user personalization
- **Implemented Solution:** Complete custom preference system with dynamic input fields allowing unlimited custom options in all preference categories
- **Results Achieved:** (1) Custom cuisine input with inline text field and Add/Cancel buttons, (2) Custom ingredient management for both favorites and avoided items using Alert.prompt, (3) Custom appliance support with space/underscore normalization, (4) Custom dietary restrictions including allergies, intolerances, and health objectives, (5) Enhanced AI prompts processing custom preferences with equal priority to presets, (6) Proper formatting and display of custom options throughout the UI
- **Impact:** Dramatically improved personalization accommodating diverse cultural preferences, dietary needs, and kitchen setups. AI now provides truly personalized recommendations for users with unique requirements.

### **Priority 2: Cost Analysis & Financial Motivation** *(HIGH VALUE)*
- **Objective:** Add financial motivation through cost savings visualization and cost transparency
- **Key Features:**
  - Cost per serving estimation for generated recipes
  - Post-cooking savings feedback comparing restaurant vs home cooking costs
  - Geographic cost comparison using location-based pricing
  - Savings dashboard in user profile with cumulative tracking
- **Technical Approach:** AI-powered cost calculation, location services integration, savings persistence
- **Success Criteria:** Users can see tangible financial benefits, increased motivation to cook at home

### **Priority 3: Infrastructure & Performance Optimization** *(PRODUCTION CRITICAL)*
- **Centralized API Key Management:**
  - **Problem:** Manual Gemini API key management not scalable for production
  - **Solution:** Secure backend service storing API keys, rate limiting, usage monitoring
  - **Technical Approach:** Supabase functions or dedicated API service, environment-based key management
- **Intelligent AI Response Caching:**
  - **Problem:** Inefficient AI response caching leading to unnecessary API costs
  - **Solution:** Smart caching system that reuses similar recipe requests based on user preferences
  - **Technical Approach:** Recipe similarity scoring, preference-aware cache keys, intelligent cache invalidation
- **Success Criteria:** Reduced API costs while maintaining response quality and personalization, production-ready scalability

## 🎯 **Next Immediate Action (For Future Development)**

**Start with Priority 2: Cost Analysis & Financial Motivation**
- Implement cost per serving estimation for generated recipes
- Add post-cooking savings feedback comparing restaurant vs home cooking costs
- Create geographic cost comparison using location-based pricing
- Build savings dashboard in user profile with cumulative tracking
- Develop AI-powered cost calculation system

**Technical Focus:** Cost calculation algorithms, location services integration, savings persistence, dashboard UI components

**Following Priorities:**
- Priority 3: Infrastructure optimization (API key centralization, intelligent caching)
- Enhanced meal planning features and premium subscription improvements
- Advanced social features and community sharing

**Note for Future Developer:** Advanced Preference Customization completed with full custom option support. AI personalization now handles diverse user needs with custom cuisines, ingredients, appliances, and dietary restrictions. Focus should shift to financial motivation features that demonstrate tangible value to users.
