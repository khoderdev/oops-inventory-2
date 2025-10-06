/**
 * RTK Query API for POS Data
 * Centralized API with automatic caching, deduplication, and polling
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Order, OrderSummary, CreateOrderData, UpdateOrderData } from '@/types/orders';
import { Table } from '@/types/inventory';
import { MenuItem } from '@/types/inventory';
import { Category } from '@/types/categories';
import { DayOperation, ActivityLog } from '@/types/inventory';
import { UserOrderStats } from '@/types/dayOperations';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const posApi = createApi({
  reducerPath: 'posApi',
  baseQuery: fetchBaseQuery({
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
  }),
  tagTypes: ['Orders', 'Tables', 'MenuItems', 'Categories', 'DayOperations', 'Activities', 'UserStats'],
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
      // Keep fresh for 30 seconds
      keepUnusedDataFor: 30,
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
      keepUnusedDataFor: 120, // 2 minutes
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
      keepUnusedDataFor: 300, // 5 minutes
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
      keepUnusedDataFor: 300, // 5 minutes
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
      keepUnusedDataFor: 600, // 10 minutes
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
