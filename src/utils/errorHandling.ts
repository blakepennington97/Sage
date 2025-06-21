import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Production error logging and monitoring
  static async logError(error: AppError, context: {
    userId?: string;
    operation: string;
    timestamp?: number;
    deviceInfo?: any;
    stackTrace?: string;
  }): Promise<void> {
    const errorLog = {
      id: Date.now().toString(),
      error: {
        message: error.message,
        code: error.code,
        isNetworkError: error.isNetworkError,
        isUserError: error.isUserError,
        details: error.details
      },
      context: {
        ...context,
        timestamp: context.timestamp || Date.now(),
        userAgent: navigator.userAgent || 'Unknown',
        url: window.location?.href || 'React Native App'
      }
    };

    try {
      // Store error log locally
      await this.storeErrorLog(errorLog);
      
      // In production, you would also send to your error monitoring service
      // await this.sendToMonitoringService(errorLog);
      
      console.log('Error logged successfully:', errorLog.id);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  private static async storeErrorLog(errorLog: any): Promise<void> {
    try {
      const existingLogs = await AsyncStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log
      logs.push(errorLog);
      
      // Keep only last 50 errors to prevent storage bloat
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      await AsyncStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store error log:', error);
    }
  }

  static async getErrorLogs(): Promise<any[]> {
    try {
      const logs = await AsyncStorage.getItem('error_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to retrieve error logs:', error);
      return [];
    }
  }

  static async clearErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem('error_logs');
      console.log('Error logs cleared');
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  static async getErrorStats(): Promise<{
    totalErrors: number;
    recentErrors: number;
    errorsByType: Record<string, number>;
    errorsByOperation: Record<string, number>;
  }> {
    try {
      const logs = await this.getErrorLogs();
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      const recentErrors = logs.filter(log => log.context.timestamp > oneDayAgo);
      
      const errorsByType: Record<string, number> = {};
      const errorsByOperation: Record<string, number> = {};
      
      logs.forEach(log => {
        const errorType = log.error.code || 'UNKNOWN';
        const operation = log.context.operation || 'unknown';
        
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        errorsByOperation[operation] = (errorsByOperation[operation] || 0) + 1;
      });
      
      return {
        totalErrors: logs.length,
        recentErrors: recentErrors.length,
        errorsByType,
        errorsByOperation
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        recentErrors: 0,
        errorsByType: {},
        errorsByOperation: {}
      };
    }
  }

  // Enhanced error handling with automatic logging
  static async handleErrorWithLogging(
    error: any, 
    operation: string, 
    userId?: string
  ): Promise<AppError> {
    const appError = this.handleError(error, operation);
    
    // Log the error for monitoring
    await this.logError(appError, {
      userId,
      operation,
      stackTrace: error?.stack || new Error().stack
    });
    
    return appError;
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