import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Loading } from "../ui/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string | string[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission, requiredRole, fallbackPath = "/login" }) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Access Denied</h3>
            <p className="text-sm">You don't have the required role to access this page.</p>
            <p className="text-xs mt-2">
              Required: {Array.isArray(requiredRole) ? requiredRole.join(" or ") : requiredRole}
              <br />
              Your role: {user?.role}
            </p>
          </div>
          <button onClick={() => window.history.back()} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Access Denied</h3>
            <p className="text-sm">You don't have permission to access this page.</p>
            <p className="text-xs mt-2">Required permission: {requiredPermission}</p>
          </div>
          <button onClick={() => window.history.back()} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
