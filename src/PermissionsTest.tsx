// // import React, { useState, useEffect } from "react";
// // import { PermissionWrapper } from "./components/auth/PermissionWrapper";
// // import { PERMISSIONS, PERMISSION_GROUPS, ROLE_PERMISSIONS } from "./types/auth";
// // import { usePermissions } from "./hooks/usePermissions";
// // import { BarChart3, ClipboardList, DollarSign, Lock, Monitor, Package, Receipt, Settings, ShoppingCart, Users, Utensils } from "lucide-react";

// // // UI Components
// // const Pill: React.FC<{ ok: boolean; children: React.ReactNode }> = ({ ok, children }) => <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{children}</span>;

// // const PermissionSwitch: React.FC<{
// //   permission: string;
// //   checked: boolean;
// //   onChange: (checked: boolean) => void;
// // }> = ({ permission, checked, onChange }) => (
// //   <label className="flex items-center gap-2 cursor-pointer">
// //     <div className="relative">
// //       <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
// //       <div className={`block w-10 h-6 rounded-full ${checked ? "bg-emerald-400" : "bg-gray-300"}`}></div>
// //       <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${checked ? "transform translate-x-4" : ""}`}></div>
// //     </div>
// //     <span className="font-mono text-sm">{permission}</span>
// //   </label>
// // );

// // const PermissionGroupCard: React.FC<{
// //   title: string;
// //   icon: React.ComponentType<{ className?: string }>;
// //   color: string;
// //   description: string;
// //   children: React.ReactNode;
// // }> = ({ title, icon: Icon, color, description, children }) => (
// //   <div className="border rounded-lg overflow-hidden">
// //     <div className={`flex items-center gap-3 p-3 border-b ${color.replace("text", "bg")} bg-opacity-10`}>
// //       <Icon className={`w-5 h-5 ${color}`} />
// //       <div>
// //         <h3 className="font-medium">{title}</h3>
// //         <p className="text-xs text-gray-500">{description}</p>
// //       </div>
// //     </div>
// //     <div className="p-3 space-y-2">{children}</div>
// //   </div>
// // );

// // export const PermissionsTest: React.FC = () => {
// //   const { user, userRole, isAuthenticated, grantedPermissions, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, canAccessRoute, isAdmin, isManagerOrAbove, isStaffOnly, effectivePermissions } = usePermissions();

// //   // Simulation state
// //   const [simulatedRole, setSimulatedRole] = useState<"admin" | "manager" | "staff">(userRole || "staff");
// //   const [simulatedPermissions, setSimulatedPermissions] = useState<string[]>(grantedPermissions);
// //   const [activeTab, setActiveTab] = useState<"simulation" | "real">("simulation");
// //   const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

// //   // Initialize with role permissions when role changes
// //   useEffect(() => {
// //     if (activeTab === "simulation") {
// //       setSimulatedPermissions(ROLE_PERMISSIONS[simulatedRole]);
// //     }
// //   }, [simulatedRole, activeTab]);

// //   // Toggle permission in simulation
// //   const togglePermission = (permission: string) => {
// //     setSimulatedPermissions(prev => (prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]));
// //   };

// //   // Simulated permission checks
// //   const simHasPermission = (permission: string) => simulatedPermissions.includes(permission);
// //   const simHasAnyPermission = (permissions: string[]) => permissions.some(p => simulatedPermissions.includes(p));
// //   const simHasAllPermissions = (permissions: string[]) => permissions.every(p => simulatedPermissions.includes(p));
// //   const simHasRole = (roles: string[]) => roles.includes(simulatedRole);
// //   const simIsAdmin = simulatedRole === "admin";
// //   const simIsManagerOrAbove = ["admin", "manager"].includes(simulatedRole);
// //   const simIsStaffOnly = simulatedRole === "staff";

// //   // Get current state based on active tab
// //   const currentState =
// //     activeTab === "simulation"
// //       ? {
// //           hasPermission: simHasPermission,
// //           hasAnyPermission: simHasAnyPermission,
// //           hasAllPermissions: simHasAllPermissions,
// //           hasRole: simHasRole,
// //           isAdmin: simIsAdmin,
// //           isManagerOrAbove: simIsManagerOrAbove,
// //           isStaffOnly: simIsStaffOnly,
// //           role: simulatedRole,
// //           permissions: simulatedPermissions,
// //           effectivePermissions: Object.fromEntries(simulatedPermissions.map(p => [p, true]))
// //         }
// //       : {
// //           hasPermission,
// //           hasAnyPermission,
// //           hasAllPermissions,
// //           hasRole,
// //           isAdmin,
// //           isManagerOrAbove,
// //           isStaffOnly,
// //           role: userRole,
// //           permissions: grantedPermissions,
// //           effectivePermissions
// //         };

// //   // Get all permission groups
// //   const allGroups = Object.entries(PERMISSION_GROUPS).map(([name, group]) => ({
// //     name,
// //     ...group,
// //     permissions: group.permissions.map(p => ({
// //       name: p,
// //       description: p.split(".").join(" "),
// //       granted: currentState.permissions.includes(p)
// //     }))
// //   }));

// //   // Get filtered groups
// //   const filteredGroups = selectedGroup ? allGroups.filter(g => g.name === selectedGroup) : allGroups;

// //   // Add these API functions (adjust to match your actual API endpoints)
// //   const updateUserPermissions = async (userId: number, permissions: string[]) => {
// //     try {
// //       const response = await fetch("/api/users/permissions", {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //           Authorization: `Bearer ${localStorage.getItem("token")}`
// //         },
// //         body: JSON.stringify({ userId, permissions })
// //       });
// //       return await response.json();
// //     } catch (error) {
// //       console.error("Failed to update permissions:", error);
// //       throw error;
// //     }
// //   };

// //   const updateUserRole = async (userId: number, role: "admin" | "manager" | "staff") => {
// //     try {
// //       const response = await fetch("/api/users/role", {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //           Authorization: `Bearer ${localStorage.getItem("token")}`
// //         },
// //         body: JSON.stringify({ userId, role })
// //       });
// //       return await response.json();
// //     } catch (error) {
// //       console.error("Failed to update role:", error);
// //       throw error;
// //     }
// //   };

// //   return (
// //     <div className="p-4 space-y-6 max-w-6xl mx-auto">
// //       <div className="flex justify-between items-start">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-800">🔐 Permissions Playground</h1>
// //           <p className="text-gray-600">Test and visualize the complete permission system</p>
// //         </div>
// //         <div className="flex gap-2">
// //           <button onClick={() => setActiveTab("simulation")} className={`px-3 py-1 rounded-md ${activeTab === "simulation" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
// //             Simulation Mode
// //           </button>
// //           <button onClick={() => setActiveTab("real")} className={`px-3 py-1 rounded-md ${activeTab === "real" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
// //             Live System
// //           </button>
// //         </div>
// //       </div>
// //       {/* Simulation Controls */}
// //       {activeTab === "simulation" && (
// //         <div className="rounded-lg border p-4 bg-white shadow-sm">
// //           <h2 className="text-lg font-semibold mb-3">🧪 Simulation Controls</h2>
// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
// //               <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" value={simulatedRole} onChange={e => setSimulatedRole(e.target.value as "admin" | "manager" | "staff")}>
// //                 <option value="staff">Staff</option>
// //                 <option value="manager">Manager</option>
// //                 <option value="admin">Admin</option>
// //               </select>
// //             </div>
// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-1">Quick Actions</label>
// //               <div className="flex flex-wrap gap-2">
// //                 <button onClick={() => setSimulatedPermissions(ROLE_PERMISSIONS[simulatedRole])} className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">
// //                   Reset to Role Default
// //                 </button>
// //                 <button onClick={() => setSimulatedPermissions([])} className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700">
// //                   Revoke All
// //                 </button>
// //                 <button onClick={() => setSimulatedPermissions(Object.values(PERMISSIONS))} className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700">
// //                   Grant All
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //       {/* User Info */}
// //       <div className="rounded-lg border p-4 bg-white shadow-sm">
// //         <h2 className="text-lg font-semibold mb-3">👤 User Information</h2>
// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //           <div className="space-y-2">
// //             <div className="flex items-center gap-2">
// //               <span className="text-sm font-medium">Status:</span>
// //               <Pill ok={isAuthenticated}>{isAuthenticated ? "Authenticated" : "Not Authenticated"}</Pill>
// //             </div>
// //             <div className="flex items-center gap-2">
// //               <span className="text-sm font-medium">Username:</span>
// //               <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{user?.username || "-"}</span>
// //             </div>
// //           </div>
// //           <div className="space-y-2">
// //             <div className="flex items-center gap-2">
// //               <span className="text-sm font-medium">Current Role:</span>
// //               <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentState.role === "admin" ? "bg-purple-100 text-purple-800" : currentState.role === "manager" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{currentState.role}</span>
// //               <Pill ok={currentState.isManagerOrAbove}>{currentState.isAdmin ? "Admin" : currentState.isManagerOrAbove ? "Manager+" : "Staff Only"}</Pill>
// //             </div>
// //           </div>
// //           <div className="space-y-2">
// //             <div className="flex items-center gap-2">
// //               <span className="text-sm font-medium">Granted Permissions:</span>
// //               <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{currentState.permissions.length}</span>
// //             </div>
// //             <div className="flex items-center gap-2">
// //               <span className="text-sm font-medium">Route Access:</span>
// //               <Pill ok={canAccessRoute(PERMISSIONS.REPORTS_READ)}>{canAccessRoute(PERMISSIONS.REPORTS_READ) ? "/reports: allowed" : "/reports: denied"}</Pill>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //       {/* Permission Groups */}
// //       <div className="rounded-lg border p-4 bg-white shadow-sm">
// //         <div className="flex justify-between items-center mb-3">
// //           <h2 className="text-lg font-semibold">🔧 Permission Groups</h2>
// //           <select className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" value={selectedGroup || ""} onChange={e => setSelectedGroup(e.target.value || null)}>
// //             <option value="">All Groups</option>
// //             {Object.keys(PERMISSION_GROUPS).map(group => (
// //               <option key={group} value={group}>
// //                 {group}
// //               </option>
// //             ))}
// //           </select>
// //         </div>

// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// //           {filteredGroups.map(group => (
// //             <PermissionGroupCard key={group.name} title={group.name} icon={group.icon} color={group.color} description={group.description}>
// //               <div className="space-y-2">
// //                 {group.permissions.map(permission => (
// //                   <div key={permission.name} className="flex items-center justify-between">
// //                     <div>
// //                       <div className="font-mono text-xs">{permission.name}</div>
// //                       <div className="text-xs text-gray-500">{permission.description}</div>
// //                     </div>
// //                     {activeTab === "simulation" ? <PermissionSwitch permission={permission.name} checked={simulatedPermissions.includes(permission.name)} onChange={() => togglePermission(permission.name)} /> : <Pill ok={permission.granted}>{permission.granted ? "Granted" : "Denied"}</Pill>}
// //                   </div>
// //                 ))}
// //               </div>
// //             </PermissionGroupCard>
// //           ))}
// //         </div>
// //       </div>
// //       {/* Live Examples */}
// //       <div className="rounded-lg border p-4 bg-white shadow-sm">
// //         <h2 className="text-lg font-semibold mb-3">🎮 Live Examples</h2>

// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //           {/* Example 1: Basic Permission Check */}
// //           <div className="p-3 border rounded bg-gray-50">
// //             <h3 className="font-medium mb-2">1. Basic Permission Check</h3>
// //             <div className="space-y-2">
// //               <div className="flex items-center gap-2">
// //                 <span>Can view reports?</span>
// //                 <Pill ok={currentState.hasPermission(PERMISSIONS.REPORTS_READ)}>{currentState.hasPermission(PERMISSIONS.REPORTS_READ) ? "Yes" : "No"}</Pill>
// //               </div>
// //               <div className="flex items-center gap-2">
// //                 <span>Can delete users?</span>
// //                 <Pill ok={currentState.hasPermission(PERMISSIONS.USERS_DELETE)}>{currentState.hasPermission(PERMISSIONS.USERS_DELETE) ? "Yes" : "No"}</Pill>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Example 2: PermissionWrapper Demo */}
// //           <div className="p-3 border rounded bg-gray-50">
// //             <h3 className="font-medium mb-2">2. PermissionWrapper Demo</h3>
// //             <PermissionWrapper requiredPermission={PERMISSIONS.REPORTS_READ} showFallback fallback={<div className="text-sm text-gray-600">❌ Missing reports.read permission</div>}>
// //               <div className="text-sm text-emerald-600">✅ You can see this because you have reports.read</div>
// //             </PermissionWrapper>
// //             <div className="mt-2">
// //               <PermissionWrapper requiredPermission={PERMISSIONS.USERS_DELETE} showFallback fallback={<div className="text-sm text-gray-600">❌ Insufficient permissions to delete users</div>}>
// //                 <div className="text-sm text-emerald-600">✅ User delete button would appear here</div>
// //               </PermissionWrapper>
// //             </div>
// //           </div>

// //           {/* Example 3: Role-Based UI */}
// //           <div className="p-3 border rounded bg-gray-50">
// //             <h3 className="font-medium mb-2">3. Role-Based UI</h3>
// //             <div className="flex items-center gap-2">
// //               <span>Your view:</span>
// //               {currentState.isAdmin && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">Admin Dashboard</span>}
// //               {currentState.role === "manager" && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Manager Dashboard</span>}
// //               {currentState.isStaffOnly && <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">Staff Dashboard</span>}
// //             </div>
// //             <div className="mt-2">
// //               <PermissionWrapper requiredRole={["admin", "manager"]} showFallback fallback={<div className="text-sm text-gray-600">❌ Management tools require manager+ role</div>}>
// //                 <div className="text-sm text-emerald-600">✅ Management tools would appear here</div>
// //               </PermissionWrapper>
// //             </div>
// //           </div>

// //           {/* Example 4: Complex Permission Check */}
// //           <div className="p-3 border rounded bg-gray-50">
// //             <h3 className="font-medium mb-2">4. Complex Permission Check</h3>
// //             <div className="space-y-2">
// //               <div className="flex items-center gap-2">
// //                 <span>Can view sales OR inventory reports?</span>
// //                 <Pill ok={currentState.hasAnyPermission([PERMISSIONS.REPORTS_SALES, PERMISSIONS.REPORTS_INVENTORY])}>{currentState.hasAnyPermission([PERMISSIONS.REPORTS_SALES, PERMISSIONS.REPORTS_INVENTORY]) ? "Yes" : "No"}</Pill>
// //               </div>
// //               <div className="flex items-center gap-2">
// //                 <span>Can both create AND read sales?</span>
// //                 <Pill ok={currentState.hasAllPermissions([PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_READ])}>{currentState.hasAllPermissions([PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_READ]) ? "Yes" : "No"}</Pill>
// //               </div>
// //               <div className="flex items-center gap-2">
// //                 <span>Can access admin settings?</span>
// //                 <Pill ok={currentState.hasRole("admin") && currentState.hasPermission(PERMISSIONS.SYSTEM_SETTINGS)}>{currentState.hasRole("admin") && currentState.hasPermission(PERMISSIONS.SYSTEM_SETTINGS) ? "Yes" : "No"}</Pill>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //       {/* Effective Permissions */}
// //       <div className="rounded-lg border p-4 bg-white shadow-sm">
// //         <h2 className="text-lg font-semibold mb-3">📋 Effective Permissions</h2>
// //         <div className="overflow-x-auto">
// //           <table className="min-w-full divide-y divide-gray-200">
// //             <thead className="bg-gray-50">
// //               <tr>
// //                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
// //                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
// //                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
// //               </tr>
// //             </thead>
// //             <tbody className="bg-white divide-y divide-gray-200">
// //               {Object.entries(currentState.effectivePermissions)
// //                 .slice(0, 10)
// //                 .map(([permission, granted]) => (
// //                   <tr key={permission}>
// //                     <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">{permission}</td>
// //                     <td className="px-4 py-2 whitespace-nowrap">
// //                       <Pill ok={granted}>{granted ? "Granted" : "Denied"}</Pill>
// //                     </td>
// //                     <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{ROLE_PERMISSIONS[currentState.role as "admin" | "manager" | "staff"].includes(permission as any) ? "Role-based" : "Specific grant"}</td>
// //                   </tr>
// //                 ))}
// //               {Object.entries(currentState.effectivePermissions).length > 10 && (
// //                 <tr>
// //                   <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 text-center">
// //                     Showing 10 of {Object.entries(currentState.effectivePermissions).length} permissions
// //                   </td>
// //                 </tr>
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>
// //       // Add this to your simulation controls section
// //       <button
// //         onClick={async () => {
// //           if (!user?.id) return;
// //           try {
// //             await updateUserRole(user.id, simulatedRole);
// //             await updateUserPermissions(user.id, simulatedPermissions);
// //             alert("Permissions updated successfully!");
// //             // Refresh the user data
// //           } catch (error) {
// //             alert("Failed to update permissions");
// //           }
// //         }}
// //         className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
// //       >
// //         Save Changes to Database
// //       </button>
// //     </div>
// //   );
// // };

// import React, { useState, useRef, useEffect } from "react";

// export const PermissionsTest = () => {
//   const [contextMenu, setContextMenu] = useState<{
//     x: number;
//     y: number;
//     item?: string;
//   } | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // List of items that will have custom context menus
//   const items = ["Table 1", "Table 2", "Table 3", "Table 4"];

//   // Prevent default context menu on our container
//   useEffect(() => {
//     const handleContextMenu = (e: MouseEvent) => {
//       e.preventDefault();
//     };

//     const container = containerRef.current;
//     if (container) {
//       container.addEventListener("contextmenu", handleContextMenu);
//     }

//     return () => {
//       if (container) {
//         container.removeEventListener("contextmenu", handleContextMenu);
//       }
//     };
//   }, []);

//   // Handle right-click on items
//   const handleItemRightClick = (e: React.MouseEvent, item: string) => {
//     e.preventDefault();
//     e.stopPropagation();

//     setContextMenu({
//       x: e.clientX,
//       y: e.clientY,
//       item
//     });
//   };

//   // Close context menu when clicking anywhere
//   const handleClickOutside = () => {
//     setContextMenu(null);
//   };

//   // Handle context menu option selection
//   const handleContextMenuAction = (action: string) => {
//     alert(`Action: ${action} on ${contextMenu?.item}`);
//     setContextMenu(null);
//   };

//   return (
//     <div ref={containerRef} onClick={handleClickOutside} className="p-8 min-h-screen bg-gray-100">
//       <h1 className="text-2xl font-bold mb-6">Custom Context Menu Demo</h1>
//       <p className="mb-4">Right-click on any table below to see the custom context menu:</p>

//       <div className="grid grid-cols-2 gap-4">
//         {items.map(item => (
//           <div key={item} onContextMenu={e => handleItemRightClick(e, item)} className="p-4 bg-white rounded-lg shadow-md cursor-pointer hover:bg-blue-50 transition-colors border border-gray-200">
//             <h3 className="font-medium">{item}</h3>
//             <p className="text-sm text-gray-500">Right-click me</p>
//           </div>
//         ))}
//       </div>

//       {/* Custom Context Menu */}
//       {contextMenu && (
//         <>
//           {/* Backdrop to close when clicking outside */}
//           <div className="fixed inset-0 z-40" onClick={handleClickOutside} />

//           {/* The actual context menu */}
//           <div
//             className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[180px]"
//             style={{
//               left: contextMenu.x,
//               top: contextMenu.y
//             }}
//           >
//             <div className="px-3 py-2 border-b border-gray-100">
//               <div className="font-medium text-gray-900">{contextMenu.item}</div>
//             </div>
//             <div className="py-1">
//               <button onClick={() => handleContextMenuAction("Rename")} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
//                 Rename
//               </button>
//               <button onClick={() => handleContextMenuAction("Transfer")} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
//                 Transfer
//               </button>
//               <button onClick={() => handleContextMenuAction("Clear")} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
//                 Clear
//               </button>
//               <div className="border-t border-gray-100 my-1"></div>
//               <button onClick={() => handleContextMenuAction("Delete")} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
//                 Delete
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

import * as ContextMenu from "@radix-ui/react-context-menu";
import "./styles.css";

export const PermissionsTest = () => {
  return (
    <div className="context-menu-container">
      <ContextMenu.Root>
        <ContextMenu.Trigger className="context-menu-trigger">
          <div className="target-area">
            Right-click anywhere in this area
          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content className="context-menu-content">
            <ContextMenu.Item className="context-menu-item">
              Copy <div className="right-slot">⌘+C</div>
            </ContextMenu.Item>
            <ContextMenu.Item className="context-menu-item">
              Paste <div className="right-slot">⌘+V</div>
            </ContextMenu.Item>
            <ContextMenu.Separator className="context-menu-separator" />
            <ContextMenu.Item className="context-menu-item">
              Share
            </ContextMenu.Item>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger className="context-menu-subtrigger">
                More actions
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent
                  className="context-menu-content"
                  sideOffset={2}
                  alignOffset={-5}
                >
                  <ContextMenu.Item className="context-menu-item">
                    Rename
                  </ContextMenu.Item>
                  <ContextMenu.Item className="context-menu-item">
                    Delete
                  </ContextMenu.Item>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </div>
  );
};
