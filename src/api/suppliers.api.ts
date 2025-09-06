import api from "@/lib/http";
import { StockEntry } from "@/types/inventory";
import { SuppliersQueryParams, Supplier, CreateSupplierData, UpdateSupplierData, SupplierPaymentsQueryParams, SupplierPayment, CreateSupplierPaymentData, UpdateSupplierPaymentData, SupplierPaymentStats, PaginatedResponse } from "@/types/suppliers";

export const suppliersAPI = {
  getSuppliers: async (params?: SuppliersQueryParams): Promise<Supplier[]> => {
    const config = params ? ({ params: { ...params, _t: Date.now() } } as any) : { params: { _t: Date.now() } };
    const response = await api.get<PaginatedResponse<Supplier>>("/suppliers", config);
    return response.data.data;
  },

  getSuppliersPaginated: async (params?: SuppliersQueryParams) => {
    const config = params ? ({ params: { ...params, _t: Date.now() } } as any) : { params: { _t: Date.now() } };
    return api.get<PaginatedResponse<Supplier>>("/suppliers", config);
  },

  getAllSuppliers: async (): Promise<Supplier[]> => {
    const response = await api.get<PaginatedResponse<Supplier>>("/suppliers", {
      params: { limit: 1000, _t: Date.now() } as any
    } as any);
    return response.data.data;
  },

  getActiveSuppliers: async (): Promise<Supplier[]> => {
    const response = await api.get<PaginatedResponse<Supplier>>("/suppliers", {
      params: { isActive: true, limit: 1000, _t: Date.now() } as any
    } as any);
    return response.data.data;
  },

  getSupplier: (id: number | string) => api.get<Supplier>(`/suppliers/${id}`),

  createSupplier: (supplierData: CreateSupplierData) => api.post<Supplier, CreateSupplierData>("/suppliers", supplierData),

  updateSupplier: (id: number | string, supplierData: UpdateSupplierData) => api.put<Supplier, UpdateSupplierData>(`/suppliers/${id}`, supplierData),

  deleteSupplier: (id: number | string) => api.delete<null>(`/suppliers/${id}`),

  toggleSupplierStatus: (id: number | string) => api.patch<{ id: number; name: string; isActive: boolean; message: string }, {}>(`/suppliers/${id}/toggle-status`, {}),

  getSupplierPayments: async (params?: SupplierPaymentsQueryParams): Promise<SupplierPayment[]> => {
    const config = params ? ({ params: { ...params, _t: Date.now() } } as any) : { params: { _t: Date.now() } };
    const response = await api.get<PaginatedResponse<SupplierPayment>>("/suppliers/payments/all", config);
    return response.data.data;
  },

  getSupplierPaymentsPaginated: async (params?: SupplierPaymentsQueryParams) => {
    const config = params ? ({ params: { ...params, _t: Date.now() } } as any) : { params: { _t: Date.now() } };
    return api.get<PaginatedResponse<SupplierPayment>>("/suppliers/payments/all", config);
  },

  getSupplierPayment: (id: number | string) => api.get<SupplierPayment>(`/suppliers/payments/${id}`),

  createSupplierPayment: (paymentData: CreateSupplierPaymentData) => api.post<SupplierPayment, CreateSupplierPaymentData>("/suppliers/payments", paymentData),

  updateSupplierPayment: (id: number | string, paymentData: UpdateSupplierPaymentData) => api.put<SupplierPayment, UpdateSupplierPaymentData>(`/suppliers/payments/${id}`, paymentData),

  deleteSupplierPayment: (id: number | string) => api.delete<null>(`/suppliers/payments/${id}`),

  getSupplierPaymentStats: (supplierId: number | string) => api.get<SupplierPaymentStats>(`/suppliers/${supplierId}/payment-stats`),

  // NEW: Get supplier stock entries
  getSupplierStockEntries: async (supplierId: number | string): Promise<StockEntry[]> => {
    const response = await api.get<PaginatedResponse<StockEntry>>(`/suppliers/${supplierId}/stock-entries`, {
      params: { _t: Date.now() } as any
    } as any);
    return response.data.data;
  },

  // Optional: If you need paginated version for stock entries
  getSupplierStockEntriesPaginated: async (supplierId: number | string, params?: any) => {
    const config = params ? ({ params: { ...params, _t: Date.now() } } as any) : { params: { _t: Date.now() } };
    return api.get<PaginatedResponse<StockEntry>>(`/suppliers/${supplierId}/stock-entries`, config);
  }
};
