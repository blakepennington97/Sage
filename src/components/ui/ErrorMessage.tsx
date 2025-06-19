import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Box, Text, Button } from './index';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'fullscreen' | 'inline' | 'card';
  retryText?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  variant = 'inline',
  retryText = 'Try Again',
}) => {
  if (variant === 'fullscreen') {
    return (
      <Box 
        flex={1} 
        backgroundColor="mainBackground" 
        justifyContent="center" 
        alignItems="center"
        padding="xl"
      >
        <Text fontSize={48} marginBottom="md">😕</Text>
        <Text variant="h2" textAlign="center" marginBottom="sm">
          {title}
        </Text>
        <Text 
          variant="body" 
          color="secondaryText" 
          textAlign="center" 
          marginBottom="lg"
        >
          {message}
        </Text>
        {onRetry && (
          <Button variant="primary" onPress={onRetry}>
            <Text variant="button" color="primaryButtonText">
              {retryText}
            </Text>
          </Button>
        )}
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Box 
        backgroundColor="surface" 
        padding="lg" 
        borderRadius="md" 
        margin="md"
        borderWidth={1}
        borderColor="error"
      >
        <Text variant="h3" color="error" marginBottom="sm">
          {title}
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="md">
          {message}
        </Text>
        {onRetry && (
          <Button variant="secondary" onPress={onRetry}>
            <Text variant="button" color="secondaryText">
              {retryText}
            </Text>
          </Button>
        )}
      </Box>
    );
  }

  // Inline variant
  return (
    <Box 
      backgroundColor="errorBackground" 
      padding="md" 
      borderRadius="sm"
      margin="sm"
    >
      <Text variant="caption" color="error" marginBottom="xs">
        {title}
      </Text>
      <Text variant="body" color="error" marginBottom={onRetry ? "sm" : undefined}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text variant="caption" color="error" fontWeight="bold">
            {retryText}
          </Text>
        </TouchableOpacity>
      )}
    </Box>
  );
};