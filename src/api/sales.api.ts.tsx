import api from "@/lib/http";
import { NegativeStockReport, RevertSaleResponse, SaleRecord, SaleResponse } from "@/types/inventory";

export const salesAPI = {
  getSales: () => api.get<SaleRecord[]>("/sales"),
  getStaffSales: () => api.get<SaleRecord[]>("/sales/staff"),
  getSale: (id: string) => api.get<SaleRecord>(`/sales/${id}`),
  createSale: (saleData: SaleRecord) => api.post<SaleResponse, SaleRecord>("/sales", saleData),
  updateSale: (id: string, saleData: SaleRecord) => api.put<SaleRecord, SaleRecord>(`/sales/${id}`, saleData),
  deleteSale: (id: string) => api.delete<null>(`/sales/${id}`),
  deleteSaleItem: (saleId: string, itemId: string, itemType: 'material' | 'menu') => 
    api.delete<{message: string}>(`/sales/${saleId}/items/${itemId}`, { params: { type: itemType }}),
  revertSale: (id: string) => api.post<RevertSaleResponse, Record<string, never>>(`/sales/${id}/revert`, {}),
  softDeleteSale: (saleId: string, itemId?: string, itemType?: 'material' | 'menu') => {
    const url = itemId && itemType 
      ? `/sales/${saleId}/items/${itemId}?type=${itemType}`
      : `/sales/${saleId}`;
    return api.post<{ message: string; saleId: string; action: string; note: string }, Record<string, never>>(url, {});
  },
  getNegativeStockReport: () => api.get<NegativeStockReport>("/sales/negative-stock-report")
};
