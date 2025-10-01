import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the UI state interface for layout-related states
interface UISliceState {
  // Left panel layout states
  showLeftPanel: boolean;
  isResizing: boolean;
  leftPanelWidth: number;

  // Lock overlay state
  showLockOverlay: boolean;

  // Day operations state (derived from dayOperationsSlice but needed for UI)
  userDayOpen: boolean | null;
}

// Initial state
const initialState: UISliceState = {
  showLeftPanel: false,
  isResizing: false,
  leftPanelWidth: 280,
  showLockOverlay: false,
  userDayOpen: null,
};

// Create the slice
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Left panel layout actions
    setShowLeftPanel: (state, action: PayloadAction<boolean>) => {
      state.showLeftPanel = action.payload;
    },

    setIsResizing: (state, action: PayloadAction<boolean>) => {
      state.isResizing = action.payload;
    },

    setLeftPanelWidth: (state, action: PayloadAction<number>) => {
      state.leftPanelWidth = action.payload;
    },

    // Lock overlay actions
    setShowLockOverlay: (state, action: PayloadAction<boolean>) => {
      state.showLockOverlay = action.payload;
    },

    // Day operations UI state actions
    setUserDayOpen: (state, action: PayloadAction<boolean | null>) => {
      state.userDayOpen = action.payload;
      // Auto-hide lock overlay when day opens
      if (action.payload === true) {
        state.showLockOverlay = false;
      }
    },

    // Combined actions for convenience
    toggleLeftPanel: state => {
      state.showLeftPanel = !state.showLeftPanel;
    },

    resetLayout: state => {
      state.showLeftPanel = false;
      state.isResizing = false;
      state.leftPanelWidth = 280;
      state.showLockOverlay = false;
      state.userDayOpen = null;
    }
  }
});

export const {
  setShowLeftPanel,
  setIsResizing,
  setLeftPanelWidth,
  setShowLockOverlay,
  setUserDayOpen,
  toggleLeftPanel,
  resetLayout
} = uiSlice.actions;

export default uiSlice.reducer;
