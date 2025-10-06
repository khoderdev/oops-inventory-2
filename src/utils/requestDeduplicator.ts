/**
 * Request Deduplicator with Multi-Layer Caching
 * Prevents duplicate API calls and implements intelligent caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestOptions {
  cacheDuration?: number;
  forceRefresh?: boolean;
  staleWhileRevalidate?: boolean;
}

export class RequestDeduplicator {
  private inFlightRequests = new Map<string, Promise<any>>();
  private memoryCache = new Map<string, CacheEntry<any>>();
  private sessionStoragePrefix = 'pos_cache_';

  /**
   * Deduplicate and cache API requests
   */
  async dedupe<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      cacheDuration = 0,
      forceRefresh = false,
      staleWhileRevalidate = false
    } = options;

    // Force refresh bypasses all caches
    if (forceRefresh) {
      return this.fetchAndCache(key, fetcher, cacheDuration);
    }

    // Check memory cache first
    const memoryCached = this.getFromMemoryCache<T>(key);
    if (memoryCached !== null) {
      console.log(`✅ [RequestDeduplicator] Memory cache HIT for: ${key}`);
      
      // If stale-while-revalidate, return cached and fetch in background
      if (staleWhileRevalidate && this.isCacheStale(key)) {
        console.log(`🔄 [RequestDeduplicator] Revalidating stale cache for: ${key}`);
        this.fetchAndCache(key, fetcher, cacheDuration).catch(err => {
          console.error(`❌ [RequestDeduplicator] Background revalidation failed for ${key}:`, err);
        });
      }
      
      return memoryCached;
    }

    // Check session storage cache
    const sessionCached = this.getFromSessionStorage<T>(key);
    if (sessionCached !== null) {
      console.log(`✅ [RequestDeduplicator] SessionStorage cache HIT for: ${key}`);
      // Restore to memory cache
      this.memoryCache.set(key, {
        data: sessionCached,
        timestamp: Date.now(),
        expiresAt: Date.now() + cacheDuration
      });
      return sessionCached;
    }

    // Check if request is already in-flight
    if (this.inFlightRequests.has(key)) {
      console.log(`⏳ [RequestDeduplicator] Request already in-flight, waiting: ${key}`);
      return this.inFlightRequests.get(key)!;
    }

    // Fetch fresh data
    return this.fetchAndCache(key, fetcher, cacheDuration);
  }

  /**
   * Fetch data and update all cache layers
   */
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheDuration: number
  ): Promise<T> {
    console.log(`🌐 [RequestDeduplicator] Fetching fresh data for: ${key}`);

    const promise = fetcher()
      .then(data => {
        const now = Date.now();
        const cacheEntry: CacheEntry<T> = {
          data,
          timestamp: now,
          expiresAt: now + cacheDuration
        };

        // Update memory cache
        if (cacheDuration > 0) {
          this.memoryCache.set(key, cacheEntry);
          
          // Update session storage cache
          this.saveToSessionStorage(key, cacheEntry);
        }

        console.log(`✅ [RequestDeduplicator] Cached data for: ${key} (${cacheDuration}ms)`);
        return data;
      })
      .catch(error => {
        console.error(`❌ [RequestDeduplicator] Fetch failed for ${key}:`, error);
        throw error;
      })
      .finally(() => {
        this.inFlightRequests.delete(key);
      });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  /**
   * Get data from memory cache
   */
  private getFromMemoryCache<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      console.log(`⏰ [RequestDeduplicator] Memory cache EXPIRED for: ${key}`);
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Check if cache is stale (for stale-while-revalidate)
   */
  private isCacheStale(key: string): boolean {
    const cached = this.memoryCache.get(key);
    if (!cached) return true;
    
    const now = Date.now();
    const age = now - cached.timestamp;
    const ttl = cached.expiresAt - cached.timestamp;
    
    // Consider stale if older than 50% of TTL
    return age > ttl * 0.5;
  }

  /**
   * Get data from session storage
   */
  private getFromSessionStorage<T>(key: string): T | null {
    try {
      const storageKey = this.sessionStoragePrefix + key;
      const cached = sessionStorage.getItem(storageKey);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      if (now > entry.expiresAt) {
        console.log(`⏰ [RequestDeduplicator] SessionStorage cache EXPIRED for: ${key}`);
        sessionStorage.removeItem(storageKey);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`❌ [RequestDeduplicator] SessionStorage read error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Save data to session storage
   */
  private saveToSessionStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      const storageKey = this.sessionStoragePrefix + key;
      sessionStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      // Session storage might be full or disabled
      console.warn(`⚠️ [RequestDeduplicator] SessionStorage write error for ${key}:`, error);
    }
  }

  /**
   * Clear cache for specific key or all keys
   */
  clearCache(key?: string): void {
    if (key) {
      console.log(`🗑️ [RequestDeduplicator] Clearing cache for: ${key}`);
      this.memoryCache.delete(key);
      
      try {
        const storageKey = this.sessionStoragePrefix + key;
        sessionStorage.removeItem(storageKey);
      } catch (error) {
        console.warn(`⚠️ [RequestDeduplicator] SessionStorage clear error:`, error);
      }
    } else {
      console.log(`🗑️ [RequestDeduplicator] Clearing ALL caches`);
      this.memoryCache.clear();
      
      try {
        // Clear all POS cache entries from session storage
        const keys = Object.keys(sessionStorage);
        keys.forEach(k => {
          if (k.startsWith(this.sessionStoragePrefix)) {
            sessionStorage.removeItem(k);
          }
        });
      } catch (error) {
        console.warn(`⚠️ [RequestDeduplicator] SessionStorage clear error:`, error);
      }
    }
  }

  /**
   * Invalidate cache (mark as expired without deleting)
   */
  invalidateCache(key: string): void {
    const cached = this.memoryCache.get(key);
    if (cached) {
      cached.expiresAt = 0; // Mark as expired
      console.log(`⚠️ [RequestDeduplicator] Invalidated cache for: ${key}`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memorySize: number;
    inFlightCount: number;
    keys: string[];
  } {
    return {
      memorySize: this.memoryCache.size,
      inFlightCount: this.inFlightRequests.size,
      keys: Array.from(this.memoryCache.keys())
    };
  }

  /**
   * Prefetch data (fetch and cache without returning)
   */
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheDuration: number
  ): Promise<void> {
    console.log(`🔮 [RequestDeduplicator] Prefetching: ${key}`);
    await this.dedupe(key, fetcher, { cacheDuration });
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Cache duration constants
export const CACHE_DURATIONS = {
  MENU_ITEMS: 5 * 60 * 1000,      // 5 minutes (rarely changes)
  CATEGORIES: 10 * 60 * 1000,     // 10 minutes (rarely changes)
  TABLES: 2 * 60 * 1000,          // 2 minutes (changes moderately)
  ORDERS: 30 * 1000,              // 30 seconds (changes frequently)
  DAY_OPERATIONS: 5 * 60 * 1000,  // 5 minutes (changes rarely)
  USER_STATS: 2 * 60 * 1000,      // 2 minutes (changes moderately)
  ACTIVITIES: 1 * 60 * 1000       // 1 minute (changes moderately)
} as const;
