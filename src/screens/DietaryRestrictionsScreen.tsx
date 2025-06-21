import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useUserProfile } from "../hooks/useUserProfile";
import { HapticService } from "../services/haptics";
import { colors, typography } from "../constants/theme";
import { OnboardingStackParamList } from "../types/navigation";

type DietaryRestrictionsNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'DietaryRestrictions'
>;

interface AllergyOption {
  id: string;
  name: string;
  emoji: string;
  severity: "high" | "medium";
}

interface DietaryOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const commonAllergies: AllergyOption[] = [
  { id: "nuts", name: "Tree Nuts", emoji: "🥜", severity: "high" },
  { id: "peanuts", name: "Peanuts", emoji: "🥜", severity: "high" },
  { id: "shellfish", name: "Shellfish", emoji: "🦐", severity: "high" },
  { id: "fish", name: "Fish", emoji: "🐟", severity: "high" },
  { id: "dairy", name: "Dairy/Milk", emoji: "🥛", severity: "medium" },
  { id: "eggs", name: "Eggs", emoji: "🥚", severity: "medium" },
  { id: "soy", name: "Soy", emoji: "🫘", severity: "medium" },
  { id: "gluten", name: "Gluten/Wheat", emoji: "🌾", severity: "medium" },
];

const dietaryRestrictions: DietaryOption[] = [
  {
    id: "vegetarian",
    name: "Vegetarian",
    emoji: "🥕",
    description: "No meat, poultry, or fish",
  },
  {
    id: "vegan",
    name: "Vegan",
    emoji: "🌱",
    description: "No animal products",
  },
  {
    id: "pescatarian",
    name: "Pescatarian",
    emoji: "🐟",
    description: "No meat or poultry, fish OK",
  },
  {
    id: "halal",
    name: "Halal",
    emoji: "🕌",
    description: "Islamic dietary laws",
  },
  {
    id: "kosher",
    name: "Kosher",
    emoji: "✡️",
    description: "Jewish dietary laws",
  },
];

export const DietaryRestrictionsScreen: React.FC = () => {
  const navigation = useNavigation<DietaryRestrictionsNavigationProp>();
  const { isLoading, completeDietaryRestrictions } = useUserProfile();

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 3;

  const toggleAllergy = (allergyId: string) =>
    setSelectedAllergies((prev) =>
      prev.includes(allergyId)
        ? prev.filter((id) => id !== allergyId)
        : [...prev, allergyId]
    );

  const toggleDietary = (dietaryId: string) =>
    setSelectedDietary((prev) =>
      prev.includes(dietaryId)
        ? prev.filter((id) => id !== dietaryId)
        : [...prev, dietaryId]
    );

  const addCustomAllergy = () => {
    Alert.prompt(
      "Add Custom Allergy",
      "Enter an allergy or food intolerance not listed above:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: (text) => {
            if (text && text.trim() && !customAllergies.includes(text.trim())) {
              setCustomAllergies((prev) => [...prev, text.trim()]);
              HapticService.light();
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const removeCustomAllergy = (allergy: string) => {
    setCustomAllergies((prev) => prev.filter((a) => a !== allergy));
    HapticService.light();
  };

  const handleNextPress = async () => {
    HapticService.light();
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      try {
        await completeDietaryRestrictions({
          allergies: [...selectedAllergies, ...customAllergies],
          dietaryRestrictions: selectedDietary,
        });
        HapticService.success();
        navigation.navigate('Kitchen');
      } catch (error) {
        HapticService.error();
        Alert.alert("Error", "Could not save your dietary information. Please try again.");
      }
    }
  };

  const canProceed = () => {
    // Always allow proceeding - users might not have any restrictions
    return true;
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

  const renderAllergiesStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Do you have any food allergies?</Text>
      <Text style={styles.stepSubtitle}>
        ⚠️ This is critical for your safety - I'll never suggest recipes with these ingredients
      </Text>

      <View style={styles.allergiesGrid}>
        {commonAllergies.map((allergy) => (
          <TouchableOpacity
            key={allergy.id}
            style={[
              styles.allergyCard,
              selectedAllergies.includes(allergy.id) && styles.allergyCardSelected,
              allergy.severity === "high" && styles.highSeverityCard,
            ]}
            onPress={() => toggleAllergy(allergy.id)}
          >
            <Text style={styles.allergyEmoji}>{allergy.emoji}</Text>
            <Text style={styles.allergyName}>{allergy.name}</Text>
            {selectedAllergies.includes(allergy.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {customAllergies.length > 0 && (
        <View style={styles.customAllergiesSection}>
          <Text style={styles.customTitle}>Your Custom Allergies:</Text>
          {customAllergies.map((allergy, index) => (
            <View key={index} style={styles.customAllergyItem}>
              <Text style={styles.customAllergyText}>{allergy}</Text>
              <TouchableOpacity onPress={() => removeCustomAllergy(allergy)}>
                <Text style={styles.removeButton}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.addCustomButton} onPress={addCustomAllergy}>
        <Text style={styles.addCustomText}>+ Add Custom Allergy</Text>
      </TouchableOpacity>

      <Text style={styles.skipText}>
        No allergies? Great! You can skip this step. 👍
      </Text>
    </View>
  );

  const renderDietaryStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Any dietary restrictions?</Text>
      <Text style={styles.stepSubtitle}>
        Select any that apply - this helps me suggest appropriate recipes
      </Text>

      <View style={styles.dietaryGrid}>
        {dietaryRestrictions.map((dietary) => (
          <TouchableOpacity
            key={dietary.id}
            style={[
              styles.dietaryCard,
              selectedDietary.includes(dietary.id) && styles.dietaryCardSelected,
            ]}
            onPress={() => toggleDietary(dietary.id)}
          >
            <Text style={styles.dietaryEmoji}>{dietary.emoji}</Text>
            <Text style={styles.dietaryName}>{dietary.name}</Text>
            <Text style={styles.dietaryDescription}>{dietary.description}</Text>
            {selectedDietary.includes(dietary.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.skipText}>
        No restrictions? That's totally fine! 🍽️
      </Text>
    </View>
  );

  const renderConfirmationStep = () => {
    const hasAllergies = selectedAllergies.length > 0 || customAllergies.length > 0;
    const hasDietary = selectedDietary.length > 0;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Let's confirm your dietary needs</Text>
        <Text style={styles.stepSubtitle}>
          I'll use this information to keep you safe and suggest better recipes
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>🛡️ Allergies & Intolerances</Text>
          {hasAllergies ? (
            <View style={styles.summaryList}>
              {[...selectedAllergies, ...customAllergies].map((item, index) => (
                <Text key={index} style={styles.summaryItem}>
                  • {commonAllergies.find((a) => a.id === item)?.name || item}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.summaryEmpty}>None specified</Text>
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>🍽️ Dietary Preferences</Text>
          {hasDietary ? (
            <View style={styles.summaryList}>
              {selectedDietary.map((item, index) => (
                <Text key={index} style={styles.summaryItem}>
                  • {dietaryRestrictions.find((d) => d.id === item)?.name}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.summaryEmpty}>None specified</Text>
          )}
        </View>

        <View style={styles.safetyNote}>
          <Text style={styles.safetyNoteText}>
            🔒 This information is stored securely and used only to generate safe recipes for you.
          </Text>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderAllergiesStep();
      case 1:
        return renderDietaryStep();
      case 2:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Dietary Safety</Text>
        <Text style={styles.subtitle}>
          Help me keep you safe and cook what you love
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
            (!canProceed() || isLoading) && styles.nextButtonDisabled,
          ]}
          onPress={handleNextPress}
          disabled={!canProceed() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps - 1
                ? "Continue to Kitchen Setup"
                : "Next"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get("window");
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
  allergiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  allergyCard: {
    width: (width - 60) / 2,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    position: "relative",
    minHeight: 90,
  },
  allergyCardSelected: {
    borderColor: "#FF5722",
    backgroundColor: "#fff3f2",
  },
  highSeverityCard: {
    borderColor: "#FF9800",
  },
  allergyEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  allergyName: {
    fontSize: 13,
    textAlign: "center",
    color: "#333",
    fontWeight: "600",
  },
  customAllergiesSection: {
    marginVertical: 20,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  customAllergyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FF5722",
  },
  customAllergyText: {
    fontSize: 14,
    color: "#333",
  },
  removeButton: {
    fontSize: 18,
    color: "#FF5722",
    fontWeight: "bold",
  },
  addCustomButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: 20,
  },
  addCustomText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  dietaryGrid: {
    gap: 15,
    marginBottom: 20,
  },
  dietaryCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  dietaryCardSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#f8fff9",
  },
  dietaryEmoji: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: 8,
  },
  dietaryName: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    marginBottom: 4,
  },
  dietaryDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 12,
    right: 12,
    color: "#4CAF50",
    fontSize: 20,
    fontWeight: "bold",
  },
  skipText: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
  summaryCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  summaryList: {
    marginLeft: 10,
  },
  summaryItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  summaryEmpty: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  safetyNote: {
    backgroundColor: "#e8f5e8",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  safetyNoteText: {
    fontSize: 14,
    color: "#2e7d32",
    lineHeight: 20,
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