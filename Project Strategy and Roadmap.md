# Sage AI Cooking Coach - Project Strategy & Roadmap

**Document Purpose:** This is the living strategic plan for the Sage application. It serves as the single source of truth for the project's status, architecture, and future plans. It is designed to provide complete context for any developer, including future AI assistants, joining the project.

**Last Updated:** June 14, 2025 (End of Day)

---

## 📝 Instructions for Future Updates

_This section is a meta-guide on how to maintain this document._

**When to Update:** This document should be updated after any significant architectural change, phase completion, or strategic pivot.

**How to Update:**

1.  **Move Completed Items:** When a "Next Step" or "Priority" item is finished, move it from the "Roadmap" section to the "Current State & Architecture" section.
2.  **Update the Status:** Modify the "Project Status" section to reflect the new reality of the project (e.g., from "Architectural Refactor" to "Core Feature Development").
3.  **Refine the Roadmap:** Based on the work just completed, review and refine the next steps in the "Strategic Roadmap" section. Add, remove, or re-prioritize items as needed.
4.  **Update the Timestamp:** Always change the "Last Updated" date at the top of the file.

---

## 🚀 Project Status & Vision

**Vision:** To transform "kitchen anxious" beginners into confident home cooks through a delightful, AI-powered companion that adapts to their skill level, available tools, and preferences.

**Current Status (as of June 14, 2025): Phase 2 Complete - Core Value Proposition Built**

The project has successfully built and polished its core user experience. The application now functions as a personalized digital cookbook with a "sticky" and magical core loop. The foundation is robust, and the app is ready for features that will drive long-term retention and engagement.

---

## 🏛️ Current State & Architecture (The "As-Is")

_This section details what has been built and the technical decisions made. It is a log of our completed progress._

### **Core App Structure (Completed)**

- **Navigation:** A scalable Stack -> Tab navigation structure is in place using React Navigation.
- **Home Screen:** The `RecipeBookScreen` serves as the app's home base, displaying a user's saved recipes in a visual grid.
- **Recipe Management:** Users can view recipe details, start a cooking session, and generate grocery lists.
- **Recipe Generation:** The `RecipeGenerationScreen` functions as a modal, feeding new recipes into the user's cookbook.

### **Key Features (Completed)**

- **The "My Recipes" Hub:** The `RecipeBookScreen`, `RecipeDetailScreen`, and `RecipeCard` components create a persistent, personalized cookbook experience.
- **AI-Powered Grocery Lists:** `GeminiService` can generate a markdown-formatted grocery list from any recipe, which can be copied to the clipboard. This is the app's first "magic" feature.
- **Polished Core Loop:**
  - **Toggle Favorites:** Users can favorite/unfavorite recipes with instant UI feedback and a backend save.
  - **Auto-Refreshing Data:** The `RecipeBookScreen` uses a focus listener to automatically fetch the latest data, ensuring `cook_count` and `is_favorite` status are always current.
  - **Intelligent AI Parsing:** The app now parses AI-generated recipes to extract and store structured data like `difficulty_level` and `estimated_time`, which are displayed in the UI.

### **Backend & Data Layer (Completed)**

- **Database:** Supabase PostgreSQL is the primary database.
- **Schema:** Tables for `user_profiles`, `user_recipes`, and `cooking_sessions` are implemented. The `user_recipes` table now includes `difficulty_level` and `estimated_time`.
- **Authentication:** Supabase Auth is fully integrated.

### **Frontend Architecture & Logic (Completed)**

- **State Management:** `zustand` (`authStore.ts`) manages global user state.
- **Data Fetching:** Custom hooks (`useUserProfile.ts`, `useRecipes.ts`) handle all data interactions and include optimistic updates and refetching logic.

---

## 🗺️ Strategic Roadmap (The "To-Be")

_This section outlines the planned next phases of development, prioritized by value delivery._

### **PHASE 3: Drive Retention & Deeper Engagement**

**Goal:** Give users reasons to come back every day and feel a sense of progress.

- 🎯 **Priority 1: Search & Filtering**

  - **Action:** Add a search bar to the `RecipeBookScreen`.
  - **Action:** Enhance the `useRecipes` hook and `RecipeService` to support full-text search on `recipe_name` and `recipe_content` in Supabase.
  - **Action:** Add UI for filtering recipes by `difficulty_level` and `is_favorite`.
  - **Why:** As the user's recipe book grows, discoverability becomes critical for the app to remain useful.

- 🎯 **Priority 2: User Profile & Progress Tracking**

  - **Action:** Create a `ProfileScreen.tsx` accessible from the tab bar (replacing the current `SettingsScreen` tab, which can be moved into the profile screen).
  - **Action:** Display user stats from their profile (skill level, etc.) and aggregated data (recipes cooked, sessions completed).
  - **Action:** Introduce simple badges or achievements based on their activity (e.g., "First Recipe Cooked," "Weekend Chef," "5 Meals Logged").
  - **Why:** Creates a sense of accomplishment and a feedback loop that encourages continued use.

- 🎯 **Priority 3: Recipe Ratings & Feedback**
  - **Action:** After a `CookingCoachScreen` session, present a simple modal asking the user to rate the recipe (1-5 stars).
  - **Action:** Store this `user_rating` in the `user_recipes` table.
  - **Action:** Display the user's own rating on the `RecipeDetailScreen`.
  - **Why:** This closes the feedback loop on a recipe and provides valuable data for future features (e.g., "Your Highest Rated Recipes").

### **PHASE 4: Monetize & Scale**

**Goal:** With a valuable and engaging product, introduce a business model.

- 🎯 **Action: Implement Meal Planning (The First Premium Feature)**
- 🎯 **Action: Integrate Production Services (RevenueCat, Sentry, Mixpanel)**
- 🎯 **Action: Launch & Learn**

---

## ❓ Open Questions for Next Session

1.  **Search Implementation:** For the search feature, should we start with a simple client-side filter on the already-fetched recipes, or build the more robust server-side full-text search in Supabase from the start? (Recommendation: Build the server-side search. It's more scalable and a good opportunity to learn Supabase's capabilities).
2.  **Profile vs. Settings:** Does merging "Settings" into a new, more comprehensive "Profile" tab make sense? (Recommendation: Yes, it cleans up the tab bar and centralizes all user-centric actions).
3.  **Next Step:** Are we ready to begin building the search bar UI on `RecipeBookScreen` and the corresponding backend logic in `useRecipes`?
