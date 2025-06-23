import React, { useEffect, useState, useMemo } from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useRecipes } from "../hooks/useRecipes";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { RecipeGrid , Box, Text, Input, Slider, Button } from "../components/ui";
import { UserRecipe } from "../services/supabase";

import { CustomSlider } from "../components/ui/Slider";
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
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  useEffect(() => {
    if (isFocused) {
      refetchRecipes();
    }
  }, [isFocused]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search by recipe name and content
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        recipe.recipe_name.toLowerCase().includes(searchLower) ||
        recipe.recipe_content?.toLowerCase().includes(searchLower);
      
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
      {/* Title */}
      <Box marginBottom="sm">
        <Text variant="h2">📚 Recipes</Text>
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
      
      {/* Filters Button */}
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginTop="sm">
        <TouchableOpacity
          onPress={() => setShowFiltersModal(true)}
          style={{
            backgroundColor: (showFavoritesOnly || usePreferenceFiltering || difficultyFilter) ? theme.colors.primary : theme.colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8 as any,
          }}
        >
          <Text style={{ fontSize: 16 }}>🎛️</Text>
          <Text 
            variant="caption" 
            color={(showFavoritesOnly || usePreferenceFiltering || difficultyFilter) ? "primaryButtonText" : "text"}
            fontSize={14}
            fontWeight="600"
          >
            Filters
          </Text>
          {(showFavoritesOnly || usePreferenceFiltering || difficultyFilter) && (
            <Box
              backgroundColor="primaryButtonText"
              style={{ width: 6, height: 6, borderRadius: 3 }}
            />
          )}
        </TouchableOpacity>
      </Box>
    </Box>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFiltersModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFiltersModal(false)}
    >
      <Box flex={1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} justifyContent="flex-end">
        <Box backgroundColor="surface" borderTopLeftRadius="xl" borderTopRightRadius="xl" padding="lg">
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="lg">
            <Text variant="h3">Filter Recipes</Text>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Text variant="h3" color="primary">Done</Text>
            </TouchableOpacity>
          </Box>

          {/* Favorites Filter */}
          <Box marginBottom="lg">
            <TouchableOpacity 
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={{
                backgroundColor: showFavoritesOnly ? theme.colors.primary : theme.colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box flexDirection="row" alignItems="center" gap="sm">
                <Text style={{ fontSize: 16 }}>❤️</Text>
                <Text 
                  variant="body" 
                  color={showFavoritesOnly ? "primaryButtonText" : "text"}
                  fontWeight="600"
                >
                  Show Favorites Only
                </Text>
              </Box>
              {showFavoritesOnly && (
                <Text style={{ fontSize: 16, color: 'white' }}>✓</Text>
              )}
            </TouchableOpacity>
          </Box>

          {/* Preferences Filter */}
          {preferences && preferences.setupCompleted && (
            <Box marginBottom="lg">
              <TouchableOpacity 
                onPress={() => setUsePreferenceFiltering(!usePreferenceFiltering)}
                style={{
                  backgroundColor: usePreferenceFiltering ? theme.colors.primary : theme.colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box flexDirection="row" alignItems="center" gap="sm">
                  <Text style={{ fontSize: 16 }}>🎛️</Text>
                  <Text 
                    variant="body" 
                    color={usePreferenceFiltering ? "primaryButtonText" : "text"}
                    fontWeight="600"
                  >
                    Match My Preferences
                  </Text>
                </Box>
                {usePreferenceFiltering && (
                  <Text style={{ fontSize: 16, color: 'white' }}>✓</Text>
                )}
              </TouchableOpacity>
            </Box>
          )}

          {/* Difficulty Filter */}
          <Box marginBottom="lg">
            <Text variant="body" color="text" marginBottom="md" fontWeight="600">
              Difficulty Level
            </Text>
            <Box alignItems="center" paddingHorizontal="sm">
              <CustomSlider
                value={difficultyFilter || 0}
                onValueChange={(value) => setDifficultyFilter(value === 0 ? null : value)}
                minimumValue={0}
                maximumValue={5}
                step={1}
                showLabels={true}
                labels={['All', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert']}
                minimumTrackTintColor={
                  difficultyFilter === null || difficultyFilter === 0 ? theme.colors.border :
                  difficultyFilter === 1 ? '#4CAF50' : // Green for Beginner
                  difficultyFilter === 2 ? '#8BC34A' : // Light Green for Easy  
                  difficultyFilter === 3 ? '#FF9800' : // Orange for Medium
                  difficultyFilter === 4 ? '#FF5722' : // Red-Orange for Hard
                  '#9C27B0' // Purple for Expert
                }
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={
                  difficultyFilter === null || difficultyFilter === 0 ? theme.colors.primary :
                  difficultyFilter === 1 ? '#4CAF50' : // Green for Beginner
                  difficultyFilter === 2 ? '#8BC34A' : // Light Green for Easy  
                  difficultyFilter === 3 ? '#FF9800' : // Orange for Medium
                  difficultyFilter === 4 ? '#FF5722' : // Red-Orange for Hard
                  '#9C27B0' // Purple for Expert
                }
              />
              <Text variant="caption" color="text" textAlign="center" marginTop="sm" fontWeight="600">
                {difficultyFilter === null ? "All levels" : 
                difficultyFilter === 1 ? "Beginner" :
                difficultyFilter === 2 ? "Easy" :
                difficultyFilter === 3 ? "Medium" :
                difficultyFilter === 4 ? "Hard" : "Expert"}
              </Text>
            </Box>
          </Box>

          {/* Clear All Filters */}
          <TouchableOpacity
            onPress={() => {
              setDifficultyFilter(null);
              setShowFavoritesOnly(false);
              setUsePreferenceFiltering(false);
            }}
            style={{
              backgroundColor: theme.colors.surface,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
            }}
          >
            <Text variant="body" color="textSecondary">Clear All Filters</Text>
          </TouchableOpacity>
        </Box>
      </Box>
    </Modal>
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
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          backgroundColor: theme.colors.primary,
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
        onPress={() => navigation.navigate("RecipeGeneration")}
      >
        <Text style={{ fontSize: 24, color: 'white', lineHeight: 28 }}>+</Text>
      </TouchableOpacity>

      {renderFiltersModal()}
    </Box>
  );
};
