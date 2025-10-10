import { configureStore, combineReducers, Middleware } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { findNonSerializablePaths } from "@/utils/debugHelpers";
import posReducer from "./slices/posSlice";
import dayOperationsReducer from "./slices/dayOperationsSlice";
import uiReducer from "./slices/uiSlice";
import ordersReducer from "./slices/ordersSlice";
import tablesReducer from "./slices/tablesSlice";
import { posApi } from "./api/posApi";

// Configure persistence for each reducer
const posPersistConfig = {
  key: "pos",
  version: 1,
  storage,
  // Only persist user/session data that should survive reloads
  whitelist: ["cart", "orderType", "selectedTable", "selectedEmployee", "orderNotes", "appliedDiscount", "lastSaleData"],
  // Explicitly blacklist ephemeral state that should never persist
  blacklist: [
    // UI State - Never persist
    "isLoading",
    "error",
    "successMessage",
    "showSuccessCheckmark",
    // Dialog State - Never persist
    "showPaymentDialog",
    "showReceiptDialog",
    "showTablesLayout",
    "showDiscountDialog",
    "showNotesDialog",
    "showItemNotesDialog",
    "showVoidDialog",
    "showOrdersDialog",
    "showReportsDialog",
    "showPrinterSelector",
    // Transient State
    'selectedItemForNotes',
    'isPOSActionInProgress',
    'isTableManuallySelected',
    'isPaymentCompleted',
    // Payment dialog state (ephemeral)
    'paymentAmount',
    // Day close dialog state (ephemeral)
    'showDayCloseDialog',
    'closingCash',
    'dayCloseNotes',
    // Printer selection state (ephemeral)
    'printerSelectionContext',
    // Sales History (too large, fetch on demand)
    "salesHistory",
    "staffSales",
    "selectedItemIds",
    // Sales operations state
    "isDeleting",
    "isReverting",
    "isBulkDeleting",
    "isBulkReverting",
    "stockRestorationReport",
    "bulkStockRestorationReport"
  ]
};

const ordersPersistConfig = {
  key: "orders",
  storage,
  // Only persist specific parts of the orders state
  whitelist: ["activeOrder", "stockRestorations"]
};

const tablesPersistConfig = {
  key: "tables",
  version: 1,
  storage,
  // Only persist tables data, not ephemeral UI state
  whitelist: ["tables", "selectedTable", "tableOrders", "printedTables"],
  // Explicitly blacklist ephemeral UI state
  blacklist: ["hoveredTable", "popupPosition", "isArrangeMode", "isDragMode", "selectedTool", "dragState", "tempPositions", "isUpdatingPosition", "showRenameModal", "showTransferModal", "showDeleteModal", "showClearModal", "showInactiveTablesModal", "showReservationModal", "isContextMenuOpen", "selectedTableForAction", "tableToClear", "tableToDelete", "tableToRename", "transferSourceTable", "transferSourceOrder", "transferDestinationTable"]
};

// Create persisted reducers
const persistedPosReducer = persistReducer(posPersistConfig, posReducer);
const persistedOrdersReducer = persistReducer(ordersPersistConfig, ordersReducer);
const persistedTablesReducer = persistReducer(tablesPersistConfig, tablesReducer);

// Root reducer
const rootReducer = combineReducers({
  ui: uiReducer,
  pos: persistedPosReducer,
  dayOperations: dayOperationsReducer,
  orders: persistedOrdersReducer,
  tables: persistedTablesReducer,
  [posApi.reducerPath]: posApi.reducer
});

// Create a debug middleware to catch serialization issues
const debugMiddleware: Middleware = store => next => (action: any) => {
  // Only log in development
  if (process.env.NODE_ENV === "development") {
    // Check for specific actions that might cause issues
    if (typeof action === "object" && action !== null && action.type === "orders/updateOrder/pending") {
      console.group("🔍 Debug updateOrder action");
      console.log("Action:", action);

      // Check if payload is serializable
      if (action.meta && typeof action.meta === "object" && action.meta.arg) {
        console.log("Payload:", action.meta.arg);
        const nonSerializablePaths = findNonSerializablePaths(action.meta.arg);
        if (nonSerializablePaths.length > 0) {
          console.warn("⚠️ Non-serializable paths in updateOrder:", nonSerializablePaths);
        }
      }
      console.groupEnd();
    }
  }

  return next(action);
};

// Create store with persisted reducer
export const store = configureStore({
  reducer: rootReducer,
  // Add RTK Query middleware with performance optimizations
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // Disable serialization check in development to improve performance
      serializableCheck: {
        // Ignore Redux Persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, "persist/PERSIST", "persist/REHYDRATE"],
        // Ignore Redux Persist state paths
        ignoredPaths: ["persist"],
        // Increase warning threshold to reduce console spam
        warnAfter: 128 // Increased from default 32ms
      },
      // Disable immutability check for better performance (only in production)
      immutableCheck: process.env.NODE_ENV === "development" ? { warnAfter: 128 } : false
    }).concat(posApi.middleware, debugMiddleware)
});

// Create persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
