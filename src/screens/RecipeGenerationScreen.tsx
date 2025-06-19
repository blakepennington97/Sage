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
import { colors, spacing, borderRadius, typography } from "../constants/theme";
import { HapticService } from "../services/haptics";
import { UserRecipe } from "../services/supabase";

export const RecipeGenerationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isOffline } = useNetworkStatus();
  
  // Check if coming from meal planner
  const fromMealPlanner = route.params?.fromMealPlanner;
  const mealPlanContext = route.params?.mealPlanContext;
  const [recipeRequest, setRecipeRequest] = useState("");

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
      <Text style={styles.title}>👨‍🍳 New Recipe</Text>
      <Text style={styles.subtitle}>Tell me what you want to cook today</Text>
    </View>
  );

  const renderRecipeInput = () => {
    const quickSuggestions = [
      "Easy pasta dinner",
      "Healthy 15-minute lunch", 
      "Comfort food dessert",
    ];

    const handleSmartSuggestion = () => {
      const suggestions = [
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
      
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.text,
    textAlign: "center",
    opacity: 0.9,
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
