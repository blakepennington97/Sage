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
        <Box flexDirection="row" gap="md" flexWrap="wrap">
          <TouchableOpacity 
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              backgroundColor: showFavoritesOnly ? theme.colors.primary : theme.colors.surface,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
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
          
          {preferences && preferences.setupCompleted && (
            <TouchableOpacity 
              onPress={() => setUsePreferenceFiltering(!usePreferenceFiltering)}
              style={{
                backgroundColor: usePreferenceFiltering ? theme.colors.primary : theme.colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text 
                variant="caption" 
                color={usePreferenceFiltering ? "primaryButtonText" : "text"}
                fontWeight="600"
              >
                🎛️ My Preferences
              </Text>
            </TouchableOpacity>
          )}
        </Box>
        
        <Box>
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="sm">
            <Text variant="caption" color="secondaryText" fontWeight="600">
              Difficulty Level
            </Text>
            <TouchableOpacity onPress={() => setDifficultyFilter(null)}>
              <Text variant="caption" color="primary" fontWeight="600">
                {difficultyFilter ? 'Clear' : 'All Levels'}
              </Text>
            </TouchableOpacity>
          </Box>
          
          
          {/* Slider */}
          <Box alignItems="center" marginTop="sm">
            <Slider
              value={difficultyFilter || 0}
              onValueChange={(value) => {
                if (typeof value === 'number') {
                  setDifficultyFilter(value === 0 ? null : Math.round(value));
                }
              }}
              minimumValue={0}
              maximumValue={5}
              step={1}
              minimumTrackTintColor={
                difficultyFilter === 1 ? "#10B981" :
                difficultyFilter === 2 ? "#3B82F6" :
                difficultyFilter === 3 ? "#F59E0B" :
                difficultyFilter === 4 ? "#EF4444" :
                difficultyFilter === 5 ? "#8B5CF6" :
                theme.colors.border
              }
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={
                difficultyFilter === 1 ? "#10B981" :
                difficultyFilter === 2 ? "#3B82F6" :
                difficultyFilter === 3 ? "#F59E0B" :
                difficultyFilter === 4 ? "#EF4444" :
                difficultyFilter === 5 ? "#8B5CF6" :
                theme.colors.primary
              }
            />
          </Box>
          
          {/* Selected Level Display */}
          {difficultyFilter && (
            <Box alignItems="center" marginTop="xs">
              <Text variant="caption" color="primaryText" fontWeight="600">
                {difficultyFilter === 1 ? "🥄 Beginner" :
                difficultyFilter === 2 ? "🍳 Easy" :
                difficultyFilter === 3 ? "👨‍🍳 Medium" :
                difficultyFilter === 4 ? "🔥 Hard" :
                "⭐ Expert"}
              </Text>
            </Box>
          )}
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
