// src/screens/LoginScreen.tsx
import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { AuthService } from "../services/supabase";
import { colors, spacing, borderRadius, typography } from "../constants/theme";
import { HapticService } from "../services/haptics";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>🧠 Sage</Text>
        <Text style={styles.tagline}>Your Personal Cooking Coach</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Welcome Back</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.signUpPrompt}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={navigateToSignUp}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    fontSize: 64,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  tagline: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  loginButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "bold",
  },
  signUpPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  signUpLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "bold",
  },
});
