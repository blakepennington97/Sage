import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text, Button } from './ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // TODO: Log to crash reporting service (e.g., Sentry)
    // crashlytics().recordError(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box 
          flex={1} 
          backgroundColor="mainBackground" 
          justifyContent="center" 
          alignItems="center" 
          padding="xl"
        >
          <Text fontSize={64} marginBottom="lg">💥</Text>
          <Text variant="h2" textAlign="center" marginBottom="sm">
            Oops! Something went wrong
          </Text>
          <Text variant="body" color="secondaryText" textAlign="center" marginBottom="md">
            We're sorry, but something unexpected happened. Please try again.
          </Text>
          
          {__DEV__ && this.state.error && (
            <Box 
              backgroundColor="surface" 
              padding="md" 
              borderRadius="md" 
              marginVertical="lg"
              maxHeight={200}
            >
              <Text variant="caption" color="secondaryText">
                {this.state.error.name}: {this.state.error.message}
              </Text>
            </Box>
          )}
          
          <Button 
            variant="primary" 
            marginTop="lg"
            onPress={this.handleRetry}
          >
            <Text variant="button" color="primaryButtonText">
              Try Again
            </Text>
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

