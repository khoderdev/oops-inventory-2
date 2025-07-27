import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import UserManagementPage from "./components/admin/UserManagementPage";
import { ReportGenerator } from "./components/analytics/ReportGenerator";
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { InventoryManagementPanel } from "./components/inventory/InventoryManagementPanel";
import ProtectedNavigation from "./components/layout/ProtectedNavigation";
import { MenuItemBuilder } from "./components/menu/MenuBuilder";
import { POSPanel } from "./components/POSPanel";
import ProfilePage from "./components/profile/ProfilePage";
import SessionManagementPage from "./components/profile/SessionManagementPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { useInventoryData } from "./hooks/useInventoryData";
import DayOperationsPage from "./pages/DayOperationsPage";
import NotFound from "./pages/NotFound";
import POSClientPage from "./pages/POSClientPage";
import { SalesHistoryPage } from "./pages/SalesHistoryPage";
import { PERMISSIONS } from "./types/auth";
import { InventoryManagementPanelProps } from "./types/inventory";

const queryClient = new QueryClient();

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedNavigation />
      <main className={`px-4 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>{children}</main>
    </div>
  );
};

// Role-based route wrapper that redirects STAFF users to POS client
const RoleBasedRoute = ({ children, fallbackPath = "/pos-client" }: { children: React.ReactNode; fallbackPath?: string }) => {
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
  const { materials } = useInventoryData();
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
            <SidebarProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <DayOperationsPage />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* POS - Backoffice */}
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MATERIALS_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <POSPanel materials={materialsWithStock} sectionAssignments={sectionAssignments} />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* POS Client - Full Screen */}
                <Route
                  path="/pos-client"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SALES_CREATE}>
                      <POSClientPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
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

                {/* Sales */}
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
                  path="/sales-history"
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
                  path="/menu-items"
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

                {/* Reports */}
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <ReportGenerator className="w-full" />
                        </AuthenticatedLayout>
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Analytics */}
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.ANALYTICS_READ}>
                      <RoleBasedRoute>
                        <AuthenticatedLayout>
                          <div className="p-8 text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
                            <p className="text-gray-600">Analytics functionality coming soon...</p>
                          </div>
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

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
