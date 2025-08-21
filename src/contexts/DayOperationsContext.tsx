import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { dayOperationsAPI } from "../api/dayOperations.api";
import { useAuth } from "./AuthContext";
import { ActivityLog, CloseDayRequest, DayOperation, OpenDayRequest } from "../types/inventory";
import type { DayOperationsContextType, DayOperationsProviderProps, UserOrderStats } from "../types/dayOperations";

const DayOperationsContext = createContext<DayOperationsContextType | undefined>(undefined);

export const DayOperationsProvider: React.FC<DayOperationsProviderProps> = ({
  children,
  autoRefreshInterval = 30000, // 30 seconds
  enableAutoRefresh = true
}) => {
  const { user } = useAuth();
  const [currentDay, setCurrentDay] = useState<DayOperation | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userOrderStats, setUserOrderStats] = useState<UserOrderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enableAutoRefresh);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const isDayOpen = currentDay?.status === "opened";
  const isDayClosed = currentDay?.status === "closed";
  const hasActiveDay = currentDay !== null;

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(null), []);

  // Refresh functions
  const refreshCurrentDay = useCallback(async () => {
    try {
      console.log("🔄 DayOperationsContext: Refreshing current day...");
      const response = await dayOperationsAPI.getCurrentDayOperation();
      setCurrentDay(response.currentDay);
      setLastRefresh(new Date());
      console.log("✅ DayOperationsContext: Current day refreshed", response.currentDay?.status);
    } catch (err) {
      console.error("❌ DayOperationsContext: Failed to refresh current day:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load current day";
      setError(errorMessage);
    }
  }, []);

  const refreshActivities = useCallback(async () => {
    if (!isDayOpen) {
      setActivities([]);
      return;
    }

    try {
      console.log("🔄 DayOperationsContext: Refreshing activities...");
      const response = await dayOperationsAPI.getCurrentDayActivities();
      setActivities(response.activities);
      console.log("✅ DayOperationsContext: Activities refreshed", response.activities.length, "items");
    } catch (err) {
      console.warn("⚠️ DayOperationsContext: Could not load activities:", err);
      setActivities([]);
    }
  }, [isDayOpen]);

  const refreshUserStats = useCallback(async () => {
    if (!isDayOpen) {
      setUserOrderStats([]);
      return;
    }

    try {
      console.log("🔄 DayOperationsContext: Refreshing user stats...");
      const response = await dayOperationsAPI.getUserOrderStats();
      setUserOrderStats(response.userOrderStats || []);
      console.log("✅ DayOperationsContext: User stats refreshed", response.userOrderStats?.length || 0, "users");
    } catch (err) {
      console.warn("⚠️ DayOperationsContext: Could not load user stats:", err);
      setUserOrderStats([]);
    }
  }, [isDayOpen]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 DayOperationsContext: Full refresh started...");

      // Always refresh current day first
      await refreshCurrentDay();

      // Then refresh activities and stats if day is open
      if (currentDay?.status === "opened") {
        await Promise.all([refreshActivities(), refreshUserStats()]);
      }

      console.log("✅ DayOperationsContext: Full refresh completed");
    } catch (err) {
      console.error("❌ DayOperationsContext: Full refresh failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh day operations";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshCurrentDay, refreshActivities, refreshUserStats, currentDay?.status]);

  // Day operations actions
  const openDay = useCallback(
    async (data: OpenDayRequest) => {
      try {
        setActionLoading(true);
        setError(null);

        console.log("🚀 DayOperationsContext: Opening day...", data);

        // Ensure user ID is included
        const openDayData = {
          ...data,
          userId: user?.id as any,
          openedBy: data.openedBy || user?.fullName || ""
        };

        const response = await dayOperationsAPI.openDay(openDayData);

        // Update current day immediately
        if (response.dayOperation) {
          setCurrentDay(response.dayOperation);
        }

        setSuccess(`Shift opened successfully! ${response.stockItemsCaptured} stock items captured.`);

        // Refresh all data after a short delay to ensure backend consistency
        setTimeout(() => {
          refreshAll();
        }, 500);

        console.log("✅ DayOperationsContext: Day opened successfully");
      } catch (err) {
        console.error("❌ DayOperationsContext: Failed to open day:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to open day";
        setError(errorMessage);
      } finally {
        setActionLoading(false);
      }
    },
    [user, refreshAll]
  );

  const closeDay = useCallback(
    async (data: CloseDayRequest) => {
      try {
        setActionLoading(true);
        setError(null);

        console.log("🛑 DayOperationsContext: Closing day...", data);

        // Ensure user ID is included
        const closeDayData = {
          ...data,
          userId: user?.id as any,
          closedBy: data.closedBy || user?.fullName || ""
        };

        const response = await dayOperationsAPI.closeDay(closeDayData);

        // Update current day immediately
        if (response.dayOperation) {
          setCurrentDay(response.dayOperation);
        }

        setSuccess(`Shift closed successfully! Total sales: $${response.summary?.totalSales.toFixed(2)}`);

        // Clear activities and stats since day is now closed
        setActivities([]);
        setUserOrderStats([]);

        // Refresh all data after a short delay to ensure backend consistency
        setTimeout(() => {
          refreshAll();
        }, 500);

        console.log("✅ DayOperationsContext: Day closed successfully");
      } catch (err) {
        console.error("❌ DayOperationsContext: Failed to close day:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to close day";
        setError(errorMessage);
      } finally {
        setActionLoading(false);
      }
    },
    [user, refreshAll]
  );

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshEnabled && isDayOpen) {
      console.log("🔄 DayOperationsContext: Starting auto-refresh interval", autoRefreshInterval / 1000, "seconds");

      const interval = setInterval(() => {
        console.log("⏰ DayOperationsContext: Auto-refresh triggered");
        refreshAll();
      }, autoRefreshInterval);

      setRefreshInterval(interval);

      return () => {
        console.log("🛑 DayOperationsContext: Stopping auto-refresh interval");
        clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefreshEnabled, isDayOpen, autoRefreshInterval, refreshAll]);

  // Initial load effect
  useEffect(() => {
    console.log("🚀 DayOperationsContext: Initial load started");
    refreshAll();
  }, []);

  // User change effect
  useEffect(() => {
    if (user) {
      console.log("👤 DayOperationsContext: User changed, refreshing data for:", user.fullName);
      refreshAll();
    }
  }, [user?.id]);

  const contextValue: DayOperationsContextType = {
    // State
    currentDay,
    activities,
    userOrderStats,
    loading,
    error,
    success,
    actionLoading,

    // Actions
    openDay,
    closeDay,
    refreshCurrentDay,
    refreshActivities,
    refreshUserStats,
    refreshAll,
    clearError,
    clearSuccess,
    setError,
    setSuccess,

    // Computed values
    isDayOpen,
    isDayClosed,
    hasActiveDay,

    // Real-time tracking
    lastRefresh,
    autoRefreshEnabled,
    setAutoRefreshEnabled
  };

  return <DayOperationsContext.Provider value={contextValue}>{children}</DayOperationsContext.Provider>;
};

// Custom hook to use the context
export const useDayOperations = (): DayOperationsContextType => {
  const context = useContext(DayOperationsContext);
  if (context === undefined) {
    throw new Error("useDayOperations must be used within a DayOperationsProvider");
  }
  return context;
};

// Export the context for advanced usage
export { DayOperationsContext };
