import React from "react";
import { TouchableOpacity } from "react-native";
import { UserRecipe } from "../services/supabase";
import { Box, Text } from "./ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";

interface RecipeCardProps {
  recipe: UserRecipe;
  onPress: () => void;
}

const DifficultyIndicator: React.FC<{ level: number }> = ({ level }) => {
  const difficultyMap = {
    1: { label: "Beginner", emoji: "🥄", color: "#10B981" },
    2: { label: "Easy", emoji: "🍳", color: "#3B82F6" },
    3: { label: "Medium", emoji: "👨‍🍳", color: "#F59E0B" },
    4: { label: "Hard", emoji: "🔥", color: "#EF4444" },
    5: { label: "Expert", emoji: "⭐", color: "#8B5CF6" }
  };
  
  const difficulty = difficultyMap[level as keyof typeof difficultyMap] || difficultyMap[1];
  
  return (
    <Box 
      flexDirection="row" 
      alignItems="center" 
      marginBottom="sm"
      style={{
        backgroundColor: `${difficulty.color}20`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 10, marginRight: 4 }}>{difficulty.emoji}</Text>
      <Text 
        variant="small" 
        style={{ color: difficulty.color, fontWeight: '600', fontSize: 11 }}
      >
        {difficulty.label}
      </Text>
    </Box>
  );
};

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress }) => {
  return (
    <Box flex={0.5} padding="sm">
      <TouchableOpacity onPress={onPress}>
        <Box
          flex={1}
          backgroundColor="surface"
          borderRadius="lg"
          padding="md"
          justifyContent="space-between"
          minHeight={160}
          borderWidth={1}
          borderColor="border"
        >
          <Text 
            variant="h3" 
            fontSize={18} 
            lineHeight={24} 
            fontWeight="600" 
            marginBottom="sm"
            numberOfLines={3}
          >
            {recipe.recipe_name}
          </Text>
          
          <Box>
            <DifficultyIndicator level={recipe.difficulty_level || 1} />
            <Box 
              flexDirection="row" 
              justifyContent="space-between" 
              alignItems="center" 
              marginTop="sm"
            >
              <Text variant="caption" color="secondaryText">
                {recipe.estimated_time || "N/A"}
              </Text>
              {recipe.is_favorite && (
                <Text fontSize={16}>❤️</Text>
              )}
            </Box>
          </Box>
        </Box>
      </TouchableOpacity>
    </Box>
  );
};
