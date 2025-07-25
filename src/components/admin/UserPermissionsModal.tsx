import { AlertTriangle, Loader2, RotateCcw, Save, Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import { userAPI } from "../../api/auth";
import type { User } from "../../types/auth";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../../types/auth";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";

interface UserPermissionsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      // Initialize permissions with user's current permissions
      const currentPermissions = { ...user.permissions };
      if (user.specificPermissions) {
        Object.assign(currentPermissions, user.specificPermissions);
      }
      setPermissions(currentPermissions);
      setHasChanges(false);
    }
  }, [user]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
    setHasChanges(true);
  };

  const handleSavePermissions = async () => {
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      await userAPI.updateUser(user.id, {
        permissions: permissions
      });
      setHasChanges(false);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToRoleDefaults = () => {
    if (!user) return;

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const resetPermissions: Record<string, boolean> = {};

    // Set all permissions to false first
    Object.values(PERMISSIONS).forEach(permission => {
      resetPermissions[permission] = false;
    });

    // Enable role-based permissions
    rolePermissions.forEach(permission => {
      resetPermissions[permission] = true;
    });

    setPermissions(resetPermissions);
    setHasChanges(true);
  };

  if (!user) return null;

  const permissionGroups = {
    "User Management": [PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE],
    Materials: [PERMISSIONS.MATERIALS_CREATE, PERMISSIONS.MATERIALS_READ, PERMISSIONS.MATERIALS_UPDATE, PERMISSIONS.MATERIALS_DELETE],
    "Stock Management": [PERMISSIONS.STOCK_CREATE, PERMISSIONS.STOCK_READ, PERMISSIONS.STOCK_UPDATE, PERMISSIONS.STOCK_DELETE],
    Sales: [PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_READ, PERMISSIONS.SALES_UPDATE, PERMISSIONS.SALES_DELETE, PERMISSIONS.SALES_REVERT],
    Sections: [PERMISSIONS.SECTIONS_CREATE, PERMISSIONS.SECTIONS_READ, PERMISSIONS.SECTIONS_UPDATE, PERMISSIONS.SECTIONS_DELETE],
    Assignments: [PERMISSIONS.ASSIGNMENTS_CREATE, PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_UPDATE, PERMISSIONS.ASSIGNMENTS_DELETE],
    "Menu Items": [PERMISSIONS.MENU_ITEMS_CREATE, PERMISSIONS.MENU_ITEMS_READ, PERMISSIONS.MENU_ITEMS_UPDATE, PERMISSIONS.MENU_ITEMS_DELETE],
    "Day Operations": [PERMISSIONS.DAY_OPERATIONS_CREATE, PERMISSIONS.DAY_OPERATIONS_READ, PERMISSIONS.DAY_OPERATIONS_UPDATE, PERMISSIONS.DAY_OPERATIONS_DELETE],
    "Reports & Analytics": [PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT, PERMISSIONS.ANALYTICS_READ],
    System: [PERMISSIONS.SYSTEM_SETTINGS]
  };

  const getRolePermissions = (role: string) => {
    return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
  };

  const isRolePermission = (permission: string) => {
    const rolePerms = getRolePermissions(user.role);
    return rolePerms.includes(permission as any);
  };

  const getPermissionStatus = (permission: string) => {
    const isEnabled = permissions[permission];
    const isRolePerm = isRolePermission(permission);

    if (isEnabled && isRolePerm) return "role";
    if (isEnabled && !isRolePerm) return "custom";
    if (!isEnabled && isRolePerm) return "revoked";
    return "disabled";
  };

  const getStatusBadge = (permission: string) => {
    const status = getPermissionStatus(permission);

    switch (status) {
      case "role":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Role
          </Badge>
        );
      case "custom":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Custom
          </Badge>
        );
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="secondary">Disabled</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions - {user.fullName}
          </DialogTitle>
          <DialogDescription>Configure specific permissions for this user. Custom permissions override role defaults.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Role:</span>
                  <Badge className="ml-2">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge className="ml-2" variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permission Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Permission Status Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    Role
                  </Badge>
                  <span>Granted by user role</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Custom
                  </Badge>
                  <span>Custom permission granted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Revoked</Badge>
                  <span>Role permission revoked</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Disabled</Badge>
                  <span>Not granted</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Grid */}
          <div className="space-y-6">
            {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => (
              <Card key={groupName}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{groupName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {groupPermissions.map(permission => (
                      <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox id={permission} checked={permissions[permission] || false} onCheckedChange={checked => handlePermissionChange(permission, checked as boolean)} />
                          <div>
                            <Label htmlFor={permission} className="font-medium cursor-pointer">
                              {permission
                                .split(".")
                                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                                .join(" ")}
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">{permission}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">{getStatusBadge(permission)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleResetToRoleDefaults} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset to Role Defaults
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSavePermissions} disabled={!hasChanges || isLoading} className="flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Permissions
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserPermissionsModal;
