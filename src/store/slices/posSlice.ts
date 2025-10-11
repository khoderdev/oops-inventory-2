import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ordersAPI } from "@/api/orders.api";
import { salesAPI } from "@/api/sales.api.ts.tsx";
import { POSCartItem, SaleRecord, ReceiptData, Table, NegativeStockWarning } from "@/types/inventory";
import { Order, OrderStatus, OrderType, CreateOrderData, UpdateOrderData } from "@/types/orders";
import { Employee } from "@/types/employee";
import { posApi } from "@/store/api/posApi";

// Define the state structure
interface POSState {
  // Cart state
  cart: POSCartItem[];
  cartBackup: POSCartItem[] | null; // Backup for rollback on error
  hasUnsavedChanges: boolean;
  isPaymentCompleted: boolean;
  editingSaleId: string | null; // Track the ID of the sale being edited

  // Order details
  currentOrder: Order | null; // Current order being edited/created
  previewOrderNumber: string; // Preview order number for new orders
  orderType: OrderType;
  selectedTable: Table | null;
  selectedEmployee: Employee | null;
  orderNotes: string;

  // Discount state
  appliedDiscount: {
    type: "percentage" | "fixed";
    value: number;
    amount: number;
    reason?: string;
  } | null;

  // Receipt state
  lastSaleData: ReceiptData | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  showSuccessCheckmark: boolean;

  // Dialogs state
  showPaymentDialog: boolean;
  showReceiptDialog: boolean;
  showTablesLayout: boolean;
  showDiscountDialog: boolean;
  showNotesDialog: boolean;
  showItemNotesDialog: boolean;
  showVoidDialog: boolean;
  showOrdersDialog: boolean;
  showReportsDialog: boolean;
  showPrinterSelector: boolean;

  // Selected item for notes
  selectedItemForNotes: POSCartItem | null;

  // Stock warnings
  negativeStockWarnings: NegativeStockWarning[];
  showNegativeStockDialog: boolean;

  // Flags
  isTableManuallySelected: boolean;
  isPOSActionInProgress: boolean;

  // Payment dialog state
  paymentAmount: string;

  // Day close dialog state
  showDayCloseDialog: boolean;
  closingCash: string;
  dayCloseNotes: string;

  // Printer selection state
  printerSelectionContext: "payment" | "manual_print" | null;

  // Sales history state
  salesHistory: SaleRecord[];
  selectedSaleForEdit: SaleRecord | null;

  // Sales history filters
  selectedItemFilter: string;
  selectedSectionFilter: string;
  dateFilter: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  viewMode: "all" | "staff";
  staffSales: SaleRecord[];
  isLoadingStaff: boolean;
  staffError: string | null;
  selectedItemIds: string[];
  isPrintingReport: boolean;
  showSalesReportDialog: boolean;
  salesReportData: ReceiptData | null;
  uniqueItemNames: string[];
  uniqueSectionNames: string[];

  // Sales operations state
  isDeleting: boolean;
  isReverting: boolean;
  revertSuccess: string | null;
  deleteSuccess: string | null;
  isBulkDeleting: boolean;
  isBulkReverting: boolean;
  revertDialogOpen: boolean;
  deleteDialogOpen: boolean;
  bulkDeleteSuccess: string | null;
  bulkRevertSuccess: string | null;
  bulkRevertDialogOpen: boolean;
  bulkDeleteDialogOpen: boolean;
  selectedSaleForRevert: SaleRecord | null;
  selectedSaleForDelete: SaleRecord | null;
  stockRestorationReport: any[];
  stockRestorationModalOpen: boolean;
  bulkStockRestorationReport: any[];
  deleteConfirmationModalOpen: boolean;
  selectedItemForDelete: {
    saleId: string;
    itemId: string;
    itemType: "material" | "menu";
    itemName: string;
  } | null;
}

// Initial state
const initialState: POSState = {
  // Cart state
  cart: [],
  cartBackup: null,
  hasUnsavedChanges: false,
  isPaymentCompleted: false,
  editingSaleId: null,

  // Order details
  currentOrder: null,
  previewOrderNumber: "ORD-XXXX",
  orderType: "takeaway",
  selectedTable: null,
  selectedEmployee: null,
  orderNotes: "",

  // Discount state
  appliedDiscount: null,

  // Receipt state
  lastSaleData: null,

  // UI state
  isLoading: false,
  error: null,
  successMessage: null,
  showSuccessCheckmark: false,

  // Dialogs state
  showPaymentDialog: false,
  showReceiptDialog: false,
  showTablesLayout: false,
  showDiscountDialog: false,
  showNotesDialog: false,
  showItemNotesDialog: false,
  showVoidDialog: false,
  showOrdersDialog: false,
  showReportsDialog: false,
  showPrinterSelector: false,

  // Selected item for notes
  selectedItemForNotes: null,

  // Stock warnings
  negativeStockWarnings: [],
  showNegativeStockDialog: false,

  // Flags
  isTableManuallySelected: false,
  isPOSActionInProgress: false,

  // Payment dialog state
  paymentAmount: "",

  // Day close dialog state
  showDayCloseDialog: false,
  closingCash: "",
  dayCloseNotes: "",

  // Printer selection state
  printerSelectionContext: null,

  // Sales history state
  salesHistory: [],
  selectedSaleForEdit: null,

  // Sales history filters
  selectedItemFilter: "all",
  selectedSectionFilter: "all",
  dateFilter: "",
  dateFrom: null,
  dateTo: null,
  viewMode: "all",
  staffSales: [],
  isLoadingStaff: false,
  staffError: null,
  selectedItemIds: [],
  isPrintingReport: false,
  showSalesReportDialog: false,
  salesReportData: null,
  uniqueItemNames: [],
  uniqueSectionNames: [],

  // Sales operations state
  isDeleting: false,
  isReverting: false,
  revertSuccess: null,
  deleteSuccess: null,
  isBulkDeleting: false,
  isBulkReverting: false,
  revertDialogOpen: false,
  deleteDialogOpen: false,
  bulkDeleteSuccess: null,
  bulkRevertSuccess: null,
  bulkRevertDialogOpen: false,
  bulkDeleteDialogOpen: false,
  selectedSaleForRevert: null,
  selectedSaleForDelete: null,
  stockRestorationReport: [],
  stockRestorationModalOpen: false,
  bulkStockRestorationReport: [],
  deleteConfirmationModalOpen: false,
  selectedItemForDelete: null
};

// Async thunks
export const fetchSalesHistory = createAsyncThunk("pos/fetchSalesHistory", async (_, { rejectWithValue, dispatch }) => {
  try {
    dispatch(setIsLoading(true));
    const response = await salesAPI.getSales();
    dispatch(setIsLoading(false));
    return response.data;
  } catch (error: any) {
    dispatch(setIsLoading(false));
    dispatch(setError(error.response?.data?.message || "Failed to fetch sales history"));
    return rejectWithValue(error.response?.data?.message || "Failed to fetch sales history");
  }
});

export const loadOrder = createAsyncThunk("pos/loadOrder", async (orderId: string, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getOrder(orderId);
    const responseData = response.data as { data?: any } | any;
    const order = responseData.data || responseData;
    return order;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to load order");
  }
});

export const createOrder = createAsyncThunk("pos/createOrder", async (data: CreateOrderData, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.createOrder(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to create order");
  }
});

export const updateOrder = createAsyncThunk("pos/updateOrder", async ({ orderId, data }: { orderId: string; data: UpdateOrderData }, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.updateOrder(orderId, data);
    const responseData = response.data as { data?: any } | any;
    const updatedOrder = responseData.data || responseData;
    return updatedOrder;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to update order");
  }
});

export const completeOrder = createAsyncThunk("pos/completeOrder", async ({ orderId, paymentData }: { orderId: string; paymentData: { paymentMethod: string; paymentAmount: number; change?: number } }, { rejectWithValue, dispatch }) => {
  try {
    const response = await ordersAPI.completeOrder(orderId, paymentData);

    // Invalidate RTK Query cache for orders and tables
    dispatch(posApi.util.invalidateTags(["Orders", "Tables"]));

    // Immediately refresh sales history so UI updates instantly
    dispatch(fetchSalesHistory());

    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to complete order");
  }
});

export const voidOrder = createAsyncThunk("pos/voidOrder", async ({ orderId, reason, restoreStock = true }: { orderId: string; reason?: string; restoreStock?: boolean }, { rejectWithValue, dispatch }) => {
  try {
    const response = await ordersAPI.voidOrder(orderId, {
      reason: reason || "Order voided by user",
      restoreStock
    });
    const responseData = response.data as { order?: any; stockRestorations?: any[] } | any;
    const voidedOrder = responseData.order || responseData;
    const stockRestorations = responseData.stockRestorations;

    // Invalidate RTK Query cache for orders and tables
    dispatch(posApi.util.invalidateTags(["Orders", "Tables"]));

    // Refresh sales history after voiding to reflect changes instantly
    dispatch(fetchSalesHistory());

    return { order: voidedOrder, stockRestorations };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to void order");
  }
});

export const addOrderItems = createAsyncThunk("pos/addOrderItems", async ({ orderId, items }: { orderId: string; items: Omit<any, "id">[] }, { rejectWithValue, dispatch }) => {
  try {
    const response = await ordersAPI.addOrderItems(orderId, items);

    // Invalidate orders cache when items are added
    dispatch(posApi.util.invalidateTags(["Orders"]));

    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to add items to order");
  }
});

export const removeOrderItems = createAsyncThunk("pos/removeOrderItems", async ({ orderId, itemIds }: { orderId: string; itemIds: string[] }, { rejectWithValue, dispatch }) => {
  try {
    const response = await ordersAPI.removeOrderItems(orderId, itemIds);

    // Invalidate orders cache when items are removed
    dispatch(posApi.util.invalidateTags(["Orders"]));

    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to remove items from order");
  }
});

// Create the slice
const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    // Cart actions
    setCart: (state, action: PayloadAction<POSCartItem[]>) => {
      state.cart = action.payload;
      // Only set hasUnsavedChanges to true if there are items in the cart
      if (action.payload.length > 0) {
        state.hasUnsavedChanges = true;
      }
    },

    addToCart: (state, action: PayloadAction<POSCartItem>) => {
      state.isPOSActionInProgress = true;
      const newItem = action.payload;
      const existingItemIndex = state.cart.findIndex(item => item.id === newItem.id);

      if (existingItemIndex !== -1) {
        // Item exists, increment quantity
        state.cart[existingItemIndex].quantity += 1;
      } else {
        // Add new item
        state.cart.push({ ...newItem, quantity: 1 });
      }

      state.hasUnsavedChanges = true;
      state.isPOSActionInProgress = false;
    },

    updateCartQuantity: (state, action: PayloadAction<{ cartId: string; newQuantity: number }>) => {
      state.isPOSActionInProgress = true;
      const { cartId, newQuantity } = action.payload;

      if (newQuantity <= 0) {
        // Remove item if quantity is zero or negative
        state.cart = state.cart.filter(item => item.id !== cartId);
      } else {
        // Update quantity
        const itemIndex = state.cart.findIndex(item => item.id === cartId);
        if (itemIndex !== -1) {
          state.cart[itemIndex].quantity = newQuantity;
        }
      }

      state.hasUnsavedChanges = true;
      state.isPOSActionInProgress = false;
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter(item => item.id !== action.payload);
      state.hasUnsavedChanges = true;
    },

    clearCart: state => {
      state.cart = [];
      state.hasUnsavedChanges = false;
      state.appliedDiscount = null;
      state.orderNotes = "";
    },

    clearCartWithAnimation: state => {
      state.cart = [];
      state.cartBackup = null;
      state.hasUnsavedChanges = false;
      state.isPaymentCompleted = false;
      state.isTableManuallySelected = false;
    },

    // Optimistic cart clear with backup for rollback
    optimisticClearCart: state => {
      state.cartBackup = [...state.cart];
      state.cart = [];
      state.hasUnsavedChanges = false;
      state.showSuccessCheckmark = true;
    },

    // Restore cart from backup on error
    restoreCartFromBackup: state => {
      if (state.cartBackup && state.cartBackup.length > 0) {
        state.cart = [...state.cartBackup];
        state.hasUnsavedChanges = true;
        state.cartBackup = null;
      }
    },

    // Confirm cart clear (remove backup)
    confirmCartClear: state => {
      state.cartBackup = null;
      state.showSuccessCheckmark = false;
    },

    // Order type actions
    setOrderType: (state, action: PayloadAction<OrderType>) => {
      state.orderType = action.payload;
      if (action.payload !== "table") {
        state.selectedTable = null;
      }
    },

    setSelectedTable: (state, action: PayloadAction<Table | null>) => {
      state.selectedTable = action.payload;
      if (action.payload) {
        state.orderType = "table";
      }
    },

    setSelectedEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.selectedEmployee = action.payload;
      if (action.payload) {
        state.orderType = "employees";

        // Apply employee discount if applicable
        if (action.payload.discountPercentage > 0) {
          const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const discountAmount = (subtotal * action.payload.discountPercentage) / 100;

          state.appliedDiscount = {
            type: "percentage",
            value: action.payload.discountPercentage,
            amount: discountAmount,
            reason: `Employee discount - ${action.payload.user?.firstName} ${action.payload.user?.lastName} (${action.payload.department?.name || action.payload.department?.code || ""})`
          };
        }
      }
    },

    // Preview order number action
    setPreviewOrderNumber: (state, action: PayloadAction<string>) => {
      state.previewOrderNumber = action.payload;
    },

    // Discount actions
    applyDiscount: (state, action: PayloadAction<{ type: "percentage" | "fixed"; value: number; reason?: string }>) => {
      const { type, value, reason } = action.payload;
      const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      let discountAmount = 0;
      if (type === "percentage") {
        const safePercentage = Math.min(value, 100);
        discountAmount = (subtotal * safePercentage) / 100;
      } else {
        discountAmount = Math.min(value, subtotal);
      }

      state.appliedDiscount = {
        type,
        value,
        amount: discountAmount,
        reason
      };
    },

    removeDiscount: state => {
      state.appliedDiscount = null;
    },

    // Notes actions
    setOrderNotes: (state, action: PayloadAction<string>) => {
      state.orderNotes = action.payload;
    },

    setItemNotes: (state, action: PayloadAction<{ itemId: string; notes: string }>) => {
      const { itemId, notes } = action.payload;
      const itemIndex = state.cart.findIndex(item => item.id === itemId);

      if (itemIndex !== -1) {
        state.cart[itemIndex].notes = notes.trim() || undefined;
      }
    },

    // Dialog actions
    setShowPaymentDialog: (state, action: PayloadAction<boolean>) => {
      state.showPaymentDialog = action.payload;
    },

    setShowReceiptDialog: (state, action: PayloadAction<boolean>) => {
      state.showReceiptDialog = action.payload;
    },

    setShowTablesLayout: (state, action: PayloadAction<boolean>) => {
      state.showTablesLayout = action.payload;
    },

    setShowDiscountDialog: (state, action: PayloadAction<boolean>) => {
      state.showDiscountDialog = action.payload;
    },

    setShowNotesDialog: (state, action: PayloadAction<boolean>) => {
      state.showNotesDialog = action.payload;
    },

    setShowItemNotesDialog: (state, action: PayloadAction<boolean>) => {
      state.showItemNotesDialog = action.payload;
    },

    setShowVoidDialog: (state, action: PayloadAction<boolean>) => {
      state.showVoidDialog = action.payload;
    },

    setShowOrdersDialog: (state, action: PayloadAction<boolean>) => {
      state.showOrdersDialog = action.payload;
    },

    setShowReportsDialog: (state, action: PayloadAction<boolean>) => {
      state.showReportsDialog = action.payload;
    },

    setShowPrinterSelector: (state, action: PayloadAction<boolean>) => {
      state.showPrinterSelector = action.payload;
    },

    setSelectedItemForNotes: (state, action: PayloadAction<POSCartItem | null>) => {
      state.selectedItemForNotes = action.payload;
    },

    // UI state actions
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },

    setShowSuccessCheckmark: (state, action: PayloadAction<boolean>) => {
      state.showSuccessCheckmark = action.payload;
    },

    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setIsPOSActionInProgress: (state, action: PayloadAction<boolean>) => {
      state.isPOSActionInProgress = action.payload;
    },

    // Payment dialog actions
    setPaymentAmount: (state, action: PayloadAction<string>) => {
      state.paymentAmount = action.payload;
    },

    // Day close dialog actions
    setShowDayCloseDialog: (state, action: PayloadAction<boolean>) => {
      state.showDayCloseDialog = action.payload;
    },
    setClosingCash: (state, action: PayloadAction<string>) => {
      state.closingCash = action.payload;
    },
    setDayCloseNotes: (state, action: PayloadAction<string>) => {
      state.dayCloseNotes = action.payload;
    },

    // Printer selection actions
    setPrinterSelectionContext: (state, action: PayloadAction<"payment" | "manual_print" | null>) => {
      state.printerSelectionContext = action.payload;
    },

    setIsTableManuallySelected: (state, action: PayloadAction<boolean>) => {
      state.isTableManuallySelected = action.payload;
    },

    setIsPaymentCompleted: (state, action: PayloadAction<boolean>) => {
      state.isPaymentCompleted = action.payload;
    },

    // Receipt actions
    setLastSaleData: (state, action: PayloadAction<ReceiptData | null>) => {
      state.lastSaleData = action.payload;
    },

    generateReceiptData: state => {
      if (state.cart.length === 0) return;

      const receiptData: ReceiptData = {
        id: state.currentOrder?.orderNumber || `DRAFT-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        cashier: state.selectedEmployee && state.orderType === "employees" ? `${state.selectedEmployee.user?.firstName || ""} ${state.selectedEmployee.user?.lastName || ""}`.trim() : "",
        items: state.cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          type: item.type
        })),
        subtotal: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        tax: 0,
        total: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) - (state.appliedDiscount?.amount || 0),
        paymentAmount: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) - (state.appliedDiscount?.amount || 0),
        change: 0,
        paymentMethod: "cash",
        discountType: state.appliedDiscount?.type || null,
        discountValue: state.appliedDiscount?.value || null,
        discountAmount: state.appliedDiscount?.amount || null,
        discountReason: state.appliedDiscount?.reason || null,
        employeeName: state.selectedEmployee && state.orderType === "employees" ? `${state.selectedEmployee.user?.firstName || ""} ${state.selectedEmployee.user?.lastName || ""}`.trim() : null,
        orderType: state.orderType,
        tableNumber: state.selectedTable?.number || null
      };
      state.lastSaleData = receiptData;
    },

    // Sales history actions
    setSelectedSaleForEdit: (state, action) => {
      // Skip update if the reference is the same (both null or both same object)
      if (state.selectedSaleForEdit === action.payload) {
        console.log("🚫 Redux: Skipping selectedSaleForEdit update - same reference");
        return;
      }

      console.log("💾 Redux: Setting selectedSaleForEdit in posSlice:", action.payload);
      console.log("📍 Caller:", new Error().stack); // Log the call stack to see where this is triggered

      // Update selectedSaleForEdit
      state.selectedSaleForEdit = action.payload;

      // If setting a sale for edit, also set the editingSaleId
      if (action.payload && action.payload.id) {
        state.editingSaleId = action.payload.id.toString();
        console.log("🔑 Redux: Setting editingSaleId in posSlice:", state.editingSaleId);
      }
      // Note: We don't clear editingSaleId when setting selectedSaleForEdit to null
      // This allows us to keep track of which sale we're editing even after clearing the object

      // Log the current state for debugging
      if (action.payload === null) {
        console.log("🧹 Redux: selectedSaleForEdit cleared, but editingSaleId preserved:", state.editingSaleId);
      }
    },

    // Set the editing sale ID directly
    setEditingSaleId: (state, action: PayloadAction<string | null>) => {
      console.log("🔑 Redux: Setting editingSaleId directly:", action.payload);
      state.editingSaleId = action.payload;
    },

    // Clear editing sale ID
    clearEditingSaleId: state => {
      console.log("🧹 Redux: Clearing editingSaleId");
      state.editingSaleId = null;
    },

    resetState: () => initialState,

    // Sales history actions
    setSelectedItemFilter: (state, action: PayloadAction<string>) => {
      state.selectedItemFilter = action.payload;
    },
    setSelectedSectionFilter: (state, action: PayloadAction<string>) => {
      state.selectedSectionFilter = action.payload;
    },
    setDateFilter: (state, action: PayloadAction<string>) => {
      state.dateFilter = action.payload;
    },
    setDateFrom: (state, action: PayloadAction<Date | null>) => {
      state.dateFrom = action.payload;
    },
    setDateTo: (state, action: PayloadAction<Date | null>) => {
      state.dateTo = action.payload;
    },
    setViewMode: (state, action: PayloadAction<"all" | "staff">) => {
      state.viewMode = action.payload;
    },
    setStaffSales: (state, action: PayloadAction<SaleRecord[]>) => {
      state.staffSales = action.payload;
    },
    setIsLoadingStaff: (state, action: PayloadAction<boolean>) => {
      state.isLoadingStaff = action.payload;
    },
    setStaffError: (state, action: PayloadAction<string | null>) => {
      state.staffError = action.payload;
    },
    setSelectedItemIds: (state, action: PayloadAction<string[]>) => {
      state.selectedItemIds = action.payload;
    },
    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const index = state.selectedItemIds.indexOf(itemId);
      if (index > -1) {
        // Item exists, remove it
        state.selectedItemIds = state.selectedItemIds.filter(id => id !== itemId);
      } else {
        // Item doesn't exist, add it
        state.selectedItemIds = [...state.selectedItemIds, itemId];
      }
    },
    clearSelection: state => {
      state.selectedItemIds = [];
    },
    setIsPrintingReport: (state, action: PayloadAction<boolean>) => {
      state.isPrintingReport = action.payload;
    },
    setShowSalesReportDialog: (state, action: PayloadAction<boolean>) => {
      state.showSalesReportDialog = action.payload;
    },
    setSalesReportData: (state, action: PayloadAction<ReceiptData | null>) => {
      state.salesReportData = action.payload;
    },
    setUniqueItemNames: (state, action: PayloadAction<string[]>) => {
      state.uniqueItemNames = action.payload;
    },
    setUniqueSectionNames: (state, action: PayloadAction<string[]>) => {
      state.uniqueSectionNames = action.payload;
    },

    // Unsaved changes action
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },

    // ============================================
    // CLEANUP ACTIONS - Reset ephemeral state
    // ============================================

    // Reset all dialog state on unmount/close
    resetDialogsState: state => {
      state.showPaymentDialog = false;
      state.showReceiptDialog = false;
      state.showTablesLayout = false;
      state.showDiscountDialog = false;
      state.showNotesDialog = false;
      state.showItemNotesDialog = false;
      state.showVoidDialog = false;
      state.showOrdersDialog = false;
      state.showReportsDialog = false;
      state.showPrinterSelector = false;
      state.selectedItemForNotes = null;
    },

    // Reset ephemeral UI state
    resetEphemeralState: state => {
      state.error = null;
      state.successMessage = null;
      state.showSuccessCheckmark = false;
      state.isPOSActionInProgress = false;
      state.isTableManuallySelected = false;
    },

    // Reset payment dialog state
    resetPaymentState: state => {
      state.showPaymentDialog = false;
      state.paymentAmount = "";
    },

    // Reset day close dialog state
    resetDayCloseState: state => {
      state.showDayCloseDialog = false;
      state.closingCash = "";
      state.dayCloseNotes = "";
    },

    // Reset printer selection state
    resetPrinterSelectionState: state => {
      state.showPrinterSelector = false;
      state.printerSelectionContext = null;
    },

    // Reset sales history filters (when closing reports)
    resetSalesHistoryFilters: state => {
      state.selectedItemFilter = "all";
      state.selectedSectionFilter = "all";
      state.dateFilter = "";
      state.dateFrom = null;
      state.dateTo = null;
      state.selectedItemIds = [];
    },

    // Reset sales operations state
    resetSalesOperationsState: state => {
      state.isDeleting = false;
      state.isReverting = false;
      state.revertSuccess = null;
      state.deleteSuccess = null;
      state.isBulkDeleting = false;
      state.isBulkReverting = false;
      state.revertDialogOpen = false;
      state.deleteDialogOpen = false;
      state.bulkDeleteSuccess = null;
      state.bulkRevertSuccess = null;
      state.bulkRevertDialogOpen = false;
      state.bulkDeleteDialogOpen = false;
      state.selectedSaleForRevert = null;
      state.selectedSaleForDelete = null;
      state.stockRestorationReport = [];
      state.stockRestorationModalOpen = false;
      state.bulkStockRestorationReport = [];
      state.deleteConfirmationModalOpen = false;
      state.selectedItemForDelete = null;
    },

    // Sales operations actions
    setIsDeleting: (state, action: PayloadAction<boolean>) => {
      state.isDeleting = action.payload;
    },
    setIsReverting: (state, action: PayloadAction<boolean>) => {
      state.isReverting = action.payload;
    },
    setRevertSuccess: (state, action: PayloadAction<string | null>) => {
      state.revertSuccess = action.payload;
    },
    setDeleteSuccess: (state, action: PayloadAction<string | null>) => {
      state.deleteSuccess = action.payload;
    },
    setIsBulkDeleting: (state, action: PayloadAction<boolean>) => {
      state.isBulkDeleting = action.payload;
    },
    setIsBulkReverting: (state, action: PayloadAction<boolean>) => {
      state.isBulkReverting = action.payload;
    },
    setRevertDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.revertDialogOpen = action.payload;
    },
    setDeleteDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.deleteDialogOpen = action.payload;
    },
    setBulkDeleteSuccess: (state, action: PayloadAction<string | null>) => {
      state.bulkDeleteSuccess = action.payload;
    },
    setBulkRevertSuccess: (state, action: PayloadAction<string | null>) => {
      state.bulkRevertSuccess = action.payload;
    },
    setBulkRevertDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.bulkRevertDialogOpen = action.payload;
    },
    setBulkDeleteDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.bulkDeleteDialogOpen = action.payload;
    },
    setSelectedSaleForRevert: (state, action: PayloadAction<SaleRecord | null>) => {
      state.selectedSaleForRevert = action.payload;
    },
    setSelectedSaleForDelete: (state, action: PayloadAction<SaleRecord | null>) => {
      state.selectedSaleForDelete = action.payload;
    },
    setStockRestorationReport: (state, action: PayloadAction<any[]>) => {
      state.stockRestorationReport = action.payload;
    },
    setStockRestorationModalOpen: (state, action: PayloadAction<boolean>) => {
      state.stockRestorationModalOpen = action.payload;
    },
    setBulkStockRestorationReport: (state, action: PayloadAction<any[]>) => {
      state.bulkStockRestorationReport = action.payload;
    },
    setDeleteConfirmationModalOpen: (state, action: PayloadAction<boolean>) => {
      state.deleteConfirmationModalOpen = action.payload;
    },
    setSelectedItemForDelete: (
      state,
      action: PayloadAction<{
        saleId: string;
        itemId: string;
        itemType: "material" | "menu";
        itemName: string;
      } | null>
    ) => {
      state.selectedItemForDelete = action.payload;
    }
  },
  extraReducers: builder => {
    // Handle fetchSalesHistory
    builder.addCase(fetchSalesHistory.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSalesHistory.fulfilled, (state, action) => {
      state.isLoading = false;
      state.salesHistory = action.payload;
    });
    builder.addCase(fetchSalesHistory.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Handle loadOrder
    builder.addCase(loadOrder.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadOrder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload;

      // Map order items to cart items
      if (action.payload && action.payload.items && Array.isArray(action.payload.items)) {
        const cartItems: POSCartItem[] = action.payload.items
          .map((item: any, index: number) => {
            if (item.menuItem) {
              return {
                id: `order-${action.payload.id}-menu-${item.menuItem.id}-${index}`,
                name: item.menuItem.name,
                price: item.unitPrice || item.menuItem.price,
                quantity: item.quantity,
                type: "menu_item",
                menuItemId: item.menuItem.id.toString(),
                originalItem: item.menuItem,
                stockEntryId: undefined,
                orderItemId: item.id?.toString?.() || item.id,
                notes: item.notes || undefined
              };
            } else if (item.material) {
              return {
                id: `order-${action.payload.id}-material-${item.material.id}-${index}`,
                name: item.material.name,
                price: parseFloat(item.unitPrice),
                quantity: item.quantity,
                type: "material",
                materialId: item.material.id.toString(),
                originalItem: item.material,
                stockEntryId: undefined,
                orderItemId: item.id?.toString?.() || item.id,
                notes: item.notes || undefined
              };
            }
            return null;
          })
          .filter(Boolean) as POSCartItem[];

        state.cart = cartItems;
        state.orderType = action.payload.orderType;

        // Set table if order is table type
        if (action.payload.orderType === "table" && action.payload.tableId) {
          // Note: We can't set the actual table object here since we don't have the tables list
          // This will need to be handled in the component
          state.selectedTable = null;
        }

        // Set discount if present
        if (action.payload.discountAmount && parseFloat(action.payload.discountAmount.toString()) > 0) {
          state.appliedDiscount = {
            type: (action.payload.discountType as "percentage" | "fixed") || "fixed",
            value: parseFloat(action.payload.discountValue?.toString() || "0"),
            amount: parseFloat(action.payload.discountAmount.toString()),
            reason: action.payload.discountReason || undefined
          };
        }

        // Set notes if present
        if (action.payload.notes) {
          state.orderNotes = action.payload.notes;
        }

        state.hasUnsavedChanges = true;
      }
    });
    builder.addCase(loadOrder.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Handle createOrder
    builder.addCase(createOrder.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload;
      state.hasUnsavedChanges = false;
      state.successMessage = "Order created successfully";
    });
    builder.addCase(createOrder.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Handle updateOrder
    builder.addCase(updateOrder.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateOrder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload;
      state.hasUnsavedChanges = false;
      state.successMessage = "Order updated successfully";
    });
    builder.addCase(updateOrder.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Handle completeOrder
    builder.addCase(completeOrder.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(completeOrder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = null;
      state.isPaymentCompleted = true;
      state.showSuccessCheckmark = true;
      state.cart = [];
      state.hasUnsavedChanges = false;
      state.appliedDiscount = null;
      state.orderNotes = "";
      state.successMessage = "Payment completed successfully";

      // Generate receipt data
      if (action.payload.order) {
        const order = action.payload.order;
        const receiptData: ReceiptData = {
          id: action.payload.saleId || order.orderNumber || `SALE-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          cashier: state.selectedEmployee && state.orderType === "employees" ? `${state.selectedEmployee.user?.firstName || ""} ${state.selectedEmployee.user?.lastName || ""}`.trim() : "",
          items: order.items.map((item: any) => ({
            name: item.menuItem ? item.menuItem.name : item.material.name,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: item.quantity * parseFloat(item.unitPrice),
            type: item.menuItem ? "menu_item" : "material"
          })),
          subtotal: typeof order.subtotal === "string" ? parseFloat(order.subtotal) : Number(order.subtotal),
          tax: typeof order.tax === "string" ? parseFloat(order.tax || "0") : Number(order.tax || 0),
          total: typeof order.total === "string" ? parseFloat(order.total) : Number(order.total),
          paymentAmount: typeof order.total === "string" ? parseFloat(order.total) : Number(order.total),
          change: 0, // This should be calculated based on actual payment
          paymentMethod: "cash", // This should come from the payment data
          discountType: order.discountType || null,
          discountValue: order.discountValue ? (typeof order.discountValue === "string" ? parseFloat(order.discountValue) : Number(order.discountValue)) : null,
          discountAmount: order.discountAmount ? (typeof order.discountAmount === "string" ? parseFloat(order.discountAmount) : Number(order.discountAmount)) : null,
          discountReason: order.discountReason || null,
          employeeName: state.selectedEmployee && state.orderType === "employees" ? `${state.selectedEmployee.user?.firstName || ""} ${state.selectedEmployee.user?.lastName || ""}`.trim() : null,
          orderType: state.orderType,
          tableNumber: state.selectedTable?.number || null
        };

        state.lastSaleData = receiptData;
        state.showReceiptDialog = true;
      }
    });
    builder.addCase(completeOrder.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Handle voidOrder
    builder.addCase(voidOrder.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(voidOrder.fulfilled, state => {
      state.isLoading = false;
      state.currentOrder = null;
      state.cart = [];
      state.hasUnsavedChanges = false;
      state.appliedDiscount = null;
      state.orderNotes = "";
      state.successMessage = "Order voided successfully";
    });
    builder.addCase(voidOrder.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Handle addOrderItems
    builder.addCase(addOrderItems.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addOrderItems.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload;
      state.hasUnsavedChanges = false;
      state.successMessage = "Items added to order successfully";
    });
    builder.addCase(addOrderItems.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Handle removeOrderItems
    builder.addCase(removeOrderItems.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(removeOrderItems.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload;
      state.hasUnsavedChanges = false;
      state.successMessage = "Items removed from order successfully";
    });
    builder.addCase(removeOrderItems.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  }
});

export const {
  addToCart,
  setCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  clearCartWithAnimation,
  optimisticClearCart,
  restoreCartFromBackup,
  confirmCartClear,
  setOrderType,
  setSelectedEmployee,
  setSelectedTable,
  setPreviewOrderNumber,
  applyDiscount,
  removeDiscount,
  setOrderNotes,
  setItemNotes,
  setShowPaymentDialog,
  setShowReceiptDialog,
  setShowTablesLayout,
  setShowDiscountDialog,
  setShowNotesDialog,
  setShowItemNotesDialog,
  setShowVoidDialog,
  setShowOrdersDialog,
  setShowReportsDialog,
  setShowPrinterSelector,
  setSelectedItemForNotes,
  setError,
  setSuccessMessage,
  setShowSuccessCheckmark,
  setIsLoading,
  setIsPOSActionInProgress,
  setIsTableManuallySelected,
  setIsPaymentCompleted,
  setLastSaleData,
  generateReceiptData,
  // Payment dialog actions
  setPaymentAmount,
  // Day close dialog actions
  setShowDayCloseDialog,
  setClosingCash,
  setDayCloseNotes,
  // Printer selection actions
  setPrinterSelectionContext,
  setSelectedSaleForEdit,
  setEditingSaleId,
  clearEditingSaleId,
  resetState,
  // Sales history actions
  setSelectedItemFilter,
  setSelectedSectionFilter,
  setDateFilter,
  setDateFrom,
  setDateTo,
  setViewMode,
  setStaffSales,
  setIsLoadingStaff,
  setStaffError,
  setSelectedItemIds,
  toggleItemSelection,
  clearSelection,
  setIsPrintingReport,
  setShowSalesReportDialog,
  setSalesReportData,
  setUniqueItemNames,
  setUniqueSectionNames,
  // Sales operations actions
  setIsDeleting,
  setIsReverting,
  setRevertSuccess,
  setDeleteSuccess,
  setIsBulkDeleting,
  setIsBulkReverting,
  setRevertDialogOpen,
  setDeleteDialogOpen,
  setBulkDeleteSuccess,
  setBulkRevertSuccess,
  setBulkRevertDialogOpen,
  setBulkDeleteDialogOpen,
  setSelectedSaleForRevert,
  setSelectedSaleForDelete,
  setStockRestorationReport,
  setStockRestorationModalOpen,
  setBulkStockRestorationReport,
  setDeleteConfirmationModalOpen,
  setSelectedItemForDelete,
  setHasUnsavedChanges,
  // Cleanup actions
  resetDialogsState,
  resetEphemeralState,
  resetPaymentState,
  resetDayCloseState,
  resetPrinterSelectionState,
  resetSalesHistoryFilters,
  resetSalesOperationsState
} = posSlice.actions;

// Export reducer
export default posSlice.reducer;
