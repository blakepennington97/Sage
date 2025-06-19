import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { APIKeyManager } from "../services/ai/config";
import { useAuthStore } from "../stores/authStore";
import { useUserProfile } from "../hooks/useUserProfile";
import { AuthService } from "../services/supabase";
import { HapticService } from "../services/haptics";
import { Box, Text, Button, Input, Card } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";

export const SettingsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { updateProfile, isLoading: isProfileLoading } = useUserProfile();
  const theme = useTheme<Theme>();

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
    <Box flex={1} backgroundColor="mainBackground">
      <Box 
        backgroundColor="primary" 
        padding="lg" 
        paddingTop="xxl"
      >
        <Text 
          variant="h2" 
          color="primaryButtonText" 
          textAlign="center"
        >
          ⚙️ Settings
        </Text>
      </Box>
      
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Card variant="primary" marginBottom="lg">
          <Text variant="h3" marginBottom="sm">Account</Text>
          <Text 
            variant="body" 
            color="secondaryText" 
            marginBottom="md"
          >
            {user?.email}
          </Text>
          <Button variant="secondary" onPress={handleSignOut}>
            <Text variant="button" color="primaryText">
              Sign Out
            </Text>
          </Button>
        </Card>

        <Card variant="primary" marginBottom="lg">
          <Text variant="h3" marginBottom="sm">Cooking Profile</Text>
          <Button 
            variant="danger" 
            marginTop="sm"
            onPress={resetProfile}
            disabled={isProfileLoading}
          >
            {isProfileLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text variant="button" color="dangerButtonText">
                Reset Profile & Onboarding
              </Text>
            )}
          </Button>
        </Card>

        <Card variant="primary" marginBottom="lg">
          <Text variant="h3" marginBottom="sm">Gemini API Key</Text>
          <Text 
            variant="body" 
            fontWeight="600" 
            marginBottom="md"
            color={hasKey ? "success" : "error"}
          >
            {hasKey ? "✅ API Key Configured" : "❌ No API Key"}
          </Text>
          {!hasKey ? (
            <Box>
              <Input
                backgroundColor="surface"
                borderRadius="md"
                padding="md"
                fontSize={16}
                color="text"
                borderWidth={1}
                borderColor="border"
                marginBottom="md"
                placeholder="Paste your key here"
                placeholderTextColor={theme.colors.textSecondary}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
              <Button
                variant="primary"
                onPress={saveApiKey}
                disabled={isKeyLoading}
              >
                {isKeyLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text variant="button" color="primaryButtonText">
                    Save API Key
                  </Text>
                )}
              </Button>
            </Box>
          ) : (
            <Button variant="danger" onPress={removeApiKey}>
              <Text variant="button" color="dangerButtonText">
                Remove API Key
              </Text>
            </Button>
          )}
        </Card>
      </ScrollView>
    </Box>
  );
};

