import React, { useState, useEffect } from "react";
import { Calendar, Clock, List, ShoppingCart, Maximize2, Minimize2, Power } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DayOperationsButton from "./DayOperationsButton";

interface HeaderProps {
  logoSrc: string;
  isLoaded: boolean;
  incompleteOrdersCount: number;
  setShowSalesHistoryDialog: (show: boolean) => void;
  setShowOrdersDialog: (show: boolean) => void;
  setShowLogoutDialog: (show: boolean) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}

const HeaderWithDayOperations: React.FC<HeaderProps> = ({
  logoSrc,
  isLoaded,
  incompleteOrdersCount,
  setShowSalesHistoryDialog,
  setShowOrdersDialog,
  setShowLogoutDialog,
  toggleFullscreen,
  isFullscreen
}) => {
  const { user, hasRole } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  return (
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
            <DayOperationsButton />
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
  );
};

export default HeaderWithDayOperations;
