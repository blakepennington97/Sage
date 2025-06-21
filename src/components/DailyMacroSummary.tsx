import React from "react";
import { ScrollView } from "react-native";
import { Box, Text } from "./ui";
import { MacroProgressRing } from "./MacroProgressRing";

export interface DailyMacros {
  calories: { current: number; goal: number };
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
}

interface DailyMacroSummaryProps {
  macros: DailyMacros;
  date?: string;
  showDate?: boolean;
}

export const DailyMacroSummary: React.FC<DailyMacroSummaryProps> = ({
  macros,
  date,
  showDate = true,
}) => {
  const totalCaloriesFromMacros = 
    (macros.protein.current * 4) + 
    (macros.carbs.current * 4) + 
    (macros.fat.current * 9);

  const getCalorieConsistency = () => {
    const difference = Math.abs(macros.calories.current - totalCaloriesFromMacros);
    if (difference < 50) return "✅ Consistent";
    if (difference < 100) return "⚠️ Close";
    return "❌ Check entries";
  };

  const getMacroBalance = () => {
    if (!macros.calories.current) return "No meals logged";
    
    const proteinPercent = (macros.protein.current * 4) / totalCaloriesFromMacros * 100;
    const carbsPercent = (macros.carbs.current * 4) / totalCaloriesFromMacros * 100;
    const fatPercent = (macros.fat.current * 9) / totalCaloriesFromMacros * 100;
    
    // Ideal ranges: Protein 10-35%, Carbs 45-65%, Fat 20-35%
    if (proteinPercent >= 15 && proteinPercent <= 35 && 
        carbsPercent >= 40 && carbsPercent <= 65 && 
        fatPercent >= 20 && fatPercent <= 35) {
      return "🎯 Well balanced";
    } else if (proteinPercent > 35) {
      return "💪 High protein";
    } else if (carbsPercent > 65) {
      return "🌾 High carb";
    } else if (fatPercent > 35) {
      return "🥑 High fat";
    } else {
      return "📊 Custom balance";
    }
  };

  return (
    <Box backgroundColor="surface" borderRadius="lg" padding="md" borderWidth={1} borderColor="border">
      {showDate && date && (
        <Box marginBottom="sm">
          <Text variant="h3" color="primaryText">
            📊 Daily Progress
          </Text>
          <Text variant="body" color="secondaryText">
            {date}
          </Text>
        </Box>
      )}

      {/* Macro Progress Rings */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}
        style={{ marginBottom: 16 }}
      >
        <MacroProgressRing
          label="Calories"
          current={macros.calories.current}
          goal={macros.calories.goal}
          unit="kcal"
          color="#2196f3"
          size={90}
        />
        <MacroProgressRing
          label="Protein"
          current={macros.protein.current}
          goal={macros.protein.goal}
          unit="g"
          color="#9c27b0"
          size={90}
        />
        <MacroProgressRing
          label="Carbs"
          current={macros.carbs.current}
          goal={macros.carbs.goal}
          unit="g"
          color="#ff9800"
          size={90}
        />
        <MacroProgressRing
          label="Fat"
          current={macros.fat.current}
          goal={macros.fat.goal}
          unit="g"
          color="#4caf50"
          size={90}
        />
      </ScrollView>

      {/* Summary Stats */}
      <Box 
        flexDirection="row" 
        justifyContent="space-between" 
        backgroundColor="backgroundSecondary" 
        padding="sm" 
        borderRadius="md"
      >
        <Box flex={1} alignItems="center">
          <Text variant="caption" color="secondaryText">
            Remaining
          </Text>
          <Text variant="body" color="primaryText" fontWeight="600">
            {Math.max(0, macros.calories.goal - macros.calories.current)} cal
          </Text>
        </Box>
        
        <Box flex={1} alignItems="center">
          <Text variant="caption" color="secondaryText">
            Balance
          </Text>
          <Text variant="caption" color="primaryText" fontWeight="500" textAlign="center">
            {getMacroBalance()}
          </Text>
        </Box>
        
        <Box flex={1} alignItems="center">
          <Text variant="caption" color="secondaryText">
            Accuracy
          </Text>
          <Text variant="caption" color="primaryText" fontWeight="500" textAlign="center">
            {getCalorieConsistency()}
          </Text>
        </Box>
      </Box>

      {/* Quick tips if over/under goals */}
      {macros.calories.current > 0 && (
        <Box marginTop="sm">
          {macros.calories.current < macros.calories.goal * 0.8 && (
            <Text variant="caption" color="warningText" textAlign="center">
              💡 Consider adding a healthy snack to meet your calorie goal
            </Text>
          )}
          {macros.calories.current > macros.calories.goal * 1.2 && (
            <Text variant="caption" color="errorText" textAlign="center">
              ⚠️ You're significantly over your calorie goal today
            </Text>
          )}
          {macros.protein.current < macros.protein.goal * 0.7 && (
            <Text variant="caption" color="warningText" textAlign="center">
              🥩 Try adding more protein to your remaining meals
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};