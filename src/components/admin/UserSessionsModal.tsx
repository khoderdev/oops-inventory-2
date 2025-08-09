import { Activity, Clock, LogOut, Monitor, RefreshCw, Smartphone, Tablet, Wifi, WifiOff } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { sessionAPI, type SessionDevice, type UserSessionsResponse } from "../../api/sessions.api";
import type { User } from "../../types/auth";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface UserSessionsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdate?: () => void;
}

const UserSessionsModal: React.FC<UserSessionsModalProps> = ({ user, isOpen, onClose, onSessionUpdate }) => {
  const [userSessions, setUserSessions] = useState<UserSessionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUserSessions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");
    try {
      const response = await sessionAPI.getUserSessions(user.id);
      setUserSessions(response);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to fetch user sessions");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserSessions();
    }
  }, [isOpen, user, fetchUserSessions]);

  const handleLogoutDevice = async (deviceId: string, deviceName: string) => {
    if (!user) return;

    setActionLoading(deviceId);
    try {
      await sessionAPI.logoutUserDevice(user.id, deviceId, `Device ${deviceName} logged out by administrator`);
      await fetchUserSessions();
      onSessionUpdate?.();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to logout device");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!user) return;

    setActionLoading("all");
    try {
      await sessionAPI.logoutUser(user.id, "All devices logged out by administrator");
      await fetchUserSessions();
      onSessionUpdate?.();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to logout all devices");
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      case "pos":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (session: SessionDevice) => {
    const isOnline = session.isOnline;
    const status = session.status;

    if (!isOnline) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      );
    }

    switch (status) {
      case "online":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <Wifi className="h-3 w-3" />
            Online
          </Badge>
        );
      case "idle":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500">
            <Clock className="h-3 w-3" />
            Idle
          </Badge>
        );
      case "away":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-orange-500">
            <Activity className="h-3 w-3" />
            Away
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Session Activity - {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription>View and manage all active sessions for this user across different devices</DialogDescription>
        </DialogHeader>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading sessions...</span>
          </div>
        ) : userSessions ? (
          <div className="space-y-6">
            {/* Session Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userSessions.sessions.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{userSessions.activeSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Online Now</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{userSessions.onlineSessions}</div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchUserSessions} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {userSessions.activeSessions > 0 && (
                <Button variant="destructive" size="sm" onClick={handleLogoutAllDevices} disabled={actionLoading === "all"}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {actionLoading === "all" ? "Logging out..." : "Logout All Devices"}
                </Button>
              )}
            </div>

            <Separator />

            {/* Sessions Table */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Device Sessions</h3>
              {userSessions.sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No active sessions found for this user</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Login Time</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userSessions.sessions.map(session => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(session.deviceType)}
                              <div>
                                <div className="font-medium">{session.deviceName}</div>
                                <div className="text-sm text-gray-500">
                                  {session.deviceType.toUpperCase()} • {session.deviceId}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(session)}</TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{session.ipAddress}</code>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="text-sm">{formatRelativeTime(session.loginTime)}</div>
                                </TooltipTrigger>
                                <TooltipContent>{formatDateTime(session.loginTime)}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="text-sm">{formatRelativeTime(session.lastActivity)}</div>
                                </TooltipTrigger>
                                <TooltipContent>{formatDateTime(session.lastActivity)}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            {session.isOnline && (
                              <Button variant="outline" size="sm" onClick={() => handleLogoutDevice(session.deviceId, session.deviceName)} disabled={actionLoading === session.deviceId}>
                                <LogOut className="h-3 w-3 mr-1" />
                                {actionLoading === session.deviceId ? "Logging out..." : "Logout"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Session Details */}
            {userSessions.sessions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Session Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userSessions.sessions.map(session => (
                    <Card key={session.id} className={session.isOnline ? "border-green-200" : "border-gray-200"}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.deviceType)}
                            {session.deviceName}
                          </div>
                          {getStatusBadge(session)}
                        </CardTitle>
                        <CardDescription className="text-xs">Device ID: {session.deviceId}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">IP Address:</span>
                            <code className="bg-gray-100 px-1 rounded">{session.ipAddress}</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Login:</span>
                            <span>{formatDateTime(session.loginTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Last Activity:</span>
                            <span>{formatDateTime(session.lastActivity)}</span>
                          </div>
                          {session.isOnline && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Last Heartbeat:</span>
                              <span>{formatDateTime(session.lastHeartbeat)}</span>
                            </div>
                          )}
                          {session.logoutTime && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Logout:</span>
                              <span>{formatDateTime(session.logoutTime)}</span>
                            </div>
                          )}
                          {session.metadata && Object.keys(session.metadata).length > 0 && (
                            <div className="mt-3 pt-2 border-t">
                              <div className="text-xs text-gray-500 mb-1">Metadata:</div>
                              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(session.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UserSessionsModal;
