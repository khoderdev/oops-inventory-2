/**
 * POS LocalStorage Cache
 * Ultra-fast desktop app experience with persistent caching
 */

const CACHE_KEYS = {
  FOOD_ITEMS: 'pos_cache_food_items',
  BEVERAGE_ITEMS: 'pos_cache_beverage_items',
  MENU_CATEGORIES: 'pos_cache_menu_categories',
  BEVERAGE_CATEGORIES: 'pos_cache_beverage_categories',
  TABLES: 'pos_cache_tables',
  ORDERS: 'pos_cache_orders',
  LAST_UPDATE: 'pos_cache_last_update',
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export const posCache = {
  // Save to cache
  set<T>(key: string, data: T): void {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`💾 [POSCache] Saved ${key} to localStorage`);
    } catch (error) {
      console.error(`❌ [POSCache] Failed to save ${key}:`, error);
    }
  },

  // Get from cache
  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // Check if cache is still valid
      if (age > CACHE_DURATION) {
        console.log(`⏰ [POSCache] Cache expired for ${key} (${Math.round(age / 1000)}s old)`);
        this.remove(key);
        return null;
      }

      console.log(`✅ [POSCache] Loaded ${key} from localStorage (${Math.round(age / 1000)}s old)`);
      return cacheData.data;
    } catch (error) {
      console.error(`❌ [POSCache] Failed to load ${key}:`, error);
      return null;
    }
  },

  // Remove from cache
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  // Clear all cache
  clearAll(): void {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ [POSCache] Cleared all cache');
  },

  // Check if cache is fresh
  isFresh(key: string): boolean {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return false;

      const cacheData: CacheData<any> = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;
      return age < CACHE_DURATION;
    } catch {
      return false;
    }
  },

  // Get cache age in seconds
  getAge(key: string): number | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CacheData<any> = JSON.parse(cached);
      return Math.round((Date.now() - cacheData.timestamp) / 1000);
    } catch {
      return null;
    }
  },

  // Cache keys
  keys: CACHE_KEYS,
};
