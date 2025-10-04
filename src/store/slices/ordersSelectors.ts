import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store";
import { OrderStatus, OrderType } from "@/types/orders";

// ============================================================================
// BASE SELECTORS
// ============================================================================

export const selectOrdersState = (state: RootState) => state.orders;

export const selectOrders = (state: RootState) => state.orders.orders;
export const selectOrderDetails = (state: RootState) => state.orders.orderDetails;
export const selectDraftOrders = (state: RootState) => state.orders.draftOrders;
export const selectStaffOrders = (state: RootState) => state.orders.staffOrders;
export const selectTableOrders = (state: RootState) => state.orders.tableOrders;

export const selectActiveOrder = (state: RootState) => state.orders.activeOrder;
export const selectActiveOrderId = (state: RootState) => state.orders.activeOrderId;

export const selectFilters = (state: RootState) => state.orders.filters;
export const selectPagination = (state: RootState) => state.orders.pagination;

export const selectSelectedOrderIds = (state: RootState) => state.orders.selectedOrderIds;
export const selectExpandedOrderIds = (state: RootState) => state.orders.expandedOrderIds;

export const selectLastOperation = (state: RootState) => state.orders.lastOperation;
export const selectLastStockRestorations = (state: RootState) => state.orders.lastStockRestorations;

// ============================================================================
// LOADING STATE SELECTORS
// ============================================================================

export const selectIsLoading = (state: RootState) => state.orders.isLoading;
export const selectIsLoadingDetails = (state: RootState) => state.orders.isLoadingDetails;
export const selectIsCreating = (state: RootState) => state.orders.isCreating;
export const selectIsUpdating = (state: RootState) => state.orders.isUpdating;
export const selectIsDeleting = (state: RootState) => state.orders.isDeleting;
export const selectIsCompleting = (state: RootState) => state.orders.isCompleting;
export const selectIsCancelling = (state: RootState) => state.orders.isCancelling;
export const selectIsVoiding = (state: RootState) => state.orders.isVoiding;
export const selectIsAutoSaving = (state: RootState) => state.orders.isAutoSaving;

// Combined loading state
export const selectIsAnyLoading = createSelector(
  [
    selectIsLoading,
    selectIsLoadingDetails,
    selectIsCreating,
    selectIsUpdating,
    selectIsDeleting,
    selectIsCompleting,
    selectIsCancelling,
    selectIsVoiding,
  ],
  (isLoading, isLoadingDetails, isCreating, isUpdating, isDeleting, isCompleting, isCancelling, isVoiding) =>
    isLoading || isLoadingDetails || isCreating || isUpdating || isDeleting || isCompleting || isCancelling || isVoiding
);

// ============================================================================
// ERROR STATE SELECTORS
// ============================================================================

export const selectError = (state: RootState) => state.orders.error;
export const selectDetailsError = (state: RootState) => state.orders.detailsError;
export const selectCreateError = (state: RootState) => state.orders.createError;
export const selectUpdateError = (state: RootState) => state.orders.updateError;
export const selectDeleteError = (state: RootState) => state.orders.deleteError;
export const selectCompleteError = (state: RootState) => state.orders.completeError;
export const selectCancelError = (state: RootState) => state.orders.cancelError;
export const selectVoidError = (state: RootState) => state.orders.voidError;

// Combined error state
export const selectAnyError = createSelector(
  [
    selectError,
    selectDetailsError,
    selectCreateError,
    selectUpdateError,
    selectDeleteError,
    selectCompleteError,
    selectCancelError,
    selectVoidError,
  ],
  (error, detailsError, createError, updateError, deleteError, completeError, cancelError, voidError) =>
    error || detailsError || createError || updateError || deleteError || completeError || cancelError || voidError
);

// ============================================================================
// SUCCESS MESSAGE SELECTORS
// ============================================================================

export const selectSuccessMessage = (state: RootState) => state.orders.successMessage;
export const selectCreateSuccess = (state: RootState) => state.orders.createSuccess;
export const selectUpdateSuccess = (state: RootState) => state.orders.updateSuccess;
export const selectDeleteSuccess = (state: RootState) => state.orders.deleteSuccess;
export const selectCompleteSuccess = (state: RootState) => state.orders.completeSuccess;
export const selectCancelSuccess = (state: RootState) => state.orders.cancelSuccess;
export const selectVoidSuccess = (state: RootState) => state.orders.voidSuccess;

// Combined success message
export const selectAnySuccessMessage = createSelector(
  [
    selectSuccessMessage,
    selectCreateSuccess,
    selectUpdateSuccess,
    selectDeleteSuccess,
    selectCompleteSuccess,
    selectCancelSuccess,
    selectVoidSuccess,
  ],
  (successMessage, createSuccess, updateSuccess, deleteSuccess, completeSuccess, cancelSuccess, voidSuccess) =>
    successMessage || createSuccess || updateSuccess || deleteSuccess || completeSuccess || cancelSuccess || voidSuccess
);

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

// Get order by ID from cache
export const selectOrderById = (orderId: string) =>
  createSelector([selectOrderDetails], (orderDetails) => orderDetails[orderId] || null);

// Get orders for a specific table
export const selectOrdersByTableId = (tableId: string) =>
  createSelector([selectTableOrders], (tableOrders) => tableOrders[tableId] || []);

// Get filtered orders based on current filters
export const selectFilteredOrders = createSelector(
  [selectOrders, selectFilters],
  (orders, filters) => {
    let filtered = [...orders];

    if (filters.status) {
      filtered = filtered.filter((order) => order.status === filters.status);
    }

    if (filters.orderType) {
      filtered = filtered.filter((order) => order.orderType === filters.orderType);
    }

    if (filters.tableId) {
      filtered = filtered.filter((order) => order.tableNumber?.toString() === filters.tableId);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter((order) => new Date(order.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter((order) => new Date(order.createdAt) <= endDate);
    }

    return filtered;
  }
);

// Get orders by status
export const selectOrdersByStatus = (status: OrderStatus) =>
  createSelector([selectOrders], (orders) => orders.filter((order) => order.status === status));

// Get orders by type
export const selectOrdersByType = (orderType: OrderType) =>
  createSelector([selectOrders], (orders) => orders.filter((order) => order.orderType === orderType));

// Get pending orders (draft, confirmed, preparing)
export const selectPendingOrders = createSelector([selectOrders], (orders) =>
  orders.filter((order) => ["draft", "confirmed", "preparing"].includes(order.status))
);

// Get active orders (not cancelled or completed)
export const selectActiveOrders = createSelector([selectOrders], (orders) =>
  orders.filter((order) => !["cancelled", "completed", "paid"].includes(order.status))
);

// Get completed orders
export const selectCompletedOrders = createSelector([selectOrders], (orders) =>
  orders.filter((order) => order.status === "completed" || order.status === "paid")
);

// Get cancelled orders
export const selectCancelledOrders = createSelector([selectOrders], (orders) =>
  orders.filter((order) => order.status === "cancelled")
);

// Count orders by status
export const selectOrderCountByStatus = createSelector([selectOrders], (orders) => {
  const counts: Record<OrderStatus, number> = {
    draft: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    paid: 0,
    cancelled: 0,
    completed: 0,
  };

  orders.forEach((order) => {
    counts[order.status] = (counts[order.status] || 0) + 1;
  });

  return counts;
});

// Count orders by type
export const selectOrderCountByType = createSelector([selectOrders], (orders) => {
  const counts: Record<OrderType, number> = {
    delivery: 0,
    takeaway: 0,
    table: 0,
    employees: 0,
    bar: 0,
  };

  orders.forEach((order) => {
    counts[order.orderType] = (counts[order.orderType] || 0) + 1;
  });

  return counts;
});

// Get total revenue from orders
export const selectTotalRevenue = createSelector([selectOrders], (orders) =>
  orders.reduce((total, order) => {
    if (order.status === "completed" || order.status === "paid") {
      return total + order.total;
    }
    return total;
  }, 0)
);

// Get total items count across all orders
export const selectTotalItemsCount = createSelector([selectOrders], (orders) =>
  orders.reduce((total, order) => total + order.itemCount, 0)
);

// Get selected orders
export const selectSelectedOrders = createSelector(
  [selectOrders, selectSelectedOrderIds],
  (orders, selectedIds) => orders.filter((order) => selectedIds.has(order.id))
);

// Get selected orders count
export const selectSelectedOrdersCount = createSelector(
  [selectSelectedOrderIds],
  (selectedIds) => selectedIds.size
);

// Check if all orders are selected
export const selectAreAllOrdersSelected = createSelector(
  [selectOrders, selectSelectedOrderIds],
  (orders, selectedIds) => orders.length > 0 && orders.length === selectedIds.size
);

// Get expanded orders
export const selectExpandedOrders = createSelector(
  [selectOrders, selectExpandedOrderIds],
  (orders, expandedIds) => orders.filter((order) => expandedIds.has(order.id))
);

// Check if order is selected
export const selectIsOrderSelected = (orderId: string) =>
  createSelector([selectSelectedOrderIds], (selectedIds) => selectedIds.has(orderId));

// Check if order is expanded
export const selectIsOrderExpanded = (orderId: string) =>
  createSelector([selectExpandedOrderIds], (expandedIds) => expandedIds.has(orderId));

// Get orders sorted by creation date (newest first)
export const selectOrdersSortedByDate = createSelector([selectOrders], (orders) =>
  [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
);

// Get orders sorted by total (highest first)
export const selectOrdersSortedByTotal = createSelector([selectOrders], (orders) =>
  [...orders].sort((a, b) => b.total - a.total)
);

// Get recent orders (last 24 hours)
export const selectRecentOrders = createSelector([selectOrders], (orders) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return orders.filter((order) => new Date(order.createdAt) >= yesterday);
});

// Get today's orders
export const selectTodaysOrders = createSelector([selectOrders], (orders) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });
});

// Get orders with discounts
export const selectOrdersWithDiscounts = createSelector([selectOrders], (orders) =>
  orders.filter((order) => order.discountAmount && order.discountAmount > 0)
);

// Get total discount amount
export const selectTotalDiscountAmount = createSelector([selectOrders], (orders) =>
  orders.reduce((total, order) => total + (order.discountAmount || 0), 0)
);

// Get average order value
export const selectAverageOrderValue = createSelector([selectOrders], (orders) => {
  if (orders.length === 0) return 0;
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  return total / orders.length;
});

// Get orders statistics
export const selectOrdersStatistics = createSelector(
  [
    selectOrders,
    selectOrderCountByStatus,
    selectOrderCountByType,
    selectTotalRevenue,
    selectTotalItemsCount,
    selectAverageOrderValue,
    selectTotalDiscountAmount,
  ],
  (orders, countByStatus, countByType, totalRevenue, totalItemsCount, averageOrderValue, totalDiscountAmount) => ({
    totalOrders: orders.length,
    countByStatus,
    countByType,
    totalRevenue,
    totalItemsCount,
    averageOrderValue,
    totalDiscountAmount,
  })
);

// Get table statistics
export const selectTableStatistics = createSelector([selectTableOrders], (tableOrders) => {
  const stats: Record<string, { orderCount: number; totalRevenue: number; activeOrders: number }> = {};

  Object.entries(tableOrders).forEach(([tableId, orders]) => {
    stats[tableId] = {
      orderCount: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      activeOrders: orders.filter((order) => !["cancelled", "completed", "paid"].includes(order.status)).length,
    };
  });

  return stats;
});

// Check if there are unsaved changes
export const selectHasUnsavedChanges = createSelector(
  [selectActiveOrder, selectIsAutoSaving],
  (activeOrder, isAutoSaving) => {
    if (!activeOrder) return false;
    return activeOrder.status === "draft" && !isAutoSaving;
  }
);

// Get draft orders count
export const selectDraftOrdersCount = createSelector(
  [selectDraftOrders],
  (draftOrders) => draftOrders.length
);

// Get staff orders count
export const selectStaffOrdersCount = createSelector(
  [selectStaffOrders],
  (staffOrders) => staffOrders.length
);

// Get orders requiring attention (ready to serve, etc.)
export const selectOrdersRequiringAttention = createSelector([selectOrders], (orders) =>
  orders.filter((order) => order.status === "ready" || order.status === "preparing")
);

// Get orders requiring attention count
export const selectOrdersRequiringAttentionCount = createSelector(
  [selectOrdersRequiringAttention],
  (orders) => orders.length
);
