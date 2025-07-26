import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { useInventoryData } from "./hooks/useInventoryData";
import DayOperationsPage from "./pages/DayOperationsPage";
import NotFound from "./pages/NotFound";
import { SalesHistoryPage } from "./pages/SalesHistoryPage";
import POSClientPage from "./pages/POSClientPage";
import { PERMISSIONS } from "./types/auth";
import { InventoryManagementPanelProps } from "./types/inventory";

const queryClient = new QueryClient();

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedNavigation />
      <main className={`p-6 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>{children}</main>
    </div>
  );
};

export default function App({ onDeleteMaterial, onDeleteStockEntry, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem, onCreateSection, onUpdateSection, onDeleteSection }: InventoryManagementPanelProps = {}) {
  const { materials } = useInventoryData();
  const { materialsWithStock, stockEntries, sections, sectionAssignments, menuItems, fetchTabData } = useInventoryStore();

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
                      <AuthenticatedLayout>
                        <DayOperationsPage />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* POS - Backoffice */}
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MATERIALS_READ}>
                      <AuthenticatedLayout>
                        <POSPanel materials={materialsWithStock} sectionAssignments={sectionAssignments} />
                      </AuthenticatedLayout>
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
                      <AuthenticatedLayout>
                        <InventoryManagementPanel />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Sales */}
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
                  path="/sales-history"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.SALES_READ}>
                      <AuthenticatedLayout>
                        <SalesHistoryPage />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/menu-items"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MENU_ITEMS_READ}>
                      <AuthenticatedLayout>
                        <MenuItemBuilder stockEntries={stockEntries} materials={materialsWithStock} menuItems={menuItems} onCreateMenuItem={onCreateMenuItem} onUpdateMenuItem={onUpdateMenuItem} onDeleteMenuItem={onDeleteMenuItem} sections={sections} sectionAssignments={sectionAssignments} />
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

                {/* Admin Routes */}
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

                {/* Reports */}
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_READ}>
                      <AuthenticatedLayout>
                        <ReportGenerator className="w-full" />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Analytics */}
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.ANALYTICS_READ}>
                      <AuthenticatedLayout>
                        <div className="p-8 text-center">
                          <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
                          <p className="text-gray-600">Analytics functionality coming soon...</p>
                        </div>
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
