// src/screens/SignUpScreen.tsx
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

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      HapticService.warning();
      Alert.alert("Missing Fields", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      HapticService.warning();
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      HapticService.warning();
      Alert.alert("Weak Password", "Password must be at least 6 characters");
      return;
    }

    HapticService.medium();
    setIsLoading(true);

    try {
      const { data, error } = await AuthService.signUp(email.trim(), password);

      if (error) {
        HapticService.error();
        Alert.alert("Sign Up Failed", error.message);
      } else {
        HapticService.success();
        Alert.alert(
          "Check Your Email",
          "We sent you a confirmation link. Please check your email to verify your account.",
          [{ text: "OK", onPress: () => (navigation as any).navigate("Login") }]
        );
      }
    } catch (error) {
      HapticService.error();
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    HapticService.light();
    (navigation as any).navigate("Login");
  };

  if (isLoading) {
    return <LoadingSpinner message="Creating account..." />;
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
        <Text style={styles.title}>Create Account</Text>

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

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.signUpPrompt}>
          <Text style={styles.signUpText}>Already have an account? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.signUpLink}>Sign In</Text>
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
