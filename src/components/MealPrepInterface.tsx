import React, { useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Box, Text, Button } from './ui';
import { 
  MealPlanRecipe, 
  MealType, 
  WeeklyMealPlan, 
  DAYS_OF_WEEK, 
  MEAL_TYPES,
  getWeekDates 
} from '../types/mealPlan';

interface MealSlot {
  date: string;
  mealType: MealType;
  dayName: string;
  isOccupied: boolean;
}

interface MealPrepInterfaceProps {
  recipe?: MealPlanRecipe;
  originalMealType?: MealType;
  mealPlan: WeeklyMealPlan | null;
  onCopyToSlots: (slots: { date: string; mealType: MealType }[]) => void;
  onClose: () => void;
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

export const MealPrepInterface: React.FC<MealPrepInterfaceProps> = ({
  recipe,
  originalMealType,
  mealPlan,
  onCopyToSlots,
  onClose,
}) => {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  if (!recipe || !mealPlan) return null;

  const weekDates = getWeekDates(mealPlan.week_start_date);
  
  // Create available meal slots for the week
  const availableSlots: MealSlot[] = [];
  
  weekDates.forEach((date, dayIndex) => {
    const dayMealPlan = mealPlan.days.find(day => day.date === date);
    
    MEAL_TYPES.forEach(mealType => {
      let isOccupied = false;
      
      if (mealType === 'snacks') {
        // For snacks, we can always add more
        isOccupied = false;
      } else {
        // For regular meals, check if slot is occupied
        isOccupied = Boolean(dayMealPlan?.[mealType]);
      }
      
      availableSlots.push({
        date,
        mealType,
        dayName: DAYS_OF_WEEK[dayIndex],
        isOccupied,
      });
    });
  });

  const toggleSlot = (slotKey: string) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slotKey)) {
      newSelected.delete(slotKey);
    } else {
      newSelected.add(slotKey);
    }
    setSelectedSlots(newSelected);
  };

  const handleCopyToSelected = () => {
    const slotsToUpdate = Array.from(selectedSlots).map(slotKey => {
      const [date, mealType] = slotKey.split('-');
      return { date, mealType: mealType as MealType };
    });
    
    onCopyToSlots(slotsToUpdate);
  };

  const selectSameMealType = () => {
    if (!originalMealType) return;
    
    const sameMealSlots = availableSlots
      .filter(slot => slot.mealType === originalMealType && !slot.isOccupied)
      .map(slot => `${slot.date}-${slot.mealType}`);
    
    setSelectedSlots(new Set(sameMealSlots));
  };

  const selectAllEmpty = () => {
    const emptySlots = availableSlots
      .filter(slot => !slot.isOccupied)
      .map(slot => `${slot.date}-${slot.mealType}`);
    
    setSelectedSlots(new Set(emptySlots));
  };

  return (
    <Box padding="lg">
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="lg">
        <Text variant="h2">🍽️ Meal Prep Helper</Text>
        <TouchableOpacity onPress={onClose}>
          <Text fontSize={24} color="textSecondary">✕</Text>
        </TouchableOpacity>
      </Box>

      {/* Recipe Info */}
      <Box backgroundColor="surface" padding="md" borderRadius="md" marginBottom="lg">
        <Text variant="h3" color="primaryText" marginBottom="xs">
          📋 {recipe.recipe_name}
        </Text>
        <Box flexDirection="row" alignItems="center" gap="md">
          <Text variant="caption" color="secondaryText">
            ⏱️ {recipe.estimated_time}
          </Text>
          <Text variant="caption" color="secondaryText">
            👥 {recipe.servings} servings
          </Text>
          <Text variant="caption" color="secondaryText">
            {'★'.repeat(recipe.difficulty_level)}
          </Text>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box flexDirection="row" gap="sm" marginBottom="lg">
        <Button
          variant="secondary"
          flex={1}
          onPress={selectSameMealType}
          disabled={!originalMealType}
        >
          <Text variant="button" color="primaryText" numberOfLines={1} textAlign="center">
            Same {originalMealType}s
          </Text>
        </Button>
        
        <Button
          variant="secondary"
          flex={1}
          onPress={selectAllEmpty}
        >
          <Text variant="button" color="primaryText" numberOfLines={1} textAlign="center">
            All Empty
          </Text>
        </Button>
        
        <Button
          variant="secondary"
          flex={1}
          onPress={() => setSelectedSlots(new Set())}
        >
          <Text variant="button" color="primaryText" numberOfLines={1} textAlign="center">
            Clear
          </Text>
        </Button>
      </Box>

      <Text variant="body" color="secondaryText" marginBottom="md">
        Select meal slots where you want to copy this recipe:
      </Text>

      {/* Meal Slot Grid */}
      <Box maxHeight={300}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {DAYS_OF_WEEK.map((dayName, dayIndex) => {
            const date = weekDates[dayIndex];
            const daySlots = availableSlots.filter(slot => slot.date === date);
            
            return (
              <Box key={date} marginBottom="md">
                <Text variant="h3" color="primaryText" marginBottom="sm">
                  {dayName} {new Date(date).getDate()}
                </Text>
                
                <Box flexDirection="row" gap="xs">
                  {daySlots.map(slot => {
                    const slotKey = `${slot.date}-${slot.mealType}`;
                    const isSelected = selectedSlots.has(slotKey);
                    
                    return (
                      <TouchableOpacity
                        key={slotKey}
                        onPress={() => !slot.isOccupied && toggleSlot(slotKey)}
                        disabled={slot.isOccupied}
                        style={{ flex: 1 }}
                      >
                        <Box
                          backgroundColor={
                            slot.isOccupied 
                              ? "disabled" 
                              : isSelected 
                                ? "primary" 
                                : "surface"
                          }
                          padding="sm"
                          borderRadius="md"
                          borderWidth={isSelected ? 2 : 1}
                          borderColor={
                            isSelected 
                              ? "primary" 
                              : slot.isOccupied 
                                ? "disabled" 
                                : "border"
                          }
                          opacity={slot.isOccupied ? 0.5 : 1}
                          alignItems="center"
                          minHeight={60}
                          justifyContent="center"
                        >
                          <Text fontSize={16} marginBottom="xs">
                            {getMealTypeEmoji(slot.mealType)}
                          </Text>
                          <Text 
                            variant="caption" 
                            color={
                              isSelected 
                                ? "primaryButtonText" 
                                : slot.isOccupied 
                                  ? "disabled" 
                                  : "secondaryText"
                            }
                            textAlign="center"
                            numberOfLines={1}
                          >
                            {slot.mealType}
                          </Text>
                          {slot.isOccupied && (
                            <Text variant="caption" color="disabled" textAlign="center">
                              occupied
                            </Text>
                          )}
                        </Box>
                      </TouchableOpacity>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </ScrollView>
      </Box>

      {/* Action Buttons */}
      <Box flexDirection="row" gap="md" marginTop="lg">
        <Button
          variant="secondary"
          flex={1}
          onPress={onClose}
        >
          <Text variant="button" color="primaryText">Cancel</Text>
        </Button>
        
        <Button
          variant="primary"
          flex={2}
          onPress={handleCopyToSelected}
          disabled={selectedSlots.size === 0}
        >
          <Text variant="button" color="primaryButtonText">
            Copy to {selectedSlots.size} slot{selectedSlots.size !== 1 ? 's' : ''}
          </Text>
        </Button>
      </Box>
    </Box>
  );
};