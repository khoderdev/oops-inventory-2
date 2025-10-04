import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ordersAPI } from "@/api/orders.api";
import { Order, OrderItem, OrderStatus, OrderSummary, CreateOrderData, UpdateOrderData, OrderType } from "@/types/orders";

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface OrdersState {
  // Orders data
  orders: OrderSummary[];
  orderDetails: Record<string, Order>; // Cache for full order details by ID
  draftOrders: Order[];
  staffOrders: Order[];
  tableOrders: Record<string, Order[]>; // Orders grouped by table ID

  // Current active order
  activeOrder: Order | null;
  activeOrderId: string | null;

  // Loading states
  isLoading: boolean;
  isLoadingDetails: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isCompleting: boolean;
  isCancelling: boolean;
  isVoiding: boolean;
  isAutoSaving: boolean;

  // Error states
  error: string | null;
  detailsError: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  completeError: string | null;
  cancelError: string | null;
  voidError: string | null;

  // Success messages
  successMessage: string | null;
  createSuccess: string | null;
  updateSuccess: string | null;
  deleteSuccess: string | null;
  completeSuccess: string | null;
  cancelSuccess: string | null;
  voidSuccess: string | null;

  // Filters
  filters: {
    status?: OrderStatus;
    orderType?: OrderType;
    tableId?: string;
    startDate?: string;
    endDate?: string;
  };

  // Pagination
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };

  // UI state
  selectedOrderIds: Set<string>;
  expandedOrderIds: Set<string>;

  // Last operation metadata
  lastOperation: {
    type: "create" | "update" | "delete" | "complete" | "cancel" | "void" | null;
    orderId: string | null;
    timestamp: number | null;
  };

  // Stock restoration data from void operations
  lastStockRestorations: Array<{
    materialId: string;
    itemName: string;
    quantityRestored: number;
    newStockLevel: number;
  }> | null;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: OrdersState = {
  orders: [],
  orderDetails: {},
  draftOrders: [],
  staffOrders: [],
  tableOrders: {},
  activeOrder: null,
  activeOrderId: null,
  isLoading: false,
  isLoadingDetails: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isCompleting: false,
  isCancelling: false,
  isVoiding: false,
  isAutoSaving: false,
  error: null,
  detailsError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  completeError: null,
  cancelError: null,
  voidError: null,
  successMessage: null,
  createSuccess: null,
  updateSuccess: null,
  deleteSuccess: null,
  completeSuccess: null,
  cancelSuccess: null,
  voidSuccess: null,
  filters: {},
  pagination: {
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false
  },
  selectedOrderIds: new Set(),
  expandedOrderIds: new Set(),
  lastOperation: {
    type: null,
    orderId: null,
    timestamp: null
  },
  lastStockRestorations: null
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

// Fetch all orders with optional filters
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (
    params: {
      status?: string;
      orderType?: string;
      tableId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await ordersAPI.getOrders(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

// Fetch staff/employee orders
export const fetchStaffOrders = createAsyncThunk(
  "orders/fetchStaffOrders",
  async (
    params: {
      status?: string;
      tableId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
      orderBy?: string;
      order?: "ASC" | "DESC";
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await ordersAPI.getStaffOrders(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch staff orders");
    }
  }
);

// Fetch a specific order by ID
export const fetchOrderById = createAsyncThunk("orders/fetchOrderById", async (orderId: string, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getOrder(orderId);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch order details");
  }
});

// Fetch orders for a specific table
export const fetchTableOrders = createAsyncThunk("orders/fetchTableOrders", async (tableId: string, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getTableOrders(tableId);
    return { tableId, orders: response.data };
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch table orders");
  }
});

// Fetch draft orders
export const fetchDraftOrders = createAsyncThunk("orders/fetchDraftOrders", async (_, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getDraftOrders();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch draft orders");
  }
});

// Create a new order
export const createOrder = createAsyncThunk("orders/createOrder", async (data: CreateOrderData, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.createOrder(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create order");
  }
});

// Update an existing order
export const updateOrder = createAsyncThunk("orders/updateOrder", async ({ orderId, data }: { orderId: string; data: UpdateOrderData }, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.updateOrder(orderId, data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update order");
  }
});

// Add items to an order
export const addOrderItems = createAsyncThunk("orders/addOrderItems", async ({ orderId, items }: { orderId: string; items: Omit<OrderItem, "id">[] }, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.addOrderItems(orderId, items);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to add items to order");
  }
});

// Remove items from an order
export const removeOrderItems = createAsyncThunk("orders/removeOrderItems", async ({ orderId, itemIds }: { orderId: string; itemIds: string[] }, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.removeOrderItems(orderId, itemIds);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to remove items from order");
  }
});

// Update order status
export const updateOrderStatus = createAsyncThunk("orders/updateOrderStatus", async ({ orderId, status }: { orderId: string; status: OrderStatus }, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.updateOrderStatus(orderId, status);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update order status");
  }
});

// Complete an order (convert to sale)
export const completeOrder = createAsyncThunk(
  "orders/completeOrder",
  async (
    {
      orderId,
      paymentData
    }: {
      orderId: string;
      paymentData: { paymentMethod: string; paymentAmount: number; change?: number };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await ordersAPI.completeOrder(orderId, paymentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to complete order");
    }
  }
);

// Cancel an order
export const cancelOrder = createAsyncThunk("orders/cancelOrder", async ({ orderId, reason }: { orderId: string; reason?: string }, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.cancelOrder(orderId, reason);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to cancel order");
  }
});

// Void an order with stock restoration
export const voidOrder = createAsyncThunk("orders/voidOrder", async ({ orderId, data }: { orderId: string; data: { reason?: string; restoreStock?: boolean } }, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.voidOrder(orderId, data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to void order");
  }
});

// Auto-save order (draft persistence)
export const autoSaveOrder = createAsyncThunk("orders/autoSaveOrder", async ({ orderId, data }: { orderId: string; data: Partial<CreateOrderData> }, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.autoSaveOrder(orderId, data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to auto-save order");
  }
});

// ============================================================================
// SLICE
// ============================================================================

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    // Set active order
    setActiveOrder: (state, action: PayloadAction<Order | null>) => {
      state.activeOrder = action.payload;
      state.activeOrderId = action.payload?.id || null;
    },

    // Set filters
    setFilters: (state, action: PayloadAction<Partial<OrdersState["filters"]>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: state => {
      state.filters = {};
    },

    // Set pagination
    setPagination: (state, action: PayloadAction<Partial<OrdersState["pagination"]>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Toggle order selection
    toggleOrderSelection: (state, action: PayloadAction<string>) => {
      const orderId = action.payload;
      const newSet = new Set(state.selectedOrderIds);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      state.selectedOrderIds = newSet;
    },

    // Select all orders
    selectAllOrders: state => {
      state.selectedOrderIds = new Set(state.orders.map(order => order.id));
    },

    // Clear order selection
    clearOrderSelection: state => {
      state.selectedOrderIds = new Set();
    },

    // Toggle order expansion
    toggleOrderExpansion: (state, action: PayloadAction<string>) => {
      const orderId = action.payload;
      const newSet = new Set(state.expandedOrderIds);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      state.expandedOrderIds = newSet;
    },

    // Clear all errors
    clearErrors: state => {
      state.error = null;
      state.detailsError = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
      state.completeError = null;
      state.cancelError = null;
      state.voidError = null;
    },

    // Clear all success messages
    clearSuccessMessages: state => {
      state.successMessage = null;
      state.createSuccess = null;
      state.updateSuccess = null;
      state.deleteSuccess = null;
      state.completeSuccess = null;
      state.cancelSuccess = null;
      state.voidSuccess = null;
    },

    // Clear specific error
    clearError: (state, action: PayloadAction<keyof Pick<OrdersState, "error" | "detailsError" | "createError" | "updateError" | "deleteError" | "completeError" | "cancelError" | "voidError">>) => {
      state[action.payload] = null;
    },

    // Clear specific success message
    clearSuccessMessage: (state, action: PayloadAction<keyof Pick<OrdersState, "successMessage" | "createSuccess" | "updateSuccess" | "deleteSuccess" | "completeSuccess" | "cancelSuccess" | "voidSuccess">>) => {
      state[action.payload] = null;
    },

    // Reset orders state
    resetOrdersState: () => initialState,

    // Update order in cache
    updateOrderInCache: (state, action: PayloadAction<Order>) => {
      const order = action.payload;
      state.orderDetails[order.id] = order;

      // Update in orders list if exists
      const orderIndex = state.orders.findIndex(o => o.id === order.id);
      if (orderIndex !== -1) {
        state.orders[orderIndex] = {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          orderType: order.orderType,
          tableNumber: order.tableNumber,
          customerName: order.customerName,
          total: order.total,
          itemCount: order.items.length,
          createdAt: order.createdAt,
          estimatedReadyTime: order.estimatedReadyTime,
          discountAmount: order.discountAmount || 0,
          notes: order.notes
        };
      }

      // Update active order if it's the same
      if (state.activeOrderId === order.id) {
        state.activeOrder = order;
      }
    },

    // Remove order from cache
    removeOrderFromCache: (state, action: PayloadAction<string>) => {
      const orderId = action.payload;
      delete state.orderDetails[orderId];
      state.orders = state.orders.filter(o => o.id !== orderId);
      state.draftOrders = state.draftOrders.filter(o => o.id !== orderId);
      state.staffOrders = state.staffOrders.filter(o => o.id !== orderId);

      // Clear from table orders
      Object.keys(state.tableOrders).forEach(tableId => {
        state.tableOrders[tableId] = state.tableOrders[tableId].filter(o => o.id !== orderId);
      });

      // Clear active order if it's the same
      if (state.activeOrderId === orderId) {
        state.activeOrder = null;
        state.activeOrderId = null;
      }
    },

    // Clear stock restorations
    clearStockRestorations: state => {
      state.lastStockRestorations = null;
    }
  },

  extraReducers: builder => {
    // ========================================================================
    // FETCH ORDERS
    // ========================================================================
    builder
      .addCase(fetchOrders.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
        state.pagination.total = action.payload.length;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // FETCH STAFF ORDERS
    // ========================================================================
    builder
      .addCase(fetchStaffOrders.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStaffOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffOrders = action.payload;
        state.error = null;
      })
      .addCase(fetchStaffOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // FETCH ORDER BY ID
    // ========================================================================
    builder
      .addCase(fetchOrderById.pending, state => {
        state.isLoadingDetails = true;
        state.detailsError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.orderDetails[action.payload.id] = action.payload;
        state.detailsError = null;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.detailsError = action.payload as string;
      });

    // ========================================================================
    // FETCH TABLE ORDERS
    // ========================================================================
    builder
      .addCase(fetchTableOrders.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTableOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tableOrders[action.payload.tableId] = action.payload.orders;
        state.error = null;
      })
      .addCase(fetchTableOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // FETCH DRAFT ORDERS
    // ========================================================================
    builder
      .addCase(fetchDraftOrders.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDraftOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.draftOrders = action.payload;
        state.error = null;
      })
      .addCase(fetchDraftOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // CREATE ORDER
    // ========================================================================
    builder
      .addCase(createOrder.pending, state => {
        state.isCreating = true;
        state.createError = null;
        state.createSuccess = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isCreating = false;
        state.createSuccess = "Order created successfully";
        state.orderDetails[action.payload.id] = action.payload;
        state.activeOrder = action.payload;
        state.activeOrderId = action.payload.id;
        state.lastOperation = {
          type: "create",
          orderId: action.payload.id,
          timestamp: Date.now()
        };

        // Add to draft orders if status is draft
        if (action.payload.status === "draft") {
          state.draftOrders.unshift(action.payload);
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload as string;
      });

    // ========================================================================
    // UPDATE ORDER
    // ========================================================================
    builder
      .addCase(updateOrder.pending, state => {
        state.isUpdating = true;
        state.updateError = null;
        state.updateSuccess = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.updateSuccess = "Order updated successfully";
        state.orderDetails[action.payload.id] = action.payload;

        // Update active order if it's the same
        if (state.activeOrderId === action.payload.id) {
          state.activeOrder = action.payload;
        }

        state.lastOperation = {
          type: "update",
          orderId: action.payload.id,
          timestamp: Date.now()
        };

        // Update in orders list
        const orderIndex = state.orders.findIndex(o => o.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = {
            id: action.payload.id,
            orderNumber: action.payload.orderNumber,
            status: action.payload.status,
            orderType: action.payload.orderType,
            tableNumber: action.payload.tableNumber,
            customerName: action.payload.customerName,
            total: action.payload.total,
            itemCount: action.payload.items.length,
            createdAt: action.payload.createdAt,
            estimatedReadyTime: action.payload.estimatedReadyTime,
            discountAmount: action.payload.discountAmount || 0,
            notes: action.payload.notes
          };
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // ========================================================================
    // ADD ORDER ITEMS
    // ========================================================================
    builder
      .addCase(addOrderItems.pending, state => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(addOrderItems.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.orderDetails[action.payload.id] = action.payload;

        // Update active order if it's the same
        if (state.activeOrderId === action.payload.id) {
          state.activeOrder = action.payload;
        }
      })
      .addCase(addOrderItems.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // ========================================================================
    // REMOVE ORDER ITEMS
    // ========================================================================
    builder
      .addCase(removeOrderItems.pending, state => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(removeOrderItems.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.orderDetails[action.payload.id] = action.payload;

        // Update active order if it's the same
        if (state.activeOrderId === action.payload.id) {
          state.activeOrder = action.payload;
        }
      })
      .addCase(removeOrderItems.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // ========================================================================
    // UPDATE ORDER STATUS
    // ========================================================================
    builder
      .addCase(updateOrderStatus.pending, state => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.updateSuccess = "Order status updated successfully";
        state.orderDetails[action.payload.id] = action.payload;

        // Update active order if it's the same
        if (state.activeOrderId === action.payload.id) {
          state.activeOrder = action.payload;
        }

        // Update in orders list
        const orderIndex = state.orders.findIndex(o => o.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = action.payload.status;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // ========================================================================
    // COMPLETE ORDER
    // ========================================================================
    builder
      .addCase(completeOrder.pending, state => {
        state.isCompleting = true;
        state.completeError = null;
        state.completeSuccess = null;
      })
      .addCase(completeOrder.fulfilled, (state, action) => {
        state.isCompleting = false;
        state.completeSuccess = `Order completed successfully. Sale ID: ${action.payload.saleId}`;
        state.orderDetails[action.payload.order.id] = action.payload.order;

        state.lastOperation = {
          type: "complete",
          orderId: action.payload.order.id,
          timestamp: Date.now()
        };

        // Remove from draft orders
        state.draftOrders = state.draftOrders.filter(o => o.id !== action.payload.order.id);

        // Clear active order if it's the same
        if (state.activeOrderId === action.payload.order.id) {
          state.activeOrder = null;
          state.activeOrderId = null;
        }
      })
      .addCase(completeOrder.rejected, (state, action) => {
        state.isCompleting = false;
        state.completeError = action.payload as string;
      });

    // ========================================================================
    // CANCEL ORDER
    // ========================================================================
    builder
      .addCase(cancelOrder.pending, state => {
        state.isCancelling = true;
        state.cancelError = null;
        state.cancelSuccess = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isCancelling = false;
        state.cancelSuccess = "Order cancelled successfully";
        state.orderDetails[action.payload.id] = action.payload;

        state.lastOperation = {
          type: "cancel",
          orderId: action.payload.id,
          timestamp: Date.now()
        };

        // Update in orders list
        const orderIndex = state.orders.findIndex(o => o.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = action.payload.status;
        }

        // Clear active order if it's the same
        if (state.activeOrderId === action.payload.id) {
          state.activeOrder = null;
          state.activeOrderId = null;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isCancelling = false;
        state.cancelError = action.payload as string;
      });

    // ========================================================================
    // VOID ORDER
    // ========================================================================
    builder
      .addCase(voidOrder.pending, state => {
        state.isVoiding = true;
        state.voidError = null;
        state.voidSuccess = null;
      })
      .addCase(voidOrder.fulfilled, (state, action) => {
        state.isVoiding = false;
        state.voidSuccess = "Order voided successfully";
        state.orderDetails[action.payload.order.id] = action.payload.order;
        state.lastStockRestorations = action.payload.stockRestorations || null;

        state.lastOperation = {
          type: "void",
          orderId: action.payload.order.id,
          timestamp: Date.now()
        };

        // Update in orders list
        const orderIndex = state.orders.findIndex(o => o.id === action.payload.order.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = action.payload.order.status;
        }

        // Clear active order if it's the same
        if (state.activeOrderId === action.payload.order.id) {
          state.activeOrder = null;
          state.activeOrderId = null;
        }
      })
      .addCase(voidOrder.rejected, (state, action) => {
        state.isVoiding = false;
        state.voidError = action.payload as string;
      });

    // ========================================================================
    // AUTO-SAVE ORDER
    // ========================================================================
    builder
      .addCase(autoSaveOrder.pending, state => {
        state.isAutoSaving = true;
      })
      .addCase(autoSaveOrder.fulfilled, (state, action) => {
        state.isAutoSaving = false;
        state.orderDetails[action.payload.id] = action.payload;

        // Update active order if it's the same
        if (state.activeOrderId === action.payload.id) {
          state.activeOrder = action.payload;
        }

        // Update in draft orders
        const draftIndex = state.draftOrders.findIndex(o => o.id === action.payload.id);
        if (draftIndex !== -1) {
          state.draftOrders[draftIndex] = action.payload;
        }
      })
      .addCase(autoSaveOrder.rejected, state => {
        state.isAutoSaving = false;
        // Silent failure for auto-save
      });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export const { setActiveOrder, setFilters, clearFilters, setPagination, toggleOrderSelection, selectAllOrders, clearOrderSelection, toggleOrderExpansion, clearErrors, clearSuccessMessages, clearError, clearSuccessMessage, resetOrdersState, updateOrderInCache, removeOrderFromCache, clearStockRestorations } = ordersSlice.actions;

export default ordersSlice.reducer;
