import { AlertTriangle, Calendar, CheckCircle, Globe, Loader2, Monitor, RefreshCw, Shield, Smartphone, Tablet, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { authAPI } from "../../api/auth";
import type { Session } from "../../types/auth";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const SessionManagementPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const sessions = await authAPI.getSessions();
      setSessions(sessions);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setIsRevoking(sessionId);
      await authAPI.revokeSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setSuccess("Session revoked successfully");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to revoke session");
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      setIsLoading(true);
      await authAPI.revokeAllOtherSessions();
      await loadSessions();
      setSuccess("All other sessions revoked successfully");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to revoke sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceInfo = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    let device = "Desktop";
    let browser = "Unknown";
    let os = "Unknown";

    // Device type
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      device = "Mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      device = "Tablet";
    }

    // Browser
    if (ua.includes("chrome")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari")) browser = "Safari";
    else if (ua.includes("edge")) browser = "Edge";

    // OS
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("ios")) os = "iOS";

    return { device, browser, os };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatIPAddress = (ipAddress: string) => {
    if (ipAddress === "127.0.0.1" || ipAddress === "::1") {
      return `${ipAddress} (localhost)`;
    }
    return ipAddress;
  };

  const isCurrentSession = (session: Session) => {
    // Check if this is the current session by comparing token or other identifier
    // This is a simplified check - in practice you might store current session ID
    return session.isActive && session.lastActivityAt && new Date(session.lastActivityAt).getTime() > Date.now() - 5 * 60 * 1000; // Active within 5 minutes
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
        <p className="text-gray-600 mt-2">Manage your active sessions and security settings</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Active Sessions</h2>
            <p className="text-sm text-gray-600">You have {sessions.filter(s => s.isActive).length} active session(s)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSessions} disabled={isLoading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Revoke All Others
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
                  <AlertDialogDescription>This will sign you out of all other devices and browsers. You will remain signed in on this device. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevokeAllOtherSessions} className="bg-red-600 hover:bg-red-700">
                    Revoke All Others
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.map(session => {
            const deviceInfo = getDeviceInfo(session.userAgent || "");
            const isCurrent = isCurrentSession(session);

            return (
              <Card key={session.id} className={isCurrent ? "ring-2 ring-blue-500" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">{getDeviceIcon(session.userAgent || "")}</div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {deviceInfo.device} - {deviceInfo.browser}
                          </h3>
                          {isCurrent && <Badge className="bg-green-100 text-green-800">Current Session</Badge>}
                          <Badge variant={session.isActive ? "default" : "secondary"}>{session.isActive ? "Active" : "Inactive"}</Badge>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span>{deviceInfo.os}</span>
                          </div>

                          {session.ipAddress && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span>{formatIPAddress(session.ipAddress)}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {formatDate(session.createdAt)}</span>
                          </div>

                          {session.lastActivityAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Last active: {formatDate(session.lastActivityAt)}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Expires: {formatDate(session.expiresAt)}</span>
                          </div>
                        </div>

                        {session.userAgent && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">View User Agent</summary>
                            <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-2 rounded">{session.userAgent}</p>
                          </details>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrent && session.isActive && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isRevoking === session.id} className="flex items-center gap-2">
                              {isRevoking === session.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Revoking...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  Revoke
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
                              <AlertDialogDescription>This will sign out this device/browser immediately. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevokeSession(session.id)} className="bg-red-600 hover:bg-red-700">
                                Revoke Session
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sessions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Sessions</h3>
              <p className="text-gray-600">You don't have any active sessions at the moment.</p>
            </CardContent>
          </Card>
        )}

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Regularly review your active sessions and revoke any you don't recognize</p>
              <p>• Always sign out when using shared or public computers</p>
              <p>• If you see suspicious activity, change your password immediately</p>
              <p>• Sessions automatically expire after a period of inactivity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionManagementPage;
