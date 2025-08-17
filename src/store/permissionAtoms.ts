import { User } from "@/types/auth";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Base user and permission atoms (writable)
export const currentUserAtom = atom<User | null>(null);
export const userPermissionsAtom = atom<Record<string, boolean>>({});
export const userRoleAtom = atom<"admin" | "manager" | "staff" | null>(null);

// Authentication state atoms (writable)
export const isAuthenticatedAtom = atom<boolean>(false);
export const authTokenAtom = atom<string | null>(null);
export const isAuthLoadingAtom = atom<boolean>(true);

// Permission checking atoms (derived)
export const hasPermissionAtom = atom(
  null,
  (get, set, permission: string) => {
    const permissions = get(userPermissionsAtom);
    return permissions[permission] === true;
  }
);

export const hasRoleAtom = atom(
  null,
  (get, set, role: string | string[]) => {
    const userRole = get(userRoleAtom);
    if (!userRole) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  }
);

export const hasAnyPermissionAtom = atom(
  null,
  (get, set, permissions: string[]) => {
    const userPermissions = get(userPermissionsAtom);
    return permissions.some(permission => userPermissions[permission] === true);
  }
);

export const hasAllPermissionsAtom = atom(
  null,
  (get, set, permissions: string[]) => {
    const userPermissions = get(userPermissionsAtom);
    return permissions.every(permission => userPermissions[permission] === true);
  }
);

// UI state atoms
export const sidebarCollapsedAtom = atomWithStorage("sidebarCollapsed", false);
export const activeRouteAtom = atom<string>("/");
export const breadcrumbsAtom = atom<{ label: string; href?: string }[]>([]);

// Role-based UI preferences
export const roleBasedUIPreferencesAtom = atomWithStorage("roleBasedUIPreferences", {
  admin: {
    defaultRoute: "/",
    preferredSidebarSections: ["all"],
    dashboardLayout: "comprehensive"
  },
  manager: {
    defaultRoute: "/",
    preferredSidebarSections: ["inventory", "sales", "reports"],
    dashboardLayout: "operational"
  },
  staff: {
    defaultRoute: "/pos",
    preferredSidebarSections: ["pos"],
    dashboardLayout: "minimal"
  }
});

// Permission groups visibility (for admin interfaces)
export const visiblePermissionGroupsAtom = atom<string[]>([]);
export const permissionSearchTermAtom = atom<string>("");
export const permissionFilterModeAtom = atom<"all" | "granted" | "denied">("all");

// Navigation state
export const navigationItemsVisibilityAtom = atom<Record<string, boolean>>({});
export const collapsedNavigationSectionsAtom = atomWithStorage("collapsedNavigationSections", new Set<string>());

// Security and audit atoms
// Use a concrete Date (no null) to keep WritableAtom<Date, [Date], ...> compatible with set(..., new Date())
export const lastPermissionCheckAtom = atom<Date>(new Date());
export const permissionViolationAttemptsAtom = atom<Array<{
  permission: string;
  route: string;
  timestamp: Date;
  userRole: string;
}>>([]);

// Performance optimization atoms
export const permissionCacheAtom = atom<Map<string, { result: boolean; timestamp: number }>>(new Map());
export const roleCacheAtom = atom<Map<string, { result: boolean; timestamp: number }>>(new Map());

// Cache TTL (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Cached permission checker
export const cachedHasPermissionAtom = atom(
  null,
  (get, set, permission: string) => {
    const cache = get(permissionCacheAtom);
    const cached = cache.get(permission);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }
    
    const permissions = get(userPermissionsAtom);
    const result = permissions[permission] === true;
    
    // Update cache
    const newCache = new Map(cache);
    newCache.set(permission, { result, timestamp: Date.now() });
    set(permissionCacheAtom, newCache);
    
    return result;
  }
);

// Cached role checker
export const cachedHasRoleAtom = atom(
  null,
  (get, set, role: string | string[]) => {
    const cacheKey = Array.isArray(role) ? role.join(",") : role;
    const cache = get(roleCacheAtom);
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }
    
    const userRole = get(userRoleAtom);
    let result = false;
    
    if (userRole) {
      if (Array.isArray(role)) {
        result = role.includes(userRole);
      } else {
        result = userRole === role;
      }
    }
    
    // Update cache
    const newCache = new Map(cache);
    newCache.set(cacheKey, { result, timestamp: Date.now() });
    set(roleCacheAtom, newCache);
    
    return result;
  }
);

// Clear caches when user changes
export const clearPermissionCachesAtom = atom(
  null,
  (get, set) => {
    set(permissionCacheAtom, new Map());
    set(roleCacheAtom, new Map());
    set(lastPermissionCheckAtom, new Date());
  }
);

// Sync atoms with AuthContext
export const syncAuthStateAtom = atom(
  null,
  (get, set, authState: {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
    isLoading: boolean;
  }) => {
    set(currentUserAtom, authState.user);
    set(isAuthenticatedAtom, authState.isAuthenticated);
    set(authTokenAtom, authState.token);
    set(isAuthLoadingAtom, authState.isLoading);
    
    if (authState.user) {
      set(userPermissionsAtom, authState.user.permissions || {});
      set(userRoleAtom, authState.user.role);
    } else {
      set(userPermissionsAtom, {});
      set(userRoleAtom, null);
    }
    
    // Clear caches when auth state changes
    set(permissionCacheAtom, new Map());
    set(roleCacheAtom, new Map());
    set(lastPermissionCheckAtom, new Date());
  }
);
