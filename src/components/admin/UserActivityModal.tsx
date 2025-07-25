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
      <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 overflow-hidden m-0 rounded-none">
        <div className="flex flex-col h-screen">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  User Activity Log
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {user && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span>Activity history for</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-semibold text-blue-700 dark:text-blue-300">
                      {user.fullName}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      @{user.username}
                    </Badge>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Activity Summary */}
                {user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Total Activities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalActivities.toLocaleString()}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">All time</div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Last Login
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          {user.lastLogin ? (
                            <div>
                              <div className="font-bold text-green-900 dark:text-green-100">{formatTimestamp(user.lastLogin).date}</div>
                              <div className="text-green-600 dark:text-green-400 text-xs mt-1">{formatTimestamp(user.lastLogin).time}</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold text-green-900 dark:text-green-100">Never</div>
                              <div className="text-green-600 dark:text-green-400 text-xs mt-1">No login history</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Account Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          <Badge 
                            className={`w-fit font-semibold ${
                              user.isActive 
                                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" 
                                : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {user.isLocked && (
                            <Badge variant="destructive" className="w-fit font-semibold">
                              🔒 Locked
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Failed Attempts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{user.loginAttempts || 0}</div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {(user.loginAttempts || 0) === 0 ? "No failures" : "Login failures"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Activity Table */}
                <Card className="border-0 shadow-xl bg-white dark:bg-gray-900/50">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="p-1.5 bg-slate-200 dark:bg-slate-600 rounded-md">
                          <Monitor className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        Recent Activity
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchUserActivity(currentPage)} 
                        disabled={loading}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                        <p className="text-muted-foreground font-medium">Loading activity data...</p>
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-6">
                          <Activity className="h-16 w-16 opacity-50" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Activity Found</h3>
                        <p className="text-sm">This user hasn't performed any tracked activities yet.</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-auto border rounded-lg">
                        <Table>
                          <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                            <TableRow className="border-b-2">
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Timestamp
                                </div>
                              </TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4">
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4" />
                                  Action
                                </div>
                              </TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 hidden sm:table-cell">
                                <div className="flex items-center gap-2">
                                  <Monitor className="h-4 w-4" />
                                  Resource
                                </div>
                              </TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4">
                                Status
                              </TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  IP Address
                                </div>
                              </TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 hidden lg:table-cell">
                                Details
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activities.map((activity, index) => {
                              const { date, time } = formatTimestamp(activity.timestamp);
                              return (
                                <TableRow 
                                  key={activity.id} 
                                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                    index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-25 dark:bg-slate-900/20'
                                  }`}
                                >
                                  <TableCell className="py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{date}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                          <Clock className="h-3 w-3" />
                                          {time}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-4">
                                    <Badge 
                                      className={`${getActionBadgeColor(activity.action)} font-semibold px-3 py-1 text-xs`}
                                    >
                                      {activity.action.toUpperCase()}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="py-4 hidden sm:table-cell">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded">
                                        {getResourceIcon(activity.resource)}
                                      </div>
                                      <div>
                                        <span className="capitalize font-medium text-sm">{activity.resource}</span>
                                        {activity.resourceId && (
                                          <div className="text-xs text-muted-foreground">ID: {activity.resourceId}</div>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-4">
                                    <Badge 
                                      className={`${getStatusBadgeColor(activity.status)} font-semibold px-3 py-1 text-xs`}
                                    >
                                      {activity.status.toUpperCase()}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="py-4 hidden md:table-cell">
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded">
                                        <MapPin className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                                      </div>
                                      <span className="font-mono text-xs">{activity.ipAddress || "Unknown"}</span>
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-4 hidden lg:table-cell">
                                    <div className="max-w-xs">
                                      {activity.errorMessage ? (
                                        <div className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                                          {activity.errorMessage}
                                        </div>
                                      ) : activity.metadata ? (
                                        <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                                          {typeof activity.metadata === "string" 
                                            ? activity.metadata.length > 50 
                                              ? activity.metadata.substring(0, 50) + "..." 
                                              : activity.metadata
                                            : JSON.stringify(activity.metadata).substring(0, 50) + "..."
                                          }
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">No details</span>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-50 dark:bg-slate-800 border-t">
                        <div className="text-sm text-muted-foreground font-medium">
                          <span className="hidden sm:inline">Showing page </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{currentPage}</span>
                          <span className="hidden sm:inline"> of </span>
                          <span className="sm:hidden">/</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{totalPages}</span>
                          <span className="hidden sm:inline"> ({totalActivities.toLocaleString()} total activities)</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fetchUserActivity(currentPage - 1)} 
                            disabled={currentPage === 1 || loading}
                            className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                          >
                            ← Previous
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fetchUserActivity(currentPage + 1)} 
                            disabled={currentPage === totalPages || loading}
                            className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                          >
                            Next →
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end p-6 border-t bg-slate-50 dark:bg-slate-800">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserActivityModal;
