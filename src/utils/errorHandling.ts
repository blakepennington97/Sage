import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  isNetworkError?: boolean;
  isUserError?: boolean;
}

export class ErrorHandler {
  static handleNetworkError(error: any): AppError {
    const networkError: AppError = {
      message: 'Network connection failed. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      isNetworkError: true,
      details: error,
    };

    // Show toast for network errors
    Toast.show({
      type: 'error',
      text1: 'Connection Error',
      text2: networkError.message,
      visibilityTime: 4000,
    });

    return networkError;
  }

  static handleAPIError(error: any, operation: string): AppError {
    let message = `Failed to ${operation}. Please try again.`;
    let isUserError = false;

    // Parse different types of API errors
    if (error?.message) {
      message = error.message;
    } else if (error?.error?.message) {
      message = error.error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Check for user-related errors (validation, auth, etc.)
    if (message.toLowerCase().includes('email') || 
        message.toLowerCase().includes('password') ||
        message.toLowerCase().includes('validation') ||
        message.toLowerCase().includes('invalid')) {
      isUserError = true;
    }

    const apiError: AppError = {
      message,
      code: error?.code || 'API_ERROR',
      isUserError,
      details: error,
    };

    // Show appropriate UI feedback
    if (isUserError) {
      // For user errors, show alert with clear message
      Alert.alert('Invalid Input', message);
    } else {
      // For system errors, show toast
      Toast.show({
        type: 'error',
        text1: 'Operation Failed',
        text2: message,
        visibilityTime: 4000,
      });
    }

    return apiError;
  }

  static handleUnknownError(error: any, operation: string): AppError {
    console.error(`Unknown error during ${operation}:`, error);

    const unknownError: AppError = {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
      details: error,
    };

    Toast.show({
      type: 'error',
      text1: 'Unexpected Error',
      text2: unknownError.message,
      visibilityTime: 4000,
    });

    return unknownError;
  }

  static isNetworkError(error: any): boolean {
    return (
      error?.name === 'NetworkError' ||
      error?.code === 'NETWORK_ERROR' ||
      error?.message?.includes('network') ||
      error?.message?.includes('fetch') ||
      error?.message?.includes('connection') ||
      !navigator.onLine
    );
  }

  static handleError(error: any, operation: string): AppError {
    console.error(`Error during ${operation}:`, error);

    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error);
    }

    if (error?.code || error?.error || typeof error?.message === 'string') {
      return this.handleAPIError(error, operation);
    }

    return this.handleUnknownError(error, operation);
  }

  static showSuccessToast(message: string, title = 'Success') {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      visibilityTime: 3000,
    });
  }

  static showInfoToast(message: string, title = 'Info') {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      visibilityTime: 3000,
    });
  }
}

// Utility function for wrapping async operations
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    ErrorHandler.handleError(error, operationName);
    return null;
  }
}