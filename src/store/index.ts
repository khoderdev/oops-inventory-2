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
  // Add RTK Query middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(posApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
