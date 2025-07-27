// import { AlertTriangle, CheckCircle, Filter, Loader2, RotateCcw, Save, Search, Shield, XCircle } from "lucide-react";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { userAPI } from "../../api/auth";
// import { PERMISSION_GROUPS, PERMISSIONS, ROLE_PERMISSIONS, User } from "../../types/auth";
// import { Alert, AlertDescription } from "../ui/alert";
// import { Badge } from "../ui/badge";
// import { Button } from "../ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
// import { Checkbox } from "../ui/checkbox";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
// import { Input } from "../ui/input";
// import { Label } from "../ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// interface UserPermissionsModalProps {
//   user: User | null;
//   isOpen: boolean;
//   onClose: () => void;
//   onUpdate: () => void;
// }

// const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
//   const [permissions, setPermissions] = useState<Record<string, boolean>>({});
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [hasChanges, setHasChanges] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedGroup, setSelectedGroup] = useState<string>("all");
//   const [viewMode, setViewMode] = useState<"granted" | "denied" | "all">("all");

//   // Initialize permissions when user changes
//   useEffect(() => {
//     if (user) {
//       const currentPermissions = { ...user.permissions };
//       if (user.specificPermissions) {
//         Object.assign(currentPermissions, user.specificPermissions);
//       }
//       setPermissions(currentPermissions);
//       setHasChanges(false);
//       setError("");
//     }
//   }, [user]);

//   // Permission change handler
//   const handlePermissionChange = useCallback((permission: string, checked: boolean) => {
//     setPermissions(prev => ({
//       ...prev,
//       [permission]: checked
//     }));
//     setHasChanges(true);
//   }, []);

//   // Save permissions
//   const handleSavePermissions = async () => {
//     if (!user) return;

//     setIsLoading(true);
//     setError("");

//     try {
//       await userAPI.updateUser(user.id, {
//         permissions: permissions
//       });
//       setHasChanges(false);
//       onUpdate();
//       onClose();
//     } catch (err: unknown) {
//       const error = err as { response?: { data?: { message?: string } } };
//       setError(error.response?.data?.message || "Failed to update permissions");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Reset to role defaults
//   const handleResetToRoleDefaults = useCallback(() => {
//     if (!user) return;

//     const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
//     const resetPermissions: Record<string, boolean> = {};

//     // Set all permissions to false first
//     Object.values(PERMISSIONS).forEach(permission => {
//       resetPermissions[permission] = false;
//     });

//     // Enable role-based permissions
//     rolePermissions.forEach(permission => {
//       resetPermissions[permission] = true;
//     });

//     setPermissions(resetPermissions);
//     setHasChanges(true);
//   }, [user]);

//   // Bulk permission operations
//   const handleBulkOperation = useCallback((operation: "grant" | "revoke", groupName?: string) => {
//     const targetPermissions = groupName ? PERMISSION_GROUPS[groupName as keyof typeof PERMISSION_GROUPS]?.permissions || [] : Object.values(PERMISSIONS);

//     setPermissions(prev => {
//       const updated = { ...prev };
//       targetPermissions.forEach(permission => {
//         updated[permission] = operation === "grant";
//       });
//       return updated;
//     });
//     setHasChanges(true);
//   }, []);

//   // Get permission status
//   const getPermissionStatus = useCallback(
//     (permission: string) => {
//       if (!user) return "disabled";

//       const isEnabled = permissions[permission];
//       const rolePerms = ROLE_PERMISSIONS[user.role] || [];
//       const isRolePerm = rolePerms.includes(permission as any);

//       if (isEnabled && isRolePerm) return "role";
//       if (isEnabled && !isRolePerm) return "custom";
//       if (!isEnabled && isRolePerm) return "revoked";
//       return "disabled";
//     },
//     [user, permissions]
//   );

//   // Filter permissions based on search and filters
//   const filteredGroups = useMemo(() => {
//     return Object.entries(PERMISSION_GROUPS).filter(([groupName, group]) => {
//       // Group filter
//       if (selectedGroup !== "all" && groupName !== selectedGroup) return false;

//       // Search filter
//       if (searchTerm) {
//         const searchLower = searchTerm.toLowerCase();
//         const groupMatches = groupName.toLowerCase().includes(searchLower) || group.description.toLowerCase().includes(searchLower);
//         const permissionMatches = group.permissions.some(perm => perm.toLowerCase().includes(searchLower));
//         if (!groupMatches && !permissionMatches) return false;
//       }

//       // View mode filter
//       if (viewMode !== "all") {
//         const hasMatchingPermissions = group.permissions.some(perm => {
//           const status = getPermissionStatus(perm);
//           return viewMode === "granted" ? status === "role" || status === "custom" : status === "disabled" || status === "revoked";
//         });
//         if (!hasMatchingPermissions) return false;
//       }

//       return true;
//     });
//   }, [selectedGroup, searchTerm, viewMode, getPermissionStatus]);

//   // Get status badge
//   const getStatusBadge = useCallback(
//     (permission: string) => {
//       const status = getPermissionStatus(permission);

//       switch (status) {
//         case "role":
//           return (
//             <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
//               <CheckCircle className="w-3 h-3 mr-1" />
//               Role
//             </Badge>
//           );
//         case "custom":
//           return (
//             <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
//               <CheckCircle className="w-3 h-3 mr-1" />
//               Custom
//             </Badge>
//           );
//         case "revoked":
//           return (
//             <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
//               <XCircle className="w-3 h-3 mr-1" />
//               Revoked
//             </Badge>
//           );
//         default:
//           return (
//             <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
//               <XCircle className="w-3 h-3 mr-1" />
//               Disabled
//             </Badge>
//           );
//       }
//     },
//     [getPermissionStatus]
//   );

//   if (!user) return null;

//   return (
//     <TooltipProvider>
//       <Dialog open={isOpen} onOpenChange={onClose}>
//         <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
//           <DialogHeader className="flex-shrink-0">
//             <DialogTitle className="flex items-center gap-2">
//               <Shield className="h-5 w-5" />
//               Permissions Management - {user.fullName}
//             </DialogTitle>
//           </DialogHeader>

//           {error && (
//             <Alert variant="destructive" className="flex-shrink-0">
//               <AlertTriangle className="h-4 w-4" />
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           <div className="flex-1 flex flex-col min-h-0 space-y-4">
//             {/* Filters and Search */}
//             <Card className="flex-shrink-0">
//               <CardContent className="p-4">
//                 <div className="flex flex-wrap gap-4 items-center">
//                   <div className="flex-1 min-w-64">
//                     <div className="relative">
//                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                       <Input placeholder="Search permissions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
//                     </div>
//                   </div>

//                   <Select value={selectedGroup} onValueChange={setSelectedGroup}>
//                     <SelectTrigger className="w-48">
//                       <Filter className="h-4 w-4 mr-2" />
//                       <SelectValue placeholder="Filter by group" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Groups</SelectItem>
//                       {Object.keys(PERMISSION_GROUPS).map(group => (
//                         <SelectItem key={group} value={group}>
//                           {group}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>

//                   <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
//                     <SelectTrigger className="w-40">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All</SelectItem>
//                       <SelectItem value="granted">Granted</SelectItem>
//                       <SelectItem value="denied">Denied</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Permission Groups */}
//             <div className="flex-1 overflow-y-auto space-y-4">
//               {filteredGroups.map(([groupName, group]) => {
//                 const IconComponent = group.icon;
//                 const groupPermissions = group.permissions.filter(perm => {
//                   if (!perm || typeof perm !== "string") return false;
//                   if (!searchTerm) return true;
//                   return perm.toLowerCase().includes(searchTerm.toLowerCase());
//                 });

//                 if (groupPermissions.length === 0) return null;

//                 const groupGranted = groupPermissions.filter(perm => permissions[perm]).length;
//                 const groupTotal = groupPermissions.length;

//                 return (
//                   <Card key={groupName}>
//                     <CardHeader className="pb-3">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-3">
//                           <IconComponent className={`h-5 w-5 ${group.color}`} />
//                           <div>
//                             <CardTitle className="text-lg">{groupName}</CardTitle>
//                             <p className="text-sm text-gray-500 mt-1">{group.description}</p>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Badge variant="outline" className="text-xs">
//                             {groupGranted}/{groupTotal}
//                           </Badge>
//                           <div className="flex gap-1">
//                             <Tooltip>
//                               <TooltipTrigger asChild>
//                                 <Button size="sm" variant="outline" onClick={() => handleBulkOperation("grant", groupName)} className="h-8 w-8 p-0">
//                                   <CheckCircle className="h-4 w-4" />
//                                 </Button>
//                               </TooltipTrigger>
//                               <TooltipContent>Grant all permissions in this group</TooltipContent>
//                             </Tooltip>
//                             <Tooltip>
//                               <TooltipTrigger asChild>
//                                 <Button size="sm" variant="outline" onClick={() => handleBulkOperation("revoke", groupName)} className="h-8 w-8 p-0">
//                                   <XCircle className="h-4 w-4" />
//                                 </Button>
//                               </TooltipTrigger>
//                               <TooltipContent>Revoke all permissions in this group</TooltipContent>
//                             </Tooltip>
//                           </div>
//                         </div>
//                       </div>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="grid grid-cols-1 gap-3">
//                         {groupPermissions.map(permission => {
//                           if (!permission || typeof permission !== "string") return null;

//                           return (
//                             <div key={permission} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
//                               <div className="flex items-center space-x-3">
//                                 <Checkbox id={permission} checked={permissions[permission] || false} onCheckedChange={checked => handlePermissionChange(permission, checked as boolean)} />
//                                 <div className="flex-1">
//                                   <Label htmlFor={permission} className="font-medium cursor-pointer">
//                                     {permission
//                                       .split(".")
//                                       .map(part => part.charAt(0).toUpperCase() + part.slice(1))
//                                       .join(" ")}
//                                   </Label>
//                                   <p className="text-xs text-gray-500 mt-1 font-mono">{permission}</p>
//                                 </div>
//                               </div>
//                               <div className="flex items-center gap-2">{getStatusBadge(permission)}</div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
//             <div className="flex gap-2">
//               <Button type="button" variant="outline" onClick={handleResetToRoleDefaults} className="flex items-center gap-2">
//                 <RotateCcw className="h-4 w-4" />
//                 Reset to Role Defaults
//               </Button>
//               <Button type="button" variant="outline" onClick={() => handleBulkOperation("grant")} className="flex items-center gap-2">
//                 <CheckCircle className="h-4 w-4" />
//                 Grant All
//               </Button>
//               <Button type="button" variant="outline" onClick={() => handleBulkOperation("revoke")} className="flex items-center gap-2">
//                 <XCircle className="h-4 w-4" />
//                 Revoke All
//               </Button>
//             </div>

//             <div className="flex gap-2">
//               <Button type="button" variant="outline" onClick={onClose}>
//                 Cancel
//               </Button>
//               <Button onClick={handleSavePermissions} disabled={!hasChanges || isLoading} className="flex items-center gap-2">
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   <>
//                     <Save className="h-4 w-4" />
//                     Save Permissions
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </TooltipProvider>
//   );
// };

// export default UserPermissionsModal;
import { AlertTriangle, CheckCircle, Filter, Loader2, RotateCcw, Save, Search, Shield, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { userAPI } from "../../api/auth";
import { PERMISSION_GROUPS, PERMISSIONS, ROLE_PERMISSIONS, User } from "../../types/auth";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"granted" | "denied" | "all">("all");

  useEffect(() => {
    if (user) {
      const currentPermissions = { ...user.permissions };
      if (user.specificPermissions) {
        Object.assign(currentPermissions, user.specificPermissions);
      }
      setPermissions(currentPermissions);
      setHasChanges(false);
      setError("");
    }
  }, [user]);

  const handlePermissionChange = useCallback((permission: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
    setHasChanges(true);
  }, []);

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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to update permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToRoleDefaults = useCallback(() => {
    if (!user) return;

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const resetPermissions: Record<string, boolean> = {};

    Object.values(PERMISSIONS).forEach(permission => {
      resetPermissions[permission] = false;
    });

    rolePermissions.forEach(permission => {
      resetPermissions[permission] = true;
    });

    setPermissions(resetPermissions);
    setHasChanges(true);
  }, [user]);

  const handleBulkOperation = useCallback((operation: "grant" | "revoke", groupName?: string) => {
    const targetPermissions = groupName ? PERMISSION_GROUPS[groupName as keyof typeof PERMISSION_GROUPS]?.permissions || [] : Object.values(PERMISSIONS);

    setPermissions(prev => {
      const updated = { ...prev };
      targetPermissions.forEach(permission => {
        updated[permission] = operation === "grant";
      });
      return updated;
    });
    setHasChanges(true);
  }, []);

  const getPermissionStatus = useCallback(
    (permission: string) => {
      if (!user) return "disabled";

      const isEnabled = permissions[permission];
      const rolePerms = ROLE_PERMISSIONS[user.role] || [];
      const isRolePerm = rolePerms.includes(permission as any);

      if (isEnabled && isRolePerm) return "role";
      if (isEnabled && !isRolePerm) return "custom";
      if (!isEnabled && isRolePerm) return "revoked";
      return "disabled";
    },
    [user, permissions]
  );

  const filteredGroups = useMemo(() => {
    return Object.entries(PERMISSION_GROUPS).filter(([groupName, group]) => {
      if (selectedGroup !== "all" && groupName !== selectedGroup) return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const groupMatches = groupName.toLowerCase().includes(searchLower) || group.description.toLowerCase().includes(searchLower);
        const permissionMatches = group.permissions.some(perm => perm.toLowerCase().includes(searchLower));
        if (!groupMatches && !permissionMatches) return false;
      }

      if (viewMode !== "all") {
        const hasMatchingPermissions = group.permissions.some(perm => {
          const status = getPermissionStatus(perm);
          return viewMode === "granted" ? status === "role" || status === "custom" : status === "disabled" || status === "revoked";
        });
        if (!hasMatchingPermissions) return false;
      }

      return true;
    });
  }, [selectedGroup, searchTerm, viewMode, getPermissionStatus]);

  const getStatusBadge = useCallback(
    (permission: string) => {
      const status = getPermissionStatus(permission);

      const badgeStyles = {
        role: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800/50",
        custom: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800/50",
        revoked: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800/50",
        disabled: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50"
      };

      return (
        <Badge className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 ${badgeStyles[status]}`}>
          {status === "role" && <CheckCircle className="w-3.5 h-3.5" />}
          {status === "custom" && <CheckCircle className="w-3.5 h-3.5" />}
          {status === "revoked" && <XCircle className="w-3.5 h-3.5" />}
          {status === "disabled" && <XCircle className="w-3.5 h-3.5" />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    [getPermissionStatus]
  );

  if (!user) return null;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-7xl max-h-[90vh] p-6 bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col">
          <DialogHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
              <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Manage Permissions - {user.fullName}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex-1 flex flex-col min-h-0 space-y-6 mt-6">
            {/* Filters and Search */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input placeholder="Search permissions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all" />
                  </div>

                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-full sm:w-48 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
                      <Filter className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      <SelectValue placeholder="Filter by group" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <SelectItem value="all">All Groups</SelectItem>
                      {Object.keys(PERMISSION_GROUPS).map(group => (
                        <SelectItem key={group} value={group} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger className="w-full sm:w-40 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        All
                      </SelectItem>
                      <SelectItem value="granted" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        Granted
                      </SelectItem>
                      <SelectItem value="denied" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        Denied
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Permission Groups */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {filteredGroups.map(([groupName, group]) => {
                const IconComponent = group.icon;
                const groupPermissions = group.permissions.filter(perm => {
                  if (!perm || typeof perm !== "string") return false;
                  if (!searchTerm) return true;
                  return perm.toLowerCase().includes(searchTerm.toLowerCase());
                });

                if (groupPermissions.length === 0) return null;

                const groupGranted = groupPermissions.filter(perm => permissions[perm]).length;
                const groupTotal = groupPermissions.length;

                return (
                  <Card key={groupName} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <IconComponent className={`h-6 w-6 ${group.color} transition-transform group-hover:scale-110`} />
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{groupName}</CardTitle>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {groupGranted}/{groupTotal}
                          </Badge>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleBulkOperation("grant", groupName)} className="h-9 w-9 p-0 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors">
                                  <CheckCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900">Grant all permissions in this group</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleBulkOperation("revoke", groupName)} className="h-9 w-9 p-0 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900">Revoke all permissions in this group</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupPermissions.map(permission => {
                          if (!permission || typeof permission !== "string") return null;

                          return (
                            <div key={permission} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="flex items-center space-x-3 flex-1">
                                <Checkbox id={permission} checked={permissions[permission] || false} onCheckedChange={checked => handlePermissionChange(permission, checked as boolean)} className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
                                <div className="flex-1">
                                  <Label htmlFor={permission} className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    {permission
                                      .split(".")
                                      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                                      .join(" ")}
                                  </Label>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{permission}</p>
                                </div>
                              </div>
                              <div className="flex items-center">{getStatusBadge(permission)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 gap-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={handleResetToRoleDefaults} className="flex items-center gap-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors">
                <RotateCcw className="h-4 w-4" />
                Reset to Role Defaults
              </Button>
              <Button type="button" variant="outline" onClick={() => handleBulkOperation("grant")} className="flex items-center gap-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-gray-900 dark:text-gray-100 transition-colors">
                <CheckCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Grant All
              </Button>
              <Button type="button" variant="outline" onClick={() => handleBulkOperation("revoke")} className="flex items-center gap-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/50 text-gray-900 dark:text-gray-100 transition-colors">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                Revoke All
              </Button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors">
                Cancel
              </Button>
              <Button onClick={handleSavePermissions} disabled={!hasChanges || isLoading} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:text-gray-500 disabled:dark:text-gray-400 transition-colors flex items-center gap-2">
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
        </DialogContent>
      </Dialog>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #2d3748;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4a5568;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
      `}</style>
    </TooltipProvider>
  );
};

export default UserPermissionsModal;
