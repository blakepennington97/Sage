import React, { useState } from "react";
import { Alert, TouchableOpacity } from "react-native";
import { Box, Text, Button, Input, Card } from "./ui";
import {
  TDEECalculator,
  UserPhysicalData,
  MacroRecommendations,
} from "../utils/tdeeCalculator";
import { HapticService } from "../services/haptics";

export interface MacroGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

interface MacroGoalsEditorProps {
  initialGoals?: Partial<MacroGoals>;
  onSave: (goals: MacroGoals) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showTDEECalculator?: boolean;
  title?: string;
  subtitle?: string;
}

const GOAL_OPTIONS = [
  {
    key: "weight_loss",
    label: "Weight Loss",
    emoji: "📉",
    description: "Lose 1-2 lbs per week",
  },
  {
    key: "maintenance",
    label: "Maintain Weight",
    emoji: "⚖️",
    description: "Maintain current weight",
  },
  {
    key: "muscle_gain",
    label: "Muscle Gain",
    emoji: "💪",
    description: "Gain muscle and strength",
  },
] as const;

export const MacroGoalsEditor: React.FC<MacroGoalsEditorProps> = ({
  initialGoals,
  onSave,
  onCancel,
  isLoading = false,
  showTDEECalculator = true,
  title = "🎯 Nutrition Goals",
  subtitle = "Set your daily macro targets for personalized recipes",
}) => {
  const [goals, setGoals] = useState<MacroGoals>({
    dailyCalories: initialGoals?.dailyCalories || 2000,
    dailyProtein: initialGoals?.dailyProtein || 80,
    dailyCarbs: initialGoals?.dailyCarbs || 200,
    dailyFat: initialGoals?.dailyFat || 60,
  });
  const [showCalculator, setShowCalculator] = useState(false);
  const [physicalData, setPhysicalData] = useState<Partial<UserPhysicalData>>({
    age: undefined,
    weight: undefined,
    height: undefined,
    gender: undefined,
    activityLevel: "moderately_active",
  });
  const [selectedGoal, setSelectedGoal] = useState<
    "weight_loss" | "maintenance" | "muscle_gain"
  >("maintenance");
  const [recommendations, setRecommendations] =
    useState<MacroRecommendations | null>(null);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  const handleGoalChange = (macro: keyof MacroGoals, value: string) => {
    const numValue = parseInt(value) || 0;
    setGoals((prev) => ({ ...prev, [macro]: numValue }));
    if (inputErrors[macro]) {
      setInputErrors((prev) => ({ ...prev, [macro]: "" }));
    }
  };

  const validateGoals = (): boolean => {
    const errors: Record<string, string> = {};
    if (goals.dailyCalories < 1200 || goals.dailyCalories > 4000) {
      errors.dailyCalories = "Calories must be between 1200-4000";
    }
    if (goals.dailyProtein < 30 || goals.dailyProtein > 300) {
      errors.dailyProtein = "Protein must be between 30-300g";
    }
    if (goals.dailyCarbs < 20 || goals.dailyCarbs > 500) {
      errors.dailyCarbs = "Carbs must be between 20-500g";
    }
    if (goals.dailyFat < 20 || goals.dailyFat > 200) {
      errors.dailyFat = "Fat must be between 20-200g";
    }
    const proteinCals = goals.dailyProtein * 4;
    const carbsCals = goals.dailyCarbs * 4;
    const fatCals = goals.dailyFat * 9;
    const totalMacroCals = proteinCals + carbsCals + fatCals;
    if (Math.abs(totalMacroCals - goals.dailyCalories) > 200) {
      errors.dailyCalories = "Macro calories don't match total calories";
    }
    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveGoals = async () => {
    if (!validateGoals()) {
      HapticService.error();
      return;
    }
    HapticService.medium();
    try {
      await onSave(goals);
      HapticService.success();
    } catch (error) {
      HapticService.error();
      Alert.alert(
        "Error",
        "Could not save your macro goals. Please try again."
      );
    }
  };

  const calculateTDEE = () => {
    const errors = TDEECalculator.validateUserData(physicalData);
    if (errors.length > 0) {
      Alert.alert("Invalid Input", errors.join("\n"));
      return;
    }
    const fullData = physicalData as UserPhysicalData;
    const recs = TDEECalculator.generateMacroRecommendations(fullData);
    setRecommendations(recs);
    const smartDefaults = TDEECalculator.getSmartDefaults(
      fullData,
      selectedGoal
    );
    setGoals({
      dailyCalories: smartDefaults.calories,
      dailyProtein: smartDefaults.protein,
      dailyCarbs: smartDefaults.carbs,
      dailyFat: smartDefaults.fat,
    });
    HapticService.success();
    setShowCalculator(false);
  };

  const calculateMacroPercentages = () => {
    const proteinCals = goals.dailyProtein * 4;
    const carbsCals = goals.dailyCarbs * 4;
    const fatCals = goals.dailyFat * 9;
    const total = proteinCals + carbsCals + fatCals;
    if (total === 0) return { protein: 0, carbs: 0, fat: 0 };
    return {
      protein: Math.round((proteinCals / total) * 100),
      carbs: Math.round((carbsCals / total) * 100),
      fat: Math.round((fatCals / total) * 100),
    };
  };
  const percentages = calculateMacroPercentages();

  const renderTDEECalculator = () => (
    <Card variant="primary" marginBottom="md">
      <Text variant="h3" marginBottom="sm">
        🧮 TDEE Calculator
      </Text>
      <Text variant="body" color="secondaryText" marginBottom="md">
        Calculate your recommended calories based on your stats and activity
        level
      </Text>
      <Text variant="body" fontWeight="600" marginBottom="xs">
        Health Goal
      </Text>
      <Box flexDirection="row" flexWrap="wrap" gap="xs" marginBottom="md">
        {GOAL_OPTIONS.map(({ key, label, emoji, description }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSelectedGoal(key)}
            style={{ width: "48%" }}
          >
            <Box
              padding="sm"
              backgroundColor={selectedGoal === key ? "primary" : "surface"}
              borderRadius="md"
              borderWidth={1}
              borderColor={selectedGoal === key ? "primary" : "border"}
              minHeight={60}
            >
              <Text
                variant="body"
                color={
                  selectedGoal === key ? "primaryButtonText" : "primaryText"
                }
                textAlign="center"
                marginBottom="xs"
              >
                {emoji} {label}
              </Text>
              <Text
                variant="caption"
                color={
                  selectedGoal === key ? "primaryButtonText" : "secondaryText"
                }
                textAlign="center"
                fontSize={11}
              >
                {description}
              </Text>
            </Box>
          </TouchableOpacity>
        ))}
      </Box>
      <Box flexDirection="row" gap="sm" marginBottom="md">
        <Box flex={1}>
          <Text variant="body" fontWeight="600" marginBottom="xs">
            Age
          </Text>
          <Input
            value={physicalData.age?.toString() || ""}
            onChangeText={(text) =>
              setPhysicalData((prev) => ({
                ...prev,
                age: parseInt(text) || undefined,
              }))
            }
            placeholder="25"
            keyboardType="numeric"
            backgroundColor="surface"
            borderRadius="md"
            padding="sm"
            textAlign="center"
            color="primaryText"
          />
        </Box>
        <Box flex={1}>
          <Text variant="body" fontWeight="600" marginBottom="xs">
            Weight (kg)
          </Text>
          <Input
            value={physicalData.weight?.toString() || ""}
            onChangeText={(text) =>
              setPhysicalData((prev) => ({
                ...prev,
                weight: parseFloat(text) || undefined,
              }))
            }
            placeholder="70"
            keyboardType="numeric"
            backgroundColor="surface"
            borderRadius="md"
            padding="sm"
            textAlign="center"
            color="primaryText"
          />
        </Box>
      </Box>
      <Box flexDirection="row" gap="sm" marginBottom="md">
        <Box flex={1}>
          <Text variant="body" fontWeight="600" marginBottom="xs">
            Height (cm)
          </Text>
          <Input
            value={physicalData.height?.toString() || ""}
            onChangeText={(text) =>
              setPhysicalData((prev) => ({
                ...prev,
                height: parseInt(text) || undefined,
              }))
            }
            placeholder="170"
            keyboardType="numeric"
            backgroundColor="surface"
            borderRadius="md"
            padding="sm"
            textAlign="center"
            color="primaryText"
          />
        </Box>
        <Box flex={1}>
          <Text variant="body" fontWeight="600" marginBottom="xs">
            Gender
          </Text>
          <Box flexDirection="row" gap="xs">
            {(["male", "female", "other"] as const).map((gender) => (
              <TouchableOpacity
                key={gender}
                onPress={() => setPhysicalData((prev) => ({ ...prev, gender }))}
                style={{ flex: 1 }}
              >
                <Box
                  padding="xs"
                  backgroundColor={
                    physicalData.gender === gender ? "primary" : "surface"
                  }
                  borderRadius="md"
                  alignItems="center"
                >
                  <Text
                    variant="caption"
                    color={
                      physicalData.gender === gender
                        ? "primaryButtonText"
                        : "primaryText"
                    }
                    textTransform="capitalize"
                  >
                    {gender}
                  </Text>
                </Box>
              </TouchableOpacity>
            ))}
          </Box>
        </Box>
      </Box>
      <Text variant="body" fontWeight="600" marginBottom="xs">
        Activity Level
      </Text>
      <Box gap="xs" marginBottom="md">
        {(
          Object.keys(TDEECalculator.getActivityDescriptions()) as (
            | "sedentary"
            | "lightly_active"
            | "moderately_active"
            | "very_active"
            | "extremely_active"
          )[]
        ).map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() =>
              setPhysicalData((prev) => ({ ...prev, activityLevel: level }))
            }
          >
            <Box
              padding="sm"
              backgroundColor={
                physicalData.activityLevel === level ? "primary" : "surface"
              }
              borderRadius="md"
              borderWidth={1}
              borderColor={
                physicalData.activityLevel === level ? "primary" : "border"
              }
            >
              <Text
                variant="body"
                color={
                  physicalData.activityLevel === level
                    ? "primaryButtonText"
                    : "primaryText"
                }
                textTransform="capitalize"
                marginBottom="xs"
              >
                {level.replace("_", " ")}
              </Text>
              <Text
                variant="caption"
                color={
                  physicalData.activityLevel === level
                    ? "primaryButtonText"
                    : "secondaryText"
                }
              >
                {TDEECalculator.getActivityDescriptions()[level]}
              </Text>
            </Box>
          </TouchableOpacity>
        ))}
      </Box>
      <Box flexDirection="row" gap="sm">
        <Button variant="primary" flex={1} onPress={calculateTDEE}>
          <Text variant="button" color="primaryButtonText">
            Calculate
          </Text>
        </Button>
        <Button
          variant="secondary"
          flex={1}
          onPress={() => setShowCalculator(false)}
        >
          <Text variant="button" color="primaryText">
            Cancel
          </Text>
        </Button>
      </Box>
    </Card>
  );

  const renderContent = () => (
    <Box>
      <Box
        backgroundColor="primaryGreen"
        paddingTop="lg"
        paddingBottom="md"
        paddingHorizontal="md"
      >
        <Text variant="h1" color="white" textAlign="center">
          {title}
        </Text>
        <Text
          variant="body"
          color="white"
          textAlign="center"
          marginTop="xs"
          opacity={0.9}
        >
          {subtitle}
        </Text>
      </Box>
      <Box padding="md" gap="lg">
        {showTDEECalculator &&
          (showCalculator ? (
            renderTDEECalculator()
          ) : (
            <Card variant="secondary">
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box flex={1}>
                  <Text variant="h3" marginBottom="xs">
                    🧮 Smart Calculator
                  </Text>
                  <Text variant="body" color="secondaryText" fontSize={14}>
                    Calculate ideal calories based on your stats
                  </Text>
                </Box>
                <Button
                  variant="primary"
                  onPress={() => setShowCalculator(true)}
                >
                  <Text variant="button" color="primaryButtonText">
                    Calculate
                  </Text>
                </Button>
              </Box>
            </Card>
          ))}
        <Box
          backgroundColor="surface"
          padding="md"
          borderRadius="lg"
          borderWidth={1}
          borderColor="border"
        >
          <Text variant="h3" color="primaryText" marginBottom="sm">
            📊 Macro Breakdown
          </Text>
          <Box flexDirection="row" justifyContent="space-between">
            <Text variant="body" color="secondaryText">
              Protein: {percentages.protein}% • Carbs: {percentages.carbs}% •
              Fat: {percentages.fat}%
            </Text>
          </Box>
          <Text variant="caption" color="secondaryText" marginTop="xs">
            Total: {goals.dailyCalories} calories/day
          </Text>
        </Box>
        <Box gap="md">
          <Box
            backgroundColor="surface"
            padding="md"
            borderRadius="lg"
            borderWidth={1}
            borderColor="border"
          >
            <Text variant="h3" color="primaryText" marginBottom="sm">
              🔥 Daily Calories
            </Text>
            <Input
              value={goals.dailyCalories.toString()}
              onChangeText={(value) => handleGoalChange("dailyCalories", value)}
              placeholder="2000"
              keyboardType="numeric"
              backgroundColor="background"
              borderRadius="md"
              padding="md"
              fontSize={24}
              fontWeight="600"
              textAlign="center"
              color="primaryGreen"
              marginBottom="sm"
              borderWidth={inputErrors.dailyCalories ? 2 : 1}
              borderColor={inputErrors.dailyCalories ? "error" : "border"}
            />
            {inputErrors.dailyCalories && (
              <Text variant="caption" color="error" marginBottom="sm">
                {inputErrors.dailyCalories}
              </Text>
            )}
            <Text variant="body" color="secondaryText" textAlign="center">
              Recommended: 1200-4000 calories
            </Text>
          </Box>
          <Box
            backgroundColor="surface"
            padding="md"
            borderRadius="lg"
            borderWidth={1}
            borderColor="border"
          >
            <Text variant="h3" color="primaryText" marginBottom="sm">
              💪 Daily Protein
            </Text>
            <Input
              value={goals.dailyProtein.toString()}
              onChangeText={(value) => handleGoalChange("dailyProtein", value)}
              placeholder="80"
              keyboardType="numeric"
              backgroundColor="background"
              borderRadius="md"
              padding="md"
              fontSize={24}
              fontWeight="600"
              textAlign="center"
              color="primary"
              marginBottom="sm"
              borderWidth={inputErrors.dailyProtein ? 2 : 1}
              borderColor={inputErrors.dailyProtein ? "error" : "border"}
            />
            {inputErrors.dailyProtein && (
              <Text variant="caption" color="error" marginBottom="sm">
                {inputErrors.dailyProtein}
              </Text>
            )}
            <Text variant="body" color="secondaryText" textAlign="center">
              Recommended: 30-300g (0.8-2.2g per kg body weight)
            </Text>
          </Box>
          <Box
            backgroundColor="surface"
            padding="md"
            borderRadius="lg"
            borderWidth={1}
            borderColor="border"
          >
            <Text variant="h3" color="primaryText" marginBottom="sm">
              🌾 Daily Carbs
            </Text>
            <Input
              value={goals.dailyCarbs.toString()}
              onChangeText={(value) => handleGoalChange("dailyCarbs", value)}
              placeholder="200"
              keyboardType="numeric"
              backgroundColor="background"
              borderRadius="md"
              padding="md"
              fontSize={24}
              fontWeight="600"
              textAlign="center"
              color="primary"
              marginBottom="sm"
              borderWidth={inputErrors.dailyCarbs ? 2 : 1}
              borderColor={inputErrors.dailyCarbs ? "error" : "border"}
            />
            {inputErrors.dailyCarbs && (
              <Text variant="caption" color="error" marginBottom="sm">
                {inputErrors.dailyCarbs}
              </Text>
            )}
            <Text variant="body" color="secondaryText" textAlign="center">
              Recommended: 20-500g (45-65% of calories)
            </Text>
          </Box>
          <Box
            backgroundColor="surface"
            padding="md"
            borderRadius="lg"
            borderWidth={1}
            borderColor="border"
          >
            <Text variant="h3" color="primaryText" marginBottom="sm">
              🥑 Daily Fats
            </Text>
            <Input
              value={goals.dailyFat.toString()}
              onChangeText={(value) => handleGoalChange("dailyFat", value)}
              placeholder="60"
              keyboardType="numeric"
              backgroundColor="background"
              borderRadius="md"
              padding="md"
              fontSize={24}
              fontWeight="600"
              textAlign="center"
              color="primaryGreen"
              marginBottom="sm"
              borderWidth={inputErrors.dailyFat ? 2 : 1}
              borderColor={inputErrors.dailyFat ? "error" : "border"}
            />
            {inputErrors.dailyFat && (
              <Text variant="caption" color="error" marginBottom="sm">
                {inputErrors.dailyFat}
              </Text>
            )}
            <Text variant="body" color="secondaryText" textAlign="center">
              Recommended: 20-200g (20-35% of calories)
            </Text>
          </Box>
        </Box>
        <Box
          backgroundColor="surface"
          padding="md"
          borderRadius="lg"
          borderWidth={1}
          borderColor="border"
        >
          <Text variant="h3" color="primaryText" marginBottom="sm">
            💡 How This Helps
          </Text>
          <Text variant="body" color="secondaryText" lineHeight={20}>
            Your macro goals help me suggest recipes that fit your nutritional
            needs. I'll show you the nutrition info for each recipe and track
            your daily progress towards these targets.
          </Text>
        </Box>
        <Box
          padding="md"
          backgroundColor="surface"
          borderRadius="lg"
          borderWidth={1}
          borderColor="border"
          marginTop="lg"
        >
          <Box flexDirection="row" gap="sm">
            {onCancel && (
              <Button
                variant="secondary"
                flex={1}
                onPress={onCancel}
                disabled={isLoading}
              >
                <Text variant="button" color="primaryText">
                  Cancel
                </Text>
              </Button>
            )}
            <Button
              variant="primary"
              flex={onCancel ? 1 : undefined}
              onPress={handleSaveGoals}
              disabled={isLoading}
              minHeight={48}
            >
              <Text variant="button" color="primaryButtonText">
                Save Goals
              </Text>
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return <Box flex={1}>{renderContent()}</Box>;
};
