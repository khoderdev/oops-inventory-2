import { ordersAPI } from "@/api/orders.api";
import { authAPI } from "@/api/auth";
import { dayOperationsAPI } from "@/api/dayOperations.api";
import { POSClientOrders } from "@/components/pos/POSClientOrders";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DayOperationsModal from "@/components/DayOperationsModal/DayOperationsModal";
import PinInput from "@/components/ui/PinInput";
import { useAuth } from "@/contexts/AuthContext";
import { SalesHistoryPage } from "@/pages/SalesHistoryPage";
import { POSLayoutProps, OpenDayRequest, CloseDayRequest } from "@/types/inventory";
import { DayOperationsFormData, UserOrderStats } from "@/types/dayOperations";
import { LOGO_CONFIGS, useCachedLogo } from "@/utils/logoCache";
import { AlertCircle, Banknote, Calendar, Clock, GripVertical, List, Maximize2, Minimize2, Power, ShoppingCart } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

const POSLayout: React.FC<POSLayoutProps> = ({ children, incompleteOrdersCount = 0, onLogout, onOrderSelect, onRefreshCounts }) => {
  const { user, logout, hasRole } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutPinError, setLogoutPinError] = useState("");
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [showSalesHistoryDialog, setShowSalesHistoryDialog] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showDayOperationsModal, setShowDayOperationsModal] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [userDayOpen, setUserDayOpen] = useState(false);
  const [dayOperationType, setDayOperationType] = useState<"open" | "close">("open");
  const [dayFormData, setDayFormData] = useState<DayOperationsFormData>({});
  const [isLoadingDayOperation, setIsLoadingDayOperation] = useState(false);
  const [currentDay, setCurrentDay] = useState<{ expectedCash?: number } | null>(null);
  const [userOrderStats, setUserOrderStats] = useState<UserOrderStats[]>([]);
  const [showLockOverlay, setShowLockOverlay] = useState(false);
  const [isCheckingDayStatus, setIsCheckingDayStatus] = useState(true);
  const isLocked = isCheckingDayStatus ? false : (hasRole("staff") ? !userDayOpen : !isDayOpen);

  // Helper to refresh day status and user stats without triggering modals
  const refreshDayAndStats = useCallback(async () => {
    try {
      const { currentDay } = await dayOperationsAPI.getCurrentDayOperation();
      const isOpen = currentDay?.status === "opened";
      setIsDayOpen(!!isOpen);

      if (currentDay) {
        setCurrentDay({
          expectedCash: currentDay.expectedCash || currentDay.openingCash || 0
        });

        try {
          const { userOrderStats: stats } = await dayOperationsAPI.getUserOrderStats();
          setUserOrderStats(stats);

          if (user && stats) {
            const currentUserStats = stats.find(stat => stat.userId === user.id);
            const computedIsUserDayOpen = Boolean(currentUserStats?.openingTime && !currentUserStats?.closingTime);
            setUserDayOpen(computedIsUserDayOpen);
          } else {
            setUserDayOpen(false);
          }
        } catch (error) {
          console.error("User stats refresh error:", error);
          setUserDayOpen(false);
        }
      } else {
        setCurrentDay(null);
        setUserDayOpen(false);
      }
    } catch (error) {
      console.error("Day status refresh error:", error);
      setIsDayOpen(false);
      setUserDayOpen(false);
    }
  }, [user]);

  useEffect(() => {
    let modalTimer: number | undefined;
    const fetchDayStatus = async () => {
      setIsCheckingDayStatus(true);
      try {
        const { currentDay } = await dayOperationsAPI.getCurrentDayOperation();
        const isOpen = currentDay?.status === "opened"; // Make sure this matches your backend enum
        setIsDayOpen(isOpen);

        let computedIsUserDayOpen = false;

        if (currentDay) {
          setCurrentDay({
            expectedCash: currentDay.expectedCash || currentDay.openingCash || 0
          });

          try {
            const { userOrderStats: stats } = await dayOperationsAPI.getUserOrderStats();
            setUserOrderStats(stats);

            if (user && stats) {
              const currentUserStats = stats.find(stat => stat.userId === user.id);
              // Make sure we're checking both openingTime and closingTime
              computedIsUserDayOpen = Boolean(currentUserStats?.openingTime && !currentUserStats?.closingTime);
              setUserDayOpen(computedIsUserDayOpen);
            }
          } catch (error) {
            console.error("User stats error:", error);
            setUserDayOpen(false);
            computedIsUserDayOpen = false;
          }
        }

        // Debug logging
        console.log("Day status:", {
          globalDayOpen: isOpen,
          userDayOpen: computedIsUserDayOpen,
          currentDayStatus: currentDay?.status
        });


        const shouldForceOpen = hasRole("staff") ? (user ? !computedIsUserDayOpen : false) : !isOpen;

        if (shouldForceOpen) {
          modalTimer = window.setTimeout(() => {
            setDayOperationType("open");
            setShowDayOperationsModal(true);
          }, 600);
        }
      } catch (error) {
        console.error("Day status error:", error);
        setIsDayOpen(false);
        setUserDayOpen(false);
      } finally {
        setIsCheckingDayStatus(false);
      }
    };

    fetchDayStatus();
    const intervalId = setInterval(fetchDayStatus, 5 * 60 * 1000);
    return () => {
      clearInterval(intervalId);
      if (modalTimer) window.clearTimeout(modalTimer);
    };
  }, [user]);

  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { logoSrc, isLoaded } = useCachedLogo(LOGO_CONFIGS.MAIN_LOGO);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const minWidth = 200;
      const maxWidth = containerRect.width * 0.35;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setLeftPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      if (containerWidth < 1024) {
        setShowLeftPanel(false);
      }
      const maxWidth = containerWidth * 0.35;
      if (leftPanelWidth > maxWidth) {
        setLeftPanelWidth(Math.max(200, maxWidth));
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [leftPanelWidth, showLeftPanel]);

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
      console.log("incompleteOrdersCount Today", incompleteOrdersCount);
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

  const handleCloseSalesHistoryDialog = useCallback(() => {
    setShowSalesHistoryDialog(false);
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

  // Day Operations handlers
  const handleOpenDayOperationsModal = () => {
    const isStaff = hasRole("staff");
    const nextType: "open" | "close" = isStaff ? (userDayOpen ? "close" : "open") : (isDayOpen ? "close" : "open");
    setDayOperationType(nextType);
    let openingCash = 0;
    let closingCash = 0;
    if (user && userOrderStats.length > 0) {
      const userStats = userOrderStats.find(s => s.userId === user.id);
      if (userStats) {
        openingCash = userStats.openingCash || 0;
        closingCash = (userStats.openingCash || 0) + (userStats.cashSales || 0);
      }
    }
    setDayFormData({
      openingCash: nextType === "open" ? openingCash : 0,
      closingCash: nextType === "close" ? closingCash : 0,
      openedBy: user?.username || "",
      closedBy: user?.username || "",
      notes: "",
      userId: isStaff ? user?.id : undefined
    });

    setShowDayOperationsModal(true);
  };

  const handleDayFormChange = (data: DayOperationsFormData) => {
    setDayFormData(data);
  };

  const showToast = async (message: string, variant: "success" | "error" | "info") => {
    try {
      const { toast } = await import("@/components/ui/use-toast");
      toast({
        title: variant === "success" ? "Success" : variant === "error" ? "Error" : "Info",
        description: message,
        variant: variant === "success" ? "default" : "destructive",
        duration: 1500
      });
    } catch (e) {
      console.log(message);
      alert(message);
    }
  };

  const handleDayOperationSubmit = async () => {
    setIsLoadingDayOperation(true);
    try {
      const isStaff = hasRole("staff");
      if (dayOperationType === "open") {
        const openDayRequest: OpenDayRequest = {
          openingCash: Number(dayFormData.openingCash) || 0,
          openedBy: user?.username || "System",
          notes: dayFormData.notes || "",
          ...(isStaff ? { userId: user?.id } : {})
        };
        await dayOperationsAPI.openDay(openDayRequest);
        setUserDayOpen(true);
        if (!isStaff) setIsDayOpen(true);
      } else {
        const closeDayRequest: CloseDayRequest = {
          closingCash: Number(dayFormData.closingCash) || 0,
          closedBy: user?.username || "System",
          notes: dayFormData.notes || "",
          ...(isStaff ? { userId: user?.id } : {})
        };
        await dayOperationsAPI.closeDay(closeDayRequest);
        setUserDayOpen(false);
        if (!isStaff) setIsDayOpen(false);
      }
      // Keep UI data fresh
      // Small delay to avoid racing DB commit/caches
      await new Promise(resolve => setTimeout(resolve, 250));
      await refreshDayAndStats();
      showToast(`Operation successful`, "success");
      setShowDayOperationsModal(false);
    } catch (error) {
      console.error("Day operation failed:", error);
      let errorMessage = error.message;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.status === 400) {
        errorMessage = "Invalid request data. Please check your inputs.";
      }
      showToast(`Operation failed: ${errorMessage}`, "error");
    } finally {
      setIsLoadingDayOperation(false);
    }
  };

  {
    {
      isLocked && showLockOverlay && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-[90%] text-center border border-slate-200/60 dark:border-slate-700/60">
            <div className="mb-3 text-slate-900 dark:text-slate-100 font-semibold">{hasRole("staff") ? "Your shift is not open" : "Day is not open"}</div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{hasRole("staff") ? "Please open your shift to start taking orders" : "Please open the day to start operations"}</p>
            <button onClick={handleOpenDayOperationsModal} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              {hasRole("staff") ? "Open Shift" : "Open Day"}
            </button>
          </div>
        </div>
      );
    }
  }

  // Delay showing the lock overlay slightly for better UX, but don't show during initial status check
  useEffect(() => {
    let overlayTimer: number | undefined;
    if (isCheckingDayStatus) {
      setShowLockOverlay(false);
      return () => {
        if (overlayTimer) window.clearTimeout(overlayTimer);
      };
    }
    if (isLocked) {
      overlayTimer = window.setTimeout(() => setShowLockOverlay(true), 1500);
    } else {
      setShowLockOverlay(false);
    }
    return () => {
      if (overlayTimer) window.clearTimeout(overlayTimer);
    };
  }, [isLocked, isCheckingDayStatus]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex flex-col overflow-hidden relative safe-area-padding">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>
      {/* POS Header - Enhanced Responsive */}
      <header className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b border-slate-200/20 dark:border-slate-600/30 shadow-xl backdrop-blur-sm safe-area-top flex items-center justify-between shrink-0 z-40">
        {/* Responsive padding */}
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 dark:from-white/5 dark:to-white/10 backdrop-blur-sm" />
          {/* Left Section - Branding */}
          <div className="hidden md:block items-center z-10 select-none">
            {!isLoaded && (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img src={logoSrc} alt="Logo" className="w-24" />
          </div>

          {/* Center Section - Date & Time */}
          <div className="relative flex items-center space-x-3 z-10 select-none">
            <div className="group hidden lg:block">
              <div className="flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20">
                <Calendar className="w-4 h-4 text-blue-300 group-hover:text-blue-200 transition-colors" />
                <span className="text-sm font-mono font-medium text-white/90 group-hover:text-white transition-colors">{formatDate(currentTime)}</span>
              </div>
            </div>
            <div className="group hidden lg:block">
              <div className="flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20">
                <Clock className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
                <span className="text-sm font-mono font-medium text-white/90 group-hover:text-white transition-colors tabular-nums">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>

          {/* Right Section - User & Controls */}
          <div className="relative flex items-center space-x-3 z-10 select-none">
            {/* Day Operations Button - Only for staff users */}
            {hasRole("staff") && (
              <button onClick={handleOpenDayOperationsModal} className="group relative select-none transition-all duration-300 hover:scale-105 active:scale-95">
                <div className={`absolute inset-0 ${userDayOpen ? "bg-gradient-to-r from-red-500/20 to-orange-500/20" : "bg-gradient-to-r from-green-500/20 to-emerald-500/20"} rounded-xl blur-sm group-hover:blur-none transition-all duration-300`} />
                <div className="relative flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 cursor-pointer">
                  {userDayOpen ? <Banknote className="w-4 h-4 text-red-300 group-hover:text-red-200 transition-colors" /> : <Calendar className="w-4 h-4 text-green-300 group-hover:text-green-200 transition-colors" />}
                  <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors">{userDayOpen ? "Close Shift" : "Open Shift"}</span>
                </div>
              </button>
            )}
            {/* Session Stats */}
            <div className="flex items-center space-x-2 select-none">
              {!hasRole("staff") && (
                <button onClick={() => setShowSalesHistoryDialog(true)} className="group relative select-none transition-all duration-300 hover:scale-105 active:scale-95">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl blur-sm group-hover:blur-none transition-all duration-300" />
                  <div className="relative flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 cursor-pointer">
                    <List className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-medium text-white/70 uppercase tracking-wide">Sales History</span>
                    </div>
                  </div>
                </button>
              )}
              {/* Transactions Card - Clickable */}
              <button
                onClick={() => {
                  if (!isLocked) setShowOrdersDialog(true);
                }}
                className="group relative select-none transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                disabled={isLocked}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-sm group-hover:blur-none transition-all duration-300" />
                <div className="relative flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 cursor-pointer">
                  <ShoppingCart className="w-4 h-4 text-blue-300 group-hover:text-blue-200 transition-colors" />
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium text-white/70 uppercase tracking-wide">Orders:</span>
                    <span className="text-sm font-bold text-blue-300 group-hover:text-blue-200 transition-colors tabular-nums">{incompleteOrdersCount}</span>
                  </div>
                </div>
              </button>
            </div>

            {/* User Info */}
            <div className="group select-none">
              <div className="flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-xs">{(user?.username || "U").charAt(0).toUpperCase()}</div>
                <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{user?.username || "User"}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              <button onClick={toggleFullscreen} className="group relative h-9 w-9 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-white/80 group-hover:text-white transition-colors relative z-10" /> : <Maximize2 className="w-4 h-4 text-white/80 group-hover:text-white transition-colors relative z-10" />}
              </button>

              <button onClick={() => setShowLogoutDialog(true)} className="group relative h-9 w-9 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-red-500/20 hover:scale-110 active:scale-95 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Power className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors relative z-10" />
              </button>
            </div>
          </div>
        </div>
      </header>
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
            <div className="h-full w-full pointer-events-auto">{children}</div>
            {isLocked && showLockOverlay && (
              <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-[90%] text-center border border-slate-200/60 dark:border-slate-700/60">
                  <div className="mb-3 text-slate-900 dark:text-slate-100 font-semibold">Day is not open</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Please open the day to start taking orders.</p>
                  <button onClick={handleOpenDayOperationsModal} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                    Open Day
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Orders Dialog */}
      <POSClientOrders isOpen={showOrdersDialog} onClose={handleCloseOrdersDialog} onOrderSelect={handleOrderSelect} />
      {/* Sales History Dialog */}
      <Dialog open={showSalesHistoryDialog} onOpenChange={setShowSalesHistoryDialog}>
        <DialogContent className="max-w-screen h-[100vh] shadow-2xl p-0 overflow-auto">
          <div className="h-full overflow-auto">
            <SalesHistoryPage isOpen={showSalesHistoryDialog} onClose={handleCloseSalesHistoryDialog} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Day Operations Modal */}
      <DayOperationsModal open={showDayOperationsModal} onOpenChange={setShowDayOperationsModal} type={dayOperationType} formData={dayFormData} onFormChange={handleDayFormChange} onSubmit={handleDayOperationSubmit} isLoading={isLoadingDayOperation} currentDay={currentDay} />
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
    </div>
  );
};

export default POSLayout;
