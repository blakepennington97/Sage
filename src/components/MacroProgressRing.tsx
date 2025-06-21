import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { Box, Text } from "./ui";

interface MacroProgressRingProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export const MacroProgressRing: React.FC<MacroProgressRingProps> = ({
  label,
  current,
  goal,
  unit,
  color,
  size = 80,
  strokeWidth = 6,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / goal, 1); // Cap at 100%
  const strokeDashoffset = circumference - (progress * circumference);
  
  const isOverGoal = current > goal;
  const displayColor = isOverGoal ? "#ff6b6b" : color;
  
  return (
    <Box alignItems="center" gap="xs">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e8e8e8"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={displayColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* Center text - current value */}
          <SvgText
            x={size / 2}
            y={size / 2 - 4}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill={displayColor}
          >
            {Math.round(current)}
          </SvgText>
          {/* Center text - unit */}
          <SvgText
            x={size / 2}
            y={size / 2 + 12}
            textAnchor="middle"
            fontSize="10"
            fill="#666"
          >
            {unit}
          </SvgText>
        </Svg>
      </View>
      
      <Box alignItems="center">
        <Text variant="caption" color="primaryText" fontWeight="500">
          {label}
        </Text>
        <Text variant="caption" color={isOverGoal ? "errorText" : "secondaryText"}>
          {Math.round(current)} / {goal} {unit}
        </Text>
        <Text variant="caption" color={isOverGoal ? "errorText" : "primaryGreen"} fontSize={10}>
          {Math.round(progress * 100)}%
        </Text>
      </Box>
    </Box>
  );
};