import { Activity, AlertTriangle, Edit, Key, Loader2, Lock, Monitor, MoreHorizontal, Plus, RefreshCw, Search, Shield, ShieldCheck, Trash2, Unlock, Users, Wifi } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { userAPI } from "../../api/auth";
import { usePermissions } from "../../hooks/usePermissions";
import type { CreateUserRequest, User } from "../../types/auth";
import { PERMISSIONS } from "../../types/auth";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import EditUserModal from "./EditUserModal";
import PasswordResetModal from "./PasswordResetModal";
import PinResetModal from "./PinResetModal";
import SessionDashboard from "./SessionDashboard";
import UserActivityModal from "./UserActivityModal";
import UserPermissionsModal from "./UserPermissionsModal";
import UserSessionsModal from "./UserSessionsModal";

const UserManagementPage: React.FC = () => {
  const { user: currentUser, hasPermission } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showPinResetModal, setShowPinResetModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "staff",
    permissions: {}
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: 10
      };

      if (searchTerm) params.search = searchTerm;
      if (roleFilter && roleFilter !== "all") params.role = roleFilter;
      if (statusFilter && statusFilter !== "all") params.isActive = statusFilter === "active";

      const response = await userAPI.getAllUsers(params);
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
      setTotalUsers(response.pagination.totalUsers);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (!hasPermission(PERMISSIONS.USERS_READ)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access user management.</p>
        </div>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await userAPI.createUser(createForm);
      setShowCreateModal(false);
      setCreateForm({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "staff",
        permissions: {}
      });
      setSuccessMessage(`User "${response.user.fullName}" created successfully`);
      fetchUsers();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) return;

    try {
      await userAPI.deleteUser(user.id);
      setSuccessMessage(`User "${user.fullName}" deleted successfully`);
      fetchUsers();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const action = user.isActive ? "deactivated" : "activated";
      await userAPI.updateUser(user.id, { isActive: !user.isActive });
      setSuccessMessage(`User "${user.fullName}" ${action} successfully`);
      fetchUsers();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to update user status");
    }
  };

  const handleUnlockUser = async (user: User) => {
    try {
      await userAPI.unlockUser(user.id);
      setSuccessMessage(`User "${user.fullName}" unlocked successfully`);
      fetchUsers();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to unlock user");
    }
  };

  const handlePasswordResetSuccess = () => {
    setSuccessMessage(`Password reset successfully for "${selectedUser?.fullName}"`);
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handlePinResetSuccess = () => {
    setSuccessMessage(`PIN reset successfully for "${selectedUser?.fullName}"`);
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const openActivityModal = (user: User) => {
    setSelectedUser(user);
    setShowActivityModal(true);
  };

  const openPasswordResetModal = (user: User) => {
    setSelectedUser(user);
    setShowPasswordResetModal(true);
  };

  const openPinResetModal = (user: User) => {
    setSelectedUser(user);
    setShowPinResetModal(true);
  };

  const handleModalUpdate = () => {
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (user.isLocked) {
      return <Badge variant="destructive">Locked</Badge>;
    }
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Active
      </Badge>
    );
  };

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center gap-2 rounded-lg">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2 rounded-lg">
                <Wifi className="h-4 w-4" />
                Live Sessions
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchUsers()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {hasPermission(PERMISSIONS.USERS_CREATE) && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="users" className="mt-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="search" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role-filter">Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setRoleFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({totalUsers})</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(user)}</TableCell>
                          <TableCell>{user.lastLogin ? <div className="text-sm">{new Date(user.lastLogin).toLocaleDateString()}</div> : <span className="text-gray-400">Never</span>}</TableCell>
                          <TableCell>
                            <div className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                                  <>
                                    <DropdownMenuItem onClick={() => openEditModal(user)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openPermissionsModal(user)}>
                                      <ShieldCheck className="mr-2 h-4 w-4" />
                                      Permissions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openPasswordResetModal(user)}>
                                      <Key className="mr-2 h-4 w-4" />
                                      Reset Password
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openPinResetModal(user)}>
                                      <Shield className="mr-2 h-4 w-4" />
                                      Reset PIN
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowSessionsModal(true);
                                      }}
                                    >
                                      <Monitor className="mr-2 h-4 w-4" />
                                      View Sessions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                      {user.isActive ? (
                                        <>
                                          <Lock className="mr-2 h-4 w-4" />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="mr-2 h-4 w-4" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {user.isLocked && hasPermission(PERMISSIONS.USERS_UPDATE) && (
                                  <DropdownMenuItem onClick={() => handleUnlockUser(user)}>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Unlock Account
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => openActivityModal(user)}>
                                  <Activity className="mr-2 h-4 w-4" />
                                  View Activity
                                </DropdownMenuItem>

                                {hasPermission(PERMISSIONS.USERS_DELETE) && user.id !== currentUser?.id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create User Modal */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the system with specific role and permissions.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-firstName">First Name</Label>
                    <Input id="create-firstName" value={createForm.firstName} onChange={e => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))} required />
                  </div>
                  <div>
                    <Label htmlFor="create-lastName">Last Name</Label>
                    <Input id="create-lastName" value={createForm.lastName} onChange={e => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))} required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="create-username">Username</Label>
                  <Input id="create-username" value={createForm.username} onChange={e => setCreateForm(prev => ({ ...prev, username: e.target.value }))} required />
                </div>

                <div>
                  <Label htmlFor="create-password">Password</Label>
                  <Input id="create-password" type="password" value={createForm.password} onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))} required />
                </div>

                <div>
                  <Label htmlFor="create-role">Role</Label>
                  <Select value={createForm.role} onValueChange={(value: "admin" | "manager" | "staff") => setCreateForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      {currentUser?.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit User Modal */}
          <EditUserModal
            user={selectedUser}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onUpdate={handleModalUpdate}
          />

          {/* User Permissions Modal */}
          <UserPermissionsModal
            user={selectedUser}
            isOpen={showPermissionsModal}
            onClose={() => {
              setShowPermissionsModal(false);
              setSelectedUser(null);
            }}
            onUpdate={handleModalUpdate}
          />

          {/* Password Reset Modal */}
          <PasswordResetModal
            user={selectedUser}
            isOpen={showPasswordResetModal}
            onClose={() => {
              setShowPasswordResetModal(false);
              setSelectedUser(null);
            }}
            onSuccess={handlePasswordResetSuccess}
          />

          {/* PIN Reset Modal */}
          <PinResetModal
            user={selectedUser}
            isOpen={showPinResetModal}
            onClose={() => {
              setShowPinResetModal(false);
              setSelectedUser(null);
            }}
            onSuccess={handlePinResetSuccess}
          />

          {/* User Activity Modal */}
          <UserActivityModal
            user={selectedUser}
            isOpen={showActivityModal}
            onClose={() => {
              setShowActivityModal(false);
              setSelectedUser(null);
            }}
          />

          {/* User Sessions Modal */}
          <UserSessionsModal
            user={selectedUser}
            isOpen={showSessionsModal}
            onClose={() => {
              setShowSessionsModal(false);
              setSelectedUser(null);
            }}
            onSessionUpdate={() => {
              // Refresh any session-related data if needed
            }}
          />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <SessionDashboard
            onUserClick={userId => {
              const user = users.find(u => u.id === userId);
              if (user) {
                setSelectedUser(user);
                setShowSessionsModal(true);
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagementPage;
