/**
 * Usage Tracking Service
 * 
 * Handles subscription limits and usage tracking for free/premium users.
 * Interfaces with the usage_tracking database table and functions.
 */

import { supabase } from './supabase';

export interface UsageData {
  is_premium: boolean;
  premium_until: string | null;
  week_start_date: string;
  recipe_generations: {
    used: number;
    limit: number;
    remaining: number;
    can_use: boolean;
  };
  grocery_lists: {
    used: number;
    limit: number;
    remaining: number;
    can_use: boolean;
  };
}

export type ActionType = 'recipe_generation' | 'grocery_list';

class UsageTrackingService {
  /**
   * Get current usage summary for the authenticated user
   */
  async getUserUsageSummary(): Promise<UsageData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_user_usage_summary', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching usage summary:', error);
        throw error;
      }

      return data as UsageData;
    } catch (error) {
      console.error('Usage tracking service error:', error);
      return null;
    }
  }

  /**
   * Check if user can perform a specific action
   */
  async canUserPerformAction(actionType: ActionType): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase.rpc('can_user_perform_action', {
        p_user_id: user.id,
        p_action_type: actionType
      });

      if (error) {
        console.error('Error checking user action capability:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Error checking user action capability:', error);
      return false;
    }
  }

  /**
   * Increment usage counter for a specific action
   * Returns true if successful, false if limit reached
   */
  async incrementUsageCounter(actionType: ActionType): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase.rpc('increment_usage_counter', {
        p_user_id: user.id,
        p_action_type: actionType
      });

      if (error) {
        console.error('Error incrementing usage counter:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Error incrementing usage counter:', error);
      return false;
    }
  }

  /**
   * Update premium status for user
   */
  async updatePremiumStatus(isPremium: boolean, premiumUntil?: Date): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase.rpc('update_premium_status', {
        p_user_id: user.id,
        p_is_premium: isPremium,
        p_premium_until: premiumUntil?.toISOString() || null
      });

      if (error) {
        console.error('Error updating premium status:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Error updating premium status:', error);
      return false;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  async isPremiumUser(): Promise<boolean> {
    const usageData = await this.getUserUsageSummary();
    
    if (!usageData) {
      return false;
    }

    // User is premium if:
    // 1. is_premium is true AND
    // 2. premium_until is null (never expires) OR premium_until is in the future
    return usageData.is_premium && (
      !usageData.premium_until || 
      new Date(usageData.premium_until) > new Date()
    );
  }

  /**
   * Get remaining usage for a specific action type
   */
  async getRemainingUsage(actionType: ActionType): Promise<number> {
    const usageData = await this.getUserUsageSummary();
    
    if (!usageData) {
      return 0;
    }

    if (actionType === 'recipe_generation') {
      return usageData.recipe_generations.remaining;
    } else if (actionType === 'grocery_list') {
      return usageData.grocery_lists.remaining;
    }

    return 0;
  }

  /**
   * Get usage display text for UI
   */
  async getUsageDisplayText(actionType: ActionType): Promise<string> {
    const usageData = await this.getUserUsageSummary();
    
    if (!usageData) {
      return '';
    }

    if (usageData.is_premium) {
      return 'Unlimited';
    }

    const actionData = actionType === 'recipe_generation' 
      ? usageData.recipe_generations 
      : usageData.grocery_lists;

    return `${actionData.remaining} left this week`;
  }

  /**
   * Format premium expiry date for display
   */
  formatPremiumExpiry(premiumUntil: string | null): string {
    if (!premiumUntil) {
      return 'Never expires';
    }

    const expiryDate = new Date(premiumUntil);
    const now = new Date();

    if (expiryDate <= now) {
      return 'Expired';
    }

    return `Expires ${expiryDate.toLocaleDateString()}`;
  }

  /**
   * Get days until premium expires
   */
  getDaysUntilPremiumExpiry(premiumUntil: string | null): number | null {
    if (!premiumUntil) {
      return null; // Never expires
    }

    const expiryDate = new Date(premiumUntil);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Check if premium is expiring soon (within 7 days)
   */
  async isPremiumExpiringSoon(): Promise<boolean> {
    const usageData = await this.getUserUsageSummary();
    
    if (!usageData || !usageData.is_premium || !usageData.premium_until) {
      return false;
    }

    const daysUntilExpiry = this.getDaysUntilPremiumExpiry(usageData.premium_until);
    return daysUntilExpiry !== null && daysUntilExpiry <= 7;
  }
}

// Export singleton instance
export const usageTrackingService = new UsageTrackingService();
export default usageTrackingService;