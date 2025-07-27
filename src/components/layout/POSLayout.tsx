import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { POSLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { LOGO_CONFIGS, useCachedLogo } from "@/utils/logoCache";
import { AlertCircle, Calendar, Clock, LogOut, Maximize2, Minimize2, Power } from "lucide-react";
import React, { useEffect, useState } from "react";

const POSLayout: React.FC<POSLayoutProps> = ({ children, currentTotal = 0, transactionCount = 0, onLogout }) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Cached logo with preloading and fallback
  const { logoSrc, isLoaded, error, isPreloaded } = useCachedLogo(LOGO_CONFIGS.MAIN_LOGO);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle fullscreen toggle
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

  // Handle logout
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
    setShowLogoutDialog(false);
  };

  // Format time for display
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
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col overflow-hidden">
      {/* POS Header */}
      <header className="bg-teal-500 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm px-6 py-0 flex items-center justify-between shrink-0">
        {/* Left Section - Branding */}
        <div className="flex items-center py-1">
          {/* Cached Logo with Loading State and Performance Optimization */}
          <div className="relative w-24 h-8 flex items-center justify-center">
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={logoSrc}
              alt={LOGO_CONFIGS.MAIN_LOGO.alt}
              className={`w-24 transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              style={{
                // Critical performance optimizations
                display: "block",
                maxWidth: "100%",
                height: "auto",
                // Prevent layout shifts
                aspectRatio: "3/1",
                objectFit: "contain",
                // GPU acceleration for smooth transitions
                transform: "translateZ(0)",
                willChange: "opacity"
              }}
              // Preload hint for browser optimization
              loading="eager"
              decoding="sync"
              onLoad={() => {}}
              onError={e => {
                console.error("POS Logo failed to load:", error);
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            {error && !isLoaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">oOps POS</div>}
          </div>
        </div>

        {/* Center Section - Date & Time */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4" />
              <span className="text-lg font-mono font-bold">{formatDate(currentTime)}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-mono font-bold">{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>

        {/* Right Section - User & Controls */}
        <div className="flex items-center space-x-4">
          {/* Session Stats */}
          <div className="flex items-center space-x-4 mr-10">
            {/* <Card className="px-3 py-0"> */}
            <div className="flex space-x-2 items-center text-center">
              <div className="text-lg font-semibold text-black dark:text-slate-400">Total Sales</div>
              <div className="text-lg font-bold text-[#9d3623]">{formatCurrency(currentTotal)}</div>
            </div>
            {/* </Card> */}
            {/* <Card className="px-3 py-0"> */}
            <div className="flex space-x-2 items-center text-center">
              <div className="text-lg font-semibold text-black dark:text-slate-400">Transactions</div>
              <div className="text-lg font-bold text-[#9d3623]">{transactionCount}</div>
            </div>
            {/* </Card> */}
          </div>

          {/* User Info */}
          <div className="text-center">
            <div className="text-md font-medium text-black dark:text-slate-100">{user?.username || "User"}</div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            {/* <Button variant="outline" size="sm" onClick={toggleFullscreen} className="p-2"> */}
            {isFullscreen ? <Minimize2 className="w-6 h-6 cursor-pointer text-white hover:text-white/50" onClick={toggleFullscreen} /> : <Maximize2 className="w-6 h-6 cursor-pointer text-white hover:text-white/50" onClick={toggleFullscreen} />}
            {/* </Button> */}

            {/* <Button variant="ghost" size="sm" onClick={() => setShowLogoutDialog(true)} className="!p-0"> */}
            <Power className="w-6 h-6 cursor-pointer text-white hover:text-white/50" onClick={() => setShowLogoutDialog(true)} />
            {/* </Button> */}
          </div>
        </div>
      </header>

      {/* Main POS Content */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span>Confirm Logout</span>
            </DialogTitle>
            <DialogDescription>Are you sure you want to logout from the POS system? Make sure all transactions are completed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSLayout;
