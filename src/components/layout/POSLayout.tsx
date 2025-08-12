import { ordersAPI } from "@/api/orders.api";
import { authAPI } from "@/api/auth";
import { POSClientOrders } from "@/components/pos/POSClientOrders";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PinInput from "@/components/ui/PinInput";
import { useAuth } from "@/contexts/AuthContext";
import { SalesHistoryPage } from "@/pages/SalesHistoryPage";
import { POSLayoutProps } from "@/types/inventory";
import { LOGO_CONFIGS, useCachedLogo } from "@/utils/logoCache";
import { AlertCircle, Calendar, Clock, GripVertical, List, LogOut, Maximize2, Minimize2, Power, ShoppingCart } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

const POSLayout: React.FC<POSLayoutProps> = ({ children, currentTotal = 0, transactionCount = 0, incompleteOrdersCount = 0, onLogout, onOrderSelect, onRefreshCounts }) => {
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

  // Responsive behavior
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
      const response = await ordersAPI.getOrders({ limit: 100, offset: 0 });
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

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
    setShowLogoutDialog(false);
  };

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
              <button onClick={() => setShowOrdersDialog(true)} className="group relative select-none transition-all duration-300 hover:scale-105 active:scale-95">
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
            <div className="h-full w-full">{children}</div>
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
