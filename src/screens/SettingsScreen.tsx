// src/screens/SettingsScreen.tsx - New file
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { APIKeyManager } from "../services/ai/config";

export const SettingsScreen: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkExistingKey();
  }, []);

  const checkExistingKey = async () => {
    const keyExists = await APIKeyManager.hasGeminiKey();
    setHasKey(keyExists);
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter your Gemini API key");
      return;
    }

    setIsLoading(true);
    try {
      await APIKeyManager.setGeminiKey(apiKey.trim());
      setHasKey(true);
      setApiKey("");
      Alert.alert("Success", "API key saved securely!");
    } catch (error) {
      Alert.alert("Error", "Failed to save API key");
    } finally {
      setIsLoading(false);
    }
  };

  const removeApiKey = async () => {
    Alert.alert(
      "Remove API Key",
      "Are you sure you want to remove the saved API key?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await APIKeyManager.removeGeminiKey();
            setHasKey(false);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gemini API Configuration</Text>
          <Text style={styles.description}>
            To use Sage's AI features, you need a Gemini API key from Google AI
            Studio.
          </Text>

          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status: </Text>
            <Text
              style={[
                styles.statusText,
                hasKey ? styles.statusActive : styles.statusInactive,
              ]}
            >
              {hasKey ? "✅ API Key Configured" : "❌ No API Key"}
            </Text>
          </View>

          {!hasKey && (
            <>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Enter your Gemini API key..."
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveApiKey}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Saving..." : "Save API Key"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {hasKey && (
            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={removeApiKey}
            >
              <Text style={styles.buttonText}>Remove API Key</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.helpTitle}>How to get a Gemini API Key:</Text>
          <Text style={styles.helpText}>
            1. Go to aistudio.google.com{"\n"}
            2. Sign in with your Google account{"\n"}
            3. Click "Get API Key" → "Create API key"{"\n"}
            4. Copy the key and paste it above
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
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
});
