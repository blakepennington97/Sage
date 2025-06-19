import React from 'react';
import { ActivityIndicator } from 'react-native';
import { createBox, createText } from '@shopify/restyle';
import { Theme } from '../../constants/restyleTheme';

// Create components directly to avoid circular imports
const Box = createBox<Theme>();
const Text = createText<Theme>();

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  variant?: 'fullscreen' | 'inline';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'large',
  variant = 'fullscreen',
}) => {
  if (variant === 'inline') {
    return (
      <Box flexDirection="row" alignItems="center" padding="md">
        <ActivityIndicator size={size} color="#4CAF50" />
        {message && (
          <Text variant="body" color="secondaryText" marginLeft="sm">
            {message}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box 
      flex={1} 
      backgroundColor="mainBackground" 
      justifyContent="center" 
      alignItems="center"
      padding="xl"
    >
      <ActivityIndicator size={size} color="#4CAF50" />
      {message && (
        <Text 
          variant="body" 
          color="secondaryText" 
          marginTop="md" 
          textAlign="center"
        >
          {message}
        </Text>
      )}
    </Box>
  );
};