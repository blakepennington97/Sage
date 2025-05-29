// src/screens/RecipeGenerationScreen.tsx
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { GeminiService } from "../services/ai";

interface Recipe {
  id: string;
  content: string;
  request: string;
  timestamp: Date;
}

export const RecipeGenerationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [recipeRequest, setRecipeRequest] = useState("");
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  const geminiService = new GeminiService();

  const quickSuggestions = [
    "Easy pasta dinner",
    "Healthy breakfast",
    "15-minute lunch",
    "Comfort food dinner",
    "Beginner-friendly dessert",
  ];

  const generateRecipe = async () => {
    if (!recipeRequest.trim()) {
      Alert.alert("Enter Request", "Please describe what you'd like to cook");
      return;
    }

    setIsGenerating(true);
    try {
      const recipeContent = await geminiService.generateRecipe(recipeRequest);

      const newRecipe: Recipe = {
        id: Date.now().toString(),
        content: recipeContent,
        request: recipeRequest,
        timestamp: new Date(),
      };

      setCurrentRecipe(newRecipe);
      setRecipeRequest("");
    } catch (error) {
      let errorMessage = "Failed to generate recipe.";
      if (
        error instanceof Error &&
        error.message.includes("API key not found")
      ) {
        errorMessage = "Please configure your API key in Settings first.";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRecipe = () => {
    if (currentRecipe) {
      setSavedRecipes((prev) => [currentRecipe, ...prev]);
      Alert.alert("Saved!", "Recipe added to your collection");
    }
  };

  const startCooking = () => {
    if (currentRecipe) {
      // Extract recipe name from content
      const lines = currentRecipe.content.split("\n");
      const nameLine = lines.find(
        (line) =>
          line.includes("Recipe Name:") || line.includes("**Recipe Name:**")
      );
      const recipeName = nameLine
        ? nameLine.replace(/\*\*Recipe Name:\*\*|Recipe Name:/, "").trim()
        : currentRecipe.request;

      (navigation as any).navigate("CookingCoach", {
        recipe: currentRecipe.content,
        recipeName: recipeName,
      });
    }
  };

  const clearRecipe = () => {
    setCurrentRecipe(null);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>👨‍🍳 Recipe Generator</Text>
      <Text style={styles.subtitle}>Tell me what you want to cook</Text>
    </View>
  );

  const renderRecipeInput = () => (
    <View style={styles.inputSection}>
      <TextInput
        style={styles.textInput}
        value={recipeRequest}
        onChangeText={setRecipeRequest}
        placeholder="What would you like to cook? (e.g., 'easy chicken dinner')"
        multiline
        numberOfLines={3}
        maxLength={200}
      />

      <TouchableOpacity
        style={[
          styles.generateButton,
          isGenerating && styles.generateButtonDisabled,
        ]}
        onPress={generateRecipe}
        disabled={isGenerating}
      >
        <Text style={styles.generateButtonText}>
          {isGenerating ? "Creating Recipe..." : "Generate Recipe"}
        </Text>
      </TouchableOpacity>

      <View style={styles.suggestionsSection}>
        <Text style={styles.suggestionsTitle}>Quick Ideas:</Text>
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
    </View>
  );

  const renderRecipe = () => {
    if (!currentRecipe) return null;

    return (
      <View style={styles.recipeSection}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>Your Personalized Recipe</Text>
          <View style={styles.recipeActions}>
            <TouchableOpacity style={styles.actionButton} onPress={saveRecipe}>
              <Text style={styles.actionButtonText}>💾 Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={clearRecipe}>
              <Text style={styles.actionButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recipeContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.recipeText}>{currentRecipe.content}</Text>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.startCookingButton}
          onPress={startCooking}
        >
          <Text style={styles.startCookingButtonText}>🔥 Start Cooking</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSavedRecipes = () => {
    if (savedRecipes.length === 0 || currentRecipe) return null;

    return (
      <View style={styles.savedSection}>
        <Text style={styles.savedTitle}>
          📚 Saved Recipes ({savedRecipes.length})
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {savedRecipes.slice(0, 3).map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.savedRecipeCard}
              onPress={() => setCurrentRecipe(recipe)}
            >
              <Text style={styles.savedRecipeRequest}>{recipe.request}</Text>
              <Text style={styles.savedRecipeDate}>
                {recipe.timestamp.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
          {savedRecipes.length > 3 && (
            <Text style={styles.moreRecipesText}>
              +{savedRecipes.length - 3} more recipes
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {renderHeader()}

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {!currentRecipe && renderRecipeInput()}
        {renderRecipe()}
        {renderSavedRecipes()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 5,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  inputSection: {
    padding: 20,
  },
  textInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlignVertical: "top",
    marginBottom: 15,
    minHeight: 80,
  },
  generateButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  generateButtonDisabled: {
    backgroundColor: "#ccc",
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  suggestionsSection: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  suggestionChip: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },
  recipeSection: {
    flex: 1,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
  },
  recipeHeader: {
    backgroundColor: "#f8fff9",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  recipeActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  recipeContent: {
    padding: 20,
    maxHeight: 400,
  },
  recipeText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  startCookingButton: {
    backgroundColor: "#FF6B35",
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startCookingButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  savedSection: {
    padding: 20,
  },
  savedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  savedRecipeCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  savedRecipeRequest: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  savedRecipeDate: {
    fontSize: 12,
    color: "#666",
  },
  moreRecipesText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 10,
  },
});
