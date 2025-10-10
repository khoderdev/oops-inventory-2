/**
 * RTK Query API for POS Data
 * Centralized API with automatic caching, deduplication, and polling
 * Enhanced with persistent caching for offline-first experience
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Order, OrderSummary, CreateOrderData, UpdateOrderData } from '@/types/orders';
import { Table } from '@/types/inventory';
import { MenuItem } from '@/types/inventory';
import { Category } from '@/types/categories';
import { DayOperation, ActivityLog } from '@/types/inventory';
import { UserOrderStats } from '@/types/dayOperations';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Enhanced cache configuration
const CACHE_CONFIG = {
  // Extended cache durations for better offline experience
  MENU_ITEMS: 24 * 60 * 60, // 24 hours for menu items
  CATEGORIES: 24 * 60 * 60, // 24 hours for categories
  TABLES: 30 * 60, // 30 minutes for tables
  ORDERS: 15 * 60, // 15 minutes for orders
  DAY_OPERATIONS: 60 * 60, // 1 hour for day operations
  ACTIVITIES: 15 * 60, // 15 minutes for activities
};

// Create custom error handler for offline support
const customFetchBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('⚠️ [posApi] No auth token found - API calls will fail with 401');
    }
    return headers;
  },
});

// Enhanced base query with offline support
const baseQueryWithOfflineSupport = async (args: any, api: any, extraOptions: any) => {
  try {
    // Try the normal query first
    const result = await customFetchBaseQuery(args, api, extraOptions);
    return result;
  } catch (error) {
    console.warn('⚠️ [posApi] Network error - using cached data', error);
    // Return a custom error that our components can handle
    return {
      error: { status: 'OFFLINE', data: error },
    };
  }
};

export const posApi = createApi({
  reducerPath: 'posApi',
  baseQuery: baseQueryWithOfflineSupport,
  tagTypes: ['Orders', 'Tables', 'MenuItems', 'Categories', 'DayOperations', 'Activities', 'UserStats'],
  // ULTRA-FAST: Keep data cached for 24 hours by default (like desktop app)
  keepUnusedDataFor: 24 * 60 * 60, // 24 hours in seconds
  endpoints: (builder) => ({
    // ============================================================================
    // ORDERS ENDPOINTS
    // ============================================================================
    getOrders: builder.query<OrderSummary[], { limit?: number; offset?: number; status?: string; orderType?: string }>({
      query: (params) => ({
        url: 'orders',
        params,
      }),
      transformResponse: (response: any) => {
        // Handle nested response structure
        const data = response?.data || response;
        return Array.isArray(data) ? data : data?.data || [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Orders' as const, id })),
              { type: 'Orders', id: 'LIST' },
            ]
          : [{ type: 'Orders', id: 'LIST' }],
      // Keep for 15 minutes
      keepUnusedDataFor: CACHE_CONFIG.ORDERS,
      // Add stale-while-revalidate behavior
      onCacheEntryAdded: async (arg, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) => {
        try {
          // Wait for the initial query to resolve
          const initialData = await cacheDataLoaded;
          const orders = initialData as unknown as OrderSummary[];
          
          // Save to localStorage for ultra-fast loading
          localStorage.setItem('pos_cache_orders', JSON.stringify({
            data: orders,
            timestamp: Date.now(),
            params: arg
          }));
          
          console.log(`💾 [posApi] Saved ${orders.length} orders to localStorage`);
        } catch (e) {
          console.error('Error in onCacheEntryAdded for orders:', e);
        }
      }
    }),

    getOrder: builder.query<Order, string>({
      query: (id) => `orders/${id}`,
      transformResponse: (response: any) => {
        const data = response?.data || response;
        return data;
      },
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
      keepUnusedDataFor: 60,
    }),

    createOrder: builder.mutation<Order, CreateOrderData>({
      query: (data) => ({
        url: 'orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }],
    }),

    updateOrder: builder.mutation<Order, { orderId: string; data: UpdateOrderData }>({
      query: ({ orderId, data }) => ({
        url: `orders/${orderId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Orders', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    completeOrder: builder.mutation<any, { orderId: string; paymentData: any }>({
      query: ({ orderId, paymentData }) => ({
        url: `orders/${orderId}/complete`,
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Orders', id: orderId },
        { type: 'Orders', id: 'LIST' },
        { type: 'UserStats', id: 'CURRENT' },
      ],
    }),

    voidOrder: builder.mutation<any, { orderId: string; data: { reason?: string; restoreStock?: boolean } }>({
      query: ({ orderId, data }) => ({
        url: `orders/${orderId}/void`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Orders', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    // ============================================================================
    // TABLES ENDPOINTS
    // ============================================================================
    getTables: builder.query<Table[], { includeOrders?: boolean; isActive?: boolean }>({
      query: (params) => ({
        url: 'tables',
        params,
      }),
      transformResponse: (response: any) => {
        const data = response?.data || response;
        return Array.isArray(data) ? data : data?.data || [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Tables' as const, id })),
              { type: 'Tables', id: 'LIST' },
            ]
          : [{ type: 'Tables', id: 'LIST' }],
      keepUnusedDataFor: CACHE_CONFIG.TABLES, // 30 minutes
      // Add stale-while-revalidate behavior
      onCacheEntryAdded: async (arg, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) => {
        try {
          // Wait for the initial query to resolve
          const initialData = await cacheDataLoaded;
          const tables = initialData as unknown as Table[];
          
          // Save to localStorage for ultra-fast loading
          localStorage.setItem('pos_cache_tables', JSON.stringify({
            data: tables,
            timestamp: Date.now(),
            params: arg
          }));
          
          console.log(`💾 [posApi] Saved ${tables.length} tables to localStorage`);
        } catch (e) {
          console.error('Error in onCacheEntryAdded for tables:', e);
        }
      }
    }),

    // ============================================================================
    // MENU ITEMS ENDPOINTS
    // ============================================================================
    getFoodMenuItems: builder.query<MenuItem[], boolean>({
      query: (isActive) => ({
        url: 'menu-items/food',
        params: { isActive },
      }),
      transformResponse: (response: any) => {
        return response?.data || response || [];
      },
      providesTags: [{ type: 'MenuItems', id: 'FOOD' }],
      keepUnusedDataFor: CACHE_CONFIG.MENU_ITEMS, // 24 hours
      // Add stale-while-revalidate behavior
      onCacheEntryAdded: async (arg, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) => {
        try {
          // Wait for the initial query to resolve
          const initialData = await cacheDataLoaded;
          const foodItems = initialData as unknown as MenuItem[];
          
          // Save to localStorage for ultra-fast loading
          localStorage.setItem('pos_cache_food_items', JSON.stringify({
            data: foodItems,
            timestamp: Date.now()
          }));
          
          console.log(`💾 [posApi] Saved ${foodItems.length} food menu items to localStorage`);
        } catch (e) {
          console.error('Error in onCacheEntryAdded for food menu items:', e);
        }
      }
    }),

    getBeverageMenuItems: builder.query<MenuItem[], boolean>({
      query: (isActive) => ({
        url: 'menu-items/beverages',
        params: { isActive },
      }),
      transformResponse: (response: any) => {
        return response?.data || response || [];
      },
      providesTags: [{ type: 'MenuItems', id: 'BEVERAGES' }],
      keepUnusedDataFor: CACHE_CONFIG.MENU_ITEMS, // 24 hours
      // Add stale-while-revalidate behavior
      onCacheEntryAdded: async (arg, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) => {
        try {
          // Wait for the initial query to resolve
          const initialData = await cacheDataLoaded;
          const beverageItems = initialData as unknown as MenuItem[];
          
          // Save to localStorage for ultra-fast loading
          localStorage.setItem('pos_cache_beverage_items', JSON.stringify({
            data: beverageItems,
            timestamp: Date.now()
          }));
          
          console.log(`💾 [posApi] Saved ${beverageItems.length} beverage menu items to localStorage`);
        } catch (e) {
          console.error('Error in onCacheEntryAdded for beverage menu items:', e);
        }
      }
    }),

    // ============================================================================
    // CATEGORIES ENDPOINTS
    // ============================================================================
    getCategoriesByType: builder.query<Category[], string>({
      query: (type) => `categories/type/${type}`,
      transformResponse: (response: any) => {
        return response?.totalItems || response?.data || response || [];
      },
      providesTags: (result, error, type) => [{ type: 'Categories', id: type }],
      keepUnusedDataFor: CACHE_CONFIG.CATEGORIES, // 24 hours
      // Add stale-while-revalidate behavior
      onCacheEntryAdded: async (arg, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) => {
        try {
          // Wait for the initial query to resolve
          const initialData = await cacheDataLoaded;
          const categories = initialData as unknown as Category[];
          
          // Save to localStorage for ultra-fast loading
          localStorage.setItem(`pos_cache_${arg}_categories`, JSON.stringify({
            data: categories,
            timestamp: Date.now()
          }));
          
          console.log(`💾 [posApi] Saved ${categories.length} ${arg} categories to localStorage`);
        } catch (e) {
          console.error(`Error in onCacheEntryAdded for ${arg} categories:`, e);
        }
      }
    }),

    // ============================================================================
    // DAY OPERATIONS ENDPOINTS
    // ============================================================================
    getCurrentDayOperation: builder.query<DayOperation, void>({
      query: () => 'day-operations/current',
      transformResponse: (response: any) => {
        return response?.dayOperation || response?.data || response;
      },
      providesTags: [{ type: 'DayOperations', id: 'CURRENT' }],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    getCurrentDayActivities: builder.query<ActivityLog[], void>({
      query: () => 'day-operations/current/activities',
      transformResponse: (response: any) => {
        return response?.activities || response?.data || response || [];
      },
      providesTags: [{ type: 'Activities', id: 'CURRENT' }],
      keepUnusedDataFor: 60, // 1 minute
    }),

    getUserOrderStats: builder.query<UserOrderStats[], void>({
      query: () => 'day-operations/current/user-stats',
      transformResponse: (response: any) => {
        return response?.stats || response?.data || response || [];
      },
      providesTags: [{ type: 'UserStats', id: 'CURRENT' }],
      keepUnusedDataFor: 120, // 2 minutes
    }),

    closeDay: builder.mutation<any, { closingCash: number; closedBy: string; notes?: string; userId: number }>({
      query: (data) => ({
        url: 'day-operations/close',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'DayOperations', id: 'CURRENT' },
        { type: 'Activities', id: 'CURRENT' },
        { type: 'UserStats', id: 'CURRENT' },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Orders
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useCompleteOrderMutation,
  useVoidOrderMutation,
  
  // Tables
  useGetTablesQuery,
  
  // Menu Items
  useGetFoodMenuItemsQuery,
  useGetBeverageMenuItemsQuery,
  
  // Categories
  useGetCategoriesByTypeQuery,
  
  // Day Operations
  useGetCurrentDayOperationQuery,
  useGetCurrentDayActivitiesQuery,
  useGetUserOrderStatsQuery,
  useCloseDayMutation,
} = posApi;

// Export endpoints for prefetching
export const {
  endpoints: {
    getOrders,
    getTables,
    getFoodMenuItems,
    getBeverageMenuItems,
    getCategoriesByType,
    getCurrentDayOperation,
  },
} = posApi;
