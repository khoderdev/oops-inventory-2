import { configureStore } from "@reduxjs/toolkit";
import posReducer from "./slices/posSlice";
import dayOperationsReducer from "./dayOperationsSlice";
import uiReducer from "./slices/uiSlice";
import ordersReducer from "./slices/ordersSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    pos: posReducer,
    dayOperations: dayOperationsReducer,
    orders: ordersReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
