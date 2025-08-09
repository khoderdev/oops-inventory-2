import api from "@/lib/http";
import { NegativeStockReport, RevertSaleResponse, SaleRecord, SaleResponse } from "@/types/inventory";

export const salesAPI = {
  getSales: () => api.get<SaleRecord[]>("/sales"),
  getSale: (id: string) => api.get<SaleRecord>(`/sales/${id}`),
  createSale: (saleData: SaleRecord) => api.post<SaleResponse, SaleRecord>("/sales", saleData),
  updateSale: (id: string, saleData: SaleRecord) => api.put<SaleRecord, SaleRecord>(`/sales/${id}`, saleData),
  deleteSale: (id: string) => api.delete<null>(`/sales/${id}`),
  revertSale: (id: string) => api.post<RevertSaleResponse, Record<string, never>>(`/sales/${id}/revert`, {}),
  softDeleteSale: (id: string) => api.post<{ message: string; saleId: string; action: string; note: string }, Record<string, never>>(`/sales/${id}/soft-delete`, {}),
  getNegativeStockReport: () => api.get<NegativeStockReport>("/sales/negative-stock-report")
};
