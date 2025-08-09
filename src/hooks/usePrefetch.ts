import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { prefetchAllInventoryAction, prefetchMaterialsAction, prefetchStockAction, prefetchMenuAction, refreshInventoryDataAction, invalidateCacheAction, overallPrefetchStatusAtom, cachedMaterialsAtom, cachedStockAtom, cachedMenuAtom, cacheMetadataAtom, CACHE_DURATION } from "@/store/prefetchAtoms";

export interface UsePrefetchOptions {
  /**
   * Whether to automatically prefetch data on mount
   * @default true
   */
  autoFetch?: boolean;

  /**
   * Whether to prefetch data in parallel or sequentially
   * @default true
   */
  parallel?: boolean;

  /**
   * Whether to force refresh even if cache is valid
   * @default false
   */
  force?: boolean;

  /**
   * Which data types to prefetch
   * @default ['materials', 'stock', 'menu']
   */
  dataTypes?: ("materials" | "stock" | "menu")[];

  /**
   * Callback when prefetch completes successfully
   */
  onSuccess?: (data: unknown) => void;

  /**
   * Callback when prefetch fails
   */
  onError?: (error: Error) => void;
}

export interface UsePrefetchReturn {
  // Data
  materials: ReturnType<typeof useAtomValue<typeof cachedMaterialsAtom>>;
  stock: ReturnType<typeof useAtomValue<typeof cachedStockAtom>>;
  menu: ReturnType<typeof useAtomValue<typeof cachedMenuAtom>>;

  // Status
  status: ReturnType<typeof useAtomValue<typeof overallPrefetchStatusAtom>>;

  // Actions
  prefetchAll: (options?: { force?: boolean; parallel?: boolean }) => Promise<{
    materials: unknown;
    stock: unknown;
    menu: unknown;
  } | null>;
  prefetchMaterials: (options?: { force?: boolean }) => Promise<unknown>;
  prefetchStock: (options?: { force?: boolean }) => Promise<unknown>;
  prefetchMenu: (options?: { force?: boolean }) => Promise<unknown>;
  refresh: (cacheType?: "materials" | "stock" | "menu" | "all") => Promise<unknown>;
  invalidateCache: (cacheType?: "materials" | "stock" | "menu" | "all") => void;

  // Utilities
  isCacheValid: (cacheType: "materials" | "stock" | "menu") => boolean;
  getCacheAge: (cacheType: "materials" | "stock" | "menu") => number;
}

/**
 * Hook for managing inventory data prefetching with caching
 */
export const usePrefetch = (options: UsePrefetchOptions = {}): UsePrefetchReturn => {
  const { autoFetch = true, parallel = true, force = false, dataTypes = ["materials", "stock", "menu"], onSuccess, onError } = options;

  // Atoms
  const materials = useAtomValue(cachedMaterialsAtom);
  const stock = useAtomValue(cachedStockAtom);
  const menu = useAtomValue(cachedMenuAtom);
  const status = useAtomValue(overallPrefetchStatusAtom);
  const cacheMetadata = useAtomValue(cacheMetadataAtom);

  // Actions
  const prefetchAllAction = useSetAtom(prefetchAllInventoryAction);
  const prefetchMaterialsAction_ = useSetAtom(prefetchMaterialsAction);
  const prefetchStockAction_ = useSetAtom(prefetchStockAction);
  const prefetchMenuAction_ = useSetAtom(prefetchMenuAction);
  const refreshAction = useSetAtom(refreshInventoryDataAction);
  const invalidateAction = useSetAtom(invalidateCacheAction);

  // Utility functions
  const isCacheValid = useCallback(
    (cacheType: "materials" | "stock" | "menu"): boolean => {
      const lastFetch = cacheMetadata[cacheType].lastFetch;
      return Date.now() - lastFetch < CACHE_DURATION;
    },
    [cacheMetadata]
  );

  const getCacheAge = useCallback(
    (cacheType: "materials" | "stock" | "menu"): number => {
      const lastFetch = cacheMetadata[cacheType].lastFetch;
      return Date.now() - lastFetch;
    },
    [cacheMetadata]
  );

  // Wrapped actions with error handling
  const prefetchAll = useCallback(
    async (actionOptions?: { force?: boolean; parallel?: boolean }) => {
      try {
        const result = await prefetchAllAction({
          force: actionOptions?.force || force,
          parallel: actionOptions?.parallel ?? parallel
        });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Prefetch failed");
        onError?.(err);
        throw err;
      }
    },
    [prefetchAllAction, force, parallel, onSuccess, onError]
  );

  const prefetchMaterials = useCallback(
    async (actionOptions?: { force?: boolean }) => {
      try {
        const result = await prefetchMaterialsAction_({ force: actionOptions?.force || force });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Materials prefetch failed");
        onError?.(err);
        throw err;
      }
    },
    [prefetchMaterialsAction_, force, onSuccess, onError]
  );

  const prefetchStock = useCallback(
    async (actionOptions?: { force?: boolean }) => {
      try {
        const result = await prefetchStockAction_({ force: actionOptions?.force || force });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Stock prefetch failed");
        onError?.(err);
        throw err;
      }
    },
    [prefetchStockAction_, force, onSuccess, onError]
  );

  const prefetchMenu = useCallback(
    async (actionOptions?: { force?: boolean }) => {
      try {
        const result = await prefetchMenuAction_({ force: actionOptions?.force || force });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Menu prefetch failed");
        onError?.(err);
        throw err;
      }
    },
    [prefetchMenuAction_, force, onSuccess, onError]
  );

  const refresh = useCallback(
    async (cacheType?: "materials" | "stock" | "menu" | "all") => {
      try {
        const result = await refreshAction(cacheType);
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Refresh failed");
        onError?.(err);
        throw err;
      }
    },
    [refreshAction, onSuccess, onError]
  );

  const invalidateCache = useCallback(
    (cacheType?: "materials" | "stock" | "menu" | "all") => {
      invalidateAction(cacheType);
    },
    [invalidateAction]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (!autoFetch) return;

    const shouldFetch = dataTypes.some(type => !isCacheValid(type)) || force;

    if (shouldFetch) {
      if (dataTypes.length === 3) {
        // Fetch all if all types are requested
        prefetchAll().catch(console.error);
      } else {
        // Fetch individual types
        const promises = dataTypes.map(type => {
          switch (type) {
            case "materials":
              return prefetchMaterials();
            case "stock":
              return prefetchStock();
            case "menu":
              return prefetchMenu();
            default:
              return Promise.resolve();
          }
        });

        Promise.allSettled(promises).catch(console.error);
      }
    }
  }, [autoFetch, force, dataTypes, isCacheValid, prefetchAll, prefetchMaterials, prefetchStock, prefetchMenu]);

  return {
    // Data
    materials,
    stock,
    menu,

    // Status
    status,

    // Actions
    prefetchAll,
    prefetchMaterials,
    prefetchStock,
    prefetchMenu,
    refresh,
    invalidateCache,

    // Utilities
    isCacheValid,
    getCacheAge
  };
};

/**
 * Hook for prefetching specific inventory data type
 */
export const usePrefetchMaterials = (options?: Omit<UsePrefetchOptions, "dataTypes">) => {
  return usePrefetch({ ...options, dataTypes: ["materials"] });
};

/**
 * Hook for prefetching stock data
 */
export const usePrefetchStock = (options?: Omit<UsePrefetchOptions, "dataTypes">) => {
  return usePrefetch({ ...options, dataTypes: ["stock"] });
};

/**
 * Hook for prefetching menu data
 */
export const usePrefetchMenu = (options?: Omit<UsePrefetchOptions, "dataTypes">) => {
  return usePrefetch({ ...options, dataTypes: ["menu"] });
};

/**
 * Hook for accessing cached data without prefetching
 */
export const useCachedInventoryData = () => {
  const materials = useAtomValue(cachedMaterialsAtom);
  const stock = useAtomValue(cachedStockAtom);
  const menu = useAtomValue(cachedMenuAtom);
  const status = useAtomValue(overallPrefetchStatusAtom);
  const cacheMetadata = useAtomValue(cacheMetadataAtom);

  return {
    materials,
    stock,
    menu,
    status,
    cacheMetadata
  };
};
