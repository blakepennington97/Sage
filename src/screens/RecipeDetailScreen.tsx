import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";

import { MarkdownText } from "../components/MarkdownText";
import { BottomSheet } from "../components/ui";
import { StarRating } from "../components/StarRating";
import { Box, Text, Button, Card } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";
import { useRecipes } from "../hooks/useRecipes";
import { GeminiService, GroceryListData } from "../services/ai";
import { HapticService } from "../services/haptics";
import { UserRecipe } from "../services/supabase";
import { CostEstimationService } from "../services/costEstimation";

type RootStackParamList = {
  RecipeDetail: { recipe: UserRecipe };
};

const geminiService = new GeminiService();

export const RecipeDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "RecipeDetail">>();
  const { recipe: initialRecipe } = route.params;
  const theme = useTheme<Theme>();

  const [isGenerating, setIsGenerating] = useState(false);
  const [groceryList, setGroceryList] = useState<GroceryListData | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [recipe, setRecipe] = useState(initialRecipe);
  const { toggleFavorite, rateRecipe, isRating } = useRecipes();

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

  const handleRatingChange = (rating: number) => {
    setRecipe({ ...recipe, user_rating: rating });
    HapticService.light();
    rateRecipe(recipe.id, rating);
    
    if (rating >= 4) {
      Toast.show({
        type: "success",
        text1: "Thanks for rating!",
        text2: "Your feedback helps improve our AI recommendations",
      });
    }
  };

  return (
    <Box flex={1} backgroundColor="mainBackground">
      {/* Header */}
      <Box 
        backgroundColor="surface" 
        paddingTop="xxl" 
        paddingBottom="md" 
        paddingHorizontal="lg"
        borderBottomWidth={1}
        borderBottomColor="border"
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ position: 'absolute', left: 20, top: 60, zIndex: 1 }}
        >
          <Text fontSize={24}>←</Text>
        </TouchableOpacity>
        
        <Text variant="h2" textAlign="center" marginBottom="xs">
          {recipe.recipe_name}
        </Text>
        
        {/* Recipe Meta Info */}
        <Box flexDirection="row" justifyContent="center" alignItems="center" gap="lg">
          <Text variant="caption" color="secondaryText">
            Cooked {recipe.cook_count} times
          </Text>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Text variant="caption" color="secondaryText">
              {recipe.is_favorite ? "❤️ Favorite" : "🤍 Add to Favorites"}
            </Text>
          </TouchableOpacity>
        </Box>
      </Box>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Box padding="lg" paddingBottom="xxl">
          {/* Cost Information */}
          {recipe.recipe_data?.costPerServing && (
            <Card variant="primary" marginBottom="lg">
              <Text variant="h3" marginBottom="md">💰 Cost Breakdown</Text>
              <Box flexDirection="row" justifyContent="space-between" marginBottom="sm">
                <Text variant="body" color="primaryText">Cost per serving:</Text>
                <Text variant="body" color="primary" fontWeight="bold">
                  {CostEstimationService.formatCurrency(recipe.recipe_data.costPerServing)}
                </Text>
              </Box>
              <Box flexDirection="row" justifyContent="space-between" marginBottom="sm">
                <Text variant="body" color="primaryText">Total recipe cost:</Text>
                <Text variant="body" color="secondaryText">
                  {recipe.recipe_data.totalCost 
                    ? CostEstimationService.formatCurrency(recipe.recipe_data.totalCost)
                    : 'N/A'
                  }
                </Text>
              </Box>
              <Box flexDirection="row" justifyContent="space-between" marginBottom="md">
                <Text variant="body" color="primaryText">Servings:</Text>
                <Text variant="body" color="secondaryText">
                  {recipe.recipe_data.servings || 'N/A'}
                </Text>
              </Box>
              <Text variant="caption" color="secondaryText">
                💡 Estimated costs based on average US grocery prices
              </Text>
            </Card>
          )}

          {/* Rating Section */}
          <Card variant="primary" marginBottom="lg">
            <Text variant="h3" marginBottom="md">Rate This Recipe</Text>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <StarRating
                rating={recipe.user_rating || 0}
                onRatingChange={handleRatingChange}
                interactive={!isRating}
                size="large"
              />
              {isRating && (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              )}
            </Box>
            {recipe.user_rating > 0 && (
              <Text variant="caption" color="secondaryText" marginTop="sm">
                Your rating helps improve AI recommendations for everyone!
              </Text>
            )}
          </Card>

          {/* Recipe Content */}
          <Card variant="primary">
            <MarkdownText>{recipe.recipe_content}</MarkdownText>
          </Card>
        </Box>
      </ScrollView>

      {/* Footer Actions */}
      <Box 
        flexDirection="row" 
        padding="lg" 
        backgroundColor="surface"
        borderTopWidth={1}
        borderTopColor="border"
        gap="md"
      >
        <Button
          variant="secondary"
          flex={1}
          onPress={handleGenerateGroceryList}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text variant="button" color="primaryText" numberOfLines={1} textAlign="center">
              🛒 Grocery List
            </Text>
          )}
        </Button>
        
        <Button
          variant="primary"
          flex={1}
          onPress={() => navigation.navigate("CookingCoach", { recipe })}
        >
          <Text variant="button" color="primaryButtonText" numberOfLines={1} textAlign="center">
            🔥 Start Cooking
          </Text>
        </Button>
      </Box>

      {/* Grocery List Sheet */}
      <BottomSheet
        isVisible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
      >
        <Box padding="lg">
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="lg">
            <Text variant="h2">🛒 Grocery List</Text>
            <TouchableOpacity onPress={() => setIsSheetVisible(false)}>
              <Text fontSize={24} color="textSecondary">✕</Text>
            </TouchableOpacity>
          </Box>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {groceryList ? (
              groceryList.map((category) => (
                <Box key={category.category} marginBottom="lg">
                  <Box 
                    borderBottomWidth={1}
                    borderBottomColor="border"
                    paddingBottom="xs"
                    marginBottom="sm"
                  >
                    <Text variant="h3" color="primary">
                      {category.category}
                    </Text>
                  </Box>
                  {category.items.map((item, index) => (
                    <Text 
                      key={index} 
                      variant="body" 
                      marginLeft="sm" 
                      marginBottom="xs"
                    >
                      • {item}
                    </Text>
                  ))}
                </Box>
              ))
            ) : (
              <Box alignItems="center" padding="lg">
                <ActivityIndicator color={theme.colors.primary} />
              </Box>
            )}
          </ScrollView>
          
          <Box marginTop="lg">
            <Button variant="primary" onPress={handleCopyToClipboard}>
              <Text variant="button" color="primaryButtonText" numberOfLines={1} textAlign="center">
                📋 Copy to Clipboard
              </Text>
            </Button>
          </Box>
        </Box>
      </BottomSheet>
    </Box>
  );
};

