import { Button } from "@/components/ui/button";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/types/auth";
import { InventoryManagementPanelProps } from "@/types/inventory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import React, { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { EmployeeManagement } from "./components/employees";
import { POSClientOrders } from "./components/pos/POSClientOrders";
import { DatabaseBackupManager } from "./components/system/settings";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy load components for better performance
const UserManagementPage = lazy(() => import("./components/admin/UserManagementPage"));
const ReportGenerator = lazy(() => import("./components/analytics/ReportGenerator").then(m => ({ default: m.ReportGenerator })));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const ProtectedRoutes = lazy(() => import("./components/auth/ProtectedRoute"));
const InventoryManagementPanel = lazy(() => import("./components/inventory/InventoryManagementPanel").then(m => ({ default: m.InventoryManagementPanel })));
const SidebarLayout = lazy(() => import("./components/layout/SidebarLayout").then(module => ({ default: module.SidebarLayout })));
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

// Enhanced loading component for Suspense fallback
const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background safe-area-padding">
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      {/* Loading spinner */}
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary"></div>
        <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-primary/30 animate-pulse"></div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-foreground animate-pulse-gentle">{message}</p>
        <p className="text-xs text-muted-foreground">Please wait while we prepare your experience</p>
      </div>
    </div>
  </div>
);

// Page-specific loading component
const PageLoadingFallback = ({ pageName }: { pageName?: string }) => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
      <p className="text-sm text-muted-foreground">Loading {pageName || "page"}...</p>
    </div>
  </div>
);

// Enhanced layout component for authenticated pages
const AuthenticatedLayout = ({ children, pageTitle, showSearch = true, showNotifications = true }: { children: React.ReactNode; pageTitle?: string; showSearch?: boolean; showNotifications?: boolean }) => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback message="Loading application..." />}>
        <SidebarLayout pageTitle={pageTitle} showSearch={showSearch} showNotifications={showNotifications}>
          <Suspense fallback={<PageLoadingFallback pageName={pageTitle} />}>
            <div className="animate-fade-in">{children}</div>
          </Suspense>
        </SidebarLayout>
      </Suspense>
    </div>
  );
};

// Enhanced role-based route wrapper with better UX
const RoleBasedRoute = ({ children, fallbackPath = "/pos", allowedPaths = ["/pos", "/profile"] }: { children: React.ReactNode; fallbackPath?: string; allowedPaths?: string[] }) => {
  const { isStaffOnly, isLoading } = usePermissions();
  const location = useLocation();

  // Show loading while checking permissions
  if (isLoading) {
    return <LoadingFallback message="Checking permissions..." />;
  }

  // Redirect staff users to appropriate interface
  if (isStaffOnly && !allowedPaths.some(path => location.pathname.startsWith(path))) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

// Enhanced route protection with better error handling
const ProtectedRoute = ({ children, requiredPermission, requiredRole, fallbackPath = "/login", pageTitle }: { children: React.ReactNode; requiredPermission?: string; requiredRole?: string | string[]; fallbackPath?: string; pageTitle?: string }) => {
  return (
    <ProtectedRoutes requiredPermission={requiredPermission} requiredRole={requiredRole} fallbackPath={fallbackPath}>
      <RoleBasedRoute>
        <ErrorBoundary fallback={<ErrorFallback pageTitle={pageTitle} />}>{children}</ErrorBoundary>
      </RoleBasedRoute>
    </ProtectedRoutes>
  );
};

// Error boundary fallback component
const ErrorFallback = ({ pageTitle }: { pageTitle?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
    <div className="animate-fade-in space-y-4">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">{pageTitle ? `There was an error loading ${pageTitle}.` : "An unexpected error occurred."} Please try refreshing the page or contact support if the problem persists.</p>
      </div>
      <Button onClick={() => window.location.reload()} variant="outline" className="btn-touch">
        Refresh Page
      </Button>
    </div>
  </div>
);

// Simple error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function App({ onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }: InventoryManagementPanelProps = {}) {
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
                      <RoleBasedRoute allowedPaths={["/pos"]}>
                        {/* <AuthenticatedLayout> */}
                        <POSClientPage />
                        {/* </AuthenticatedLayout> */}
                      </RoleBasedRoute>
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
                <Route
                  path="/pos/kitchen-display"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.POS_KITCHEN_DISPLAY}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Kitchen Display" description="Kitchen order display system" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos/customer-display"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.POS_CUSTOMER_DISPLAY}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Customer Display" description="Customer-facing display system" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Materials Management */}
                <Route
                  path="/materials"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MATERIALS_READ}>
                      <AuthenticatedLayout>
                        <InventoryManagementPanel onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Inventory & Stock Management */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_READ}>
                      <AuthenticatedLayout>
                        <InventoryManagementPanel onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/adjustments"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_ADJUST}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Stock Adjustments" description="Adjust stock quantities and manage inventory discrepancies" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/transfers"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_TRANSFER}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Stock Transfers" description="Transfer stock between locations and sections" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/waste"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_WASTE_RECORD}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Waste Management" description="Record and track inventory waste" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/assignments"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.ASSIGNMENTS_READ}>
                      <AuthenticatedLayout>
                        <InventoryManagementPanel />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/sections"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SECTIONS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Section Management" description="Manage inventory sections and organization" />
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
                <Route
                  path="/sales/refunds"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SALES_REFUND}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Sales Refunds" description="Process and manage sales refunds" />
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
                <Route
                  path="/orders/queue"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.ORDERS_MANAGE_QUEUE}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Order Queue" description="Manage order processing queue" />
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
                  path="/inventory/menu-items"
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
                <Route
                  path="/menu/pricing"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_PRICING}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Menu Pricing" description="Manage menu item pricing and cost analysis" />
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
                <Route
                  path="/reports/sales"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_SALES}>
                      <AuthenticatedLayout>
                        <ReportGenerator className="w-full" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/inventory"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_INVENTORY}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Inventory Reports" description="Generate inventory and stock reports" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/financial"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_FINANCIAL}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Financial Reports" description="Generate financial and accounting reports" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.ANALYTICS_DASHBOARD}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Analytics Dashboard" description="Business intelligence and analytics overview" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics/trends"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.ANALYTICS_TRENDS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Trends Analysis" description="Sales and inventory trend analysis" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Financial Management */}
                <Route
                  path="/finance"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.FINANCE_VIEW_COSTS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Financial Overview" description="Financial management and cost analysis" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/finance/budgets"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.FINANCE_BUDGETS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Budget Management" description="Create and manage budgets" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/finance/expenses"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.FINANCE_EXPENSES}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Expense Tracking" description="Track and categorize business expenses" />
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
                        <EmployeeManagement />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Customer & Supplier Management */}
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.CUSTOMERS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Customer Management" description="Manage customer information and relationships" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suppliers"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SUPPLIERS_READ}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Supplier Management" description="Manage supplier relationships and contracts" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.PROCUREMENT_ORDERS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Procurement" description="Manage procurement orders and receiving" />
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
                  path="/admin/permissions"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.USERS_MANAGE_PERMISSIONS} requiredRole={["admin"]}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Permission Management" description="Manage user permissions and access control" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/system"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_SETTINGS} requiredRole={["admin"]}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="System Settings" description="Configure system-wide settings and preferences" />
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
                <Route
                  path="/admin/audit"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.AUDIT_TRAILS} requiredRole={["admin", "manager"]}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Audit & Compliance" description="Audit trails and compliance reporting" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Communication */}
                <Route
                  path="/communication/announcements"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.COMMUNICATION_ANNOUNCEMENTS}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Announcements" description="Create and manage system announcements" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/communication/messages"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.COMMUNICATION_MESSAGES}>
                      <AuthenticatedLayout>
                        <PlaceholderPage title="Messages" description="Internal messaging and communication" />
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
