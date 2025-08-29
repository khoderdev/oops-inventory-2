import api from "@/lib/http";
import { Supplier, SupplierSettlement, SupplierInvoice, CreateSupplierData, UpdateSupplierData, CreateSettlementData, BulkUpdateStatusData, SuppliersQueryParams, SettlementsQueryParams, PaginatedResponse } from "@/types/supplier";

export const supplierAPI = {
  // Get all suppliers with pagination support
  getSuppliers: async (params?: SuppliersQueryParams): Promise<Supplier[]> => {
    const config = params ? ({ params } as any) : undefined;
    const response = await api.get<PaginatedResponse<Supplier>>("/suppliers", config);
    return response.data.data;
  },

  // Get paginated suppliers (returns full response with pagination info)
  getSuppliersPaginated: async (params?: SuppliersQueryParams) => {
    const config = params ? ({ params } as any) : undefined;
    return api.get<PaginatedResponse<Supplier>>("/suppliers", config);
  },

  // Get a single supplier by ID
  getSupplier: async (
    id: string | number,
    options?: {
      includeInvoices?: boolean;
      includeSettlements?: boolean;
    }
  ): Promise<Supplier> => {
    const params: any = {};
    if (options?.includeInvoices) params.includeInvoices = "true";
    if (options?.includeSettlements) params.includeSettlements = "true";

    const config = Object.keys(params).length > 0 ? { params } : undefined;
    const response = await api.get<Supplier>(`/suppliers/${id}`, config);
    return response.data;
  },

  // Create a new supplier
  createSupplier: (supplierData: CreateSupplierData) => api.post<Supplier, CreateSupplierData>("/suppliers", supplierData),

  // Update a supplier
  updateSupplier: (id: string | number, supplierData: UpdateSupplierData) => api.put<Supplier, UpdateSupplierData>(`/suppliers/${id}`, supplierData),

  // Delete a supplier
  deleteSupplier: (id: string | number) => api.delete<null>(`/suppliers/${id}`),

  // Create a settlement/payment for a supplier
  createSettlement: (supplierId: string | number, settlementData: CreateSettlementData) => api.post<SupplierSettlement, CreateSettlementData>(`/suppliers/${supplierId}/settlements`, settlementData),

  // Get settlements for a supplier
  getSettlements: async (supplierId: string | number, params?: SettlementsQueryParams): Promise<SupplierSettlement[]> => {
    const config = params ? ({ params } as any) : undefined;
    const response = await api.get<PaginatedResponse<SupplierSettlement>>(`/suppliers/${supplierId}/settlements`, config);
    return response.data.data;
  },

  // Get paginated settlements for a supplier
  getSettlementsPaginated: (supplierId: string | number, params?: SettlementsQueryParams) => {
    const config = params ? ({ params } as any) : undefined;
    return api.get<PaginatedResponse<SupplierSettlement>>(`/suppliers/${supplierId}/settlements`, config);
  },

  // Get outstanding invoices for a supplier
  getOutstandingInvoices: async (supplierId: string | number): Promise<SupplierInvoice[]> => {
    try {
      console.log(`[supplierAPI] Fetching outstanding invoices for supplier ${supplierId}`);
      const response = await api.get<SupplierInvoice[]>(`/suppliers/${supplierId}/invoices/outstanding`);
      console.log(`[supplierAPI] Successfully fetched ${response.data?.length || 0} invoices`);
      return response.data || [];
    } catch (error: any) {
      console.error(`[supplierAPI] Error fetching outstanding invoices for supplier ${supplierId}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error; // Re-throw to be handled by the query
    }
  },

  // Bulk update supplier status
  bulkUpdateSupplierStatus: (data: BulkUpdateStatusData) => api.patch<{ message: string }, BulkUpdateStatusData>("/suppliers/bulk/status", data),

  // Get supplier summary statistics (optional - you might want to add this endpoint)
  getSupplierSummary: async () => {
    const response = await api.get<{
      // Create a new supplier
      totalOutstanding(totalOutstanding: any): unknown;
      inactiveSuppliers: any;
      activeContracts: any;
      avgDaysToPay: any;
      totalSuppliers: number;
      activeSuppliers: number;
      totalOutstandingBalance: number;
      suppliersWithCredit: number;
    }>("/suppliers/summary");
    return response.data;
  }
};
