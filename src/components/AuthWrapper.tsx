// src/components/AuthWrapper.tsx

import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthService, ProfileService } from "../services/supabase";
import { paymentService } from "../services/payment";
import { isFeatureEnabled } from "../config/features";
import { LoginScreen } from "../screens/LoginScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { SkillEvaluationScreen } from "../screens/SkillEvaluationScreen";
import { DietaryRestrictionsScreen } from "../screens/DietaryRestrictionsScreen";
import { MacroGoalsScreen } from "../screens/MacroGoalsScreen";
import { KitchenAssessmentScreen } from "../screens/KitchenAssessmentScreen";
import { RecipeGenerationScreen } from "../screens/RecipeGenerationScreen";
import { CookingCoachScreen } from "../screens/CookingCoachScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { RecipeBookScreen } from "../screens/RecipeBookScreen"; // Import new screen
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen"; // Import new screen
import { MealPlannerScreen } from "../screens/MealPlannerScreen";
import { UpgradeScreen } from "../screens/UpgradeScreen";
import { colors, spacing, typography } from "../constants/theme";
import { useAuthStore } from "../stores/authStore";
import { Text } from "./ui";

const AuthStack = createStackNavigator();
const OnboardingStack = createStackNavigator();
const AppStack = createStackNavigator(); // New main stack
const Tab = createBottomTabNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen 
      name="SignUp" 
      component={SignUpScreen}
      options={{
        gestureEnabled: true,
      }}
    />
  </AuthStack.Navigator>
);

const OnboardingNavigator = () => (
  <OnboardingStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
    }}
  >
    <OnboardingStack.Screen name="Skills" component={SkillEvaluationScreen} />
    <OnboardingStack.Screen
      name="DietaryRestrictions"
      component={DietaryRestrictionsScreen}
      options={{
        gestureEnabled: true,
      }}
    />
    <OnboardingStack.Screen
      name="MacroGoals"
      component={MacroGoalsScreen}
      options={{
        gestureEnabled: true,
      }}
    />
    <OnboardingStack.Screen
      name="Kitchen"
      component={KitchenAssessmentScreen}
      options={{
        gestureEnabled: true,
      }}
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
      options={{ tabBarIcon: () => <Text variant="body">📚</Text>, title: "Recipes" }}
    />
    <Tab.Screen
      name="MealPlanner"
      component={MealPlannerScreen}
      options={{ tabBarIcon: () => <Text variant="body">📅</Text>, title: "Meal Plan" }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarIcon: () => <Text variant="body">👤</Text>, title: "Profile" }}
    />
  </Tab.Navigator>
);

// This is the main App Navigator after login
const AppNavigator = () => (
  <AppStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
    }}
  >
    <AppStack.Screen name="Main" component={MainTabs} />
    <AppStack.Screen 
      name="RecipeDetail" 
      component={RecipeDetailScreen}
      options={{
        headerShown: true,
        title: "Recipe Details",
        headerBackTitle: "",
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
        gestureEnabled: true,
      }}
    />
    <AppStack.Screen
      name="RecipeGeneration"
      component={RecipeGenerationScreen}
      options={{ 
        presentation: "modal",
        headerShown: true,
        title: "Generate Recipe",
        headerBackTitle: "",
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
        gestureEnabled: true,
        gestureDirection: 'vertical',
      }}
    />
    <AppStack.Screen 
      name="CookingCoach" 
      component={CookingCoachScreen}
      options={{
        headerShown: true,
        title: "Cooking Guide",
        headerBackTitle: "",
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
        gestureEnabled: true,
      }}
    />
    {/* Payment system screens - only include when feature is enabled */}
    {isFeatureEnabled('paymentSystem') && (
      <AppStack.Screen
        name="Upgrade"
        component={UpgradeScreen}
        options={{
          presentation: "modal",
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
    )}
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
        // Log out from payment service (only if enabled)
        if (isFeatureEnabled('paymentSystem')) {
          paymentService.logoutUser().catch(console.error);
        }
      } else if (_event === "SIGNED_IN" && currentUser) {
        // Initialize payment service for new login (only if enabled)
        if (isFeatureEnabled('paymentSystem')) {
          paymentService.initialize(currentUser.id).catch(console.error);
        }
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !profile) {
      setProfileLoading(true);
      const profilePromise = ProfileService.getProfile(user.id);
      const paymentPromise = isFeatureEnabled('paymentSystem') 
        ? paymentService.initialize(user.id).catch(console.error)
        : Promise.resolve();
      
      Promise.all([profilePromise, paymentPromise])
        .then(([profileData]) => {
          setProfile(profileData);
          // Sync subscription status after profile is loaded (only if payment system is enabled)
          if (isFeatureEnabled('paymentSystem')) {
            paymentService.syncSubscriptionStatus().catch(console.error);
          }
        })
        .catch((error) => console.error("Failed to fetch profile:", error))
        .finally(() => setProfileLoading(false));
    }
  }, [user, profile]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="h1" style={styles.logo}>🧠 Sage</Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  // Check if onboarding is complete
  const isOnboardingComplete = profile?.skill_level && 
    profile?.allergies !== undefined && 
    profile?.dietary_restrictions !== undefined && 
    profile?.kitchen_tools;

  if (!isOnboardingComplete) {
    return isProfileLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="body" style={styles.loadingText}>Loading your profile...</Text>
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
