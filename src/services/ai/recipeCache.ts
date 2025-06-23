import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecipeData } from "./gemini";

interface CachedRecipe {
  recipe: RecipeData;
  requestHash: string;
  userContext: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface RecipeRequest {
  prompt: string;
  userSkillLevel?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  kitchenTools?: string[];
  preferences?: string;
}

export class RecipeCacheService {
  private static readonly CACHE_KEY_PREFIX = "recipe_cache_";
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly MAX_CACHE_SIZE = 100; // Maximum number of cached recipes
  private static readonly SIMILARITY_THRESHOLD = 0.8; // Similarity threshold for cache hits

  /**
   * Generate a hash for a recipe request to enable intelligent caching
   */
  private static generateRequestHash(request: RecipeRequest): string {
    // Normalize the request for consistent hashing
    const normalized = {
      prompt: request.prompt.toLowerCase().trim(),
      skillLevel: request.userSkillLevel || '',
      restrictions: (request.dietaryRestrictions || []).sort().join(','),
      allergies: (request.allergies || []).sort().join(','),
      tools: (request.kitchenTools || []).sort().join(','),
      preferences: request.preferences || ''
    };

    // Create a simple hash
    const str = JSON.stringify(normalized);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate similarity between two recipe requests
   */
  private static calculateSimilarity(req1: RecipeRequest, req2: RecipeRequest): number {
    let score = 0;
    let totalFactors = 0;

    // Compare prompts using word overlap
    const words1 = req1.prompt.toLowerCase().split(/\s+/);
    const words2 = req2.prompt.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    const promptSimilarity = commonWords.length / Math.max(words1.length, words2.length);
    score += promptSimilarity * 0.4;
    totalFactors += 0.4;

    // Compare skill levels
    if (req1.userSkillLevel === req2.userSkillLevel) {
      score += 0.1;
    }
    totalFactors += 0.1;

    // Compare dietary restrictions
    const restrictions1 = new Set(req1.dietaryRestrictions || []);
    const restrictions2 = new Set(req2.dietaryRestrictions || []);
    const commonRestrictions = [...restrictions1].filter(r => restrictions2.has(r));
    const restrictionSimilarity = commonRestrictions.length / Math.max(restrictions1.size, restrictions2.size);
    score += restrictionSimilarity * 0.2;
    totalFactors += 0.2;

    // Compare allergies (important for safety)
    const allergies1 = new Set(req1.allergies || []);
    const allergies2 = new Set(req2.allergies || []);
    const commonAllergies = [...allergies1].filter(a => allergies2.has(a));
    const allergySimilarity = allergies1.size === allergies2.size && commonAllergies.length === allergies1.size ? 1 : 0;
    score += allergySimilarity * 0.2;
    totalFactors += 0.2;

    // Compare kitchen tools
    const tools1 = new Set(req1.kitchenTools || []);
    const tools2 = new Set(req2.kitchenTools || []);
    const commonTools = [...tools1].filter(t => tools2.has(t));
    const toolSimilarity = commonTools.length / Math.max(tools1.size, tools2.size);
    score += toolSimilarity * 0.1;
    totalFactors += 0.1;

    return totalFactors > 0 ? score / totalFactors : 0;
  }

  /**
   * Try to get a cached recipe that matches the request
   */
  static async getCachedRecipe(request: RecipeRequest): Promise<RecipeData | null> {
    try {
      const requestHash = this.generateRequestHash(request);
      
      // First, try exact hash match
      const exactMatch = await this.getExactCacheMatch(requestHash);
      if (exactMatch) {
        await this.updateCacheAccess(exactMatch.requestHash);
        console.log("✅ Recipe cache hit (exact match)");
        return exactMatch.recipe;
      }

      // If no exact match, try similarity matching
      const similarMatch = await this.getSimilarCacheMatch(request);
      if (similarMatch) {
        await this.updateCacheAccess(similarMatch.requestHash);
        console.log("✅ Recipe cache hit (similar match)");
        return similarMatch.recipe;
      }

      console.log("❌ Recipe cache miss");
      return null;
    } catch (error) {
      console.error("Error getting cached recipe:", error);
      return null;
    }
  }

  /**
   * Cache a recipe with the request that generated it
   */
  static async cacheRecipe(request: RecipeRequest, recipe: RecipeData): Promise<void> {
    try {
      const requestHash = this.generateRequestHash(request);
      const cacheKey = this.CACHE_KEY_PREFIX + requestHash;
      
      const cachedRecipe: CachedRecipe = {
        recipe,
        requestHash,
        userContext: JSON.stringify(request),
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now()
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedRecipe));
      
      // Clean up old cache entries if we're at the limit
      await this.cleanupCache();
      
      console.log("✅ Recipe cached with hash:", requestHash);
    } catch (error) {
      console.error("Error caching recipe:", error);
    }
  }

  /**
   * Get exact cache match by hash
   */
  private static async getExactCacheMatch(requestHash: string): Promise<CachedRecipe | null> {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + requestHash;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cachedRecipe: CachedRecipe = JSON.parse(cached);
      
      // Check if cache is still valid
      const now = Date.now();
      if (now - cachedRecipe.timestamp > this.CACHE_DURATION) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return cachedRecipe;
    } catch (error) {
      console.error("Error getting exact cache match:", error);
      return null;
    }
  }

  /**
   * Find similar cached recipes using similarity scoring
   */
  private static async getSimilarCacheMatch(request: RecipeRequest): Promise<CachedRecipe | null> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      let bestMatch: CachedRecipe | null = null;
      let bestSimilarity = 0;

      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (!cached) continue;

          const cachedRecipe: CachedRecipe = JSON.parse(cached);
          
          // Check if cache is still valid
          const now = Date.now();
          if (now - cachedRecipe.timestamp > this.CACHE_DURATION) {
            await AsyncStorage.removeItem(key);
            continue;
          }

          // Calculate similarity
          const cachedRequest: RecipeRequest = JSON.parse(cachedRecipe.userContext);
          const similarity = this.calculateSimilarity(request, cachedRequest);

          if (similarity > bestSimilarity && similarity >= this.SIMILARITY_THRESHOLD) {
            bestSimilarity = similarity;
            bestMatch = cachedRecipe;
          }
        } catch (error) {
          console.error("Error processing cached recipe:", error);
          // Remove corrupted cache entry
          await AsyncStorage.removeItem(key);
        }
      }

      return bestMatch;
    } catch (error) {
      console.error("Error finding similar cache match:", error);
      return null;
    }
  }

  /**
   * Update cache access statistics
   */
  private static async updateCacheAccess(requestHash: string): Promise<void> {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + requestHash;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const cachedRecipe: CachedRecipe = JSON.parse(cached);
        cachedRecipe.accessCount++;
        cachedRecipe.lastAccessed = Date.now();
        
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedRecipe));
      }
    } catch (error) {
      console.error("Error updating cache access:", error);
    }
  }

  /**
   * Clean up old cache entries to maintain size limit
   */
  private static async cleanupCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      if (cacheKeys.length <= this.MAX_CACHE_SIZE) return;

      // Get all cached recipes with their metadata
      const cachedRecipes: {key: string, recipe: CachedRecipe}[] = [];
      
      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const recipe = JSON.parse(cached);
            cachedRecipes.push({ key, recipe });
          }
        } catch (error) {
          // Remove corrupted entries
          await AsyncStorage.removeItem(key);
        }
      }

      // Sort by access pattern (least recently used with low access count first)
      cachedRecipes.sort((a, b) => {
        const scoreA = a.recipe.accessCount * (Date.now() - a.recipe.lastAccessed);
        const scoreB = b.recipe.accessCount * (Date.now() - b.recipe.lastAccessed);
        return scoreB - scoreA; // Higher score = keep longer
      });

      // Remove oldest entries to get back to limit
      const toRemove = cachedRecipes.length - this.MAX_CACHE_SIZE;
      for (let i = 0; i < toRemove; i++) {
        await AsyncStorage.removeItem(cachedRecipes[i].key);
      }

      console.log(`🧹 Cleaned up ${toRemove} old cache entries`);
    } catch (error) {
      console.error("Error cleaning up cache:", error);
    }
  }

  /**
   * Clear all cached recipes
   */
  static async clearCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      await AsyncStorage.multiRemove(cacheKeys);
      console.log("✅ Recipe cache cleared");
    } catch (error) {
      console.error("Error clearing recipe cache:", error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalCached: number;
    totalSize: string;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    mostAccessed: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      let totalSize = 0;
      let oldestTimestamp = Number.MAX_SAFE_INTEGER;
      let newestTimestamp = 0;
      let maxAccessCount = 0;

      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            totalSize += cached.length;
            const recipe: CachedRecipe = JSON.parse(cached);
            
            if (recipe.timestamp < oldestTimestamp) {
              oldestTimestamp = recipe.timestamp;
            }
            if (recipe.timestamp > newestTimestamp) {
              newestTimestamp = recipe.timestamp;
            }
            if (recipe.accessCount > maxAccessCount) {
              maxAccessCount = recipe.accessCount;
            }
          }
        } catch (error) {
          console.error("Error processing cache entry for stats:", error);
        }
      }

      return {
        totalCached: cacheKeys.length,
        totalSize: (totalSize / 1024).toFixed(2) + " KB",
        oldestEntry: oldestTimestamp !== Number.MAX_SAFE_INTEGER ? new Date(oldestTimestamp) : null,
        newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp) : null,
        mostAccessed: maxAccessCount
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        totalCached: 0,
        totalSize: "0 KB",
        oldestEntry: null,
        newestEntry: null,
        mostAccessed: 0
      };
    }
  }
}