import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { inventoryAPI } from "@/api/inventory.api";
import { ordersAPI } from "@/api/orders.api";
import { Material, MenuItem, StockEntry, MaterialWithStock, StockEntryWithMaterial } from "@/types/inventory";
import { Order, OrderSummary } from "@/types/orders";

export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
export const PREFETCH_DELAY = 100; // 100ms delay between prefetch calls

// Cache metadata atoms
export const cacheMetadataAtom = atomWithStorage("inventory-cache-metadata", {
  materials: { lastFetch: 0, isValid: false },
  stock: { lastFetch: 0, isValid: false },
  menu: { lastFetch: 0, isValid: false },
  orders: { lastFetch: 0, isValid: false },
  orderSummaries: { lastFetch: 0, isValid: false }
});

// Prefetch status atoms
export const prefetchStatusAtom = atom({
  materials: { loading: false, error: null as string | null, lastUpdated: null as Date | null },
  stock: { loading: false, error: null as string | null, lastUpdated: null as Date | null },
  menu: { loading: false, error: null as string | null, lastUpdated: null as Date | null },
  orders: { loading: false, error: null as string | null, lastUpdated: null as Date | null },
  orderSummaries: { loading: false, error: null as string | null, lastUpdated: null as Date | null }
});

// Data cache atoms with storage persistence
export const materialsCacheAtom = atomWithStorage<MaterialWithStock[]>("inventory-materials-cache", []);
export const stockCacheAtom = atomWithStorage<StockEntryWithMaterial[]>("inventory-stock-cache", []);
export const menuCacheAtom = atomWithStorage<MenuItem[]>("inventory-menu-cache", []);
export const ordersCacheAtom = atomWithStorage<OrderSummary[]>("orders-cache", []);
export const orderSummariesCacheAtom = atomWithStorage<OrderSummary[]>("order-summaries-cache", []);

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

// Transform orders data for consistency
const transformOrdersData = (orders: Order[]): Order[] => {
  return orders.map(order => ({
    ...order,
    id: order.id.toString(),
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
    estimatedReadyTime: order.estimatedReadyTime ? new Date(order.estimatedReadyTime) : undefined
  }));
};

// Transform order summaries data for consistency
const transformOrderSummariesData = (orderSummaries: OrderSummary[]): OrderSummary[] => {
  return orderSummaries.map(summary => ({
    ...summary,
    id: summary.id.toString(),
    createdAt: summary.createdAt ? new Date(summary.createdAt) : new Date(),
    estimatedReadyTime: summary.estimatedReadyTime ? new Date(summary.estimatedReadyTime) : undefined
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
    const materialsData = await inventoryAPI.materials.getMaterials();
    const transformedData = transformMaterialsData(materialsData);

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
    const stockEntries = await inventoryAPI.stock.getStockEntries();
    const transformedData = transformStockData(stockEntries);

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

// Orders prefetch action
export const prefetchOrdersAction = atom(null, async (get, set, options?: { force?: boolean }) => {
  const cacheMetadata = get(cacheMetadataAtom);
  const currentStatus = get(prefetchStatusAtom);

  // Check if we need to fetch (force or cache is invalid)
  if (!options?.force && isCacheValid(cacheMetadata.orders.lastFetch) && cacheMetadata.orders.isValid) {
    return get(ordersCacheAtom);
  }

  // Don't fetch if already loading
  if (currentStatus.orders.loading) {
    return get(ordersCacheAtom);
  }

  try {
    // Set loading state
    set(prefetchStatusAtom, prev => ({
      ...prev,
      orders: { loading: true, error: null, lastUpdated: prev.orders.lastUpdated }
    }));

    // Fetch orders data
    const response = await ordersAPI.getOrders();
    const ordersData = response.data;

    // Transform and cache the data
    const transformedData = transformOrderSummariesData(ordersData);

    set(ordersCacheAtom, transformedData);

    // Update cache metadata
    set(cacheMetadataAtom, prev => ({
      ...prev,
      orders: { lastFetch: Date.now(), isValid: true }
    }));

    // Update status
    set(prefetchStatusAtom, prev => ({
      ...prev,
      orders: { loading: false, error: null, lastUpdated: new Date() }
    }));

    return transformedData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to prefetch orders";

    set(prefetchStatusAtom, prev => ({
      ...prev,
      orders: { loading: false, error: errorMessage, lastUpdated: null }
    }));

    throw error;
  }
});

// Order summaries prefetch action
export const prefetchOrderSummariesAction = atom(null, async (get, set, options?: { force?: boolean }) => {
  const cacheMetadata = get(cacheMetadataAtom);
  const currentStatus = get(prefetchStatusAtom);

  // Check if we need to fetch (force or cache is invalid)
  if (!options?.force && isCacheValid(cacheMetadata.orderSummaries.lastFetch) && cacheMetadata.orderSummaries.isValid) {
    return get(orderSummariesCacheAtom);
  }

  // Don't fetch if already loading
  if (currentStatus.orderSummaries.loading) {
    return get(orderSummariesCacheAtom);
  }

  try {
    // Set loading state
    set(prefetchStatusAtom, prev => ({
      ...prev,
      orderSummaries: { loading: true, error: null, lastUpdated: prev.orderSummaries.lastUpdated }
    }));

    // Fetch order summaries data
    const response = await ordersAPI.getOrders();
    const orderSummariesData = response.data;

    // Transform and cache the data
    const transformedData = transformOrderSummariesData(orderSummariesData);
    set(orderSummariesCacheAtom, transformedData);

    // Update cache metadata
    set(cacheMetadataAtom, prev => ({
      ...prev,
      orderSummaries: { lastFetch: Date.now(), isValid: true }
    }));

    // Update status
    set(prefetchStatusAtom, prev => ({
      ...prev,
      orderSummaries: { loading: false, error: null, lastUpdated: new Date() }
    }));

    return transformedData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to prefetch order summaries";

    set(prefetchStatusAtom, prev => ({
      ...prev,
      orderSummaries: { loading: false, error: errorMessage, lastUpdated: null }
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
export const invalidateCacheAction = atom(null, (get, set, cacheType?: "materials" | "stock" | "menu" | "orders" | "orderSummaries" | "all") => {
  const currentMetadata = get(cacheMetadataAtom);

  if (cacheType === "all" || !cacheType) {
    // Invalidate all caches
    set(cacheMetadataAtom, {
      materials: { lastFetch: 0, isValid: false },
      stock: { lastFetch: 0, isValid: false },
      menu: { lastFetch: 0, isValid: false },
      orders: { lastFetch: 0, isValid: false },
      orderSummaries: { lastFetch: 0, isValid: false }
    });

    // Clear cache data
    set(materialsCacheAtom, []);
    set(stockCacheAtom, []);
    set(menuCacheAtom, []);
    set(ordersCacheAtom, []);
    set(orderSummariesCacheAtom, []);
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
      case "orders":
        set(ordersCacheAtom, []);
        break;
      case "orderSummaries":
        set(orderSummariesCacheAtom, []);
        break;
    }
  }
});

// Refresh action (invalidate and refetch)
export const refreshInventoryDataAction = atom(null, async (get, set, cacheType?: "materials" | "stock" | "menu" | "orders" | "orderSummaries" | "all") => {
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
      case "orders":
        return await set(prefetchOrdersAction, { force: true });
      case "orderSummaries":
        return await set(prefetchOrderSummariesAction, { force: true });
    }
  }
});

// Derived atoms for easy access to cached data
export const cachedMaterialsAtom = atom(get => get(materialsCacheAtom));
export const cachedStockAtom = atom(get => get(stockCacheAtom));
export const cachedMenuAtom = atom(get => get(menuCacheAtom));
export const cachedOrdersAtom = atom(get => get(ordersCacheAtom));
export const cachedOrderSummariesAtom = atom(get => get(orderSummariesCacheAtom));

// Combined status atom
export const overallPrefetchStatusAtom = atom(get => {
  const status = get(prefetchStatusAtom);
  const isLoading = status.materials.loading || status.stock.loading || status.menu.loading || status.orders.loading || status.orderSummaries.loading;
  const hasError = status.materials.error || status.stock.error || status.menu.error || status.orders.error || status.orderSummaries.error;
  const lastUpdated = [status.materials.lastUpdated, status.stock.lastUpdated, status.menu.lastUpdated, status.orders.lastUpdated, status.orderSummaries.lastUpdated].filter(Boolean).sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0];

  return {
    isLoading,
    hasError: !!hasError,
    errors: {
      materials: status.materials.error,
      stock: status.stock.error,
      menu: status.menu.error,
      orders: status.orders.error,
      orderSummaries: status.orderSummaries.error
    },
    lastUpdated,
    individual: status
  };
});
