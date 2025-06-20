/**
 * Feature Flags Configuration
 * 
 * Controls which features are enabled/disabled in the app
 */

export interface FeatureFlags {
  // Payment and subscription features
  paymentSystem: boolean;
  usageTracking: boolean;
  premiumFeatures: boolean;
  upgradePrompts: boolean;
  
  // Future features (for reference)
  voiceAssistant: boolean;
  socialFeatures: boolean;
  aiPersonalization: boolean;
}

// Main feature flag configuration
export const FEATURE_FLAGS: FeatureFlags = {
  // Payment system - DISABLED for now (will enable when ready for App Store)
  paymentSystem: false,
  usageTracking: false, 
  premiumFeatures: false,
  upgradePrompts: false,
  
  // Other features
  voiceAssistant: false,
  socialFeatures: false,
  aiPersonalization: true, // Keep existing AI features enabled
};

// Helper functions
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[feature];
};

export const enableFeature = (feature: keyof FeatureFlags): void => {
  FEATURE_FLAGS[feature] = true;
};

export const disableFeature = (feature: keyof FeatureFlags): void => {
  FEATURE_FLAGS[feature] = false;
};

// Development override (for testing payment features in development)
export const DEV_OVERRIDES: Partial<FeatureFlags> = {
  // Uncomment these to test payment features in development:
  // paymentSystem: true,
  // usageTracking: true,
  // premiumFeatures: true,
  // upgradePrompts: true,
};

// Apply dev overrides if in development
if (__DEV__) {
  Object.assign(FEATURE_FLAGS, DEV_OVERRIDES);
}

export default FEATURE_FLAGS;