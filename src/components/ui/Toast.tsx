import React from 'react';
import { ToastProvider, useToast } from 'react-native-toast-notifications';
import { createBox, createText } from '@shopify/restyle';
import { Theme } from '../../constants/restyleTheme';

// Create components directly to avoid circular imports
const Box = createBox<Theme>();
const Text = createText<Theme>();

// Custom toast component with our theme
const CustomToast = ({ 
  message, 
  type 
}: { 
  message: string; 
  type: 'success' | 'error' | 'info' | 'warning' 
}) => {
  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#10B981', border: '#059669' };
      case 'error':
        return { bg: '#EF4444', border: '#DC2626' };
      case 'warning':
        return { bg: '#F59E0B', border: '#D97706' };
      default:
        return { bg: '#3B82F6', border: '#2563EB' };
    }
  };

  const colors = getColors();

  return (
    <Box
      backgroundColor="surface"
      borderRadius="md"
      padding="md"
      marginHorizontal="md"
      borderLeftWidth={4}
      style={{ borderLeftColor: colors.border }}
      shadowColor="shadow"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={3}
    >
      <Text variant="body" color="primaryText">
        {message}
      </Text>
    </Box>
  );
};

export const CustomToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider
      placement="top"
      duration={4000}
      animationType='slide-in'
      renderToast={(toastOptions) => (
        <CustomToast 
          message={toastOptions.message} 
          type={toastOptions.type as any} 
        />
      )}
      swipeEnabled={true}
    >
      {children}
    </ToastProvider>
  );
};

// Hook for using toast
export const useCustomToast = () => {
  const toast = useToast();
  
  return {
    show: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      toast.show(message, { type });
    },
    success: (message: string) => toast.show(message, { type: 'success' }),
    error: (message: string) => toast.show(message, { type: 'error' }),
    warning: (message: string) => toast.show(message, { type: 'warning' }),
    info: (message: string) => toast.show(message, { type: 'info' }),
  };
};