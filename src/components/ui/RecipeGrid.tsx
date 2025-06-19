import React from 'react';
import { FlatGrid } from 'react-native-super-grid';
import { UserRecipe } from '../../services/supabase';
import { ModernRecipeCard } from './RecipeCard';
import { createBox, createText } from '@shopify/restyle';
import { Theme } from '../../constants/restyleTheme';

// Create components directly to avoid circular imports
const Box = createBox<Theme>();
const Text = createText<Theme>();

interface RecipeGridProps {
  recipes: UserRecipe[];
  onRecipePress: (recipe: UserRecipe) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const RecipeGrid: React.FC<RecipeGridProps> = ({
  recipes,
  onRecipePress,
  isLoading = false,
  emptyMessage = "No recipes found"
}) => {
  const renderRecipe = ({ item }: { item: UserRecipe }) => (
    <ModernRecipeCard
      recipe={item}
      onPress={() => onRecipePress(item)}
    />
  );

  const renderEmpty = () => (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      paddingVertical="xxl"
      paddingHorizontal="lg"
    >
      <Text fontSize={48} marginBottom="md">🍳</Text>
      <Text variant="h3" textAlign="center" marginBottom="sm" color="primaryText">
        {emptyMessage}
      </Text>
      <Text variant="body" textAlign="center" color="secondaryText" lineHeight={22}>
        Try generating some recipes or adjusting your preferences
      </Text>
    </Box>
  );

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text variant="body" color="secondaryText">Loading recipes...</Text>
      </Box>
    );
  }

  return (
    <FlatGrid
      data={recipes}
      style={{ flex: 1 }}
      spacing={8}
      renderItem={renderRecipe}
      itemDimension={160} // Minimum item width
      staticDimension={undefined}
      fixed={false}
      maxItemsPerRow={2}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 8,
        paddingVertical: 8,
      }}
    />
  );
};