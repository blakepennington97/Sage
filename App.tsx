import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "@shopify/restyle";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthWrapper } from "./src/components/AuthWrapper";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { ToastProvider } from "./src/components/ui";
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <ToastProvider>
              <NavigationContainer>
                <ErrorBoundary>
                  <StatusBar style="light" />
                  <AuthWrapper />
                </ErrorBoundary>
              </NavigationContainer>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
