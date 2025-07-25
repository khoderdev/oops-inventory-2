import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import UserManagementPage from "./components/admin/UserManagementPage";
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProtectedNavigation from "./components/layout/ProtectedNavigation";
import { POSPanel } from "./components/POSPanel";
import ProfilePage from "./components/profile/ProfilePage";
import SessionManagementPage from "./components/profile/SessionManagementPage";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { useInventoryData } from "./hooks/useInventoryData";
import DayOperationsPage from "./pages/DayOperationsPage";
import { InventoryManagementPage } from "./pages/InventoryManagementPage";
import NotFound from "./pages/NotFound";
import { SalesHistoryPage } from "./pages/SalesHistoryPage";
import { PERMISSIONS } from "./types/auth";

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

const App = () => {
  const { materials, sectionAssignments } = useInventoryData();

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

                {/* POS */}
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MATERIALS_READ}>
                      <AuthenticatedLayout>
                        <POSPanel materials={materials} sectionAssignments={sectionAssignments} />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Materials */}
                <Route
                  path="/materials"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.MATERIALS_READ}>
                      <AuthenticatedLayout>
                        <InventoryManagementPage />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Stock */}
                <Route
                  path="/stock"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_READ}>
                      <AuthenticatedLayout>
                        <InventoryManagementPage />
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
                        <div className="p-8 text-center">
                          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports</h1>
                          <p className="text-gray-600">Reports functionality coming soon...</p>
                        </div>
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

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
