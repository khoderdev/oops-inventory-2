import { AlertTriangle, CheckCircle, Download, Edit, Lock, RefreshCw, Search, Settings, Shield, Users } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { userAPI } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import type { User } from "../../types/auth";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../../types/auth";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import UserPermissionsModal from "./UserPermissionsModal";

interface PermissionAnalysis {
  permission: string;
  totalUsers: number;
  grantedUsers: number;
  roleBasedUsers: number;
  customUsers: number;
  revokedUsers: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

interface RoleAnalysis {
  role: string;
  userCount: number;
  totalPermissions: number;
  highRiskPermissions: number;
  lastModified: string;
}

const PermissionsManagementDashboard: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [permissionFilter, setPermissionFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers({ limit: 100 });
      setUsers(response.users);
      setError("");
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission(PERMISSIONS.USERS_READ)) {
      fetchUsers();
    }
  }, [fetchUsers, hasPermission]);

  // Permission analysis calculations
  const permissionAnalysis: PermissionAnalysis[] = React.useMemo(() => {
    if (!users.length) return [];

    return Object.values(PERMISSIONS).map(permission => {
      const totalUsers = users.length;
      const grantedUsers = users.filter(user => user.permissions?.[permission]).length;
      const roleBasedUsers = users.filter(user => {
        const rolePerms = ROLE_PERMISSIONS[user.role] || [];
        return rolePerms.includes(permission as any) && user.permissions?.[permission];
      }).length;
      const customUsers = grantedUsers - roleBasedUsers;
      const revokedUsers = users.filter(user => {
        const rolePerms = ROLE_PERMISSIONS[user.role] || [];
        return rolePerms.includes(permission as any) && !user.permissions?.[permission];
      }).length;

      // Determine risk level based on permission type and distribution
      let riskLevel: "low" | "medium" | "high" | "critical" = "low";
      if (permission.includes("delete") || permission.includes("emergency") || permission.includes("system")) {
        riskLevel = grantedUsers > totalUsers * 0.5 ? "critical" : "high";
      } else if (permission.includes("create") || permission.includes("update")) {
        riskLevel = grantedUsers > totalUsers * 0.7 ? "medium" : "low";
      }

      return {
        permission,
        totalUsers,
        grantedUsers,
        roleBasedUsers,
        customUsers,
        revokedUsers,
        riskLevel
      };
    });
  }, [users]);

  // Role analysis calculations
  const roleAnalysis: RoleAnalysis[] = React.useMemo(() => {
    const roleStats = Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => {
      const userCount = users.filter(user => user.role === role).length;
      const totalPermissions = permissions.length;
      const highRiskPermissions = permissions.filter(perm => perm.includes("delete") || perm.includes("emergency") || perm.includes("system")).length;

      return {
        role,
        userCount,
        totalPermissions,
        highRiskPermissions,
        lastModified: new Date().toISOString() // This would come from actual data
      };
    });

    return roleStats;
  }, [users]);

  // System-wide statistics
  const systemStats = React.useMemo(() => {
    const totalPermissions = Object.values(PERMISSIONS).length;
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const lockedUsers = users.filter(user => user.isLocked).length;
    const customPermissionUsers = users.filter(user => {
      const rolePerms = ROLE_PERMISSIONS[user.role] || [];
      return Object.entries(user.permissions || {}).some(([perm, granted]) => {
        const isRolePerm = rolePerms.includes(perm as any);
        return granted !== isRolePerm; // Either custom grant or revoked role permission
      });
    }).length;

    return {
      totalPermissions,
      totalUsers,
      activeUsers,
      lockedUsers,
      customPermissionUsers
    };
  }, [users]);

  // Handle permission modal
  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedUser(null);
  };

  const handlePermissionsUpdated = () => {
    fetchUsers();
  };

  // Export permissions data
  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      systemStats,
      roleAnalysis,
      permissionAnalysis: permissionAnalysis.slice(0, 20), // Top 20 for file size
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permissions-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter users based on search and filters
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!user.username.toLowerCase().includes(searchLower) && !user.fullName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      // Permission filter
      if (permissionFilter !== "all") {
        if (permissionFilter === "custom") {
          const rolePerms = ROLE_PERMISSIONS[user.role] || [];
          const hasCustom = Object.entries(user.permissions || {}).some(([perm, granted]) => {
            const isRolePerm = rolePerms.includes(perm as any);
            return granted !== isRolePerm;
          });
          if (!hasCustom) return false;
        } else if (permissionFilter === "locked") {
          if (!user.isLocked) return false;
        } else if (permissionFilter === "inactive") {
          if (user.isActive) return false;
        }
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, permissionFilter]);

  if (!hasPermission(PERMISSIONS.USERS_MANAGE_PERMISSIONS)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>You don't have permission to access the permissions management dashboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Permissions Management Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive system-wide permission control and analysis</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="m-6 mb-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-6 flex-shrink-0">
              <TabsTrigger value="overview">System Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="permissions">Permission Analysis</TabsTrigger>
              <TabsTrigger value="roles">Role Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-auto p-6 space-y-6">
              {/* System Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                        <p className="text-2xl font-bold">{systemStats.totalPermissions}</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold text-green-600">{systemStats.activeUsers}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Locked Users</p>
                        <p className="text-2xl font-bold text-red-600">{systemStats.lockedUsers}</p>
                      </div>
                      <Lock className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Custom Permissions</p>
                        <p className="text-2xl font-bold text-orange-600">{systemStats.customPermissionUsers}</p>
                      </div>
                      <Settings className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Role Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution & Risk Analysis</CardTitle>
                  <CardDescription>Overview of user roles and their permission risk levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roleAnalysis.map(role => (
                      <div key={role.role} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold capitalize">{role.role}</h3>
                          <Badge variant="outline">{role.userCount} users</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Permissions:</span>
                            <span className="font-medium">{role.totalPermissions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>High Risk:</span>
                            <span className={`font-medium ${role.highRiskPermissions > 10 ? "text-red-600" : "text-green-600"}`}>{role.highRiskPermissions}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="flex-1 overflow-auto p-6 space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                      </div>
                    </div>

                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={permissionFilter} onValueChange={setPermissionFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by permission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="custom">Custom Permissions</SelectItem>
                        <SelectItem value="locked">Locked Accounts</SelectItem>
                        <SelectItem value="inactive">Inactive Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>User Permissions Overview</CardTitle>
                  <CardDescription>Manage individual user permissions and access levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => {
                        const rolePerms = ROLE_PERMISSIONS[user.role] || [];
                        const grantedCount = Object.values(user.permissions || {}).filter(Boolean).length;
                        const hasCustom = Object.entries(user.permissions || {}).some(([perm, granted]) => {
                          const isRolePerm = rolePerms.includes(perm as any);
                          return granted !== isRolePerm;
                        });

                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.fullName}</div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={user.isActive ? "default" : "secondary"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                                {user.isLocked && (
                                  <Badge variant="destructive" className="text-xs">
                                    Locked
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{grantedCount} granted</span>
                                {hasCustom && (
                                  <Badge variant="outline" className="text-xs">
                                    Custom
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-500">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => handleEditPermissions(user)} className="h-8 w-8 p-0">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit permissions</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="flex-1 overflow-auto p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Permission Analysis</CardTitle>
                  <CardDescription>Detailed analysis of permission usage across the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission</TableHead>
                        <TableHead>Users Granted</TableHead>
                        <TableHead>Role-Based</TableHead>
                        <TableHead>Custom</TableHead>
                        <TableHead>Revoked</TableHead>
                        <TableHead>Risk Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissionAnalysis.slice(0, 20).map(analysis => (
                        <TableRow key={analysis.permission}>
                          <TableCell className="font-mono text-sm">{analysis.permission}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {analysis.grantedUsers}/{analysis.totalUsers}
                            </Badge>
                          </TableCell>
                          <TableCell>{analysis.roleBasedUsers}</TableCell>
                          <TableCell>{analysis.customUsers}</TableCell>
                          <TableCell>{analysis.revokedUsers}</TableCell>
                          <TableCell>
                            <Badge variant={analysis.riskLevel === "critical" ? "destructive" : analysis.riskLevel === "high" ? "destructive" : analysis.riskLevel === "medium" ? "default" : "secondary"}>{analysis.riskLevel}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {roleAnalysis.map(role => (
                  <Card key={role.role}>
                    <CardHeader>
                      <CardTitle className="capitalize flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {role.role} Role
                      </CardTitle>
                      <CardDescription>{role.userCount} users with this role</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Total Permissions:</span>
                          <Badge variant="outline">{role.totalPermissions}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>High Risk Permissions:</span>
                          <Badge variant={role.highRiskPermissions > 10 ? "destructive" : "default"}>{role.highRiskPermissions}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Active Users:</span>
                          <span>{users.filter(u => u.role === role.role && u.isActive).length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Permissions Modal */}
        <UserPermissionsModal user={selectedUser} isOpen={showPermissionsModal} onClose={handleClosePermissionsModal} onUpdate={handlePermissionsUpdated} />
      </div>
    </TooltipProvider>
  );
};

export default PermissionsManagementDashboard;
