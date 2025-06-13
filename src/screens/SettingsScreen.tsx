import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { APIKeyManager } from "../services/ai/config";
import { useAuthStore } from "../stores/authStore";
import { useUserProfile } from "../hooks/useUserProfile";
import { AuthService } from "../services/supabase";
import { HapticService } from "../services/haptics";
import { colors, typography } from "../constants/theme";

export const SettingsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { updateProfile, isLoading: isProfileLoading } = useUserProfile();

  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(false);

  useEffect(() => {
    const checkExistingKey = async () => {
      const keyExists = await APIKeyManager.hasGeminiKey();
      setHasKey(keyExists);
    };
    checkExistingKey();
  }, []);

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter a valid API key");
      return;
    }
    setIsKeyLoading(true);
    try {
      await APIKeyManager.setGeminiKey(apiKey.trim());
      setHasKey(true);
      setApiKey("");
      Alert.alert("Success", "API key saved securely!");
    } catch (error) {
      Alert.alert("Error", "Failed to save API key");
    } finally {
      setIsKeyLoading(false);
    }
  };

  const removeApiKey = () => {
    Alert.alert("Remove API Key", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await APIKeyManager.removeGeminiKey();
          setHasKey(false);
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    HapticService.medium();
    await AuthService.signOut();
  };

  const resetProfile = () => {
    Alert.alert(
      "Reset Profile",
      "This will restart onboarding. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await updateProfile({ skill_level: "" }); // Setting skill_level to empty triggers onboarding
              Alert.alert("Profile Reset", "Your profile has been reset.");
            } catch (error) {
              Alert.alert("Error", "Failed to reset profile.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
          <TouchableOpacity style={styles.button} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Profile</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={resetProfile}
            disabled={isProfileLoading}
          >
            {isProfileLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Profile & Onboarding</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gemini API Key</Text>
          <Text style={styles.statusText}>
            {hasKey ? "✅ API Key Configured" : "❌ No API Key"}
          </Text>
          {!hasKey ? (
            <>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Paste your key here"
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveApiKey}
                disabled={isKeyLoading}
              >
                {isKeyLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save API Key</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={removeApiKey}
            >
              <Text style={styles.buttonText}>Remove API Key</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusActive: {
    color: "#4CAF50",
  },
  statusInactive: {
    color: "#f44336",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  removeButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  emailText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  dangerButton: { backgroundColor: colors.error, marginTop: 10 }
});
