import React from 'react';
import { Text, Box } from './index';

export interface TagProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'cuisine' | 'filter';
  maxWidth?: number;
  size?: 'small' | 'medium';
  isSelected?: boolean;
  onPress?: () => void;
}

export const Tag: React.FC<TagProps> = ({ 
  text, 
  variant = 'cuisine', 
  maxWidth, 
  size = 'small',
  isSelected = false,
  onPress 
}) => {
  const getBackgroundColor = () => {
    if (variant === 'filter') {
      return isSelected ? 'primary' : 'surface';
    }
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'surface';
      case 'cuisine':
      default:
        return 'surfaceVariant';
    }
  };

  const getTextColor = () => {
    if (variant === 'filter') {
      return isSelected ? 'primaryButtonText' : 'text';
    }
    switch (variant) {
      case 'primary':
        return 'primaryButtonText';
      case 'secondary':
        return 'primaryText';
      case 'cuisine':
      default:
        return 'secondaryText';
    }
  };

  const paddingHorizontal = variant === 'filter' 
    ? 'sm' as const 
    : (size === 'small' ? 'xs' as const : 'sm' as const);

  const paddingVertical = 'xs' as const;

  return (
    <Box
      backgroundColor={getBackgroundColor()}
      paddingHorizontal={paddingHorizontal}
      paddingVertical={paddingVertical}
      borderRadius={variant === 'filter' ? 'lg' : 'md'}
      maxWidth={maxWidth}
      borderWidth={variant === 'filter' ? 1 : 0}
      borderColor={variant === 'filter' ? 'border' : undefined}
      alignSelf="flex-start"
    >
      <Text 
        variant={size === 'small' ? 'small' : 'caption'}
        color={getTextColor()}
        fontSize={variant === 'filter' ? 12 : (size === 'small' ? 10 : 12)}
        fontWeight={variant === 'filter' ? '500' : '600'}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        textAlign="center"
      >
        {text.toUpperCase()}
      </Text>
    </Box>
  );
};