import { configureStore } from "@reduxjs/toolkit";
import posReducer from "./slices/posSlice";
import dayOperationsReducer from "./slices/dayOperationsSlice";
import uiReducer from "./slices/uiSlice";
import ordersReducer from "./slices/ordersSlice";
import tablesReducer from "./slices/tablesSlice";
import { posApi } from "./api/posApi";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    pos: posReducer,
    dayOperations: dayOperationsReducer,
    orders: ordersReducer,
    tables: tablesReducer,
    // Add RTK Query API reducer
    [posApi.reducerPath]: posApi.reducer
  },
  // Add RTK Query middleware with performance optimizations
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serialization check in development to improve performance
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Increase warning threshold to reduce console spam
        warnAfter: 128, // Increased from default 32ms
      },
      // Disable immutability check for better performance (only in production)
      immutableCheck: process.env.NODE_ENV === 'development' ? { warnAfter: 128 } : false,
    }).concat(posApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
