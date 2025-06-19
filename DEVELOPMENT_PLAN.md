# Sage AI Cooking Coach - Project Strategy & Roadmap

**Document Purpose:** This is the living strategic plan for the Sage application. It serves as the single source of truth for the project's status, architecture, and future plans. It is designed to provide complete context for any developer, including future AI assistants, joining the project.

**Last Updated:** June 19, 2025

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

**Current Status (as of June 19, 2025): Foundational Architecture Complete**

All Phase 2.5 priorities have been successfully completed! The application now has a complete modern architecture foundation with: (1) type-safe Restyle theming system, (2) optimized data fetching with TanStack Query, and (3) modern form handling with React Hook Form. The auth screens (LoginScreen and SignUpScreen) now use declarative validation with proper error handling and improved performance. Ready to proceed with Phase 3 feature development.

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

### **UI Components & User Experience**

- **Component System: Restyle-Based Design System**

  - **Description:** The app uses a comprehensive Restyle-based component system with reusable components (`Box`, `Text`, `Button`, `Input`, `Card`) that automatically apply theme values. Component variants (e.g., `Button` with `primary`, `secondary`, `danger` variants) ensure consistency while providing flexibility.
  - **Rationale:** This approach eliminates manual styling repetition, provides compile-time safety, and creates a scalable foundation for rapid UI development. The system supports semantic naming (e.g., `backgroundColor="surface"`) that makes code more readable and maintainable.

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

### **PHASE 3: Drive Retention & Deeper Engagement**

**Goal:** With a rock-solid foundation, we can now build features that make the app sticky and encourage daily use.

- ✅ **Priority 1: Search & Filtering in Recipe Book** *(COMPLETED)*
  - **Problem:** Users had no way to quickly find specific recipes as their collection grew, leading to poor discoverability and reduced engagement with saved recipes.
  - **Implemented Solution:** Added comprehensive search and filtering system to RecipeBookScreen with: (1) text search by recipe name, (2) difficulty level filtering (1-5 stars), (3) favorites-only toggle, and (4) modernized UI with Restyle components. Search is real-time with useMemo optimization.
  - **Results Achieved:** Users can now instantly find recipes by name, filter by cooking difficulty, or view only favorites. Enhanced empty state messaging for better UX. Completely modernized RecipeBookScreen and RecipeCard components to use Restyle theming, eliminating legacy StyleSheet code.

- 🎯 **Priority 2: User Profile & Progress Tracking (Achievements)**
- 🎯 **Priority 3: Recipe Ratings & Feedback Loop**

### **PHASE 4: Monetize & Scale**

**Goal:** With a valuable and engaging product, introduce a sustainable business model.

- 🎯 **Action: Implement Meal Planning (The First Premium Feature)**
- 🎯 **Action: Integrate Production Services (RevenueCat, Sentry, Mixpanel)**
- 🎯 **Action: Launch & Learn**

---

## ❓ Open Questions for Next Session

1.  **Phase 3 Prioritization:** With the foundational architecture complete, which Phase 3 feature should we tackle first? Options include: Search & Filtering in Recipe Book, User Profile & Progress Tracking, or Recipe Ratings & Feedback Loop.
2.  **Implementation Approach:** Should we focus on one feature at a time for maximum impact, or work on multiple features in parallel to create a more comprehensive user experience?
3.  **Technical Debt:** Are there any remaining pre-existing linting issues or architectural concerns we should address before diving into new feature development?
