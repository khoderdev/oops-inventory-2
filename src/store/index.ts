import { configureStore } from "@reduxjs/toolkit";
import posReducer from "./slices/posSlice";
import dayOperationsReducer from "./dayOperationsSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    pos: posReducer,
    dayOperations: dayOperationsReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
