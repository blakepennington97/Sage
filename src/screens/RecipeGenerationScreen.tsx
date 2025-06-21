import React, { useState } from "react";
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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useRecipes } from "../hooks/useRecipes";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useUsageTracking } from "../hooks/useUsageTracking";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useAuthStore } from "../stores/authStore";
import { UsageIndicator, LimitReachedModal } from "../components/UsageDisplay";
import { isFeatureEnabled } from "../config/features";
import { colors, spacing, borderRadius, typography } from "../constants/theme";
import { HapticService } from "../services/haptics";
import { UserRecipe } from "../services/supabase";

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
  const { canPerformAction, incrementUsage, isPremium } = useUsageTracking();

  const { recipes, isLoading, error, generateAndSaveRecipe } = useRecipes();

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
    
    const newRecipe = await generateAndSaveRecipe(recipeRequest);
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

  const renderRecipeInput = () => {
    // Generate intelligent suggestions based on user preferences and profile
    const getIntelligentSuggestions = () => {
      const baseSuggestions = [];
      
      // Based on skill level
      const skillLevel = profile?.skill_level;
      if (skillLevel === 'complete_beginner') {
        baseSuggestions.push("Simple 10-minute meal", "Easy one-pot dish", "No-cook healthy option");
      } else if (skillLevel === 'confident') {
        baseSuggestions.push("Impressive dinner", "New technique to try", "Complex flavor combo");
      } else {
        baseSuggestions.push("Weeknight favorite", "Comfort food classic", "Fresh and healthy");
      }
      
      // Based on preferences if available
      if (preferences?.setupCompleted) {
        const { dietary, cookingContext, cookingStyles } = preferences;
        
        // Add cuisine-based suggestions
        if (cookingStyles.preferredCuisines.length > 0) {
          const randomCuisine = cookingStyles.preferredCuisines[
            Math.floor(Math.random() * cookingStyles.preferredCuisines.length)
          ].replace(/_/g, ' ');
          baseSuggestions.push(`${randomCuisine} dish`);
        }
        
        // Add time-based suggestions
        if (cookingContext.typicalCookingTime === 'quick_15min') {
          baseSuggestions.push("15-minute meal", "Quick lunch");
        } else if (cookingContext.typicalCookingTime === 'project_90min_plus') {
          baseSuggestions.push("Weekend cooking project", "Slow-cooked comfort");
        }
        
        // Add mood-based suggestions
        if (cookingStyles.cookingMoods.includes('healthy_fresh')) {
          baseSuggestions.push("Nutritious and light", "Fresh vegetable focus");
        }
        if (cookingStyles.cookingMoods.includes('comfort_food')) {
          baseSuggestions.push("Cozy comfort meal", "Nostalgic favorite");
        }
      }
      
      // Add recent recipe patterns
      if (recipes.length > 0) {
        const recentRecipes = recipes.slice(0, 5);
        const hasAsianRecipes = recentRecipes.some(r => 
          r.recipe_name.toLowerCase().includes('asian') || 
          r.recipe_name.toLowerCase().includes('thai') ||
          r.recipe_name.toLowerCase().includes('chinese')
        );
        if (!hasAsianRecipes) {
          baseSuggestions.push("Asian-inspired dish");
        }
        
        const hasItalianRecipes = recentRecipes.some(r => 
          r.recipe_name.toLowerCase().includes('pasta') || 
          r.recipe_name.toLowerCase().includes('italian')
        );
        if (!hasItalianRecipes) {
          baseSuggestions.push("Italian classic");
        }
      }
      
      return baseSuggestions.slice(0, 3); // Return top 3
    };

    const quickSuggestions = getIntelligentSuggestions();

    const handleSmartSuggestion = () => {
      const contextualSuggestions = [
        "A quick and healthy weeknight dinner using whatever vegetables I have",
        "Something comforting and warm for a cozy evening",
        "A simple one-pot meal that won't make too many dishes",
        "A nutritious lunch I can make in under 20 minutes",
        "An impressive dish that's easier than it looks",
        "Something with bold flavors to try a new cuisine",
        "A filling breakfast that will give me energy for the day",
        "A light and fresh meal perfect for today's weather",
        "Something I can meal prep for the week ahead",
        "A satisfying dinner using pantry staples I probably have"
      ];
      
      // Add preference-based suggestions
      if (preferences?.setupCompleted) {
        const { dietary, cookingStyles } = preferences;
        
        if (cookingStyles.preferredCuisines.length > 0) {
          const cuisine = cookingStyles.preferredCuisines[0].replace(/_/g, ' ');
          contextualSuggestions.unshift(`A delicious ${cuisine} dish that matches my taste preferences`);
        }
        
        if (dietary.dietaryStyle !== 'omnivore') {
          contextualSuggestions.unshift(`A satisfying ${dietary.dietaryStyle} meal with great flavors`);
        }
      }
      
      const randomSuggestion = contextualSuggestions[Math.floor(Math.random() * contextualSuggestions.length)];
      setRecipeRequest(randomSuggestion);
    };
    return (
      <View style={styles.inputSection}>
        <TextInput
          style={styles.textInput}
          value={recipeRequest}
          onChangeText={setRecipeRequest}
          placeholder="e.g., 'A simple chicken dish with rice for a beginner...'"
          multiline
        />
        
        {/* Smart Suggestion Button */}
        {!recipeRequest && (
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={handleSmartSuggestion}
          >
            <Text style={styles.suggestionButtonText}>✨ Suggest me something</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.generateButton,
            isLoading && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateRecipe}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate & Cook</Text>
          )}
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickSuggestions.map((suggestion, index) => (
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
        Or, choose a recipe you've already saved.
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
});
