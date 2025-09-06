import z from "zod";
import { StockEntry } from "./inventory";

// Types for supplier data
export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  website?: string;
  taxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  notes?: string;
  isActive?: boolean;
  website?: string;
  taxId?: string;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {}

// Types for supplier payment data
export interface SupplierPayment {
  notes: string;
  id: number;
  supplierId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  status: string;
  attachmentUrl?: string;
  stockEntryIds?: number[];
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: number;
    name: string;
  };
}

export interface CreateSupplierPaymentData {
  supplierId: number;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  description?: string;
  status?: string;
  attachmentUrl?: string;
  stockEntryIds?: number[];
}

export interface UpdateSupplierPaymentData extends Partial<CreateSupplierPaymentData> {}

// Types for paginated responses
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
  };
  filters: Record<string, any>;
  meta?: {
    requestTime: string;
    totalDataSize: number;
  };
}

// Query parameters for suppliers
export interface SuppliersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  name?: string;
  isActive?: boolean | string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  fields?: string;
  createdAt_from?: string;
  createdAt_to?: string;
  _t?: number; // Cache-busting timestamp
}

// Query parameters for supplier payments
export interface SupplierPaymentsQueryParams {
  page?: number;
  limit?: number;
  supplierId?: number | string;
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number | string;
  maxAmount?: number | string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  _t?: number; // Cache-busting timestamp
}

// Payment statistics response
export interface SupplierPaymentStats {
  supplierId: number;
  supplierName: string;
  totalPayments: number;
  totalPaid: number;
  totalDue: number;
  lastPaymentDate?: string;
  paymentCountByStatus: Array<{
    status: string;
    count: number;
    total: number;
  }>;
  paymentCountByMethod: Array<{
    paymentMethod: string;
    count: number;
    total: number;
  }>;
  recentPayments: SupplierPayment[];
}

export interface PaymentsTableProps {
  supplierId: number | string;
  payments: SupplierPayment[];
  loading?: boolean;
  onEdit?: (payment: SupplierPayment) => void;
  onDelete?: (payment: SupplierPayment) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
}

// Form validation schema
export const supplierFormSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true)
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export interface SupplierFormProps {
  supplier?: Supplier;
  onSuccess?: (supplier: Supplier) => void;
  onCancel?: () => void;
}

export interface SuppliersTableProps {
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
  onView?: (supplier: Supplier) => void;
  onAdd?: () => void;
}

export const paymentFormSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.date(),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Check", "Credit Card", "Other"]),
  status: z.enum(["Completed", "Pending", "Failed", "Refunded"]),
  referenceNumber: z.string().optional(),
  description: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export interface PaymentFormProps {
  supplierId: string | number;
  payment?: SupplierPayment;
  stockEntries?: StockEntry[];
  stockEntriesLoading?: boolean;
  onSuccess?: (payment: SupplierPayment) => void;
  onCancel?: () => void;
}

export interface SupplierDetailProps {
  supplier: Supplier;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface PaymentDetailProps {
  payment: SupplierPayment;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface PaymentTableProps {
  supplierId: number | string;
  payments: SupplierPayment[];
  loading?: boolean;
  onEdit?: (payment: SupplierPayment) => void;
  onDelete?: (payment: SupplierPayment) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
}

export interface PaymentStatsProps {
  supplierId: number | string;
  payments: SupplierPayment[];
  loading?: boolean;
  onEdit?: (payment: SupplierPayment) => void;
  onDelete?: (payment: SupplierPayment) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
}

export type Item = {
  id: string;
  label: string;
};