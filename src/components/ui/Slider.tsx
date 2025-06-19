import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { Box, Text } from '.';
import { Theme } from '../../constants/restyleTheme';

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  trackHeight?: number;
  thumbSize?: number;
  trackColor?: string;
  thumbColor?: string;
  activeTrackColor?: string;
  showLabels?: boolean;
  labels?: string[];
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 5,
  step = 1,
  trackHeight = 6,
  thumbSize = 24,
  trackColor = 'border',
  thumbColor = 'primary',
  activeTrackColor = 'primary',
  showLabels = false,
  labels = [],
  disabled = false,
}) => {
  const theme = useTheme<Theme>();
  const translateX = useSharedValue(0);
  const isActive = useSharedValue(false);
  const sliderWidth = 280; // Fixed width for consistency

  // Convert value to position
  const valueToPosition = (val: number) => {
    const range = maximumValue - minimumValue;
    const normalizedValue = (val - minimumValue) / range;
    return normalizedValue * (sliderWidth - thumbSize);
  };

  // Convert position to value
  const positionToValue = (pos: number) => {
    const range = maximumValue - minimumValue;
    const normalizedPosition = pos / (sliderWidth - thumbSize);
    const rawValue = minimumValue + normalizedPosition * range;
    return Math.round(rawValue / step) * step;
  };

  // Initialize position based on value
  React.useEffect(() => {
    translateX.value = valueToPosition(value);
  }, [value]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (!disabled) {
        isActive.value = true;
      }
    })
    .onUpdate((event) => {
      if (!disabled) {
        const newPosition = clamp(
          translateX.value + event.translationX,
          0,
          sliderWidth - thumbSize
        );
        translateX.value = newPosition;
        
        const newValue = positionToValue(newPosition);
        if (newValue >= minimumValue && newValue <= maximumValue) {
          runOnJS(onValueChange)(newValue);
        }
      }
    })
    .onEnd(() => {
      if (!disabled) {
        isActive.value = false;
        // Snap to nearest step
        const snappedValue = Math.round((value - minimumValue) / step) * step + minimumValue;
        const snappedPosition = valueToPosition(snappedValue);
        translateX.value = snappedPosition;
      }
    });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: disabled ? 0.5 : 1,
    };
  });

  const activeTrackStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + thumbSize / 2,
    };
  });

  return (
    <Box alignItems="center" opacity={disabled ? 0.5 : 1}>
      {/* Value Display */}
      <Box marginBottom="sm" minHeight={24} justifyContent="center">
        <Text variant="h3" color="primaryText" textAlign="center">
          {value}
        </Text>
      </Box>

      {/* Slider Track */}
      <Box 
        width={sliderWidth} 
        height={trackHeight}
        backgroundColor="border"
        borderRadius="lg"
        justifyContent="center"
        position="relative"
      >
        {/* Active Track */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              height: trackHeight,
              backgroundColor: theme.colors.primary,
              borderRadius: trackHeight / 2,
            },
            activeTrackStyle,
          ]}
        />

        {/* Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: thumbSize,
                height: thumbSize,
                backgroundColor: theme.colors.primary,
                borderRadius: thumbSize / 2,
                top: -((thumbSize - trackHeight) / 2),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              },
              thumbStyle,
            ]}
          />
        </GestureDetector>
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
        position="absolute"
        top={32}
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