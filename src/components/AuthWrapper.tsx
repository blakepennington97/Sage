// src/components/AuthWrapper.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthService, ProfileService } from "../services/supabase";
import { UserProfileService } from "../services/userProfile";
import { LoginScreen } from "../screens/LoginScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { SkillEvaluationScreen } from "../screens/SkillEvaluationScreen";
import { KitchenAssessmentScreen } from "../screens/KitchenAssessmentScreen";
import { RecipeGenerationScreen } from "../screens/RecipeGenerationScreen";
import { CookingCoachScreen } from "../screens/CookingCoachScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors, spacing, typography } from "../constants/theme";

const AuthStack = createStackNavigator();
const OnboardingStack = createStackNavigator();
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
      options={{
        tabBarIcon: () => <Text>👨‍🍳</Text>,
        title: "Recipes",
      }}
    />
    <Tab.Screen
      name="CookingCoach"
      component={CookingCoachScreen}
      options={{
        tabBarButton: () => null, // Hide from tab bar
        title: "Cooking Coach",
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarIcon: () => <Text>⚙️</Text>,
        title: "Settings",
      }}
    />
  </Tab.Navigator>
);

export const AuthWrapper: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // Check current auth state
    checkAuthState();

    // Listen for auth changes
    const {
      data: { subscription },
    } = AuthService.onAuthChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        await checkUserProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setHasProfile(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await checkUserProfile(currentUser.id);
      }
    } catch (error) {
      console.error("Auth state check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserProfile = async (userId: string) => {
    try {
      const profile = await ProfileService.getProfile(userId);
      setHasProfile(!!profile?.skill_level); // Has completed onboarding
    } catch (error) {
      console.error("Profile check failed:", error);
      setHasProfile(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.logo}>🧠 Sage</Text>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Not authenticated
  if (!user) {
    return <AuthNavigator />;
  }

  // Authenticated but no profile
  if (!hasProfile) {
    return <OnboardingNavigator />;
  }

  // Authenticated with profile
  return <MainTabs />;
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
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
