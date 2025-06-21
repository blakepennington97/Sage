import React, { useState } from "react";
import { ScrollView, Alert, ActivityIndicator, TextInput, TouchableOpacity } from "react-native";
import { Box, Text, Button, Input } from "./ui";
import { GeminiService, FoodMacros } from "../services/ai/gemini";
import { HapticService } from "../services/haptics";

interface AddFoodEntryProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  date: string;
  onFoodAdded: (foodData: FoodMacros & { quantity: number; mealType: string; date: string }) => void;
  onCancel: () => void;
}

export const AddFoodEntry: React.FC<AddFoodEntryProps> = ({
  mealType,
  date,
  onFoodAdded,
  onCancel,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodMacros | null>(null);
  const [quantity, setQuantity] = useState("1");
  
  const geminiService = new GeminiService();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Search Required", "Please enter a food item to search for.");
      return;
    }

    setIsSearching(true);
    HapticService.light();
    
    try {
      const result = await geminiService.lookupFoodMacros(searchQuery.trim());
      setSearchResults(result);
      HapticService.success();
    } catch (error) {
      HapticService.error();
      Alert.alert(
        "Search Failed", 
        error instanceof Error ? error.message : "Failed to find nutritional information. Try a more specific search."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFood = () => {
    if (!searchResults) return;
    
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity greater than 0.");
      return;
    }

    HapticService.medium();
    onFoodAdded({
      ...searchResults,
      quantity: quantityNum,
      mealType,
      date,
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setQuantity("1");
    HapticService.light();
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'primaryGreen';
      case 'medium': return 'warningText';
      case 'low': return 'errorText';
      default: return 'secondaryText';
    }
  };

  const renderSearchResults = () => {
    if (!searchResults) return null;

    const totalCalories = Math.round(searchResults.caloriesPerServing * parseFloat(quantity || "1"));
    const totalProtein = (searchResults.proteinPerServing * parseFloat(quantity || "1")).toFixed(1);
    const totalCarbs = (searchResults.carbsPerServing * parseFloat(quantity || "1")).toFixed(1);
    const totalFat = (searchResults.fatPerServing * parseFloat(quantity || "1")).toFixed(1);

    return (
      <Box backgroundColor="surface" borderRadius="lg" padding="md" borderWidth={1} borderColor="border">
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start" marginBottom="sm">
          <Box flex={1}>
            <Text variant="h3" color="primaryText">
              {searchResults.foodName}
            </Text>
            {searchResults.brandName && (
              <Text variant="body" color="primaryGreen" fontWeight="500">
                {searchResults.brandName}
              </Text>
            )}
            <Text variant="caption" color="secondaryText">
              Per {searchResults.servingSize} • Source: {searchResults.source}
            </Text>
          </Box>
          
          <Box alignItems="flex-end">
            <Box 
              style={{ backgroundColor: searchResults.confidence === 'high' ? '#4caf50' : searchResults.confidence === 'medium' ? '#ff9800' : '#f44336' }}
              paddingHorizontal="xs" 
              paddingVertical="xs" 
              borderRadius="sm"
            >
              <Text variant="caption" color="white" fontSize={10} fontWeight="600">
                {searchResults.confidence.toUpperCase()}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Quantity Input */}
        <Box marginBottom="md">
          <Text variant="body" color="primaryText" marginBottom="xs">
            Quantity (servings):
          </Text>
          <Box flexDirection="row" alignItems="center" gap="sm">
            <TouchableOpacity 
              onPress={() => setQuantity(Math.max(0.5, parseFloat(quantity || "1") - 0.5).toString())}
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                backgroundColor: '#e0e0e0', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}
            >
              <Text variant="body" color="primaryText" fontWeight="600">-</Text>
            </TouchableOpacity>
            
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              style={{
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                width: 80,
                textAlign: 'center',
                fontSize: 16,
              }}
              selectTextOnFocus
            />
            
            <TouchableOpacity 
              onPress={() => setQuantity((parseFloat(quantity || "1") + 0.5).toString())}
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                backgroundColor: '#4caf50', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}
            >
              <Text variant="body" color="white" fontWeight="600">+</Text>
            </TouchableOpacity>
          </Box>
        </Box>

        {/* Macro Summary */}
        <Box 
          backgroundColor="backgroundSecondary" 
          padding="sm" 
          borderRadius="md" 
          marginBottom="md"
        >
          <Text variant="body" color="primaryText" fontWeight="600" marginBottom="xs">
            Total Nutrition ({quantity} servings):
          </Text>
          
          <Box flexDirection="row" justifyContent="space-between" marginBottom="xs">
            <Text variant="body" color="primaryText">🔥 Calories:</Text>
            <Text variant="body" color="primaryText" fontWeight="600">{totalCalories}</Text>
          </Box>
          
          <Box flexDirection="row" justifyContent="space-between" marginBottom="xs">
            <Text variant="body" color="primaryText">💪 Protein:</Text>
            <Text variant="body" color="primaryText" fontWeight="600">{totalProtein}g</Text>
          </Box>
          
          <Box flexDirection="row" justifyContent="space-between" marginBottom="xs">
            <Text variant="body" color="primaryText">🌾 Carbs:</Text>
            <Text variant="body" color="primaryText" fontWeight="600">{totalCarbs}g</Text>
          </Box>
          
          <Box flexDirection="row" justifyContent="space-between">
            <Text variant="body" color="primaryText">🥑 Fat:</Text>
            <Text variant="body" color="primaryText" fontWeight="600">{totalFat}g</Text>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box flexDirection="row" gap="sm">
          <Button variant="secondary" onPress={clearSearch} flex={1}>
            <Text variant="button" color="primaryText">Search Again</Text>
          </Button>
          <Button variant="primary" onPress={handleAddFood} flex={1}>
            <Text variant="button" color="primaryButtonText">Add to {mealType}</Text>
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box flex={1} backgroundColor="background" padding="md">
      <Box marginBottom="lg">
        <Text variant="h2" color="primaryText" marginBottom="xs">
          🔍 Add Food Item
        </Text>
        <Text variant="body" color="secondaryText">
          Search for branded foods, restaurant items, or ingredients
        </Text>
      </Box>

      {/* Search Input */}
      <Box marginBottom="md">
        <Text variant="body" color="primaryText" marginBottom="xs">
          Search for food:
        </Text>
        <Box flexDirection="row" gap="sm">
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="e.g., 'Starbucks Grande Latte', 'Clif Bar Chocolate Chip'"
            flex={1}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Button 
            variant="primary" 
            onPress={handleSearch} 
            disabled={isSearching || !searchQuery.trim()}
            minWidth={80}
          >
            {isSearching ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text variant="button" color="primaryButtonText">Search</Text>
            )}
          </Button>
        </Box>
      </Box>

      {/* Search Examples */}
      {!searchResults && (
        <Box marginBottom="lg">
          <Text variant="body" color="primaryText" marginBottom="sm" fontWeight="500">
            💡 Try searching for:
          </Text>
          <Box gap="xs">
            <Text variant="caption" color="secondaryText">• "McDonald's Big Mac"</Text>
            <Text variant="caption" color="secondaryText">• "Greek yogurt plain"</Text>
            <Text variant="caption" color="secondaryText">• "Quest Bar Cookies & Cream"</Text>
            <Text variant="caption" color="secondaryText">• "Chipotle chicken burrito bowl"</Text>
            <Text variant="caption" color="secondaryText">• "Banana medium"</Text>
          </Box>
        </Box>
      )}

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {renderSearchResults()}
      </ScrollView>

      {/* Cancel Button */}
      <Box marginTop="md">
        <Button variant="secondary" onPress={onCancel}>
          <Text variant="button" color="primaryText">Cancel</Text>
        </Button>
      </Box>
    </Box>
  );
};