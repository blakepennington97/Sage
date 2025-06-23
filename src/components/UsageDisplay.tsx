/**
 * Usage Display Components
 * 
 * Components for showing usage limits and upgrade prompts
 */

import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Box, Text, Button } from './ui';
import { useUsageTracking, useUsageDisplay } from '../hooks/useUsageTracking';
import { ActionType } from '../services/usageTracking';
import { isFeatureEnabled } from '../config/features';

// Colors for usage status
const getUsageColor = (remaining: number, total: number, isPremium: boolean) => {
  if (isPremium) return 'success';
  if (remaining === 0) return 'error';
  if (remaining <= 1) return 'warning';
  return 'primaryText';
};

interface UsageIndicatorProps {
  actionType: ActionType;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Shows remaining usage for a specific action type
 */
export function UsageIndicator({ 
  actionType, 
  showLabel = true, 
  size = 'medium' 
}: UsageIndicatorProps) {
  const { displayText, remaining, isPremium, isLoading } = useUsageDisplay(actionType);
  
  // Don't show usage indicator if feature is disabled
  if (!isFeatureEnabled('usageTracking')) {
    return null;
  }
  
  if (isLoading) {
    return (
      <Box flexDirection="row" alignItems="center">
        <Text variant="caption" color="secondaryText">Loading...</Text>
      </Box>
    );
  }

  const label = actionType === 'recipe_generation' ? 'Recipes' : 'Grocery Lists';
  const textVariant = size === 'small' ? 'caption' : size === 'large' ? 'body' : 'caption';
  
  return (
    <Box flexDirection="row" alignItems="center">
      {showLabel && (
        <Text variant={textVariant} color="secondaryText" marginRight="xs">
          {label}:
        </Text>
      )}
      <Text 
        variant={textVariant} 
        color={getUsageColor(remaining, 5, isPremium)}
        fontWeight={remaining === 0 && !isPremium ? 'bold' : 'normal'}
      >
        {displayText}
      </Text>
    </Box>
  );
}

interface UsageCardProps {
  actionType: ActionType;
  onUpgrade?: () => void;
}

/**
 * Card showing detailed usage information with upgrade option
 */
export function UsageCard({ actionType, onUpgrade }: UsageCardProps) {
  const { usageData, isPremium, canPerformAction } = useUsageTracking();
  
  // Don't show usage card if feature is disabled
  if (!isFeatureEnabled('usageTracking')) {
    return null;
  }
  
  if (!usageData) {
    return null;
  }

  const actionData = actionType === 'recipe_generation' 
    ? usageData.recipe_generations 
    : usageData.grocery_lists;

  const label = actionType === 'recipe_generation' ? 'Recipe Generation' : 'Grocery Lists';
  const canUse = canPerformAction(actionType);

  return (
    <Box 
      backgroundColor="surface" 
      padding="md" 
      borderRadius="lg" 
      marginBottom="sm"
    >
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="sm">
        <Text variant="h3" color="primaryText">{label}</Text>
        {isPremium && (
          <Box backgroundColor="primary" paddingHorizontal="sm" paddingVertical="xs" borderRadius="md">
            <Text variant="caption" color="primaryButtonText" fontWeight="bold">
              PREMIUM
            </Text>
          </Box>
        )}
      </Box>
      
      {isPremium ? (
        <Text variant="body" color="success">
          ✨ Unlimited usage
        </Text>
      ) : (
        <Box>
          <Box flexDirection="row" justifyContent="space-between" marginBottom="xs">
            <Text variant="body" color="primaryText">Used this week:</Text>
            <Text variant="body" color="primaryText">
              {actionData.used} / {actionData.limit}
            </Text>
          </Box>
          
          <Box 
            height={4} 
            backgroundColor="border" 
            borderRadius="sm" 
            marginBottom="sm"
          >
            <Box
              height={4}
              backgroundColor={actionData.used >= actionData.limit ? 'error' : 'primary'}
              borderRadius="sm"
              style={{ width: `${Math.min((actionData.used / actionData.limit) * 100, 100)}%` }}
            />
          </Box>
          
          <Text 
            variant="caption" 
            color={canUse ? 'secondaryText' : 'error'}
            marginBottom="sm"
          >
            {canUse ? `${actionData.remaining} remaining` : 'Limit reached'}
          </Text>
          
          {!canUse && onUpgrade && (
            <Button variant="primary" onPress={onUpgrade}>
              <Text variant="button" color="primaryButtonText">
                Upgrade to Premium
              </Text>
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

interface LimitReachedModalProps {
  actionType: ActionType;
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

/**
 * Modal shown when user hits usage limit
 */
export function LimitReachedModal({ 
  actionType, 
  visible, 
  onClose, 
  onUpgrade 
}: LimitReachedModalProps) {
  const actionLabel = actionType === 'recipe_generation' ? 'recipe generation' : 'grocery list';

  const showAlert = React.useCallback(() => {
    Alert.alert(
      'Usage Limit Reached',
      `You've reached your weekly limit for ${actionLabel}. Upgrade to Premium for unlimited access!`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onClose,
        },
        ...(onUpgrade ? [{
          text: 'Upgrade Now',
          style: 'default' as const,
          onPress: () => {
            onClose();
            onUpgrade();
          },
        }] : []),
      ]
    );
  }, [actionLabel, onClose, onUpgrade]);

  // Show alert immediately
  React.useEffect(() => {
    if (visible && isFeatureEnabled('upgradePrompts')) {
      showAlert();
    }
  }, [visible, showAlert]);

  // Don't show modal if feature is disabled
  if (!isFeatureEnabled('upgradePrompts')) {
    return null;
  }
  
  if (!visible) return null;

  return null; // Alert handles the UI
}

interface PremiumExpiryWarningProps {
  onRenew?: () => void;
}

/**
 * Shows warning when premium is expiring soon
 */
export function PremiumExpiryWarning({ onRenew }: PremiumExpiryWarningProps) {
  const { isPremiumExpiringSoon, premiumExpiryText, daysUntilExpiry } = useUsageTracking();
  
  // Don't show warning if premium features are disabled
  if (!isFeatureEnabled('premiumFeatures')) {
    return null;
  }
  
  if (!isPremiumExpiringSoon) {
    return null;
  }

  return (
    <Box 
      backgroundColor="warning" 
      padding="md" 
      borderRadius="lg" 
      marginBottom="md"
    >
      <Box flexDirection="row" alignItems="center" marginBottom="sm">
        <Text variant="body" color="primaryText" fontWeight="bold">
          ⚠️ Premium Expiring Soon
        </Text>
      </Box>
      
      <Text variant="body" color="primaryText" marginBottom="sm">
        Your premium subscription {premiumExpiryText.toLowerCase()}
        {daysUntilExpiry !== null && daysUntilExpiry > 0 && ` in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`}.
      </Text>
      
      {onRenew && (
        <Button variant="primary" onPress={onRenew}>
          <Text variant="button" color="primaryButtonText">
            Renew Subscription
          </Text>
        </Button>
      )}
    </Box>
  );
}

interface WeeklyUsageOverviewProps {
  onUpgrade?: () => void;
}

/**
 * Overview of all weekly usage limits
 */
export function WeeklyUsageOverview({ onUpgrade }: WeeklyUsageOverviewProps) {
  const { usageData, isPremium } = useUsageTracking();
  const navigation = useNavigation<any>();
  
  // Don't show overview if feature is disabled
  if (!isFeatureEnabled('usageTracking')) {
    return (
      <Box backgroundColor="surface" padding="md" borderRadius="lg">
        <Text variant="h2" color="primaryText" marginBottom="md">Usage Tracking</Text>
        <Text variant="body" color="secondaryText">Usage tracking is currently disabled.</Text>
      </Box>
    );
  }
  
  const handleUpgrade = onUpgrade || (() => {
    if (isFeatureEnabled('paymentSystem')) {
      navigation.navigate('Upgrade');
    } else {
      Alert.alert(
        "Coming Soon",
        "Premium features will be available in a future update!"
      );
    }
  });
  
  if (!usageData) {
    return (
      <Box backgroundColor="surface" padding="md" borderRadius="lg">
        <Text variant="body" color="secondaryText">Loading usage data...</Text>
      </Box>
    );
  }

  return (
    <Box backgroundColor="surface" padding="md" borderRadius="lg">
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="md">
        <Text variant="h2" color="primaryText">Weekly Usage</Text>
        {isPremium && (
          <Box backgroundColor="primary" paddingHorizontal="sm" paddingVertical="xs" borderRadius="md">
            <Text variant="caption" color="primaryButtonText" fontWeight="bold">
              PREMIUM
            </Text>
          </Box>
        )}
      </Box>
      
      <Text variant="caption" color="secondaryText" marginBottom="md">
        Week starting {new Date(usageData.week_start_date).toLocaleDateString()}
      </Text>
      
      <UsageCard actionType="recipe_generation" onUpgrade={onUpgrade} />
      <UsageCard actionType="grocery_list" onUpgrade={onUpgrade} />
      
      {!isPremium && (
        <Box marginTop="md">
          <Button variant="primary" onPress={handleUpgrade}>
            <Text variant="button" color="primaryButtonText">
              🚀 Upgrade to Premium - $9.99/month
            </Text>
          </Button>
          <Text variant="caption" color="secondaryText" textAlign="center" marginTop="xs">
            7-day free trial • Cancel anytime
          </Text>
        </Box>
      )}
    </Box>
  );
}