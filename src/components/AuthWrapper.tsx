// src/components/AuthWrapper.tsx

import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
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
import { RecipeBookScreen } from "../screens/RecipeBookScreen"; // Import new screen
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen"; // Import new screen
import { colors, spacing, typography } from "../constants/theme";
import { useAuthStore } from "../stores/authStore";

const AuthStack = createStackNavigator();
const OnboardingStack = createStackNavigator();
const AppStack = createStackNavigator(); // New main stack
const Tab = createBottomTabNavigator();

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

// This is our new Tab Navigator
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
      name="RecipeBook"
      component={RecipeBookScreen} // The new home screen
      options={{ tabBarIcon: () => <Text>📚</Text>, title: "Recipes" }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarIcon: () => <Text>⚙️</Text>, title: "Settings" }}
    />
  </Tab.Navigator>
);

// This is the main App Navigator after login
const AppNavigator = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="Main" component={MainTabs} />
    <AppStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    <AppStack.Screen
      name="RecipeGeneration"
      component={RecipeGenerationScreen}
      options={{ presentation: "modal" }} // Present as a modal
    />
    <AppStack.Screen name="CookingCoach" component={CookingCoachScreen} />
  </AppStack.Navigator>
);

export const AuthWrapper: React.FC = () => {
  const {
    user,
    profile,
    isLoading,
    initializeSession,
    setProfile,
    setProfileLoading,
    clearSession,
    isProfileLoading,
  } = useAuthStore();

  useEffect(() => {
    AuthService.getCurrentUser().then((user) => {
      initializeSession(user);
    });
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

  useEffect(() => {
    if (user && !profile) {
      setProfileLoading(true);
      ProfileService.getProfile(user.id)
        .then(setProfile)
        .catch((error) => console.error("Failed to fetch profile:", error))
        .finally(() => setProfileLoading(false));
    }
  }, [user, profile]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.logo}>🧠 Sage</Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  if (!profile?.skill_level) {
    return isProfileLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    ) : (
      <OnboardingNavigator />
    );
  }

  return <AppNavigator />; // Render the new main app navigator
};

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
