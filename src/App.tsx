import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MenuPage } from "./components/menu/TabMenu";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { employeeFormModeAtom, employeeFormOpenAtom, employeesAtom, selectedEmployeeAtom } from "@/store/employeeAtoms";
import { PERMISSIONS } from "@/types/auth";
import { InventoryManagementPanelProps } from "@/types/inventory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Employee, EmployeeSettlements, EmployeeTable } from "./components/employees";
import { POSClientOrders } from "./components/pos/POSClientOrders";
import System from "./components/system";
import { DatabaseBackupManager } from "./components/system/settings";
import { AuthProvider } from "./contexts/AuthContext";
import { DayOperationsProvider } from "./contexts/DayOperationsContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthenticatedLayout } from "./routes/AuthenticatedLayout";
import { EmployeeUsageView } from "./components/employees/EmployeeUsageView";
import { PermissionsTest } from "./PermissionsTest";
import { SupplierList } from "./components/suppliers/SupplierList";
import { SettlementList } from "./components/suppliers/SettlementList";

// Lazy load components for better performance
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const DepartmentManagementPage = lazy(() => import("./components/department/DepartmentManagement"));
const UserManagementPage = lazy(() => import("./components/admin/UserManagementPage"));
const ReportGenerator = lazy(() => import("./components/analytics/ReportGenerator").then(m => ({ default: m.ReportGenerator })));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const InventoryManagementPanel = lazy(() => import("./components/inventory/InventoryManagementPanel").then(m => ({ default: m.InventoryManagementPanel })));
const ProfilePage = lazy(() => import("./components/profile/ProfilePage"));
const SessionManagementPage = lazy(() => import("./components/profile/SessionManagementPage"));
const DayOperationsPage = lazy(() => import("./pages/DayOperationsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const POSClientPage = lazy(() => import("./pages/POSClientPage"));
const SalesHistoryPage = lazy(() => import("./pages/SalesHistoryPage").then(m => ({ default: m.SalesHistoryPage })));
const SystemLogsGenerator = lazy(() => import("./components/system/system-logs/SystemLogsGenerator").then(m => ({ default: m.SystemLogsGenerator })));
const PlaceholderPage = lazy(() => import("./components/common/PlaceholderPage"));
const queryClient = new QueryClient();

export default function App({ onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }: InventoryManagementPanelProps = {}) {
  const { handleCreateMenuItem: storeCreateMenuItem, handleUpdateMenuItem: storeUpdateMenuItem, handleDeleteMenuItem: storeDeleteMenuItem } = useInventoryStore();
  const [employees] = useAtom(employeesAtom);
  const [, setFormOpen] = useAtom(employeeFormOpenAtom);
  const [, setFormMode] = useAtom(employeeFormModeAtom);
  const [, setSelectedEmployee] = useAtom(selectedEmployeeAtom);

  const handleCreateMenuItem = onCreateMenuItem || storeCreateMenuItem;
  const handleUpdateMenuItem = onUpdateMenuItem || storeUpdateMenuItem;
  const handleDeleteMenuItem = onDeleteMenuItem || storeDeleteMenuItem;

  // Convert handler functions to return Promises to match TabMenu prop types
  const handleCreateMenuItemAsync = async (data: any, imageFile?: File) => {
    const dataWithImage = { ...data, imageFile };
    await handleCreateMenuItem(dataWithImage);
    return Promise.resolve();
  };

  const handleUpdateMenuItemAsync = async (id: string, data: any) => {
    await handleUpdateMenuItem(id, data);
    return Promise.resolve();
  };

  const handleDeleteMenuItemAsync = async (id: string) => {
    await handleDeleteMenuItem(id);
    return Promise.resolve();
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormMode("edit");
    setFormOpen(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {/* <Sonner /> */}
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <DayOperationsProvider autoRefreshInterval={30000} enableAutoRefresh={true}>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
              >
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Dashboard - Default route */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute pageTitle="Dashboard">
                        <AuthenticatedLayout pageTitle="Dashboard" showSearch={true} showNotifications={true}>
                          <Dashboard />
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

                  {/* Inventory & Stock Management */}
                  <Route
                    path="/inventory"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_READ || PERMISSIONS.REPORTS_READ}>
                        <AuthenticatedLayout pageTitle="Inventory" showSearch={true} showNotifications={true}>
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
                        <AuthenticatedLayout pageTitle="Sales" showSearch={true} showNotifications={true}>
                          <SalesHistoryPage isOpen={false} onClose={() => {}} />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />
                  {/* Orders Management */}
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.ORDERS_READ}>
                        <AuthenticatedLayout pageTitle="Orders" showSearch={true} showNotifications={true}>
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
                        <AuthenticatedLayout pageTitle="Menus" showSearch={true} showNotifications={true}>
                          <MenuPage onCreateMenuItem={handleCreateMenuItemAsync} onUpdateMenuItem={handleUpdateMenuItemAsync} onDeleteMenuItem={handleDeleteMenuItemAsync} />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Day Operations */}
                  <Route
                    path="/day-operations"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_READ}>
                        <AuthenticatedLayout pageTitle="Day Operations" showSearch={true} showNotifications={true}>
                          <DayOperationsPage />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />
                  {/* Reports & Analytics */}
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_SALES}>
                        <AuthenticatedLayout pageTitle="Reports" showSearch={true} showNotifications={true}>
                          <ReportGenerator className="w-full" />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/departments"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.DEPARTMENT_READ}>
                        <AuthenticatedLayout pageTitle="Departments">
                          <DepartmentManagementPage />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Employee Management */}
                  <Route
                    path="/employees"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE_READ}>
                        <AuthenticatedLayout pageTitle="Employees" showSearch={true} showNotifications={true}>
                          <EmployeeTable employees={employees} onEdit={handleEditEmployee} />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/employees/usage"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE_USAGE_VIEW}>
                        <AuthenticatedLayout pageTitle="Employee Usage" showSearch={true} showNotifications={true}>
                          <EmployeeUsageView />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/employees/settlements"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE_SETTLEMENT_VIEW}>
                        <AuthenticatedLayout pageTitle="Employee Settlements" showSearch={true} showNotifications={true}>
                          <EmployeeSettlements />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/suppliers"
                    element={
                      <ProtectedRoute>
                        <AuthenticatedLayout pageTitle="Suppliers" showSearch={true} showNotifications={true}>
                          <SupplierList />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/suppliers/settlements"
                    element={
                      <ProtectedRoute>
                        <AuthenticatedLayout pageTitle="Settlements" showSearch={true} showNotifications={true}>
                          <SettlementList />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Profile Management */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <AuthenticatedLayout pageTitle="Profile" showSearch={true} showNotifications={true}>
                          <ProfilePage />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/sessions"
                    element={
                      <ProtectedRoute>
                        <AuthenticatedLayout pageTitle="Users Sessions" showSearch={true} showNotifications={true}>
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
                        <AuthenticatedLayout pageTitle="Users" showSearch={true} showNotifications={true}>
                          <UserManagementPage />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/system"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_SETTINGS} requiredRole={["admin"]}>
                        <AuthenticatedLayout pageTitle="System" showSearch={true} showNotifications={true}>
                          <System />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/system/backup"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_SETTINGS} requiredRole={["admin"]}>
                        <AuthenticatedLayout pageTitle="System Backup" showSearch={true} showNotifications={true}>
                          <DatabaseBackupManager />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/system-logs"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_LOGS}>
                        <AuthenticatedLayout pageTitle="System Logs" showSearch={false} showNotifications={false}>
                          <SystemLogsGenerator />
                        </AuthenticatedLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </DayOperationsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
