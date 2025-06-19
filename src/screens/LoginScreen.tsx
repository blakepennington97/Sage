// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthService } from "../services/supabase";
import { HapticService } from "../services/haptics";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Box, Text, Button, Input } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme<Theme>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      HapticService.warning();
      Alert.alert("Missing Fields", "Please enter both email and password");
      return;
    }

    HapticService.medium();
    setIsLoading(true);

    try {
      const { data, error } = await AuthService.signIn(email.trim(), password);

      if (error) {
        HapticService.error();
        Alert.alert("Login Failed", error.message);
      } else {
        HapticService.success();
        // Navigation handled by auth state change
      }
    } catch (error) {
      HapticService.error();
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignUp = () => {
    HapticService.light();
    (navigation as any).navigate("SignUp");
  };

  if (isLoading) {
    return <LoadingSpinner message="Signing in..." />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Box flex={1} backgroundColor="mainBackground">
        <Box 
          flex={1} 
          justifyContent="center" 
          alignItems="center" 
          paddingHorizontal="xl"
        >
          <Text fontSize={64} textAlign="center" marginBottom="md">
            🧠 Sage
          </Text>
          <Text 
            variant="h3" 
            color="secondaryText" 
            textAlign="center"
          >
            Your Personal Cooking Coach
          </Text>
        </Box>

        <Box 
          flex={1} 
          paddingHorizontal="xl" 
          paddingBottom="xxl"
        >
          <Text 
            variant="h1" 
            textAlign="center" 
            marginBottom="xl"
          >
            Welcome Back
          </Text>

          <Input
            backgroundColor="surface"
            borderRadius="md"
            padding="md"
            fontSize={16}
            color="text"
            borderWidth={1}
            borderColor="border"
            marginBottom="md"
            placeholder="Email"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            backgroundColor="surface"
            borderRadius="md"
            padding="md"
            fontSize={16}
            color="text"
            borderWidth={1}
            borderColor="border"
            marginBottom="md"
            placeholder="Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            variant="primary"
            marginTop="lg"
            marginBottom="xl"
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text variant="button" color="primaryButtonText">
              Sign In
            </Text>
          </Button>

          <Box 
            flexDirection="row" 
            justifyContent="center" 
            alignItems="center"
          >
            <Text variant="body" color="secondaryText">
              Don&apos;t have an account?{" "}
            </Text>
            <Button variant="text" onPress={navigateToSignUp}>
              <Text variant="body" color="primary" fontWeight="bold">
                Sign Up
              </Text>
            </Button>
          </Box>
        </Box>
      </Box>
    </KeyboardAvoidingView>
  );
};

