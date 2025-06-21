import React, { useState } from "react";
import { ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Box, Text, Button } from "../components/ui";
import { CustomSlider } from "../components/ui/Slider";
import { useUserProfile } from "../hooks/useUserProfile";
import { HapticService } from "../services/haptics";
import { OnboardingStackParamList } from "../types/navigation";

type MacroGoalsNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'MacroGoals'
>;

interface MacroGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

const macroRanges = {
  calories: { min: 1200, max: 4000, step: 50 },
  protein: { min: 30, max: 200, step: 5 },
  carbs: { min: 50, max: 400, step: 10 },
  fat: { min: 20, max: 150, step: 5 },
};

const getCalorieDescription = (calories: number): string => {
  if (calories <= 1400) return "Weight loss focused";
  if (calories <= 1800) return "Moderate deficit";
  if (calories <= 2200) return "Maintenance";
  if (calories <= 2800) return "Active lifestyle";
  return "Muscle gain focused";
};

const getProteinDescription = (protein: number): string => {
  if (protein <= 60) return "Light activity";
  if (protein <= 100) return "Moderate activity";
  if (protein <= 140) return "Active lifestyle";
  return "Athletic/muscle building";
};

const getCarbDescription = (carbs: number): string => {
  if (carbs <= 100) return "Low carb focused";
  if (carbs <= 200) return "Moderate carbs";
  if (carbs <= 300) return "Balanced approach";
  return "High energy needs";
};

const getFatDescription = (fat: number): string => {
  if (fat <= 40) return "Low fat approach";
  if (fat <= 70) return "Moderate fats";
  if (fat <= 100) return "Balanced fats";
  return "Higher fat diet";
};

export const MacroGoalsScreen: React.FC = () => {
  const navigation = useNavigation<MacroGoalsNavigationProp>();
  const { isLoading, setMacroGoals } = useUserProfile();
  
  const [goals, setGoals] = useState<MacroGoals>({
    dailyCalories: 2000,
    dailyProtein: 80,
    dailyCarbs: 200,
    dailyFat: 60,
  });

  const handleGoalChange = (macro: keyof MacroGoals, value: number) => {
    setGoals(prev => ({ ...prev, [macro]: value }));
    HapticService.light();
  };

  const handleSaveGoals = async () => {
    HapticService.medium();
    try {
      await setMacroGoals({
        dailyCalorieGoal: goals.dailyCalories,
        dailyProteinGoal: goals.dailyProtein,
        dailyCarbsGoal: goals.dailyCarbs,
        dailyFatGoal: goals.dailyFat,
      });
      HapticService.success();
      navigation.navigate('Kitchen');
    } catch (error) {
      HapticService.error();
      Alert.alert(
        "Error",
        "Could not save your macro goals. Please try again."
      );
    }
  };

  const calculateMacroPercentages = () => {
    const proteinCals = goals.dailyProtein * 4;
    const carbsCals = goals.dailyCarbs * 4;
    const fatCals = goals.dailyFat * 9;
    const total = proteinCals + carbsCals + fatCals;
    
    return {
      protein: Math.round((proteinCals / total) * 100),
      carbs: Math.round((carbsCals / total) * 100),
      fat: Math.round((fatCals / total) * 100),
    };
  };

  const percentages = calculateMacroPercentages();

  return (
    <Box flex={1} backgroundColor="background">
      {/* Header */}
      <Box backgroundColor="primaryGreen" paddingTop="xxl" paddingBottom="lg" paddingHorizontal="md">
        <Text variant="h1" color="white" textAlign="center">
          🎯 Nutrition Goals
        </Text>
        <Text variant="body" color="white" textAlign="center" marginTop="xs" opacity={0.9}>
          Set your daily macro targets for personalized recipes
        </Text>
        
        {/* Progress indicator */}
        <Box flexDirection="row" justifyContent="center" marginTop="lg" gap="xs">
          <Box width={8} height={8} borderRadius="sm" backgroundColor="white" opacity={0.5} />
          <Box width={8} height={8} borderRadius="sm" backgroundColor="white" opacity={0.5} />
          <Box width={8} height={8} borderRadius="sm" backgroundColor="white" />
          <Box width={8} height={8} borderRadius="sm" backgroundColor="white" opacity={0.5} />
        </Box>
      </Box>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Box padding="md" gap="lg">
          {/* Macro Breakdown Summary */}
          <Box backgroundColor="surface" padding="md" borderRadius="lg" borderWidth={1} borderColor="border">
            <Text variant="h3" color="primaryText" marginBottom="sm">
              📊 Macro Breakdown
            </Text>
            <Box flexDirection="row" justifyContent="space-between">
              <Text variant="body" color="secondaryText">
                Protein: {percentages.protein}% • Carbs: {percentages.carbs}% • Fat: {percentages.fat}%
              </Text>
            </Box>
            <Text variant="caption" color="secondaryText" marginTop="xs">
              Total: {goals.dailyCalories} calories/day
            </Text>
          </Box>

          {/* Daily Calories */}
          <Box backgroundColor="surface" padding="md" borderRadius="lg" borderWidth={1} borderColor="border">
            <Text variant="h3" color="primaryText" marginBottom="sm">
              🔥 Daily Calories
            </Text>
            <Text variant="h2" color="primaryGreen" marginBottom="xs">
              {goals.dailyCalories} calories
            </Text>
            <Text variant="body" color="secondaryText" marginBottom="md">
              {getCalorieDescription(goals.dailyCalories)}
            </Text>
            <CustomSlider
              value={goals.dailyCalories}
              minimumValue={macroRanges.calories.min}
              maximumValue={macroRanges.calories.max}
              step={macroRanges.calories.step}
              onValueChange={(value: number) => handleGoalChange('dailyCalories', value)}
              minimumTrackTintColor='#2196f3'
              maximumTrackTintColor='#e3f2fd'
              thumbTintColor="#2196f3"
            />
          </Box>

          {/* Daily Protein */}
          <Box backgroundColor="surface" padding="md" borderRadius="lg" borderWidth={1} borderColor="border">
            <Text variant="h3" color="primaryText" marginBottom="sm">
              💪 Daily Protein
            </Text>
            <Text variant="h2" color="primaryGreen" marginBottom="xs">
              {goals.dailyProtein}g protein
            </Text>
            <Text variant="body" color="secondaryText" marginBottom="md">
              {getProteinDescription(goals.dailyProtein)}
            </Text>
            <CustomSlider
              value={goals.dailyProtein}
              minimumValue={macroRanges.protein.min}
              maximumValue={macroRanges.protein.max}
              step={macroRanges.protein.step}
              onValueChange={(value: number) => handleGoalChange('dailyProtein', value)}
              minimumTrackTintColor='#9c27b0'
              maximumTrackTintColor='#f3e5f5'
              thumbTintColor="#9c27b0"
            />
          </Box>

          {/* Daily Carbs */}
          <Box backgroundColor="surface" padding="md" borderRadius="lg" borderWidth={1} borderColor="border">
            <Text variant="h3" color="primaryText" marginBottom="sm">
              🌾 Daily Carbs
            </Text>
            <Text variant="h2" color="primaryGreen" marginBottom="xs">
              {goals.dailyCarbs}g carbs
            </Text>
            <Text variant="body" color="secondaryText" marginBottom="md">
              {getCarbDescription(goals.dailyCarbs)}
            </Text>
            <CustomSlider
              value={goals.dailyCarbs}
              minimumValue={macroRanges.carbs.min}
              maximumValue={macroRanges.carbs.max}
              step={macroRanges.carbs.step}
              onValueChange={(value: number) => handleGoalChange('dailyCarbs', value)}
              minimumTrackTintColor='#ff9800'
              maximumTrackTintColor='#fff3e0'
              thumbTintColor="#ff9800"
            />
          </Box>

          {/* Daily Fat */}
          <Box backgroundColor="surface" padding="md" borderRadius="lg" borderWidth={1} borderColor="border">
            <Text variant="h3" color="primaryText" marginBottom="sm">
              🥑 Daily Fats
            </Text>
            <Text variant="h2" color="primaryGreen" marginBottom="xs">
              {goals.dailyFat}g fats
            </Text>
            <Text variant="body" color="secondaryText" marginBottom="md">
              {getFatDescription(goals.dailyFat)}
            </Text>
            <CustomSlider
              value={goals.dailyFat}
              minimumValue={macroRanges.fat.min}
              maximumValue={macroRanges.fat.max}
              step={macroRanges.fat.step}
              onValueChange={(value: number) => handleGoalChange('dailyFat', value)}
              minimumTrackTintColor='#4caf50'
              maximumTrackTintColor='#e8f5e8'
              thumbTintColor="#4caf50"
            />
          </Box>

          {/* Help text */}
          <Box backgroundColor="surface" padding="md" borderRadius="lg" borderWidth={1} borderColor="border">
            <Text variant="h3" color="primaryText" marginBottom="sm">
              💡 How This Helps
            </Text>
            <Text variant="body" color="secondaryText" lineHeight={20}>
              Your macro goals help me suggest recipes that fit your nutritional needs. 
              I'll show you the nutrition info for each recipe and track your daily progress 
              towards these targets.
            </Text>
          </Box>
        </Box>
      </ScrollView>

      {/* Continue Button */}
      <Box padding="md" backgroundColor="surface" borderTopWidth={1} borderTopColor="border">
        <Button
          variant="primary"
          onPress={handleSaveGoals}
          disabled={isLoading}
          minHeight={48}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text variant="button" color="primaryButtonText">
              Continue to Kitchen Setup
            </Text>
          )}
        </Button>
      </Box>
    </Box>
  );
};