import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { Box, Text, Button, Card, BottomSheet } from "./ui";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useAuthStore } from "../stores/authStore";
import { MacroGoalsEditor, MacroGoals } from "./MacroGoalsEditor";
import { useUserProfile } from "../hooks/useUserProfile";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { DietaryPreferencesEditor } from "./preferences/DietaryPreferencesEditor";
import { CookingContextEditor } from "./preferences/CookingContextEditor";
import { KitchenCapabilitiesEditor } from "./preferences/KitchenCapabilitiesEditor";
import { CookingStylesEditor } from "./preferences/CookingStylesEditor";

interface PreferencesEditorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const PreferencesEditor: React.FC<PreferencesEditorProps> = ({
  isVisible,
  onClose,
}) => {
  const { profile } = useAuthStore();
  const {
    preferences,
    isLoading,
    updateDietaryPreferences,
    updateCookingContext,
    updateKitchenCapabilities,
    updateCookingStyles,
    initializePreferences,
  } = useUserPreferences();
  const { setMacroGoals, isLoading: macroLoading } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  React.useEffect(() => {
    if (!preferences && !isLoading) {
      initializePreferences();
    }
  }, [preferences, isLoading, initializePreferences]);

  React.useEffect(() => {
    if (isVisible) {
      setSelectedCategory(null);
    }
  }, [isVisible]);

  const categoryIcons = {
    macroGoals: "🎯",
    dietary: "🍽️",
    cookingContext: "⏰",
    kitchenCapabilities: "🔧",
    cookingStyles: "🌍",
  };

  const categoryTitles = {
    macroGoals: "Macro Goals",
    dietary: "Dietary & Health",
    cookingContext: "Cooking Context",
    kitchenCapabilities: "Kitchen & Skills",
    cookingStyles: "Cuisine & Style",
  };

  const categoryDescriptions = {
    macroGoals: "Daily calorie, protein, carbs, fat targets",
    dietary: "Allergies, diet style, nutrition goals",
    cookingContext: "Time, budget, serving sizes",
    kitchenCapabilities: "Appliances, storage, techniques",
    cookingStyles: "Cuisines, flavors, ingredients",
  };

  if (isLoading || !preferences) {
    return (
      <BottomSheet
        isVisible={isVisible}
        onClose={onClose}
        snapPoints={["90%", "95%"]}
      >
        <Box padding="lg" alignItems="center">
          <Text variant="h2" marginBottom="md">
            Loading Preferences...
          </Text>
        </Box>
      </BottomSheet>
    );
  }

  const renderCategoryOverview = () => (
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <Box padding="lg">
        <Text variant="h2" textAlign="center" marginBottom="md">
          🎛️ Edit Preferences
        </Text>
        <Text
          variant="body"
          textAlign="center"
          color="secondaryText"
          marginBottom="lg"
        >
          Customize your preferences to get better AI recipe recommendations
        </Text>
        {(Object.keys(categoryTitles) as (keyof typeof categoryTitles)[]).map(
          (category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
            >
              <Card variant="primary" marginBottom="md">
                <Box
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box flexDirection="row" alignItems="center" flex={1}>
                    <Text fontSize={32} marginRight="md">
                      {categoryIcons[category]}
                    </Text>
                    <Box flex={1}>
                      <Text variant="h3">{categoryTitles[category]}</Text>
                      <Text
                        variant="body"
                        color="secondaryText"
                        numberOfLines={2}
                      >
                        {categoryDescriptions[category]}
                      </Text>
                    </Box>
                  </Box>
                  <Text variant="h3" color="primary">
                    →
                  </Text>
                </Box>
              </Card>
            </TouchableOpacity>
          )
        )}
        <Box marginTop="lg">
          <Button variant="secondary" onPress={onClose}>
            <Text variant="button" color="primaryText">
              Done
            </Text>
          </Button>
        </Box>
      </Box>
    </BottomSheetScrollView>
  );

  const renderDietaryPreferences = () => (
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <Box padding="lg">
        <Box flexDirection="row" alignItems="center" marginBottom="lg">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text variant="h3" color="primary">
              ← Back
            </Text>
          </TouchableOpacity>
          <Text variant="h2" flex={1} textAlign="center">
            🍽️ Dietary Preferences
          </Text>
        </Box>
        <DietaryPreferencesEditor
          preferences={preferences}
          onUpdate={updateDietaryPreferences}
          profile={profile}
        />
      </Box>
    </BottomSheetScrollView>
  );

  const renderCookingContext = () => (
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <Box padding="lg">
        <Box flexDirection="row" alignItems="center" marginBottom="lg">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text variant="h3" color="primary">
              ← Back
            </Text>
          </TouchableOpacity>
          <Text variant="h2" flex={1} textAlign="center">
            ⏰ Cooking Context
          </Text>
        </Box>
        <CookingContextEditor
          preferences={preferences}
          onUpdate={updateCookingContext}
        />
      </Box>
    </BottomSheetScrollView>
  );

  const renderKitchenCapabilities = () => (
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <Box padding="lg">
        <Box flexDirection="row" alignItems="center" marginBottom="lg">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text variant="h3" color="primary">
              ← Back
            </Text>
          </TouchableOpacity>
          <Text variant="h2" flex={1} textAlign="center">
            🔧 Kitchen & Skills
          </Text>
        </Box>
        <KitchenCapabilitiesEditor
          preferences={preferences}
          onUpdate={updateKitchenCapabilities}
        />
      </Box>
    </BottomSheetScrollView>
  );

  const renderCookingStyles = () => (
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <Box padding="lg">
        <Box flexDirection="row" alignItems="center" marginBottom="lg">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text variant="h3" color="primary">
              ← Back
            </Text>
          </TouchableOpacity>
          <Text variant="h2" flex={1} textAlign="center">
            🌍 Cuisine & Style
          </Text>
        </Box>
        <CookingStylesEditor
          preferences={preferences}
          onUpdate={updateCookingStyles}
        />
      </Box>
    </BottomSheetScrollView>
  );

  const renderMacroGoals = () => {
    return (
      <MacroGoalsEditor
        onSave={async (goals: MacroGoals) => {
          await setMacroGoals({
            dailyCalorieGoal: goals.dailyCalories,
            dailyProteinGoal: goals.dailyProtein,
            dailyCarbsGoal: goals.dailyCarbs,
            dailyFatGoal: goals.dailyFat,
          });
          setSelectedCategory(null);
        }}
        onCancel={() => setSelectedCategory(null)}
        isLoading={macroLoading}
        initialGoals={
          profile?.macro_goals_set
            ? {
                dailyCalories: profile.daily_calorie_goal || 2000,
                dailyProtein: profile.daily_protein_goal || 100,
                dailyCarbs: profile.daily_carbs_goal || 200,
                dailyFat: profile.daily_fat_goal || 70,
              }
            : undefined
        }
        showTDEECalculator={true}
        title="🎯 Set Macro Goals"
        subtitle="Set your daily macro targets to track nutrition progress"
      />
    );
  };

  const renderSelectedCategory = () => {
    switch (selectedCategory) {
      case "macroGoals":
        return renderMacroGoals();
      case "dietary":
        return renderDietaryPreferences();
      case "cookingContext":
        return renderCookingContext();
      case "kitchenCapabilities":
        return renderKitchenCapabilities();
      case "cookingStyles":
        return renderCookingStyles();
      default:
        return renderCategoryOverview();
    }
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={["95%"]}
      scrollable={true}
    >
      {renderSelectedCategory()}
    </BottomSheet>
  );
};