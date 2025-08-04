import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  prefetchAllInventoryAction,
  overallPrefetchStatusAtom,
  refreshInventoryDataAction,
  invalidateCacheAction,
  cacheMetadataAtom,
  CACHE_DURATION,
} from "@/store/prefetchAtoms";
import { usePrefetch } from "@/hooks/usePrefetch";

interface PrefetchContextValue {
  // Status
  isInitialized: boolean;
  isLoading: boolean;
  hasError: boolean;
  lastUpdated: Date | null;
  
  // Actions
  refreshAll: () => Promise<void>;
  refreshMaterials: () => Promise<void>;
  refreshStock: () => Promise<void>;
  refreshMenu: () => Promise<void>;
  invalidateAll: () => void;
  
  // Utilities
  getCacheStatus: () => {
    materials: { isValid: boolean; age: number };
    stock: { isValid: boolean; age: number };
    menu: { isValid: boolean; age: number };
  };
}

const PrefetchContext = createContext<PrefetchContextValue | null>(null);

export interface PrefetchProviderProps {
  children: React.ReactNode;
  
  /**
   * Whether to automatically prefetch data on mount
   * @default true
   */
  autoFetch?: boolean;
  
  /**
   * Whether to prefetch data in parallel
   * @default true
   */
  parallel?: boolean;
  
  /**
   * Interval for automatic refresh (in milliseconds)
   * Set to 0 to disable automatic refresh
   * @default 0 (disabled)
   */
  refreshInterval?: number;
  
  /**
   * Whether to refresh data when the window regains focus
   * @default true
   */
  refreshOnFocus?: boolean;
  
  /**
   * Whether to refresh data when the network comes back online
   * @default true
   */
  refreshOnReconnect?: boolean;
  
  /**
   * Callback when initial prefetch completes
   */
  onInitialized?: () => void;
  
  /**
   * Callback when prefetch fails
   */
  onError?: (error: Error) => void;
}

export const PrefetchProvider: React.FC<PrefetchProviderProps> = ({
  children,
  autoFetch = true,
  parallel = true,
  refreshInterval = 0,
  refreshOnFocus = true,
  refreshOnReconnect = true,
  onInitialized,
  onError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Atoms
  const status = useAtomValue(overallPrefetchStatusAtom);
  const cacheMetadata = useAtomValue(cacheMetadataAtom);
  const refreshAction = useSetAtom(refreshInventoryDataAction);
  const invalidateAction = useSetAtom(invalidateCacheAction);
  
  // Prefetch hook
  const {
    prefetchAll,
    prefetchMaterials,
    prefetchStock,
    prefetchMenu,
    isCacheValid,
    getCacheAge,
  } = usePrefetch({
    autoFetch: false, // We'll handle this manually
    parallel,
    onSuccess: () => {
      if (!isInitialized) {
        setIsInitialized(true);
        onInitialized?.();
      }
    },
    onError,
  });

  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(navigator.onLine);

  // Initialize data on mount
  useEffect(() => {
    if (autoFetch && !isInitialized) {
      prefetchAll({ parallel }).catch(console.error);
    }
  }, [autoFetch, parallel, prefetchAll, isInitialized]);

  // Setup automatic refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        // Only refresh if cache is getting stale
        const shouldRefresh = ['materials', 'stock', 'menu'].some(type => {
          const age = getCacheAge(type as 'materials' | 'stock' | 'menu');
          return age > CACHE_DURATION * 0.8; // Refresh when 80% of cache duration has passed
        });

        if (shouldRefresh) {
          refreshAction('all').catch(console.error);
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, refreshAction, getCacheAge]);

  // Handle window focus
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleFocus = () => {
      // Check if any cache is stale
      const shouldRefresh = ['materials', 'stock', 'menu'].some(type => 
        !isCacheValid(type as 'materials' | 'stock' | 'menu')
      );

      if (shouldRefresh) {
        refreshAction('all').catch(console.error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOnFocus, refreshAction, isCacheValid]);

  // Handle network reconnection
  useEffect(() => {
    if (!refreshOnReconnect) return;

    const handleOnline = () => {
      if (!isOnlineRef.current) {
        // Network just came back online, refresh data
        refreshAction('all').catch(console.error);
      }
      isOnlineRef.current = true;
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshOnReconnect, refreshAction]);

  // Context value
  const contextValue: PrefetchContextValue = {
    // Status
    isInitialized,
    isLoading: status.isLoading,
    hasError: status.hasError,
    lastUpdated: status.lastUpdated,
    
    // Actions
    refreshAll: async () => {
      await refreshAction('all');
    },
    refreshMaterials: async () => {
      await refreshAction('materials');
    },
    refreshStock: async () => {
      await refreshAction('stock');
    },
    refreshMenu: async () => {
      await refreshAction('menu');
    },
    invalidateAll: () => {
      invalidateAction('all');
    },
    
    // Utilities
    getCacheStatus: () => ({
      materials: {
        isValid: isCacheValid('materials'),
        age: getCacheAge('materials'),
      },
      stock: {
        isValid: isCacheValid('stock'),
        age: getCacheAge('stock'),
      },
      menu: {
        isValid: isCacheValid('menu'),
        age: getCacheAge('menu'),
      },
    }),
  };

  return (
    <PrefetchContext.Provider value={contextValue}>
      {children}
    </PrefetchContext.Provider>
  );
};