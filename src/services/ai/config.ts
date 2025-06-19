// src/services/ai/config.ts - REPLACE EXISTING FILE
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";

const GEMINI_API_KEY = "gemini_api_key";
const API_KEY_CACHE_KEY = "cached_gemini_api_key";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export class APIKeyManager {
  // Get Gemini API key from Supabase (centralized) or fallback to local storage
  static async getGeminiKey(): Promise<string | null> {
    try {
      // First, try to get from Supabase (centralized API key management)
      const supabaseKey = await this.getKeyFromSupabase();
      if (supabaseKey) {
        return supabaseKey;
      }

      // Fallback to local storage (user's own API key)
      console.log("No centralized API key found, checking local storage...");
      
      // Try secure store first (more secure)
      const secureKey = await SecureStore.getItemAsync(GEMINI_API_KEY);
      if (secureKey) return secureKey;

      // Fallback to AsyncStorage for compatibility
      const asyncKey = await AsyncStorage.getItem(GEMINI_API_KEY);
      if (asyncKey) {
        // Migrate to secure store
        await SecureStore.setItemAsync(GEMINI_API_KEY, asyncKey);
        await AsyncStorage.removeItem(GEMINI_API_KEY);
        return asyncKey;
      }

      console.log("No API key found in any storage location");
      return null;
    } catch (error) {
      console.error("Error getting Gemini API key:", error);
      return null;
    }
  }

  // Get API key from Supabase with caching
  private static async getKeyFromSupabase(): Promise<string | null> {
    try {
      // Check cache first
      const cached = await this.getCachedKey();
      if (cached) {
        return cached;
      }

      console.log("Fetching API key from Supabase...");
      
      // Fetch from Supabase app_config table
      const { data, error } = await supabase
        .from('app_config')
        .select('config_value')
        .eq('config_key', 'gemini_api_key')
        .eq('is_active', true)
        .single();

      if (error) {
        // Handle case where migration hasn't been run yet
        if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('app_config')) {
          console.log("App config table not found - migration may not be run yet");
        } else {
          console.log("No centralized API key configured in Supabase:", error.message);
        }
        return null;
      }

      if (data?.config_value) {
        // Cache the key
        await this.cacheKey(data.config_value);
        console.log("✅ API key fetched from Supabase and cached");
        return data.config_value;
      }

      return null;
    } catch (error) {
      console.error("Error fetching API key from Supabase:", error);
      return null;
    }
  }

  // Cache API key locally with timestamp
  private static async cacheKey(apiKey: string): Promise<void> {
    try {
      const cacheData = {
        key: apiKey,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(API_KEY_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching API key:", error);
    }
  }

  // Get cached API key if still valid
  private static async getCachedKey(): Promise<string | null> {
    try {
      const cached = await AsyncStorage.getItem(API_KEY_CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cacheData.timestamp < CACHE_DURATION) {
        return cacheData.key;
      }

      // Cache expired, remove it
      await AsyncStorage.removeItem(API_KEY_CACHE_KEY);
      return null;
    } catch (error) {
      console.error("Error reading cached API key:", error);
      return null;
    }
  }

  // Clear API key cache (useful for testing or when API key changes)
  static async clearKeyCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(API_KEY_CACHE_KEY);
      console.log("✅ API key cache cleared");
    } catch (error) {
      console.error("Error clearing API key cache:", error);
    }
  }

  // Set Gemini API key in secure storage
  static async setGeminiKey(apiKey: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(GEMINI_API_KEY, apiKey);
      console.log("✅ Gemini API key stored securely");
    } catch (error) {
      console.error("Error storing Gemini API key:", error);
      // Fallback to AsyncStorage if SecureStore fails
      try {
        await AsyncStorage.setItem(GEMINI_API_KEY, apiKey);
        console.log("⚠️ Gemini API key stored in AsyncStorage (less secure)");
      } catch (fallbackError) {
        console.error(
          "Error storing API key in fallback storage:",
          fallbackError
        );
        throw fallbackError;
      }
    }
  }

  // Check if Gemini API key exists (either centralized or local)
  static async hasGeminiKey(): Promise<boolean> {
    const key = await this.getGeminiKey();
    return !!key;
  }

  // Check if centralized API key is available from Supabase
  static async hasCentralizedKey(): Promise<boolean> {
    const key = await this.getKeyFromSupabase();
    return !!key;
  }

  // Remove Gemini API key
  static async removeGeminiKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(GEMINI_API_KEY);
      await AsyncStorage.removeItem(GEMINI_API_KEY); // Clean up any legacy storage
      console.log("✅ Gemini API key removed");
    } catch (error) {
      console.error("Error removing Gemini API key:", error);
    }
  }

  // Validate API key format (basic check)
  static validateGeminiKey(apiKey: string): boolean {
    return (
      typeof apiKey === "string" &&
      apiKey.length > 20 &&
      apiKey.startsWith("AIza")
    );
  }
}

// Remote configuration interface for future use
interface RemoteConfig {
  maxFreeRecipesPerDay: number;
  enablePremiumFeatures: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  geminiRateLimit: number;
}

export class ConfigService {
  private static config: RemoteConfig | null = null;
  private static lastFetch = 0;
  private static CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static async getConfig(): Promise<RemoteConfig> {
    const now = Date.now();

    if (this.config && now - this.lastFetch < this.CACHE_DURATION) {
      return this.config;
    }

    // For now, return default config
    // In the future, this will fetch from your backend
    const defaultConfig: RemoteConfig = {
      maxFreeRecipesPerDay: 5,
      enablePremiumFeatures: true,
      maintenanceMode: false,
      supportEmail: "support@sage-app.com",
      geminiRateLimit: 15,
    };

    this.config = defaultConfig;
    this.lastFetch = now;

    return defaultConfig;
  }
}
