// src/components/OfflineBanner.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const OfflineBanner: React.FC = () => (
  <View style={styles.banner}>
    <Text style={styles.text}>📶 No internet connection</Text>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#f44336",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
