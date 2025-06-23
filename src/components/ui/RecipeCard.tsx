import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { UserRecipe } from "../../services/supabase";
import { createBox, createText , useTheme } from '@shopify/restyle';

import { Theme } from "../../constants/restyleTheme";

// Create components directly to avoid circular imports
const Box = createBox<Theme>();
const Text = createText<Theme>();

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
      paddingHorizontal="sm"
      paddingVertical="xs"
      borderRadius="lg"
      style={{
        backgroundColor: `${difficulty.color}15`,
        alignSelf: 'flex-start',
      }}
    >
      <Text fontSize={12} marginRight="xs">{difficulty.emoji}</Text>
      <Text 
        variant="small" 
        fontSize={11}
        fontWeight="600"
        style={{ color: difficulty.color }}
      >
        {difficulty.label}
      </Text>
    </Box>
  );
};

export const ModernRecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress }) => {
  const theme = useTheme<Theme>();
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box
        backgroundColor="surface"
        borderRadius="xl"
        padding="lg"
        margin="sm"
        minHeight={180}
        justifyContent="space-between"
        shadowColor="shadow"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.15}
        shadowRadius={8}
        elevation={5}
        borderWidth={1}
        borderColor="border"
        style={styles.card}
      >
        {/* Header with favorite */}
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start" marginBottom="sm">
          <Box flex={1} marginRight="sm">
            <Text 
              variant="h3" 
              fontSize={18} 
              lineHeight={24} 
              fontWeight="700" 
              numberOfLines={2}
              color="primaryText"
            >
              {recipe.recipe_name}
            </Text>
          </Box>
          {recipe.is_favorite && (
            <Box
              backgroundColor="primary"
              borderRadius="full"
              padding="xs"
              minWidth={28}
              minHeight={28}
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={14} style={{ color: '#ffffff' }}>❤️</Text>
            </Box>
          )}
        </Box>
        
        {/* Content */}
        <Box flex={1} justifyContent="space-between">
          <DifficultyIndicator level={recipe.difficulty_level || 1} />
          
          {/* Footer */}
          <Box 
            flexDirection="row" 
            justifyContent="space-between" 
            alignItems="center" 
            marginTop="md"
            paddingTop="sm"
            borderTopWidth={1}
            borderTopColor="border"
            style={{ borderTopColor: `${theme.colors.border}50` }}
          >
            <Box flexDirection="row" alignItems="center">
              <Text fontSize={14} marginRight="xs">⏱️</Text>
              <Text variant="caption" color="secondaryText" fontWeight="500">
                {recipe.estimated_time || "N/A"}
              </Text>
            </Box>
            
            {(recipe as any).cuisine_type && (
              <Box
                backgroundColor="surfaceVariant"
                paddingHorizontal="sm"
                paddingVertical="xs"
                borderRadius="md"
              >
                <Text variant="small" color="secondaryText" fontSize={10} fontWeight="600">
                  {((recipe as any).cuisine_type as string).toUpperCase()}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    transform: [{ scale: 1 }],
  },
});