import React from 'react';
import { Box, Text, Button, Card } from './ui';

interface PremiumGateProps {
  feature: string;
  description: string;
  onUpgrade: () => void;
  onClose?: () => void;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  description,
  onUpgrade,
  onClose,
}) => {
  return (
    <Box 
      flex={1} 
      backgroundColor="mainBackground" 
      justifyContent="center" 
      alignItems="center"
      padding="xl"
    >
      <Card
        variant="primary"
        padding="xl"
        borderRadius="lg"
        alignItems="center"
        width="100%"
      >
        {/* Premium Icon */}
        <Box
          backgroundColor="primary"
          borderRadius="full"
          width={80}
          height={80}
          justifyContent="center"
          alignItems="center"
          marginBottom="lg"
        >
          <Text fontSize={32}>👑</Text>
        </Box>

        {/* Header */}
        <Text variant="h1" textAlign="center" marginBottom="sm">
          Unlock {feature}
        </Text>
        
        <Text variant="body" color="secondaryText" textAlign="center" marginBottom="lg">
          {description}
        </Text>

        {/* Premium Features List */}
        <Box alignSelf="stretch" marginBottom="xl">
          <Text variant="h3" marginBottom="md">
            Premium Features Include:
          </Text>
          
          <Box flexDirection="row" alignItems="center" marginBottom="sm">
            <Text variant="body" marginRight="sm">📅</Text>
            <Text variant="body" color="secondaryText">
              Unlimited weekly meal planning
            </Text>
          </Box>
          
          <Box flexDirection="row" alignItems="center" marginBottom="sm">
            <Text variant="body" marginRight="sm">🛒</Text>
            <Text variant="body" color="secondaryText">
              Smart grocery list generation
            </Text>
          </Box>
          
          <Box flexDirection="row" alignItems="center" marginBottom="sm">
            <Text variant="body" marginRight="sm">🍳</Text>
            <Text variant="body" color="secondaryText">
              Unlimited recipe generation
            </Text>
          </Box>
          
          <Box flexDirection="row" alignItems="center" marginBottom="sm">
            <Text variant="body" marginRight="sm">💾</Text>
            <Text variant="body" color="secondaryText">
              Save unlimited recipes
            </Text>
          </Box>
          
          <Box flexDirection="row" alignItems="center" marginBottom="sm">
            <Text variant="body" marginRight="sm">🏆</Text>
            <Text variant="body" color="secondaryText">
              Advanced cooking achievements
            </Text>
          </Box>
        </Box>

        {/* Pricing */}
        <Box 
          backgroundColor="primary" 
          borderRadius="md" 
          padding="md" 
          marginBottom="lg"
          alignSelf="stretch"
          alignItems="center"
        >
          <Text variant="h2" color="primaryButtonText">
            $9.99/month
          </Text>
          <Text variant="caption" color="primaryButtonText">
            Cancel anytime
          </Text>
        </Box>

        {/* Action Buttons */}
        <Button
          variant="primary"
          onPress={onUpgrade}
          marginBottom="md"
          alignSelf="stretch"
        >
          <Text variant="button" color="primaryButtonText">
            Start Free Trial
          </Text>
        </Button>

        {onClose && (
          <Button
            variant="secondary"
            onPress={onClose}
            alignSelf="stretch"
          >
            <Text variant="button" color="secondaryText">
              Maybe Later
            </Text>
          </Button>
        )}

        {/* Fine Print */}
        <Text variant="caption" color="tertiaryText" textAlign="center" marginTop="md">
          7-day free trial, then $9.99/month. Cancel anytime in your account settings.
        </Text>
      </Card>
    </Box>
  );
};