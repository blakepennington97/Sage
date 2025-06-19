import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { GeminiService } from "../services/ai";
import { useAuthStore } from "../stores/authStore";
import {
  SessionService,
  RecipeService,
  UserRecipe,
} from "../services/supabase";

type RootStackParamList = { CookingCoach: { recipe: UserRecipe } };
interface CookingStep {
  id: number;
  instruction: string;
}

export const CookingCoachScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "CookingCoach">>();
  const { recipe } = route.params;

  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<CookingStep[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpQuestion, setHelpQuestion] = useState("");
  const [helpResponse, setHelpResponse] = useState("");
  const [isGettingHelp, setIsGettingHelp] = useState(false);

  const geminiService = new GeminiService();

  useEffect(() => {
    // REPLACE THIS FUNCTION
    const parseRecipeSteps = () => {
      // Prioritize structured data if it exists (for new recipes)
      if (recipe.recipe_data && recipe.recipe_data.instructions) {
        const parsedSteps = recipe.recipe_data.instructions.map(
          (inst: any) => ({
            id: inst.step,
            instruction: inst.text,
          })
        );
        setSteps(parsedSteps);
        return;
      }

      // Fallback for older recipes without structured data
      console.warn(
        "Falling back to legacy recipe parsing for recipe:",
        recipe.id
      );
      const recipeContent = recipe.recipe_content || "";
      const lines = recipeContent.split("\n");
      const parsedSteps: CookingStep[] = [];
      lines.forEach((line: string) => {
        if (line.trim().match(/^\d+\./)) {
          parsedSteps.push({
            id: parsedSteps.length + 1,
            instruction: line.trim().replace(/^\d+\.\s*/, ""),
          });
        }
      });
      setSteps(
        parsedSteps.length > 0
          ? parsedSteps
          : [{ id: 1, instruction: recipeContent }]
      );
    };

    const startSession = async () => {
      if (user && recipe.id) {
        const newSessionId = await SessionService.startCookingSession(
          user.id,
          recipe.id
        );
        setSessionId(newSessionId);
        await RecipeService.markAsCooked(recipe.id);
      }
    };

    parseRecipeSteps();
    startSession();
  }, [recipe.id, user, recipe.recipe_content, recipe.recipe_data]);

  const handleSessionComplete = async (rating: number) => {
    if (sessionId) {
      await SessionService.completeCookingSession(sessionId, rating);
    }
    navigation.popToTop();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      Alert.alert("🎉 Recipe Complete!", "How did it turn out?", [
        { text: "Awesome!", onPress: () => handleSessionComplete(5) },
        {
          text: "Could be better",
          onPress: () => handleSessionComplete(3),
          style: "cancel",
        },
      ]);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const startTimer = (minutes: number) => {
    setTimeRemaining(minutes * 60);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getHelp = async () => {
    if (!helpQuestion.trim()) {
      Alert.alert("Enter Question", "Please describe what you need help with");
      return;
    }

    setIsGettingHelp(true);
    try {
      const currentInstruction = steps[currentStep]?.instruction || "";
      const context = `I'm currently on this cooking step: "${currentInstruction}". ${helpQuestion}`;

      const response = await geminiService.getCookingAdvice(context);
      setHelpResponse(response.message);
    } catch (error) {
      Alert.alert("Error", "Failed to get help. Please try again.");
    } finally {
      setIsGettingHelp(false);
    }
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
    setHelpQuestion("");
    setHelpResponse("");
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / steps.length) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep + 1} of {steps.length}
      </Text>
    </View>
  );

  const renderCurrentStep = () => {
    const step = steps[currentStep];
    if (!step) return null;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepNumber}>Step {step.id}</Text>
        <Text style={styles.stepInstruction}>{step.instruction}</Text>

        <View style={styles.stepActions}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowHelpModal(true)}
          >
            <Text style={styles.helpButtonText}>🤔 Need Help?</Text>
          </TouchableOpacity>

          <View style={styles.timerSection}>
            {!isTimerRunning ? (
              <View style={styles.timerButtons}>
                <TouchableOpacity
                  style={styles.timerButton}
                  onPress={() => startTimer(5)}
                >
                  <Text style={styles.timerButtonText}>5 min</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.timerButton}
                  onPress={() => startTimer(10)}
                >
                  <Text style={styles.timerButtonText}>10 min</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.timerButton}
                  onPress={() => startTimer(15)}
                >
                  <Text style={styles.timerButtonText}>15 min</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activeTimer}>
                <Text style={styles.timerDisplay}>
                  {formatTime(timeRemaining)}
                </Text>
                <TouchableOpacity
                  style={styles.stopTimerButton}
                  onPress={stopTimer}
                >
                  <Text style={styles.stopTimerText}>Stop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderNavigation = () => (
    <View style={styles.navigation}>
      <TouchableOpacity
        style={[
          styles.navButton,
          currentStep === 0 && styles.navButtonDisabled,
        ]}
        onPress={prevStep}
        disabled={currentStep === 0}
      >
        <Text style={styles.navButtonText}>← Previous</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
        <Text style={styles.nextButtonText}>
          {currentStep === steps.length - 1 ? "Complete!" : "Next →"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHelpModal = () => (
    <Modal
      visible={showHelpModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🆘 Cooking Help</Text>
          <TouchableOpacity onPress={closeHelpModal}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalLabel}>What do you need help with?</Text>
          <TextInput
            style={styles.helpInput}
            value={helpQuestion}
            onChangeText={setHelpQuestion}
            placeholder="e.g., 'How do I know when it's done?' or 'My sauce is too thick'"
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[
              styles.getHelpButton,
              isGettingHelp && styles.getHelpButtonDisabled,
            ]}
            onPress={getHelp}
            disabled={isGettingHelp}
          >
            <Text style={styles.getHelpButtonText}>
              {isGettingHelp ? "Getting Help..." : "Ask Sage"}
            </Text>
          </TouchableOpacity>

          {helpResponse ? (
            <View style={styles.helpResponseContainer}>
              <Text style={styles.helpResponseTitle}>Sage's Advice:</Text>
              <Text style={styles.helpResponseText}>{helpResponse}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Cooking Coach</Text>
        <Text style={styles.subtitle}>
          {recipe.recipe_name || "Your Recipe"}
        </Text>
        {renderProgressBar()}
      </View>

      <ScrollView style={styles.content}>{renderCurrentStep()}</ScrollView>

      {renderNavigation()}
      {renderHelpModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#FF6B35",
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
    width: "100%",
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
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B35",
    marginBottom: 8,
  },
  stepInstruction: {
    fontSize: 18,
    lineHeight: 26,
    color: "#333",
    marginBottom: 24,
  },
  stepActions: {
    gap: 16,
  },
  helpButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  helpButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  timerSection: {
    alignItems: "center",
  },
  timerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  timerButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  timerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTimer: {
    alignItems: "center",
    gap: 10,
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2196F3",
  },
  stopTimerButton: {
    backgroundColor: "#f44336",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  stopTimerText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  navigation: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#ddd",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  navButtonDisabled: {
    backgroundColor: "#f0f0f0",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  nextButton: {
    flex: 2,
    backgroundColor: "#FF6B35",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#4CAF50",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  closeButton: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  helpInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    textAlignVertical: "top",
    minHeight: 80,
  },
  getHelpButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  getHelpButtonDisabled: {
    backgroundColor: "#ccc",
  },
  getHelpButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  helpResponseContainer: {
    backgroundColor: "#f8fff9",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  helpResponseTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  helpResponseText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
});
