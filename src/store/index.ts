import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import posReducer from "./slices/posSlice";
import dayOperationsReducer from "./slices/dayOperationsSlice";
import uiReducer from "./slices/uiSlice";
import ordersReducer from "./slices/ordersSlice";
import tablesReducer from "./slices/tablesSlice";
import { posApi } from "./api/posApi";

// Configure persistence for each reducer
const posPersistConfig = {
  key: 'pos',
  storage,
  // Only persist specific parts of the POS state
  whitelist: ['cart', 'orderType', 'selectedTable', 'selectedEmployee', 'orderNotes', 'appliedDiscount', 'lastSaleData']
};

const ordersPersistConfig = {
  key: 'orders',
  storage,
  // Only persist specific parts of the orders state
  whitelist: ['activeOrder', 'stockRestorations']
};

const tablesPersistConfig = {
  key: 'tables',
  storage,
  // Only persist specific parts of the tables state
  whitelist: ['tables']
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

// Create store with persisted reducer
export const store = configureStore({
  reducer: rootReducer,
  // Add RTK Query middleware with performance optimizations
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serialization check in development to improve performance
      serializableCheck: {
        // Ignore Redux Persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, 'persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore Redux Persist state paths
        ignoredPaths: ['persist'],
        // Increase warning threshold to reduce console spam
        warnAfter: 128, // Increased from default 32ms
      },
      // Disable immutability check for better performance (only in production)
      immutableCheck: process.env.NODE_ENV === 'development' ? { warnAfter: 128 } : false,
    }).concat(posApi.middleware)
});

// Create persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
