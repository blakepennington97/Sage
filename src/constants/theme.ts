// src/constants/theme.ts
export const colors = {
  primary: "#4CAF50",
  primaryDark: "#388E3C",
  secondary: "#FF6B35",

  // Dark theme colors
  background: "#121212",
  surface: "#1E1E1E",
  surfaceVariant: "#2D2D2D",

  // Text colors
  text: "#FFFFFF",
  textSecondary: "#B3B3B3",
  textTertiary: "#666666",

  // Status colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",

  // UI elements
  border: "#333333",
  divider: "#2D2D2D",
  disabled: "#555555",

  // Special
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.3)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: "bold" as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold" as const,
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "normal" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: "normal" as const,
    lineHeight: 18,
  },
  small: {
    fontSize: 12,
    fontWeight: "normal" as const,
    lineHeight: 16,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
};
