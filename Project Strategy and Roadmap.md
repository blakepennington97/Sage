# Sage AI Cooking Coach - Project Strategy & Roadmap

**Document Purpose:** This is the living strategic plan for the Sage application. It serves as the single source of truth for the project's status, architecture, and future plans. It is designed to provide complete context for any developer, including future AI assistants, joining the project.

**Last Updated:** June 13, 2025

---

## 📝 Instructions for Future Updates

*This section is a meta-guide on how to maintain this document.*

**When to Update:** This document should be updated after any significant architectural change, phase completion, or strategic pivot.

**How to Update:**
1.  **Move Completed Items:** When a "Next Step" or "Priority" item is finished, move it from the "Roadmap" section to the "Current State & Architecture" section.
2.  **Update the Status:** Modify the "Project Status" section to reflect the new reality of the project (e.g., from "Architectural Refactor" to "Core Feature Development").
3.  **Refine the Roadmap:** Based on the work just completed, review and refine the next steps in the "Strategic Roadmap" section. Add, remove, or re-prioritize items as needed.
4.  **Update the Timestamp:** Always change the "Last Updated" date at the top of the file.

---

## 🚀 Project Status & Vision

**Vision:** To transform "kitchen anxious" beginners into confident home cooks through a delightful, AI-powered companion that adapts to their skill level, available tools, and preferences.

**Current Status (as of June 13, 2025): Foundational Scaffolding Complete**

The project has successfully transitioned from a brittle prototype to a **stable, well-architected application skeleton**. The foundational plumbing—including a stable environment, a cloud-synced database via Supabase, and a modern frontend architecture—is in place.

The core user authentication and onboarding flow is functional. The application is now ready for the development of its core, value-providing features.

---

## 🏛️ Current State & Architecture (The "As-Is")

*This section details what has been built and the technical decisions made. It is a log of our completed progress.*

### **Environment & Stability (Completed)**
- **Dependencies:** `package.json` is stable and locked to Expo SDK 53, using `react@18.2.0` and `react-native@0.74.3`. All dependency conflicts have been resolved.
- **Build System:** Metro bundler is stable. The configuration in `metro.config.js` uses the Expo default, resolving all previous build errors.
- **Secrets Management:** API keys and environment-specific variables are correctly loaded from a `.env` file, which is listed in `.gitignore`.

### **Backend & Data Layer (Completed)**
- **Database:** Supabase PostgreSQL is the primary database.
- **Schema:** Tables for `user_profiles`, `user_recipes`, and `cooking_sessions` are implemented with appropriate data types, foreign keys, and default values (e.g., empty arrays `{}` for text arrays).
- **Security:** Row Level Security (RLS) is enabled and configured for all user-specific tables, ensuring users can only access their own data.
- **Authentication:** Supabase Auth is fully integrated.
- **Automated Profile Creation:** A SQL trigger (`handle_new_user`) automatically creates a stub `user_profiles` row upon successful user signup.

### **Frontend Architecture & Logic (Completed)**
- **State Management:** A global `zustand` store (`authStore.ts`) manages the user's session (`user`) and `profile` data, making it available throughout the app.
- **Data Fetching:** A modern hook-based pattern is used for all data interactions.
    - `useUserProfile.ts`: Handles fetching and updating user profile data.
    - `useRecipes.ts`: Handles fetching, generating, and saving recipes.
- **Architectural Principle:** The codebase follows a "Cloud-First" model. Supabase is the single source of truth. There is no complex local/cloud sync logic.
- **Core Flow:** The end-to-end flow is functional:
    1.  User Signs Up/Logs In (`LoginScreen`, `SignUpScreen`).
    2.  `AuthWrapper` directs them to the correct screen.
    3.  User completes multi-step onboarding (`SkillEvaluationScreen`, `KitchenAssessmentScreen`), with progress saved to Supabase via `useUserProfile`.
    4.  User can generate and save an AI recipe (`RecipeGenerationScreen`, `useRecipes`).
    5.  User can follow recipe steps and complete a tracked cooking session (`CookingCoachScreen`, `SessionService`).

---

## 🗺️ Strategic Roadmap (The "To-Be")

*This section outlines the planned next phases of development, prioritized by value delivery.*

### **PHASE 2: Build the Core Value Proposition (The "Wow" Factor)**
**Goal:** Create a "sticky" and magical core loop that makes a user say, "This is genuinely useful."

- 🎯 **Priority 1: The "My Recipes" Hub**
    - **Action:** Create `RecipeBookScreen.tsx` as the app's home base, displaying a list/grid of all saved recipes using `useRecipes`.
    - **Action:** Create a reusable `RecipeCard.tsx` component for this screen.
    - **Action:** Create `RecipeDetailScreen.tsx` to show a recipe's full content when a card is tapped. This screen will have "Start Cooking" and "Generate Grocery List" buttons.
    - **Action:** Add search/filter functionality to the `RecipeBookScreen` and `useRecipes` hook.
    - **Why:** Transforms the app from an "AI generator" into a "Personalized Digital Cookbook," creating a sense of ownership.

- 🎯 **Priority 2: The First "Magic" Feature: Grocery List**
    - **Action:** Enhance `GeminiService` with a `generateGroceryList(recipeContent)` method and a new prompt to output a Markdown-formatted grocery list, grouped by aisle.
    - **Action:** On `RecipeDetailScreen`, add a button to call this method and display the result in a modal, with a "Copy to Clipboard" feature.
    - **Why:** Provides immense, tangible value and solves a major point of friction in the cooking process.

- 🎯 **Priority 3: Polish the Core Loop**
    - **Action:** Refine the flow from `RecipeGenerationScreen` -> Save -> Navigate to `RecipeDetailScreen`.
    - **Action:** Add polish and micro-interactions to the `CookingCoachScreen`. On completion, navigate the user back to the `RecipeBookScreen` and show the updated cook count on the recipe card.
    - **Why:** Attention to detail makes the app feel less like a tool and more like a companion.

### **PHASE 3: Drive Retention & Deeper Engagement**
**Goal:** Give users reasons to come back every day and feel a sense of progress.

- 🎯 **Action: Build Progress Tracking & Gamification**
    - Create a new `ProfileScreen` or dashboard to display user stats (`cooking_sessions` count, average ratings, etc.).
    - Introduce simple badges or achievements ("First Recipe Cooked," "Weekend Chef").
- 🎯 **Action: Implement Meal Planning (The First Premium Feature)**
    - Design and build the UI and database tables for weekly meal planning.
    - This feature will be built but **"locked"** behind a premium flag.
- 🎯 **Action: Implement Recipe Ratings & Feedback**
    - Allow users to give a star rating (1-5) and text feedback after a cooking session. Store this in the database.

### **PHASE 4: Monetize & Scale**
**Goal:** With a valuable and engaging product, introduce a business model.

- 🎯 **Action: Implement Monetization & Production Services**
    - Integrate **RevenueCat** to build the paywall and manage subscriptions. The "locked" meal planning feature is the first premium offering.
    - Integrate **Sentry** for crash reporting and **Mixpanel** for analytics to monitor the app in production.
- 🎯 **Action: Launch & Learn**
    - Launch to the app store. Use analytics data to understand user behavior and make data-driven improvements.

---

## ❓ Open Questions for Next Session

1.  **Core Value:** Do we agree that the "My Recipes" hub and "Grocery List" generation are the right features for Phase 2 to create the initial "wow" factor?
2.  **Recipe Book Design:** For the `RecipeBookScreen`, should the MVP be a simple list or a more visual grid layout for the `RecipeCard`s?
3.  **Grocery List MVP:** Is a simple Markdown checklist sufficient for the first version of the grocery list feature? (Recommendation: Yes, it's fast to implement and provides 90% of the value).
4.  **Next Step:** Are we ready to begin scaffolding `RecipeBookScreen.tsx`?