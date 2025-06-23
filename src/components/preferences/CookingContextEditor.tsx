import React from "react";
import { TouchableOpacity } from "react-native";
import { Box, Text, Card, Slider } from "../ui";
import { UserPreferences } from "../../types/userPreferences";

interface CookingContextEditorProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences['cookingContext']>) => void;
}

export const CookingContextEditor: React.FC<CookingContextEditorProps> = ({
  preferences,
  onUpdate,
}) => {
  const timeLabels = {
    1: "15 min",
    2: "30 min", 
    3: "45 min",
    4: "1 hour",
    5: "1+ hours",
  };

  const budgetLabels = {
    1: "$5-10",
    2: "$10-15",
    3: "$15-25", 
    4: "$25-35",
    5: "$35+",
  };

  const servingLabels = {
    1: "1-2 people",
    2: "3-4 people",
    3: "5-6 people",
    4: "7-8 people", 
    5: "8+ people",
  };

  return (
    <Box>
      {/* Typical Cook Time */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          ⏱️ Typical Cook Time
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          How much time do you usually have for cooking?
        </Text>
        <Slider
          value={preferences.cookingContext.typicalCookTime}
          onValueChange={(value) => onUpdate({ typicalCookTime: value })}
          minimumValue={1}
          maximumValue={5}
          step={1}
          trackColor="#E5E5E5"
          thumbColor="#4CAF50"
          minimumTrackTintColor="#4CAF50"
        />
        <Box flexDirection="row" justifyContent="space-between" marginTop="sm">
          <Text variant="caption" color="secondaryText">Quick</Text>
          <Text variant="body" color="primaryText" fontWeight="600">
            {timeLabels[preferences.cookingContext.typicalCookTime as keyof typeof timeLabels]}
          </Text>
          <Text variant="caption" color="secondaryText">Extended</Text>
        </Box>
      </Card>

      {/* Budget Per Meal */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          💰 Budget Per Meal
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          What's your typical spending range per meal?
        </Text>
        <Slider
          value={preferences.cookingContext.budgetPerMeal}
          onValueChange={(value) => onUpdate({ budgetPerMeal: value })}
          minimumValue={1}
          maximumValue={5}
          step={1}
          trackColor="#E5E5E5"
          thumbColor="#4CAF50"
          minimumTrackTintColor="#4CAF50"
        />
        <Box flexDirection="row" justifyContent="space-between" marginTop="sm">
          <Text variant="caption" color="secondaryText">Budget</Text>
          <Text variant="body" color="primaryText" fontWeight="600">
            {budgetLabels[preferences.cookingContext.budgetPerMeal as keyof typeof budgetLabels]}
          </Text>
          <Text variant="caption" color="secondaryText">Premium</Text>
        </Box>
      </Card>

      {/* Typical Serving Size */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          👥 Typical Serving Size
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          How many people do you usually cook for?
        </Text>
        <Slider
          value={preferences.cookingContext.typicalServingSize}
          onValueChange={(value) => onUpdate({ typicalServingSize: value })}
          minimumValue={1}
          maximumValue={5}
          step={1}
          trackColor="#E5E5E5"
          thumbColor="#4CAF50"
          minimumTrackTintColor="#4CAF50"
        />
        <Box flexDirection="row" justifyContent="space-between" marginTop="sm">
          <Text variant="caption" color="secondaryText">Solo</Text>
          <Text variant="body" color="primaryText" fontWeight="600">
            {servingLabels[preferences.cookingContext.typicalServingSize as keyof typeof servingLabels]}
          </Text>
          <Text variant="caption" color="secondaryText">Large Group</Text>
        </Box>
      </Card>

      {/* Lifestyle Preferences */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          🏃‍♀️ Lifestyle Preferences
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Select all that apply to your cooking needs
        </Text>
        <Box>
          {[
            { key: "mealPrep", label: "Meal Prep Friendly", icon: "📦" },
            { key: "quickCleanup", label: "Quick Cleanup", icon: "🧽" },
            { key: "makeAhead", label: "Make-Ahead Options", icon: "⏳" },
            { key: "freezerFriendly", label: "Freezer Friendly", icon: "🧊" },
          ].map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() =>
                onUpdate({
                  lifestylePreferences: {
                    ...preferences.cookingContext.lifestylePreferences,
                    [key]: !preferences.cookingContext.lifestylePreferences[
                      key as keyof typeof preferences.cookingContext.lifestylePreferences
                    ],
                  },
                })
              }
            >
              <Box
                flexDirection="row"
                alignItems="center"
                padding="sm"
                marginBottom="xs"
                backgroundColor={
                  preferences.cookingContext.lifestylePreferences[
                    key as keyof typeof preferences.cookingContext.lifestylePreferences
                  ]
                    ? "primaryGreen"
                    : "surface"
                }
                borderRadius="md"
              >
                <Text fontSize={20} marginRight="sm">
                  {icon}
                </Text>
                <Text
                  variant="body"
                  flex={1}
                  color={
                    preferences.cookingContext.lifestylePreferences[
                      key as keyof typeof preferences.cookingContext.lifestylePreferences
                    ]
                      ? "white"
                      : "primaryText"
                  }
                >
                  {label}
                </Text>
                <Text
                  variant="body"
                  color={
                    preferences.cookingContext.lifestylePreferences[
                      key as keyof typeof preferences.cookingContext.lifestylePreferences
                    ]
                      ? "white"
                      : "primaryText"
                  }
                >
                  {preferences.cookingContext.lifestylePreferences[
                    key as keyof typeof preferences.cookingContext.lifestylePreferences
                  ]
                    ? "✅"
                    : "⬜"}
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Box>
      </Card>
    </Box>
  );
};