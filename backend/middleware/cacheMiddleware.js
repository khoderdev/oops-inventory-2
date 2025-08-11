const cache = new Map();
const cacheTimestamps = new Map();

export const cacheMiddleware = (ttlSeconds = 300, keyGenerator = null) => {
  return (req, res, next) => {
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    const cachedData = cache.get(cacheKey);
    const cacheTime = cacheTimestamps.get(cacheKey);
    
    if (cachedData && cacheTime && (Date.now() - cacheTime) < (ttlSeconds * 1000)) {
      return res.json(cachedData);
    }
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200) {
        cache.set(cacheKey, data);
        cacheTimestamps.set(cacheKey, Date.now());
        if (cache.size > 1000) {
          cleanupCache();
        }
      }
      return originalJson.call(this, data);
    };
    next();
  };
};


const cleanupCache = () => {
  const now = Date.now();
  const maxAge = 3600 * 1000;
  
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > maxAge) {
      cache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
};


export const clearCacheByPattern = (pattern) => {
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
};

export const clearAllCache = () => {
  cache.clear();
  cacheTimestamps.clear();
};

export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    memoryUsage: process.memoryUsage()
  };
};
