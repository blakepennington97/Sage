/**
 * Payment Service
 * 
 * Handles subscription management using RevenueCat + Stripe
 * Integrates with usage tracking system for premium features
 */

import Purchases, { 
  CustomerInfo, 
  PurchasesOffering, 
  PurchasesPackage,
  PURCHASE_TYPE,
  PRORATION_MODE
} from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import { usageTrackingService } from './usageTracking';
import { supabase } from './supabase';

// Configuration
const REVENUECAT_API_KEY = {
  ios: 'your_ios_api_key_here',
  android: 'your_android_api_key_here',
};

// Product IDs (these should match your RevenueCat/App Store/Play Store setup)
export const PRODUCT_IDS = {
  monthly: 'sage_premium_monthly',
  yearly: 'sage_premium_yearly', // For future implementation
} as const;

// Entitlement identifiers
export const ENTITLEMENTS = {
  premium: 'premium',
} as const;

export interface SubscriptionData {
  isActive: boolean;
  isPremium: boolean;
  productId: string | null;
  expiresAt: Date | null;
  willRenew: boolean;
  isInGracePeriod: boolean;
  isInFreeTrial: boolean;
  originalPurchaseDate: Date | null;
}

class PaymentService {
  private isInitialized = false;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(userId?: string): Promise<void> {
    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;
      
      await Purchases.configure({ apiKey });
      
      if (userId) {
        await Purchases.logIn(userId);
      }
      
      this.isInitialized = true;
      console.log('PaymentService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PaymentService:', error);
      throw error;
    }
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('PaymentService not initialized. Call initialize() first.');
    }
  }

  /**
   * Get current customer info and subscription status
   */
  async getSubscriptionData(): Promise<SubscriptionData> {
    this.ensureInitialized();
    
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Error getting subscription data:', error);
      return this.getDefaultSubscriptionData();
    }
  }

  /**
   * Parse RevenueCat CustomerInfo into our SubscriptionData format
   */
  private parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionData {
    const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.premium];
    
    if (!entitlement) {
      return this.getDefaultSubscriptionData();
    }

    return {
      isActive: true,
      isPremium: true,
      productId: entitlement.productIdentifier,
      expiresAt: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
      willRenew: entitlement.willRenew,
      isInGracePeriod: entitlement.isInGracePeriod || false,
      isInFreeTrial: entitlement.isSandbox || false, // Adjust based on your trial setup
      originalPurchaseDate: entitlement.originalPurchaseDate ? new Date(entitlement.originalPurchaseDate) : null,
    };
  }

  /**
   * Default subscription data for free users
   */
  private getDefaultSubscriptionData(): SubscriptionData {
    return {
      isActive: false,
      isPremium: false,
      productId: null,
      expiresAt: null,
      willRenew: false,
      isInGracePeriod: false,
      isInFreeTrial: false,
      originalPurchaseDate: null,
    };
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    this.ensureInitialized();
    
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Update our local usage tracking
      const subscriptionData = this.parseCustomerInfo(customerInfo);
      await this.syncSubscriptionStatus(subscriptionData);
      
      return subscriptionData.isPremium;
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // Handle different error types
      if (error.userCancelled) {
        return false; // User cancelled, not an error
      }
      
      Alert.alert(
        'Purchase Failed',
        error.message || 'Unable to complete purchase. Please try again.',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      const customerInfo = await Purchases.restorePurchases();
      const subscriptionData = this.parseCustomerInfo(customerInfo);
      
      await this.syncSubscriptionStatus(subscriptionData);
      
      if (subscriptionData.isPremium) {
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored!',
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Restore purchases failed:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Sync subscription status with our usage tracking system
   */
  async syncSubscriptionStatus(subscriptionData?: SubscriptionData): Promise<void> {
    try {
      const data = subscriptionData || await this.getSubscriptionData();
      
      // Update usage tracking with premium status
      await usageTrackingService.updatePremiumStatus(
        data.isPremium,
        data.expiresAt
      );
      
      console.log('Subscription status synced:', data);
    } catch (error) {
      console.error('Failed to sync subscription status:', error);
    }
  }

  /**
   * Check if user has active premium subscription
   */
  async isPremiumUser(): Promise<boolean> {
    try {
      const subscriptionData = await this.getSubscriptionData();
      return subscriptionData.isPremium && subscriptionData.isActive;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  /**
   * Get subscription expiry information for display
   */
  async getExpiryInfo(): Promise<{ isExpiring: boolean; daysLeft: number; expiryDate: Date | null }> {
    try {
      const subscriptionData = await this.getSubscriptionData();
      
      if (!subscriptionData.expiresAt || !subscriptionData.isPremium) {
        return { isExpiring: false, daysLeft: 0, expiryDate: null };
      }
      
      const now = new Date();
      const expiryDate = subscriptionData.expiresAt;
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpiring = daysLeft <= 7 && daysLeft > 0;
      
      return { isExpiring, daysLeft: Math.max(0, daysLeft), expiryDate };
    } catch (error) {
      console.error('Error getting expiry info:', error);
      return { isExpiring: false, daysLeft: 0, expiryDate: null };
    }
  }

  /**
   * Log user in to RevenueCat (call when user authenticates)
   */
  async loginUser(userId: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      const subscriptionData = this.parseCustomerInfo(customerInfo);
      await this.syncSubscriptionStatus(subscriptionData);
    } catch (error) {
      console.error('Failed to login user to RevenueCat:', error);
    }
  }

  /**
   * Log user out of RevenueCat (call when user logs out)
   */
  async logoutUser(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to logout user from RevenueCat:', error);
    }
  }

  /**
   * Get formatted price for a package
   */
  formatPrice(packageInfo: PurchasesPackage): string {
    return packageInfo.product.priceString;
  }

  /**
   * Get product title for display
   */
  getProductTitle(packageInfo: PurchasesPackage): string {
    return packageInfo.product.title;
  }

  /**
   * Get product description for display
   */
  getProductDescription(packageInfo: PurchasesPackage): string {
    return packageInfo.product.description;
  }

  /**
   * Check if package includes free trial
   */
  hasFreeTrial(packageInfo: PurchasesPackage): boolean {
    // Check if product has introductory price (free trial)
    return packageInfo.product.introPrice !== null;
  }

  /**
   * Get free trial duration
   */
  getTrialDuration(packageInfo: PurchasesPackage): string {
    const introPrice = packageInfo.product.introPrice;
    if (!introPrice) return '';
    
    // Parse trial duration from intro price period
    return '7 days'; // Default to 7 days for now
  }

  /**
   * Handle subscription lifecycle events
   */
  setupSubscriptionListener(): void {
    this.ensureInitialized();
    
    Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
      console.log('Customer info updated:', customerInfo);
      const subscriptionData = this.parseCustomerInfo(customerInfo);
      await this.syncSubscriptionStatus(subscriptionData);
    });
  }

  /**
   * Remove subscription listener
   */
  removeSubscriptionListener(): void {
    // RevenueCat automatically handles listener cleanup
    // This method is here for consistency and future use
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;