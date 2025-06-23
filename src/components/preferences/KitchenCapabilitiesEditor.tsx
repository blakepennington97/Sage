import React, { useState } from "react";
import { TouchableOpacity, Alert } from "react-native";
import { Box, Text, Card, Slider, Input, Button } from "../ui";
import { UserPreferences } from "../../types/userPreferences";

interface KitchenCapabilitiesEditorProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences['kitchenCapabilities']>) => void;
}

export const KitchenCapabilitiesEditor: React.FC<KitchenCapabilitiesEditorProps> = ({
  preferences,
  onUpdate,
}) => {
  const [customApplianceInput, setCustomApplianceInput] = useState("");
  const [showCustomApplianceInput, setShowCustomApplianceInput] = useState(false);

  const skillLabels = {
    1: "Beginner",
    2: "Learning", 
    3: "Comfortable",
    4: "Experienced",
    5: "Expert",
  };

  const techniqueCategories = [
    { key: "basicKnife", label: "Basic Knife Skills", icon: "🔪" },
    { key: "sauteing", label: "Sautéing", icon: "🍳" },
    { key: "roasting", label: "Roasting", icon: "🔥" },
    { key: "baking", label: "Baking", icon: "🧁" },
    { key: "grilling", label: "Grilling", icon: "🥩" },
    { key: "steaming", label: "Steaming", icon: "💨" },
    { key: "stirFrying", label: "Stir Frying", icon: "🥘" },
    { key: "braising", label: "Braising", icon: "🍲" },
  ];

  const applianceCategories = [
    { key: "microwave", label: "Microwave", icon: "📱" },
    { key: "blender", label: "Blender", icon: "🌪️" },
    { key: "foodProcessor", label: "Food Processor", icon: "⚙️" },
    { key: "standMixer", label: "Stand Mixer", icon: "🥧" },
    { key: "airFryer", label: "Air Fryer", icon: "💨" },
    { key: "instantPot", label: "Instant Pot", icon: "⚡" },
    { key: "slowCooker", label: "Slow Cooker", icon: "🐌" },
    { key: "riceCooker", label: "Rice Cooker", icon: "🍚" },
    { key: "toasterOven", label: "Toaster Oven", icon: "🍞" },
    { key: "grill", label: "Outdoor Grill", icon: "🔥" },
  ];

  const handleAddCustomAppliance = () => {
    if (!customApplianceInput.trim()) return;
    
    const normalized = customApplianceInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!preferences.kitchenCapabilities.customAppliances.includes(normalized)) {
      onUpdate({
        customAppliances: [
          ...preferences.kitchenCapabilities.customAppliances,
          normalized,
        ],
      });
    }
    setCustomApplianceInput("");
    setShowCustomApplianceInput(false);
  };

  const handleRemoveCustomAppliance = (appliance: string) => {
    onUpdate({
      customAppliances: preferences.kitchenCapabilities.customAppliances.filter(
        (item) => item !== appliance
      ),
    });
  };

  return (
    <Box>
      {/* Overall Cooking Skill */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          👨‍🍳 Overall Cooking Skill
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          How would you rate your overall cooking experience?
        </Text>
        <Slider
          value={3}
          onValueChange={(value) => {}}
          minimumValue={1}
          maximumValue={5}
          step={1}
          thumbTintColor="#4CAF50"
          minimumTrackTintColor="#4CAF50"
        />
        <Box flexDirection="row" justifyContent="space-between" marginTop="sm">
          <Text variant="caption" color="secondaryText">New Cook</Text>
          <Text variant="body" color="primaryText" fontWeight="600">
            {skillLabels[3]}
          </Text>
          <Text variant="caption" color="secondaryText">Chef Level</Text>
        </Box>
      </Card>

      {/* Cooking Techniques */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          🎯 Cooking Techniques
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Which techniques are you comfortable with?
        </Text>
        <Box>
          {techniqueCategories.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => {}}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                padding="sm"
                marginBottom="xs"
                backgroundColor="surface"
                borderRadius="md"
              >
                <Text fontSize={20} marginRight="sm">
                  {icon}
                </Text>
                <Text
                  variant="body"
                  flex={1}
                  color="primaryText"
                >
                  {label}
                </Text>
                <Text
                  variant="body"
                  color="primaryText"
                >
                  ⬜
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Box>
      </Card>

      {/* Available Appliances */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          🏠 Available Appliances
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          What kitchen appliances do you have access to?
        </Text>
        <Box>
          {applianceCategories.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => {}}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                padding="sm"
                marginBottom="xs"
                backgroundColor="surface"
                borderRadius="md"
              >
                <Text fontSize={20} marginRight="sm">
                  {icon}
                </Text>
                <Text
                  variant="body"
                  flex={1}
                  color="primaryText"
                >
                  {label}
                </Text>
                <Text
                  variant="body"
                  color="primaryText"
                >
                  ⬜
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Box>
      </Card>

      {/* Custom Appliances */}
      <Card variant="primary" marginBottom="md">
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          marginBottom="sm"
        >
          <Text variant="h3">Custom Appliances</Text>
          <TouchableOpacity onPress={() => setShowCustomApplianceInput(true)}>
            <Text variant="body" color="primary" fontWeight="600">
              + Add
            </Text>
          </TouchableOpacity>
        </Box>
        <Text variant="body" color="secondaryText" marginBottom="md">
          Add appliances not listed above
        </Text>

        {showCustomApplianceInput && (
          <Box marginBottom="md">
            <Input
              value={customApplianceInput}
              onChangeText={setCustomApplianceInput}
              placeholder="e.g., Pasta Machine, Dehydrator"
              backgroundColor="surface"
              borderRadius="md"
              padding="sm"
              marginBottom="sm"
            />
            <Box flexDirection="row" gap="sm">
              <Button variant="primary" flex={1} onPress={handleAddCustomAppliance}>
                <Text variant="button" color="primaryButtonText">Add</Text>
              </Button>
              <Button
                variant="secondary"
                flex={1}
                onPress={() => {
                  setShowCustomApplianceInput(false);
                  setCustomApplianceInput("");
                }}
              >
                <Text variant="button" color="primaryText">Cancel</Text>
              </Button>
            </Box>
          </Box>
        )}

        <Box flexDirection="row" flexWrap="wrap" gap="xs">
          {preferences.kitchenCapabilities.customAppliances.map((appliance) => (
            <TouchableOpacity
              key={appliance}
              onPress={() => handleRemoveCustomAppliance(appliance)}
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
                  {appliance.replace(/_/g, " ")}
                </Text>
                <Text variant="caption" color="white">
                  ×
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
          {preferences.kitchenCapabilities.customAppliances.length === 0 && (
            <Text variant="body" color="tertiaryText" fontStyle="italic">
              No custom appliances added yet
            </Text>
          )}
        </Box>
      </Card>

      {/* Storage Space */}
      <Card variant="primary" marginBottom="md">
        <Text variant="h3" marginBottom="sm">
          📦 Storage & Prep Space
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          How much storage and prep space do you have?
        </Text>
        <Box>
          {[
            { key: "minimal", label: "Minimal - Very limited space", icon: "📱" },
            { key: "compact", label: "Compact - Basic storage", icon: "📦" },
            { key: "adequate", label: "Adequate - Good storage", icon: "🏠" },
            { key: "spacious", label: "Spacious - Lots of space", icon: "🏰" },
          ].map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => {}}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                padding="sm"
                marginBottom="xs"
                backgroundColor="surface"
                borderRadius="md"
              >
                <Text fontSize={20} marginRight="sm">
                  {icon}
                </Text>
                <Text
                  variant="body"
                  flex={1}
                  color="primaryText"
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