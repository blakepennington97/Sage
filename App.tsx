// App.tsx - Replace your existing App.tsx with this
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AITestScreen } from "./src/screens/AITestScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

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
          name="Chat"
          component={AITestScreen}
          options={{
            tabBarIcon: () => "💬",
            title: "AI Coach",
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: () => "⚙️",
            title: "Settings",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
