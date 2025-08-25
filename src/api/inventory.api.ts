import { assignmentsAPI } from "./assignments.api";
import { materialsAPI } from "./materials.api.ts";
import { menuAPI } from "./menu.api.ts";
import { sectionAPI } from "./sections.api.ts.tsx";
import { stockAPI } from "./stock.api.ts.tsx";
import {
  prefetchMaterialsAction,
  prefetchStockAction,
  prefetchMenuAction,
  prefetchAllInventoryAction,
  invalidateCacheAction,
} from "@/store/prefetchAtoms";
import { getDefaultStore } from "jotai";

// Get the default Jotai store for direct atom manipulation
const store = getDefaultStore();

// Enhanced API with prefetch integration
export const inventoryAPIWithPrefetch = {
  materials: {
    ...materialsAPI,
    // Enhanced methods that update cache
    getMaterialsWithCache: async (options?: { force?: boolean }) => {
      return await store.set(prefetchMaterialsAction, options);
    },
    createMaterialWithCache: async (...args: Parameters<typeof materialsAPI.createMaterial>) => {
      const result = await materialsAPI.createMaterial(...args);
      // Invalidate and refresh materials cache
      store.set(invalidateCacheAction, 'materials');
      store.set(prefetchMaterialsAction, { force: true }).catch(console.error);
      return result;
    },
    updateMaterialWithCache: async (...args: Parameters<typeof materialsAPI.updateMaterial>) => {
      const result = await materialsAPI.updateMaterial(...args);
      // Invalidate and refresh materials cache
      store.set(invalidateCacheAction, 'materials');
      store.set(prefetchMaterialsAction, { force: true }).catch(console.error);
      return result;
    },
    deleteMaterialWithCache: async (...args: Parameters<typeof materialsAPI.deleteMaterial>) => {
      const result = await materialsAPI.deleteMaterial(...args);
      // Invalidate and refresh materials cache
      store.set(invalidateCacheAction, 'materials');
      store.set(prefetchMaterialsAction, { force: true }).catch(console.error);
      return result;
    },
  },
  stock: {
    ...stockAPI,
    // Enhanced methods that update cache
    getStockEntriesWithCache: async (options?: { force?: boolean }) => {
      return await store.set(prefetchStockAction, options);
    },
    createStockEntryWithCache: async (...args: Parameters<typeof stockAPI.createStockEntry>) => {
      const result = await stockAPI.createStockEntry(...args);
      // Invalidate and refresh stock cache
      store.set(invalidateCacheAction, 'stock');
      store.set(prefetchStockAction, { force: true }).catch(console.error);
      return result;
    },
    updateStockEntryWithCache: async (...args: Parameters<typeof stockAPI.updateStockEntry>) => {
      console.log('🔧 updateStockEntryWithCache called with args:', args);
      const result = await stockAPI.updateStockEntry(...args);
      console.log('📡 API call result:', result);
      // Invalidate and refresh stock cache
      store.set(invalidateCacheAction, 'stock');
      store.set(prefetchStockAction, { force: true }).catch(console.error);
      return result;
    },
    deleteStockEntryWithCache: async (...args: Parameters<typeof stockAPI.deleteStockEntry>) => {
      const result = await stockAPI.deleteStockEntry(...args);
      // Invalidate and refresh stock cache
      store.set(invalidateCacheAction, 'stock');
      store.set(prefetchStockAction, { force: true }).catch(console.error);
      return result;
    },
    addToStockWithCache: async (...args: Parameters<typeof stockAPI.addToStock>) => {
      const result = await stockAPI.addToStock(...args);
      // Invalidate and refresh stock cache
      store.set(invalidateCacheAction, 'stock');
      store.set(prefetchStockAction, { force: true }).catch(console.error);
      return result;
    },
    recordWasteWithCache: async (...args: Parameters<typeof stockAPI.recordWaste>) => {
      const result = await stockAPI.recordWaste(...args);
      // Invalidate and refresh stock cache
      store.set(invalidateCacheAction, 'stock');
      store.set(prefetchStockAction, { force: true }).catch(console.error);
      return result;
    },
    wasteFromSpecificEntryWithCache: async (...args: Parameters<typeof stockAPI.wasteFromSpecificEntry>) => {
      const result = await stockAPI.wasteFromSpecificEntry(...args);
      // Invalidate and refresh stock cache
      store.set(invalidateCacheAction, 'stock');
      store.set(prefetchStockAction, { force: true }).catch(console.error);
      return result;
    },
    addToSpecificEntryWithCache: async (...args: Parameters<typeof stockAPI.addToSpecificEntry>) => {
      const result = await stockAPI.addToSpecificEntry(...args);
      // Invalidate and refresh stock cache
      store.set(invalidateCacheAction, 'stock');
      store.set(prefetchStockAction, { force: true }).catch(console.error);
      return result;
    },
  },
  menu: {
    ...menuAPI,
    // Enhanced methods that update cache
    getMenusWithCache: async (options?: { force?: boolean }) => {
      return await store.set(prefetchMenuAction, options);
    },
    createMenuItemWithCache: async (...args: Parameters<typeof menuAPI.createMenuItem>) => {
      const result = await menuAPI.createMenuItem(...args);
      // Invalidate and refresh menu cache
      store.set(invalidateCacheAction, 'menu');
      store.set(prefetchMenuAction, { force: true }).catch(console.error);
      return result;
    },
    updateMenuItemWithCache: async (...args: Parameters<typeof menuAPI.updateMenuItem>) => {
      const result = await menuAPI.updateMenuItem(...args);
      // Invalidate and refresh menu cache
      store.set(invalidateCacheAction, 'menu');
      store.set(prefetchMenuAction, { force: true }).catch(console.error);
      return result;
    },
    deleteMenuItemWithCache: async (...args: Parameters<typeof menuAPI.deleteMenuItem>) => {
      const result = await menuAPI.deleteMenuItem(...args);
      // Invalidate and refresh menu cache
      store.set(invalidateCacheAction, 'menu');
      store.set(prefetchMenuAction, { force: true }).catch(console.error);
      return result;
    },
  },
  sections: sectionAPI,
  assignments: assignmentsAPI,
  
  // Global prefetch methods
  prefetch: {
    all: (options?: { force?: boolean; parallel?: boolean }) => 
      store.set(prefetchAllInventoryAction, options),
    materials: (options?: { force?: boolean }) => 
      store.set(prefetchMaterialsAction, options),
    stock: (options?: { force?: boolean }) => 
      store.set(prefetchStockAction, options),
    menu: (options?: { force?: boolean }) => 
      store.set(prefetchMenuAction, options),
  },
  
  // Cache management
  cache: {
    invalidate: (cacheType?: 'materials' | 'stock' | 'menu' | 'all') => 
      store.set(invalidateCacheAction, cacheType),
  },
};

// Original API for backward compatibility
export const inventoryAPI = {
  materials: materialsAPI,
  stock: stockAPI,
  menu: menuAPI,
  sections: sectionAPI,
  assignments: assignmentsAPI
};

export { assignmentsAPI, materialsAPI, menuAPI, sectionAPI, stockAPI };
