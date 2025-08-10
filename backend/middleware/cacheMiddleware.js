/**
 * Caching middleware for API responses
 * Implements in-memory caching with TTL for frequently accessed data
 */

const cache = new Map();
const cacheTimestamps = new Map();

/**
 * Simple in-memory cache middleware
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {function} keyGenerator - Function to generate cache key from request
 * @returns {function} Express middleware function
 */
export const cacheMiddleware = (ttlSeconds = 300, keyGenerator = null) => {
  return (req, res, next) => {
    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    // Check if cached data exists and is still valid
    const cachedData = cache.get(cacheKey);
    const cacheTime = cacheTimestamps.get(cacheKey);
    
    if (cachedData && cacheTime && (Date.now() - cacheTime) < (ttlSeconds * 1000)) {
      return res.json(cachedData);
    }

    // Store original res.json method
    const originalJson = res.json;

    // Override res.json to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(cacheKey, data);
        cacheTimestamps.set(cacheKey, Date.now());
        
        // Clean up old cache entries periodically
        if (cache.size > 1000) {
          cleanupCache();
        }
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Clear cache entries older than their TTL
 */
const cleanupCache = () => {
  const now = Date.now();
  const maxAge = 3600 * 1000; // 1 hour max age for cleanup
  
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > maxAge) {
      cache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
};

/**
 * Clear specific cache entries by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
export const clearCacheByPattern = (pattern) => {
  const regex = new RegExp(pattern);
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.clear();
  cacheTimestamps.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    memoryUsage: process.memoryUsage()
  };
};
