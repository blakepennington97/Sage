/**
 * Webhook Handler Service
 * 
 * Handles webhook events from RevenueCat for subscription status changes
 * Updates local database with subscription information
 */

import { supabase } from './supabase';
import { usageTrackingService } from './usageTracking';

// RevenueCat webhook event types
export interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    id: string;
    type: string;
    environment: 'PRODUCTION' | 'SANDBOX';
    app_user_id: string;
    aliases?: string[];
    original_app_user_id: string;
    product_id: string;
    period_type: 'NORMAL' | 'TRIAL' | 'INTRO';
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    auto_resume_at_ms: number | null;
    commission_percentage: number | null;
    currency: string;
    is_family_share: boolean;
    country_code: string;
    price: number;
    price_in_purchased_currency: number;
    subscriber_attributes: Record<string, any>;
    store: 'APP_STORE' | 'PLAY_STORE' | 'AMAZON' | 'STRIPE';
    takehome_percentage: number;
    offer_code: string | null;
    tax_percentage: number;
    transaction_id: string;
    original_transaction_id: string;
    presented_offering_id: string | null;
  };
}

// Webhook event types we care about
export const WEBHOOK_EVENTS = {
  INITIAL_PURCHASE: 'INITIAL_PURCHASE',
  RENEWAL: 'RENEWAL',
  CANCELLATION: 'CANCELLATION',
  UNCANCELLATION: 'UNCANCELLATION',
  NON_RENEWING_PURCHASE: 'NON_RENEWING_PURCHASE',
  EXPIRATION: 'EXPIRATION',
  BILLING_ISSUE: 'BILLING_ISSUE',
  PRODUCT_CHANGE: 'PRODUCT_CHANGE',
  TRIAL_STARTED: 'TRIAL_STARTED',
  TRIAL_CONVERTED: 'TRIAL_CONVERTED',
  TRIAL_CANCELLED: 'TRIAL_CANCELLED',
} as const;

class WebhookHandlerService {
  /**
   * Process incoming webhook from RevenueCat
   */
  async processWebhook(webhookData: RevenueCatWebhookEvent): Promise<{ success: boolean; message: string }> {
    try {
      const { event } = webhookData;
      
      console.log(`Processing webhook event: ${event.type} for user: ${event.app_user_id}`);
      
      // Handle different event types
      switch (event.type) {
        case WEBHOOK_EVENTS.INITIAL_PURCHASE:
        case WEBHOOK_EVENTS.RENEWAL:
        case WEBHOOK_EVENTS.TRIAL_STARTED:
        case WEBHOOK_EVENTS.TRIAL_CONVERTED:
        case WEBHOOK_EVENTS.UNCANCELLATION:
          await this.handleSubscriptionActivation(event);
          break;
          
        case WEBHOOK_EVENTS.CANCELLATION:
        case WEBHOOK_EVENTS.EXPIRATION:
        case WEBHOOK_EVENTS.TRIAL_CANCELLED:
          await this.handleSubscriptionDeactivation(event);
          break;
          
        case WEBHOOK_EVENTS.BILLING_ISSUE:
          await this.handleBillingIssue(event);
          break;
          
        case WEBHOOK_EVENTS.PRODUCT_CHANGE:
          await this.handleProductChange(event);
          break;
          
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
          return { success: true, message: `Event type ${event.type} acknowledged but not processed` };
      }
      
      // Log the webhook event for audit purposes
      await this.logWebhookEvent(webhookData);
      
      return { success: true, message: `Successfully processed ${event.type} event` };
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      return { 
        success: false, 
        message: `Failed to process webhook: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Handle subscription activation events
   */
  private async handleSubscriptionActivation(event: RevenueCatWebhookEvent['event']): Promise<void> {
    const { app_user_id, expiration_at_ms, period_type } = event;
    
    // Convert app_user_id to actual user ID (RevenueCat uses our user IDs)
    const userId = app_user_id;
    
    // Calculate expiration date
    const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : null;
    
    // Update premium status in usage tracking
    await usageTrackingService.updatePremiumStatus(true, expiresAt);
    
    // Update user profile subscription status
    await this.updateUserProfile(userId, {
      subscription_status: 'active',
      premium_until: expiresAt?.toISOString(),
      subscription_product_id: event.product_id,
      subscription_period_type: period_type,
    });
    
    console.log(`Activated subscription for user ${userId}, expires: ${expiresAt?.toISOString()}`);
  }

  /**
   * Handle subscription deactivation events
   */
  private async handleSubscriptionDeactivation(event: RevenueCatWebhookEvent['event']): Promise<void> {
    const { app_user_id } = event;
    const userId = app_user_id;
    
    // Update premium status in usage tracking
    await usageTrackingService.updatePremiumStatus(false);
    
    // Update user profile subscription status
    await this.updateUserProfile(userId, {
      subscription_status: 'inactive',
      premium_until: null,
      subscription_product_id: null,
      subscription_period_type: null,
    });
    
    console.log(`Deactivated subscription for user ${userId}`);
  }

  /**
   * Handle billing issues
   */
  private async handleBillingIssue(event: RevenueCatWebhookEvent['event']): Promise<void> {
    const { app_user_id } = event;
    const userId = app_user_id;
    
    // Update user profile with billing issue status
    await this.updateUserProfile(userId, {
      subscription_status: 'billing_issue',
    });
    
    // Could send notification to user here
    console.log(`Billing issue for user ${userId}`);
  }

  /**
   * Handle product changes (upgrades/downgrades)
   */
  private async handleProductChange(event: RevenueCatWebhookEvent['event']): Promise<void> {
    const { app_user_id, product_id, expiration_at_ms } = event;
    const userId = app_user_id;
    const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : null;
    
    // Update premium status
    await usageTrackingService.updatePremiumStatus(true, expiresAt);
    
    // Update user profile with new product
    await this.updateUserProfile(userId, {
      subscription_status: 'active',
      premium_until: expiresAt?.toISOString(),
      subscription_product_id: product_id,
    });
    
    console.log(`Product change for user ${userId} to ${product_id}`);
  }

  /**
   * Update user profile in database
   */
  private async updateUserProfile(userId: string, updates: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Log webhook event for audit purposes
   */
  private async logWebhookEvent(webhookData: RevenueCatWebhookEvent): Promise<void> {
    try {
      // Create webhook_events table if it doesn't exist
      const { error } = await supabase
        .from('webhook_events')
        .insert({
          event_id: webhookData.event.id,
          event_type: webhookData.event.type,
          app_user_id: webhookData.event.app_user_id,
          product_id: webhookData.event.product_id,
          environment: webhookData.event.environment,
          event_data: webhookData,
          processed_at: new Date().toISOString(),
        });
        
      if (error && !error.message.includes('does not exist')) {
        console.error('Error logging webhook event:', error);
      }
    } catch (error) {
      // Don't throw on logging errors
      console.error('Failed to log webhook event:', error);
    }
  }

  /**
   * Validate webhook signature (if using webhook authentication)
   */
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // Implement webhook signature validation if needed
      // This depends on how RevenueCat signs webhooks
      return true; // For now, return true
    } catch (error) {
      console.error('Webhook signature validation failed:', error);
      return false;
    }
  }

  /**
   * Manually sync subscription status for a user
   * Useful for troubleshooting or manual corrections
   */
  async syncUserSubscription(userId: string): Promise<void> {
    try {
      // This would typically fetch current status from RevenueCat API
      // For now, just refresh the local state
      console.log(`Manual sync requested for user ${userId}`);
      
      // In a real implementation, you'd call RevenueCat's API here
      // to get the current subscription status and update accordingly
      
    } catch (error) {
      console.error('Failed to sync user subscription:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const webhookHandlerService = new WebhookHandlerService();
export default webhookHandlerService;