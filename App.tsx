import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "@shopify/restyle";
import { AuthWrapper } from "./src/components/AuthWrapper";
import Toast from "react-native-toast-message";
import theme from "./src/constants/restyleTheme";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="light" />
        <AuthWrapper />
        <Toast />
      </NavigationContainer>
    </ThemeProvider>
  );
}
