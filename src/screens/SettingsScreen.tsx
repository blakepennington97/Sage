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
import { AuthService } from "../services/supabase";
import { HapticService } from "../services/haptics";
import { Box, Text, Button, Input, Card } from "../components/ui";
import { useTheme } from "@shopify/restyle";
import { Theme } from "../constants/restyleTheme";
import { 
  ProgressRingComponent, 
  AchievementBadge, 
  AchievementCategorySection,
  StatsCard 
} from "../components/AchievementComponents";
import { Achievement, getCategoryColor, getCategoryTitle } from "../types/achievements";

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
  const theme = useTheme<Theme>();

  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkExistingKey = async () => {
      const keyExists = await APIKeyManager.hasGeminiKey();
      setHasKey(keyExists);
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

  const resetProfile = () => {
    Alert.alert(
      "Reset Profile",
      "This will restart onboarding. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await updateProfile({ skill_level: "" }); // Setting skill_level to empty triggers onboarding
              Alert.alert("Profile Reset", "Your profile has been reset.");
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
          <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
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

        {/* Settings Section (Collapsible) */}
        {showSettings && (
          <Box paddingHorizontal="lg" marginBottom="lg">
            <Text variant="h3" marginBottom="md">⚙️ Settings</Text>
            
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
              <Text variant="h3" marginBottom="sm">Cooking Profile</Text>
              <Button 
                variant="danger" 
                onPress={resetProfile}
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
              <Text variant="h3" marginBottom="sm">Gemini API Key</Text>
              <Text 
                variant="body" 
                fontWeight="600" 
                marginBottom="md"
                color={hasKey ? "success" : "error"}
              >
                {hasKey ? "✅ API Key Configured" : "❌ No API Key"}
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
                    placeholder="Paste your key here"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry
                  />
                  <Button variant="primary" onPress={saveApiKey} disabled={isKeyLoading}>
                    {isKeyLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text variant="button" color="primaryButtonText">Save API Key</Text>
                    )}
                  </Button>
                </Box>
              ) : (
                <Button variant="danger" onPress={removeApiKey}>
                  <Text variant="button" color="dangerButtonText">Remove API Key</Text>
                </Button>
              )}
            </Card>
          </Box>
        )}
        
        <Box height={50} />
      </ScrollView>
    </Box>
  );
};

