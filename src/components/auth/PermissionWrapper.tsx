import { usePermissions } from "@/hooks/usePermissions";
import { AlertTriangle, Lock } from "lucide-react";
import React from "react";

interface PermissionWrapperProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string | string[];
  requiredAnyPermissions?: string[];
  requiredAllPermissions?: string[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
  className?: string;
}

/**
 * Component wrapper that conditionally renders children based on permissions
 */
export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({ children, requiredPermission, requiredRole, requiredAnyPermissions, requiredAllPermissions, fallback, showFallback = false, className }) => {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, isAuthenticated } = usePermissions();

  // Check authentication first
  if (!isAuthenticated) {
    return showFallback ? (
      <div className={`flex items-center gap-2 text-gray-500 ${className || ""}`}>
        <Lock className="h-4 w-4" />
        <span className="text-sm">Authentication required</span>
      </div>
    ) : null;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return showFallback
      ? fallback || (
          <div className={`flex items-center gap-2 text-gray-500 ${className || ""}`}>
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Insufficient role permissions</span>
          </div>
        )
      : null;
  }

  // Check single permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return showFallback
      ? fallback || (
          <div className={`flex items-center gap-2 text-gray-500 ${className || ""}`}>
            <Lock className="h-4 w-4" />
            <span className="text-sm">Permission required</span>
          </div>
        )
      : null;
  }

  // Check any permissions requirement
  if (requiredAnyPermissions && !hasAnyPermission(requiredAnyPermissions)) {
    return showFallback
      ? fallback || (
          <div className={`flex items-center gap-2 text-gray-500 ${className || ""}`}>
            <Lock className="h-4 w-4" />
            <span className="text-sm">One of required permissions needed</span>
          </div>
        )
      : null;
  }

  // Check all permissions requirement
  if (requiredAllPermissions && !hasAllPermissions(requiredAllPermissions)) {
    return showFallback
      ? fallback || (
          <div className={`flex items-center gap-2 text-gray-500 ${className || ""}`}>
            <Lock className="h-4 w-4" />
            <span className="text-sm">All required permissions needed</span>
          </div>
        )
      : null;
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: {
    requiredPermission?: string;
    requiredRole?: string | string[];
    requiredAnyPermissions?: string[];
    requiredAllPermissions?: string[];
    fallback?: React.ReactNode;
    showFallback?: boolean;
  }
) => {
  return (props: P) => (
    <PermissionWrapper {...permissionConfig}>
      <Component {...props} />
    </PermissionWrapper>
  );
};

/**
 * Hook for conditional rendering based on permissions (alternative to PermissionWrapper)
 */
export const usePermissionRender = () => {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, isAuthenticated } = usePermissions();

  const renderIfPermission = (permission: string, component: React.ReactNode, fallback?: React.ReactNode) => {
    return hasPermission(permission) ? component : fallback || null;
  };

  const renderIfRole = (role: string | string[], component: React.ReactNode, fallback?: React.ReactNode) => {
    return hasRole(role) ? component : fallback || null;
  };

  const renderIfAuthenticated = (component: React.ReactNode, fallback?: React.ReactNode) => {
    return isAuthenticated ? component : fallback || null;
  };

  const renderIfAnyPermission = (permissions: string[], component: React.ReactNode, fallback?: React.ReactNode) => {
    return hasAnyPermission(permissions) ? component : fallback || null;
  };

  const renderIfAllPermissions = (permissions: string[], component: React.ReactNode, fallback?: React.ReactNode) => {
    return hasAllPermissions(permissions) ? component : fallback || null;
  };

  return {
    renderIfPermission,
    renderIfRole,
    renderIfAuthenticated,
    renderIfAnyPermission,
    renderIfAllPermissions
  };
};

/**
 * Component for role-based UI variants
 */
interface RoleBasedUIProps {
  admin?: React.ReactNode;
  manager?: React.ReactNode;
  staff?: React.ReactNode;
  default?: React.ReactNode;
  className?: string;
}

export const RoleBasedUI: React.FC<RoleBasedUIProps> = ({ admin, manager, staff, default: defaultComponent, className }) => {
  const { userRole } = usePermissions();

  let content: React.ReactNode = defaultComponent;

  switch (userRole) {
    case "admin":
      content = admin || defaultComponent;
      break;
    case "manager":
      content = manager || defaultComponent;
      break;
    case "staff":
      content = staff || defaultComponent;
      break;
    default:
      content = defaultComponent;
  }

  return content ? <div className={className}>{content}</div> : null;
};

export default PermissionWrapper;
