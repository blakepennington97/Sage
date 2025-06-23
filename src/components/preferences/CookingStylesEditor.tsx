import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { Box, Text, Card, Input, Button } from "../ui";
import { UserPreferences } from "../../types/userPreferences";

interface CookingStylesEditorProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences['cookingStyles']>) => void;
}

export const CookingStylesEditor: React.FC<CookingStylesEditorProps> = ({
  preferences,
  onUpdate,
}) => {
  const [customCuisineInput, setCustomCuisineInput] = useState("");
  const [showCustomCuisineInput, setShowCustomCuisineInput] = useState(false);

  const cuisineCategories = [
    { key: "italian", label: "Italian", icon: "🍝" },
    { key: "mexican", label: "Mexican", icon: "🌮" },
    { key: "asian", label: "Asian", icon: "🥢" },
    { key: "mediterranean", label: "Mediterranean", icon: "🫒" },
    { key: "american", label: "American", icon: "🍔" },
    { key: "indian", label: "Indian", icon: "🍛" },
    { key: "french", label: "French", icon: "🥐" },
    { key: "thai", label: "Thai", icon: "🍜" },
    { key: "japanese", label: "Japanese", icon: "🍣" },
    { key: "chinese", label: "Chinese", icon: "🥟" },
    { key: "korean", label: "Korean", icon: "🍲" },
    { key: "middle_eastern", label: "Middle Eastern", icon: "🧆" },
  ];

  const moodCategories = [
    { key: "comfort", label: "Comfort Food", icon: "🤗" },
    { key: "healthy", label: "Healthy & Light", icon: "🥗" },
    { key: "adventurous", label: "Adventurous", icon: "🌟" },
    { key: "quick", label: "Quick & Simple", icon: "⚡" },
    { key: "indulgent", label: "Indulgent", icon: "🍰" },
    { key: "fresh", label: "Fresh & Seasonal", icon: "🌱" },
    { key: "hearty", label: "Hearty & Filling", icon: "🍖" },
    { key: "elegant", label: "Elegant & Refined", icon: "✨" },
  ];

  const handleAddCustomCuisine = () => {
    if (!customCuisineInput.trim()) return;
    
    const normalized = customCuisineInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!preferences.cookingStyles.customCuisines.includes(normalized)) {
      onUpdate({
        customCuisines: [
          ...preferences.cookingStyles.customCuisines,
          normalized,
        ],
      });
    }
    setCustomCuisineInput("");
    setShowCustomCuisineInput(false);
  };

  const handleRemoveCustomCuisine = (cuisine: string) => {
    onUpdate({
      customCuisines: preferences.cookingStyles.customCuisines.filter(
        (item) => item !== cuisine
      ),
    });
  };

  return (
    <Box>
      {/* Preferred Cuisines */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          🌍 Preferred Cuisines
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          What types of cuisine do you enjoy?
        </Text>
        <Box>
          {cuisineCategories.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() =>
                onUpdate({
                  preferredCuisines: preferences.cookingStyles.preferredCuisines.includes(key)
                    ? preferences.cookingStyles.preferredCuisines.filter(c => c !== key)
                    : [...preferences.cookingStyles.preferredCuisines, key],
                })
              }
            >
              <Box
                flexDirection="row"
                alignItems="center"
                padding="sm"
                marginBottom="xs"
                backgroundColor={
                  preferences.cookingStyles.preferredCuisines.includes(key)
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
                    preferences.cookingStyles.preferredCuisines.includes(key)
                      ? "white"
                      : "primaryText"
                  }
                >
                  {label}
                </Text>
                <Text
                  variant="body"
                  color={
                    preferences.cookingStyles.preferredCuisines.includes(key)
                      ? "white"
                      : "primaryText"
                  }
                >
                  {preferences.cookingStyles.preferredCuisines.includes(key) ? "✅" : "⬜"}
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Box>
      </Card>

      {/* Custom Cuisines */}
      <Card variant="primary" marginBottom="md">
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          marginBottom="sm"
        >
          <Text variant="h3">Custom Cuisines</Text>
          <TouchableOpacity onPress={() => setShowCustomCuisineInput(true)}>
            <Text variant="body" color="primary" fontWeight="600">
              + Add
            </Text>
          </TouchableOpacity>
        </Box>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Add cuisines not listed above
        </Text>

        {showCustomCuisineInput && (
          <Box marginBottom="md">
            <Input
              value={customCuisineInput}
              onChangeText={setCustomCuisineInput}
              placeholder="e.g., Ethiopian, Peruvian, Fusion"
              backgroundColor="surface"
              borderRadius="md"
              padding="sm"
              marginBottom="sm"
            />
            <Box flexDirection="row" gap="sm">
              <Button variant="primary" flex={1} onPress={handleAddCustomCuisine}>
                <Text variant="button" color="primaryButtonText">Add</Text>
              </Button>
              <Button
                variant="secondary"
                flex={1}
                onPress={() => {
                  setShowCustomCuisineInput(false);
                  setCustomCuisineInput("");
                }}
              >
                <Text variant="button" color="primaryText">Cancel</Text>
              </Button>
            </Box>
          </Box>
        )}

        <Box flexDirection="row" flexWrap="wrap" gap="xs">
          {preferences.cookingStyles.customCuisines.map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              onPress={() => handleRemoveCustomCuisine(cuisine)}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                backgroundColor="primaryGreen"
                paddingHorizontal="sm"
                paddingVertical="xs"
                borderRadius="md"
                marginBottom="xs"
              >
                <Text variant="caption" color="white" marginRight="xs">
                  {cuisine.replace(/_/g, " ")}
                </Text>
                <Text variant="caption" color="white">
                  ×
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
          {preferences.cookingStyles.customCuisines.length === 0 && (
            <Text variant="body" color="tertiaryText" fontStyle="italic">
              No custom cuisines added yet
            </Text>
          )}
        </Box>
      </Card>

      {/* Cooking Moods */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          🎭 Cooking Moods
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          What cooking styles match your mood?
        </Text>
        <Box>
          {moodCategories.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() =>
                onUpdate({
                  cookingMoods: preferences.cookingStyles.cookingMoods.includes(key)
                    ? preferences.cookingStyles.cookingMoods.filter(m => m !== key)
                    : [...preferences.cookingStyles.cookingMoods, key],
                })
              }
            >
              <Box
                flexDirection="row"
                alignItems="center"
                padding="sm"
                marginBottom="xs"
                backgroundColor={
                  preferences.cookingStyles.cookingMoods.includes(key)
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
                    preferences.cookingStyles.cookingMoods.includes(key)
                      ? "white"
                      : "primaryText"
                  }
                >
                  {label}
                </Text>
                <Text
                  variant="body"
                  color={
                    preferences.cookingStyles.cookingMoods.includes(key)
                      ? "white"
                      : "primaryText"
                  }
                >
                  {preferences.cookingStyles.cookingMoods.includes(key) ? "✅" : "⬜"}
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Box>
      </Card>

      {/* Flavor Intensity */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          🎯 Flavor Preferences
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          What flavor profiles do you enjoy?
        </Text>
        <Box>
          {[
            { key: "bold", label: "Bold & Intense", icon: "🔥" },
            { key: "mild", label: "Mild & Subtle", icon: "🌿" },
            { key: "balanced", label: "Balanced & Harmonious", icon: "⚖️" },
            { key: "complex", label: "Complex & Layered", icon: "🌀" },
          ].map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => onUpdate({ flavorIntensity: key as any })}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                padding="sm"
                marginBottom="xs"
                backgroundColor={
                  preferences.cookingStyles.flavorIntensity === key
                    ? "primary"
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
                    preferences.cookingStyles.flavorIntensity === key
                      ? "primaryButtonText"
                      : "primaryText"
                  }
                >
                  {label}
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Box>
      </Card>
    </Box>
  );
};