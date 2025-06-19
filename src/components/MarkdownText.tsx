// src/components/MarkdownText.tsx
import React from "react";
import { Text } from "react-native";
import { colors, typography } from "../constants/theme";

interface MarkdownTextProps {
  children: string;
  style?: any;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({
  children,
  style,
}) => {
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <Text
            key={index}
            style={{ fontWeight: "bold", color: colors.primary }}
          >
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <Text style={[{ ...typography.body, color: colors.text }, style]}>
      {renderText(children)}
    </Text>
  );
};
