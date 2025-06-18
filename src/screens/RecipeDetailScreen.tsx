// src/screens/RecipeDetailScreen.tsx

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// CHANGE 1: MAKE SURE MARKDOWNTEXT IS IMPORTED
import { MarkdownText } from "../components/MarkdownText";
import { Sheet } from "../components/Sheet";
import { colors, spacing, typography } from "../constants/theme";
import { useRecipes } from "../hooks/useRecipes";
import { GeminiService, GroceryListData } from "../services/ai";
import { HapticService } from "../services/haptics";
import { UserRecipe } from "../services/supabase";

type RootStackParamList = {
  RecipeDetail: { recipe: UserRecipe };
};

const geminiService = new GeminiService();

export const RecipeDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "RecipeDetail">>();
  const { recipe: initialRecipe } = route.params;

  const [isGenerating, setIsGenerating] = useState(false);
  const [groceryList, setGroceryList] = useState<GroceryListData | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [recipe, setRecipe] = useState(initialRecipe);
  const { toggleFavorite } = useRecipes();

  const handleGenerateGroceryList = async () => {
    setIsGenerating(true);
    HapticService.light();
    try {
      const listFromAI = await geminiService.generateGroceryList(
        recipe.recipe_content
      );
      let finalList: GroceryListData | null = null;
      if (Array.isArray(listFromAI)) {
        finalList = listFromAI;
      } else if (
        listFromAI &&
        typeof listFromAI === "object" &&
        !Array.isArray(listFromAI)
      ) {
        const keyWithArray = Object.keys(listFromAI).find((key) =>
          Array.isArray((listFromAI as any)[key])
        );
        if (keyWithArray) {
          finalList = (listFromAI as any)[keyWithArray];
        }
      }
      if (!finalList) {
        throw new Error("The AI returned an unexpected format.");
      }

      setGroceryList(finalList);
      setIsSheetVisible(true);
      HapticService.success();
    } catch (error: any) {
      HapticService.error();
      Toast.show({
        type: "error",
        text1: "Generation Failed",
        text2: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!groceryList) return;
    const clipboardString = groceryList
      .map(
        (cat) =>
          `${cat.category.toUpperCase()}\n${cat.items
            .map((i) => `- ${i}`)
            .join("\n")}`
      )
      .join("\n\n");

    Clipboard.setStringAsync(clipboardString);
    HapticService.success();
    Toast.show({ type: "success", text1: "Copied to Clipboard!" });
  };

  const handleToggleFavorite = async () => {
    const newFavStatus = !recipe.is_favorite;
    setRecipe({ ...recipe, is_favorite: newFavStatus });
    HapticService.light();
    await toggleFavorite(recipe.id, recipe.is_favorite);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>{recipe.recipe_name}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>Cooked: {recipe.cook_count} times</Text>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.favoriteButton}
          >
            <Text style={styles.metaText}>
              Favorite: {recipe.is_favorite ? "❤️" : "🤍"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CHANGE 2: USE THE CORRECT COMPONENT HERE */}
        <MarkdownText>{recipe.recipe_content}</MarkdownText>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateGroceryList}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.buttonText}>🛒 Get Grocery List</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate("CookingCoach", { recipe })}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            🔥 Start Cooking
          </Text>
        </TouchableOpacity>
      </View>

      <Sheet
        isVisible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>🛒 Grocery List</Text>
          <TouchableOpacity onPress={() => setIsSheetVisible(false)}>
            <Text style={styles.sheetCloseButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.sheetScroll}>
          {groceryList ? (
            groceryList.map((category) => (
              <View key={category.category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                {category.items.map((item, index) => (
                  <Text key={index} style={styles.groceryItem}>
                    {" "}
                    • {item}{" "}
                  </Text>
                ))}
              </View>
            ))
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </ScrollView>
        <View style={styles.sheetFooter}>
          <TouchableOpacity
            style={styles.sheetButton}
            onPress={handleCopyToClipboard}
          >
            <Text style={styles.buttonText}>📋 Copy to Clipboard</Text>
          </TouchableOpacity>
        </View>
      </Sheet>
    </View>
  );
};

// Styles are unchanged from the previous step
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: spacing.lg, paddingBottom: 120 },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.md },
  metaContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  metaText: { ...typography.caption, color: colors.textSecondary },
  favoriteButton: { padding: spacing.xs },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.surfaceVariant,
  },
  primaryButton: { backgroundColor: colors.primary },
  buttonText: { ...typography.body, fontWeight: "bold", color: colors.text },
  primaryButtonText: { color: "white" },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { ...typography.h2, color: colors.text },
  sheetCloseButton: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: "bold",
  },
  sheetScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  sheetFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheetButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  categoryContainer: { marginBottom: spacing.lg },
  categoryTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  groceryItem: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginLeft: spacing.sm,
  },
});
