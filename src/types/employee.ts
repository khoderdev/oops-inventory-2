export type EmployeeDepartment = "kitchen" | "service" | "management" | "cleaning" | "security" | "other";

export type EmployeeUsageType = "material" | "menu_item" | "stock_entry";

export type SettlementStatus = "pending" | "approved" | "paid" | "disputed" | "cancelled";

export type PaymentMethod = "bank_transfer" | "cash" | "check" | "mobile_payment" | "other";

export interface Employee {
  id: number;
  userId?: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeNumber: string;
  department: EmployeeDepartment;
  position: string;
  baseSalary: number;
  discountPercentage: number;
  hireDate: string;
  terminationDate?: string | null;
  isActive: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
    address?: string;
  } | null;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
    accountHolderName?: string;
  } | null;
  notes?: string | null;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;

  // Associated data
  user?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastLogin?: string;
  };
  usages?: EmployeeUsage[];
  settlements?: EmployeeSettlement[];
}

// Employee Usage Interface
export interface EmployeeUsage {
  id: number;
  employeeId: number;
  usageType: EmployeeUsageType;
  materialId?: number | null;
  menuItemId?: number | null;
  stockEntryId?: number | null;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  discountApplied: number;
  discountAmount: number;
  finalCost: number;
  usageDate: string;
  usageMonth: number;
  usageYear: number;
  posTransactionId?: string | null;
  recordedBy: number;
  isSettled: boolean;
  settlementId?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;

  // Associated data
  employee?: Employee;
  material?: {
    id: number;
    name: string;
    category: string;
    baseUnit?: string;
  };
  menuItem?: {
    id: number;
    name: string;
    category: string;
    description?: string;
  };
  stockEntry?: {
    id: number;
    supplier: string;
    purchaseDate?: string;
  };
  recorder?: {
    firstName: string;
    lastName: string;
    username: string;
  };
  order?: {
    id: number | null;
    orderNumber: string | null;
    status: string | null;
    orderType: string | null;
    total: string | number | null;
  } | null;
  settlement?: EmployeeSettlement;
}

// Employee Settlement Interface
export interface EmployeeSettlement {
  id: number;
  employeeId: number;
  settlementMonth: number;
  settlementYear: number;
  baseSalary: number;
  totalUsageCost: number;
  totalDiscountAmount: number;
  totalDeduction: number;
  bonusAmount: number;
  penaltyAmount: number;
  finalSalary: number;
  usageItemsCount: number;
  settlementDate: string;
  paymentDate?: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentReference?: string | null;
  status: SettlementStatus;
  approvedBy?: number | null;
  approvedAt?: string | null;
  processedBy: number;
  notes?: string | null;
  settlementData?: {
    usageBreakdown: Array<{
      id: number;
      usageType: EmployeeUsageType;
      itemName: string;
      quantity: number;
      unit: string;
      unitCost: number;
      totalCost: number;
      discountApplied: number;
      finalCost: number;
      usageDate: string;
    }>;
    calculationDetails: {
      baseSalary: number;
      totalUsageCost: number;
      discountPercentage: number;
      totalDiscountAmount: number;
      netDeduction: number;
      bonusAmount: number;
      penaltyAmount: number;
    };
  } | null;
  createdAt: string;
  updatedAt: string;

  // Associated data
  employee?: Employee;
  processor?: {
    firstName: string;
    lastName: string;
    username: string;
  };
  approver?: {
    firstName: string;
    lastName: string;
    username: string;
  };
  usageItems?: EmployeeUsage[];
}

// Form Data Interfaces
export interface CreateEmployeeData {
  userId?: number; // Now optional - employees can exist without user accounts
  firstName: string; // Employee's own first name
  lastName: string; // Employee's own last name
  email: string; // Employee's own email
  phone: string; // Employee's own phone number
  employeeNumber?: string;
  department: EmployeeDepartment;
  position: string;
  baseSalary: number;
  discountPercentage?: number;
  hireDate: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
    address?: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
    accountHolderName?: string;
  };
  notes?: string;
}

export interface UpdateEmployeeData {
  firstName?: string; // Employee's own first name
  lastName?: string; // Employee's own last name
  email?: string; // Employee's own email
  phone?: string; // Employee's own phone number
  employeeNumber?: string;
  department?: EmployeeDepartment;
  position?: string;
  baseSalary?: number;
  discountPercentage?: number;
  hireDate?: string;
  terminationDate?: string | null;
  isActive?: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
    address?: string;
  } | null;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
    accountHolderName?: string;
  } | null;
  notes?: string;
}

export interface RecordUsageData {
  employeeId: number;
  usageType: EmployeeUsageType;
  materialId?: number;
  menuItemId?: number;
  stockEntryId?: number;
  quantity: number;
  unit: string;
  unitCost: number;
  posTransactionId?: string;
  notes?: string;
}

export interface CreateSettlementData {
  employeeId: number;
  settlementMonth: number;
  settlementYear: number;
  bonusAmount?: number;
  penaltyAmount?: number;
  notes?: string;
}

export interface UpdateSettlementData {
  bonusAmount?: number;
  penaltyAmount?: number;
  notes?: string;
  status?: SettlementStatus;
  totalUsageCost?: number;
  totalDiscountAmount?: number;
  totalDeduction?: number;
  finalSalary?: number;
  settlementData?: SettlementPreview;
}

export interface MarkAsPaidData {
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}

// Response Interfaces
export interface EmployeeResponse {
  success: boolean;
  data: Employee;
  message: string;
}

export interface EmployeesResponse {
  success: boolean;
  data: {
    employees: Employee[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  message: string;
}

export interface EmployeeUsageResponse {
  success: boolean;
  data: EmployeeUsage;
  message: string;
}

export interface EmployeeUsagesResponse {
  success: boolean;
  data: {
    usages: EmployeeUsage[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  message: string;
}

export interface EmployeeSettlementResponse {
  success: boolean;
  data: EmployeeSettlement;
  message: string;
}

export interface EmployeeSettlementsResponse {
  success: boolean;
  data: {
    settlements: EmployeeSettlement[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  message: string;
}

export interface MonthlyUsageSummary {
  employee: {
    id: number;
    name: string;
    employeeNumber: string;
    department: EmployeeDepartment;
    baseSalary: number;
    discountPercentage: number;
  };
  period: {
    month: number;
    year: number;
    monthName: string;
  };
  totals: {
    totalUsageCost: number;
    totalDiscountAmount: number;
    totalFinalCost: number;
    usageCount: number;
  };
  usagesByType: {
    material: EmployeeUsage[];
    menu_item: EmployeeUsage[];
    stock_entry: EmployeeUsage[];
  };
  usages: EmployeeUsage[];
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentBreakdown: {
    kitchen: number;
    service: number;
    management: number;
    other: number;
  };
  monthlyUsages: number;
  pendingSettlements: number;
}

export interface UsageStats {
  byType: Array<{
    usageType: EmployeeUsageType;
    count: number;
    totalCost: number;
    finalCost: number;
    avgDiscount: number;
  }>;
  totals: {
    totalCount: number;
    totalCost: number;
    totalFinalCost: number;
    totalDiscountAmount: number;
  };
}

export interface SettlementStats {
  byStatus: Array<{
    status: SettlementStatus;
    count: number;
    totalBaseSalary: number;
    totalDeductions: number;
    totalFinalSalary: number;
  }>;
  totals: {
    totalCount: number;
    totalBaseSalary: number;
    totalDeductions: number;
    totalFinalSalary: number;
    avgFinalSalary: number;
  };
}

export interface SettlementPreview {
  employee: {
    id: number;
    name: string;
    employeeNumber: string;
    department: EmployeeDepartment;
    discountPercentage: number;
  };
  period: {
    month: number;
    year: number;
    monthName: string;
  };
  calculation: {
    baseSalary: number;
    totalUsageCost: number;
    totalDiscountAmount: number;
    totalDeduction: number;
    bonusAmount: number;
    penaltyAmount: number;
    finalSalary: number;
    usageItemsCount: number;
  };
  usages: Array<{
    id: number;
    usageType: EmployeeUsageType;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    discountApplied: number;
    finalCost: number;
    usageDate: string;
  }>;
  usageBreakdown?: Array<{
    id: number;
    usageType: EmployeeUsageType;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    discountApplied: number;
    finalCost: number;
    usageDate: string;
  }>;
  calculationDetails?: {
    baseSalary: number;
    totalUsageCost: number;
    discountPercentage: number;
    totalDiscountAmount: number;
    netDeduction: number;
    bonusAmount: number;
    penaltyAmount: number;
  };
}

// Query Parameters
export interface EmployeeFilters {
  department?: EmployeeDepartment;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UsageFilters {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  usageType?: EmployeeUsageType;
  isSettled?: boolean;
  settlementId?: number;
  page?: number;
  limit?: number;
}

export interface SettlementFilters {
  employeeId?: number;
  month?: number;
  year?: number;
  status?: SettlementStatus;
  page?: number;
  limit?: number;
}

// Component Props Interfaces
export interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: CreateEmployeeData | UpdateEmployeeData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  availableUsers?: Array<{
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
}

export interface UsageFormProps {
  usage?: EmployeeUsage;
  onSubmit: (data: RecordUsageData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  employees?: Employee[];
  materials?: Array<{
    id: number;
    name: string;
    category: string;
    baseUnit: string;
    costPerUnit: number;
  }>;
  menuItems?: Array<{
    id: number;
    name: string;
    category: string;
    price: number;
  }>;
}

export interface SettlementFormProps {
  settlement?: EmployeeSettlement;
  onSubmit: (data: CreateSettlementData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  employees?: Employee[];
  preview?: SettlementPreview;
  onPreview?: (data: CreateSettlementData) => void;
}

export interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: number) => void;
  onViewUsage: (employeeId: number) => void;
  onViewSettlements: (employeeId: number) => void;
  isLoading?: boolean;
}

export interface UsageTableProps {
  usages: EmployeeUsage[];
  onEdit: (usage: EmployeeUsage) => void;
  onDelete: (usageId: number) => void;
  isLoading?: boolean;
  showEmployee?: boolean;
}

export interface SettlementTableProps {
  settlements: EmployeeSettlement[];
  onView: (settlement: EmployeeSettlement) => void;
  onApprove: (settlementId: number) => void;
  onMarkAsPaid: (settlementId: number, data: MarkAsPaidData) => void;
  onEdit: (settlement: EmployeeSettlement) => void;
  isLoading?: boolean;
  showEmployee?: boolean;
}

// POS Integration Types
export interface POSEmployeeUsageData {
  employeeId: number;
  items: Array<{
    type: EmployeeUsageType;
    itemId: number;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }>;
  posTransactionId: string;
  notes?: string;
}
