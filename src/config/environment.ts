import Constants from "expo-constants";

interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
  appVersion: string;
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`
      Missing required environment variables:
      - EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}
      - EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓" : "✗"}
      Please check your .env file and ensure all variables are set.
    `);
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    isDevelopment: __DEV__,
    appVersion: Constants.expoConfig?.version || "1.0.0",
  };
};

export const environmentConfig = getEnvironmentConfig();
