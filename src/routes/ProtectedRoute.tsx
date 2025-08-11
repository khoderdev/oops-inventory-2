import { lazy } from "react";
import { RoleBasedRoute } from "./RoleBasedRoute";
import { ErrorBoundary, ErrorFallback } from "@/utils/ErrorFallback";

const ProtectedRoutes = lazy(() => import("../components/auth/ProtectedRoute"));

export const ProtectedRoute = ({ children, requiredPermission, requiredRole, fallbackPath = "/login", pageTitle }: { children: React.ReactNode; requiredPermission?: string; requiredRole?: string | string[]; fallbackPath?: string; pageTitle?: string }) => {
  return (
    <ProtectedRoutes requiredPermission={requiredPermission} requiredRole={requiredRole} fallbackPath={fallbackPath}>
      <RoleBasedRoute>
        <ErrorBoundary fallback={<ErrorFallback pageTitle={pageTitle} />}>{children}</ErrorBoundary>
      </RoleBasedRoute>
    </ProtectedRoutes>
  );
};
