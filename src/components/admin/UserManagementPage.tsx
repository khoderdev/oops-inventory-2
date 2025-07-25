import { Activity, AlertTriangle, Edit, Loader2, Lock, MoreHorizontal, Plus, Search, Shield, ShieldCheck, Trash2, Unlock, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { userAPI } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import type { CreateUserRequest, UpdateUserRequest, User } from "../../types/auth";
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

const UserManagementPage: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "staff",
    permissions: {}
  });
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: "" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  // Check if user has admin permissions
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
    try {
      await userAPI.createUser(createForm);
      setShowCreateModal(false);
      setCreateForm({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "staff",
        permissions: {}
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await userAPI.updateUser(selectedUser.id, editForm);
      setShowEditModal(false);
      setEditForm({});
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) return;

    try {
      await userAPI.deleteUser(user.id);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await userAPI.updateUser(user.id, { isActive: !user.isActive });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user status");
    }
  };

  const handleUnlockUser = async (user: User) => {
    try {
      await userAPI.unlockUser(user.id);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to unlock user");
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!resetPasswordForm.newPassword) {
      setError("Please enter a new password");
      return;
    }

    try {
      await userAPI.resetUserPassword(user.id, resetPasswordForm);
      setResetPasswordForm({ newPassword: "" });
      alert("Password reset successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
        </div>

        {hasPermission(PERMISSIONS.USERS_CREATE) && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
                          <div className="text-sm text-gray-500">{user.email}</div>
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

                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
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
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" type="email" value={createForm.email} onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))} required />
            </div>

            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input id="create-password" type="password" value={createForm.password} onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))} required />
            </div>

            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select value={createForm.role} onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, role: value }))}>
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
    </div>
  );
};

export default UserManagementPage;
