import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, RefreshCw, LogOut } from "lucide-react";

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  timeRemaining: number; // in minutes
  onExtendSession: () => Promise<boolean>;
  onLogout: () => void;
  onClose: () => void;
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({ isOpen, timeRemaining, onExtendSession, onLogout, onClose }) => {
  const [isExtending, setIsExtending] = useState(false);
  const [countdown, setCountdown] = useState(timeRemaining);

  // Update countdown every second when dialog is open
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(timeRemaining);

    const interval = setInterval(() => {
      setCountdown(prev => {
        const newCount = Math.max(0, prev - 1 / 60); // Decrease by 1 second (1/60 minute)
        if (newCount <= 0) {
          onLogout();
        }
        return newCount;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeRemaining, onLogout]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const success = await onExtendSession();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to extend session:", error);
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressValue = (): number => {
    // Progress from 10 minutes (100%) to 0 minutes (0%)
    return Math.max(0, (countdown / 10) * 100);
  };

  const getProgressColor = (): string => {
    if (countdown > 5) return "bg-blue-500";
    if (countdown > 2) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getUrgencyLevel = (): "info" | "warning" | "critical" => {
    if (countdown > 5) return "info";
    if (countdown > 2) return "warning";
    return "critical";
  };

  const urgencyLevel = getUrgencyLevel();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${urgencyLevel === "critical" ? "text-red-500" : urgencyLevel === "warning" ? "text-yellow-500" : "text-blue-500"}`} />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="text-center">
              <div className={`text-2xl font-mono font-bold ${urgencyLevel === "critical" ? "text-red-600" : urgencyLevel === "warning" ? "text-yellow-600" : "text-blue-600"}`}>{formatTime(countdown)}</div>
              <p className="text-sm text-muted-foreground mt-1">{urgencyLevel === "critical" ? "Your session will expire very soon!" : urgencyLevel === "warning" ? "Your session will expire soon." : "Your session will expire in a few minutes."}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Time Remaining</span>
                <span>{Math.ceil(countdown)} min</span>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
            </div>

            <div className="text-sm text-muted-foreground">{urgencyLevel === "critical" ? <p className="text-red-600 font-medium">⚠️ You will be automatically logged out when the timer reaches zero.</p> : <p>You can extend your session to continue working, or log out now to save your progress.</p>}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout Now
          </AlertDialogCancel>

          <AlertDialogAction onClick={handleExtendSession} disabled={isExtending} className="flex items-center gap-2">
            {isExtending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Extend Session
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutWarning;
