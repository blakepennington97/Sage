import React, { useEffect, useState, useMemo } from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useRecipes } from "../hooks/useRecipes";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { RecipeGrid } from "../components/ui";
import { UserRecipe } from "../services/supabase";
import { Box, Text, Input, Slider } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";

export const RecipeBookScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme<Theme>();
  const { recipes, isLoading, refetchRecipes } = useRecipes();
  const { preferences } = useUserPreferences();
  const isFocused = useIsFocused();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [usePreferenceFiltering, setUsePreferenceFiltering] = useState(false);

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
      
      // Preference-based filtering
      let matchesPreferences = true;
      if (usePreferenceFiltering && preferences && preferences.setupCompleted) {
        const { dietary, cookingContext, cookingStyles } = preferences;
        
        // Check for dietary restrictions (simplified - in real app would need recipe ingredient analysis)
        // For now, just check estimated time against user's typical cooking time
        if (cookingContext.typicalCookingTime === 'quick_15min' && 
            recipe.estimated_time && 
            parseInt(recipe.estimated_time) > 20) {
          matchesPreferences = false;
        }
        
        // Check if recipe difficulty matches user's comfort level
        if (cookingContext.typicalCookingTime === 'quick_15min' && recipe.difficulty_level > 2) {
          matchesPreferences = false;
        }
        
        // Check for preferred cuisines in recipe name (simplified matching)
        if (cookingStyles.preferredCuisines.length > 0) {
          const recipeName = recipe.recipe_name.toLowerCase();
          const recipeContent = recipe.recipe_content?.toLowerCase() || '';
          
          const cuisineMatches = cookingStyles.preferredCuisines.some(cuisine => 
            recipeName.includes(cuisine.toLowerCase()) || 
            recipeContent.includes(cuisine.toLowerCase())
          );
          
          // If no cuisine match found and we have strong preferences, filter out
          if (!cuisineMatches && cookingStyles.preferredCuisines.length >= 3) {
            matchesPreferences = false;
          }
        }
      }
      
      return matchesSearch && matchesDifficulty && matchesFavorites && matchesPreferences;
    });
  }, [recipes, searchQuery, difficultyFilter, showFavoritesOnly, usePreferenceFiltering, preferences]);


  const renderHeader = () => (
    <Box 
      backgroundColor="surface" 
      paddingTop="xl" 
      paddingBottom="sm" 
      paddingHorizontal="md" 
      borderBottomWidth={1} 
      borderBottomColor="border"
    >
      {/* Compact Title and Search Row */}
      <Box flexDirection="row" alignItems="center" marginBottom="sm">
        <Text variant="h2" flex={1}>📚 Recipes</Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate("RecipeGeneration")}
        >
          <Text style={{ fontSize: 20, color: 'white', lineHeight: 24 }}>+</Text>
        </TouchableOpacity>
      </Box>
      
      <Input
        backgroundColor="mainBackground"
        borderRadius="md"
        padding="sm"
        fontSize={14}
        color="text"
        borderWidth={1}
        borderColor="border"
        marginBottom="sm"
        placeholder="Search recipes..."
        placeholderTextColor={theme.colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {/* Compact Filter Row */}
      <Box flexDirection="row" alignItems="center" gap="sm" flexWrap="wrap">
        <TouchableOpacity 
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={{
            backgroundColor: showFavoritesOnly ? theme.colors.primary : theme.colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text 
            variant="caption" 
            color={showFavoritesOnly ? "primaryButtonText" : "text"}
            fontSize={12}
            fontWeight="600"
          >
            ❤️ Favorites
          </Text>
        </TouchableOpacity>
        
        {preferences && preferences.setupCompleted && (
          <TouchableOpacity 
            onPress={() => setUsePreferenceFiltering(!usePreferenceFiltering)}
            style={{
              backgroundColor: usePreferenceFiltering ? theme.colors.primary : theme.colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text 
              variant="caption" 
              color={usePreferenceFiltering ? "primaryButtonText" : "text"}
              fontSize={12}
              fontWeight="600"
            >
              🎛️ My Prefs
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Compact Difficulty Filter */}
        <Box flex={1} flexDirection="row" alignItems="center" gap="xs">
          <Text variant="caption" color="secondaryText" fontSize={12}>
            Level:
          </Text>
          <TouchableOpacity 
            onPress={() => setDifficultyFilter(null)}
            style={{
              backgroundColor: !difficultyFilter ? theme.colors.primary : theme.colors.surface,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text 
              variant="caption" 
              color={!difficultyFilter ? "primaryButtonText" : "text"}
              fontSize={10}
            >
              All
            </Text>
          </TouchableOpacity>
          
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity 
              key={level}
              onPress={() => setDifficultyFilter(level)}
              style={{
                backgroundColor: difficultyFilter === level ? theme.colors.primary : theme.colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text 
                variant="caption" 
                color={difficultyFilter === level ? "primaryButtonText" : "text"}
                fontSize={10}
              >
                {level === 1 ? "🥄" :
                level === 2 ? "🍳" :
                level === 3 ? "👨‍🍳" :
                level === 4 ? "🔥" : "⭐"}
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
      <RecipeGrid
        recipes={filteredRecipes}
        onRecipePress={(recipe) => 
          navigation.navigate("RecipeDetail", { recipe })
        }
        isLoading={isLoading && recipes.length === 0}
        emptyMessage={
          recipes.length === 0 
            ? "No recipes yet! Tap the + button to generate your first recipe with Sage!"
            : "No recipes found. Try adjusting your search or filters."
        }
      />
    </Box>
  );
};
