import { ordersAPI } from "@/api/orders.api";
import { CreateOrderData, Order, OrderStatus, UpdateOrderData } from "@/types/orders";
import { useCallback, useEffect, useRef, useState } from "react";

export const useOrderManagement = () => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Create a new order
  const createOrder = useCallback(async (data: CreateOrderData): Promise<Order> => {
    setIsLoading(true);
    setError(null);
    try {
      const orderData = {
        ...data
      };
      const response = await ordersAPI.createOrder(orderData);
      const newOrder = response.data;
      setCurrentOrder(newOrder);
      return newOrder;
    } catch (error: unknown) {
      console.error("❌ Order creation failed with error:", error);
      console.error("🔍 Error details:", {
        message: (error as any)?.message,
        response: (error as any)?.response,
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data
      });
      const errorMessage = (error as any)?.response?.data?.message || "Failed to create order";
      console.error("🚨 Setting error message:", errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load an existing order
  const loadOrder = useCallback(async (orderId: string): Promise<Order> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersAPI.getOrder(orderId);
      const responseData = response.data as { data?: any } | any;
      const order = responseData.data || responseData;
      setCurrentOrder(order);
      return order;
    } catch (error: unknown) {
      const errorMessage = (error as any)?.response?.data?.message || "Failed to load order";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update current order - accepts either just data (using currentOrder.id) or both orderId and data
  const updateOrder = useCallback(
    async (orderIdOrData: string | UpdateOrderData, maybeData?: UpdateOrderData): Promise<Order> => {
      // Determine if we're using (orderId, data) or just (data)
      let orderId: string;
      let data: UpdateOrderData;
      
      if (typeof orderIdOrData === 'string') {
        // Called with (orderId, data)
        orderId = orderIdOrData;
        data = maybeData as UpdateOrderData;
        console.log(`🔄 updateOrder called with explicit orderId: ${orderId}`);
      } else {
        // Called with just (data)
        if (!currentOrder) {
          throw new Error("No current order to update");
        }
        data = orderIdOrData;
        orderId = currentOrder.id || (currentOrder as any)?.data?.id;
        if (!orderId) {
          throw new Error("No valid order ID found in currentOrder");
        }
        console.log(`🔄 updateOrder using currentOrder.id: ${orderId}`);
      }
      
      setIsLoading(true);
      setError(null);
      try {
        console.log(`📝 Calling ordersAPI.updateOrder with ID: ${orderId}`);
        const response = await ordersAPI.updateOrder(orderId, data);
        const responseData = response.data as { data?: any } | any;
        const updatedOrder = responseData.data || responseData;
        setCurrentOrder(updatedOrder);
        console.log(`✅ Order updated successfully:`, updatedOrder);
        return updatedOrder;
      } catch (error: unknown) {
        console.error(`❌ Order update failed:`, error);
        const errorMessage = (error as any)?.response?.data?.message || "Failed to update order";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrder]
  );

  // Update order status
  const updateOrderStatus = useCallback(
    async (status: OrderStatus): Promise<Order> => {
      if (!currentOrder) {
        throw new Error("No current order to update");
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await ordersAPI.updateOrderStatus(currentOrder.id, status);
        const updatedOrder = response.data;
        setCurrentOrder(updatedOrder);
        return updatedOrder;
      } catch (error: unknown) {
        const errorMessage = (error as any)?.response?.data?.message || "Failed to update order status";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrder]
  );

  // Complete order (convert to sale)
  const completeOrder = useCallback(
    async (paymentData: { paymentMethod: string; paymentAmount: number; change?: number }) => {
      if (!currentOrder) {
        throw new Error("No current order to complete");
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await ordersAPI.completeOrder(currentOrder.id, paymentData);
        const { order, saleId } = response.data;
        // Clear current order after completion
        setCurrentOrder(null);
        return { order, saleId };
      } catch (error: unknown) {
        const errorMessage = (error as any)?.response?.data?.message || "Failed to complete order";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrder]
  );

  // Void order (enhanced cancellation with stock restoration)
  const voidOrder = useCallback(
    async (reason?: string, restoreStock: boolean = true) => {
      if (!currentOrder) {
        throw new Error("No current order to void");
      }
      setIsLoading(true);
      setError(null);
      try {
        const orderId = currentOrder.id || (currentOrder as any)?.data?.id;
        if (!orderId) {
          throw new Error("No valid order ID found in currentOrder");
        }
        const response = await ordersAPI.voidOrder(orderId, {
          reason: reason || "Order voided by user",
          restoreStock
        });
        const responseData = response.data as { order?: any; stockRestorations?: any[] } | any;
        const voidedOrder = responseData.order || responseData;
        const stockRestorations = responseData.stockRestorations;
        setCurrentOrder(null);
        let successMessage = "Order voided successfully";
        if (stockRestorations && stockRestorations.length > 0) {
          successMessage += `. Stock restored for ${stockRestorations.length} item(s).`;
        }
        return { order: voidedOrder, stockRestorations };
      } catch (error: unknown) {
        const errorMessage = (error as any)?.response?.data?.message || "Failed to void order";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrder]
  );

  // Clear current order
  const clearOrder = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setCurrentOrder(null);
    setError(null);
    lastSavedRef.current = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentOrder,
    isLoading,
    error,
    createOrder,
    loadOrder,
    updateOrder,
    updateOrderStatus,
    completeOrder,
    voidOrder,
    clearOrder
  };
};
