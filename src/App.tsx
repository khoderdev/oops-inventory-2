import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TabMenu } from "./components/menu/TabMenu";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { getCategoriesByType } from "@/api/categories.api";
import { Category } from "@/types/categories";
import { useEffect, useState } from "react";
import { employeeFormModeAtom, employeeFormOpenAtom, employeesAtom, selectedEmployeeAtom } from "@/store/employeeAtoms";
import { PERMISSIONS } from "@/types/auth";
import { InventoryManagementPanelProps } from "@/types/inventory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Employee, EmployeeSettlements, EmployeeTable, EmployeeUsagePrefetch } from "./components/employees";
import { POSClientOrders } from "./components/pos/POSClientOrders";
import System from "./components/system";
import { DatabaseBackupManager } from "./components/system/settings";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthenticatedLayout } from "./routes/AuthenticatedLayout";
import { EmployeeUsageView } from "./components/employees/EmployeeUsageView";
import { PermissionsTest } from "./PermissionsTest";


// Lazy load components for better performance
const UserManagementPage = lazy(() => import("./components/admin/UserManagementPage"));
const ReportGenerator = lazy(() => import("./components/analytics/ReportGenerator").then(m => ({ default: m.ReportGenerator })));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const InventoryManagementPanel = lazy(() => import("./components/inventory/InventoryManagementPanel").then(m => ({ default: m.InventoryManagementPanel })));
const MenuItemBuilder = lazy(() => import("./components/menu/MenuBuilder").then(m => ({ default: m.MenuItemBuilder })));
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
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Fetch categories for menu items and beverages
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch both menu_items and beverages categories
        const [menuResponse, beverageResponse] = await Promise.all([
          getCategoriesByType("menu_items"),
          getCategoriesByType("beverages")
        ]);
        
        const allCategories = [
          ...(menuResponse.totalItems || []),
          ...(beverageResponse.totalItems || [])
        ];
        
        setCategories(allCategories);
        console.log("Fetched categories:", allCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleCreateMenuItem = onCreateMenuItem || storeCreateMenuItem;
  const handleUpdateMenuItem = onUpdateMenuItem || storeUpdateMenuItem;
  const handleDeleteMenuItem = onDeleteMenuItem || storeDeleteMenuItem;
  
  // Convert handler functions to return Promises to match TabMenu prop types
  const handleCreateMenuItemAsync = async (data: any, imageFile?: File) => {
    console.log("🔍 App.tsx - handleCreateMenuItemAsync received:", {
      data,
      imageFile,
      beverageFields: {
        beverageStockId: (data as any)?.beverageStockId,
        unit: (data as any)?.unit,
        availableQuantity: (data as any)?.availableQuantity,
        costPerUnit: (data as any)?.costPerUnit,
        variants: (data as any)?.variants
      }
    });
    
    // Include imageFile in the data object as expected by the store
    const dataWithImage = { ...data, imageFile };
    console.log("🔍 App.tsx - Calling handleCreateMenuItem with:", dataWithImage);
    
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

              <Route
                path="/permissions"
                element={
                  // <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_READ}>
                    <PermissionsTest />
                  // </ProtectedRoute>
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
                      <TabMenu 
                        stockEntries={stockEntries} 
                        materials={materialsWithStock} 
                        menuItems={menuItems} 
                        categories={categories} 
                        sections={sections} 
                        onCreateMenuItem={handleCreateMenuItemAsync} 
                        onUpdateMenuItem={handleUpdateMenuItemAsync} 
                        onDeleteMenuItem={handleDeleteMenuItemAsync} 
                      />
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
