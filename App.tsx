// App.tsx - Updated with onboarding flow
import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { UserProfileService } from "./src/services/userProfile";
import { AITestScreen } from "./src/screens/AITestScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SkillEvaluationScreen } from "./src/screens/SkillEvaluationScreen";
import { KitchenAssessmentScreen } from "./src/screens/KitchenAssessmentScreen";
import { RecipeGenerationScreen } from "./src/screens/RecipeGenerationScreen";
import { CookingCoachScreen } from "./src/screens/CookingCoachScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Skills" component={SkillEvaluationScreen} />
    <Stack.Screen name="Kitchen" component={KitchenAssessmentScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#4CAF50",
      tabBarInactiveTintColor: "#666",
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

export default function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    checkOnboardingStatus();

    // Re-check onboarding status when app becomes focused
    const interval = setInterval(checkOnboardingStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await UserProfileService.hasCompletedOnboarding();
      setHasCompletedOnboarding(completed);
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
      setHasCompletedOnboarding(false);
    }
  };

  // Loading state
  if (hasCompletedOnboarding === null) {
    return (
      <View style={loadingStyles.container}>
        <Text style={loadingStyles.logo}>🧠 Sage</Text>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={loadingStyles.message}>
          Starting your cooking coach...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {hasCompletedOnboarding ? <MainTabs /> : <OnboardingStack />}
    </NavigationContainer>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  logo: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 40,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
