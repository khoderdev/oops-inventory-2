import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { sessionRenewalService } from "@/services/sessionRenewalService";
import { tokenManager } from "@/api/auth";
import { Clock, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export const SessionDebugPanel: React.FC = () => {
  const { isAuthenticated, sessionInfo, refreshToken } = useAuth();
  const [sessionStatus, setSessionStatus] = useState(sessionRenewalService.getSessionStatus());
  const [config, setConfig] = useState(sessionRenewalService.getConfig());

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStatus(sessionRenewalService.getSessionStatus());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRenewal = async () => {
    try {
      await refreshToken();
      setSessionStatus(sessionRenewalService.getSessionStatus());
    } catch (error) {
      console.error("Manual renewal failed:", error);
    }
  };

  const handleTestWarning = () => {
    sessionRenewalService.updateConfig({
      warningThreshold: Math.max(1, sessionStatus.timeUntilExpiry || 0)
    });
  };

  const formatTime = (minutes: number | null): string => {
    if (minutes === null) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusIcon = () => {
    if (!sessionStatus.isValid) return <XCircle className="h-4 w-4 text-red-500" />;
    if (sessionStatus.needsWarning) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (sessionStatus.needsRenewal) return <RefreshCw className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (!sessionStatus.isValid) return "destructive";
    if (sessionStatus.needsWarning) return "secondary";
    if (sessionStatus.needsRenewal) return "default";
    return "default";
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Not authenticated</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Session Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={getStatusColor()}>
                {!sessionStatus.isValid ? "Expired" :
                 sessionStatus.needsWarning ? "Warning" :
                 sessionStatus.needsRenewal ? "Needs Renewal" : "Active"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Time Until Expiry:</span>
            <span className="text-sm">{formatTime(sessionStatus.timeUntilExpiry)}</span>
          </div>

          {sessionInfo && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Session ID:</span>
                <span className="text-xs font-mono">{sessionInfo.sessionId?.slice(-8) || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Activity:</span>
                <span className="text-xs">
                  {sessionInfo.lastActivity ? 
                    new Date(sessionInfo.lastActivity).toLocaleTimeString() : "N/A"}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium">Configuration:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Check Interval: {config.checkInterval}m</div>
            <div>Renewal Threshold: {config.renewalThreshold}m</div>
            <div>Warning Threshold: {config.warningThreshold}m</div>
            <div>Max Attempts: {config.maxRenewalAttempts}</div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Button 
            onClick={handleManualRenewal}
            size="sm"
            className="w-full"
            disabled={!sessionStatus.isValid}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Manual Renewal
          </Button>

          <Button 
            onClick={handleTestWarning}
            size="sm"
            variant="outline"
            className="w-full"
            disabled={!sessionStatus.isValid}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Test Warning
          </Button>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium">Token Info:</h4>
          <div className="text-xs space-y-1">
            <div>Has Token: {tokenManager.getToken() ? "Yes" : "No"}</div>
            <div>Token Expired: {tokenManager.isTokenExpired() ? "Yes" : "No"}</div>
            <div>Should Refresh: {tokenManager.shouldRefreshToken() ? "Yes" : "No"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionDebugPanel;
