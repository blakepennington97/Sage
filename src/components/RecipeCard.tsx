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
  const theme = useTheme<Theme>();
  
  return (
    <Box flexDirection="row" alignItems="center" marginBottom="sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <Box
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: i <= level ? theme.colors.primary : theme.colors.surfaceVariant,
            marginRight: i < 5 ? 4 : 0,
          }}
        />
      ))}
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
