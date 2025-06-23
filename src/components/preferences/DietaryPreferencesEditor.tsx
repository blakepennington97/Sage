import React, { useState } from "react";
import { TouchableOpacity, Alert } from "react-native";
import { Box, Text, Card } from "../ui";
import { UserPreferences } from "../../types/userPreferences";

interface DietaryPreferencesEditorProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences['dietary']>) => void;
  profile?: any;
}

export const DietaryPreferencesEditor: React.FC<DietaryPreferencesEditorProps> = ({
  preferences,
  onUpdate,
  profile,
}) => {
  const [customIngredientInput, setCustomIngredientInput] = useState("");

  const handleAddCustomFavoriteIngredient = () => {
    Alert.prompt(
      "Add Favorite Ingredient",
      "What ingredient would you like to add to your favorites?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: (ingredient) => {
            if (ingredient?.trim()) {
              const normalized = ingredient.trim().toLowerCase();
              if (!preferences.dietary.customFavoriteIngredients.includes(normalized)) {
                onUpdate({
                  customFavoriteIngredients: [
                    ...preferences.dietary.customFavoriteIngredients,
                    normalized,
                  ],
                });
              }
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleRemoveCustomFavoriteIngredient = (ingredient: string) => {
    onUpdate({
      customFavoriteIngredients: preferences.dietary.customFavoriteIngredients.filter(
        (item) => item !== ingredient
      ),
    });
  };

  const handleAddCustomAvoidedIngredient = () => {
    Alert.prompt(
      "Add Ingredient to Avoid",
      "What ingredient would you like to avoid in recipes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: (ingredient) => {
            if (ingredient?.trim()) {
              const normalized = ingredient.trim().toLowerCase();
              if (!preferences.dietary.customAvoidedIngredients.includes(normalized)) {
                onUpdate({
                  customAvoidedIngredients: [
                    ...preferences.dietary.customAvoidedIngredients,
                    normalized,
                  ],
                });
              }
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleRemoveCustomAvoidedIngredient = (ingredient: string) => {
    onUpdate({
      customAvoidedIngredients: preferences.dietary.customAvoidedIngredients.filter(
        (item) => item !== ingredient
      ),
    });
  };

  const handleAddCustomDietaryRestriction = () => {
    Alert.prompt(
      "Add Dietary Restriction",
      "Add a custom dietary restriction, allergy, or health objective:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: (restriction) => {
            if (restriction?.trim()) {
              const normalized = restriction.trim().toLowerCase();
              if (!preferences.dietary.customDietaryRestrictions.includes(normalized)) {
                onUpdate({
                  customDietaryRestrictions: [
                    ...preferences.dietary.customDietaryRestrictions,
                    normalized,
                  ],
                });
              }
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleRemoveCustomDietaryRestriction = (restriction: string) => {
    onUpdate({
      customDietaryRestrictions: preferences.dietary.customDietaryRestrictions.filter(
        (item) => item !== restriction
      ),
    });
  };

  return (
    <Box>
      {/* Dietary Style */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          Dietary Style
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Current: {preferences.dietary.dietaryStyle}
        </Text>
        {[
          "omnivore",
          "vegetarian",
          "vegan",
          "pescatarian",
          "keto",
          "paleo",
        ].map((style) => (
          <TouchableOpacity
            key={style}
            onPress={() => onUpdate({ dietaryStyle: style as any })}
          >
            <Box
              padding="sm"
              marginBottom="xs"
              backgroundColor={
                preferences.dietary.dietaryStyle === style ? "primary" : "surface"
              }
              borderRadius="md"
            >
              <Text
                variant="body"
                color={
                  preferences.dietary.dietaryStyle === style
                    ? "primaryButtonText"
                    : "primaryText"
                }
                textTransform="capitalize"
              >
                {style}
              </Text>
            </Box>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Spice Tolerance */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          Spice Tolerance
        </Text>
        <Box flexDirection="row" gap="sm">
          {(["mild", "medium", "hot", "fire"] as const).map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => onUpdate({ spiceTolerance: level })}
              style={{ flex: 1 }}
            >
              <Box
                padding="sm"
                backgroundColor={
                  preferences.dietary.spiceTolerance === level ? "primary" : "surface"
                }
                borderRadius="md"
                alignItems="center"
              >
                <Text
                  variant="body"
                  color={
                    preferences.dietary.spiceTolerance === level
                      ? "primaryButtonText"
                      : "primaryText"
                  }
                  textTransform="capitalize"
                >
                  {level}
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Box>
      </Card>

      {/* Health Goals */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          Health Goals
        </Text>
        <Box>
          <TouchableOpacity
            onPress={() =>
              onUpdate({
                nutritionGoals: {
                  ...preferences.dietary.nutritionGoals,
                  lowSodium: !preferences.dietary.nutritionGoals.lowSodium,
                },
              })
            }
          >
            <Box
              flexDirection="row"
              alignItems="center"
              padding="sm"
              marginBottom="xs"
            >
              <Text variant="body" flex={1}>
                Low Sodium
              </Text>
              <Text variant="body">
                {preferences.dietary.nutritionGoals.lowSodium ? "✅" : "⬜"}
              </Text>
            </Box>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              onUpdate({
                nutritionGoals: {
                  ...preferences.dietary.nutritionGoals,
                  highFiber: !preferences.dietary.nutritionGoals.highFiber,
                },
              })
            }
          >
            <Box flexDirection="row" alignItems="center" padding="sm">
              <Text variant="body" flex={1}>
                High Fiber
              </Text>
              <Text variant="body">
                {preferences.dietary.nutritionGoals.highFiber ? "✅" : "⬜"}
              </Text>
            </Box>
          </TouchableOpacity>
        </Box>
      </Card>

      {/* Safety Information */}
      <Card variant="secondary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          🛡️ Safety Information
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Your allergies and dietary restrictions from onboarding
        </Text>
        <Box
          backgroundColor="surface"
          padding="md"
          borderRadius="md"
          borderWidth={1}
          borderColor="border"
        >
          {profile?.allergies && profile.allergies.length > 0 ? (
            <Box marginBottom="md">
              <Text variant="body" fontWeight="600" marginBottom="xs">
                🚨 Allergies:
              </Text>
              <Text variant="body" color="error">
                {profile.allergies.join(", ")}
              </Text>
            </Box>
          ) : null}
          {profile?.dietary_restrictions && profile.dietary_restrictions.length > 0 ? (
            <Box>
              <Text variant="body" fontWeight="600" marginBottom="xs">
                🔒 Dietary Restrictions:
              </Text>
              <Text variant="body" color="primaryText">
                {profile.dietary_restrictions.join(", ")}
              </Text>
            </Box>
          ) : null}
          {(!profile?.allergies || profile.allergies.length === 0) &&
          (!profile?.dietary_restrictions || profile.dietary_restrictions.length === 0) ? (
            <Text variant="body" color="secondaryText" fontStyle="italic">
              No safety restrictions recorded
            </Text>
          ) : null}
        </Box>
      </Card>

      {/* Custom Favorite Ingredients */}
      <Card variant="primary" marginBottom="md">
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          marginBottom="sm"
        >
          <Text variant="h3">Custom Favorite Ingredients</Text>
          <TouchableOpacity onPress={handleAddCustomFavoriteIngredient}>
            <Text variant="body" color="primary" fontWeight="600">
              + Add
            </Text>
          </TouchableOpacity>
        </Box>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Add ingredients you especially enjoy
        </Text>
        <Box flexDirection="row" flexWrap="wrap" gap="xs">
          {preferences.dietary.customFavoriteIngredients.map((ingredient) => (
            <TouchableOpacity
              key={ingredient}
              onPress={() => handleRemoveCustomFavoriteIngredient(ingredient)}
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
                  {ingredient.replace(/_/g, " ")}
                </Text>
                <Text variant="caption" color="white">
                  ×
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
          {preferences.dietary.customFavoriteIngredients.length === 0 && (
            <Text variant="body" color="tertiaryText" fontStyle="italic">
              No custom favorites added yet
            </Text>
          )}
        </Box>
      </Card>

      {/* Custom Avoided Ingredients */}
      <Card variant="primary" marginBottom="md">
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          marginBottom="sm"
        >
          <Text variant="h3">Custom Avoided Ingredients</Text>
          <TouchableOpacity onPress={handleAddCustomAvoidedIngredient}>
            <Text variant="body" color="primary" fontWeight="600">
              + Add
            </Text>
          </TouchableOpacity>
        </Box>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Add ingredients you prefer to avoid
        </Text>
        <Box flexDirection="row" flexWrap="wrap" gap="xs">
          {preferences.dietary.customAvoidedIngredients.map((ingredient) => (
            <TouchableOpacity
              key={ingredient}
              onPress={() => handleRemoveCustomAvoidedIngredient(ingredient)}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                backgroundColor="error"
                paddingHorizontal="sm"
                paddingVertical="xs"
                borderRadius="md"
                marginBottom="xs"
              >
                <Text variant="caption" color="white" marginRight="xs">
                  {ingredient.replace(/_/g, " ")}
                </Text>
                <Text variant="caption" color="white">
                  ×
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
          {preferences.dietary.customAvoidedIngredients.length === 0 && (
            <Text variant="body" color="tertiaryText" fontStyle="italic">
              No custom avoided ingredients added yet
            </Text>
          )}
        </Box>
      </Card>

      {/* Custom Dietary Restrictions */}
      <Card variant="primary" marginBottom="md">
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          marginBottom="sm"
        >
          <Text variant="h3">Custom Dietary Restrictions</Text>
          <TouchableOpacity onPress={handleAddCustomDietaryRestriction}>
            <Text variant="body" color="primary" fontWeight="600">
              + Add
            </Text>
          </TouchableOpacity>
        </Box>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Add allergies, intolerances, or health objectives
        </Text>
        <Box flexDirection="row" flexWrap="wrap" gap="xs">
          {preferences.dietary.customDietaryRestrictions.map((restriction) => (
            <TouchableOpacity
              key={restriction}
              onPress={() => handleRemoveCustomDietaryRestriction(restriction)}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                backgroundColor="warning"
                paddingHorizontal="sm"
                paddingVertical="xs"
                borderRadius="md"
                marginBottom="xs"
              >
                <Text variant="caption" color="white" marginRight="xs">
                  {restriction.replace(/_/g, " ")}
                </Text>
                <Text variant="caption" color="white">
                  ×
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
          {preferences.dietary.customDietaryRestrictions.length === 0 && (
            <Text variant="body" color="tertiaryText" fontStyle="italic">
              No custom restrictions added yet
            </Text>
          )}
        </Box>
      </Card>
    </Box>
  );
};