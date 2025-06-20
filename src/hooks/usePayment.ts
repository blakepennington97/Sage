/**
 * Payment Hook
 * 
 * React hook for subscription management and payment handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { paymentService, SubscriptionData, PRODUCT_IDS } from '../services/payment';
import { useAuthStore } from '../stores/authStore';

export interface UsePaymentReturn {
  // Subscription data
  subscriptionData: SubscriptionData | null;
  isPremium: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Offerings and packages
  offerings: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  
  // Actions
  purchaseMonthly: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshSubscription: () => void;
  
  // Pricing and display
  monthlyPrice: string;
  hasFreeTrial: boolean;
  trialDuration: string;
  
  // Expiry info
  isExpiring: boolean;
  daysUntilExpiry: number;
  expiryDate: Date | null;
}

export function usePayment(): UsePaymentReturn {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize payment service when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      paymentService.initialize(user.id)
        .then(() => {
          setIsInitialized(true);
          paymentService.setupSubscriptionListener();
        })
        .catch(console.error);
    }
  }, [user, isInitialized]);

  // Query for subscription data
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => paymentService.getSubscriptionData(),
    enabled: !!user && isInitialized,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Query for offerings
  const {
    data: offerings,
    isLoading: offeringsLoading,
    error: offeringsError,
  } = useQuery({
    queryKey: ['offerings'],
    queryFn: () => paymentService.getOfferings(),
    enabled: !!user && isInitialized,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Query for expiry info
  const {
    data: expiryInfo,
  } = useQuery({
    queryKey: ['subscription-expiry', user?.id],
    queryFn: () => paymentService.getExpiryInfo(),
    enabled: !!user && isInitialized && subscriptionData?.isPremium,
    staleTime: 60 * 1000, // 1 minute
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (packageToPurchase: PurchasesPackage) => 
      paymentService.purchasePackage(packageToPurchase),
    onSuccess: (success) => {
      if (success) {
        // Invalidate and refetch all related queries
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['usage-tracking'] });
        
        Alert.alert(
          'Welcome to Premium!',
          'You now have unlimited access to all features. Start cooking!',
          [{ text: 'Start Cooking!' }]
        );
      }
    },
    onError: (error: any) => {
      console.error('Purchase mutation error:', error);
    },
  });

  // Restore purchases mutation
  const restoreMutation = useMutation({
    mutationFn: () => paymentService.restorePurchases(),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['usage-tracking'] });
      }
    },
  });

  // Computed values
  const isPremium = subscriptionData?.isPremium || false;
  const isLoading = subscriptionLoading || offeringsLoading || !isInitialized;
  const error = subscriptionError || offeringsError;

  // Find monthly package
  const monthlyPackage = offerings?.availablePackages.find(
    pkg => pkg.identifier === PRODUCT_IDS.monthly
  ) || offerings?.monthly || null;

  // Pricing information
  const monthlyPrice = monthlyPackage ? paymentService.formatPrice(monthlyPackage) : '$9.99';
  const hasFreeTrial = monthlyPackage ? paymentService.hasFreeTrial(monthlyPackage) : true;
  const trialDuration = monthlyPackage ? paymentService.getTrialDuration(monthlyPackage) : '7 days';

  // Expiry information
  const isExpiring = expiryInfo?.isExpiring || false;
  const daysUntilExpiry = expiryInfo?.daysLeft || 0;
  const expiryDate = expiryInfo?.expiryDate || null;

  // Actions
  const purchaseMonthly = useCallback(async (): Promise<boolean> => {
    if (!monthlyPackage) {
      Alert.alert(
        'Purchase Unavailable',
        'Monthly subscription is not available at this time. Please try again later.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      return await purchaseMutation.mutateAsync(monthlyPackage);
    } catch {
      return false;
    }
  }, [monthlyPackage, purchaseMutation]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      return await restoreMutation.mutateAsync();
    } catch {
      return false;
    }
  }, [restoreMutation]);

  const refreshSubscription = useCallback(() => {
    refetchSubscription();
    queryClient.invalidateQueries({ queryKey: ['subscription-expiry'] });
    queryClient.invalidateQueries({ queryKey: ['usage-tracking'] });
  }, [refetchSubscription, queryClient]);

  return {
    // Subscription data
    subscriptionData,
    isPremium,
    isLoading,
    error: error as Error | null,
    
    // Offerings and packages
    offerings,
    monthlyPackage,
    
    // Actions
    purchaseMonthly,
    restorePurchases,
    refreshSubscription,
    
    // Pricing and display
    monthlyPrice,
    hasFreeTrial,
    trialDuration,
    
    // Expiry info
    isExpiring,
    daysUntilExpiry,
    expiryDate,
  };
}

/**
 * Hook for checking premium status only
 * Useful for conditional rendering without full payment context
 */
export function usePremiumStatus() {
  const { isPremium, isLoading } = usePayment();
  
  return {
    isPremium,
    isLoading,
  };
}

/**
 * Hook for upgrade prompts and subscription management
 */
export function useSubscriptionActions() {
  const { 
    purchaseMonthly, 
    restorePurchases, 
    monthlyPrice, 
    hasFreeTrial, 
    trialDuration,
    isLoading 
  } = usePayment();
  
  const showUpgradePrompt = useCallback((feature?: string) => {
    const featureText = feature ? ` ${feature}` : '';
    const trialText = hasFreeTrial ? `\n\nStart your ${trialDuration} free trial today!` : '';
    
    Alert.alert(
      'Upgrade to Premium',
      `Unlock unlimited${featureText} and all premium features for ${monthlyPrice}/month.${trialText}`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Upgrade Now', 
          onPress: purchaseMonthly 
        },
      ]
    );
  }, [purchaseMonthly, monthlyPrice, hasFreeTrial, trialDuration]);

  const showRestorePrompt = useCallback(() => {
    Alert.alert(
      'Restore Purchases',
      'Already have a subscription? Restore your previous purchases.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          onPress: restorePurchases 
        },
      ]
    );
  }, [restorePurchases]);

  return {
    showUpgradePrompt,
    showRestorePrompt,
    purchaseMonthly,
    restorePurchases,
    monthlyPrice,
    hasFreeTrial,
    trialDuration,
    isLoading,
  };
}