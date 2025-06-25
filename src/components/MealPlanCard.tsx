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
  onClone?: () => void;
  onServingsChange?: (newServings: number) => void;
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
  onClone,
  onServingsChange,
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
            
            <Text variant="h2" color="primaryText" marginBottom="xs" numberOfLines={2} fontSize={16} fontWeight="700">
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
              👥 {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''} total
            </Text>
            
            {/* Servings for this meal adjustment */}
            {onServingsChange && (
              <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginTop="sm">
                <Text variant="caption" color="secondaryText">
                  🍽️ For this meal:
                </Text>
                <Box flexDirection="row" alignItems="center" gap="sm">
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent card press
                      const currentServings = recipe.servingsForMeal || 1;
                      if (currentServings > 0.5 && onServingsChange) {
                        onServingsChange(currentServings - 0.5);
                      }
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text variant="h3" color="primary" fontSize={18}>-</Text>
                  </TouchableOpacity>
                  
                  <Text variant="body" color="primaryText" fontWeight="600" minWidth={30} textAlign="center">
                    {recipe.servingsForMeal || 1}
                  </Text>

                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent card press
                      const currentServings = recipe.servingsForMeal || 1;
                      if (onServingsChange) {
                        onServingsChange(currentServings + 0.5);
                      }
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text variant="h3" color="primary" fontSize={18}>+</Text>
                  </TouchableOpacity>
                </Box>
              </Box>
            )}
          </Box>

          <Box flexDirection="row" gap="xs" marginLeft="sm">
            {onClone && (
              <TouchableOpacity onPress={onClone}>
                <Box
                  backgroundColor="surface"
                  borderRadius="sm"
                  padding="xs"
                  borderWidth={1}
                  borderColor="primary"
                >
                  <Text variant="caption" color="primary">
                    📋
                  </Text>
                </Box>
              </TouchableOpacity>
            )}
            
            {onRemove && (
              <TouchableOpacity onPress={onRemove}>
                <Box
                  backgroundColor="surface"
                  borderRadius="sm"
                  padding="xs"
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
        </Box>
      </Card>
    </TouchableOpacity>
  );
};