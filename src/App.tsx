import { Button } from "@/components/ui/button";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInventoryStore } from "@/hooks/useInventoryStore";

import { employeeFormModeAtom, employeeFormOpenAtom, employeesAtom, selectedEmployeeAtom } from "@/store/employeeAtoms";
import { PERMISSIONS } from "@/types/auth";
import { InventoryManagementPanelProps } from "@/types/inventory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Employee, EmployeeSettlements, EmployeeTable, EmployeeUsageView } from "./components/employees";
import { POSClientOrders } from "./components/pos/POSClientOrders";
import System from "./components/system";
import { DatabaseBackupManager } from "./components/system/settings";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthenticatedLayout } from "./routes/AuthenticatedLayout";

import LockScreen from "./components/LockScreen";

// Lazy load components for better performance
const UserManagementPage = lazy(() => import("./components/admin/UserManagementPage"));
const ReportGenerator = lazy(() => import("./components/analytics/ReportGenerator").then(m => ({ default: m.ReportGenerator })));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const InventoryManagementPanel = lazy(() => import("./components/inventory/InventoryManagementPanel").then(m => ({ default: m.InventoryManagementPanel })));
const MenuItemBuilder = lazy(() => import("./components/menu/MenuBuilder").then(m => ({ default: m.MenuItemBuilder })));
const POSPanel = lazy(() => import("./components/POSPanel").then(m => ({ default: m.POSPanel })));
const ProfilePage = lazy(() => import("./components/profile/ProfilePage"));
const SessionManagementPage = lazy(() => import("./components/profile/SessionManagementPage"));
const DayOperationsPage = lazy(() => import("./pages/DayOperationsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const POSClientPage = lazy(() => import("./pages/POSClientPage"));
const SalesHistoryPage = lazy(() => import("./pages/SalesHistoryPage").then(m => ({ default: m.SalesHistoryPage })));
const SystemLogs = lazy(() => import("./pages/SystemLogs"));
const PlaceholderPage = lazy(() => import("./components/common/PlaceholderPage"));
const queryClient = new QueryClient();

export default function App({ onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }: InventoryManagementPanelProps = {}) {
  const { materialsWithStock, stockEntries, sections, sectionAssignments, menuItems, handleCreateMenuItem: storeCreateMenuItem, handleUpdateMenuItem: storeUpdateMenuItem, handleDeleteMenuItem: storeDeleteMenuItem } = useInventoryStore();
  const [employees] = useAtom(employeesAtom);
  const [, setFormOpen] = useAtom(employeeFormOpenAtom);
  const [, setFormMode] = useAtom(employeeFormModeAtom);
  const [, setSelectedEmployee] = useAtom(selectedEmployeeAtom);
  const handleCreateMenuItem = onCreateMenuItem || storeCreateMenuItem;
  const handleUpdateMenuItem = onUpdateMenuItem || storeUpdateMenuItem;
  const handleDeleteMenuItem = onDeleteMenuItem || storeDeleteMenuItem;

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormMode("edit");
    setFormOpen(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Dashboard - Default route */}
              <Route
                path="/"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_READ} pageTitle="Dashboard">
                    <AuthenticatedLayout pageTitle="Dashboard" showSearch={true} showNotifications={true}>
                      <DayOperationsPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* POS System Routes */}
              <Route
                path="/pos"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.POS_ACCESS}>
                    <POSClientPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backoffice-pos"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.POS_ACCESS}>
                    <AuthenticatedLayout>
                      <POSPanel materials={materialsWithStock} sectionAssignments={sectionAssignments} />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Inventory & Stock Management */}
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_READ || PERMISSIONS.REPORTS_READ}>
                    <AuthenticatedLayout>
                      <InventoryManagementPanel onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Sales & Transactions */}
              <Route
                path="/sales"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.SALES_READ}>
                    <AuthenticatedLayout>
                      <SalesHistoryPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales/history"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.SALES_READ}>
                    <AuthenticatedLayout>
                      <SalesHistoryPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              {/* Orders Management */}
              <Route
                path="/orders"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.ORDERS_READ}>
                    <AuthenticatedLayout>
                      <POSClientOrders />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Menu Management */}
              <Route
                path="/menu"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                    <AuthenticatedLayout>
                      <MenuItemBuilder stockEntries={stockEntries} materials={materialsWithStock} menuItems={menuItems} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} sections={sections} />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/menu/categories"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                    <AuthenticatedLayout>
                      <PlaceholderPage title="Menu Categories" description="Manage menu categories and organization" />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/menu/recipes"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                    <AuthenticatedLayout>
                      <PlaceholderPage title="Recipe Management" description="Create and manage item recipes" />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Day Operations */}
              <Route
                path="/day-operations"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_READ}>
                    <AuthenticatedLayout>
                      <DayOperationsPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/day-operations/close"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_CLOSE}>
                    <AuthenticatedLayout>
                      <PlaceholderPage title="Close Day" description="Close daily operations and generate reports" />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/day-operations/cash-count"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_CASH_COUNT}>
                    <AuthenticatedLayout>
                      <PlaceholderPage title="Cash Count" description="Perform cash drawer counting and reconciliation" />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Reports & Analytics */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_SALES}>
                    <AuthenticatedLayout>
                      <ReportGenerator className="w-full" />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Employee Management */}
              <Route
                path="/employees"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE_READ}>
                    <AuthenticatedLayout>
                      <EmployeeTable employees={employees} onEdit={handleEditEmployee} />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employees/usage"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE_USAGE_VIEW}>
                    <AuthenticatedLayout>
                      <EmployeeUsageView />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employees/settlements"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE_SETTLEMENT_VIEW}>
                    <AuthenticatedLayout>
                      <EmployeeSettlements />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Profile Management */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <ProfilePage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/sessions"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <SessionManagementPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Administration Routes */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.USERS_READ} requiredRole={["admin", "manager"]}>
                    <AuthenticatedLayout>
                      <UserManagementPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/system"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_SETTINGS} requiredRole={["admin"]}>
                    <AuthenticatedLayout>
                      <System />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/system/backup"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_SETTINGS} requiredRole={["admin"]}>
                    <AuthenticatedLayout>
                      <DatabaseBackupManager />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/system-logs"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_LOGS}>
                    <AuthenticatedLayout>
                      <SystemLogs />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
