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
      
      <Box flexDirection="column" gap="md">
        <TouchableOpacity 
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={{
            backgroundColor: showFavoritesOnly ? theme.colors.primary : theme.colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignSelf: 'flex-start',
          }}
        >
          <Text 
            variant="caption" 
            color={showFavoritesOnly ? "primaryButtonText" : "text"}
            fontWeight="600"
          >
            ❤️ Favorites Only
          </Text>
        </TouchableOpacity>
        
        <Box>
          <Text variant="caption" color="secondaryText" marginBottom="sm" fontWeight="600">
            Difficulty Level
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="xs">
            {[
              { level: 1, label: "Beginner", emoji: "🥄", color: "#10B981" },
              { level: 2, label: "Easy", emoji: "🍳", color: "#3B82F6" },
              { level: 3, label: "Medium", emoji: "👨‍🍳", color: "#F59E0B" },
              { level: 4, label: "Hard", emoji: "🔥", color: "#EF4444" },
              { level: 5, label: "Expert", emoji: "⭐", color: "#8B5CF6" }
            ].map(({ level, label, emoji, color }) => (
              <TouchableOpacity
                key={level}
                onPress={() => setDifficultyFilter(difficultyFilter === level ? null : level)}
                style={{
                  backgroundColor: difficultyFilter === level ? color : theme.colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: difficultyFilter === level ? color : theme.colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: difficultyFilter === level ? color : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: difficultyFilter === level ? 3 : 0,
                }}
              >
                <Text style={{ fontSize: 12, marginRight: 4 }}>{emoji}</Text>
                <Text 
                  variant="caption" 
                  style={{ 
                    color: difficultyFilter === level ? "white" : theme.colors.text,
                    fontWeight: difficultyFilter === level ? "bold" : "normal"
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </Box>
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
