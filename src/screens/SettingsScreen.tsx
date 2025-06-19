import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { APIKeyManager } from "../services/ai/config";
import { useAuthStore } from "../stores/authStore";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAchievements } from "../hooks/useAchievements";
import { useSavings } from "../hooks/useSavings";
import { AuthService } from "../services/supabase";
import { HapticService } from "../services/haptics";
import { Box, Text, Button, Input, Card } from "../components/ui";
import { BottomSheet } from "../components/ui";
import { PreferencesEditor } from "../components/PreferencesEditor";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";
import { 
  ProgressRingComponent, 
  AchievementBadge, 
  AchievementCategorySection,
  StatsCard 
} from "../components/AchievementComponents";
import { Achievement, getCategoryColor, getCategoryTitle } from "../types/achievements";
import { CostEstimationService } from "../services/costEstimation";

export const SettingsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { updateProfile, isLoading: isProfileLoading } = useUserProfile();
  const { 
    userStats, 
    achievements, 
    progressRings, 
    recentAchievements,
    unlockedAchievements,
    userLevel,
    totalPoints,
    completionPercentage,
    isLoading: achievementsLoading 
  } = useAchievements();
  const { savingsData, isLoading: savingsLoading } = useSavings();
  const theme = useTheme<Theme>();

  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [hasCentralizedKey, setHasCentralizedKey] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showPreferencesEditor, setShowPreferencesEditor] = useState(false);

  useEffect(() => {
    const checkExistingKey = async () => {
      const [keyExists, centralizedKeyExists] = await Promise.all([
        APIKeyManager.hasGeminiKey(),
        APIKeyManager.hasCentralizedKey()
      ]);
      setHasKey(keyExists);
      setHasCentralizedKey(centralizedKeyExists);
    };
    checkExistingKey();
  }, []);

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter a valid API key");
      return;
    }
    setIsKeyLoading(true);
    try {
      await APIKeyManager.setGeminiKey(apiKey.trim());
      setHasKey(true);
      setApiKey("");
      Alert.alert("Success", "API key saved securely!");
    } catch (error) {
      Alert.alert("Error", "Failed to save API key");
    } finally {
      setIsKeyLoading(false);
    }
  };

  const removeApiKey = () => {
    Alert.alert("Remove API Key", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await APIKeyManager.removeGeminiKey();
          setHasKey(false);
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    HapticService.medium();
    await AuthService.signOut();
  };

  const confirmResetProfile = () => {
    Alert.alert(
      "Reset Profile",
      "This will reset your cooking profile and restart onboarding, but preserve your achievements. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await updateProfile({ skill_level: "" }); // Setting skill_level to empty triggers onboarding
              Alert.alert("Profile Reset", "Your cooking profile has been reset. Your achievements are preserved.");
            } catch (error) {
              Alert.alert("Error", "Failed to reset profile.");
            }
          },
        },
      ]
    );
  };

  if (achievementsLoading) {
    return (
      <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" marginTop="md">Loading your progress...</Text>
      </Box>
    );
  }

  const handleAchievementPress = (achievement: Achievement) => {
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\n${achievement.isUnlocked ? `Unlocked! +${achievement.points} points` : `Progress: ${Math.round(achievement.progress * 100)}%`}`,
      [{ text: "OK" }]
    );
  };

  return (
    <Box flex={1} backgroundColor="mainBackground">
      {/* Profile Header */}
      <Box 
        backgroundColor="primary" 
        padding="lg" 
        paddingTop="xxl"
      >
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text variant="h2" color="primaryButtonText">
            {userLevel.emoji} Profile
          </Text>
          <TouchableOpacity onPress={() => setShowSettingsSheet(true)}>
            <Text fontSize={24}>⚙️</Text>
          </TouchableOpacity>
        </Box>
        
        <Box alignItems="center" marginTop="md">
          <Text variant="h3" color="primaryButtonText">
            {userLevel.title}
          </Text>
          <Text variant="body" color="primaryButtonText" opacity={0.8}>
            {totalPoints} points • {completionPercentage}% complete
          </Text>
        </Box>
      </Box>
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Progress Rings */}
        <Box padding="lg">
          <Text variant="h3" marginBottom="md">Today&apos;s Progress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Box flexDirection="row" paddingHorizontal="sm">
              {progressRings.map((ring, index) => (
                <ProgressRingComponent key={index} ring={ring} />
              ))}
            </Box>
          </ScrollView>
        </Box>

        {/* Stats Overview */}
        <Box paddingHorizontal="lg" marginBottom="lg">
          <Text variant="h3" marginBottom="md">Your Stats</Text>
          <Box flexDirection="row" gap="sm">
            <StatsCard
              title="Recipes"
              value={userStats?.recipesGenerated || 0}
              subtitle="Generated"
              emoji="📚"
              color="#10B981"
            />
            <StatsCard
              title="Cooked"
              value={userStats?.recipesCooked || 0}
              subtitle="Recipes"
              emoji="🍳"
              color="#3B82F6"
            />
            <StatsCard
              title="Streak"
              value={userStats?.currentStreak || 0}
              subtitle="Days"
              emoji="🔥"
              color="#EF4444"
            />
          </Box>
        </Box>

        {/* Savings Dashboard */}
        {!savingsLoading && savingsData.totalCookingSessions > 0 && (
          <Box paddingHorizontal="lg" marginBottom="lg">
            <Text variant="h3" marginBottom="md">💰 Money Saved</Text>
            <Card variant="primary" marginBottom="md">
              <Box flexDirection="row" justifyContent="space-between" marginBottom="sm">
                <Text variant="body" color="primaryText">Total saved:</Text>
                <Text variant="h3" color="primary" fontWeight="bold">
                  {CostEstimationService.formatCurrency(savingsData.totalSavings)}
                </Text>
              </Box>
              <Box flexDirection="row" justifyContent="space-between" marginBottom="sm">
                <Text variant="body" color="primaryText">This month:</Text>
                <Text variant="body" color="secondaryText">
                  {CostEstimationService.formatCurrency(savingsData.monthlySavings)}
                </Text>
              </Box>
              <Box flexDirection="row" justifyContent="space-between">
                <Text variant="body" color="primaryText">Average per meal:</Text>
                <Text variant="body" color="secondaryText">
                  {CostEstimationService.formatCurrency(savingsData.averageSavingsPerMeal)}
                </Text>
              </Box>
            </Card>
            <Text variant="caption" color="secondaryText" textAlign="center">
              💡 Compared to restaurant prices • {savingsData.totalCookingSessions} meals cooked
            </Text>
          </Box>
        )}

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Box paddingHorizontal="lg" marginBottom="lg">
            <Text variant="h3" marginBottom="md">🎉 Recently Unlocked</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Box flexDirection="row" paddingHorizontal="sm">
                {recentAchievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    onPress={() => handleAchievementPress(achievement)}
                    size="large"
                  />
                ))}
              </Box>
            </ScrollView>
          </Box>
        )}

        {/* Achievements by Category */}
        <Box paddingHorizontal="lg" marginBottom="lg">
          <Text variant="h3" marginBottom="md">🏆 Achievements</Text>
          
          {(['recipe_explorer', 'kitchen_confidence', 'skill_builder', 'streak_master', 'flavor_adventurer'] as const).map((category) => {
            const categoryAchievements = achievements.filter(a => a.category === category);
            if (categoryAchievements.length === 0) return null;
            
            return (
              <AchievementCategorySection
                key={category}
                title={getCategoryTitle(category)}
                achievements={categoryAchievements}
                color={getCategoryColor(category)}
                onAchievementPress={handleAchievementPress}
              />
            );
          })}
        </Box>

        <Box height={50} />
      </ScrollView>

      {/* Settings Sheet */}
      <BottomSheet isVisible={showSettingsSheet} onClose={() => setShowSettingsSheet(false)} snapPoints={['90%', '95%']}>
        <Box padding="lg">
          <Text variant="h2" textAlign="center" marginBottom="lg">
            ⚙️ Settings
          </Text>
          
          <Card variant="primary" marginBottom="md">
            <Text variant="h3" marginBottom="sm">Account</Text>
            <Text variant="body" color="secondaryText" marginBottom="md">
              {user?.email}
            </Text>
            <Button variant="secondary" onPress={handleSignOut}>
              <Text variant="button" color="primaryText">Sign Out</Text>
            </Button>
          </Card>

          <Card variant="primary" marginBottom="md">
            <Text variant="h3" marginBottom="sm">Cooking Preferences</Text>
            <Text variant="body" color="secondaryText" marginBottom="md">
              Customize your preferences for better AI recommendations
            </Text>
            <Button 
              variant="primary" 
              onPress={() => {
                setShowSettingsSheet(false);
                setShowPreferencesEditor(true);
              }}
              marginBottom="md"
            >
              <Text variant="button" color="primaryButtonText">
                🎛️ Edit Preferences
              </Text>
            </Button>
            <Button 
              variant="danger" 
              onPress={confirmResetProfile}
              disabled={isProfileLoading}
            >
              {isProfileLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text variant="button" color="dangerButtonText">
                  Reset Profile & Onboarding
                </Text>
              )}
            </Button>
          </Card>

          <Card variant="primary" marginBottom="md">
            <Text variant="h3" marginBottom="sm">🔑 API Key Status</Text>
            
            {hasCentralizedKey ? (
              <Box>
                <Text variant="body" fontWeight="600" marginBottom="sm" color="success">
                  ✅ Centralized API Key Active
                </Text>
                <Text variant="caption" color="secondaryText" marginBottom="md">
                  The app is using a centralized API key managed by the administrators. No individual API key setup required.
                </Text>
                <Button 
                  variant="secondary" 
                  onPress={async () => {
                    await APIKeyManager.clearKeyCache();
                    Alert.alert("Cache Cleared", "API key cache has been refreshed.");
                  }}
                >
                  <Text variant="button" color="primaryText">🔄 Refresh API Key</Text>
                </Button>
              </Box>
            ) : (
              <Box>
                <Text 
                  variant="body" 
                  fontWeight="600" 
                  marginBottom="sm"
                  color={hasKey ? "success" : "warning"}
                >
                  {hasKey ? "✅ Personal API Key Configured" : "⚠️ Personal API Key Required"}
                </Text>
                <Text variant="caption" color="secondaryText" marginBottom="md">
                  {hasKey 
                    ? "You're using your personal Gemini API key. Consider asking administrators to set up a centralized key for better experience."
                    : "No centralized API key is available. Please enter your personal Gemini API key to use AI features."
                  }
                </Text>
                
                {!hasKey ? (
                  <Box>
                    <Input
                      backgroundColor="surface"
                      borderRadius="md"
                      padding="md"
                      fontSize={16}
                      color="text"
                      borderWidth={1}
                      borderColor="border"
                      marginBottom="md"
                      placeholder="Paste your Gemini API key here"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={apiKey}
                      onChangeText={setApiKey}
                      secureTextEntry
                    />
                    <Button variant="primary" onPress={saveApiKey} disabled={isKeyLoading}>
                      {isKeyLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text variant="button" color="primaryButtonText">Save Personal API Key</Text>
                      )}
                    </Button>
                  </Box>
                ) : (
                  <Button variant="danger" onPress={removeApiKey}>
                    <Text variant="button" color="dangerButtonText">Remove Personal API Key</Text>
                  </Button>
                )}
              </Box>
            )}
          </Card>
        </Box>
      </BottomSheet>

      {/* Preferences Editor */}
      <PreferencesEditor 
        isVisible={showPreferencesEditor} 
        onClose={() => setShowPreferencesEditor(false)} 
      />
    </Box>
  );
};

