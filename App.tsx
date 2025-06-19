import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "@shopify/restyle";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthWrapper } from "./src/components/AuthWrapper";
import Toast from "react-native-toast-message";
import theme from "./src/constants/restyleTheme";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <NavigationContainer>
          <StatusBar style="light" />
          <AuthWrapper />
          <Toast />
        </NavigationContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
