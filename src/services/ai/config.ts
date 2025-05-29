// src/services/ai/config.ts
import * as SecureStore from "expo-secure-store";

const GEMINI_API_KEY = "GEMINI_API_KEY";

export class APIKeyManager {
  static async setGeminiKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(GEMINI_API_KEY, key);
  }

  static async getGeminiKey(): Promise<string | null> {
    return await SecureStore.getItemAsync(GEMINI_API_KEY);
  }

  static async hasGeminiKey(): Promise<boolean> {
    const key = await SecureStore.getItemAsync(GEMINI_API_KEY);
    return !!key;
  }

  static async removeGeminiKey(): Promise<void> {
    await SecureStore.deleteItemAsync(GEMINI_API_KEY);
  }
}
