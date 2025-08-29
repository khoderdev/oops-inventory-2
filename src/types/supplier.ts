export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms: number;
  accountBalance: number;
  creditLimit: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierSettlement {
  id: number;
  supplierId: number;
  supplier: Supplier;
  amount: number;
  paymentMethod: "cash";
  referenceNumber?: string;
  paymentDate: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  notes?: string;
  settledBy?: number;
  processedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoice {
  id: number;
  supplierId: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: "draft" | "sent" | "overdue" | "partial" | "paid" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: number;
  creditLimit?: number;
  notes?: string;
}

export interface UpdateSupplierData extends Omit<CreateSupplierData, 'id'> {
  id: number;
  isActive?: boolean;
  paymentTerms?: number;
  creditLimit?: number;
  notes?: string;
}

export interface CreateSettlementData {
  amount: number;
  paymentMethod: "cash";
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
  invoiceIds?: number[];
}

export interface BulkUpdateStatusData {
  ids: number[];
  isActive: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

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
  meta: {
    requestTime: string;
    totalDataSize: number;
  };
}

export interface SuppliersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
  accountBalance_from?: string;
  accountBalance_to?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  fields?: string;
  _t?: number; // Cache-busting timestamp
}

export interface SettlementsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  _t?: number;
}
