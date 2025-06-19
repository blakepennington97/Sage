import React, { useEffect, useState, useMemo } from "react";
import {
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useRecipes } from "../hooks/useRecipes";
import { RecipeCard } from "../components/RecipeCard";
import { UserRecipe } from "../services/supabase";
import { Box, Text, Input } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";

export const RecipeBookScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme<Theme>();
  const { recipes, isLoading, refetchRecipes } = useRecipes();
  const isFocused = useIsFocused();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    if (isFocused) {
      refetchRecipes();
    }
  }, [isFocused]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search by recipe name
      const matchesSearch = recipe.recipe_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      // Filter by difficulty
      const matchesDifficulty = difficultyFilter === null || 
        recipe.difficulty_level === difficultyFilter;
      
      // Filter by favorites
      const matchesFavorites = !showFavoritesOnly || recipe.is_favorite;
      
      return matchesSearch && matchesDifficulty && matchesFavorites;
    });
  }, [recipes, searchQuery, difficultyFilter, showFavoritesOnly]);

  const renderEmptyState = () => {
    if (recipes.length === 0) {
      return (
        <Box 
          flex={1} 
          justifyContent="center" 
          alignItems="center" 
          padding="xl" 
          marginTop="xxl"
        >
          <Text fontSize={64} marginBottom="lg">📖</Text>
          <Text variant="h2" textAlign="center" marginBottom="sm">
            Your Recipe Book is Empty
          </Text>
          <Text variant="body" color="secondaryText" textAlign="center">
            Tap the &quot;+&quot; button to generate your first recipe with Sage!
          </Text>
        </Box>
      );
    }
    
    return (
      <Box 
        flex={1} 
        justifyContent="center" 
        alignItems="center" 
        padding="xl" 
        marginTop="xxl"
      >
        <Text fontSize={48} marginBottom="lg">🔍</Text>
        <Text variant="h2" textAlign="center" marginBottom="sm">
          No recipes found
        </Text>
        <Text variant="body" color="secondaryText" textAlign="center">
          Try adjusting your search or filters
        </Text>
      </Box>
    );
  };

  const renderHeader = () => (
    <Box 
      backgroundColor="surface" 
      paddingTop="xxl" 
      paddingBottom="md" 
      paddingHorizontal="md" 
      borderBottomWidth={1} 
      borderBottomColor="border"
    >
      <Text variant="h1" textAlign="center" marginBottom="lg">
        📚 Recipes
      </Text>
      
      <Input
        backgroundColor="mainBackground"
        borderRadius="md"
        padding="md"
        fontSize={16}
        color="text"
        borderWidth={1}
        borderColor="border"
        marginBottom="md"
        placeholder="Search recipes..."
        placeholderTextColor={theme.colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <TouchableOpacity 
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={{
            backgroundColor: showFavoritesOnly ? theme.colors.primary : theme.colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text 
            variant="caption" 
            color={showFavoritesOnly ? "primaryButtonText" : "text"}
          >
            ❤️ Favorites
          </Text>
        </TouchableOpacity>
        
        <Box flexDirection="row" gap="xs">
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setDifficultyFilter(difficultyFilter === level ? null : level)}
              style={{
                backgroundColor: difficultyFilter === level ? theme.colors.primary : theme.colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: theme.colors.border,
                minWidth: 32,
                alignItems: 'center',
              }}
            >
              <Text 
                variant="caption" 
                color={difficultyFilter === level ? "primaryButtonText" : "text"}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box flex={1} backgroundColor="mainBackground">
      {renderHeader()}
      {isLoading && recipes.length === 0 ? (
        <ActivityIndicator
          style={{ marginTop: 48 }}
          size="large"
          color={theme.colors.primary}
        />
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: UserRecipe }) => (
            <RecipeCard
              recipe={item}
              onPress={() =>
                navigation.navigate("RecipeDetail", { recipe: item })
              }
            />
          )}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          ListEmptyComponent={renderEmptyState}
        />
      )}
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          backgroundColor: theme.colors.primary,
          width: 60,
          height: 60,
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
        onPress={() => navigation.navigate("RecipeGeneration")}
      >
        <Text style={{ fontSize: 32, color: 'white', lineHeight: 36 }}>+</Text>
      </TouchableOpacity>
    </Box>
  );
};
