import { useAuth } from "@/contexts/AuthContext";
import { cachedHasPermissionAtom, cachedHasRoleAtom, currentUserAtom, hasAllPermissionsAtom, hasAnyPermissionAtom, isAuthenticatedAtom, permissionViolationAttemptsAtom, syncAuthStateAtom, userRoleAtom } from "@/store/permissionAtoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

/**
 * Permission hook with caching and violation tracking
 */
export const usePermissions = () => {
  const auth = useAuth();
  const location = useLocation();
  const [, checkPermission] = useAtom(cachedHasPermissionAtom);
  const [, checkRole] = useAtom(cachedHasRoleAtom);
  const [, checkAnyPermission] = useAtom(hasAnyPermissionAtom);
  const [, checkAllPermissions] = useAtom(hasAllPermissionsAtom);
  const syncAuthState = useSetAtom(syncAuthStateAtom);
  const setViolationAttempts = useSetAtom(permissionViolationAttemptsAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const userRole = useAtomValue(userRoleAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  // Sync auth state with atoms
  useEffect(() => {
    syncAuthState({
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      token: auth.token,
      isLoading: auth.isLoading
    });
  }, [auth.user, auth.isAuthenticated, auth.token, auth.isLoading, syncAuthState]);

  // Enhanced permission checker with violation tracking
  const hasPermission = useCallback(
    (permission: string, trackViolation = true) => {
      const result = checkPermission(permission);

      if (!result && trackViolation && isAuthenticated && userRole) {
        setViolationAttempts(prev => [
          ...prev,
          {
            permission,
            route: location.pathname,
            timestamp: new Date(),
            userRole
          }
        ]);
      }

      return result;
    },
    [checkPermission, isAuthenticated, userRole, location.pathname, setViolationAttempts]
  );

  // Enhanced role checker
  const hasRole = useCallback(
    (role: string | string[]) => {
      return checkRole(role);
    },
    [checkRole]
  );

  // Check if user has any of the provided permissions
  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      return checkAnyPermission(permissions);
    },
    [checkAnyPermission]
  );

  // Check if user has all of the provided permissions
  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      return checkAllPermissions(permissions);
    },
    [checkAllPermissions]
  );

  // Check if user can access a specific route
  const canAccessRoute = useCallback(
    (requiredPermission?: string, requiredRole?: string | string[]) => {
      if (!isAuthenticated) return false;

      if (requiredRole && !hasRole(requiredRole)) return false;
      if (requiredPermission && !hasPermission(requiredPermission, false)) return false;

      return true;
    },
    [isAuthenticated, hasRole, hasPermission]
  );

  // Get user's effective permissions (role + specific permissions)
  const effectivePermissions = useMemo(() => {
    if (!currentUser) return {};

    const permissions = { ...currentUser.permissions };
    if (currentUser.specificPermissions) {
      Object.assign(permissions, currentUser.specificPermissions);
    }

    return permissions;
  }, [currentUser]);

  // Get granted permissions list
  const grantedPermissions = useMemo(() => {
    return Object.entries(effectivePermissions)
      .filter(([, granted]) => granted)
      .map(([permission]) => permission);
  }, [effectivePermissions]);

  // Check if user is admin
  const isAdmin = useMemo(() => hasRole("admin"), [hasRole]);

  // Check if user is manager or above
  const isManagerOrAbove = useMemo(() => hasRole(["admin", "manager"]), [hasRole]);

  // Check if user is staff only
  const isStaffOnly = useMemo(() => hasRole("staff"), [hasRole]);

  return {
    // Core auth state
    user: currentUser,
    userRole,
    isAuthenticated,
    isLoading: auth.isLoading,

    // Permission checking
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,

    // Convenience checks
    isAdmin,
    isManagerOrAbove,
    isStaffOnly,

    // Permission data
    effectivePermissions,
    grantedPermissions,

    // Auth methods
    login: auth.login,
    logout: auth.logout,
    refreshUser: auth.refreshUser
  };
};

/**
 * Hook for conditional rendering based on permissions
 */
export const useConditionalRender = () => {
  const { hasPermission, hasRole, isAuthenticated, hasAnyPermission } = usePermissions();

  const renderIfPermission = useCallback(
    (permission: string, component: React.ReactNode, fallback?: React.ReactNode) => {
      return hasPermission(permission) ? component : fallback || null;
    },
    [hasPermission]
  );

  const renderIfRole = useCallback(
    (role: string | string[], component: React.ReactNode, fallback?: React.ReactNode) => {
      return hasRole(role) ? component : fallback || null;
    },
    [hasRole]
  );

  const renderIfAuthenticated = useCallback(
    (component: React.ReactNode, fallback?: React.ReactNode) => {
      return isAuthenticated ? component : fallback || null;
    },
    [isAuthenticated]
  );

  const renderIfAnyPermission = useCallback(
    (permissions: string[], component: React.ReactNode, fallback?: React.ReactNode) => {
      return hasAnyPermission(permissions) ? component : fallback || null;
    },
    [hasAnyPermission]
  );

  return {
    renderIfPermission,
    renderIfRole,
    renderIfAuthenticated,
    renderIfAnyPermission
  };
};

/**
 * Hook for navigation-specific permission checks
 */
export const useNavigationPermissions = () => {
  const { hasPermission, hasRole, userRole } = usePermissions();

  const getDefaultRoute = useCallback(() => {
    if (!userRole) return "/login";

    switch (userRole) {
      case "staff":
        return "/pos";
      case "manager":
        return "/";
      case "admin":
        return "/";
      default:
        return "/";
    }
  }, [userRole]);

  const shouldRedirectToDefault = useCallback(
    (currentPath: string) => {
      if (userRole === "staff" && !currentPath.startsWith("/pos") && !currentPath.startsWith("/profile")) {
        return true;
      }
      return false;
    },
    [userRole]
  );

  const getAccessibleRoutes = useCallback(() => {
    const routes: string[] = [];

    // Always accessible for authenticated users
    routes.push("/profile", "/profile/sessions");

    // Role-based accessible routes
    if (hasRole("staff")) {
      routes.push("/pos");
    }

    if (hasRole(["manager", "admin"])) {
      routes.push("/", "/inventory", "/sales", "/reports", "/day-operations");
    }

    if (hasRole("admin")) {
      routes.push("/admin/users", "/admin/system-logs");
    }

    return routes;
  }, [hasRole]);

  return {
    getDefaultRoute,
    shouldRedirectToDefault,
    getAccessibleRoutes
  };
};

/**
 * Hook for role-based UI customization
 */
export const useRoleBasedUI = () => {
  const { userRole, isAdmin, isManagerOrAbove, isStaffOnly } = usePermissions();

  const getUIVariant = useCallback(
    (variants: { admin?: React.ReactNode; manager?: React.ReactNode; staff?: React.ReactNode; default?: React.ReactNode }) => {
      if (isAdmin && variants.admin) return variants.admin;
      if (userRole === "manager" && variants.manager) return variants.manager;
      if (isStaffOnly && variants.staff) return variants.staff;
      return variants.default || null;
    },
    [userRole, isAdmin, isStaffOnly]
  );

  const getThemeVariant = useCallback(() => {
    switch (userRole) {
      case "admin":
        return "admin"; // Red accent theme
      case "manager":
        return "manager"; // Blue accent theme
      case "staff":
        return "staff"; // Green accent theme
      default:
        return "default";
    }
  }, [userRole]);

  return {
    getUIVariant,
    getThemeVariant,
    userRole,
    isAdmin,
    isManagerOrAbove,
    isStaffOnly
  };
};
