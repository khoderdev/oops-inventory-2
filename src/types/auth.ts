import { BarChart3, ClipboardList, DollarSign, Lock, Monitor, Package, Receipt, Settings, ShoppingCart, Users, Utensils } from "lucide-react";

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
  username?: string;
  password?: string;
  pin?: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
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
  loginWithPin: (pin: string, deviceInfo?: { deviceId?: string; deviceName?: string; deviceType?: string }) => Promise<void>;
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

// Comprehensive Permission System - Covers Every Aspect
export const PERMISSIONS = {
  // === USER MANAGEMENT ===
  USERS_CREATE: "users.create",
  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_RESET_PASSWORD: "users.resetPassword",
  USERS_UNLOCK: "users.unlock",
  USERS_MANAGE_PERMISSIONS: "users.managePermissions",
  USERS_VIEW_ACTIVITY: "users.viewActivity",
  USERS_IMPERSONATE: "users.impersonate",

  // === AUTHENTICATION & SECURITY ===
  AUTH_MANAGE_SESSIONS: "auth.manageSessions",
  AUTH_VIEW_AUDIT_LOGS: "auth.viewAuditLogs",
  AUTH_SECURITY_SETTINGS: "auth.securitySettings",
  AUTH_TWO_FACTOR: "auth.twoFactor",
  AUTH_API_KEYS: "auth.apiKeys",

  // === MATERIALS MANAGEMENT ===
  MATERIALS_CREATE: "materials.create",
  MATERIALS_READ: "materials.read",
  MATERIALS_UPDATE: "materials.update",
  MATERIALS_DELETE: "materials.delete",
  MATERIALS_IMPORT: "materials.import",
  MATERIALS_EXPORT: "materials.export",
  MATERIALS_BULK_OPERATIONS: "materials.bulkOperations",
  MATERIALS_VIEW_COSTS: "materials.viewCosts",
  MATERIALS_MANAGE_CATEGORIES: "materials.manageCategories",

  // === INVENTORY & STOCK MANAGEMENT ===
  STOCK_CREATE: "stock.create",
  STOCK_READ: "stock.read",
  STOCK_UPDATE: "stock.update",
  STOCK_DELETE: "stock.delete",
  STOCK_ADJUST: "stock.adjust",
  STOCK_TRANSFER: "stock.transfer",
  STOCK_WASTE_RECORD: "stock.wasteRecord",
  STOCK_VIEW_COSTS: "stock.viewCosts",
  STOCK_BULK_OPERATIONS: "stock.bulkOperations",
  STOCK_ALERTS: "stock.alerts",
  STOCK_FORECASTING: "stock.forecasting",

  // === SALES & TRANSACTIONS ===
  SALES_CREATE: "sales.create",
  SALES_READ: "sales.read",
  SALES_UPDATE: "sales.update",
  SALES_DELETE: "sales.delete",
  SALES_REVERT: "sales.revert",
  SALES_REFUND: "sales.refund",
  SALES_VIEW_PROFITS: "sales.viewProfits",
  SALES_DISCOUNT: "sales.discount",
  SALES_VOID: "sales.void",
  SALES_EXPORT: "sales.export",

  // === ORDERS MANAGEMENT ===
  ORDERS_CREATE: "orders.create",
  ORDERS_READ: "orders.read",
  ORDERS_UPDATE: "orders.update",
  ORDERS_DELETE: "orders.delete",
  ORDERS_VOID: "orders.void",
  ORDERS_COMPLETE: "orders.complete",
  ORDERS_CANCEL: "orders.cancel",
  ORDERS_VIEW_ALL: "orders.viewAll",
  ORDERS_MANAGE_QUEUE: "orders.manageQueue",

  // === POS SYSTEM ===
  POS_ACCESS: "pos.access",
  POS_CASH_DRAWER: "pos.cashDrawer",
  POS_RECEIPTS: "pos.receipts",
  POS_PAYMENTS: "pos.payments",
  POS_TABLES: "pos.tables",
  POS_KITCHEN_DISPLAY: "pos.kitchenDisplay",
  POS_CUSTOMER_DISPLAY: "pos.customerDisplay",

  // === MENU MANAGEMENT ===
  MENU_ITEMS_CREATE: "menuItems.create",
  MENU_ITEMS_READ: "menuItems.read",
  MENU_ITEMS_UPDATE: "menuItems.update",
  MENU_ITEMS_DELETE: "menuItems.delete",
  MENU_ITEMS_PRICING: "menuItems.pricing",
  MENU_ITEMS_CATEGORIES: "menuItems.categories",
  MENU_ITEMS_RECIPES: "menuItems.recipes",
  MENU_ITEMS_NUTRITIONAL: "menuItems.nutritional",
  MENU_ITEMS_AVAILABILITY: "menuItems.availability",

  // === SECTIONS & ASSIGNMENTS ===
  SECTIONS_CREATE: "sections.create",
  SECTIONS_READ: "sections.read",
  SECTIONS_UPDATE: "sections.update",
  SECTIONS_DELETE: "sections.delete",
  ASSIGNMENTS_CREATE: "assignments.create",
  ASSIGNMENTS_READ: "assignments.read",
  ASSIGNMENTS_UPDATE: "assignments.update",
  ASSIGNMENTS_DELETE: "assignments.delete",
  ASSIGNMENTS_BULK: "assignments.bulk",

  // === DAILY OPERATIONS ===
  DAY_OPERATIONS_CREATE: "dayOperations.create",
  DAY_OPERATIONS_READ: "dayOperations.read",
  DAY_OPERATIONS_UPDATE: "dayOperations.update",
  DAY_OPERATIONS_DELETE: "dayOperations.delete",
  DAY_OPERATIONS_CLOSE: "dayOperations.close",
  DAY_OPERATIONS_REOPEN: "dayOperations.reopen",
  DAY_OPERATIONS_CASH_COUNT: "dayOperations.cashCount",

  // === REPORTS & ANALYTICS ===
  REPORTS_READ: "reports.read",
  REPORTS_SALES: "reports.sales",
  REPORTS_INVENTORY: "reports.inventory",
  REPORTS_FINANCIAL: "reports.financial",
  REPORTS_WASTE: "reports.waste",
  REPORTS_STAFF: "reports.staff",
  REPORTS_CUSTOMER: "reports.customer",
  REPORTS_EXPORT: "reports.export",
  REPORTS_SCHEDULE: "reports.schedule",
  ANALYTICS_DASHBOARD: "analytics.dashboard",
  ANALYTICS_TRENDS: "analytics.trends",
  ANALYTICS_FORECASTING: "analytics.forecasting",
  ANALYTICS_PROFITABILITY: "analytics.profitability",

  // === FINANCIAL MANAGEMENT ===
  FINANCE_VIEW_COSTS: "finance.viewCosts",
  FINANCE_VIEW_PROFITS: "finance.viewProfits",
  FINANCE_PRICING: "finance.pricing",
  FINANCE_BUDGETS: "finance.budgets",
  FINANCE_EXPENSES: "finance.expenses",
  FINANCE_TAX_REPORTS: "finance.taxReports",

  // === CUSTOMER MANAGEMENT ===
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",
  CUSTOMERS_LOYALTY: "customers.loyalty",
  CUSTOMERS_FEEDBACK: "customers.feedback",

  // === EMPLOYEE MANAGEMENT ===
  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_READ: "employee.read",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_DELETE: "employee.delete",
  EMPLOYEE_VIEW_SALARY: "employee.viewSalary",
  EMPLOYEE_MANAGE_SALARY: "employee.manageSalary",
  EMPLOYEE_USAGE_RECORD: "employee.usageRecord",
  EMPLOYEE_USAGE_VIEW: "employee.usageView",
  EMPLOYEE_SETTLEMENT_CREATE: "employee.settlementCreate",
  EMPLOYEE_SETTLEMENT_APPROVE: "employee.settlementApprove",
  EMPLOYEE_SETTLEMENT_PROCESS: "employee.settlementProcess",
  EMPLOYEE_SETTLEMENT_VIEW: "employee.settlementView",

  // === SUPPLIERS & PROCUREMENT ===
  SUPPLIERS_CREATE: "suppliers.create",
  SUPPLIERS_READ: "suppliers.read",
  SUPPLIERS_UPDATE: "suppliers.update",
  SUPPLIERS_DELETE: "suppliers.delete",
  PROCUREMENT_ORDERS: "procurement.orders",
  PROCUREMENT_RECEIVING: "procurement.receiving",

  // === SYSTEM ADMINISTRATION ===
  SYSTEM_SETTINGS: "system.settings",
  SYSTEM_BACKUP: "system.backup",
  SYSTEM_RESTORE: "system.restore",
  SYSTEM_MAINTENANCE: "system.maintenance",
  SYSTEM_LOGS: "system.logs",
  SYSTEM_INTEGRATIONS: "system.integrations",
  SYSTEM_DATABASE: "system.database",
  SYSTEM_NOTIFICATIONS: "system.notifications",

  // === COMPLIANCE & AUDIT ===
  COMPLIANCE_FOOD_SAFETY: "compliance.foodSafety",
  COMPLIANCE_HEALTH_DEPT: "compliance.healthDept",
  COMPLIANCE_TAX: "compliance.tax",
  AUDIT_TRAILS: "audit.trails",
  AUDIT_REPORTS: "audit.reports",

  // === COMMUNICATION ===
  COMMUNICATION_ANNOUNCEMENTS: "communication.announcements",
  COMMUNICATION_MESSAGES: "communication.messages",
  COMMUNICATION_NOTIFICATIONS: "communication.notifications",

  // === EMERGENCY & SPECIAL ===
  EMERGENCY_OVERRIDE: "emergency.override",
  EMERGENCY_SHUTDOWN: "emergency.shutdown",
  SPECIAL_FUNCTIONS: "special.functions"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Comprehensive Role-Based Permission System
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS), // Admin has all permissions

  manager: [
    // User Management (Limited)
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_VIEW_ACTIVITY,

    // Authentication & Security
    PERMISSIONS.AUTH_MANAGE_SESSIONS,
    PERMISSIONS.AUTH_VIEW_AUDIT_LOGS,

    // Materials Management
    PERMISSIONS.MATERIALS_CREATE,
    PERMISSIONS.MATERIALS_READ,
    PERMISSIONS.MATERIALS_UPDATE,
    PERMISSIONS.MATERIALS_VIEW_COSTS,
    PERMISSIONS.MATERIALS_MANAGE_CATEGORIES,

    // Inventory & Stock Management
    PERMISSIONS.STOCK_CREATE,
    PERMISSIONS.STOCK_READ,
    PERMISSIONS.STOCK_UPDATE,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.STOCK_WASTE_RECORD,
    PERMISSIONS.STOCK_VIEW_COSTS,
    PERMISSIONS.STOCK_ALERTS,

    // Sales & Transactions
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_UPDATE,
    PERMISSIONS.SALES_DELETE,
    PERMISSIONS.SALES_REVERT,
    PERMISSIONS.SALES_REFUND,
    PERMISSIONS.SALES_VIEW_PROFITS,
    PERMISSIONS.SALES_DISCOUNT,
    PERMISSIONS.SALES_VOID,
    PERMISSIONS.SALES_EXPORT,

    // Orders Management
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_VOID,
    PERMISSIONS.ORDERS_COMPLETE,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ORDERS_MANAGE_QUEUE,

    // POS System
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_CASH_DRAWER,
    PERMISSIONS.POS_RECEIPTS,
    PERMISSIONS.POS_PAYMENTS,
    PERMISSIONS.POS_TABLES,
    PERMISSIONS.POS_KITCHEN_DISPLAY,

    // Menu Management
    PERMISSIONS.MENU_ITEMS_CREATE,
    PERMISSIONS.MENU_ITEMS_READ,
    PERMISSIONS.MENU_ITEMS_UPDATE,
    PERMISSIONS.MENU_ITEMS_PRICING,
    PERMISSIONS.MENU_ITEMS_CATEGORIES,
    PERMISSIONS.MENU_ITEMS_RECIPES,
    PERMISSIONS.MENU_ITEMS_AVAILABILITY,

    // Sections & Assignments
    PERMISSIONS.SECTIONS_CREATE,
    PERMISSIONS.SECTIONS_READ,
    PERMISSIONS.SECTIONS_UPDATE,
    PERMISSIONS.ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_UPDATE,
    PERMISSIONS.ASSIGNMENTS_DELETE,
    PERMISSIONS.ASSIGNMENTS_BULK,

    // Daily Operations
    PERMISSIONS.DAY_OPERATIONS_CREATE,
    PERMISSIONS.DAY_OPERATIONS_READ,
    PERMISSIONS.DAY_OPERATIONS_UPDATE,
    PERMISSIONS.DAY_OPERATIONS_CLOSE,
    PERMISSIONS.DAY_OPERATIONS_CASH_COUNT,

    // Reports & Analytics
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_INVENTORY,
    PERMISSIONS.REPORTS_FINANCIAL,
    PERMISSIONS.REPORTS_WASTE,
    PERMISSIONS.REPORTS_STAFF,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_DASHBOARD,
    PERMISSIONS.ANALYTICS_TRENDS,
    PERMISSIONS.ANALYTICS_PROFITABILITY,

    // Financial Management (Limited)
    PERMISSIONS.FINANCE_VIEW_COSTS,
    PERMISSIONS.FINANCE_VIEW_PROFITS,
    PERMISSIONS.FINANCE_PRICING,

    // Customer Management
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_LOYALTY,
    PERMISSIONS.CUSTOMERS_FEEDBACK
  ],

  staff: [
    // Basic Material Access
    PERMISSIONS.MATERIALS_READ,

    // Basic Stock Operations
    PERMISSIONS.STOCK_CREATE,
    PERMISSIONS.STOCK_READ,
    PERMISSIONS.STOCK_WASTE_RECORD,

    // Basic Sales Operations
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_READ,

    // Basic Order Operations
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,

    // POS System Access
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_RECEIPTS,
    PERMISSIONS.POS_PAYMENTS,
    PERMISSIONS.POS_TABLES,

    // Menu Reading
    PERMISSIONS.MENU_ITEMS_READ,

    // Basic Section Access
    PERMISSIONS.SECTIONS_READ,
    PERMISSIONS.ASSIGNMENTS_READ,

    // Basic Daily Operations
    PERMISSIONS.DAY_OPERATIONS_READ,

    // Basic Customer Service
    PERMISSIONS.CUSTOMERS_READ
  ]
} as const;

export const PERMISSION_GROUPS = {
  "User Management": {
    icon: Users,
    color: "text-blue-600",
    description: "Manage user accounts, roles, and access control",
    permissions: [PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_RESET_PASSWORD, PERMISSIONS.USERS_UNLOCK, PERMISSIONS.USERS_MANAGE_PERMISSIONS, PERMISSIONS.USERS_VIEW_ACTIVITY, PERMISSIONS.USERS_IMPERSONATE]
  },
  "Authentication & Security": {
    icon: Lock,
    color: "text-red-600",
    description: "Security settings, sessions, and audit logs",
    permissions: [PERMISSIONS.AUTH_MANAGE_SESSIONS, PERMISSIONS.AUTH_VIEW_AUDIT_LOGS, PERMISSIONS.AUTH_SECURITY_SETTINGS, PERMISSIONS.AUTH_TWO_FACTOR, PERMISSIONS.AUTH_API_KEYS]
  },
  "Materials Management": {
    icon: Package,
    color: "text-green-600",
    description: "Manage materials, categories, and costs",
    permissions: [PERMISSIONS.MATERIALS_CREATE, PERMISSIONS.MATERIALS_READ, PERMISSIONS.MATERIALS_UPDATE, PERMISSIONS.MATERIALS_DELETE, PERMISSIONS.MATERIALS_IMPORT, PERMISSIONS.MATERIALS_EXPORT, PERMISSIONS.MATERIALS_BULK_OPERATIONS, PERMISSIONS.MATERIALS_VIEW_COSTS, PERMISSIONS.MATERIALS_MANAGE_CATEGORIES]
  },
  "Inventory & Stock": {
    icon: ShoppingCart,
    color: "text-purple-600",
    description: "Stock management, transfers, and waste tracking",
    permissions: [PERMISSIONS.STOCK_CREATE, PERMISSIONS.STOCK_READ, PERMISSIONS.STOCK_UPDATE, PERMISSIONS.STOCK_DELETE, PERMISSIONS.STOCK_ADJUST, PERMISSIONS.STOCK_TRANSFER, PERMISSIONS.STOCK_WASTE_RECORD, PERMISSIONS.STOCK_VIEW_COSTS, PERMISSIONS.STOCK_BULK_OPERATIONS, PERMISSIONS.STOCK_ALERTS, PERMISSIONS.STOCK_FORECASTING]
  },
  "Sales & Transactions": {
    icon: Receipt,
    color: "text-orange-600",
    description: "Sales operations, refunds, and transaction management",
    permissions: [PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_READ, PERMISSIONS.SALES_UPDATE, PERMISSIONS.SALES_DELETE, PERMISSIONS.SALES_REVERT, PERMISSIONS.SALES_REFUND, PERMISSIONS.SALES_VIEW_PROFITS, PERMISSIONS.SALES_DISCOUNT, PERMISSIONS.SALES_VOID, PERMISSIONS.SALES_EXPORT]
  },
  "Orders Management": {
    icon: ClipboardList,
    color: "text-indigo-600",
    description: "Order processing, queue management, and fulfillment",
    permissions: [PERMISSIONS.ORDERS_CREATE, PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_DELETE, PERMISSIONS.ORDERS_VOID, PERMISSIONS.ORDERS_COMPLETE, PERMISSIONS.ORDERS_CANCEL, PERMISSIONS.ORDERS_VIEW_ALL, PERMISSIONS.ORDERS_MANAGE_QUEUE]
  },
  "POS System": {
    icon: Monitor,
    color: "text-cyan-600",
    description: "Point of sale operations and hardware control",
    permissions: [PERMISSIONS.POS_ACCESS, PERMISSIONS.POS_CASH_DRAWER, PERMISSIONS.POS_RECEIPTS, PERMISSIONS.POS_PAYMENTS, PERMISSIONS.POS_TABLES, PERMISSIONS.POS_KITCHEN_DISPLAY, PERMISSIONS.POS_CUSTOMER_DISPLAY]
  },
  "Menu Management": {
    icon: Utensils,
    color: "text-pink-600",
    description: "Menu items, pricing, recipes, and availability",
    permissions: [PERMISSIONS.MENU_ITEMS_CREATE, PERMISSIONS.MENU_ITEMS_READ, PERMISSIONS.MENU_ITEMS_UPDATE, PERMISSIONS.MENU_ITEMS_DELETE, PERMISSIONS.MENU_ITEMS_PRICING, PERMISSIONS.MENU_ITEMS_CATEGORIES, PERMISSIONS.MENU_ITEMS_RECIPES, PERMISSIONS.MENU_ITEMS_NUTRITIONAL, PERMISSIONS.MENU_ITEMS_AVAILABILITY]
  },
  "Reports & Analytics": {
    icon: BarChart3,
    color: "text-emerald-600",
    description: "Business intelligence and data analysis",
    permissions: [PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_SALES, PERMISSIONS.REPORTS_INVENTORY, PERMISSIONS.REPORTS_FINANCIAL, PERMISSIONS.REPORTS_WASTE, PERMISSIONS.REPORTS_STAFF, PERMISSIONS.REPORTS_CUSTOMER, PERMISSIONS.REPORTS_EXPORT, PERMISSIONS.REPORTS_SCHEDULE, PERMISSIONS.ANALYTICS_DASHBOARD, PERMISSIONS.ANALYTICS_TRENDS, PERMISSIONS.ANALYTICS_FORECASTING, PERMISSIONS.ANALYTICS_PROFITABILITY]
  },
  "Financial Management": {
    icon: DollarSign,
    color: "text-yellow-600",
    description: "Financial controls, budgets, and cost management",
    permissions: [PERMISSIONS.FINANCE_VIEW_COSTS, PERMISSIONS.FINANCE_VIEW_PROFITS, PERMISSIONS.FINANCE_PRICING, PERMISSIONS.FINANCE_BUDGETS, PERMISSIONS.FINANCE_EXPENSES, PERMISSIONS.FINANCE_TAX_REPORTS]
  },
  "System Administration": {
    icon: Settings,
    color: "text-gray-600",
    description: "System settings, maintenance, and integrations",
    permissions: [PERMISSIONS.SYSTEM_SETTINGS, PERMISSIONS.SYSTEM_BACKUP, PERMISSIONS.SYSTEM_RESTORE, PERMISSIONS.SYSTEM_MAINTENANCE, PERMISSIONS.SYSTEM_LOGS, PERMISSIONS.SYSTEM_INTEGRATIONS, PERMISSIONS.SYSTEM_DATABASE, PERMISSIONS.SYSTEM_NOTIFICATIONS]
  }
};
