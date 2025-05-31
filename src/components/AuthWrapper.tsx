// src/components/AuthWrapper.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthService, ProfileService } from "../services/supabase";
import { LoginScreen } from "../screens/LoginScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { SkillEvaluationScreen } from "../screens/SkillEvaluationScreen";
import { KitchenAssessmentScreen } from "../screens/KitchenAssessmentScreen";
import { RecipeGenerationScreen } from "../screens/RecipeGenerationScreen";
import { CookingCoachScreen } from "../screens/CookingCoachScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors, spacing, typography } from "../constants/theme";
import { useAuthStore } from "../stores/authStore";

const AuthStack = createStackNavigator();
const OnboardingStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Navigators (no changes needed) ---
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

const OnboardingNavigator = () => (
  <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
    <OnboardingStack.Screen name="Skills" component={SkillEvaluationScreen} />
    <OnboardingStack.Screen
      name="Kitchen"
      component={KitchenAssessmentScreen}
    />
  </OnboardingStack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      },
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Recipes"
      component={RecipeGenerationScreen}
      options={{ tabBarIcon: () => <Text>👨‍🍳</Text>, title: "Recipes" }}
    />
    <Tab.Screen
      name="CookingCoach"
      component={CookingCoachScreen}
      options={{ tabBarButton: () => null, title: "Cooking Coach" }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarIcon: () => <Text>⚙️</Text>, title: "Settings" }}
    />
  </Tab.Navigator>
);

// --- AuthWrapper (The brains) ---
export const AuthWrapper: React.FC = () => {
  const {
    user,
    profile,
    isLoading,
    initializeSession,
    setProfile,
    setProfileLoading,
    clearSession,
  } = useAuthStore();

  useEffect(() => {
    // 1. Check initial auth state on app start
    AuthService.getCurrentUser().then((user) => {
      initializeSession(user);
    });

    // 2. Listen for auth state changes (login, logout)
    const {
      data: { subscription },
    } = AuthService.onAuthChange((_event, session) => {
      const currentUser = session?.user ?? null;
      initializeSession(currentUser);
      if (_event === "SIGNED_OUT") {
        clearSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Effect to fetch profile when user is available but profile isn't
  useEffect(() => {
    if (user && !profile) {
      setProfileLoading(true);
      ProfileService.getProfile(user.id)
        .then(setProfile)
        .catch((error) => console.error("Failed to fetch profile:", error))
        .finally(() => setProfileLoading(false));
    }
  }, [user, profile]);

  // App is still figuring out if a user is logged in at all
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.logo}>🧠 Sage</Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // No user is logged in
  if (!user) {
    return <AuthNavigator />;
  }

  // User is logged in, but we are fetching their profile or it's incomplete
  // `skill_level` is our marker for a completed onboarding.
  if (!profile?.skill_level) {
    // If the profile is still loading, show a spinner, otherwise show onboarding
    return useAuthStore.getState().isProfileLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    ) : (
      <OnboardingNavigator />
    );
  }

  // User is logged in and has a complete profile
  return <MainTabs />;
};

// --- Styles (no changes needed) ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  logo: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: spacing.xl,
    color: colors.text,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
