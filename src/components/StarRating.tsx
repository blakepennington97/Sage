import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Box, Text } from './ui';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  showRatingText?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 'medium',
  interactive = false,
  showRatingText = true,
}) => {
  const starSizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const starSize = starSizes[size];

  const handleStarPress = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  const getRatingText = (rating: number): string => {
    if (rating === 0) return 'Not rated';
    if (rating <= 1) return 'Poor';
    if (rating <= 2) return 'Fair';
    if (rating <= 3) return 'Good';
    if (rating <= 4) return 'Very Good';
    return 'Excellent';
  };

  return (
    <Box flexDirection="row" alignItems="center" gap="xs">
      <Box flexDirection="row" gap="xs">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;
          const starComponent = (
            <Text
              key={star}
              style={{ fontSize: starSize, color: isFilled ? '#FF9800' : undefined }}
              color={isFilled ? undefined : 'textSecondary'}
            >
              {isFilled ? '★' : '☆'}
            </Text>
          );

          if (interactive) {
            return (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
              >
                {starComponent}
              </TouchableOpacity>
            );
          }

          return starComponent;
        })}
      </Box>
      
      {showRatingText && (
        <Text variant="caption" color="secondaryText">
          {getRatingText(rating)} {rating > 0 && `(${rating}/5)`}
        </Text>
      )}
    </Box>
  );
};