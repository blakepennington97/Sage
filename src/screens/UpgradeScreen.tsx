/**
 * Upgrade Screen
 * 
 * Premium subscription upgrade screen with pricing and benefits
 */

import React from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Box, Text, Button, Card } from '../components/ui';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../constants/restyleTheme';
import { usePayment } from '../hooks/usePayment';
import { WeeklyUsageOverview } from '../components/UsageDisplay';

const PREMIUM_FEATURES = [
  {
    icon: '🚀',
    title: 'Unlimited Recipe Generation',
    description: 'Create as many personalized recipes as you want, whenever inspiration strikes'
  },
  {
    icon: '🛒',
    title: 'Unlimited Grocery Lists',
    description: 'Generate shopping lists for any recipe with smart ingredient categorization'
  },
  {
    icon: '📅',
    title: 'Advanced Meal Planning',
    description: 'Plan your entire week, save time, and never wonder &quot;what&apos;s for dinner?&quot; again'
  },
  {
    icon: '💰',
    title: 'Cost Analysis & Savings',
    description: 'Track how much you save cooking at home vs. ordering out'
  },
  {
    icon: '⚡',
    title: 'Priority Support',
    description: 'Get faster help and early access to new features'
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    description: 'Detailed insights into your cooking journey and achievements'
  }
];

export const UpgradeScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme<Theme>();
  const {
    isPremium,
    isLoading,
    purchaseMonthly,
    restorePurchases,
    monthlyPrice,
    hasFreeTrial,
    trialDuration,
    subscriptionData
  } = usePayment();

  const handlePurchase = async () => {
    const success = await purchaseMonthly();
    if (success) {
      navigation.goBack();
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      navigation.goBack();
    }
  };

  const renderHeader = () => (
    <Box backgroundColor="primary" paddingTop="xxl" paddingBottom="lg" paddingHorizontal="lg">
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', left: 20, top: 60, zIndex: 1 }}
      >
        <Text fontSize={24} color="primaryButtonText">←</Text>
      </TouchableOpacity>
      
      <Box alignItems="center" marginTop="lg">
        <Text variant="h1" color="primaryButtonText" textAlign="center" marginBottom="sm">
          🚀 Upgrade to Premium
        </Text>
        <Text variant="body" color="primaryButtonText" textAlign="center" opacity={0.9}>
          Unlock unlimited cooking potential
        </Text>
      </Box>
    </Box>
  );

  const renderPricing = () => (
    <Card variant="primary" margin="lg">
      <Box alignItems="center" marginBottom="lg">
        <Text variant="h1" color="primary" marginBottom="xs">
          {monthlyPrice}
        </Text>
        <Text variant="body" color="secondaryText" marginBottom="sm">
          per month
        </Text>
        
        {hasFreeTrial && (
          <Box 
            backgroundColor="success" 
            paddingHorizontal="md" 
            paddingVertical="xs" 
            borderRadius="full"
            marginBottom="sm"
          >
            <Text variant="caption" color="primaryButtonText" fontWeight="bold">
              {trialDuration} FREE TRIAL
            </Text>
          </Box>
        )}
        
        <Text variant="caption" color="secondaryText" textAlign="center">
          Cancel anytime • No commitment
        </Text>
      </Box>

      <Button
        variant="primary"
        onPress={handlePurchase}
        disabled={isLoading || isPremium}
        marginBottom="sm"
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primaryButtonText} />
        ) : isPremium ? (
          <Text variant="button" color="primaryButtonText">Already Premium</Text>
        ) : (
          <Text variant="button" color="primaryButtonText">
            {hasFreeTrial ? `Start ${trialDuration} Free Trial` : 'Subscribe Now'}
          </Text>
        )}
      </Button>

      <TouchableOpacity onPress={handleRestore}>
        <Text variant="caption" color="primary" textAlign="center" textDecorationLine="underline">
          Already have a subscription? Restore purchases
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderFeatures = () => (
    <Box margin="lg">
      <Text variant="h2" color="primaryText" marginBottom="lg" textAlign="center">
        What You Get with Premium
      </Text>
      
      {PREMIUM_FEATURES.map((feature, index) => (
        <Card key={index} variant="secondary" marginBottom="md">
          <Box flexDirection="row" alignItems="flex-start">
            <Text fontSize={24} marginRight="md" marginTop="xs">
              {feature.icon}
            </Text>
            <Box flex={1}>
              <Text variant="h3" color="primaryText" marginBottom="xs">
                {feature.title}
              </Text>
              <Text variant="body" color="secondaryText">
                {feature.description}
              </Text>
            </Box>
          </Box>
        </Card>
      ))}
    </Box>
  );

  const renderCurrentUsage = () => (
    <Box margin="lg">
      <Text variant="h2" color="primaryText" marginBottom="md" textAlign="center">
        Your Current Usage
      </Text>
      <WeeklyUsageOverview onUpgrade={handlePurchase} />
    </Box>
  );

  const renderPremiumStatus = () => {
    if (!isPremium || !subscriptionData) return null;

    return (
      <Card variant="primary" margin="lg">
        <Box alignItems="center">
          <Text variant="h2" color="success" marginBottom="sm">
            ✨ You&apos;re Premium!
          </Text>
          <Text variant="body" color="primaryText" textAlign="center" marginBottom="md">
            You have unlimited access to all features
          </Text>
          
          {subscriptionData.expiresAt && (
            <Text variant="caption" color="secondaryText" textAlign="center">
              {subscriptionData.willRenew 
                ? `Renews on ${subscriptionData.expiresAt.toLocaleDateString()}`
                : `Expires on ${subscriptionData.expiresAt.toLocaleDateString()}`
              }
            </Text>
          )}
        </Box>
      </Card>
    );
  };

  const renderFooter = () => (
    <Box padding="lg" alignItems="center">
      <Text variant="caption" color="secondaryText" textAlign="center" marginBottom="sm">
        Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
      </Text>
      <TouchableOpacity onPress={() => {
        Alert.alert(
          'Need Help?',
          'Contact us at support@sageapp.com for assistance with your subscription.',
          [{ text: 'OK' }]
        );
      }}>
        <Text variant="caption" color="primary" textDecorationLine="underline">
          Terms of Service • Privacy Policy • Support
        </Text>
      </TouchableOpacity>
    </Box>
  );

  return (
    <Box flex={1} backgroundColor="background">
      {renderHeader()}
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {isPremium ? renderPremiumStatus() : renderPricing()}
        
        {!isPremium && renderCurrentUsage()}
        
        {renderFeatures()}
        
        {renderFooter()}
      </ScrollView>
    </Box>
  );
};