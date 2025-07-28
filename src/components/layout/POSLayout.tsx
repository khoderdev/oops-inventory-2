import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { POSLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { LOGO_CONFIGS, useCachedLogo } from "@/utils/logoCache";
import { AlertCircle, Calendar, Clock, LogOut, Maximize2, Minimize2, Power, TrendingUp, ShoppingCart } from "lucide-react";
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
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex flex-col overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* POS Header */}
      <header className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b border-slate-200/20 dark:border-slate-600/30 shadow-xl backdrop-blur-sm px-4 py-3 flex items-center justify-between shrink-0">
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 dark:from-white/5 dark:to-white/10 backdrop-blur-sm" />
        {/* Left Section - Branding */}
        <div className="relative flex items-center py-2 z-10">
          {/* Cached Logo with Loading State and Performance Optimization */}
          <div className="relative w-32 h-10 flex items-center justify-center group">
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {isLoaded && (
              <img 
                src={logoSrc} 
                alt={LOGO_CONFIGS.MAIN_LOGO.alt}
                className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 filter drop-shadow-lg"
                style={{
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                  objectFit: 'contain'
                }}
                loading="eager"
                decoding="sync"
              />
            )}
            {error && (
              <div className="text-white font-bold text-lg tracking-wide">
                oOps Resto
              </div>
            )}
            {/* Development indicator */}
            {process.env.NODE_ENV === 'development' && isPreloaded && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" 
                   title="Logo preloaded" />
            )}
          </div>
        </div>

        {/* Center Section - Date & Time */}
        <div className="relative flex items-center space-x-8 z-10">
          <div className="group">
            <div className="flex items-center space-x-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 hover:scale-105">
              <Calendar className="w-5 h-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
              <span className="text-lg font-mono font-semibold text-white/90 group-hover:text-white transition-colors">
                {formatDate(currentTime)}
              </span>
            </div>
          </div>
          <div className="group">
            <div className="flex items-center space-x-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 hover:scale-105">
              <Clock className="w-5 h-5 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
              <span className="text-lg font-mono font-semibold text-white/90 group-hover:text-white transition-colors tabular-nums">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - User & Controls */}
        <div className="relative flex items-center space-x-6 z-10">
          {/* Session Stats */}
          <div className="flex items-center space-x-4">
            {/* Total Sales Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl blur-sm group-hover:blur-none transition-all duration-300" />
              <div className="relative flex items-center space-x-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 hover:scale-105">
                <TrendingUp className="w-5 h-5 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-white/70 uppercase tracking-wide">Total Sales</div>
                  <div className="text-lg font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors tabular-nums">
                    {formatCurrency(currentTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-sm group-hover:blur-none transition-all duration-300" />
              <div className="relative flex items-center space-x-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 hover:scale-105">
                <ShoppingCart className="w-5 h-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-white/70 uppercase tracking-wide">Transactions</div>
                  <div className="text-lg font-bold text-blue-300 group-hover:text-blue-200 transition-colors tabular-nums">
                    {transactionCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="group">
            <div className="flex items-center space-x-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {(user?.username || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <div className="text-xs font-medium text-white/70 uppercase tracking-wide">Cashier</div>
                <div className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                  {user?.username || "User"}
                </div>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="group relative p-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white/80 group-hover:text-white transition-colors relative z-10" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white/80 group-hover:text-white transition-colors relative z-10" />
              )}
            </button>

            <button
              onClick={() => setShowLogoutDialog(true)}
              className="group relative p-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-red-500/20 hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Power className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors relative z-10" />
            </button>
          </div>
        </div>
      </header>

      {/* Main POS Content */}
      <main className="relative flex-1 overflow-hidden z-10">
        <div className="h-full w-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-lg" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center space-x-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent font-semibold">
                Confirm Logout
              </span>
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
              Are you sure you want to logout from the POS system? Make sure all transactions are completed before logging out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="relative z-10 flex space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogout}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
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
