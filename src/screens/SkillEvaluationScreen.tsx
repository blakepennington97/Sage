// src/screens/SkillEvaluationScreen.tsx
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
import { useNavigation } from "@react-navigation/native";
import { UserProfileService } from "../services/userProfile";

const { width } = Dimensions.get("window");

interface SkillLevel {
  id: string;
  title: string;
  description: string;
  emoji: string;
  examples: string[];
}

const skillLevels: SkillLevel[] = [
  {
    id: "complete_beginner",
    title: "Complete Beginner",
    description: "I rarely cook or am just starting",
    emoji: "🌱",
    examples: [
      "Never used a real recipe",
      "Mostly microwave meals",
      "Kitchen intimidates me",
    ],
  },
  {
    id: "basic_skills",
    title: "Basic Skills",
    description: "I can handle simple dishes",
    emoji: "🥚",
    examples: [
      "Can make eggs & toast",
      "Follow simple recipes",
      "Use basic kitchen tools",
    ],
  },
  {
    id: "developing",
    title: "Developing Cook",
    description: "I cook regularly but want to improve",
    emoji: "🍳",
    examples: [
      "Make 3-4 different meals",
      "Comfortable with stovetop",
      "Sometimes experiment",
    ],
  },
  {
    id: "confident",
    title: "Confident Cook",
    description: "I cook often and try new things",
    emoji: "👨‍🍳",
    examples: [
      "Cook most meals at home",
      "Modify recipes",
      "Handle multiple dishes",
    ],
  },
];

const cookingFears = [
  { id: "knife_skills", text: "Using sharp knives", emoji: "🔪" },
  { id: "timing", text: "Getting timing right", emoji: "⏰" },
  { id: "heat_control", text: "Controlling heat/temperature", emoji: "🔥" },
  { id: "seasoning", text: "Adding the right seasonings", emoji: "🧂" },
  { id: "raw_food", text: "Handling raw meat/fish", emoji: "🥩" },
  { id: "burning", text: "Burning or ruining food", emoji: "💨" },
  { id: "waste", text: "Wasting expensive ingredients", emoji: "💸" },
  { id: "complicated", text: "Recipes seem too complicated", emoji: "📋" },
];

export const SkillEvaluationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>("");
  const [selectedFears, setSelectedFears] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(3);

  const totalSteps = 3;

  const handleSkillSelect = (skillId: string) => {
    setSelectedSkillLevel(skillId);
  };

  const toggleFear = (fearId: string) => {
    if (selectedFears.includes(fearId)) {
      setSelectedFears((prev) => prev.filter((id) => id !== fearId));
    } else {
      setSelectedFears((prev) => [...prev, fearId]);
    }
  };

  const nextStep = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Save skill profile data
      try {
        await UserProfileService.updateSkillData({
          skillLevel: selectedSkillLevel,
          fears: selectedFears,
          overallConfidence: confidence,
        });
        Alert.alert("Progress Saved!", "Ready for kitchen setup");
        navigation.navigate("Kitchen" as never);
      } catch (error) {
        Alert.alert("Error", "Failed to save progress");
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedSkillLevel !== "";
      case 1:
        return true; // Can proceed even with no fears selected
      case 2:
        return true; // Always can proceed from confidence step
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

  const renderSkillLevelStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        How would you describe your cooking experience?
      </Text>
      <Text style={styles.stepSubtitle}>
        Be honest - this helps me give you the right guidance!
      </Text>

      <View style={styles.skillLevelsContainer}>
        {skillLevels.map((skill) => (
          <TouchableOpacity
            key={skill.id}
            style={[
              styles.skillCard,
              selectedSkillLevel === skill.id && styles.skillCardSelected,
            ]}
            onPress={() => handleSkillSelect(skill.id)}
          >
            <Text style={styles.skillEmoji}>{skill.emoji}</Text>
            <Text style={styles.skillTitle}>{skill.title}</Text>
            <Text style={styles.skillDescription}>{skill.description}</Text>
            <View style={styles.examplesContainer}>
              {skill.examples.map((example, index) => (
                <Text key={index} style={styles.example}>
                  • {example}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFearsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        What cooking challenges worry you most?
      </Text>
      <Text style={styles.stepSubtitle}>
        Select any that apply - I'll help you overcome these! 💪
      </Text>

      <View style={styles.fearsGrid}>
        {cookingFears.map((fear) => (
          <TouchableOpacity
            key={fear.id}
            style={[
              styles.fearCard,
              selectedFears.includes(fear.id) && styles.fearCardSelected,
            ]}
            onPress={() => toggleFear(fear.id)}
          >
            <Text style={styles.fearEmoji}>{fear.emoji}</Text>
            <Text style={styles.fearText}>{fear.text}</Text>
            {selectedFears.includes(fear.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.skipText}>
        Skip if none apply - that's awesome! 🎉
      </Text>
    </View>
  );

  const renderConfidenceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        How confident do you feel about cooking?
      </Text>
      <Text style={styles.stepSubtitle}>
        On a scale of 1-5, where do you see yourself?
      </Text>

      <View style={styles.confidenceContainer}>
        <View style={styles.confidenceScale}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.confidenceButton,
                confidence === level && styles.confidenceButtonSelected,
              ]}
              onPress={() => setConfidence(level)}
            >
              <Text
                style={[
                  styles.confidenceNumber,
                  confidence === level && styles.confidenceNumberSelected,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.confidenceLabels}>
          <Text style={styles.confidenceLabel}>😰 Nervous</Text>
          <Text style={styles.confidenceLabel}>😊 Excited</Text>
        </View>

        <View style={styles.confidenceDescription}>
          {confidence <= 2 && (
            <Text style={styles.confidenceDescText}>
              No worries! I'll start with the absolute basics and build your
              confidence step by step.
            </Text>
          )}
          {confidence === 3 && (
            <Text style={styles.confidenceDescText}>
              Perfect! I'll give you recipes that challenge you just enough to
              keep growing.
            </Text>
          )}
          {confidence >= 4 && (
            <Text style={styles.confidenceDescText}>
              Great! I can suggest more adventurous recipes and techniques to
              keep you engaged.
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderSkillLevelStep();
      case 1:
        return renderFearsStep();
      case 2:
        return renderConfidenceStep();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👋 Hi! I'm Sage</Text>
        <Text style={styles.subtitle}>
          Let's learn about your cooking journey
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
            {currentStep === totalSteps - 1
              ? "Continue to Kitchen Setup"
              : "Next"}
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
  skillLevelsContainer: {
    gap: 15,
  },
  skillCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  skillCardSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#f8fff9",
  },
  skillEmoji: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: 8,
  },
  skillTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    marginBottom: 4,
  },
  skillDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  examplesContainer: {
    alignItems: "flex-start",
  },
  example: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  fearsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  fearCard: {
    width: (width - 60) / 2,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    position: "relative",
  },
  fearCardSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#f8fff9",
  },
  fearEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  fearText: {
    fontSize: 13,
    textAlign: "center",
    color: "#333",
    lineHeight: 18,
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
  },
  skipText: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginTop: 20,
    fontStyle: "italic",
  },
  confidenceContainer: {
    alignItems: "center",
  },
  confidenceScale: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  confidenceButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  confidenceButtonSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50",
  },
  confidenceNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  confidenceNumberSelected: {
    color: "white",
  },
  confidenceLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  confidenceLabel: {
    fontSize: 14,
    color: "#888",
  },
  confidenceDescription: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  confidenceDescText: {
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
