import React from "react";
import { Calendar, Clock, List, Maximize2, Minimize2, Power, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/types/auth";
import { LOGO_CONFIGS, useCachedLogo } from "@/utils/logoCache";
import { DayOperation } from "@/types/inventory";

interface POSHeaderProps {
  currentTime: Date;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setShowLogoutDialog: (show: boolean) => void;
  setShowOrdersDialog: (show: boolean) => void;
  setShowSalesHistoryDialog: (show: boolean) => void;
  handleShowOpenModal: () => void;
  handleShowCloseModal: () => void;
  incompleteOrdersCount: number;
  isLocked: boolean;
  currentDay: DayOperation | null;
  isCheckingDayStatus: boolean;
}

export const POSHeader: React.FC<POSHeaderProps> = ({ currentTime, isFullscreen, toggleFullscreen, setShowLogoutDialog, setShowOrdersDialog, setShowSalesHistoryDialog, handleShowOpenModal, handleShowCloseModal, incompleteOrdersCount, isLocked, currentDay, isCheckingDayStatus }) => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManageDay = hasPermission(PERMISSIONS.DAY_OPERATIONS_CREATE) || hasPermission(PERMISSIONS.DAY_OPERATIONS_CLOSE);
  const canViewOrders = hasPermission(PERMISSIONS.ORDERS_READ);
  const canAccessSalesHistory = hasPermission(PERMISSIONS.REPORTS_READ);
  const { logoSrc, isLoaded } = useCachedLogo(LOGO_CONFIGS.MAIN_LOGO);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
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
          {/* Day Operations Button - Staff only */}
          {canManageDay &&
            (currentDay?.status === "opened" ? (
              <button onClick={handleShowCloseModal} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6  py-2  rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm  w-full sm:w-auto">
                Close Day
              </button>
            ) : (
              <button onClick={handleShowOpenModal} className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6  py-2  rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm  w-full sm:w-auto">
                Open New Day
              </button>
            ))}
          {/* Session Stats */}
          <div className="flex items-center space-x-2 select-none">
            {canAccessSalesHistory && (user?.role === "admin" || user?.role === "manager") && (
              <button 
                onClick={() => {
                  if (!isLocked) setShowSalesHistoryDialog(true);
                }} 
                className="group relative select-none transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLocked}
                title={isLocked ? "Day must be open to view sales history" : "View sales history"}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl blur-sm group-hover:blur-none transition-all duration-300" />
                <div className={`relative flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 ${isLocked ? 'opacity-50' : 'hover:bg-white/20 cursor-pointer'}`}>
                  <List className={`w-4 h-4 transition-colors ${isLocked ? 'text-gray-400' : 'text-emerald-300 group-hover:text-emerald-200'}`} />
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-medium uppercase tracking-wide ${isLocked ? 'text-gray-400' : 'text-white/70'}`}>Sales History</span>
                  </div>
                </div>
              </button>
            )}
            {/* Orders Count - Clickable with instant updates */}
            {canViewOrders && (
              <button
                onClick={() => {
                  if (!isLocked) setShowOrdersDialog(true);
                }}
                className="group relative select-none transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                disabled={isLocked}
                title={`${incompleteOrdersCount || 0} incomplete orders`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-sm group-hover:blur-none transition-all duration-300" />
                <div className="relative flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 cursor-pointer">
                  <ShoppingCart className="w-4 h-4 text-blue-300 group-hover:text-blue-200 transition-colors" />
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium text-white/70 uppercase tracking-wide">Orders:</span>
                    <span 
                      className={`text-sm font-bold group-hover:text-blue-200 transition-colors tabular-nums min-w-[1.5rem] text-center ${
                        (incompleteOrdersCount || 0) > 0 
                          ? 'text-orange-300 animate-pulse' 
                          : 'text-blue-300'
                      }`}
                      key={incompleteOrdersCount} // Force re-render on count change
                    >
                      {incompleteOrdersCount || 0}
                    </span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="hidden lg:block group select-none">
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
