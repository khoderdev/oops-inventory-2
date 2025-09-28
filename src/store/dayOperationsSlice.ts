import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DayOperation, DayOperationResponse, DayOperationsListResponse, DayActivitiesResponse, OpenDayRequest, CloseDayRequest, DailyReportData, ActivityLog } from "@/types/inventory";
import { UserOrderStats } from "@/types/dayOperations";
import { dayOperationsAPI } from "@/api/dayOperations.api";
import { RootState } from "../store/";

// Define the state interface
interface DayOperationsState {
  // Current day operation data
  currentDay: DayOperation | null;
  currentDayLoading: boolean;
  currentDayError: string | null;

  // Day operations list
  dayOperations: DayOperation[];
  dayOperationsLoading: boolean;
  dayOperationsError: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };

  // Activities
  activities: ActivityLog[];
  activitiesLoading: boolean;
  activitiesError: string | null;

  // User order stats
  userOrderStats: UserOrderStats[];
  userOrderStatsLoading: boolean;
  userOrderStatsError: string | null;

  // Daily report
  dailyReport: DailyReportData | null;
  dailyReportLoading: boolean;
  dailyReportError: string | null;

  // Action status
  actionLoading: boolean;
  actionError: string | null;
  actionSuccess: string | null;

  // Last refresh timestamp
  lastRefresh: string | null;
}

// Initial state
const initialState: DayOperationsState = {
  // Current day operation data
  currentDay: null,
  currentDayLoading: false,
  currentDayError: null,

  // Day operations list
  dayOperations: [],
  dayOperationsLoading: false,
  dayOperationsError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  },

  // Activities
  activities: [],
  activitiesLoading: false,
  activitiesError: null,

  // User order stats
  userOrderStats: [],
  userOrderStatsLoading: false,
  userOrderStatsError: null,

  // Daily report
  dailyReport: null,
  dailyReportLoading: false,
  dailyReportError: null,

  // Action status
  actionLoading: false,
  actionError: null,
  actionSuccess: null,

  // Last refresh timestamp
  lastRefresh: null
};

// Async thunks
export const fetchCurrentDayOperation = createAsyncThunk("dayOperations/fetchCurrentDayOperation", async (_, { rejectWithValue }) => {
  try {
    const response = await dayOperationsAPI.getCurrentDayOperation();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch current day operation");
  }
});

export const fetchDayOperations = createAsyncThunk(
  "dayOperations/fetchDayOperations",
  async (
    {
      page = 1,
      limit = 20,
      status
    }: {
      page?: number;
      limit?: number;
      status?: "opened" | "closed";
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await dayOperationsAPI.getDayOperations(page, limit, status);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch day operations");
    }
  }
);

export const fetchCurrentDayActivities = createAsyncThunk("dayOperations/fetchCurrentDayActivities", async (_, { rejectWithValue }) => {
  try {
    const response = await dayOperationsAPI.getCurrentDayActivities();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch day activities");
  }
});

export const fetchUserOrderStats = createAsyncThunk("dayOperations/fetchUserOrderStats", async (_, { rejectWithValue }) => {
  try {
    const response = await dayOperationsAPI.getUserOrderStats();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch user order stats");
  }
});

export const fetchDailyReport = createAsyncThunk("dayOperations/fetchDailyReport", async (date: string, { rejectWithValue }) => {
  try {
    const response = await dayOperationsAPI.getDailyReport(date);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch daily report");
  }
});

export const openDay = createAsyncThunk("dayOperations/openDay", async (data: OpenDayRequest, { rejectWithValue }) => {
  try {
    const response = await dayOperationsAPI.openDay(data);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to open day");
  }
});

export const closeDay = createAsyncThunk("dayOperations/closeDay", async (data: CloseDayRequest, { rejectWithValue }) => {
  try {
    const response = await dayOperationsAPI.closeDay(data);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to close day");
  }
});

export const updateDayOperation = createAsyncThunk(
  "dayOperations/updateDayOperation",
  async (
    {
      id,
      updates
    }: {
      id: number;
      updates: Partial<DayOperation> & { allowClosedDayUpdate?: boolean };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await dayOperationsAPI.updateDayOperation(id, updates);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update day operation");
    }
  }
);

// Create the slice
const dayOperationsSlice = createSlice({
  name: "dayOperations",
  initialState,
  reducers: {
    clearActionError: state => {
      state.actionError = null;
    },
    clearActionSuccess: state => {
      state.actionSuccess = null;
    },
    setActionError: (state, action: PayloadAction<string>) => {
      state.actionError = action.payload;
    },
    setActionSuccess: (state, action: PayloadAction<string>) => {
      state.actionSuccess = action.payload;
    },
    resetDayOperationsState: () => initialState
  },
  extraReducers: builder => {
    // Fetch current day operation
    builder
      .addCase(fetchCurrentDayOperation.pending, state => {
        state.currentDayLoading = true;
        state.currentDayError = null;
      })
      .addCase(fetchCurrentDayOperation.fulfilled, (state, action) => {
        state.currentDayLoading = false;
        state.currentDay = action.payload.currentDay;
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(fetchCurrentDayOperation.rejected, (state, action) => {
        state.currentDayLoading = false;
        state.currentDayError = action.payload as string;
      });

    // Fetch day operations list
    builder
      .addCase(fetchDayOperations.pending, state => {
        state.dayOperationsLoading = true;
        state.dayOperationsError = null;
      })
      .addCase(fetchDayOperations.fulfilled, (state, action) => {
        state.dayOperationsLoading = false;
        state.dayOperations = action.payload.dayOperations;
        state.pagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          totalItems: action.payload.pagination.totalItems,
          itemsPerPage: action.payload.pagination.itemsPerPage
        };
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(fetchDayOperations.rejected, (state, action) => {
        state.dayOperationsLoading = false;
        state.dayOperationsError = action.payload as string;
      });

    // Fetch current day activities
    builder
      .addCase(fetchCurrentDayActivities.pending, state => {
        state.activitiesLoading = true;
        state.activitiesError = null;
      })
      .addCase(fetchCurrentDayActivities.fulfilled, (state, action) => {
        state.activitiesLoading = false;
        state.activities = action.payload.activities;
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(fetchCurrentDayActivities.rejected, (state, action) => {
        state.activitiesLoading = false;
        state.activitiesError = action.payload as string;
      });

    // Fetch user order stats
    builder
      .addCase(fetchUserOrderStats.pending, state => {
        state.userOrderStatsLoading = true;
        state.userOrderStatsError = null;
      })
      .addCase(fetchUserOrderStats.fulfilled, (state, action) => {
        state.userOrderStatsLoading = false;
        state.userOrderStats = action.payload.userOrderStats;
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(fetchUserOrderStats.rejected, (state, action) => {
        state.userOrderStatsLoading = false;
        state.userOrderStatsError = action.payload as string;
      });

    // Fetch daily report
    builder
      .addCase(fetchDailyReport.pending, state => {
        state.dailyReportLoading = true;
        state.dailyReportError = null;
      })
      .addCase(fetchDailyReport.fulfilled, (state, action) => {
        state.dailyReportLoading = false;
        state.dailyReport = action.payload.report;
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(fetchDailyReport.rejected, (state, action) => {
        state.dailyReportLoading = false;
        state.dailyReportError = action.payload as string;
      });

    // Open day
    builder
      .addCase(openDay.pending, state => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(openDay.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentDay = action.payload.dayOperation;
        state.actionSuccess = action.payload.message || "Day opened successfully";
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(openDay.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // Close day
    builder
      .addCase(closeDay.pending, state => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(closeDay.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentDay = action.payload.dayOperation;
        state.actionSuccess = action.payload.message || "Day closed successfully";
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(closeDay.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // Update day operation
    builder
      .addCase(updateDayOperation.pending, state => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(updateDayOperation.fulfilled, (state, action) => {
        state.actionLoading = false;

        // Update the current day if it's the same ID
        if (state.currentDay && state.currentDay.id === action.payload.dayOperation.id) {
          state.currentDay = action.payload.dayOperation;
        }

        // Update in the list if present
        state.dayOperations = state.dayOperations.map(dayOp => (dayOp.id === action.payload.dayOperation.id ? action.payload.dayOperation : dayOp));

        state.actionSuccess = action.payload.message || "Day operation updated successfully";
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(updateDayOperation.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });
  }
});

// Export actions
export const { clearActionError, clearActionSuccess, setActionError, setActionSuccess, resetDayOperationsState } = dayOperationsSlice.actions;

// Export selectors
export const selectCurrentDay = (state: RootState) => state.dayOperations.currentDay;
export const selectCurrentDayLoading = (state: RootState) => state.dayOperations.currentDayLoading;
export const selectCurrentDayError = (state: RootState) => state.dayOperations.currentDayError;

export const selectDayOperations = (state: RootState) => state.dayOperations.dayOperations;
export const selectDayOperationsLoading = (state: RootState) => state.dayOperations.dayOperationsLoading;
export const selectDayOperationsError = (state: RootState) => state.dayOperations.dayOperationsError;
export const selectDayOperationsPagination = (state: RootState) => state.dayOperations.pagination;

export const selectActivities = (state: RootState) => state.dayOperations.activities;
export const selectActivitiesLoading = (state: RootState) => state.dayOperations.activitiesLoading;
export const selectActivitiesError = (state: RootState) => state.dayOperations.activitiesError;

export const selectUserOrderStats = (state: RootState) => state.dayOperations.userOrderStats;
export const selectUserOrderStatsLoading = (state: RootState) => state.dayOperations.userOrderStatsLoading;
export const selectUserOrderStatsError = (state: RootState) => state.dayOperations.userOrderStatsError;

export const selectDailyReport = (state: RootState) => state.dayOperations.dailyReport;
export const selectDailyReportLoading = (state: RootState) => state.dayOperations.dailyReportLoading;
export const selectDailyReportError = (state: RootState) => state.dayOperations.dailyReportError;

export const selectActionLoading = (state: RootState) => state.dayOperations.actionLoading;
export const selectActionError = (state: RootState) => state.dayOperations.actionError;
export const selectActionSuccess = (state: RootState) => state.dayOperations.actionSuccess;

export const selectLastRefresh = (state: RootState) => state.dayOperations.lastRefresh;

// Computed selectors
export const selectIsDayOpen = (state: RootState) => state.dayOperations.currentDay?.status === "opened";

export const selectIsDayClosed = (state: RootState) => state.dayOperations.currentDay?.status === "closed";

export const selectHasActiveDay = (state: RootState) => !!state.dayOperations.currentDay;

// Export reducer
export default dayOperationsSlice.reducer;
