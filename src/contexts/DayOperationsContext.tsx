// import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { dayOperationsAPI } from "../api/dayOperations.api";
// import { useAuth } from "./AuthContext";
// import { ActivityLog, CloseDayRequest, DayOperation, OpenDayRequest } from "../types/inventory";
// import type { DayOperationsContextType, DayOperationsProviderProps, UserOrderStats } from "../types/dayOperations";

// const DayOperationsContext = createContext<DayOperationsContextType | undefined>(undefined);

// export const DayOperationsProvider: React.FC<DayOperationsProviderProps> = ({
//   children,
//   autoRefreshInterval = 30000,
//   enableAutoRefresh = true
// }) => {
//   const { user } = useAuth();
//   const [currentDay, setCurrentDay] = useState<DayOperation | null>(null);
//   const [activities, setActivities] = useState<ActivityLog[]>([]);
//   const [userOrderStats, setUserOrderStats] = useState<UserOrderStats[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
//   const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enableAutoRefresh);
//   const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
//   const isDayOpen = currentDay?.status === "opened";
//   const isDayClosed = currentDay?.status === "closed";
//   const hasActiveDay = currentDay !== null;

//   const clearError = useCallback(() => setError(null), []);
//   const clearSuccess = useCallback(() => setSuccess(null), []);

//   // Refresh functions
//   const refreshCurrentDay = useCallback(async () => {
//     try {
//       // console.log("🔄 DayOperationsContext: Refreshing current day...");
//       const response = await dayOperationsAPI.getCurrentDayOperation();
//       setCurrentDay(response.currentDay);
//       setLastRefresh(new Date());
//       // console.log("✅ DayOperationsContext: Current day refreshed", response.currentDay?.status);
//     } catch (err) {
//       console.error("❌ DayOperationsContext: Failed to refresh current day:", err);
//       const errorMessage = err instanceof Error ? err.message : "Failed to load current day";
//       setError(errorMessage);
//     }
//   }, []);

//   const refreshActivities = useCallback(async () => {
//     if (!isDayOpen) {
//       setActivities([]);
//       return;
//     }

//     try {
//       // console.log("🔄 DayOperationsContext: Refreshing activities...");
//       const response = await dayOperationsAPI.getCurrentDayActivities();
//       setActivities(response.activities);
//       // console.log("✅ DayOperationsContext: Activities refreshed", response.activities.length, "items");
//     } catch (err) {
//       console.warn("⚠️ DayOperationsContext: Could not load activities:", err);
//       setActivities([]);
//     }
//   }, [isDayOpen]);

//   const refreshUserStats = useCallback(async () => {
//     if (!isDayOpen) {
//       setUserOrderStats([]);
//       return;
//     }

//     try {
//       // console.log("🔄 DayOperationsContext: Refreshing user stats...");
//       const response = await dayOperationsAPI.getUserOrderStats();
//       setUserOrderStats(response.userOrderStats || []);
//       // console.log("✅ DayOperationsContext: User stats refreshed", response.userOrderStats?.length || 0, "users");
//     } catch (err) {
//       console.warn("⚠️ DayOperationsContext: Could not load user stats:", err);
//       setUserOrderStats([]);
//     }
//   }, [isDayOpen]);

//   const refreshAll = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       await refreshCurrentDay();
//       try {
//         const response = await dayOperationsAPI.getCurrentDayOperation();
//         const freshCurrentDay = response.currentDay;
//         if (freshCurrentDay?.status === "opened") {
//           await Promise.all([refreshActivities(), refreshUserStats()]);
//         }
//       } catch (err) {
//         console.warn("⚠️ Could not get fresh current day for activities refresh:", err);
//       }
//     } catch (err) {
//       console.error("❌ DayOperationsContext: Full refresh failed:", err);
//       const errorMessage = err instanceof Error ? err.message : "Failed to refresh day operations";
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [refreshCurrentDay, refreshActivities, refreshUserStats]);

//   // Day operations actions
//   const openDay = useCallback(
//     async (data: OpenDayRequest) => {
//       try {
//         setActionLoading(true);
//         setError(null);
//         const openDayData = {
//           ...data,
//           userId: user?.id as any,
//           openedBy: data.openedBy || user?.fullName || ""
//         };
//         const response = await dayOperationsAPI.openDay(openDayData);
//         if (response.dayOperation) {
//           setCurrentDay(response.dayOperation);
//           setLastRefresh(new Date());
//         }
//         refreshAll();
//       } catch (err) {
//         console.error("❌ DayOperationsContext: Failed to open day:", err);
//         const errorMessage = err instanceof Error ? err.message : "Failed to open day";
//         setError(errorMessage);
//       } finally {
//         setActionLoading(false);
//       }
//     },
//     [user, refreshAll]
//   );

//   const closeDay = useCallback(
//     async (data: CloseDayRequest) => {
//       try {
//         setActionLoading(true);
//         setError(null);
//         const closeDayData = {
//           ...data,
//           userId: user?.id as any,
//           closedBy: data.closedBy || user?.fullName || ""
//         };
//         const response = await dayOperationsAPI.closeDay(closeDayData);
//         if (response.dayOperation) {
//           setCurrentDay(response.dayOperation);
//           setLastRefresh(new Date());
//         }
//         setActivities([]);
//         setUserOrderStats([]);
//         refreshAll();
//       } catch (err) {
//         console.error("❌ DayOperationsContext: Failed to close day:", err);
//         const errorMessage = err instanceof Error ? err.message : "Failed to close day";
//         setError(errorMessage);
//       } finally {
//         setActionLoading(false);
//       }
//     },
//     [user, refreshAll]
//   );

//   // Auto-refresh effect
//   useEffect(() => {
//     if (autoRefreshEnabled && isDayOpen) {
//       const interval = setInterval(() => {
//         refreshAll();
//       }, autoRefreshInterval);

//       setRefreshInterval(interval);

//       return () => {
//         // console.log("🛑 DayOperationsContext: Stopping auto-refresh interval");
//         clearInterval(interval);
//       };
//     } else {
//       if (refreshInterval) {
//         clearInterval(refreshInterval);
//         setRefreshInterval(null);
//       }
//     }
//   }, [autoRefreshEnabled, isDayOpen, autoRefreshInterval, refreshAll]);

//   // Initial load effect
//   useEffect(() => {
//     refreshAll();
//   }, []);

//   // User change effect
//   useEffect(() => {
//     if (user) {
//       // console.log("👤 DayOperationsContext: User changed, refreshing data for:", user.fullName);
//       refreshAll();
//     }
//   }, [user?.id]);

//   const contextValue: DayOperationsContextType = {
//     currentDay,
//     activities,
//     userOrderStats,
//     loading,
//     error,
//     success,
//     actionLoading,
//     openDay,
//     closeDay,
//     refreshCurrentDay,
//     refreshActivities,
//     refreshUserStats,
//     refreshAll,
//     clearError,
//     clearSuccess,
//     setError,
//     setSuccess,
//     isDayOpen,
//     isDayClosed,
//     hasActiveDay,
//     lastRefresh,
//     autoRefreshEnabled,
//     setAutoRefreshEnabled
//   };

//   return <DayOperationsContext.Provider value={contextValue}>{children}</DayOperationsContext.Provider>;
// };

// // Custom hook to use the context
// export const useDayOperations = (): DayOperationsContextType => {
//   const context = useContext(DayOperationsContext);
//   if (context === undefined) {
//     throw new Error("useDayOperations must be used within a DayOperationsProvider");
//   }
//   return context;
// };

// // Export the context for advanced usage
// export { DayOperationsContext };
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { dayOperationsAPI } from "../api/dayOperations.api";
import { useAuth } from "./AuthContext";
import { ActivityLog, CloseDayRequest, DayOperation, OpenDayRequest } from "../types/inventory";
import type { DayOperationsContextType, DayOperationsProviderProps, UserOrderStats } from "../types/dayOperations";

const DayOperationsContext = createContext<DayOperationsContextType | undefined>(undefined);

// Mock date and time for development - change these values as needed
const MOCK_DATE_TIME = {
  enabled: true, // Set to true to use mock date/time
  date: new Date('2023-11-16T15:00:00'), // Change this to any date/time you want
};

export const DayOperationsProvider: React.FC<DayOperationsProviderProps> = ({
  children,
  autoRefreshInterval = 30000,
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
  
  // State for manual time control
  const [timeOverride, setTimeOverride] = useState(MOCK_DATE_TIME);

  const isDayOpen = currentDay?.status === "opened";
  const isDayClosed = currentDay?.status === "closed";
  const hasActiveDay = currentDay !== null;

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(null), []);

  // Function to get the current time (real or mocked)
  const getCurrentTime = useCallback(() => {
    if (timeOverride.enabled) {
      return new Date(timeOverride.date);
    }
    return new Date();
  }, [timeOverride]);

  // Function to toggle between real time and mock time
  const toggleMockTime = useCallback((enabled: boolean, mockDate?: Date) => {
    setTimeOverride({
      enabled,
      date: mockDate || timeOverride.date
    });
    
  }, [timeOverride.date]);

  // Function to update the mock date
  const updateMockDate = useCallback((newDate: Date) => {
    setTimeOverride(prev => ({
      ...prev,
      date: newDate
    }));
    setSuccess(`Mock time updated to: ${newDate.toLocaleString()}`);
  }, []);

  // Refresh functions
  const refreshCurrentDay = useCallback(async () => {
    try {
      const response = await dayOperationsAPI.getCurrentDayOperation();
      setCurrentDay(response.currentDay);
      setLastRefresh(getCurrentTime());
    } catch (err) {
      console.error("❌ DayOperationsContext: Failed to refresh current day:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load current day";
      setError(errorMessage);
    }
  }, [getCurrentTime]);

  const refreshActivities = useCallback(async () => {
    if (!isDayOpen) {
      setActivities([]);
      return;
    }

    try {
      const response = await dayOperationsAPI.getCurrentDayActivities();
      setActivities(response.activities);
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
      const response = await dayOperationsAPI.getUserOrderStats();
      setUserOrderStats(response.userOrderStats || []);
    } catch (err) {
      console.warn("⚠️ DayOperationsContext: Could not load user stats:", err);
      setUserOrderStats([]);
    }
  }, [isDayOpen]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshCurrentDay();
      try {
        const response = await dayOperationsAPI.getCurrentDayOperation();
        const freshCurrentDay = response.currentDay;
        if (freshCurrentDay?.status === "opened") {
          await Promise.all([refreshActivities(), refreshUserStats()]);
        }
      } catch (err) {
        console.warn("⚠️ Could not get fresh current day for activities refresh:", err);
      }
    } catch (err) {
      console.error("❌ DayOperationsContext: Full refresh failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh day operations";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshCurrentDay, refreshActivities, refreshUserStats]);

  // Day operations actions
  const openDay = useCallback(
    async (data: OpenDayRequest) => {
      try {
        setActionLoading(true);
        setError(null);
        const openDayData = {
          ...data,
          userId: user?.id as any,
          openedBy: data.openedBy || user?.fullName || "",
          openedAt: getCurrentTime() // Use the current time (real or mocked)
        };
        const response = await dayOperationsAPI.openDay(openDayData);
        if (response.dayOperation) {
          setCurrentDay(response.dayOperation);
          setLastRefresh(getCurrentTime());
        }
        refreshAll();
      } catch (err) {
        console.error("❌ DayOperationsContext: Failed to open day:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to open day";
        setError(errorMessage);
      } finally {
        setActionLoading(false);
      }
    },
    [user, refreshAll, getCurrentTime]
  );

  const closeDay = useCallback(
    async (data: CloseDayRequest) => {
      try {
        setActionLoading(true);
        setError(null);
        const closeDayData = {
          ...data,
          userId: user?.id as any,
          closedBy: data.closedBy || user?.fullName || "",
          closedAt: getCurrentTime() // Use the current time (real or mocked)
        };
        const response = await dayOperationsAPI.closeDay(closeDayData);
        if (response.dayOperation) {
          setCurrentDay(response.dayOperation);
          setLastRefresh(getCurrentTime());
        }
        setActivities([]);
        setUserOrderStats([]);
        refreshAll();
      } catch (err) {
        console.error("❌ DayOperationsContext: Failed to close day:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to close day";
        setError(errorMessage);
      } finally {
        setActionLoading(false);
      }
    },
    [user, refreshAll, getCurrentTime]
  );

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshEnabled && isDayOpen) {
      const interval = setInterval(() => {
        refreshAll();
      }, autoRefreshInterval);

      setRefreshInterval(interval);

      return () => {
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
    refreshAll();
  }, []);

  // User change effect
  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user?.id]);

  const contextValue: DayOperationsContextType = {
    currentDay,
    activities,
    userOrderStats,
    loading,
    error,
    success,
    actionLoading,
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
    isDayOpen,
    isDayClosed,
    hasActiveDay,
    lastRefresh,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    // Add time control functions to context
    getCurrentTime,
    timeOverride,
    toggleMockTime,
    updateMockDate
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