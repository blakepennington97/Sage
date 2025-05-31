// src/services/ai/config.ts - REPLACE EXISTING FILE
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GEMINI_API_KEY = "gemini_api_key";

export class APIKeyManager {
  // Get Gemini API key from secure storage
  static async getGeminiKey(): Promise<string | null> {
    try {
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

      return null;
    } catch (error) {
      console.error("Error getting Gemini API key:", error);
      return null;
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

  // Check if Gemini API key exists
  static async hasGeminiKey(): Promise<boolean> {
    const key = await this.getGeminiKey();
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
