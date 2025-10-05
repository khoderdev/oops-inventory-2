import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  // Actions
  fetchCurrentDayOperation,
  fetchDayOperations,
  fetchCurrentDayActivities,
  fetchUserOrderStats,
  fetchDailyReport,
  openDay,
  closeDay,
  updateDayOperation,
  clearActionError,
  clearActionSuccess,
  setActionError,
  setActionSuccess,

  // Selectors
  selectCurrentDay,
  selectCurrentDayLoading,
  selectCurrentDayError,
  selectDayOperations,
  selectDayOperationsLoading,
  selectDayOperationsError,
  selectDayOperationsPagination,
  selectActivities,
  selectActivitiesLoading,
  selectActivitiesError,
  selectUserOrderStats,
  selectUserOrderStatsLoading,
  selectUserOrderStatsError,
  selectDailyReport,
  selectDailyReportLoading,
  selectDailyReportError,
  selectActionLoading,
  selectActionError,
  selectActionSuccess,
  selectLastRefresh,
  selectIsDayOpen,
  selectIsDayClosed,
  selectHasActiveDay
} from "@/store/dayOperationsSlice";
import { OpenDayRequest, CloseDayRequest } from "@/types/inventory";
import { AppDispatch } from "@/store/";

export const useDayOperations = (autoRefresh = false, refreshInterval = 30000) => {
  const dispatch = useDispatch<AppDispatch>();

  // Select all state from the slice
  const currentDay = useSelector(selectCurrentDay);
  const currentDayLoading = useSelector(selectCurrentDayLoading);
  const currentDayError = useSelector(selectCurrentDayError);

  const dayOperations = useSelector(selectDayOperations);
  const dayOperationsLoading = useSelector(selectDayOperationsLoading);
  const dayOperationsError = useSelector(selectDayOperationsError);
  const pagination = useSelector(selectDayOperationsPagination);

  const activities = useSelector(selectActivities);
  const activitiesLoading = useSelector(selectActivitiesLoading);
  const activitiesError = useSelector(selectActivitiesError);

  const userOrderStats = useSelector(selectUserOrderStats);
  const userOrderStatsLoading = useSelector(selectUserOrderStatsLoading);
  const userOrderStatsError = useSelector(selectUserOrderStatsError);

  const dailyReport = useSelector(selectDailyReport);
  const dailyReportLoading = useSelector(selectDailyReportLoading);
  const dailyReportError = useSelector(selectDailyReportError);

  const actionLoading = useSelector(selectActionLoading);
  const actionError = useSelector(selectActionError);
  const actionSuccess = useSelector(selectActionSuccess);

  const lastRefresh = useSelector(selectLastRefresh);

  // Computed values
  const isDayOpen = useSelector(selectIsDayOpen);
  const isDayClosed = useSelector(selectIsDayClosed);
  const hasActiveDay = useSelector(selectHasActiveDay);

  // Fetch actions with optional force parameter
  const refreshCurrentDay = useCallback((force = false) => {
    return dispatch(fetchCurrentDayOperation({ force }));
  }, [dispatch]);

  const refreshActivities = useCallback((force = false) => {
    return dispatch(fetchCurrentDayActivities({ force }));
  }, [dispatch]);

  const refreshUserStats = useCallback((force = false) => {
    return dispatch(fetchUserOrderStats({ force }));
  }, [dispatch]);

  const getDayOperations = useCallback(
    (page = 1, limit = 20, status?: "opened" | "closed") => {
      return dispatch(fetchDayOperations({ page, limit, status }));
    },
    [dispatch]
  );

  const getDailyReport = useCallback(
    (date: string) => {
      return dispatch(fetchDailyReport(date));
    },
    [dispatch]
  );

  // Action handlers
  const handleOpenDay = useCallback(
    (data: OpenDayRequest) => {
      return dispatch(openDay(data));
    },
    [dispatch]
  );

  const handleCloseDay = useCallback(
    (data: CloseDayRequest) => {
      return dispatch(closeDay(data));
    },
    [dispatch]
  );

  const handleUpdateDayOperation = useCallback(
    (id: number, updates: Partial<any>) => {
      return dispatch(updateDayOperation({ id, updates }));
    },
    [dispatch]
  );

  // Error/success handlers
  const handleClearError = useCallback(() => {
    dispatch(clearActionError());
  }, [dispatch]);

  const handleClearSuccess = useCallback(() => {
    dispatch(clearActionSuccess());
  }, [dispatch]);

  const handleSetError = useCallback(
    (error: string) => {
      dispatch(setActionError(error));
    },
    [dispatch]
  );

  const handleSetSuccess = useCallback(
    (success: string) => {
      dispatch(setActionSuccess(success));
    },
    [dispatch]
  );

  // Refresh all data with optional force parameter
  const refreshAll = useCallback((force = false) => {
    const promises = [
      dispatch(fetchCurrentDayOperation({ force })),
      dispatch(fetchCurrentDayActivities({ force })),
      dispatch(fetchUserOrderStats({ force }))
    ];
    return Promise.all(promises);
  }, [dispatch]);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      // Initial fetch
      refreshAll();

      // Set up interval for auto refresh
      const intervalId = setInterval(() => {
        refreshAll();
      }, refreshInterval);

      // Clean up on unmount
      return () => {
        clearInterval(intervalId);
      };
    } else {
      // Just do initial fetch without auto refresh
      refreshAll();
    }
  }, [autoRefresh, refreshInterval, refreshAll]);

  return {
    // State
    currentDay,
    activities,
    userOrderStats,
    dayOperations,
    pagination,
    dailyReport,

    // Loading states
    currentDayLoading,
    activitiesLoading,
    userOrderStatsLoading,
    dayOperationsLoading,
    dailyReportLoading,
    actionLoading,

    // Error states
    currentDayError,
    activitiesError,
    userOrderStatsError,
    dayOperationsError,
    dailyReportError,
    actionError,
    actionSuccess,

    // Computed values
    isDayOpen,
    isDayClosed,
    hasActiveDay,
    lastRefresh,

    // Actions
    refreshCurrentDay,
    refreshActivities,
    refreshUserStats,
    refreshAll,
    getDayOperations,
    getDailyReport,
    openDay: handleOpenDay,
    closeDay: handleCloseDay,
    updateDayOperation: handleUpdateDayOperation,

    // Error/success handlers
    clearError: handleClearError,
    clearSuccess: handleClearSuccess,
    setError: handleSetError,
    setSuccess: handleSetSuccess
  };
};

export default useDayOperations;
