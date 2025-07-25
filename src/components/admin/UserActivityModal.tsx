import { Activity, AlertTriangle, Calendar, Clock, Loader2, MapPin, Monitor, RefreshCw, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { userAPI } from "../../api/auth";
import type { AuditLog, User as UserType } from "../../types/auth";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface UserActivityModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserActivityModal: React.FC<UserActivityModalProps> = ({ user, isOpen, onClose }) => {
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);

  const fetchUserActivity = async (page = 1) => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      const response = await userAPI.getUserActivity(user.id, {
        page,
        limit: 20
      });

      setActivities(response.activities);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      setTotalActivities(response.pagination.totalActivities);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch user activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchUserActivity(1);
    }
  }, [isOpen, user]);

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "login":
        return "bg-green-100 text-green-800";
      case "logout":
        return "bg-gray-100 text-gray-800";
      case "create":
        return "bg-blue-100 text-blue-800";
      case "update":
        return "bg-yellow-100 text-yellow-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "view":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failure":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case "user":
      case "users":
        return <User className="h-4 w-4" />;
      case "session":
      case "sessions":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Activity Log
          </DialogTitle>
          <DialogDescription>
            {user && (
              <>
                Activity history for <strong>{user.fullName}</strong> (@{user.username})
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Activity Summary */}
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalActivities}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Last Login</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {user.lastLogin ? (
                      <div>
                        <div className="font-medium">{formatTimestamp(user.lastLogin).date}</div>
                        <div className="text-muted-foreground">{formatTimestamp(user.lastLogin).time}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                    {user.isLocked && <Badge variant="destructive">Locked</Badge>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Login Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.loginAttempts || 0}</div>
                  <div className="text-xs text-muted-foreground">Failed attempts</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Activity Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="outline" size="sm" onClick={() => fetchUserActivity(currentPage)} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity found for this user</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map(activity => {
                        const { date, time } = formatTimestamp(activity.timestamp);
                        return (
                          <TableRow key={activity.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">{date}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {time}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge className={getActionBadgeColor(activity.action)}>{activity.action}</Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getResourceIcon(activity.resource)}
                                <span className="capitalize">{activity.resource}</span>
                                {activity.resourceId && <span className="text-xs text-muted-foreground">#{activity.resourceId}</span>}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge className={getStatusBadgeColor(activity.status)}>{activity.status}</Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {activity.ipAddress || "Unknown"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="max-w-xs">{activity.errorMessage ? <div className="text-sm text-red-600">{activity.errorMessage}</div> : activity.metadata ? <div className="text-sm text-muted-foreground">{typeof activity.metadata === "string" ? activity.metadata : JSON.stringify(activity.metadata).substring(0, 50) + "..."}</div> : <span className="text-muted-foreground">-</span>}</div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({totalActivities} total activities)
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchUserActivity(currentPage - 1)} disabled={currentPage === 1 || loading}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchUserActivity(currentPage + 1)} disabled={currentPage === totalPages || loading}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserActivityModal;
