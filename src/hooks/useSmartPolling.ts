/**
 * Smart Polling Hook with Exponential Backoff
 * Automatically adjusts polling interval based on data changes
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface SmartPollingOptions {
  minInterval?: number;      // Minimum polling interval (default: 30s)
  maxInterval?: number;      // Maximum polling interval (default: 5min)
  enabled?: boolean;         // Enable/disable polling
  onDataChange?: () => void; // Callback when data changes
}

export function useSmartPolling<T>(
  fetchFn: () => Promise<T>,
  options: SmartPollingOptions = {}
) {
  const {
    minInterval = 30000,      // 30 seconds
    maxInterval = 300000,     // 5 minutes
    enabled = true,
    onDataChange
  } = options;

  const [interval, setInterval] = useState(minInterval);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const lastDataRef = useRef<string | null>(null);
  const consecutiveNoChanges = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const newData = await fetchFn();
      const newDataStr = JSON.stringify(newData);
      
      // Check if data changed
      if (lastDataRef.current !== null && newDataStr !== lastDataRef.current) {
        console.log('📊 [SmartPolling] Data changed, decreasing interval');
        
        // Data changed - decrease interval for more frequent updates
        setInterval(prev => Math.max(minInterval, prev / 1.5));
        consecutiveNoChanges.current = 0;
        
        if (onDataChange) {
          onDataChange();
        }
      } else if (lastDataRef.current !== null) {
        // No change - increase interval
        consecutiveNoChanges.current += 1;
        
        if (consecutiveNoChanges.current >= 3) {
          console.log('📊 [SmartPolling] No changes detected, increasing interval');
          setInterval(prev => Math.min(maxInterval, prev * 1.5));
        }
      }
      
      lastDataRef.current = newDataStr;
      setData(newData);
      
    } catch (err) {
      console.error('❌ [SmartPolling] Poll failed:', err);
      setError(err as Error);
      
      // On error, increase interval to reduce load
      setInterval(prev => Math.min(maxInterval, prev * 2));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetchFn, minInterval, maxInterval, onDataChange]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      poll();
    }
  }, [enabled]); // Only run on mount or when enabled changes

  // Set up polling interval
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    console.log(`⏱️ [SmartPolling] Setting interval to ${interval}ms`);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(poll, interval) as any;

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [interval, enabled, poll]);

  const refresh = useCallback(() => {
    poll();
  }, [poll]);

  return {
    data,
    isLoading,
    error,
    refresh,
    currentInterval: interval
  };
}

/**
 * Conditional Polling Hook
 * Only polls when a condition is met
 */
export function useConditionalPolling<T>(
  fetchFn: () => Promise<T>,
  condition: boolean,
  interval: number = 30000
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    if (!condition) return;

    try {
      setIsLoading(true);
      const newData = await fetchFn();
      setData(newData);
    } catch (error) {
      console.error('❌ [ConditionalPolling] Poll failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [condition, fetchFn]);

  useEffect(() => {
    if (!condition) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Initial fetch
    poll();

    // Set up interval
    timerRef.current = setInterval(poll, interval) as any;

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [condition, interval, poll]);

  return { data, isLoading };
}
