import { ordersAPI } from "./orders.api";
import {
  prefetchOrdersAction,
  prefetchOrderSummariesAction,
  invalidateCacheAction,
} from "@/store/prefetchAtoms";
import { getDefaultStore } from "jotai";

// Get the default Jotai store for direct atom manipulation
const store = getDefaultStore();

// Enhanced API with prefetch integration
export const ordersAPIWithPrefetch = {
  ...ordersAPI,
  
  // Enhanced methods that update cache
  getOrdersWithCache: async (options?: { force?: boolean }) => {
    return await store.set(prefetchOrderSummariesAction, options);
  },
  
  getOrderSummariesWithCache: async (options?: { force?: boolean }) => {
    return await store.set(prefetchOrderSummariesAction, options);
  },
  
  createOrderWithCache: async (...args: Parameters<typeof ordersAPI.createOrder>) => {
    const result = await ordersAPI.createOrder(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  updateOrderWithCache: async (...args: Parameters<typeof ordersAPI.updateOrder>) => {
    const result = await ordersAPI.updateOrder(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  addOrderItemsWithCache: async (...args: Parameters<typeof ordersAPI.addOrderItems>) => {
    const result = await ordersAPI.addOrderItems(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  removeOrderItemsWithCache: async (...args: Parameters<typeof ordersAPI.removeOrderItems>) => {
    const result = await ordersAPI.removeOrderItems(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  updateOrderStatusWithCache: async (...args: Parameters<typeof ordersAPI.updateOrderStatus>) => {
    const result = await ordersAPI.updateOrderStatus(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  completeOrderWithCache: async (...args: Parameters<typeof ordersAPI.completeOrder>) => {
    const result = await ordersAPI.completeOrder(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  cancelOrderWithCache: async (...args: Parameters<typeof ordersAPI.cancelOrder>) => {
    const result = await ordersAPI.cancelOrder(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  voidOrderWithCache: async (...args: Parameters<typeof ordersAPI.voidOrder>) => {
    const result = await ordersAPI.voidOrder(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  autoSaveOrderWithCache: async (...args: Parameters<typeof ordersAPI.autoSaveOrder>) => {
    const result = await ordersAPI.autoSaveOrder(...args);
    // Invalidate and refresh orders cache
    store.set(invalidateCacheAction, 'orders');
    store.set(invalidateCacheAction, 'orderSummaries');
    store.set(prefetchOrdersAction, { force: true }).catch(console.error);
    store.set(prefetchOrderSummariesAction, { force: true }).catch(console.error);
    return result;
  },
  
  // Global prefetch methods
  prefetch: {
    orders: (options?: { force?: boolean }) => 
      store.set(prefetchOrdersAction, options),
    orderSummaries: (options?: { force?: boolean }) => 
      store.set(prefetchOrderSummariesAction, options),
    all: async (options?: { force?: boolean; parallel?: boolean }) => {
      const { parallel = true } = options || {};
      
      if (parallel) {
        // Parallel execution for better performance
        const [orders, orderSummaries] = await Promise.allSettled([
          store.set(prefetchOrdersAction, options),
          store.set(prefetchOrderSummariesAction, options)
        ]);
        
        return {
          orders: orders.status === "fulfilled" ? orders.value : null,
          orderSummaries: orderSummaries.status === "fulfilled" ? orderSummaries.value : null
        };
      } else {
        // Sequential execution
        const orders = await store.set(prefetchOrdersAction, options);
        const orderSummaries = await store.set(prefetchOrderSummariesAction, options);
        
        return { orders, orderSummaries };
      }
    },
  },
  
  // Cache management
  cache: {
    invalidate: (cacheType?: 'orders' | 'orderSummaries' | 'all') => 
      store.set(invalidateCacheAction, cacheType),
  },
};

// Original API for backward compatibility
export { ordersAPI };
