import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Box, Text, Card } from './ui';
import { MealPlanRecipe, MealType } from '../types/mealPlan';

interface MealPlanCardProps {
  recipe?: MealPlanRecipe;
  mealType: MealType;
  date: string;
  onPress: () => void;
  onRemove?: () => void;
}

const getMealTypeEmoji = (mealType: MealType): string => {
  switch (mealType) {
    case 'breakfast': return '🍳';
    case 'lunch': return '🥗';
    case 'dinner': return '🍽️';
    case 'snacks': return '🍎';
    default: return '🍴';
  }
};

const getMealTypeColor = (mealType: MealType): string => {
  switch (mealType) {
    case 'breakfast': return '#FF9800'; // Orange
    case 'lunch': return '#4CAF50'; // Green  
    case 'dinner': return '#2196F3'; // Blue
    case 'snacks': return '#9C27B0'; // Purple
    default: return '#666';
  }
};

const getDifficultyStars = (difficulty: number): string => {
  return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
};

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  recipe,
  mealType,
  date,
  onPress,
  onRemove,
}) => {
  if (!recipe) {
    // Empty slot - show add button
    return (
      <TouchableOpacity onPress={onPress}>
        <Card
          variant="secondary"
          padding="md"
          marginBottom="sm"
          borderWidth={2}
          borderColor="border"
          borderStyle="dashed"
          minHeight={80}
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={24} marginBottom="xs">
            {getMealTypeEmoji(mealType)}
          </Text>
          <Text variant="caption" color="secondaryText" textAlign="center">
            Add {mealType}
          </Text>
          <Text variant="caption" color="primary" textAlign="center" marginTop="xs">
            Tap to add recipe
          </Text>
        </Card>
      </TouchableOpacity>
    );
  }

  // Recipe assigned - show recipe details
  return (
    <TouchableOpacity onPress={onPress}>
      <Card
        variant="primary"
        padding="md"
        marginBottom="sm"
        borderLeftWidth={4}
        style={{ borderLeftColor: getMealTypeColor(mealType) }}
      >
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box flexDirection="row" alignItems="center" marginBottom="xs">
              <Text fontSize={16} marginRight="xs">
                {getMealTypeEmoji(mealType)}
              </Text>
              <Text variant="caption" color="secondaryText" textTransform="capitalize">
                {mealType}
              </Text>
            </Box>
            
            <Text variant="h3" color="primaryText" marginBottom="xs" numberOfLines={2}>
              {recipe.recipe_name}
            </Text>
            
            <Box flexDirection="row" alignItems="center" marginBottom="xs">
              <Text variant="caption" color="secondaryText" marginRight="md">
                ⏱️ {recipe.estimated_time}
              </Text>
              <Text variant="caption" color="secondaryText">
                {getDifficultyStars(recipe.difficulty_level)}
              </Text>
            </Box>
            
            <Text variant="caption" color="secondaryText">
              👥 {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
            </Text>
          </Box>

          {onRemove && (
            <TouchableOpacity onPress={onRemove}>
              <Box
                backgroundColor="surface"
                borderRadius="sm"
                padding="xs"
                marginLeft="sm"
                borderWidth={1}
                borderColor="error"
              >
                <Text variant="caption" color="error">
                  ✕
                </Text>
              </Box>
            </TouchableOpacity>
          )}
        </Box>
      </Card>
    </TouchableOpacity>
  );
};