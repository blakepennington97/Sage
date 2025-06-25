import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useRecipes } from "../hooks/useRecipes";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useUsageTracking } from "../hooks/useUsageTracking";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useAuthStore } from "../stores/authStore";
import { useMealPlanByWeek } from "../hooks/useMealPlans";
import { UsageIndicator, LimitReachedModal } from "../components/UsageDisplay";
import { isFeatureEnabled } from "../config/features";
import { colors, spacing, borderRadius, typography } from "../constants/theme";
import { HapticService } from "../services/haptics";
import { UserRecipe } from "../services/supabase";
import { formatDateForMealPlan, getWeekStartDate } from "../types/mealPlan";

export const RecipeGenerationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isOffline } = useNetworkStatus();
  const { preferences } = useUserPreferences();
  const { profile } = useAuthStore();
  
  // Check if coming from meal planner
  const fromMealPlanner = route.params?.fromMealPlanner;
  const mealPlanContext = route.params?.mealPlanContext;
  const [recipeRequest, setRecipeRequest] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [useMacroContext, setUseMacroContext] = useState(true); // Default to enabled
  const { canPerformAction, incrementUsage, isPremium } = useUsageTracking();

  const { recipes, isLoading, error, generateAndSaveRecipe } = useRecipes();

  // Get meal plan data if coming from meal planner
  const targetDate = mealPlanContext?.date;
  const weekStartDate = targetDate ? getWeekStartDate(new Date(targetDate)) : '';
  const { data: mealPlan } = useMealPlanByWeek(
    fromMealPlanner && weekStartDate ? weekStartDate : ''
  );

  // Calculate remaining macros for context-aware generation
  const remainingMacros = useMemo(() => {
    if (!fromMealPlanner || !mealPlanContext || !mealPlan || !profile?.macro_goals_set) {
      return undefined;
    }

    const dayPlan = mealPlan.days.find(day => day.date === targetDate);
    if (!dayPlan) return undefined;

    let totalMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const addRecipeMacros = (recipe: any) => {
      if (recipe?.recipe_data) {
        const recipeData = typeof recipe.recipe_data === 'string' 
          ? JSON.parse(recipe.recipe_data) 
          : recipe.recipe_data;
        
        const servings = recipe.servingsForMeal || 1; // Use servingsForMeal for accurate macro calculation
        totalMacros.calories += (recipeData.caloriesPerServing || 0) * servings;
        totalMacros.protein += (recipeData.proteinPerServing || 0) * servings;
        totalMacros.carbs += (recipeData.carbsPerServing || 0) * servings;
        totalMacros.fat += (recipeData.fatPerServing || 0) * servings;
      }
    };

    // Add existing meals for the day (excluding the target meal type)
    if (dayPlan.breakfast && mealPlanContext.mealType !== 'breakfast') {
      addRecipeMacros(dayPlan.breakfast);
    }
    if (dayPlan.lunch && mealPlanContext.mealType !== 'lunch') {
      addRecipeMacros(dayPlan.lunch);
    }
    if (dayPlan.dinner && mealPlanContext.mealType !== 'dinner') {
      addRecipeMacros(dayPlan.dinner);
    }
    if (dayPlan.snacks && mealPlanContext.mealType !== 'snacks') {
      dayPlan.snacks.forEach(addRecipeMacros);
    }

    // Calculate remaining macros
    const goals = {
      calories: profile.daily_calorie_goal || 2000,
      protein: profile.daily_protein_goal || 100,
      carbs: profile.daily_carbs_goal || 200,
      fat: profile.daily_fat_goal || 70,
    };

    return {
      calories: Math.max(0, goals.calories - totalMacros.calories),
      protein: Math.max(0, goals.protein - totalMacros.protein),
      carbs: Math.max(0, goals.carbs - totalMacros.carbs),
      fat: Math.max(0, goals.fat - totalMacros.fat),
    };
  }, [fromMealPlanner, mealPlanContext, mealPlan, profile, targetDate]);

  const handleGenerateRecipe = async () => {
    if (!recipeRequest.trim()) {
      HapticService.warning();
      Alert.alert("Enter Request", "Please describe what you'd like to cook.");
      return;
    }
    if (isOffline) {
      HapticService.error();
      Alert.alert(
        "No Internet Connection",
        "Recipe generation requires an internet connection."
      );
      return;
    }
    
    // Check usage limits (only if feature is enabled)
    if (isFeatureEnabled('usageTracking')) {
      if (!canPerformAction('recipe_generation')) {
        HapticService.warning();
        setShowLimitModal(true);
        return;
      }
      
      // Increment usage counter before generation
      const canProceed = await incrementUsage('recipe_generation');
      if (!canProceed) {
        HapticService.warning();
        setShowLimitModal(true);
        return;
      }
    }
    
    HapticService.medium();
    
    // Pass macro context if enabled by user
    const context = useMacroContext && profile?.macro_goals_set ? { 
      remainingMacros: remainingMacros || {
        calories: profile.daily_calorie_goal || 2000,
        protein: profile.daily_protein_goal || 150,
        carbs: profile.daily_carbs_goal || 200,
        fat: profile.daily_fat_goal || 65
      }
    } : undefined;
    const newRecipe = await generateAndSaveRecipe(recipeRequest, context);
    if (newRecipe) {
      HapticService.success();
      setRecipeRequest("");
      // Navigate to the new detail screen, passing meal planner context if present
      navigation.navigate("RecipeDetail", { 
        recipe: newRecipe,
        fromMealPlanner,
        mealPlanContext 
      });
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>👨‍🍳 Generate Recipe</Text>
        {!isPremium && isFeatureEnabled('usageTracking') && (
          <UsageIndicator actionType="recipe_generation" showLabel={false} size="small" />
        )}
      </View>
    </View>
  );

  // Dynamic suggestion logic using useMemo for performance optimization
  const dynamicSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    if (!profile) return ["A simple 15-minute meal"]; // Fallback

    // Logic based on skill level
    if (profile.skill_level === 'complete_beginner') {
      suggestions.add("An easy one-pot meal");
      suggestions.add("Simple 10-minute dish");
    } else if (profile.skill_level === 'confident') {
      suggestions.add("Impressive dinner technique");
      suggestions.add("Complex flavor combination");
    } else {
      suggestions.add("A healthy weeknight dinner");
    }

    // Logic based on preferences
    if (preferences?.setupCompleted) {
      const { dietary, cookingContext, cookingStyles } = preferences;
      
      // Add cuisine-based suggestions
      const favCuisine = cookingStyles.preferredCuisines?.[0];
      if (favCuisine) {
        suggestions.add(`A tasty ${favCuisine.replace(/_/g, ' ')} dish`);
      }
      
      // Add time-based suggestions
      if (cookingContext.typicalCookingTime === 'quick_15min') {
        suggestions.add("Quick 15-minute meal");
      } else if (cookingContext.typicalCookingTime === 'project_90min_plus') {
        suggestions.add("Weekend cooking project");
      }
      
      // Add dietary style suggestions
      if (dietary.dietaryStyle !== 'omnivore') {
        suggestions.add(`${dietary.dietaryStyle} comfort food`);
      }
    }

    // Logic based on recipe history
    if (recipes.length > 0) {
      const recentRecipes = recipes.slice(0, 5);
      const hasCookedFish = recentRecipes.some(r => 
        r.recipe_name.toLowerCase().includes('fish') || 
        r.recipe_name.toLowerCase().includes('salmon')
      );
      if (!hasCookedFish) {
        suggestions.add("A simple fish recipe");
      }
      
      const hasCookedVegetarian = recentRecipes.some(r => 
        r.recipe_name.toLowerCase().includes('vegetarian') || 
        r.recipe_name.toLowerCase().includes('veggie')
      );
      if (!hasCookedVegetarian) {
        suggestions.add("Fresh vegetarian option");
      }
    }

    // Ensure a default if no specific rules match
    suggestions.add("A healthy weeknight dinner");

    return Array.from(suggestions).slice(0, 3);
  }, [profile, recipes, preferences]);

  const renderRecipeInput = () => {

    // Enhanced "Surprise Me" functionality with direct prompt construction
    const handleSurpriseMe = () => {
      let surprisePrompt = "Surprise me with a delicious recipe that fits my profile.";
      
      // Add context from profile and preferences
      if (preferences?.setupCompleted) {
        const { dietary, cookingStyles, cookingContext } = preferences;
        
        if (cookingStyles.preferredCuisines.length > 0) {
          const cuisine = cookingStyles.preferredCuisines[0].replace(/_/g, ' ');
          surprisePrompt = `Surprise me with a delicious ${cuisine} recipe that matches my taste preferences.`;
        }
        
        if (dietary.dietaryStyle !== 'omnivore') {
          surprisePrompt = `Surprise me with a satisfying ${dietary.dietaryStyle} recipe with amazing flavors.`;
        }
        
        if (cookingContext.typicalCookingTime === 'quick_15min') {
          surprisePrompt += " Keep it quick and simple, around 15 minutes or less.";
        }
      }
      
      // Directly call the generation function with the constructed prompt
      handleGenerateRecipeWithRequest(surprisePrompt);
    };

    // Modify handleGenerateRecipe to accept an optional request string
    const handleGenerateRecipeWithRequest = async (requestOverride?: string) => {
      const finalRequest = requestOverride || recipeRequest;
      if (!finalRequest.trim()) {
        HapticService.warning();
        Alert.alert("Enter Request", "Please describe what you'd like to cook.");
        return;
      }
      if (isOffline) {
        HapticService.error();
        Alert.alert(
          "No Internet Connection",
          "Recipe generation requires an internet connection."
        );
        return;
      }
      
      // Check usage limits (only if feature is enabled)
      if (isFeatureEnabled('usageTracking')) {
        if (!canPerformAction('recipe_generation')) {
          HapticService.warning();
          setShowLimitModal(true);
          return;
        }
        
        // Increment usage counter before generation
        const canProceed = await incrementUsage('recipe_generation');
        if (!canProceed) {
          HapticService.warning();
          setShowLimitModal(true);
          return;
        }
      }
      
      HapticService.medium();
      
      // Pass macro context if enabled by user
      const context = useMacroContext && profile?.macro_goals_set ? { 
        remainingMacros: remainingMacros || {
          calories: profile.daily_calorie_goal || 2000,
          protein: profile.daily_protein_goal || 150,
          carbs: profile.daily_carbs_goal || 200,
          fat: profile.daily_fat_goal || 65
        }
      } : undefined;
      const newRecipe = await generateAndSaveRecipe(finalRequest, context);
      if (newRecipe) {
        HapticService.success();
        setRecipeRequest("");
        // Navigate to the new detail screen, passing meal planner context if present
        navigation.navigate("RecipeDetail", { 
          recipe: newRecipe,
          fromMealPlanner,
          mealPlanContext 
        });
      }
    };
    return (
      <View style={styles.inputSection}>
        {/* Context-Aware Generation Toggle */}
        {profile?.macro_goals_set && (
          <View style={styles.macroToggleSection}>
            <View style={styles.macroToggleContent}>
              <View style={styles.macroToggleText}>
                <Text style={styles.macroToggleTitle}>Consider My Daily Macros</Text>
                <Text style={styles.macroToggleSubtitle}>
                  {remainingMacros 
                    ? "Suggest a recipe that fits your remaining nutrition goals for today."
                    : "Consider your daily nutrition goals when generating recipes."
                  }
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={'#f4f3f4'}
                onValueChange={() => setUseMacroContext(previousState => !previousState)}
                value={useMacroContext}
              />
            </View>
          </View>
        )}

        <TextInput
          style={styles.textInput}
          value={recipeRequest}
          onChangeText={setRecipeRequest}
          placeholder="e.g., 'A simple chicken dish with rice for a beginner...'"
          multiline
        />
        
        {/* Large "Surprise Me!" Button - Primary Action */}
        <TouchableOpacity
          style={[
            styles.surpriseMeButton,
            isLoading && styles.generateButtonDisabled,
          ]}
          onPress={handleSurpriseMe}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.surpriseMeButtonText}>🎲 Surprise Me!</Text>
          )}
        </TouchableOpacity>

        {/* Standard Generate Button */}
        {recipeRequest.trim() && (
          <TouchableOpacity
            style={[
              styles.generateButton,
              isLoading && styles.generateButtonDisabled,
            ]}
            onPress={() => handleGenerateRecipeWithRequest()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate & Cook</Text>
            )}
          </TouchableOpacity>
        )}
        
        {/* Dynamic Suggestion Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dynamicSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => setRecipeRequest(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSavedRecipes = () => (
    <View style={styles.savedSection}>
      <Text style={styles.savedTitle}>📚 My Recipe Book</Text>
      <Text style={styles.noRecipesText}>
        Or, choose a recipe you&apos;ve already saved.
      </Text>
      {recipes.length > 0 ? (
        recipes.slice(0, 3).map((recipe: UserRecipe) => (
          <TouchableOpacity
            key={recipe.id}
            style={styles.savedRecipeCard}
            onPress={() => navigation.navigate("CookingCoach", { recipe })}
          >
            <Text style={styles.savedRecipeRequest}>{recipe.recipe_name}</Text>
            <Text style={styles.savedRecipeDate}>
              Cooked {recipe.cook_count || 0} times
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noRecipesText}>Your recipe book is empty.</Text>
      )}
    </View>
  );

  const handleUpgrade = () => {
    if (isFeatureEnabled('paymentSystem')) {
      navigation.navigate("Upgrade");
    } else {
      Alert.alert(
        "Coming Soon",
        "Premium features will be available in a future update!"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {renderHeader()}
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {error && (
          <Text style={{ color: "red", textAlign: "center", margin: 10 }}>
            {error}
          </Text>
        )}
        {renderRecipeInput()}
        <View style={styles.divider} />
        {renderSavedRecipes()}
      </ScrollView>
      
      <LimitReachedModal
        actionType="recipe_generation"
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={handleUpgrade}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
  },
  content: { flex: 1 },
  inputSection: { padding: spacing.lg },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: "top",
    minHeight: 100,
  },
  generateButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  generateButtonDisabled: { backgroundColor: colors.disabled },
  generateButtonText: { color: colors.text, fontSize: 18, fontWeight: "bold" },
  suggestionButton: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionButtonText: { 
    color: colors.primary, 
    fontSize: 16, 
    fontWeight: "600" 
  },
  surpriseMeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  surpriseMeButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  suggestionChip: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginRight: 10,
  },
  suggestionText: { fontSize: 14, color: colors.textSecondary },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  savedSection: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  savedTitle: { ...typography.h2, color: colors.text, marginBottom: 4 },
  savedRecipeCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savedRecipeRequest: { fontSize: 16, fontWeight: "600", color: colors.text },
  savedRecipeDate: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  noRecipesText: {
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  macroToggleSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroToggleText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  macroToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  macroToggleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
