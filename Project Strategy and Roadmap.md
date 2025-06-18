# Sage AI Cooking Coach - Project Strategy & Roadmap

**Document Purpose:** This is the living strategic plan for the Sage application. It serves as the single source of truth for the project's status, architecture, and future plans. It is designed to provide complete context for any developer, including future AI assistants, joining the project.

**Last Updated:** June 18, 2025

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

**Current Status (as of June 18, 2025): Architectural Hardening Complete**

The core features of the app have been successfully refactored for stability and a professional-grade user experience. The most significant architectural risks—specifically the brittle AI string parsing and disruptive UI from the native Modal component—have been mitigated with robust, industry-standard solutions. The application now has a more resilient and scalable foundation, making it ready for the next phase of development: a foundational upgrade with standard libraries before new feature implementation.

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

- **Data Fetching: Custom React Hooks**

  - **Description:** Data fetching logic is encapsulated in custom hooks like `useRecipes.ts` and `useUserProfile.ts`. These hooks are responsible for communicating with `Supabase` services and managing loading/error states.
  - **Rationale:** This pattern provides a clean separation of concerns, abstracting data logic away from the UI components. While effective, this is a candidate for a future upgrade to a dedicated library like TanStack Query.

- **Navigation: React Navigation**
  - **Description:** The app uses a standard navigation pattern: a root `StackNavigator` in `AuthWrapper.tsx` determines the user's state (Auth, Onboarding, or Main App). The Main App consists of a `BottomTabNavigator` for primary sections and a parent `StackNavigator` for detail screens and modals.
  - **Rationale:** This is the de-facto standard for React Native navigation, offering a robust, performant, and highly customizable solution for complex navigation flows.

### **UI Components & User Experience**

- **Styling: Manual StyleSheet with Theme Object**

  - **Description:** A central `theme.ts` file exports color palettes, spacing units, and typography scales. These are manually imported and used in `StyleSheet.create()` within each component.
  - **Rationale:** This initial approach provides basic design consistency. However, its manual nature makes it a prime candidate for upgrading to a more automated and type-safe styling library like Restyle.

- **Core UX Problem-Solving:**
  - **Problem:** The initial implementation of the grocery list feature used a native `<Modal>`, which created a new rendering window on iOS. This prevented our toast notifications from appearing on top of the modal content.
  - **Solution 1 (Toast):** Replaced a custom toast implementation with the `react-native-toast-message` library. **Rationale:** The library correctly handles native rendering contexts and edge cases, ensuring notifications always appear on top of all other UI elements.
  - **Solution 2 (Modal):** Replaced the native `<Modal>` with a custom `Sheet.tsx` component built with `react-native-reanimated`. **Rationale:** This ensures our "modal" is just a standard view within the app's main rendering window, guaranteeing that other overlay components (like toasts) will work as expected. This also gives us a reusable, theme-able sheet component for future features.

---

## 🗺️ Strategic Roadmap (The "To-Be")

_This section outlines the planned next phases of development, prioritized by value delivery._

### **PHASE 2.5: Foundational Architecture Upgrade**

**Goal:** Proactively replace custom, manual solutions with industry-standard libraries. This investment will dramatically accelerate future feature development, improve performance, and increase the overall quality and maintainability of the codebase.

- 🎯 **Priority 1: Adopt a Theming & Styling System**

  - **Problem:** Our current styling is manual and not type-safe. Adding a dark/light theme would require extensive conditional logic in every component.
  - **Proposed Solution:** Integrate **Shopify's Restyle library**. This involves creating a `ThemeProvider` at the root of the app and replacing primitive components like `<View>` and `<Text>` with theme-aware Restyle components (`<Box>`, `<Text>`).
  - **Justification:** This will enforce design consistency, provide compile-time type safety for all theme properties (e.g., `backgroundColor="surface"`), and make implementing a dark mode a simple theme-switching operation rather than a major refactor.

- 🎯 **Priority 2: Overhaul Data Fetching & Server State**

  - **Problem:** Our custom data-fetching hooks manually manage loading, error, and data states. This logic is repetitive and lacks advanced features like caching or background refetching.
  - **Proposed Solution:** Integrate **TanStack Query (React Query)**. We will refactor `useRecipes` and `useUserProfile` to use the `useQuery` hook for data fetching and `useMutation` for creating, updating, or deleting data.
  - **Justification:** TanStack Query eliminates boilerplate code and provides powerful, out-of-the-box features like caching, request deduplication, background data refresh, and optimistic updates. This will make the app feel faster and more responsive while simplifying our codebase.

- 🎯 **Priority 3: Modernize Form Handling**
  - **Problem:** Our auth forms use basic `useState` for each field, with manual validation logic. This pattern is not scalable for more complex forms (e.g., user profile editing, recipe feedback).
  - **Proposed Solution:** Integrate **React Hook Form**. We will refactor `LoginScreen.tsx` and `SignUpScreen.tsx` to use the `useForm` hook, separating form state and validation logic from the component rendering.
  - **Justification:** This improves form performance (fewer re-renders), simplifies complex validation logic (especially when paired with a schema library like Zod), and provides a clean, scalable pattern for all future forms.

### **PHASE 3: Drive Retention & Deeper Engagement**

**Goal:** With a rock-solid foundation, we can now build features that make the app sticky and encourage daily use.

- 🎯 **Priority 1: Search & Filtering in Recipe Book**
- 🎯 **Priority 2: User Profile & Progress Tracking (Achievements)**
- 🎯 **Priority 3: Recipe Ratings & Feedback Loop**

### **PHASE 4: Monetize & Scale**

**Goal:** With a valuable and engaging product, introduce a sustainable business model.

- 🎯 **Action: Implement Meal Planning (The First Premium Feature)**
- 🎯 **Action: Integrate Production Services (RevenueCat, Sentry, Mixpanel)**
- 🎯 **Action: Launch & Learn**

---

## ❓ Open Questions for Next Session

1.  **Next Step Confirmation:** Are we aligned and ready to begin **Phase 2.5** by integrating the **Restyle** library? The proposed first step is to install the library, create the `ThemeProvider`, and refactor the `LoginScreen` as the initial proof-of-concept.
2.  **Implementation Strategy:** When refactoring to Restyle, should we create component `variants` in the theme immediately for elements like buttons? (Recommendation: Yes. Creating variants for common components like buttons and cards is a core strength of Restyle and will immediately demonstrate its power and reusability.)
3.  **Long-Term Vision:** Does this detailed plan feel complete and provide sufficient context to guide development for the foreseeable future?
