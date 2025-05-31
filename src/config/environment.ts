// src/config/environment.ts - REPLACE EXISTING FILE
import Constants from "expo-constants";

interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
  appVersion: string;
  buildNumber: string;
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  // Get values from environment variables (set in .env)
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Validate required environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`
      Missing required environment variables:
      - EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}
      - EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓" : "✗"}
      
      Please check your .env file and ensure all variables are set.
    `);
  }

  const isDevelopment = __DEV__;
  const isProduction = !__DEV__;

  return {
    supabaseUrl,
    supabaseAnonKey,
    isDevelopment,
    isProduction,
    appVersion: Constants.expoConfig?.version || "1.0.0",
    buildNumber:
      typeof Constants.expoConfig?.runtimeVersion === "string"
        ? Constants.expoConfig.runtimeVersion
        : "1",
  };
};

// Export singleton instance
export const environmentConfig = getEnvironmentConfig();

// Helper functions for common checks
export const isDevMode = () => environmentConfig.isDevelopment;
export const isProdMode = () => environmentConfig.isProduction;

// Validation function to call on app startup
export const validateEnvironment = (): boolean => {
  try {
    getEnvironmentConfig();
    console.log("✅ Environment configuration valid");
    return true;
  } catch (error) {
    console.error("❌ Environment configuration error:", error);
    return false;
  }
};

// Development helpers
if (environmentConfig.isDevelopment) {
  console.log("🔧 Development mode - Environment config:", {
    supabaseUrl: environmentConfig.supabaseUrl,
    supabaseAnonKey: environmentConfig.supabaseAnonKey.substring(0, 20) + "...",
    version: environmentConfig.appVersion,
  });
}
