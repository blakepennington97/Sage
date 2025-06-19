// src/services/responseCache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CachedResponse {
  content: string;
  timestamp: Date;
  profileHash: string;
}

const CACHE_KEY = "ai_response_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class ResponseCacheService {
  static async getCachedResponse(
    request: string,
    profileHash: string
  ): Promise<string | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const stored = await AsyncStorage.getItem(`${CACHE_KEY}_${cacheKey}`);

      if (!stored) return null;

      const cached: CachedResponse = JSON.parse(stored);
      cached.timestamp = new Date(cached.timestamp);

      // Check if cache is expired
      if (Date.now() - cached.timestamp.getTime() > CACHE_DURATION) {
        await this.deleteCachedResponse(request);
        return null;
      }

      // Check if profile has changed significantly
      if (cached.profileHash !== profileHash) {
        return null;
      }

      return cached.content;
    } catch (error) {
      console.warn("Cache retrieval failed:", error);
      return null;
    }
  }

  static async setCachedResponse(
    request: string,
    content: string,
    profileHash: string
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cached: CachedResponse = {
        content,
        timestamp: new Date(),
        profileHash,
      };

      await AsyncStorage.setItem(
        `${CACHE_KEY}_${cacheKey}`,
        JSON.stringify(cached)
      );
    } catch (error) {
      console.warn("Cache storage failed:", error);
    }
  }

  static async deleteCachedResponse(request: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      await AsyncStorage.removeItem(`${CACHE_KEY}_${cacheKey}`);
    } catch (error) {
      console.warn("Cache deletion failed:", error);
    }
  }

  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn("Cache clearing failed:", error);
    }
  }

  private static generateCacheKey(request: string): string {
    // Simple hash for cache key
    return request
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);
  }

  static generateProfileHash(profile: any): string {
    // Create hash of key profile elements that affect AI responses
    const key = `${profile.skillLevel}_${profile.stoveType}_${profile.hasOven}_${profile.tools?.length || 0}`;
    return key;
  }
}
