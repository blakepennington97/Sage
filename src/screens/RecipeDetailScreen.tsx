import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MarkdownText } from "../components/MarkdownText";
import { colors, spacing, typography } from "../constants/theme";
import { useRecipes } from "../hooks/useRecipes";
import { GeminiService } from "../services/ai";
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
  const [groceryList, setGroceryList] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [recipe, setRecipe] = useState(initialRecipe);
  const { toggleFavorite } = useRecipes();

  const handleGenerateGroceryList = async () => {
    setIsGenerating(true);
    HapticService.light();
    try {
      const list = await geminiService.generateGroceryList(
        recipe.recipe_content
      );
      setGroceryList(list);
      setIsModalVisible(true);
      HapticService.success();
    } catch (error) {
      HapticService.error();
      Alert.alert(
        "Error",
        "Could not generate grocery list. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    Clipboard.setStringAsync(groceryList);
    HapticService.success();
    Alert.alert("Copied!", "Grocery list copied to clipboard.");
  };

  const handleToggleFavorite = async () => {
    const newFavStatus = !recipe.is_favorite;
    setRecipe({ ...recipe, is_favorite: newFavStatus });
    HapticService.light();

    await toggleFavorite(recipe.id, recipe.is_favorite);
  };

  const renderGroceryListModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🛒 Grocery List</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <MarkdownText>{groceryList}</MarkdownText>
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={handleCopyToClipboard}
          >
            <Text style={styles.buttonText}>📋 Copy to Clipboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
      {renderGroceryListModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
  },
  metaContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  favoriteButton: {
    padding: spacing.xs,
  },
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
  primaryButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    ...typography.body,
    fontWeight: "bold",
    color: colors.text,
  },
  primaryButtonText: {
    color: "white",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: "bold",
  },
  modalScroll: {
    padding: spacing.lg,
  },
  modalFooter: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
});
