export interface User {
  id: number;
  username: string;
  phone: string;
  firstName: string;
  lastName: string;
  fullName: string;
  address: string;
  role: "admin" | "manager" | "staff";
  permissions: Record<string, boolean>;
  specificPermissions?: Record<string, boolean>;
  isActive: boolean;
  lastLogin: string | null;
  loginAttempts: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  createdBy?: {
    id: number;
    username: string;
    fullName: string;
  } | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "admin" | "manager" | "staff";
  permissions?: Record<string, boolean>;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Session {
  id: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  lastActivityAt?: string;
  expiresAt: string;
  createdAt: string;
  isCurrent?: boolean;
  isActive: boolean;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  resource: string;
  resourceId: string | null;
  oldValues: any;
  newValues: any;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  status: "success" | "failure" | "warning";
  errorMessage: string | null;
  timestamp: string;
  user?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface SessionInfo {
  sessionId: string | null;
  expiresAt: Date;
  lastActivity: Date;
  isExpired: boolean;
  shouldRefresh: boolean;
  isInactive: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionInfo: SessionInfo | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "manager" | "staff";
  permissions?: Record<string, boolean>;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "manager" | "staff";
  permissions?: Record<string, boolean>;
  isActive?: boolean;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserActivityResponse {
  activities: AuditLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalActivities: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Permission constants
export const PERMISSIONS = {
  // Users
  USERS_CREATE: "users.create",
  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // Materials
  MATERIALS_CREATE: "materials.create",
  MATERIALS_READ: "materials.read",
  MATERIALS_UPDATE: "materials.update",
  MATERIALS_DELETE: "materials.delete",

  // Stock
  STOCK_CREATE: "stock.create",
  STOCK_READ: "stock.read",
  STOCK_UPDATE: "stock.update",
  STOCK_DELETE: "stock.delete",

  // Sales
  SALES_CREATE: "sales.create",
  SALES_READ: "sales.read",
  SALES_UPDATE: "sales.update",
  SALES_DELETE: "sales.delete",
  SALES_REVERT: "sales.revert",

  // Sections
  SECTIONS_CREATE: "sections.create",
  SECTIONS_READ: "sections.read",
  SECTIONS_UPDATE: "sections.update",
  SECTIONS_DELETE: "sections.delete",

  // Assignments
  ASSIGNMENTS_CREATE: "assignments.create",
  ASSIGNMENTS_READ: "assignments.read",
  ASSIGNMENTS_UPDATE: "assignments.update",
  ASSIGNMENTS_DELETE: "assignments.delete",

  // Menu Items
  MENU_ITEMS_CREATE: "menuItems.create",
  MENU_ITEMS_READ: "menuItems.read",
  MENU_ITEMS_UPDATE: "menuItems.update",
  MENU_ITEMS_DELETE: "menuItems.delete",

  // Day Operations
  DAY_OPERATIONS_CREATE: "dayOperations.create",
  DAY_OPERATIONS_READ: "dayOperations.read",
  DAY_OPERATIONS_UPDATE: "dayOperations.update",
  DAY_OPERATIONS_DELETE: "dayOperations.delete",

  // Reports
  REPORTS_READ: "reports.read",
  REPORTS_EXPORT: "reports.export",

  // Analytics
  ANALYTICS_READ: "analytics.read",

  // System
  SYSTEM_SETTINGS: "system.settings"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role definitions with default permissions
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.MATERIALS_CREATE,
    PERMISSIONS.MATERIALS_READ,
    PERMISSIONS.MATERIALS_UPDATE,
    PERMISSIONS.STOCK_CREATE,
    PERMISSIONS.STOCK_READ,
    PERMISSIONS.STOCK_UPDATE,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_UPDATE,
    PERMISSIONS.SALES_DELETE,
    PERMISSIONS.SALES_REVERT,
    PERMISSIONS.SECTIONS_CREATE,
    PERMISSIONS.SECTIONS_READ,
    PERMISSIONS.SECTIONS_UPDATE,
    PERMISSIONS.ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_UPDATE,
    PERMISSIONS.ASSIGNMENTS_DELETE,
    PERMISSIONS.MENU_ITEMS_CREATE,
    PERMISSIONS.MENU_ITEMS_READ,
    PERMISSIONS.MENU_ITEMS_UPDATE,
    PERMISSIONS.DAY_OPERATIONS_CREATE,
    PERMISSIONS.DAY_OPERATIONS_READ,
    PERMISSIONS.DAY_OPERATIONS_UPDATE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_READ
  ],
  staff: [PERMISSIONS.MATERIALS_READ, PERMISSIONS.STOCK_CREATE, PERMISSIONS.STOCK_READ, PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_READ, PERMISSIONS.SECTIONS_READ, PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.MENU_ITEMS_READ, PERMISSIONS.DAY_OPERATIONS_READ]
} as const;
