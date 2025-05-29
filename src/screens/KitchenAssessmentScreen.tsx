// src/screens/KitchenAssessmentScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { UserProfileService } from "../services/userProfile";

const { width } = Dimensions.get("window");

interface KitchenTool {
  id: string;
  name: string;
  emoji: string;
  category: "essential" | "helpful" | "advanced";
  description: string;
}

const kitchenTools: KitchenTool[] = [
  // Essential
  {
    id: "chef_knife",
    name: "Chef Knife",
    emoji: "🔪",
    category: "essential",
    description: "Sharp kitchen knife",
  },
  {
    id: "cutting_board",
    name: "Cutting Board",
    emoji: "🟫",
    category: "essential",
    description: "For chopping prep",
  },
  {
    id: "measuring_cups",
    name: "Measuring Cups",
    emoji: "🥤",
    category: "essential",
    description: "For accurate portions",
  },
  {
    id: "mixing_bowls",
    name: "Mixing Bowls",
    emoji: "🥣",
    category: "essential",
    description: "Various sizes",
  },
  {
    id: "can_opener",
    name: "Can Opener",
    emoji: "🥫",
    category: "essential",
    description: "For canned goods",
  },

  // Helpful
  {
    id: "non_stick_pan",
    name: "Non-stick Pan",
    emoji: "🍳",
    category: "helpful",
    description: "8-10 inch skillet",
  },
  {
    id: "sauce_pan",
    name: "Sauce Pan",
    emoji: "🫕",
    category: "helpful",
    description: "For sauces & boiling",
  },
  {
    id: "sheet_pan",
    name: "Baking Sheet",
    emoji: "📄",
    category: "helpful",
    description: "For roasting & baking",
  },
  {
    id: "wooden_spoon",
    name: "Wooden Spoons",
    emoji: "🥄",
    category: "helpful",
    description: "For stirring",
  },
  {
    id: "spatula",
    name: "Spatula",
    emoji: "🍴",
    category: "helpful",
    description: "For flipping",
  },
  {
    id: "whisk",
    name: "Whisk",
    emoji: "🥢",
    category: "helpful",
    description: "For mixing & beating",
  },
  {
    id: "tongs",
    name: "Tongs",
    emoji: "🥄",
    category: "helpful",
    description: "For grabbing hot items",
  },

  // Advanced
  {
    id: "food_processor",
    name: "Food Processor",
    emoji: "⚙️",
    category: "advanced",
    description: "For chopping & mixing",
  },
  {
    id: "stand_mixer",
    name: "Stand Mixer",
    emoji: "🔄",
    category: "advanced",
    description: "For baking",
  },
  {
    id: "instant_pot",
    name: "Instant Pot",
    emoji: "🍲",
    category: "advanced",
    description: "Pressure cooker",
  },
  {
    id: "cast_iron",
    name: "Cast Iron Pan",
    emoji: "⚫",
    category: "advanced",
    description: "Heavy duty cooking",
  },
  {
    id: "immersion_blender",
    name: "Immersion Blender",
    emoji: "🪓",
    category: "advanced",
    description: "For soups & sauces",
  },
];

const stoveTypes = [
  { id: "gas", name: "Gas Stove", emoji: "🔥", description: "Flame control" },
  {
    id: "electric",
    name: "Electric Stove",
    emoji: "⚡",
    description: "Coil or glass top",
  },
  {
    id: "induction",
    name: "Induction",
    emoji: "🧲",
    description: "Magnetic heating",
  },
  {
    id: "none",
    name: "No Stove",
    emoji: "❌",
    description: "Microwave/hotplate only",
  },
];

export const KitchenAssessmentScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [stoveType, setStoveType] = useState("");
  const [hasOven, setHasOven] = useState<boolean | null>(null);
  const [spaceLevel, setSpaceLevel] = useState(3);

  const totalSteps = 4;

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools((prev) => prev.filter((id) => id !== toolId));
    } else {
      setSelectedTools((prev) => [...prev, toolId]);
    }
  };

  const nextStep = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Save kitchen profile data
      try {
        await UserProfileService.updateKitchenData({
          tools: selectedTools,
          stoveType,
          hasOven: hasOven!, // Non-null assertion since canProceed() ensures this
          spaceLevel,
        });
        Alert.alert("Setup Complete!", "Your cooking profile is ready");
        // TODO: Navigate to main app
      } catch (error) {
        Alert.alert("Error", "Failed to save kitchen setup");
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedTools.length > 0;
      case 1:
        return stoveType !== "";
      case 2:
        return hasOven !== null;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / totalSteps) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );

  const renderToolsStep = () => {
    const groupedTools = {
      essential: kitchenTools.filter((t) => t.category === "essential"),
      helpful: kitchenTools.filter((t) => t.category === "helpful"),
      advanced: kitchenTools.filter((t) => t.category === "advanced"),
    };

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>What kitchen tools do you have?</Text>
        <Text style={styles.stepSubtitle}>
          Select all that you own - this helps me suggest the right recipes!
        </Text>

        {Object.entries(groupedTools).map(([category, tools]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {category === "essential" && "🏠 Kitchen Essentials"}
              {category === "helpful" && "👍 Helpful Tools"}
              {category === "advanced" && "⭐ Advanced Equipment"}
            </Text>

            <View style={styles.toolsGrid}>
              {tools.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.toolCard,
                    selectedTools.includes(tool.id) && styles.toolCardSelected,
                  ]}
                  onPress={() => toggleTool(tool.id)}
                >
                  <Text style={styles.toolEmoji}>{tool.emoji}</Text>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                  {selectedTools.includes(tool.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderStoveStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What type of stove do you have?</Text>
      <Text style={styles.stepSubtitle}>
        This affects cooking times and techniques I'll recommend
      </Text>

      <View style={styles.stoveGrid}>
        {stoveTypes.map((stove) => (
          <TouchableOpacity
            key={stove.id}
            style={[
              styles.stoveCard,
              stoveType === stove.id && styles.stoveCardSelected,
            ]}
            onPress={() => setStoveType(stove.id)}
          >
            <Text style={styles.stoveEmoji}>{stove.emoji}</Text>
            <Text style={styles.stoveName}>{stove.name}</Text>
            <Text style={styles.stoveDescription}>{stove.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOvenStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Do you have a working oven?</Text>
      <Text style={styles.stepSubtitle}>
        This determines whether I can suggest baked dishes
      </Text>

      <View style={styles.ovenOptions}>
        <TouchableOpacity
          style={[styles.ovenCard, hasOven === true && styles.ovenCardSelected]}
          onPress={() => setHasOven(true)}
        >
          <Text style={styles.ovenEmoji}>🔥</Text>
          <Text style={styles.ovenText}>Yes, I have an oven</Text>
          <Text style={styles.ovenSubtext}>I can bake, roast & broil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.ovenCard,
            hasOven === false && styles.ovenCardSelected,
          ]}
          onPress={() => setHasOven(false)}
        >
          <Text style={styles.ovenEmoji}>🚫</Text>
          <Text style={styles.ovenText}>No oven available</Text>
          <Text style={styles.ovenSubtext}>Stovetop & microwave only</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSpaceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How much kitchen space do you have?</Text>
      <Text style={styles.stepSubtitle}>
        This helps me suggest recipes that fit your prep area
      </Text>

      <View style={styles.spaceContainer}>
        <View style={styles.spaceScale}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.spaceButton,
                spaceLevel === level && styles.spaceButtonSelected,
              ]}
              onPress={() => setSpaceLevel(level)}
            >
              <Text
                style={[
                  styles.spaceNumber,
                  spaceLevel === level && styles.spaceNumberSelected,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.spaceLabels}>
          <Text style={styles.spaceLabel}>🏠 Tiny</Text>
          <Text style={styles.spaceLabel}>🏡 Spacious</Text>
        </View>

        <View style={styles.spaceDescription}>
          {spaceLevel <= 2 && (
            <Text style={styles.spaceDescText}>
              Perfect! I'll suggest one-pot meals and minimal prep recipes.
            </Text>
          )}
          {spaceLevel === 3 && (
            <Text style={styles.spaceDescText}>
              Great! I can recommend recipes with moderate prep work.
            </Text>
          )}
          {spaceLevel >= 4 && (
            <Text style={styles.spaceDescText}>
              Awesome! I can suggest more complex recipes with multiple
              components.
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderToolsStep();
      case 1:
        return renderStoveStep();
      case 2:
        return renderOvenStep();
      case 3:
        return renderSpaceStep();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏠 Your Kitchen Setup</Text>
        <Text style={styles.subtitle}>
          Help me understand what you're working with
        </Text>
        {renderProgressBar()}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
          ]}
          onPress={nextStep}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === totalSteps - 1 ? "Start Cooking!" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 5,
    opacity: 0.9,
  },
  progressContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  progressBar: {
    width: width - 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  progressText: {
    color: "white",
    fontSize: 12,
    marginTop: 8,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  toolCard: {
    width: (width - 60) / 2,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    position: "relative",
    minHeight: 100,
  },
  toolCardSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#f8fff9",
  },
  toolEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  toolName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 11,
    textAlign: "center",
    color: "#666",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
  },
  stoveGrid: {
    gap: 15,
  },
  stoveCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
  },
  stoveCardSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#f8fff9",
  },
  stoveEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  stoveName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  stoveDescription: {
    fontSize: 14,
    color: "#666",
  },
  ovenOptions: {
    gap: 20,
  },
  ovenCard: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  ovenCardSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#f8fff9",
  },
  ovenEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  ovenText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  ovenSubtext: {
    fontSize: 14,
    color: "#666",
  },
  spaceContainer: {
    alignItems: "center",
  },
  spaceScale: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  spaceButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  spaceButtonSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50",
  },
  spaceNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  spaceNumberSelected: {
    color: "white",
  },
  spaceLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  spaceLabel: {
    fontSize: 14,
    color: "#888",
  },
  spaceDescription: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  spaceDescText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  nextButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#ccc",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
