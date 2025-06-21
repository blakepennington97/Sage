import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";

import { MarkdownText } from "../components/MarkdownText";
import { BottomSheet } from "../components/ui";
import { StarRating } from "../components/StarRating";
import { Box, Text, Button, Card } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";
import { useRecipes } from "../hooks/useRecipes";
import { useUsageTracking } from "../hooks/useUsageTracking";
import { GeminiService, GroceryListData } from "../services/ai";
import { UsageIndicator, LimitReachedModal } from "../components/UsageDisplay";
import { isFeatureEnabled } from "../config/features";
import { HapticService } from "../services/haptics";
import { UserRecipe } from "../services/supabase";
import { CostEstimationService } from "../services/costEstimation";
import { MealPlanService } from "../services/mealPlanService";
import { useAuthStore } from "../stores/authStore";
import { MealType } from "../types/mealPlan";

type RootStackParamList = {
  RecipeDetail: { 
    recipe: UserRecipe;
    fromMealPlanner?: boolean;
    mealPlanContext?: { date: string; mealType: MealType };
  };
};

const geminiService = new GeminiService();

export const RecipeDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "RecipeDetail">>();
  const { recipe: initialRecipe, fromMealPlanner, mealPlanContext } = route.params;
  const theme = useTheme<Theme>();
  const { user } = useAuthStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [groceryList, setGroceryList] = useState<GroceryListData | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [recipe, setRecipe] = useState(initialRecipe);
  const [isModifyModalVisible, setIsModifyModalVisible] = useState(false);
  const [modificationRequest, setModificationRequest] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const { toggleFavorite, rateRecipe, isRating } = useRecipes();
  const { canPerformAction, incrementUsage, isPremium } = useUsageTracking();

  const handleGenerateGroceryList = async () => {
    // Check usage limits (only if feature is enabled)
    if (isFeatureEnabled('usageTracking')) {
      if (!canPerformAction('grocery_list')) {
        HapticService.warning();
        setShowLimitModal(true);
        return;
      }
      
      // Increment usage counter before generation
      const canProceed = await incrementUsage('grocery_list');
      if (!canProceed) {
        HapticService.warning();
        setIsGenerating(false);
        setShowLimitModal(true);
        return;
      }
    }
    
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

  const handleAddToMealPlan = async () => {
    if (!mealPlanContext || !user) return;
    
    try {
      HapticService.medium();
      
      // Get the active meal plan first
      const activeMealPlan = await MealPlanService.getActiveMealPlan(user.id);
      if (!activeMealPlan) {
        Toast.show({
          type: "error",
          text1: "No Active Meal Plan",
          text2: "Please create a meal plan first",
        });
        return;
      }

      await MealPlanService.updateMealPlan({
        meal_plan_id: activeMealPlan.id,
        date: mealPlanContext.date,
        meal_type: mealPlanContext.mealType,
        recipe_id: recipe.id,
        servings: 2 // Default servings
      });

      HapticService.success();
      Toast.show({
        type: "success",
        text1: "✅ Recipe Added to Meal Plan!",
        text2: `${recipe.recipe_name} added to ${mealPlanContext.mealType} for ${new Date(mealPlanContext.date).toLocaleDateString()}`,
      });
      
      // Navigate back to meal planner - pop back to root of stack 
      navigation.popToTop();
    } catch (error: any) {
      HapticService.error();
      Toast.show({
        type: "error",
        text1: "Failed to Add Recipe",
        text2: error.message,
      });
    }
  };

  const handleModifyRecipe = async () => {
    if (!modificationRequest.trim()) {
      Toast.show({
        type: "error",
        text1: "Please enter a modification request",
        text2: "Describe what you'd like to change about the recipe",
      });
      return;
    }

    setIsModifying(true);
    HapticService.light();
    
    try {
      // Parse the existing recipe data
      const currentRecipeData = recipe.recipe_data;
      if (!currentRecipeData) {
        throw new Error("Recipe data not available for modification");
      }

      const modifiedRecipeData = await geminiService.modifyRecipe(
        currentRecipeData,
        modificationRequest
      );

      // Update the recipe with modified data
      const updatedRecipe = {
        ...recipe,
        recipe_data: modifiedRecipeData,
        recipe_name: modifiedRecipeData.recipeName,
        // Update recipe_content with new formatted content
        recipe_content: `# ${modifiedRecipeData.recipeName}

**Difficulty:** ${"⭐".repeat(modifiedRecipeData.difficulty)} (${modifiedRecipeData.difficulty}/5)
**Total Time:** ${modifiedRecipeData.totalTime}
**Servings:** ${modifiedRecipeData.servings}

## Why This Recipe Rocks
${modifiedRecipeData.whyGood}

## Ingredients
${modifiedRecipeData.ingredients.map(ing => `• ${ing.amount} ${ing.name}`).join('\n')}

## Instructions
${modifiedRecipeData.instructions.map(inst => `${inst.step}. ${inst.text}`).join('\n\n')}

## Chef's Tips
${modifiedRecipeData.tips.map(tip => `💡 ${tip}`).join('\n\n')}

## Nutritional Information (per serving)
• **Calories:** ${modifiedRecipeData.caloriesPerServing || 'Not available'}
• **Protein:** ${modifiedRecipeData.proteinPerServing || 'N/A'}g
• **Carbs:** ${modifiedRecipeData.carbsPerServing || 'N/A'}g
• **Fat:** ${modifiedRecipeData.fatPerServing || 'N/A'}g

## Cost Information
• **Cost per serving:** ${modifiedRecipeData.costPerServing ? CostEstimationService.formatCurrency(modifiedRecipeData.costPerServing) : 'N/A'}
• **Total recipe cost:** ${modifiedRecipeData.totalCost ? CostEstimationService.formatCurrency(modifiedRecipeData.totalCost) : 'N/A'}`,
      };

      setRecipe(updatedRecipe);
      setIsModifyModalVisible(false);
      setModificationRequest("");
      
      HapticService.success();
      Toast.show({
        type: "success",
        text1: "Recipe Modified! ✨",
        text2: "Your recipe has been updated based on your request",
      });
    } catch (error: any) {
      HapticService.error();
      Toast.show({
        type: "error",
        text1: "Modification Failed",
        text2: error.message,
      });
    } finally {
      setIsModifying(false);
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
          {/* Recipe Content - Moved to top */}
          <Card variant="primary" marginBottom="lg">
            <MarkdownText>{recipe.recipe_content}</MarkdownText>
          </Card>

          {/* Cost Information - Moved below recipe */}
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

          {/* Recipe Modification Section - Moved below cost */}
          <Card variant="primary" marginBottom="lg">
            <Text variant="h3" marginBottom="md">✨ Customize Recipe</Text>
            <Text variant="body" color="secondaryText" marginBottom="md">
              Want to make changes? Ask Sage to modify this recipe for you!
            </Text>
            <Button
              variant="secondary"
              onPress={() => setIsModifyModalVisible(true)}
              disabled={isModifying}
            >
              <Text variant="button" color="primaryText">
                {isModifying ? "Modifying..." : "🔧 Modify Recipe"}
              </Text>
            </Button>
          </Card>

          {/* Rating Section - Moved to bottom */}
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
            <Box alignItems="center">
              <Text variant="button" color="primaryText" numberOfLines={1} textAlign="center">
                🛒 Grocery List
              </Text>
              {!isPremium && isFeatureEnabled('usageTracking') && (
                <UsageIndicator actionType="grocery_list" showLabel={false} size="small" />
              )}
            </Box>
          )}
        </Button>
        
        <Button
          variant="primary"
          flex={1}
          onPress={fromMealPlanner ? handleAddToMealPlan : () => navigation.navigate("CookingCoach", { recipe })}
        >
          <Text variant="button" color="primaryButtonText" numberOfLines={1} textAlign="center">
            {fromMealPlanner ? "📅 Add Recipe" : "🔥 Start Cooking"}
          </Text>
        </Button>
      </Box>

      {/* Usage Limit Modal */}
      <LimitReachedModal
        actionType="grocery_list"
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={() => {
          setShowLimitModal(false);
          if (isFeatureEnabled('paymentSystem')) {
            navigation.navigate("Upgrade");
          } else {
            Alert.alert(
              "Coming Soon",
              "Premium features will be available in a future update!"
            );
          }
        }}
      />

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
          
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
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
                <Text variant="body" color="secondaryText" marginTop="md">
                  Generating your grocery list...
                </Text>
              </Box>
            )}
          </ScrollView>
          
          {/* Always show the copy button when groceryList exists */}
          {groceryList && (
            <Box marginTop="lg">
              <Button variant="primary" onPress={handleCopyToClipboard}>
                <Text variant="button" color="primaryButtonText" numberOfLines={1} textAlign="center">
                  📋 Copy to Clipboard
                </Text>
              </Button>
            </Box>
          )}
        </Box>
      </BottomSheet>

      {/* Recipe Modification Modal */}
      <BottomSheet
        isVisible={isModifyModalVisible}
        onClose={() => {
          Keyboard.dismiss();
          setIsModifyModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Box padding="lg" flex={1}>
              <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="lg">
                <Text variant="h2">✨ Modify Recipe</Text>
                <TouchableOpacity onPress={() => {
                  Keyboard.dismiss();
                  setIsModifyModalVisible(false);
                }}>
                  <Text fontSize={24} color="textSecondary">✕</Text>
                </TouchableOpacity>
              </Box>
              
              <Text variant="body" color="secondaryText" marginBottom="md">
                Tell Sage how you'd like to modify this recipe. Examples:
              </Text>
              
              <Box backgroundColor="surfaceVariant" padding="md" borderRadius="md" marginBottom="lg">
                <Text variant="caption" color="secondaryText" marginBottom="xs">
                  • "Can we not use chicken?"
                </Text>
                <Text variant="caption" color="secondaryText" marginBottom="xs">
                  • "Make this higher in protein"
                </Text>
                <Text variant="caption" color="secondaryText" marginBottom="xs">
                  • "I don't have an oven, use stovetop only"
                </Text>
                <Text variant="caption" color="secondaryText">
                  • "Make it less spicy for kids"
                </Text>
              </Box>
              
              <Box marginBottom="lg" flex={1}>
                <TextInput
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.primaryText,
                    minHeight: 100,
                    textAlignVertical: 'top',
                    flex: 1,
                  }}
                  placeholder="Describe what you'd like to change about this recipe..."
                  placeholderTextColor={theme.colors.secondaryText}
                  value={modificationRequest}
                  onChangeText={setModificationRequest}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text variant="caption" color="secondaryText" textAlign="right" marginTop="xs">
                  {modificationRequest.length}/500
                </Text>
              </Box>
              
              <Box flexDirection="row" gap="md" paddingBottom="md">
                <Button
                  variant="secondary"
                  flex={1}
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsModifyModalVisible(false);
                    setModificationRequest("");
                  }}
                  disabled={isModifying}
                >
                  <Text variant="button" color="primaryText">Cancel</Text>
                </Button>
                
                <Button
                  variant="primary"
                  flex={1}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleModifyRecipe();
                  }}
                  disabled={isModifying || !modificationRequest.trim()}
                >
                  {isModifying ? (
                    <ActivityIndicator color={theme.colors.primaryButtonText} />
                  ) : (
                    <Text variant="button" color="primaryButtonText">
                      ✨ Modify Recipe
                    </Text>
                  )}
                </Button>
              </Box>
            </Box>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </BottomSheet>
    </Box>
  );
};

