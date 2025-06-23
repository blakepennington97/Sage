import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Text } from './ui';
import { MealPlanCard } from './MealPlanCard';
import { DailyMacroBreakdown } from './DailyMacroBreakdown';
import { 
  WeeklyMealPlan, 
  MealPlanRecipe,
  DAYS_OF_WEEK, 
  MEAL_TYPES, 
  MealType,
  getWeekDates
} from '../types/mealPlan';

interface MacroGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

interface WeeklyMealGridProps {
  mealPlan: WeeklyMealPlan;
  macroGoals?: MacroGoals;
  onAddRecipe: (date: string, mealType: MealType) => void;
  onViewRecipe: (recipeId: string) => void;
  onRemoveRecipe: (date: string, mealType: MealType) => void;
  onCloneRecipe: (recipe: MealPlanRecipe, mealType: MealType) => void;
}

export const WeeklyMealGrid: React.FC<WeeklyMealGridProps> = ({
  mealPlan,
  macroGoals,
  onAddRecipe,
  onViewRecipe,
  onRemoveRecipe,
  onCloneRecipe,
}) => {
  const weekDates = getWeekDates(mealPlan.week_start_date);

  const formatDateHeader = (dateString: string, dayIndex: number): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${DAYS_OF_WEEK[dayIndex]}\n${month} ${day}`;
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Box flexDirection="row" padding="md">
        {weekDates.map((date, dayIndex) => {
          const dayMealPlan = mealPlan.days.find(day => day.date === date);
          
          return (
            <Box key={date} width={280} marginRight="md">
              {/* Day Header */}
              <Box 
                backgroundColor="surface" 
                padding="md" 
                borderRadius="md" 
                marginBottom="md"
                alignItems="center"
              >
                <Text variant="h3" color="primaryText" textAlign="center">
                  {formatDateHeader(date, dayIndex)}
                </Text>
              </Box>

              {/* Meal Cards */}
              <Box>
                {MEAL_TYPES.map((mealType) => {
                  if (mealType === 'snacks') {
                    // Handle snacks specially as they can have multiple items
                    return (
                      <Box key={`${date}-${mealType}`} marginTop="sm">
                        <Text variant="caption" color="secondaryText" marginBottom="xs" paddingLeft="sm">
                          🍿 Snacks
                        </Text>
                        {dayMealPlan?.snacks?.map((snack, index) => (
                          <MealPlanCard
                            key={`${date}-snack-${index}`}
                            recipe={snack}
                            mealType="snacks"
                            date={date}
                            onPress={() => onViewRecipe(snack.recipe_id)}
                            onRemove={() => onRemoveRecipe(date, 'snacks')}
                            onClone={() => onCloneRecipe(snack, 'snacks')}
                          />
                        ))}
                        {/* Always show "Add Snack" option */}
                        <MealPlanCard
                          recipe={undefined}
                          mealType="snacks"
                          date={date}
                          onPress={() => onAddRecipe(date, 'snacks')}
                        />
                      </Box>
                    );
                  }
                  
                  // Handle regular meals (breakfast, lunch, dinner)
                  const recipe = dayMealPlan?.[mealType];
                  
                  return (
                    <MealPlanCard
                      key={`${date}-${mealType}`}
                      recipe={recipe}
                      mealType={mealType}
                      date={date}
                      onPress={() => {
                        if (recipe) {
                          onViewRecipe(recipe.recipe_id);
                        } else {
                          onAddRecipe(date, mealType);
                        }
                      }}
                      onRemove={recipe ? () => onRemoveRecipe(date, mealType) : undefined}
                      onClone={recipe ? () => onCloneRecipe(recipe, mealType) : undefined}
                    />
                  );
                })}
              </Box>

              {/* Daily Macro Breakdown */}
              {macroGoals && dayMealPlan && (
                <DailyMacroBreakdown
                  dayPlan={dayMealPlan}
                  goals={macroGoals}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </ScrollView>
  );
};