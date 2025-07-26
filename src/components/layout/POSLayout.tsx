import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertCircle, Calendar, Clock, LogOut, Maximize2, Minimize2, Power, Settings, User } from "lucide-react";
import React, { useEffect, useState } from "react";

interface POSLayoutProps {
  children: React.ReactNode;
  currentTotal?: number;
  transactionCount?: number;
  onLogout?: () => void;
}

const POSLayout: React.FC<POSLayoutProps> = ({ children, currentTotal = 0, transactionCount = 0, onLogout }) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSystemDialog, setShowSystemDialog] = useState(false);

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
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm px-6 py-3 flex items-center justify-between shrink-0">
        {/* Left Section - Branding */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">POS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Point of Sale</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Professional POS System</p>
            </div>
          </div>
        </div>

        {/* Center Section - Date & Time */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{formatDate(currentTime)}</span>
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
          <div className="flex items-center space-x-3">
            <Card className="px-3 py-1">
              <div className="text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Sales</div>
                <div className="text-sm font-bold text-green-600">{formatCurrency(currentTotal)}</div>
              </div>
            </Card>
            <Card className="px-3 py-1">
              <div className="text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">Transactions</div>
                <div className="text-sm font-bold text-blue-600">{transactionCount}</div>
              </div>
            </Card>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-slate-500" />
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.username || "User"}</div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="p-2">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowSystemDialog(true)} className="p-2">
              <Settings className="w-4 h-4" />
            </Button>

            <Button variant="destructive" size="sm" onClick={() => setShowLogoutDialog(true)} className="p-2">
              <Power className="w-4 h-4" />
            </Button>
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

      {/* System Settings Dialog */}
      <Dialog open={showSystemDialog} onOpenChange={setShowSystemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <span>POS System Settings</span>
            </DialogTitle>
            <DialogDescription>System configuration and preferences</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" onClick={toggleFullscreen} className="w-full">
                    {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Session Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <div>User: {user?.username}</div>
                  <div>Role: {user?.role}</div>
                  <div>Time: {formatTime(currentTime)}</div>
                </CardContent>
              </Card>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSystemDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSLayout;
