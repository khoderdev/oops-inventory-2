import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { inventoryAPI } from "@/api/inventory.api";
import { Material, MenuItem, StockEntry, MaterialWithStock, StockEntryWithMaterial } from "@/types/inventory";

// Cache configuration
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
export const PREFETCH_DELAY = 100; // 100ms delay between prefetch calls

// Cache metadata atoms
export const cacheMetadataAtom = atomWithStorage("inventory-cache-metadata", {
  materials: { lastFetch: 0, isValid: false },
  stock: { lastFetch: 0, isValid: false },
  menu: { lastFetch: 0, isValid: false }
});

// Prefetch status atoms
export const prefetchStatusAtom = atom({
  materials: { loading: false, error: null as string | null, lastUpdated: null as Date | null },
  stock: { loading: false, error: null as string | null, lastUpdated: null as Date | null },
  menu: { loading: false, error: null as string | null, lastUpdated: null as Date | null }
});

// Data cache atoms with storage persistence
export const materialsCacheAtom = atomWithStorage<MaterialWithStock[]>("inventory-materials-cache", []);
export const stockCacheAtom = atomWithStorage<StockEntryWithMaterial[]>("inventory-stock-cache", []);
export const menuCacheAtom = atomWithStorage<MenuItem[]>("inventory-menu-cache", []);

// Helper function to check if cache is valid
const isCacheValid = (lastFetch: number): boolean => {
  return Date.now() - lastFetch < CACHE_DURATION;
};

// Transform materials data for consistency
const transformMaterialsData = (materials: Material[]): MaterialWithStock[] => {
  return materials.map(material => ({
    ...material,
    id: material.id.toString(),
    createdAt: material.createdAt ? new Date(material.createdAt) : new Date(),
    updatedAt: material.updatedAt ? new Date(material.updatedAt) : new Date(),
    stockEntries: [],
    totalQuantityInBaseUnit: 0,
    totalValue: 0,
    averageCostPerBaseUnit: 0,
    availableQuantity: 0
  }));
};

// Transform stock entries data for consistency
const transformStockData = (stockEntries: StockEntry[]): StockEntryWithMaterial[] => {
  return stockEntries.map(entry => ({
    ...entry,
    id: entry.id.toString(),
    materialId: entry.materialId.toString(),
    purchaseDate: new Date(entry.purchaseDate),
    expiryDate: entry.expiryDate ? new Date(entry.expiryDate) : undefined,
    createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
    updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date()
  }));
};

// Transform menu items data for consistency
const transformMenuData = (menuItems: MenuItem[]): MenuItem[] => {
  return menuItems.map(item => ({
    ...item,
    id: item.id.toString(),
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
  }));
};

// Materials prefetch action
export const prefetchMaterialsAction = atom(null, async (get, set, options?: { force?: boolean }) => {
  const cacheMetadata = get(cacheMetadataAtom);
  const currentStatus = get(prefetchStatusAtom);

  // Skip if already loading
  if (currentStatus.materials.loading) return;

  // Check if cache is valid and force is not requested
  if (!options?.force && isCacheValid(cacheMetadata.materials.lastFetch)) {
    return get(materialsCacheAtom);
  }

  // Set loading state
  set(prefetchStatusAtom, prev => ({
    ...prev,
    materials: { ...prev.materials, loading: true, error: null }
  }));

  try {
    const response = await inventoryAPI.materials.getMaterials();
    const transformedData = transformMaterialsData(response.data);

    // Update cache
    set(materialsCacheAtom, transformedData);

    // Update cache metadata
    set(cacheMetadataAtom, prev => ({
      ...prev,
      materials: { lastFetch: Date.now(), isValid: true }
    }));

    // Update status
    set(prefetchStatusAtom, prev => ({
      ...prev,
      materials: { loading: false, error: null, lastUpdated: new Date() }
    }));

    return transformedData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to prefetch materials";

    set(prefetchStatusAtom, prev => ({
      ...prev,
      materials: { loading: false, error: errorMessage, lastUpdated: null }
    }));

    throw error;
  }
});

// Stock prefetch action
export const prefetchStockAction = atom(null, async (get, set, options?: { force?: boolean }) => {
  const cacheMetadata = get(cacheMetadataAtom);
  const currentStatus = get(prefetchStatusAtom);

  // Skip if already loading
  if (currentStatus.stock.loading) return;

  // Check if cache is valid and force is not requested
  if (!options?.force && isCacheValid(cacheMetadata.stock.lastFetch)) {
    return get(stockCacheAtom);
  }

  // Set loading state
  set(prefetchStatusAtom, prev => ({
    ...prev,
    stock: { ...prev.stock, loading: true, error: null }
  }));

  try {
    const response = await inventoryAPI.stock.getStockEntries();
    const transformedData = transformStockData(response.data);

    // Update cache
    set(stockCacheAtom, transformedData);

    // Update cache metadata
    set(cacheMetadataAtom, prev => ({
      ...prev,
      stock: { lastFetch: Date.now(), isValid: true }
    }));

    // Update status
    set(prefetchStatusAtom, prev => ({
      ...prev,
      stock: { loading: false, error: null, lastUpdated: new Date() }
    }));

    return transformedData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to prefetch stock";

    set(prefetchStatusAtom, prev => ({
      ...prev,
      stock: { loading: false, error: errorMessage, lastUpdated: null }
    }));

    throw error;
  }
});

// Menu prefetch action
export const prefetchMenuAction = atom(null, async (get, set, options?: { force?: boolean }) => {
  const cacheMetadata = get(cacheMetadataAtom);
  const currentStatus = get(prefetchStatusAtom);

  // Skip if already loading
  if (currentStatus.menu.loading) return;

  // Check if cache is valid and force is not requested
  if (!options?.force && isCacheValid(cacheMetadata.menu.lastFetch)) {
    return get(menuCacheAtom);
  }

  // Set loading state
  set(prefetchStatusAtom, prev => ({
    ...prev,
    menu: { ...prev.menu, loading: true, error: null }
  }));

  try {
    const response = await inventoryAPI.menu.getMenus();
    const transformedData = transformMenuData(response.data);

    // Update cache
    set(menuCacheAtom, transformedData);

    // Update cache metadata
    set(cacheMetadataAtom, prev => ({
      ...prev,
      menu: { lastFetch: Date.now(), isValid: true }
    }));

    // Update status
    set(prefetchStatusAtom, prev => ({
      ...prev,
      menu: { loading: false, error: null, lastUpdated: new Date() }
    }));

    return transformedData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to prefetch menu";

    set(prefetchStatusAtom, prev => ({
      ...prev,
      menu: { loading: false, error: errorMessage, lastUpdated: null }
    }));

    throw error;
  }
});

// Combined prefetch action for all inventory data
export const prefetchAllInventoryAction = atom(null, async (get, set, options?: { force?: boolean; parallel?: boolean }) => {
  const { parallel = true } = options || {};

  try {
    if (parallel) {
      // Parallel execution for better performance
      const [materials, stock, menu] = await Promise.allSettled([
        set(prefetchMaterialsAction, options),
        // Add delay to prevent API overload
        new Promise(resolve => setTimeout(() => resolve(set(prefetchStockAction, options)), PREFETCH_DELAY)),
        new Promise(resolve => setTimeout(() => resolve(set(prefetchMenuAction, options)), PREFETCH_DELAY * 2))
      ]);

      // Check for any failures
      const failures = [materials, stock, menu].filter(result => result.status === "rejected");
      if (failures.length > 0) {
        console.warn("Some prefetch operations failed:", failures);
      }

      return {
        materials: materials.status === "fulfilled" ? materials.value : null,
        stock: stock.status === "fulfilled" ? stock.value : null,
        menu: menu.status === "fulfilled" ? menu.value : null
      };
    } else {
      // Sequential execution
      const materials = await set(prefetchMaterialsAction, options);
      await new Promise(resolve => setTimeout(resolve, PREFETCH_DELAY));

      const stock = await set(prefetchStockAction, options);
      await new Promise(resolve => setTimeout(resolve, PREFETCH_DELAY));

      const menu = await set(prefetchMenuAction, options);

      return { materials, stock, menu };
    }
  } catch (error) {
    console.error("Failed to prefetch all inventory data:", error);
    throw error;
  }
});

// Cache invalidation actions
export const invalidateCacheAction = atom(null, (get, set, cacheType?: "materials" | "stock" | "menu" | "all") => {
  const currentMetadata = get(cacheMetadataAtom);

  if (cacheType === "all" || !cacheType) {
    // Invalidate all caches
    set(cacheMetadataAtom, {
      materials: { lastFetch: 0, isValid: false },
      stock: { lastFetch: 0, isValid: false },
      menu: { lastFetch: 0, isValid: false }
    });

    // Clear cache data
    set(materialsCacheAtom, []);
    set(stockCacheAtom, []);
    set(menuCacheAtom, []);
  } else {
    // Invalidate specific cache
    set(cacheMetadataAtom, {
      ...currentMetadata,
      [cacheType]: { lastFetch: 0, isValid: false }
    });

    // Clear specific cache data
    switch (cacheType) {
      case "materials":
        set(materialsCacheAtom, []);
        break;
      case "stock":
        set(stockCacheAtom, []);
        break;
      case "menu":
        set(menuCacheAtom, []);
        break;
    }
  }
});

// Refresh action (invalidate and refetch)
export const refreshInventoryDataAction = atom(null, async (get, set, cacheType?: "materials" | "stock" | "menu" | "all") => {
  // Invalidate cache first
  set(invalidateCacheAction, cacheType);

  // Refetch data
  if (cacheType === "all" || !cacheType) {
    return await set(prefetchAllInventoryAction, { force: true });
  } else {
    switch (cacheType) {
      case "materials":
        return await set(prefetchMaterialsAction, { force: true });
      case "stock":
        return await set(prefetchStockAction, { force: true });
      case "menu":
        return await set(prefetchMenuAction, { force: true });
    }
  }
});

// Derived atoms for easy access to cached data
export const cachedMaterialsAtom = atom(get => get(materialsCacheAtom));
export const cachedStockAtom = atom(get => get(stockCacheAtom));
export const cachedMenuAtom = atom(get => get(menuCacheAtom));

// Combined status atom
export const overallPrefetchStatusAtom = atom(get => {
  const status = get(prefetchStatusAtom);
  const isLoading = status.materials.loading || status.stock.loading || status.menu.loading;
  const hasError = status.materials.error || status.stock.error || status.menu.error;
  const lastUpdated = [status.materials.lastUpdated, status.stock.lastUpdated, status.menu.lastUpdated].filter(Boolean).sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0];

  return {
    isLoading,
    hasError: !!hasError,
    errors: {
      materials: status.materials.error,
      stock: status.stock.error,
      menu: status.menu.error
    },
    lastUpdated,
    individual: status
  };
});
