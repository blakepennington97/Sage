// App.tsx - Replace your existing App.tsx with this
import React from "react";
import { Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AITestScreen } from "./src/screens/AITestScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SkillEvaluationScreen } from "./src/screens/SkillEvaluationScreen";
import { KitchenAssessmentScreen } from "./src/screens/KitchenAssessmentScreen";
import { RecipeGenerationScreen } from "./src/screens/RecipeGenerationScreen";
import { CookingCoachScreen } from "./src/screens/CookingCoachScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
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
          name="Skills"
          component={SkillEvaluationScreen}
          options={{
            tabBarIcon: () => <Text>🌱</Text>,
            title: "Skills",
          }}
        />
        <Tab.Screen
          name="Kitchen"
          component={KitchenAssessmentScreen}
          options={{
            tabBarIcon: () => <Text>🏠</Text>,
            title: "Kitchen",
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
    </NavigationContainer>
  );
}
