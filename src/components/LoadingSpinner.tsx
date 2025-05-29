// src/components/LoadingSpinner.tsx
import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "large",
}) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} color="#4CAF50" />
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
