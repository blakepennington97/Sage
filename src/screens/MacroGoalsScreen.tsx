import React from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Box } from "../components/ui";
import { MacroGoalsEditor, MacroGoals } from "../components/MacroGoalsEditor";
import { useUserProfile } from "../hooks/useUserProfile";
import { OnboardingStackParamList } from "../types/navigation";

type MacroGoalsNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'MacroGoals'
>;

export const MacroGoalsScreen: React.FC = () => {
  const navigation = useNavigation<MacroGoalsNavigationProp>();
  const { isLoading, setMacroGoals } = useUserProfile();

  const handleSaveGoals = async (goals: MacroGoals) => {
    await setMacroGoals({
      dailyCalorieGoal: goals.dailyCalories,
      dailyProteinGoal: goals.dailyProtein,
      dailyCarbsGoal: goals.dailyCarbs,
      dailyFatGoal: goals.dailyFat,
    });
    navigation.navigate('Kitchen');
  };

  return (
    <Box flex={1} backgroundColor="background">
      {/* Progress indicator */}
      <Box backgroundColor="primaryGreen" paddingTop="lg" paddingBottom="sm" paddingHorizontal="md">
        <Box flexDirection="row" justifyContent="center" gap="xs">
          <Box width={8} height={8} borderRadius="sm" backgroundColor="white" opacity={0.5} />
          <Box width={8} height={8} borderRadius="sm" backgroundColor="white" opacity={0.5} />
          <Box width={8} height={8} borderRadius="sm" backgroundColor="white" />
          <Box width={8} height={8} borderRadius="sm" backgroundColor="white" opacity={0.5} />
        </Box>
      </Box>
      
      <MacroGoalsEditor
        onSave={handleSaveGoals}
        isLoading={isLoading}
        showTDEECalculator={true}
        title="🎯 Nutrition Goals"
        subtitle="Set your daily macro targets for personalized recipes"
      />
    </Box>
  );
};