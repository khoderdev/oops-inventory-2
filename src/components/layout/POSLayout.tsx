import { ordersAPI } from "@/api/orders.api";
import { authAPI } from "@/api/auth";
import { dayOperationsAPI } from "@/api/dayOperations.api";
import { POSClientOrders } from "@/components/pos/POSClientOrders";
import { POSHeader } from "@/components/pos/POSHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DayOperationsModal from "@/components/DayOperationsModal/DayOperationsModal";
import PinInput from "@/components/ui/PinInput";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/types/auth";
import { POSLayoutProps, OpenDayRequest, CloseDayRequest, DayOperation, ActivityLog } from "@/types/inventory";
import { DayOperationsFormData, UserOrderStats } from "@/types/dayOperations";
import { AlertCircle, CheckCircle, GripVertical, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DailyReports from "@/components/analytics/DailyReports";
import { useDailyReports } from "@/hooks/useDailyReports";
import Sales from "../sales/Sales";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectShowLeftPanel, selectIsResizing, selectLeftPanelWidth, selectShowLockOverlay, selectUserDayOpen, selectCurrentDay, selectIsLocked } from "@/store/slices/posSelectors";
import { setShowLeftPanel, setIsResizing, setLeftPanelWidth, setShowLockOverlay, setUserDayOpen } from "@/store/slices/uiSlice";
import { fetchCurrentDayOperation } from "@/store/dayOperationsSlice";

const { getCurrentDayOperation, getDayOperations, getCurrentDayActivities, openDay, closeDay, getUserOrderStats } = dayOperationsAPI;

const POSLayout: React.FC<POSLayoutProps> = ({ children, incompleteOrdersCount = 0, onLogout, onOrderSelect, onRefreshCounts }) => {
  const { user, logout } = useAuth();
  const { hasPermission, hasRole } = usePermissions();
  const canAccessPOS = hasPermission(PERMISSIONS.POS_ACCESS);
  const canOpenDay = hasPermission(PERMISSIONS.DAY_OPERATIONS_CREATE);
  const canCloseDayPerm = hasPermission(PERMISSIONS.DAY_OPERATIONS_CLOSE);
  const canManageDay = canOpenDay || canCloseDayPerm;

  // Redux state selectors
  const dispatch = useAppDispatch();
  const showLeftPanel = useAppSelector(selectShowLeftPanel);
  const isResizing = useAppSelector(selectIsResizing);
  const leftPanelWidth = useAppSelector(selectLeftPanelWidth);
  const showLockOverlay = useAppSelector(selectShowLockOverlay);
  const userDayOpen = useAppSelector(selectUserDayOpen);
  const currentDay = useAppSelector(selectCurrentDay);
  const isLocked = useAppSelector(selectIsLocked);

  // Local state (only for things that don't need to be in Redux)
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutPinError, setLogoutPinError] = useState("");
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [showSalesHistoryDialog, setShowSalesHistoryDialog] = useState(false);
  const [, setShowDayOperationsModal] = useState(false);
  const [, setDayOperationType] = useState<"open" | "close">("open");
  const [userOrderStats, setUserOrderStats] = useState<UserOrderStats[]>([]);
  const [isCheckingDayStatus, setIsCheckingDayStatus] = useState(true);
  const [dayError, setDayError] = useState<string | null>(null);
  const [daySuccess, setDaySuccess] = useState<string | null>(null);
  const [openDayForm, setOpenDayForm] = useState<OpenDayRequest>({ openingCash: 0, openedBy: user?.fullName || "", notes: "" });
  const [closeDayForm, setCloseDayForm] = useState<CloseDayRequest>({ closingCash: 0, closedBy: user?.fullName || "", notes: "", userId: user?.id as any });
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [, setRecentDays] = useState<DayOperation[]>([]);
  const [, setActivities] = useState<ActivityLog[]>([]);
  const navigate = useNavigate();

  const { handleViewReport, showReportModal, setShowReportModal, selectedReport, loading: reportLoading, error: reportError, setError: setReportError } = useDailyReports();

  useEffect(() => {
    if (user) {
      if (user.fullName) {
        setOpenDayForm(prev => ({
          ...prev,
          openedBy: user.fullName
        }));
        setCloseDayForm(prev => ({
          ...prev,
          closedBy: user.fullName
        }));
      }
      setOpenDayForm(prev => ({
        ...prev,
        userId: user.id as any
      }));
      setCloseDayForm(prev => ({
        ...prev,
        userId: user.id as any
      }));
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentResponse = await getCurrentDayOperation();
      dispatch(setUserDayOpen(currentResponse.currentDay?.status === "opened"));

      // Hide lock overlay immediately if day is open
      if (currentResponse.currentDay?.status === "opened") {
        dispatch(setShowLockOverlay(false));
      }

      const recentResponse = await getDayOperations(1, 10);
      recentResponse.dayOperations.map(day => {
        const dateStr = day.date;
        let localDate: Date;
        if (typeof dateStr === "string" && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, dayNum] = dateStr.split("-").map(Number);
          localDate = new Date(year, month - 1, dayNum);
        } else {
          localDate = new Date(dateStr);
        }
        return {
          id: day.id,
          date: dateStr,
          dateType: typeof dateStr,
          openedAt: day.openedAt,
          closedAt: day.closedAt,
          parsedDate: new Date(dateStr),
          localDate: localDate,
          currentTime: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      });
      setRecentDays(recentResponse.dayOperations);
      if (currentResponse.currentDay && currentResponse.currentDay.status === "opened") {
        try {
          const activitiesResponse = await getCurrentDayActivities();
          setActivities(activitiesResponse.activities);
          try {
            const statsResponse = await getUserOrderStats();
            setUserOrderStats(statsResponse.userOrderStats || []);
          } catch (statsError) {
            setUserOrderStats([]);
          }
        } catch (activityError) {
          console.warn("Could not load activities:", activityError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load day operations");
    } finally {
      setLoading(false);
      setIsCheckingDayStatus(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dispatch(setIsResizing(true));

      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        const minWidth = 200;
        const maxWidth = containerRect.width * 0.35;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          dispatch(setLeftPanelWidth(newWidth));
        }
      };
      const handleMouseUp = () => {
        dispatch(setIsResizing(false));
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [dispatch]
  );

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      if (containerWidth < 1024) {
        dispatch(setShowLeftPanel(false));
      }
      const maxWidth = containerWidth * 0.35;
      if (leftPanelWidth > maxWidth) {
        dispatch(setLeftPanelWidth(Math.max(200, maxWidth)));
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [leftPanelWidth, showLeftPanel, dispatch]);

  const fetchOrdersCount = useCallback(async () => {
    try {
      const response = await ordersAPI.getOrders({ limit: 1000, offset: 0 });
      interface OrderData {
        id: string;
        createdAt?: string;
        status?: string;
        orderType?: string;
      }
      const responseData = response.data as { data?: OrderData[] } | OrderData[];
      const orders = Array.isArray(responseData) ? responseData : responseData?.data || [];
      const today = new Date().toISOString().split("T")[0];
      const incompleteOrdersToday = orders.filter(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : null;
        const isToday = orderDate === today;
        const isIncomplete = order.status && !["paid", "served", "completed"].includes(order.status);
        return isToday && isIncomplete;
      });
      incompleteOrdersCount = incompleteOrdersToday.length;
      // console.log("incompleteOrdersCount Today", incompleteOrdersCount);
    } catch (error) {
      console.error("Failed to fetch orders count:", error);
    }
  }, []);

  const fetchSalesCount = useCallback(async () => {
    try {
      const response = await ordersAPI.getOrders({ limit: 100, offset: 0 });
      const responseData = response.data as { data?: { orderType: string }[] } | { orderType: string }[];
    } catch (error) {
      console.error("Failed to fetch sales count:", error);
    }
  }, []);

  const handleCloseOrdersDialog = useCallback(() => {
    setShowOrdersDialog(false);
  }, []);

  const handleOrderSelect = useCallback((order: any) => {
    if (onOrderSelect) {
      onOrderSelect(order);
    }
    setShowOrdersDialog(false);
  }, []);

  const refreshCounts = useCallback(async () => {
    await Promise.all([fetchOrdersCount()]);
  }, [fetchOrdersCount]);

  useEffect(() => {
    if (onRefreshCounts) {
      onRefreshCounts(refreshCounts);
    }
  }, [onRefreshCounts, refreshCounts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "o") {
        e.preventDefault();
        handleOpenDayOperationsModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [userDayOpen]);

  useEffect(() => {
    fetchOrdersCount();
    fetchSalesCount();
    const ordersTimer = setInterval(fetchOrdersCount, 30000);
    const salesTimer = setInterval(fetchSalesCount, 30000);
    return () => {
      clearInterval(ordersTimer);
      clearInterval(salesTimer);
    };
  }, [fetchOrdersCount, fetchSalesCount]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  const handlePinLogout = async (pin: string) => {
    try {
      setLogoutPinError("");
      if (!user) {
        setLogoutPinError("User not found. Please contact administrator.");
        return;
      }
      try {
        const result = await authAPI.verifyPin(pin, user.id);
        if (result.verified) {
          if (onLogout) {
            onLogout();
          } else {
            await logout();
          }
          setShowLogoutDialog(false);
          setLogoutPinError("");
        } else {
          setLogoutPinError("Invalid PIN. Please try again.");
        }
      } catch (error: any) {
        console.error("PIN verification failed:", error);
        if (error.response?.data?.message) {
          setLogoutPinError(error.response.data.message);
        } else {
          setLogoutPinError("Invalid PIN. Please try again.");
        }
      }
    } catch (error) {
      console.error("Logout PIN verification error:", error);
      setLogoutPinError("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (user?.fullName) {
      setOpenDayForm(prev => ({
        ...prev,
        openedBy: user.fullName
      }));
      setCloseDayForm(prev => ({
        ...prev,
        closedBy: user.fullName
      }));
    }
  }, [user]);

  const handleOpenDayOperationsModal = () => {
    if (!canManageDay) return;
    const nextType: "open" | "close" = userDayOpen ? "close" : "open";
    setDayOperationType(nextType);
    if (nextType === "open") {
      setOpenDayForm(prev => ({
        ...prev,
        openingCash: 0,
        openedBy: user?.fullName || "",
        notes: ""
      }));
    } else {
      let expectedClosingCash = 0;
      if (user && userOrderStats.length > 0) {
        const userStats = userOrderStats.find(s => s.userId === user.id);
        if (userStats) {
          expectedClosingCash = (userStats.openingCash || 0) + (userStats.cashSales || 0);
        }
      } else if (currentDay) {
        expectedClosingCash = currentDay.expectedCash || 0;
      }
      setCloseDayForm(prev => ({
        ...prev,
        closingCash: expectedClosingCash,
        closedBy: user?.fullName || "",
        notes: ""
      }));
    }

    setShowDayOperationsModal(true);
  };

  const convertToModalFormData = (type: "open" | "close"): DayOperationsFormData => {
    if (type === "open") {
      return {
        openingCash: openDayForm.openingCash,
        openedBy: openDayForm.openedBy,
        notes: openDayForm.notes
      };
    } else {
      return {
        closingCash: closeDayForm.closingCash,
        closedBy: closeDayForm.closedBy,
        notes: closeDayForm.notes
      };
    }
  };

  const handleModalFormChange = (type: "open" | "close", data: DayOperationsFormData) => {
    if (type === "open") {
      setOpenDayForm({
        openingCash: data.openingCash || 0,
        openedBy: data.openedBy || "",
        notes: data.notes || "",
        userId: user?.id
      });
    } else {
      setCloseDayForm({
        closingCash: data.closingCash || 0,
        closedBy: data.closedBy || "",
        notes: data.notes || "",
        userId: user?.id
      });
    }
  };

  const refreshExpectedAndStats = useCallback(async () => {
    try {
      const [currentResponse, statsResponse] = await Promise.all([getCurrentDayOperation(), getUserOrderStats().catch(() => ({ userOrderStats: [] as UserOrderStats[] }))]);
      dispatch(fetchCurrentDayOperation());
      setUserOrderStats(statsResponse.userOrderStats || []);
      const latestExpected = currentResponse.currentDay?.expectedCash ?? 0;
      setCloseDayForm(prev => ({
        ...prev,
        closingCash: latestExpected,
        closedBy: user?.fullName || prev.closedBy || "",
        userId: (user?.id as any) ?? prev.userId
      }));
    } catch (e) {
      console.warn("Failed to refresh expected cash or user stats before showing modal", e);
    }
  }, [getCurrentDayOperation, getUserOrderStats, user?.fullName, user?.id]);

  const handleShowCloseModal = useCallback(async () => {
    if (!canCloseDayPerm) return;
    await refreshExpectedAndStats();
    setShowCloseModal(true);
  }, [refreshExpectedAndStats, canCloseDayPerm]);

  const handleShowOpenModal = useCallback(() => {
    if (!canOpenDay) return;
    setShowOpenModal(true);
  }, [canOpenDay]);

  useEffect(() => {
    if (!showCloseModal) return;
    refreshExpectedAndStats();
    const id = window.setInterval(() => {
      refreshExpectedAndStats();
    }, 10000);
    return () => window.clearInterval(id);
  }, [showCloseModal, refreshExpectedAndStats]);

  useEffect(() => {
    if (isCheckingDayStatus) {
      // Don't show overlay while checking - wait for actual status
      return;
    }
    // Only show overlay if day is explicitly closed (not unknown)
    dispatch(setShowLockOverlay(isLocked));
  }, [isLocked, isCheckingDayStatus, dispatch]);

  //------------------------------------------------------

  const handleCloseDay = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const response = await closeDay({ ...closeDayForm, userId: user?.id as any });
      if (response.dayOperation) {
        const isDayOpen = response.dayOperation.status === "opened";
        dispatch(setUserDayOpen(isDayOpen));
        // Show lock overlay immediately when day closes
        if (!isDayOpen) {
          dispatch(setShowLockOverlay(true));
        }
      }
      setShowCloseModal(false);
      setCloseDayForm({ closingCash: 0, closedBy: user?.fullName || "", notes: "", userId: user?.id as any });
      setTimeout(async () => {
        await loadData();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close day");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex flex-col overflow-hidden relative safe-area-padding">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>
      {/* POS Header */}
      <POSHeader currentTime={currentTime} isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} setShowLogoutDialog={setShowLogoutDialog} setShowOrdersDialog={setShowOrdersDialog} setShowSalesHistoryDialog={setShowSalesHistoryDialog} handleShowOpenModal={handleShowOpenModal} handleShowCloseModal={handleShowCloseModal} incompleteOrdersCount={incompleteOrdersCount} isLocked={isLocked} currentDay={currentDay} onCloseDayClick={handleCloseDay} />
      {/* Main POS Content - Resizable Layout */}
      <main className="relative flex-1 overflow-hidden z-10" ref={containerRef}>
        <div className="h-full w-full flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
          {/* Left Resizable Panel */}
          {showLeftPanel && (
            <>
              {/* Resize Handle */}
              <div ref={resizeRef} onMouseDown={handleMouseDown} className={`w-1 bg-slate-300/50 dark:bg-slate-600/50 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-col-resize transition-colors duration-200 relative group ${isResizing ? "bg-blue-500 dark:bg-blue-400" : ""}`}>
                <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
                  <GripVertical className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </>
          )}

          {/* Right Panel - Main Content */}
          <div className="flex-1 relative overflow-hidden">
            <div className="h-full w-full pointer-events-auto">{React.cloneElement(children as React.ReactElement, { isDayOpen: userDayOpen })}</div>
            {/* Lock overlay removed - using DayOperationsModal instead */}
          </div>
        </div>
      </main>
      {/* Orders Dialog */}
      <POSClientOrders isOpen={showOrdersDialog} onClose={handleCloseOrdersDialog} onOrderSelect={handleOrderSelect} />
      {/* Sales History Dialog */}
      <Dialog open={showSalesHistoryDialog} onOpenChange={setShowSalesHistoryDialog}>
        <DialogContent className="max-w-screen h-[100vh] shadow-2xl p-0 overflow-auto">
          <div className="h-full overflow-auto">{showSalesHistoryDialog && <Sales key={showSalesHistoryDialog ? "sales-history-open" : "sales-history-closed"} onClose={() => setShowSalesHistoryDialog(false)} />}</div>
        </DialogContent>
      </Dialog>

      {/* Day Operations Modal - Unified for both open and close, auto-shows when day is locked */}
      {canOpenDay && (
        <DayOperationsModal
          open={showOpenModal || (canAccessPOS && isLocked && showLockOverlay)}
          onOpenChange={open => {
            // Always update the manual open state
            setShowOpenModal(open);

            // When modal closes, hide the lock overlay to prevent it from reopening
            if (!open) {
              dispatch(setShowLockOverlay(false));
            }
          }}
          type="open"
        />
      )}

      {/* Close Day Modal - Staff only */}
      {canCloseDayPerm && <DayOperationsModal open={showCloseModal} onOpenChange={setShowCloseModal} type="close" currentDay={currentDay} />}

      {/* Day Operation Alerts */}
      {dayError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center max-w-md shadow-lg">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-red-700 text-sm sm:text-base flex-1">{dayError}</span>
          <button onClick={() => setDayError(null)} className="ml-2 sm:ml-auto text-red-500 hover:text-red-700 text-lg sm:text-xl">
            ×
          </button>
        </div>
      )}
      {daySuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center max-w-md shadow-lg">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-green-700 text-sm sm:text-base flex-1">{daySuccess}</span>
          <button onClick={() => setDaySuccess(null)} className="ml-2 sm:ml-auto text-green-500 hover:text-green-700 text-lg sm:text-xl">
            ×
          </button>
        </div>
      )}
      {/* Logout Confirmation Dialog */}
      <Dialog
        open={showLogoutDialog}
        onOpenChange={open => {
          setShowLogoutDialog(open);
          if (!open) setLogoutPinError("");
        }}
      >
        <DialogContent className="sm:max-w-sm bg-white backdrop-blur-xl border border-primary shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-teal-500 rounded-lg" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex justify-center items-center space-x-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent font-semibold">Confirm Logout</span>
            </DialogTitle>
          </DialogHeader>

          <div className="relative z-10 py-4 pt-6">
            <PinInput onSubmit={handlePinLogout} onClear={() => setLogoutPinError("")} submitLabel="Logout" submitButtonClassName="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" className="w-full" />
            {logoutPinError && <p className="text-red-500 text-sm mt-2 text-center">{logoutPinError}</p>}
          </div>
        </DialogContent>
      </Dialog>
      {/* Daily Report Modal */}
      <DailyReports showReportModal={showReportModal} setShowReportModal={setShowReportModal} selectedReport={selectedReport} error={reportError} setError={setReportError} />
    </div>
  );
};

export default POSLayout;
