import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { GeminiService } from "../services/ai";
import { useAuthStore } from "../stores/authStore";
import {
  SessionService,
  RecipeService,
  UserRecipe,
} from "../services/supabase";
import { CostEstimationService } from "../services/costEstimation";
import { Box, Text, Button, Card } from "../components/ui";
import { BottomSheet } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";

type RootStackParamList = { CookingCoach: { recipe: UserRecipe } };
interface CookingStep {
  id: number;
  instruction: string;
}

export const CookingCoachScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "CookingCoach">>();
  const { recipe } = route.params;
  const theme = useTheme<Theme>();

  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<CookingStep[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpQuestion, setHelpQuestion] = useState("");
  const [helpResponse, setHelpResponse] = useState("");
  const [isGettingHelp, setIsGettingHelp] = useState(false);

  const geminiService = new GeminiService();

  useEffect(() => {
    // REPLACE THIS FUNCTION
    const parseRecipeSteps = () => {
      // Prioritize structured data if it exists (for new recipes)
      if (recipe.recipe_data && recipe.recipe_data.instructions) {
        const parsedSteps = recipe.recipe_data.instructions.map(
          (inst: any) => ({
            id: inst.step,
            instruction: inst.text,
          })
        );
        setSteps(parsedSteps);
        return;
      }

      // Fallback for older recipes without structured data
      console.warn(
        "Falling back to legacy recipe parsing for recipe:",
        recipe.id
      );
      const recipeContent = recipe.recipe_content || "";
      const lines = recipeContent.split("\n");
      const parsedSteps: CookingStep[] = [];
      lines.forEach((line: string) => {
        if (line.trim().match(/^\d+\./)) {
          parsedSteps.push({
            id: parsedSteps.length + 1,
            instruction: line.trim().replace(/^\d+\.\s*/, ""),
          });
        }
      });
      setSteps(
        parsedSteps.length > 0
          ? parsedSteps
          : [{ id: 1, instruction: recipeContent }]
      );
    };

    const startSession = async () => {
      if (user && recipe.id) {
        const newSessionId = await SessionService.startCookingSession(
          user.id,
          recipe.id
        );
        setSessionId(newSessionId);
        await RecipeService.markAsCooked(recipe.id);
      }
    };

    parseRecipeSteps();
    startSession();
  }, [recipe.id, user, recipe.recipe_content, recipe.recipe_data]);


  const handleSessionComplete = async (rating: number) => {
    if (sessionId) {
      const recipeCost = recipe.recipe_data?.costPerServing;
      const servings = recipe.recipe_data?.servings || 1;
      const totalRecipeCost = recipeCost ? recipeCost * servings : 0;
      
      let savingsData = undefined;
      if (recipeCost) {
        const restaurantMultiplier = CostEstimationService.getRestaurantMultiplier();
        const restaurantCost = recipeCost * restaurantMultiplier;
        const totalRestaurantCost = restaurantCost * servings;
        const estimatedSavings = totalRestaurantCost - totalRecipeCost;
        
        savingsData = {
          recipeCost: totalRecipeCost,
          restaurantCost: totalRestaurantCost,
          estimatedSavings,
        };
      }
      
      await SessionService.completeCookingSession(sessionId, rating, savingsData);
    }
    navigation.popToTop();
  };



  const getHelp = async () => {
    if (!helpQuestion.trim()) {
      Alert.alert("Enter Question", "Please describe what you need help with");
      return;
    }

    setIsGettingHelp(true);
    try {
      const currentInstruction = steps[currentStep]?.instruction || "";
      const context = `I'm currently on this cooking step: "${currentInstruction}". ${helpQuestion}`;

      const response = await geminiService.getCookingAdvice(context);
      setHelpResponse(response.message);
    } catch (error) {
      Alert.alert("Error", "Failed to get help. Please try again.");
    } finally {
      setIsGettingHelp(false);
    }
  };

  const completeSession = () => {
    const recipeCost = recipe.recipe_data?.costPerServing;
    const servings = recipe.recipe_data?.servings || 1;
    
    // Estimate restaurant cost using regional multiplier
    const restaurantMultiplier = CostEstimationService.getRestaurantMultiplier();
    const restaurantCost = recipeCost ? recipeCost * restaurantMultiplier : null;
    const totalSavings = restaurantCost && recipeCost 
      ? (restaurantCost - recipeCost) * servings 
      : null;
    
    const savingsMessage = totalSavings 
      ? `\n💰 You saved approximately $${totalSavings.toFixed(2)} vs. restaurant!` 
      : "";
    
    Alert.alert(
      "🎉 Recipe Complete!", 
      `How did it turn out?${savingsMessage}`, 
      [
        { text: "Awesome!", onPress: () => handleSessionComplete(5) },
        {
          text: "Could be better",
          onPress: () => handleSessionComplete(3),
          style: "cancel",
        },
      ]
    );
  };

  return (
    <Box flex={1} backgroundColor="mainBackground">
      {/* Header */}
      <Box 
        backgroundColor="primary" 
        padding="lg" 
        paddingTop="xxl"
        borderBottomWidth={1}
        borderBottomColor="border"
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ position: 'absolute', left: 20, top: 60, zIndex: 1 }}
        >
          <Text fontSize={24}>←</Text>
        </TouchableOpacity>
        
        <Text variant="h2" color="primaryButtonText" textAlign="center">
          🔥 Cooking Coach
        </Text>
        <Text variant="body" color="primaryButtonText" textAlign="center" opacity={0.9}>
          {recipe.recipe_name || "Your Recipe"}
        </Text>
        
        {/* Progress Bar */}
        <Box marginTop="md">
          <Text variant="caption" color="primaryButtonText" textAlign="center" marginBottom="xs">
            Step {currentStep + 1} of {steps.length}
          </Text>
          <Box 
            height={6}
            backgroundColor="primaryButtonText"
            borderRadius="sm"
            opacity={0.2}
          >
            <Box
              height={6}
              backgroundColor="primaryButtonText"
              borderRadius="sm"
              opacity={1}
              style={{
                width: `${(currentStep / Math.max(steps.length - 1, 1)) * 100}%`,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Current Step Content */}
      <ScrollView style={{ flex: 1 }}>
        <Box padding="lg">
          {steps.length > 0 && (
            <Card variant="primary" marginBottom="lg">
              <Text variant="h3" marginBottom="md">
                Step {currentStep + 1}
              </Text>
              <Text variant="body" lineHeight={24}>
                {steps[currentStep]?.instruction}
              </Text>
            </Card>
          )}


          {/* Help Section */}
          <Card variant="primary">
            <Text variant="h3" marginBottom="md">🤔 Need Help?</Text>
            <Button 
              variant="secondary" 
              onPress={() => setShowHelpModal(true)}
            >
              <Text variant="button" color="primaryText">
                Ask Sage for Cooking Advice
              </Text>
            </Button>
          </Card>
        </Box>
      </ScrollView>

      {/* Navigation */}
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
          disabled={currentStep === 0}
          onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
        >
          <Text variant="button" color={currentStep === 0 ? "textSecondary" : "primaryText"}>
            ← Previous
          </Text>
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            variant="primary"
            flex={1}
            onPress={completeSession}
          >
            <Text variant="button" color="primaryButtonText">
              Complete! 🎉
            </Text>
          </Button>
        ) : (
          <Button
            variant="primary"
            flex={1}
            onPress={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          >
            <Text variant="button" color="primaryButtonText">
              Next →
            </Text>
          </Button>
        )}
      </Box>

      {/* Help Modal */}
      <BottomSheet 
        isVisible={showHelpModal} 
        onClose={() => {
          setShowHelpModal(false);
          setHelpQuestion("");
          setHelpResponse("");
        }}
      >
        <Box padding="lg">
          <Text variant="h2" textAlign="center" marginBottom="lg">
            🤔 Ask Sage
          </Text>
          
          <Text variant="body" marginBottom="md">
            Having trouble with this step? Describe what&apos;s going wrong and I&apos;ll help!
          </Text>
          
          <Box
            backgroundColor="surface"
            borderRadius="md"
            padding="md"
            borderWidth={1}
            borderColor="border"
            marginBottom="md"
            minHeight={80}
          >
            <TextInput
              value={helpQuestion}
              onChangeText={setHelpQuestion}
              placeholder="e.g., 'How do I know when it's done?' or 'My sauce is too thick'"
              multiline
              numberOfLines={3}
              style={{
                color: theme.colors.text,
                fontSize: 16,
                textAlignVertical: 'top',
              }}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </Box>

          <Button
            variant="primary"
            onPress={getHelp}
            disabled={isGettingHelp}
            marginBottom="md"
          >
            <Text variant="button" color="primaryButtonText">
              {isGettingHelp ? "Getting Help..." : "Ask Sage"}
            </Text>
          </Button>

          {helpResponse && (
            <Card variant="secondary">
              <Text variant="h3" marginBottom="sm">💡 Sage&apos;s Advice:</Text>
              <Text variant="body">{helpResponse}</Text>
            </Card>
          )}
        </Box>
      </BottomSheet>
    </Box>
  );
};
