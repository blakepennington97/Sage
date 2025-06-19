import { createTheme } from '@shopify/restyle';

const palette = {
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

const theme = createTheme({
  colors: {
    ...palette,
    // Semantic color mappings
    mainBackground: palette.background,
    cardPrimaryBackground: palette.surface,
    cardSecondaryBackground: palette.surfaceVariant,
    primaryText: palette.text,
    secondaryText: palette.textSecondary,
    tertiaryText: palette.textTertiary,
    primaryButton: palette.primary,
    primaryButtonText: palette.text,
    secondaryButton: palette.surface,
    secondaryButtonText: palette.text,
    dangerButton: palette.error,
    dangerButtonText: palette.text,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  textVariants: {
    h1: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 34,
      color: 'primaryText',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 30,
      color: 'primaryText',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 26,
      color: 'primaryText',
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 22,
      color: 'primaryText',
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 18,
      color: 'secondaryText',
    },
    small: {
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 16,
      color: 'secondaryText',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
    },
  },
  buttonVariants: {
    primary: {
      backgroundColor: 'primaryButton',
      paddingVertical: 'md',
      paddingHorizontal: 'lg',
      borderRadius: 'md',
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondary: {
      backgroundColor: 'secondaryButton',
      borderWidth: 1,
      borderColor: 'border',
      paddingVertical: 'md',
      paddingHorizontal: 'lg',
      borderRadius: 'md',
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    danger: {
      backgroundColor: 'dangerButton',
      paddingVertical: 'md',
      paddingHorizontal: 'lg',
      borderRadius: 'md',
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      paddingVertical: 'sm',
      paddingHorizontal: 'md',
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
  cardVariants: {
    primary: {
      backgroundColor: 'cardPrimaryBackground',
      borderRadius: 'md',
      padding: 'md',
      shadowColor: 'shadow',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    secondary: {
      backgroundColor: 'cardSecondaryBackground',
      borderRadius: 'md',
      padding: 'md',
      borderWidth: 1,
      borderColor: 'border',
    },
  },
});

export type Theme = typeof theme;
export default theme;