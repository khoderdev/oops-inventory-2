import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Clock, Shield, AlertTriangle, RefreshCw } from 'lucide-react';

interface SessionMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export const SessionMonitor: React.FC<SessionMonitorProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { sessionInfo, refreshToken, isAuthenticated } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!sessionInfo || !isAuthenticated) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = sessionInfo.expiresAt.getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo, isAuthenticated]);

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      await refreshToken();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!sessionInfo || !isAuthenticated) {
    return null;
  }

  const getStatusColor = () => {
    if (sessionInfo.isExpired || sessionInfo.isInactive) {
      return 'text-red-600 dark:text-red-400';
    }
    if (sessionInfo.shouldRefresh) {
      return 'text-orange-600 dark:text-orange-400';
    }
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusIcon = () => {
    if (sessionInfo.isExpired || sessionInfo.isInactive) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (sessionInfo.shouldRefresh) {
      return <Clock className="h-4 w-4" />;
    }
    return <Shield className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (sessionInfo.isExpired) return 'Session Expired';
    if (sessionInfo.isInactive) return 'Session Inactive';
    if (sessionInfo.shouldRefresh) return 'Refresh Needed';
    return 'Session Active';
  };

  if (!showDetails) {
    // Compact view for navigation bar
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">{timeLeft}</span>
        </div>
        {sessionInfo.shouldRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshToken}
            disabled={isRefreshing}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  // Detailed view for session management page
  return (
    <div className={`space-y-4 ${className}`}>
      <Alert>
        <div className="flex items-center space-x-2">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{getStatusText()}</span>
                <span className="ml-2 text-muted-foreground">
                  {sessionInfo.isExpired ? 'Please log in again' : `Expires in ${timeLeft}`}
                </span>
              </div>
              {sessionInfo.shouldRefresh && !sessionInfo.isExpired && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshToken}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Session
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Session ID:</span>
            <span className="font-mono text-xs">
              {sessionInfo.sessionId?.slice(-8) || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires At:</span>
            <span>{sessionInfo.expiresAt.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Activity:</span>
            <span>{sessionInfo.lastActivity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={getStatusColor()}>{getStatusText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionMonitor;
