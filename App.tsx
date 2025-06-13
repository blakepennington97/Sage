import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { AuthWrapper } from "./src/components/AuthWrapper";

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AuthWrapper />
    </NavigationContainer>
  );
}
