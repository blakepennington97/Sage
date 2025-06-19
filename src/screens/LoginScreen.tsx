// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { AuthService } from "../services/supabase";
import { HapticService } from "../services/haptics";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Box, Text, Button, Input } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme<Theme>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    HapticService.medium();
    setIsLoading(true);

    try {
      const { data: authData, error } = await AuthService.signIn(data.email.trim(), data.password);

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

          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email"
              }
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                backgroundColor="surface"
                borderRadius="md"
                padding="md"
                fontSize={16}
                color="text"
                borderWidth={1}
                borderColor={errors.email ? "error" : "border"}
                marginBottom="xs"
                placeholder="Email"
                placeholderTextColor={theme.colors.textSecondary}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
          {errors.email && (
            <Text variant="caption" color="error" marginBottom="md">
              {errors.email.message}
            </Text>
          )}

          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters"
              }
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                backgroundColor="surface"
                borderRadius="md"
                padding="md"
                fontSize={16}
                color="text"
                borderWidth={1}
                borderColor={errors.password ? "error" : "border"}
                marginBottom="xs"
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoCapitalize="none"
              />
            )}
          />
          {errors.password && (
            <Text variant="caption" color="error" marginBottom="md">
              {errors.password.message}
            </Text>
          )}

          <Button
            variant="primary"
            marginTop="lg"
            marginBottom="xl"
            onPress={handleSubmit(onSubmit)}
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

