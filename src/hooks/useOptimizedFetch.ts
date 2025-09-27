import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface FetchOptions {
  cacheDuration?: number; // Cache duration in milliseconds
  dedupingInterval?: number; // Minimum time between identical requests in milliseconds
  retryCount?: number; // Number of retries on failure
  retryDelay?: number; // Delay between retries in milliseconds
  onError?: (error: Error) => void; // Error callback
}

const DEFAULT_CACHE_DURATION = 60000; // 1 minute
const DEFAULT_DEDUPING_INTERVAL = 2000; // 2 seconds
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

// Global cache shared across hook instances
const globalCache = new Map<string, CacheItem<any>>();
// Track in-flight requests to prevent duplicate requests
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Custom hook for optimized data fetching with caching, deduping, and retries
 */
export function useOptimizedFetch<T = any>(
  url: string | null,
  options: FetchOptions = {}
) {
  const {
    cacheDuration = DEFAULT_CACHE_DURATION,
    dedupingInterval = DEFAULT_DEDUPING_INTERVAL,
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Track last fetch time to implement deduping
  const lastFetchTimeRef = useRef<number>(0);

  // Function to fetch data with retries
  const fetchWithRetry = useCallback(async (
    url: string, 
    remainingRetries: number
  ): Promise<T> => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      if (remainingRetries > 0) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchWithRetry(url, remainingRetries - 1);
      }
      throw err;
    }
  }, [retryDelay]);

  // Main fetch function
  const fetchData = useCallback(async () => {
    if (!url) return;

    const now = Date.now();
    
    // Check if we should dedupe this request
    if (now - lastFetchTimeRef.current < dedupingInterval) {
      return;
    }
    
    // Update last fetch time
    lastFetchTimeRef.current = now;
    
    // Check cache first
    const cachedItem = globalCache.get(url);
    if (cachedItem && (now - cachedItem.timestamp < cacheDuration)) {
      setData(cachedItem.data);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Check if this request is already in flight
    if (inFlightRequests.has(url)) {
      try {
        const data = await inFlightRequests.get(url);
        setData(data);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
        if (onError) onError(err as Error);
      }
      return;
    }
    
    // Start a new request
    setIsLoading(true);
    
    // Create the promise for this request
    const requestPromise = fetchWithRetry(url, retryCount);
    
    // Store the promise to dedupe in-flight requests
    inFlightRequests.set(url, requestPromise);
    
    try {
      const fetchedData = await requestPromise;
      
      // Update cache
      globalCache.set(url, {
        data: fetchedData,
        timestamp: Date.now()
      });
      
      setData(fetchedData);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      if (onError) onError(err as Error);
    } finally {
      // Remove from in-flight requests
      inFlightRequests.delete(url);
    }
  }, [url, cacheDuration, dedupingInterval, fetchWithRetry, retryCount, onError]);

  // Force refresh function
  const refresh = useCallback(() => {
    if (url) {
      // Remove from cache to force a fresh fetch
      globalCache.delete(url);
      fetchData();
    }
  }, [url, fetchData]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh };
}

// Helper function to prefetch and cache data
export function prefetchData(url: string, options: FetchOptions = {}): Promise<any> {
  const {
    cacheDuration = DEFAULT_CACHE_DURATION,
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY
  } = options;
  
  // If already in cache and not expired, return cached data
  const now = Date.now();
  const cachedItem = globalCache.get(url);
  if (cachedItem && (now - cachedItem.timestamp < cacheDuration)) {
    return Promise.resolve(cachedItem.data);
  }
  
  // If request is in flight, return that promise
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }
  
  // Helper function for retries
  const fetchWithRetry = async (
    remainingRetries: number
  ): Promise<any> => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update cache
      globalCache.set(url, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (err) {
      if (remainingRetries > 0) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchWithRetry(remainingRetries - 1);
      }
      throw err;
    }
  };
  
  // Create and store the promise
  const requestPromise = fetchWithRetry(retryCount);
  inFlightRequests.set(url, requestPromise);
  
  // Clean up in-flight tracking when done
  requestPromise
    .catch(() => {})
    .finally(() => {
      inFlightRequests.delete(url);
    });
  
  return requestPromise;
}

// Helper to clear the entire cache
export function clearCache(): void {
  globalCache.clear();
}

// Helper to clear specific cache entries by URL pattern
export function clearCacheByPattern(pattern: RegExp): void {
  for (const url of globalCache.keys()) {
    if (pattern.test(url)) {
      globalCache.delete(url);
    }
  }
}
