import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import SystemLogs from "./pages/SystemLogs";
import { PERMISSIONS } from "./types/auth";
import { InventoryManagementPanelProps } from "./types/inventory";

// Lazy load components for better performance
const UserManagementPage = lazy(() => import("./components/admin/UserManagementPage"));
const ReportGenerator = lazy(() => import("./components/analytics/ReportGenerator").then(m => ({ default: m.ReportGenerator })));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
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

// Role-based route wrapper that redirects STAFF users to POS client
const RoleBasedRoute = ({ children, fallbackPath = "/pos" }: { children: React.ReactNode; fallbackPath?: string }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If user is STAFF, redirect to POS client only
  if (user?.role === "staff") {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

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
                    <ProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <DayOperationsPage />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* POS System Routes */}
                <Route
                  path="/backoffice-pos"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.POS_ACCESS}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <POSPanel materials={materialsWithStock} sectionAssignments={sectionAssignments} />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.POS_ACCESS}>
                      <POSClientPage />
                    </ProtectedRoute>
                  }
                />

                {/* Materials Management */}
                <Route
                  path="/materials"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MATERIALS_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <InventoryManagementPanel onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Inventory & Stock Management */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <InventoryManagementPanel onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/system-logs"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SYSTEM_LOGS}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <SystemLogs />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/inventory/assignments"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.ASSIGNMENTS_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <InventoryManagementPanel />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Sales & Transactions */}
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SALES_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <SalesHistoryPage />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/history"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SALES_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <SalesHistoryPage />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Menu Management */}
                <Route
                  path="/inventory/menu-items"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <MenuItemBuilder stockEntries={stockEntries} materials={materialsWithStock} menuItems={menuItems} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} sections={sections} />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Day Operations */}
                <Route
                  path="/day-operations"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.DAY_OPERATIONS_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <DayOperationsPage />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Reports & Analytics */}
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_SALES}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <ReportGenerator className="w-full" />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/sales"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_SALES}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <ReportGenerator className="w-full" />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Profile Management */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <ProfilePage />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/sessions"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <SessionManagementPage />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.USERS_READ} requiredRole={["admin", "manager"]}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <UserManagementPage />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
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
