### **REVISED & STRATEGIC PROJECT PLAN**

# Sage AI Cooking Coach - Development Plan

**Last Updated:** June 13, 2025

## 🚀 Guiding Principle

Our sole focus is to **build a product people would pay for _before_ we ask them to pay**. Every step in this plan is measured against a single question: "Does this make the core experience more valuable, useful, or delightful for a new user?"

**Current Status:** The foundational plumbing is complete. We have a stable, working application skeleton. It is now time to add the heart and soul.

---

## 🏗️ PHASE 2: Build the Core Value Proposition (The "Wow" Factor)

**Goal:** Create a "sticky" and magical core loop that makes a user say, "Wow, this is genuinely useful." This phase is about making the app feel like a cohesive, valuable tool, not just a set of disconnected screens.

### Priority 1: The "My Recipes" Hub (Weeks 1-2)

The user needs a home base for their culinary journey. A place to see what they've created.

- 🎯 **Action: Create `RecipeBookScreen.tsx`**
  - This will be a new screen, likely becoming the primary tab of the app.
  - It will use our existing `useRecipes` hook to display a beautiful, scrollable grid or list of all recipes the user has saved.
- 🎯 **Action: Create `RecipeCard.tsx` Component**
  - Design a reusable component to display a recipe's name, an image (we can use AI to generate this later), and key stats like difficulty or cook count.
- 🎯 **Action: Create `RecipeDetailScreen.tsx`**
  - When a user taps a `RecipeCard`, this screen opens, showing the full recipe content.
  - It should have two primary buttons: "Start Cooking" and "Generate Grocery List".
- 🎯 **Action: Implement Search & Filter**
  - Add a search bar to the `RecipeBookScreen`.
  - Enhance the `useRecipes` hook to include a `searchRecipes(query)` function that filters the results.
- **Why:** This transforms the app from an "AI generator" into a "Personalized Digital Cookbook." It builds a sense of ownership and utility.

### Priority 2: The First "Magic" Feature: Grocery List (Week 3)

This is our key differentiator. We go beyond just the recipe and solve the next immediate problem for the user: "What do I need to buy?"

- 🎯 **Action: Enhance `GeminiService`**
  - Create a new method: `generateGroceryList(recipeContent: string): Promise<string>`.
  - Engineer a new prompt that instructs the AI to read recipe ingredients and output a simple, clean, Markdown-formatted grocery list, ideally grouped by common store aisles (e.g., Produce, Dairy, Pantry).
- 🎯 **Action: Implement the UI**
  - On the `RecipeDetailScreen`, the "Generate Grocery List" button will call this new service method.
  - The result will be displayed in a simple modal or a new screen.
  - Add a "Copy to Clipboard" button for maximum utility.
- **Why:** This provides immense, tangible value and solves a major point of friction in the cooking process. It's a feature worth telling a friend about.

### Priority 3: Polish the Core Loop (Week 4)

Make the journey from idea to finished meal feel seamless and delightful.

- 🎯 **Action: Refine `RecipeGenerationScreen`**
  - After generating a recipe, instead of just showing the text, present it as a "draft" with two clear options: "Save to My Cookbook" or "Discard".
  - Clicking "Save" now navigates the user _directly_ to the new `RecipeDetailScreen` for that recipe, creating a smooth, logical flow.
- 🎯 **Action: Improve `CookingCoachScreen`**
  - Add small, delightful micro-interactions. When a user completes a step, maybe the progress bar animates smoothly. Use haptics more intentionally.
  - When a session is complete, navigate the user back to their `RecipeBookScreen`, which now shows the updated "Cook Count" on the `RecipeCard`.
- **Why:** Great products are defined by their attention to detail. This polish makes the app feel less like a tool and more like a companion.

---

## ✨ PHASE 3: Drive Retention & Deeper Engagement

**Goal:** Now that the app is valuable, we need to give users reasons to come back every day and to feel a sense of progress.

- 🎯 **Action: Build Progress Tracking & Gamification**
  - Create a new `ProfileScreen` or a dashboard.
  - Use the data from `cooking_sessions` and `user_recipes` to show users stats like: "You've cooked 5 times this month!", "Your average success rating is 4/5 stars."
  - Introduce simple badges or achievements: "First Recipe Cooked," "Weekend Chef," etc.
- 🎯 **Action: Implement Meal Planning (The First Premium Feature)**
  - Design the database tables (`meal_plans`, `meal_plan_recipes`).
  - Build a simple weekly calendar UI where users can drag-and-drop recipes from their cookbook.
  - This feature will be built but "locked" behind a premium flag.
- 🎯 **Action: Implement Recipe Ratings & Feedback**
  - After a cooking session, allow users to give a star rating (1-5) and optional text feedback.
  - Store this in the `user_recipes` table.
  - **Future Goal:** This data can be used to improve future AI recommendations.

---

## 💰 PHASE 4: Monetize & Scale

**Goal:** With a valuable and engaging product, we now have something worth paying for. We can confidently introduce a business model.

- 🎯 **Action: Implement Monetization & Production Services**
  - **NOW** is the time to integrate **RevenueCat** and build the paywall. The "locked" meal planning feature is the perfect initial offering.
  - **NOW** is the time to integrate **Sentry** for crash reporting and **Mixpanel** for analytics. We have a stable product with defined user flows that are worth tracking.
- 🎯 **Action: Launch & Learn**
  - Launch the app with a strong free tier (everything from Phase 2) and a compelling premium tier (Phase 3 features).
  - Use Mixpanel data to understand where users are succeeding and where they drop off.
  - Use Sentry data to ensure the app is stable for all users.
  - Talk to users and iterate.

---

## ❓ REVISED QUESTIONS FOR OUR NEXT SESSION

1.  **Core Value:** Do you agree that the "My Recipes" hub and "Grocery List" generation are the right features to build first to create that "wow" factor?
2.  **Recipe Book Design:** For the `RecipeBookScreen`, should we start with a simple list or a more visual grid layout for the `RecipeCard`s?
3.  **Grocery List MVP:** For the first version, is a simple Markdown checklist (which is easy for the AI to generate) sufficient, or should we aim for a more complex, structured object? (Recommendation: Start with simple text. It's faster and provides 90% of the value).
4.  **Next Step:** Are you ready to start building `RecipeBookScreen.tsx`?
