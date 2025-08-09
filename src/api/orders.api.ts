import api from "@/lib/http";
import { CreateOrderData, Order, OrderItem, OrderStatus, OrderSummary, UpdateOrderData } from "@/types/orders";
import { InternalAxiosRequestConfig } from "axios";

export const ordersAPI = {
  // Create a new draft order
  createOrder: (data: CreateOrderData) => api.post<Order, CreateOrderData>("/orders", data),

  // Get all orders with optional filters
  getOrders: (params?: { status?: string; orderType?: string; tableId?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }) => 
    api.get<OrderSummary[]>("/orders", params ? { params } as InternalAxiosRequestConfig : undefined),

  // Get a specific order by ID
  getOrder: (orderId: string) => api.get<Order>(`/orders/${orderId}`),

  // Update an existing orders
  updateOrder: (orderId: string, data: UpdateOrderData) => api.put<Order, UpdateOrderData>(`/orders/${orderId}`, data),

  // Add items to an existing order
  addOrderItems: (orderId: string, items: Omit<OrderItem, "id">[]) => api.post<Order, { items: Omit<OrderItem, "id">[] }>(`/orders/${orderId}/items`, { items }),

  // Remove items from an order
  removeOrderItems: (orderId: string, itemIds: string[]) => 
    api.delete<Order>(`/orders/${orderId}/items`, { 
      data: { itemIds }
    } as InternalAxiosRequestConfig),

  // Update order status
  updateOrderStatus: (orderId: string, status: OrderStatus) => api.patch<Order, { status: OrderStatus }>(`/orders/${orderId}/status`, { status }),

  // Complete order (convert to sale)
  completeOrder: (
    orderId: string,
    paymentData: { paymentMethod: string; paymentAmount: number; change?: number; }
  ) => api.post<{ order: Order; saleId: string }, { paymentData: { paymentMethod: string; paymentAmount: number; change?: number } }>(`/orders/${orderId}/complete`, { paymentData }),

  // Cancel an order
  cancelOrder: (orderId: string, reason?: string) => api.patch<Order, { reason?: string }>(`/orders/${orderId}/cancel`, { reason }),

  // Void an order (enhanced cancellation with stock restoration)
  voidOrder: (orderId: string, data: { reason?: string; restoreStock?: boolean }) => 
    api.patch<{ order: Order; stockRestorations?: Array<{ materialId: string; itemName: string; quantityRestored: number; newStockLevel: number }> }, { reason?: string; restoreStock?: boolean }>(`/orders/${orderId}/void`, data),

  // Get active orders for a table
  getTableOrders: (tableId: string) => api.get<Order[]>(`/orders/table/${tableId}`),

  // Get draft orders (unsaved carts)
  getDraftOrders: () => api.get<Order[]>("/orders/drafts"),

  // Auto-save order (for draft persistence)
  autoSaveOrder: (orderId: string, data: Partial<CreateOrderData>) => api.patch<Order, Partial<CreateOrderData>>(`/orders/${orderId}/autosave`, data)
};
