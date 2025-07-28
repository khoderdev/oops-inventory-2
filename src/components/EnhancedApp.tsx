import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/types/auth";
import { InventoryManagementPanelProps } from "@/types/inventory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";

// Lazy load components for better performance
const UserManagementPage = lazy(() => import("../components/admin/UserManagementPage"));
const ReportGenerator = lazy(() => import("../components/analytics/ReportGenerator").then(m => ({ default: m.ReportGenerator })));
const LoginPage = lazy(() => import("../components/auth/LoginPage"));
const ProtectedRoute = lazy(() => import("../components/auth/ProtectedRoute"));
const InventoryManagementPanel = lazy(() => import("../components/inventory/InventoryManagementPanel").then(m => ({ default: m.InventoryManagementPanel })));
const SidebarLayout = lazy(() => import("../components/layout/SidebarLayout").then(module => ({ default: module.SidebarLayout })));
const MenuItemBuilder = lazy(() => import("../components/menu/MenuBuilder").then(m => ({ default: m.MenuItemBuilder })));
const POSPanel = lazy(() => import("../components/POSPanel").then(m => ({ default: m.POSPanel })));
const ProfilePage = lazy(() => import("../components/profile/ProfilePage"));
const SessionManagementPage = lazy(() => import("../components/profile/SessionManagementPage"));
const DayOperationsPage = lazy(() => import("../pages/DayOperationsPage"));
const NotFound = lazy(() => import("../pages/NotFound"));
const POSClientPage = lazy(() => import("../pages/POSClientPage"));
const SalesHistoryPage = lazy(() => import("../pages/SalesHistoryPage").then(m => ({ default: m.SalesHistoryPage })));
const SystemLogs = lazy(() => import("../pages/SystemLogs"));

// Placeholder components for routes not yet implemented
const PlaceholderPage = lazy(() => import("./common/PlaceholderPage"));

const queryClient = new QueryClient();

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingFallback />}>
        <SidebarLayout>
          <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
        </SidebarLayout>
      </Suspense>
    </div>
  );
};

// Role-based route wrapper that redirects STAFF users to appropriate interface
const RoleBasedRoute = ({ children, fallbackPath = "/pos" }: { children: React.ReactNode; fallbackPath?: string }) => {
  const { userRole, isStaffOnly } = usePermissions();
  const location = useLocation();

  // Redirect staff users to POS if they try to access other areas
  if (isStaffOnly && !location.pathname.startsWith("/pos") && !location.pathname.startsWith("/profile")) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

// Enhanced route protection with permission and role checking
const EnhancedProtectedRoute = ({ children, requiredPermission, requiredRole, fallbackPath = "/login" }: { children: React.ReactNode; requiredPermission?: string; requiredRole?: string | string[]; fallbackPath?: string }) => {
  return (
    <ProtectedRoute requiredPermission={requiredPermission} requiredRole={requiredRole} fallbackPath={fallbackPath}>
      <RoleBasedRoute>{children}</RoleBasedRoute>
    </ProtectedRoute>
  );
};

export default function EnhancedApp({ onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }: InventoryManagementPanelProps = {}) {
  const { materialsWithStock, stockEntries, sections, sectionAssignments, menuItems, fetchTabData, handleCreateMenuItem: storeCreateMenuItem, handleUpdateMenuItem: storeUpdateMenuItem, handleDeleteMenuItem: storeDeleteMenuItem } = useInventoryStore();

  // Use store handlers or provided props (store handlers make actual API calls)
  const handleCreateMenuItem = onCreateMenuItem || storeCreateMenuItem;
  const handleUpdateMenuItem = onUpdateMenuItem || storeUpdateMenuItem;
  const handleDeleteMenuItem = onDeleteMenuItem || storeDeleteMenuItem;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Dashboard - Default route */}
                <Route
                  path="/"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_READ}>
                      <AuthenticatedLayout>
                        <DayOperationsPage />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* POS System Routes */}
                <Route
                  path="/pos"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.POS_ACCESS}>
                      <POSClientPage />
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/backoffice-pos"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.POS_ACCESS}>
                      <AuthenticatedLayout>
                        <POSPanel materials={materialsWithStock} sectionAssignments={sectionAssignments} />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/pos/kitchen-display"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.POS_KITCHEN_DISPLAY}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Kitchen Display" description="Kitchen order display system" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/pos/customer-display"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.POS_CUSTOMER_DISPLAY}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Customer Display" description="Customer-facing display system" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Materials Management */}
                <Route
                  path="/materials"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.MATERIALS_READ}>
                      <AuthenticatedLayout>
                        <InventoryManagementPanel onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Inventory & Stock Management */}
                <Route
                  path="/inventory"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.STOCK_READ}>
                      <AuthenticatedLayout>
                        <InventoryManagementPanel onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/adjustments"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.STOCK_ADJUST}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Stock Adjustments" description="Adjust stock quantities and manage inventory discrepancies" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/transfers"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.STOCK_TRANSFER}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Stock Transfers" description="Transfer stock between locations and sections" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/waste"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.STOCK_WASTE_RECORD}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Waste Management" description="Record and track inventory waste" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/assignments"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.ASSIGNMENTS_READ}>
                      <AuthenticatedLayout>
                        <InventoryManagementPanel />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/sections"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.SECTIONS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Section Management" description="Manage inventory sections and organization" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Sales & Transactions */}
                <Route
                  path="/sales"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.SALES_READ}>
                      <AuthenticatedLayout>
                        <SalesHistoryPage />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/sales/history"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.SALES_READ}>
                      <AuthenticatedLayout>
                        <SalesHistoryPage />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/sales/refunds"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.SALES_REFUND}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Sales Refunds" description="Process and manage sales refunds" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Orders Management */}
                <Route
                  path="/orders"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.ORDERS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Orders Management" description="View and manage customer orders" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/orders/queue"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.ORDERS_MANAGE_QUEUE}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Order Queue" description="Manage order processing queue" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Menu Management */}
                <Route
                  path="/menu"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                      <AuthenticatedLayout>
                        <MenuItemBuilder stockEntries={stockEntries} materials={materialsWithStock} menuItems={menuItems} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} sections={sections} />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/menu-items"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                      <AuthenticatedLayout>
                        <MenuItemBuilder stockEntries={stockEntries} materials={materialsWithStock} menuItems={menuItems} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} sections={sections} />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/menu/categories"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Menu Categories" description="Manage menu categories and organization" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/menu/recipes"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Recipe Management" description="Create and manage item recipes" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/menu/pricing"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_PRICING}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Menu Pricing" description="Manage menu item pricing and cost analysis" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Day Operations */}
                <Route
                  path="/day-operations"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_READ}>
                      <AuthenticatedLayout>
                        <DayOperationsPage />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/day-operations/close"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_CLOSE}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Close Day" description="Close daily operations and generate reports" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/day-operations/cash-count"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_CASH_COUNT}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Cash Count" description="Perform cash drawer counting and reconciliation" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Reports & Analytics */}
                <Route
                  path="/reports"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.REPORTS_SALES}>
                      <AuthenticatedLayout>
                        <ReportGenerator className="w-full" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/reports/sales"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.REPORTS_SALES}>
                      <AuthenticatedLayout>
                        <ReportGenerator className="w-full" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/reports/inventory"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.REPORTS_INVENTORY}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Inventory Reports" description="Generate inventory and stock reports" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/reports/financial"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.REPORTS_FINANCIAL}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Financial Reports" description="Generate financial and accounting reports" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.ANALYTICS_DASHBOARD}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Analytics Dashboard" description="Business intelligence and analytics overview" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/analytics/trends"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.ANALYTICS_TRENDS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Trends Analysis" description="Sales and inventory trend analysis" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Financial Management */}
                <Route
                  path="/finance"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.FINANCE_VIEW_COSTS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Financial Overview" description="Financial management and cost analysis" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/finance/budgets"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.FINANCE_BUDGETS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Budget Management" description="Create and manage budgets" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/finance/expenses"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.FINANCE_EXPENSES}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Expense Tracking" description="Track and categorize business expenses" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Customer & Supplier Management */}
                <Route
                  path="/customers"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.CUSTOMERS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Customer Management" description="Manage customer information and relationships" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/suppliers"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.SUPPLIERS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Supplier Management" description="Manage supplier relationships and contracts" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/procurement"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.PROCUREMENT_ORDERS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Procurement" description="Manage procurement orders and receiving" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Profile Management */}
                <Route
                  path="/profile"
                  element={
                    <EnhancedProtectedRoute>
                      <AuthenticatedLayout>
                        <ProfilePage />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/profile/sessions"
                  element={
                    <EnhancedProtectedRoute>
                      <AuthenticatedLayout>
                        <SessionManagementPage />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Administration Routes */}
                <Route
                  path="/admin/users"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.USERS_READ} requiredRole={["admin", "manager"]}>
                      <AuthenticatedLayout>
                        <UserManagementPage />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/admin/permissions"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.USERS_MANAGE_PERMISSIONS} requiredRole={["admin"]}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Permission Management" description="Manage user permissions and access control" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/admin/system"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_SETTINGS} requiredRole={["admin"]}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="System Settings" description="Configure system-wide settings and preferences" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/admin/system-logs"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_LOGS}>
                      <AuthenticatedLayout>
                        <SystemLogs />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.AUDIT_TRAILS} requiredRole={["admin", "manager"]}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Audit & Compliance" description="Audit trails and compliance reporting" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />

                {/* Communication */}
                <Route
                  path="/communication/announcements"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.COMMUNICATION_ANNOUNCEMENTS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Announcements" description="Create and manage system announcements" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
                  }
                />
                <Route
                  path="/communication/messages"
                  element={
                    <EnhancedProtectedRoute requiredPermission={PERMISSIONS.COMMUNICATION_MESSAGES}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Messages" description="Internal messaging and communication" />
                      </AuthenticatedLayout>
                    </EnhancedProtectedRoute>
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
