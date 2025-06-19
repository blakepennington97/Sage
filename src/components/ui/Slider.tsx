import React from 'react';
import Slider from '@react-native-community/slider';
import { createBox, createText } from '@shopify/restyle';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../constants/restyleTheme';

// Create components directly to avoid circular imports
const Box = createBox<Theme>();
const Text = createText<Theme>();

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  showLabels?: boolean;
  labels?: string[];
  disabled?: boolean;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
}

export const CustomSlider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 5,
  step = 1,
  showLabels = false,
  labels = [],
  disabled = false,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
}) => {
  const theme = useTheme<Theme>();
  const sliderWidth = 280;

  return (
    <Box alignItems="center" opacity={disabled ? 0.5 : 1}>
      {/* Value Display */}
      <Box marginBottom="sm" minHeight={24} justifyContent="center">
        <Text variant="h3" color="primaryText" textAlign="center">
          {value}
        </Text>
      </Box>

      {/* Community Slider */}
      <Box width={sliderWidth} alignItems="center">
        <Slider
          style={{ width: sliderWidth, height: 40 }}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          value={value}
          onValueChange={onValueChange}
          step={step}
          disabled={disabled}
          minimumTrackTintColor={minimumTrackTintColor || theme.colors.primary}
          maximumTrackTintColor={maximumTrackTintColor || theme.colors.border}
          thumbTintColor={thumbTintColor || theme.colors.primary}
        />
      </Box>

      {/* Labels */}
      {showLabels && labels.length > 0 && (
        <Box 
          flexDirection="row" 
          justifyContent="space-between" 
          width={sliderWidth}
          marginTop="sm"
        >
          {labels.map((label, index) => (
            <Box key={index} flex={1} alignItems="center">
              <Text 
                variant="caption" 
                color="secondaryText" 
                textAlign="center"
                fontSize={12}
              >
                {label}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Step Indicators */}
      <Box 
        flexDirection="row" 
        justifyContent="space-between" 
        width={sliderWidth}
        marginTop="xs"
        paddingHorizontal="sm"
      >
        {Array.from({ length: maximumValue - minimumValue + 1 }, (_, index) => {
          const stepValue = minimumValue + index;
          return (
            <Box 
              key={stepValue}
              width={4}
              height={4}
              borderRadius="sm"
              backgroundColor={stepValue <= value ? "primary" : "border"}
            />
          );
        })}
      </Box>
    </Box>
  );
};