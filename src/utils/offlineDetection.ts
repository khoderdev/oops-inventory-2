/**
 * Offline Detection Utility
 * 
 * Provides utilities for detecting offline status and handling offline data
 */

// Check if the browser is online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;
};

// Listen for online/offline events
export const setupOfflineDetection = (
  onOffline: () => void = () => {},
  onOnline: () => void = () => {}
): () => void => {
  const handleOffline = () => {
    console.log('🔴 Network connection lost - switching to offline mode');
    onOffline();
  };

  const handleOnline = () => {
    console.log('🟢 Network connection restored - syncing data');
    onOnline();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Return cleanup function
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }

  return () => {};
};

// Get cached data with fallback
export const getCachedData = <T>(key: string, defaultValue: T): T => {
  try {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return defaultValue;

    const parsed = JSON.parse(cachedData);
    
    // Check if data is stale (older than 24 hours)
    const timestamp = parsed.timestamp || 0;
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - timestamp > maxAge) {
      console.log(`⚠️ Cached data for ${key} is stale, using default value`);
      return defaultValue;
    }
    
    return parsed.data || defaultValue;
  } catch (e) {
    console.error(`Error retrieving cached data for ${key}:`, e);
    return defaultValue;
  }
};

// Save data to cache with timestamp
export const saveCachedData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  } catch (e) {
    console.error(`Error saving cached data for ${key}:`, e);
  }
};
