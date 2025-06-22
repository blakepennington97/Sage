import React, { useState } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Box, Text, Button, Card, Slider, Input, BottomSheet } from './ui';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAuthStore } from '../stores/authStore';

interface PreferencesEditorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const PreferencesEditor: React.FC<PreferencesEditorProps> = ({
  isVisible,
  onClose,
}) => {
  const { profile } = useAuthStore();
  const {
    preferences,
    isLoading,
    updateDietaryPreferences,
    updateCookingContext,
    updateKitchenCapabilities,
    updateCookingStyles,
    initializePreferences,
  } = useUserPreferences();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCuisineInput, setCustomCuisineInput] = useState('');
  const [showCustomCuisineInput, setShowCustomCuisineInput] = useState(false);

  // Initialize preferences if they don't exist
  React.useEffect(() => {
    if (!preferences && !isLoading) {
      initializePreferences();
    }
  }, [preferences, isLoading, initializePreferences]);

  const categoryIcons = {
    dietary: '🍽️',
    cookingContext: '⏰',
    kitchenCapabilities: '🔧',
    cookingStyles: '🌍',
  };

  const categoryTitles = {
    dietary: 'Dietary & Health',
    cookingContext: 'Cooking Context',
    kitchenCapabilities: 'Kitchen & Skills',
    cookingStyles: 'Cuisine & Style',
  };

  const categoryDescriptions = {
    dietary: 'Allergies, diet style, nutrition goals',
    cookingContext: 'Time, budget, serving sizes',
    kitchenCapabilities: 'Appliances, storage, techniques',
    cookingStyles: 'Cuisines, flavors, ingredients',
  };

  if (isLoading || !preferences) {
    return (
      <BottomSheet isVisible={isVisible} onClose={onClose} snapPoints={['90%', '95%']}>
        <Box padding="lg" alignItems="center">
          <Text variant="h2" marginBottom="md">Loading Preferences...</Text>
        </Box>
      </BottomSheet>
    );
  }

  const renderCategoryOverview = () => (
    <Box padding="lg">
        <Text variant="h2" textAlign="center" marginBottom="md">
          🎛️ Edit Preferences
        </Text>
        <Text variant="body" textAlign="center" color="secondaryText" marginBottom="lg">
          Customize your preferences to get better AI recipe recommendations
        </Text>

        {(Object.keys(categoryTitles) as (keyof typeof categoryTitles)[]).map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
          >
            <Card variant="primary" marginBottom="md">
              <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Box flexDirection="row" alignItems="center" flex={1}>
                  <Text fontSize={32} marginRight="md">
                    {categoryIcons[category]}
                  </Text>
                  <Box flex={1}>
                    <Text variant="h3">{categoryTitles[category]}</Text>
                    <Text variant="body" color="secondaryText" numberOfLines={2}>
                      {categoryDescriptions[category]}
                    </Text>
                  </Box>
                </Box>
                <Text variant="h3" color="primary">→</Text>
              </Box>
            </Card>
          </TouchableOpacity>
        ))}

        <Box marginTop="lg">
          <Button variant="secondary" onPress={onClose}>
            <Text variant="button" color="primaryText">Done</Text>
          </Button>
        </Box>
      </Box>
  );

  const renderDietaryPreferences = () => (
    <Box padding="lg">
        <Box flexDirection="row" alignItems="center" marginBottom="lg">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text variant="h3" color="primary">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2" flex={1} textAlign="center">
            🍽️ Dietary Preferences
          </Text>
        </Box>

        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Dietary Style</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            Current: {preferences.dietary.dietaryStyle}
          </Text>
          {['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo'].map((style) => (
            <TouchableOpacity
              key={style}
              onPress={() => updateDietaryPreferences({ dietaryStyle: style as any })}
            >
              <Box
                padding="sm"
                marginBottom="xs"
                backgroundColor={preferences.dietary.dietaryStyle === style ? "primary" : "surface"}
                borderRadius="md"
              >
                <Text
                  variant="body"
                  color={preferences.dietary.dietaryStyle === style ? "primaryButtonText" : "primaryText"}
                  textTransform="capitalize"
                >
                  {style}
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Card>

        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Spice Tolerance</Text>
          <Box flexDirection="row" gap="sm">
            {(['mild', 'medium', 'hot', 'fire'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => updateDietaryPreferences({ spiceTolerance: level })}
                style={{ flex: 1 }}
              >
                <Box
                  padding="sm"
                  backgroundColor={preferences.dietary.spiceTolerance === level ? "primary" : "surface"}
                  borderRadius="md"
                  alignItems="center"
                >
                  <Text
                    variant="body"
                    color={preferences.dietary.spiceTolerance === level ? "primaryButtonText" : "primaryText"}
                    textTransform="capitalize"
                  >
                    {level}
                  </Text>
                </Box>
              </TouchableOpacity>
            ))}
          </Box>
        </Card>

        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Health Goals</Text>
          <Box>
            <TouchableOpacity
              onPress={() => updateDietaryPreferences({
                nutritionGoals: {
                  ...preferences.dietary.nutritionGoals,
                  lowSodium: !preferences.dietary.nutritionGoals.lowSodium
                }
              })}
            >
              <Box flexDirection="row" alignItems="center" padding="sm" marginBottom="xs">
                <Text variant="body" flex={1}>Low Sodium</Text>
                <Text variant="body">
                  {preferences.dietary.nutritionGoals.lowSodium ? '✅' : '⬜'}
                </Text>
              </Box>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateDietaryPreferences({
                nutritionGoals: {
                  ...preferences.dietary.nutritionGoals,
                  highFiber: !preferences.dietary.nutritionGoals.highFiber
                }
              })}
            >
              <Box flexDirection="row" alignItems="center" padding="sm">
                <Text variant="body" flex={1}>High Fiber</Text>
                <Text variant="body">
                  {preferences.dietary.nutritionGoals.highFiber ? '✅' : '⬜'}
                </Text>
              </Box>
            </TouchableOpacity>
          </Box>
        </Card>

        {/* Safety Information (Read-Only) */}
        <Card variant="secondary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">🛡️ Safety Information</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            Your allergies and dietary restrictions from onboarding
          </Text>
          
          {/* Allergies from Profile */}
          <Box marginBottom="md">
            <Text variant="body" fontWeight="600" marginBottom="xs">Allergies:</Text>
            {profile?.allergies && profile.allergies.length > 0 ? (
              <Box flexDirection="row" flexWrap="wrap" gap="xs">
                {profile.allergies.map((allergy, index) => (
                  <Box
                    key={index}
                    padding="xs"
                    backgroundColor="errorBackground"
                    borderRadius="sm"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={14} marginRight="xs">⚠️</Text>
                    <Text variant="body" fontSize={12} color="error" textTransform="capitalize">
                      {allergy}
                    </Text>
                  </Box>
                ))}
              </Box>
            ) : (
              <Text variant="body" color="secondaryText" fontSize={14}>No allergies reported</Text>
            )}
          </Box>

          {/* Dietary Restrictions from Profile */}
          <Box marginBottom="md">
            <Text variant="body" fontWeight="600" marginBottom="xs">Dietary Restrictions:</Text>
            {profile?.dietary_restrictions && profile.dietary_restrictions.length > 0 ? (
              <Box flexDirection="row" flexWrap="wrap" gap="xs">
                {profile.dietary_restrictions.map((restriction, index) => (
                  <Box
                    key={index}
                    padding="xs"
                    backgroundColor="primary"
                    borderRadius="sm"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={14} marginRight="xs">🌱</Text>
                    <Text variant="body" fontSize={12} color="primaryButtonText" textTransform="capitalize">
                      {restriction}
                    </Text>
                  </Box>
                ))}
              </Box>
            ) : (
              <Text variant="body" color="secondaryText" fontSize={14}>No dietary restrictions</Text>
            )}
          </Box>

          <Box 
            padding="sm" 
            backgroundColor="cardSecondaryBackground" 
            borderRadius="md"
            borderLeftWidth={3}
            borderLeftColor="warning"
          >
            <Text variant="body" fontSize={13} color="secondaryText">
              💡 To update your safety information, you&apos;ll need to contact support or reset your profile preferences. This ensures your safety is always protected.
            </Text>
          </Box>
        </Card>

        {/* Health Objectives */}
        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Health Objectives</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            Your health and wellness goals
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="xs">
            {[
              { key: 'weight_loss', label: 'Weight Loss', emoji: '📉' },
              { key: 'muscle_gain', label: 'Muscle Gain', emoji: '💪' },
              { key: 'heart_healthy', label: 'Heart Healthy', emoji: '❤️' },
              { key: 'diabetic_friendly', label: 'Diabetic Friendly', emoji: '🩺' },
              { key: 'energy_boost', label: 'Energy Boost', emoji: '⚡' },
              { key: 'digestive_health', label: 'Digestive Health', emoji: '🌱' },
            ].map(({ key, label, emoji }) => {
              const isSelected = preferences?.dietary.healthObjectives.includes(key) || false;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    const currentObjectives = preferences?.dietary.healthObjectives || [];
                    const newObjectives = isSelected
                      ? currentObjectives.filter(o => o !== key)
                      : [...currentObjectives, key];
                    
                    updateDietaryPreferences({
                      healthObjectives: newObjectives
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor={isSelected ? "primary" : "surface"}
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">{emoji}</Text>
                    <Text
                      variant="body"
                      color={isSelected ? "primaryButtonText" : "primaryText"}
                      fontSize={14}
                    >
                      {label}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          </Box>
          
          {/* Custom Health Objectives Display */}
          {preferences?.dietary.healthObjectives
            .filter(objective => ![
              'weight_loss', 'muscle_gain', 'heart_healthy', 'diabetic_friendly', 'energy_boost', 'digestive_health'
            ].includes(objective))
            .map((customObjective) => {
              return (
                <TouchableOpacity
                  key={customObjective}
                  onPress={() => {
                    const currentObjectives = preferences?.dietary.healthObjectives || [];
                    const newObjectives = currentObjectives.filter(o => o !== customObjective);
                    
                    updateDietaryPreferences({
                      healthObjectives: newObjectives
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor="primary"
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">🎯</Text>
                    <Text
                      variant="body"
                      color="primaryButtonText"
                      fontSize={14}
                      flex={1}
                      numberOfLines={1}
                      textTransform="capitalize"
                    >
                      {customObjective.replace(/_/g, ' ')}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          
          {/* Add Custom Health Objective Button */}
          <TouchableOpacity
            onPress={() => {
              Alert.prompt(
                'Add Health Objective',
                'Enter a health goal you have',
                (text) => {
                  if (text && text.trim()) {
                    const currentObjectives = preferences?.dietary.healthObjectives || [];
                    const customObjective = text.trim().toLowerCase().replace(/\s+/g, '_');
                    
                    if (!currentObjectives.includes(customObjective)) {
                      updateDietaryPreferences({
                        healthObjectives: [...currentObjectives, customObjective]
                      });
                    }
                  }
                },
                'plain-text',
                '',
                'default'
              );
            }}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Box
              padding="sm"
              backgroundColor="surface"
              borderRadius="md"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="border"
              borderStyle="dashed"
            >
              <Text fontSize={16} marginRight="xs">➕</Text>
              <Text variant="body" color="primaryText">
                Add Health Goal
              </Text>
            </Box>
          </TouchableOpacity>
        </Card>
      </Box>
  );

  const renderCookingContext = () => (
    <Box padding="lg">
        <Box flexDirection="row" alignItems="center" marginBottom="lg">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text variant="h3" color="primary">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2" flex={1} textAlign="center">
            ⏰ Cooking Context
          </Text>
        </Box>

        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Typical Cooking Time</Text>
          {([
            { key: 'quick_15min', label: 'Quick (15 min)' },
            { key: 'weeknight_30min', label: 'Weeknight (30 min)' },
            { key: 'weekend_60min', label: 'Weekend (60 min)' },
            { key: 'project_90min_plus', label: 'Project (90+ min)' },
          ] as const).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => updateCookingContext({ typicalCookingTime: key })}
            >
              <Box
                padding="sm"
                marginBottom="xs"
                backgroundColor={preferences.cookingContext.typicalCookingTime === key ? "primary" : "surface"}
                borderRadius="md"
              >
                <Text
                  variant="body"
                  color={preferences.cookingContext.typicalCookingTime === key ? "primaryButtonText" : "primaryText"}
                >
                  {label}
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Card>

        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Budget Level</Text>
          {([
            { key: 'budget_friendly', label: 'Budget Friendly' },
            { key: 'mid_range', label: 'Mid Range' },
            { key: 'premium_ok', label: 'Premium OK' },
          ] as const).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => updateCookingContext({ budgetLevel: key })}
            >
              <Box
                padding="sm"
                marginBottom="xs"
                backgroundColor={preferences.cookingContext.budgetLevel === key ? "primary" : "surface"}
                borderRadius="md"
              >
                <Text
                  variant="body"
                  color={preferences.cookingContext.budgetLevel === key ? "primaryButtonText" : "primaryText"}
                >
                  {label}
                </Text>
              </Box>
            </TouchableOpacity>
          ))}
        </Card>

        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Typical Servings</Text>
          <Box flexDirection="row" gap="sm">
            {[1, 2, 4, 6].map((servings) => (
              <TouchableOpacity
                key={servings}
                onPress={() => updateCookingContext({ typicalServings: servings })}
                style={{ flex: 1 }}
              >
                <Box
                  padding="sm"
                  backgroundColor={preferences.cookingContext.typicalServings === servings ? "primary" : "surface"}
                  borderRadius="md"
                  alignItems="center"
                >
                  <Text
                    variant="body"
                    color={preferences.cookingContext.typicalServings === servings ? "primaryButtonText" : "primaryText"}
                  >
                    {servings}
                  </Text>
                </Box>
              </TouchableOpacity>
            ))}
          </Box>
        </Card>
      </Box>
  );

  const renderKitchenCapabilities = () => (
    <Box padding="lg">
        <Box flexDirection="row" alignItems="center" marginBottom="lg">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text variant="h3" color="primary">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2" flex={1} textAlign="center">
            🔧 Kitchen & Skills
          </Text>
        </Box>

        {/* Specialty Appliances */}
        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Specialty Appliances</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            Select the appliances you have available
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="xs">
            {[
              { key: 'air_fryer', label: 'Air Fryer', emoji: '🔥' },
              { key: 'instant_pot', label: 'Instant Pot', emoji: '⚡' },
              { key: 'food_processor', label: 'Food Processor', emoji: '🥄' },
              { key: 'stand_mixer', label: 'Stand Mixer', emoji: '🥧' },
              { key: 'slow_cooker', label: 'Slow Cooker', emoji: '🍲' },
              { key: 'rice_cooker', label: 'Rice Cooker', emoji: '🍚' },
              { key: 'blender', label: 'Blender', emoji: '🥤' },
            ].map(({ key, label, emoji }) => {
              const isSelected = preferences?.kitchenCapabilities.appliances.specialty.includes(key) || false;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    const currentAppliances = preferences?.kitchenCapabilities.appliances.specialty || [];
                    const newAppliances = isSelected
                      ? currentAppliances.filter(a => a !== key)
                      : [...currentAppliances, key];
                    
                    updateKitchenCapabilities({
                      appliances: {
                        ...preferences?.kitchenCapabilities.appliances,
                        specialty: newAppliances
                      }
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor={isSelected ? "primary" : "surface"}
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">{emoji}</Text>
                    <Text
                      variant="body"
                      color={isSelected ? "primaryButtonText" : "primaryText"}
                      fontSize={14}
                    >
                      {label}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          </Box>
          
          {/* Custom Appliances Display */}
          {preferences?.kitchenCapabilities.appliances.specialty
            .filter(appliance => ![
              'air_fryer', 'instant_pot', 'food_processor', 'stand_mixer',
              'slow_cooker', 'rice_cooker', 'blender'
            ].includes(appliance))
            .map((customAppliance) => {
              return (
                <TouchableOpacity
                  key={customAppliance}
                  onPress={() => {
                    const currentAppliances = preferences?.kitchenCapabilities.appliances.specialty || [];
                    const newAppliances = currentAppliances.filter(a => a !== customAppliance);
                    
                    updateKitchenCapabilities({
                      appliances: {
                        ...preferences?.kitchenCapabilities.appliances,
                        specialty: newAppliances
                      }
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor="primary"
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">⚙️</Text>
                    <Text
                      variant="body"
                      color="primaryButtonText"
                      fontSize={14}
                      flex={1}
                      numberOfLines={1}
                      textTransform="capitalize"
                    >
                      {customAppliance.replace(/_/g, ' ')}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          
          {/* Add Custom Appliance Button */}
          <TouchableOpacity
            onPress={() => {
              Alert.prompt(
                'Add Custom Appliance',
                'Enter a kitchen appliance you have',
                (text) => {
                  if (text && text.trim()) {
                    const currentAppliances = preferences?.kitchenCapabilities.appliances.specialty || [];
                    const customAppliance = text.trim().toLowerCase().replace(/\s+/g, '_');
                    
                    if (!currentAppliances.includes(customAppliance)) {
                      updateKitchenCapabilities({
                        appliances: {
                          ...preferences?.kitchenCapabilities.appliances,
                          specialty: [...currentAppliances, customAppliance]
                        }
                      });
                    }
                  }
                },
                'plain-text',
                '',
                'default'
              );
            }}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Box
              padding="sm"
              backgroundColor="surface"
              borderRadius="md"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="border"
              borderStyle="dashed"
            >
              <Text fontSize={16} marginRight="xs">➕</Text>
              <Text variant="body" color="primaryText">
                Add Custom Appliance
              </Text>
            </Box>
          </TouchableOpacity>
        </Card>

        {/* Storage Space */}
        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Storage Space</Text>
          
          <Text variant="body" marginBottom="xs" fontWeight="600">Refrigerator</Text>
          <Box flexDirection="row" gap="sm" marginBottom="md">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => updateKitchenCapabilities({
                  storageSpace: {
                    ...preferences?.kitchenCapabilities.storageSpace,
                    refrigerator: size
                  }
                })}
                style={{ flex: 1 }}
              >
                <Box
                  padding="sm"
                  backgroundColor={preferences?.kitchenCapabilities.storageSpace.refrigerator === size ? "primary" : "surface"}
                  borderRadius="md"
                  alignItems="center"
                >
                  <Text
                    variant="body"
                    color={preferences?.kitchenCapabilities.storageSpace.refrigerator === size ? "primaryButtonText" : "primaryText"}
                    textTransform="capitalize"
                  >
                    {size}
                  </Text>
                </Box>
              </TouchableOpacity>
            ))}
          </Box>

          <Text variant="body" marginBottom="xs" fontWeight="600">Freezer</Text>
          <Box flexDirection="row" gap="sm" marginBottom="md">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => updateKitchenCapabilities({
                  storageSpace: {
                    ...preferences?.kitchenCapabilities.storageSpace,
                    freezer: size
                  }
                })}
                style={{ flex: 1 }}
              >
                <Box
                  padding="sm"
                  backgroundColor={preferences?.kitchenCapabilities.storageSpace.freezer === size ? "primary" : "surface"}
                  borderRadius="md"
                  alignItems="center"
                >
                  <Text
                    variant="body"
                    color={preferences?.kitchenCapabilities.storageSpace.freezer === size ? "primaryButtonText" : "primaryText"}
                    textTransform="capitalize"
                  >
                    {size}
                  </Text>
                </Box>
              </TouchableOpacity>
            ))}
          </Box>

          <Text variant="body" marginBottom="xs" fontWeight="600">Pantry</Text>
          <Box flexDirection="row" gap="sm">
            {(['minimal', 'moderate', 'extensive'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => updateKitchenCapabilities({
                  storageSpace: {
                    ...preferences?.kitchenCapabilities.storageSpace,
                    pantry: size
                  }
                })}
                style={{ flex: 1 }}
              >
                <Box
                  padding="sm"
                  backgroundColor={preferences?.kitchenCapabilities.storageSpace.pantry === size ? "primary" : "surface"}
                  borderRadius="md"
                  alignItems="center"
                >
                  <Text
                    variant="body"
                    color={preferences?.kitchenCapabilities.storageSpace.pantry === size ? "primaryButtonText" : "primaryText"}
                    textTransform="capitalize"
                  >
                    {size}
                  </Text>
                </Box>
              </TouchableOpacity>
            ))}
          </Box>
        </Card>

        {/* Technique Comfort Levels */}
        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Cooking Technique Comfort</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            Rate your comfort level (1 = beginner, 5 = expert)
          </Text>
          
          {[
            { key: 'knife_work', label: 'Knife Work', emoji: '🔪' },
            { key: 'sauteing', label: 'Sautéing', emoji: '🍳' },
            { key: 'roasting', label: 'Roasting', emoji: '🥘' },
            { key: 'baking', label: 'Baking', emoji: '🧁' },
            { key: 'grilling', label: 'Grilling', emoji: '🔥' },
            { key: 'braising', label: 'Braising', emoji: '🍲' },
            { key: 'deep_frying', label: 'Deep Frying', emoji: '🍤' },
          ].map(({ key, label, emoji }) => {
            const currentLevel = preferences?.kitchenCapabilities?.techniqueComfort?.[key as keyof typeof preferences.kitchenCapabilities.techniqueComfort] || 1;
            
            return (
              <Box key={key} marginBottom="md">
                <Box flexDirection="row" alignItems="center" marginBottom="xs">
                  <Text fontSize={20} marginRight="sm">{emoji}</Text>
                  <Text variant="body" flex={1}>{label}</Text>
                  <Text variant="body" fontWeight="600">{currentLevel}/5</Text>
                </Box>
                <Box alignItems="center" marginTop="sm">
                  <Slider
                    value={currentLevel}
                    onValueChange={(level) => {
                      if (typeof level === 'number' && level >= 1 && level <= 5) {
                        updateKitchenCapabilities({
                          techniqueComfort: {
                            ...preferences?.kitchenCapabilities?.techniqueComfort,
                            [key]: level
                          }
                        });
                      }
                    }}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                  />
                </Box>
              </Box>
            );
          })}
        </Card>
      </Box>
  );

  const renderCookingStyles = () => (
    <Box padding="lg">
        <Box flexDirection="row" alignItems="center" marginBottom="lg">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text variant="h3" color="primary">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2" flex={1} textAlign="center">
            🌍 Cuisine & Style
          </Text>
        </Box>

        {/* Preferred Cuisines */}
        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Preferred Cuisines</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            Select the cuisines you enjoy most
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="xs">
            {[
              { key: 'italian', label: 'Italian', emoji: '🍝' },
              { key: 'asian', label: 'Asian', emoji: '🥢' },
              { key: 'mexican', label: 'Mexican', emoji: '🌮' },
              { key: 'american', label: 'American', emoji: '🍔' },
              { key: 'indian', label: 'Indian', emoji: '🍛' },
              { key: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
              { key: 'french', label: 'French', emoji: '🥐' },
              { key: 'thai', label: 'Thai', emoji: '🍜' },
              { key: 'japanese', label: 'Japanese', emoji: '🍱' },
              { key: 'greek', label: 'Greek', emoji: '🥙' },
              { key: 'chinese', label: 'Chinese', emoji: '🥡' },
              { key: 'middle_eastern', label: 'Middle Eastern', emoji: '🧆' },
            ].map(({ key, label, emoji }) => {
              const isSelected = preferences?.cookingStyles.preferredCuisines.includes(key) || false;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    const currentCuisines = preferences?.cookingStyles.preferredCuisines || [];
                    const newCuisines = isSelected
                      ? currentCuisines.filter(c => c !== key)
                      : [...currentCuisines, key];
                    
                    updateCookingStyles({
                      preferredCuisines: newCuisines
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor={isSelected ? "primary" : "surface"}
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">{emoji}</Text>
                    <Text
                      variant="body"
                      color={isSelected ? "primaryButtonText" : "primaryText"}
                      fontSize={14}
                    >
                      {label}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          </Box>
          
          {/* Custom Cuisines Display */}
          {preferences?.cookingStyles.preferredCuisines
            .filter(cuisine => ![
              'italian', 'asian', 'mexican', 'american', 'indian', 'mediterranean',
              'french', 'thai', 'japanese', 'greek', 'chinese', 'middle_eastern'
            ].includes(cuisine))
            .map((customCuisine) => {
              return (
                <TouchableOpacity
                  key={customCuisine}
                  onPress={() => {
                    const currentCuisines = preferences?.cookingStyles.preferredCuisines || [];
                    const newCuisines = currentCuisines.filter(c => c !== customCuisine);
                    
                    updateCookingStyles({
                      preferredCuisines: newCuisines
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor="primary"
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">🍴</Text>
                    <Text
                      variant="body"
                      color="primaryButtonText"
                      fontSize={14}
                      flex={1}
                      numberOfLines={1}
                      textTransform="capitalize"
                    >
                      {customCuisine}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          
          {/* Add Custom Cuisine Button */}
          <TouchableOpacity
            onPress={() => setShowCustomCuisineInput(!showCustomCuisineInput)}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Box
              padding="sm"
              backgroundColor="surface"
              borderRadius="md"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="border"
              borderStyle="dashed"
            >
              <Text fontSize={16} marginRight="xs">➕</Text>
              <Text variant="body" color="primaryText">
                Add Custom Cuisine
              </Text>
            </Box>
          </TouchableOpacity>
          
          {/* Custom Cuisine Input */}
          {showCustomCuisineInput && (
            <Box marginTop="md">
              <Input
                value={customCuisineInput}
                onChangeText={setCustomCuisineInput}
                placeholder="Enter cuisine name (e.g., Korean, Ethiopian)"
                backgroundColor="surface"
                borderRadius="md"
                padding="sm"
                borderWidth={1}
                borderColor="border"
                color="primaryText"
                marginBottom="sm"
              />
              <Box flexDirection="row" gap="sm">
                <Button
                  variant="primary"
                  flex={1}
                  onPress={() => {
                    if (customCuisineInput.trim()) {
                      const currentCuisines = preferences?.cookingStyles.preferredCuisines || [];
                      const customCuisine = customCuisineInput.trim().toLowerCase();
                      
                      if (!currentCuisines.includes(customCuisine)) {
                        updateCookingStyles({
                          preferredCuisines: [...currentCuisines, customCuisine]
                        });
                      }
                      
                      setCustomCuisineInput('');
                      setShowCustomCuisineInput(false);
                    }
                  }}
                >
                  <Text variant="button" color="primaryButtonText">Add</Text>
                </Button>
                <Button
                  variant="secondary"
                  flex={1}
                  onPress={() => {
                    setCustomCuisineInput('');
                    setShowCustomCuisineInput(false);
                  }}
                >
                  <Text variant="button" color="primaryText">Cancel</Text>
                </Button>
              </Box>
            </Box>
          )}
        </Card>

        {/* Cooking Moods */}
        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Cooking Moods</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            What type of cooking experience do you usually want?
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="xs">
            {[
              { key: 'comfort_food', label: 'Comfort Food', emoji: '🤗' },
              { key: 'healthy_fresh', label: 'Healthy & Fresh', emoji: '🥗' },
              { key: 'adventurous', label: 'Adventurous', emoji: '🌟' },
              { key: 'nostalgic', label: 'Nostalgic', emoji: '💭' },
              { key: 'impressive_guests', label: 'Impress Guests', emoji: '✨' },
              { key: 'quick_easy', label: 'Quick & Easy', emoji: '⚡' },
            ].map(({ key, label, emoji }) => {
              const isSelected = preferences?.cookingStyles.cookingMoods.includes(key) || false;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    const currentMoods = preferences?.cookingStyles.cookingMoods || [];
                    const newMoods = isSelected
                      ? currentMoods.filter(m => m !== key)
                      : [...currentMoods, key];
                    
                    updateCookingStyles({
                      cookingMoods: newMoods
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor={isSelected ? "primary" : "surface"}
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">{emoji}</Text>
                    <Text
                      variant="body"
                      color={isSelected ? "primaryButtonText" : "primaryText"}
                      fontSize={14}
                    >
                      {label}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          </Box>
        </Card>

        {/* Favorite Ingredients */}
        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Favorite Ingredients</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            Ingredients you love to cook with
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="xs">
            {[
              { key: 'garlic', label: 'Garlic', emoji: '🧄' },
              { key: 'lemon', label: 'Lemon', emoji: '🍋' },
              { key: 'herbs', label: 'Fresh Herbs', emoji: '🌿' },
              { key: 'cheese', label: 'Cheese', emoji: '🧀' },
              { key: 'tomatoes', label: 'Tomatoes', emoji: '🍅' },
              { key: 'mushrooms', label: 'Mushrooms', emoji: '🍄' },
              { key: 'avocado', label: 'Avocado', emoji: '🥑' },
              { key: 'coconut', label: 'Coconut', emoji: '🥥' },
              { key: 'ginger', label: 'Ginger', emoji: '🫚' },
              { key: 'chili', label: 'Chili Peppers', emoji: '🌶️' },
              { key: 'olive_oil', label: 'Olive Oil', emoji: '🫒' },
              { key: 'onions', label: 'Onions', emoji: '🧅' },
            ].map(({ key, label, emoji }) => {
              const isSelected = preferences?.cookingStyles.favoriteIngredients.includes(key) || false;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    const currentFavorites = preferences?.cookingStyles.favoriteIngredients || [];
                    const newFavorites = isSelected
                      ? currentFavorites.filter(i => i !== key)
                      : [...currentFavorites, key];
                    
                    updateCookingStyles({
                      favoriteIngredients: newFavorites
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor={isSelected ? "primary" : "surface"}
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">{emoji}</Text>
                    <Text
                      variant="body"
                      color={isSelected ? "primaryButtonText" : "primaryText"}
                      fontSize={14}
                    >
                      {label}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          </Box>
          
          {/* Custom Favorite Ingredients Display */}
          {preferences?.cookingStyles.favoriteIngredients
            .filter(ingredient => ![
              'garlic', 'lemon', 'herbs', 'cheese', 'tomatoes', 'mushrooms',
              'avocado', 'coconut', 'ginger', 'chili', 'olive_oil', 'onions'
            ].includes(ingredient))
            .map((customIngredient) => {
              return (
                <TouchableOpacity
                  key={customIngredient}
                  onPress={() => {
                    const currentFavorites = preferences?.cookingStyles.favoriteIngredients || [];
                    const newFavorites = currentFavorites.filter(i => i !== customIngredient);
                    
                    updateCookingStyles({
                      favoriteIngredients: newFavorites
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor="primary"
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">🥘</Text>
                    <Text
                      variant="body"
                      color="primaryButtonText"
                      fontSize={14}
                      flex={1}
                      numberOfLines={1}
                      textTransform="capitalize"
                    >
                      {customIngredient}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          
          {/* Add Custom Favorite Ingredient Button */}
          <TouchableOpacity
            onPress={() => {
              Alert.prompt(
                'Add Favorite Ingredient',
                'Enter an ingredient you love to cook with',
                (text) => {
                  if (text && text.trim()) {
                    const currentFavorites = preferences?.cookingStyles.favoriteIngredients || [];
                    const customIngredient = text.trim().toLowerCase();
                    
                    if (!currentFavorites.includes(customIngredient)) {
                      updateCookingStyles({
                        favoriteIngredients: [...currentFavorites, customIngredient]
                      });
                    }
                  }
                },
                'plain-text',
                '',
                'default'
              );
            }}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Box
              padding="sm"
              backgroundColor="surface"
              borderRadius="md"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="border"
              borderStyle="dashed"
            >
              <Text fontSize={16} marginRight="xs">➕</Text>
              <Text variant="body" color="primaryText">
                Add Custom Ingredient
              </Text>
            </Box>
          </TouchableOpacity>
        </Card>

        {/* Avoided Ingredients */}
        <Card variant="primary" marginBottom="md">
          <Text variant="h3" marginBottom="sm">Avoided Ingredients</Text>
          <Text variant="body" color="secondaryText" marginBottom="md">
            Ingredients you prefer to avoid (for taste, not allergies)
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="xs">
            {[
              { key: 'cilantro', label: 'Cilantro', emoji: '🌿' },
              { key: 'blue_cheese', label: 'Blue Cheese', emoji: '🧀' },
              { key: 'liver', label: 'Liver', emoji: '🥩' },
              { key: 'anchovies', label: 'Anchovies', emoji: '🐟' },
              { key: 'olives', label: 'Olives', emoji: '🫒' },
              { key: 'mushrooms_avoid', label: 'Mushrooms', emoji: '🍄' },
              { key: 'fish_sauce', label: 'Fish Sauce', emoji: '🐠' },
              { key: 'pickles', label: 'Pickles', emoji: '🥒' },
              { key: 'tofu', label: 'Tofu', emoji: '🥡' },
              { key: 'organ_meat', label: 'Organ Meat', emoji: '🫘' },
            ].map(({ key, label, emoji }) => {
              const isSelected = preferences?.cookingStyles.avoidedIngredients.includes(key) || false;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    const currentAvoided = preferences?.cookingStyles.avoidedIngredients || [];
                    const newAvoided = isSelected
                      ? currentAvoided.filter(i => i !== key)
                      : [...currentAvoided, key];
                    
                    updateCookingStyles({
                      avoidedIngredients: newAvoided
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor={isSelected ? "primary" : "surface"}
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">{emoji}</Text>
                    <Text
                      variant="body"
                      color={isSelected ? "primaryButtonText" : "primaryText"}
                      fontSize={14}
                    >
                      {label}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          </Box>
          
          {/* Custom Avoided Ingredients Display */}
          {preferences?.cookingStyles.avoidedIngredients
            .filter(ingredient => ![
              'cilantro', 'blue_cheese', 'liver', 'anchovies', 'olives',
              'mushrooms_avoid', 'fish_sauce', 'pickles', 'tofu', 'organ_meat'
            ].includes(ingredient))
            .map((customIngredient) => {
              return (
                <TouchableOpacity
                  key={customIngredient}
                  onPress={() => {
                    const currentAvoided = preferences?.cookingStyles.avoidedIngredients || [];
                    const newAvoided = currentAvoided.filter(i => i !== customIngredient);
                    
                    updateCookingStyles({
                      avoidedIngredients: newAvoided
                    });
                  }}
                  style={{ width: '48%', marginBottom: 8 }}
                >
                  <Box
                    padding="sm"
                    backgroundColor="primary"
                    borderRadius="md"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Text fontSize={16} marginRight="xs">🚫</Text>
                    <Text
                      variant="body"
                      color="primaryButtonText"
                      fontSize={14}
                      flex={1}
                      numberOfLines={1}
                      textTransform="capitalize"
                    >
                      {customIngredient}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          
          {/* Add Custom Avoided Ingredient Button */}
          <TouchableOpacity
            onPress={() => {
              Alert.prompt(
                'Add Avoided Ingredient',
                'Enter an ingredient you prefer to avoid (for taste, not allergies)',
                (text) => {
                  if (text && text.trim()) {
                    const currentAvoided = preferences?.cookingStyles.avoidedIngredients || [];
                    const customIngredient = text.trim().toLowerCase();
                    
                    if (!currentAvoided.includes(customIngredient)) {
                      updateCookingStyles({
                        avoidedIngredients: [...currentAvoided, customIngredient]
                      });
                    }
                  }
                },
                'plain-text',
                '',
                'default'
              );
            }}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Box
              padding="sm"
              backgroundColor="surface"
              borderRadius="md"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="border"
              borderStyle="dashed"
            >
              <Text fontSize={16} marginRight="xs">➕</Text>
              <Text variant="body" color="primaryText">
                Add Custom Ingredient
              </Text>
            </Box>
          </TouchableOpacity>
        </Card>
      </Box>
  );

  const renderSelectedCategory = () => {
    switch (selectedCategory) {
      case 'dietary':
        return renderDietaryPreferences();
      case 'cookingContext':
        return renderCookingContext();
      case 'kitchenCapabilities':
        return renderKitchenCapabilities();
      case 'cookingStyles':
        return renderCookingStyles();
      default:
        return renderCategoryOverview();
    }
  };

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose} snapPoints={['95%']} scrollable={true}>
      {renderSelectedCategory()}
    </BottomSheet>
  );
};