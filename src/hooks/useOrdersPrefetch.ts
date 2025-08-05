import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect } from "react";
import {
  cachedOrdersAtom,
  cachedOrderSummariesAtom,
  prefetchStatusAtom,
  prefetchOrdersAction,
  prefetchOrderSummariesAction,
  refreshInventoryDataAction,
  invalidateCacheAction,
} from "@/store/prefetchAtoms";
import { Order, OrderSummary } from "@/types/orders";

export interface UseOrdersPrefetchOptions {
  autoFetch?: boolean;
  parallel?: boolean;
  force?: boolean;
  dataTypes?: ('orders' | 'orderSummaries')[];
  onError?: (error: Error) => void;
  onSuccess?: (data: { orders?: Order[]; orderSummaries?: OrderSummary[] }) => void;
}

export interface UseOrdersPrefetchReturn {
  orders: Order[];
  orderSummaries: OrderSummary[];
  status: {
    orders: { loading: boolean; error: string | null; lastUpdated: Date | null };
    orderSummaries: { loading: boolean; error: string | null; lastUpdated: Date | null };
  };
  isLoading: boolean;
  hasError: boolean;
  refresh: (dataType?: 'orders' | 'orderSummaries' | 'all') => Promise<void>;
  invalidateCache: (dataType?: 'orders' | 'orderSummaries' | 'all') => void;
}

export const useOrdersPrefetch = (options: UseOrdersPrefetchOptions = {}): UseOrdersPrefetchReturn => {
  const {
    autoFetch = true,
    parallel = true,
    force = false,
    dataTypes = ['orders', 'orderSummaries'],
    onError,
    onSuccess
  } = options;

  // Get cached data
  const orders = useAtomValue(cachedOrdersAtom);
  const orderSummaries = useAtomValue(cachedOrderSummariesAtom);
  const status = useAtomValue(prefetchStatusAtom);

  // Actions
  const [, prefetchOrders] = useAtom(prefetchOrdersAction);
  const [, prefetchOrderSummaries] = useAtom(prefetchOrderSummariesAction);
  const [, refreshData] = useAtom(refreshInventoryDataAction);
  const [, invalidateCache] = useAtom(invalidateCacheAction);

  // Refresh function
  const refresh = useCallback(async (dataType?: 'orders' | 'orderSummaries' | 'all') => {
    try {
      if (dataType === 'all' || !dataType) {
        if (parallel) {
          const promises = [];
          if (dataTypes.includes('orders')) {
            promises.push(prefetchOrders({ force: true }));
          }
          if (dataTypes.includes('orderSummaries')) {
            promises.push(prefetchOrderSummaries({ force: true }));
          }
          
          const results = await Promise.allSettled(promises);
          const data: { orders?: Order[]; orderSummaries?: OrderSummary[] } = {};
          
          if (dataTypes.includes('orders') && results[0]?.status === 'fulfilled') {
            data.orders = results[0].value;
          }
          if (dataTypes.includes('orderSummaries')) {
            const summariesIndex = dataTypes.includes('orders') ? 1 : 0;
            if (results[summariesIndex]?.status === 'fulfilled') {
              data.orderSummaries = results[summariesIndex].value;
            }
          }
          
          onSuccess?.(data);
        } else {
          // Sequential execution
          const data: { orders?: Order[]; orderSummaries?: OrderSummary[] } = {};
          
          if (dataTypes.includes('orders')) {
            data.orders = await prefetchOrders({ force: true });
          }
          if (dataTypes.includes('orderSummaries')) {
            data.orderSummaries = await prefetchOrderSummaries({ force: true });
          }
          
          onSuccess?.(data);
        }
      } else {
        // Refresh specific data type
        await refreshData(dataType);
      }
    } catch (error) {
      console.error('Failed to refresh orders data:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to refresh orders data'));
    }
  }, [parallel, dataTypes, prefetchOrders, prefetchOrderSummaries, refreshData, onSuccess, onError]);

  // Cache invalidation function
  const invalidateCacheCallback = useCallback((dataType?: 'orders' | 'orderSummaries' | 'all') => {
    invalidateCache(dataType);
  }, [invalidateCache]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      refresh().catch(console.error);
    }
  }, [autoFetch, refresh]);

  // Derived state
  const isLoading = (dataTypes.includes('orders') && status.orders.loading) || 
                   (dataTypes.includes('orderSummaries') && status.orderSummaries.loading);
  
  const hasError = (dataTypes.includes('orders') && !!status.orders.error) || 
                   (dataTypes.includes('orderSummaries') && !!status.orderSummaries.error);

  return {
    orders,
    orderSummaries,
    status: {
      orders: status.orders,
      orderSummaries: status.orderSummaries
    },
    isLoading,
    hasError,
    refresh,
    invalidateCache: invalidateCacheCallback
  };
};

// Specialized hooks for specific data types
export const useOrdersPrefetchOrders = (options?: Omit<UseOrdersPrefetchOptions, 'dataTypes'>) => {
  return useOrdersPrefetch({ ...options, dataTypes: ['orders'] });
};

export const useOrdersPrefetchSummaries = (options?: Omit<UseOrdersPrefetchOptions, 'dataTypes'>) => {
  return useOrdersPrefetch({ ...options, dataTypes: ['orderSummaries'] });
};

// Hook for cached data access only (no prefetching)
export const useCachedOrdersData = () => {
  const orders = useAtomValue(cachedOrdersAtom);
  const orderSummaries = useAtomValue(cachedOrderSummariesAtom);
  const status = useAtomValue(prefetchStatusAtom);

  return {
    orders,
    orderSummaries,
    status: {
      orders: status.orders,
      orderSummaries: status.orderSummaries
    }
  };
};
