import api from "@/lib/http";
import { SaleRecord, NegativeStockReport, SaleResponse } from "@/types/inventory";

export const salesAPI = {
  getSales: () => api.get<SaleRecord[]>("/sales"),
  getSale: (id: string) => api.get<SaleRecord>(`/sales/${id}`),
  createSale: (saleData: SaleRecord) => api.post<SaleResponse, SaleRecord>("/sales", saleData),
  updateSale: (id: string, saleData: SaleRecord) => api.put<SaleRecord, SaleRecord>(`/sales/${id}`, saleData),
  deleteSale: (id: string) => api.delete<null>(`/sales/${id}`),
  getNegativeStockReport: () => api.get<NegativeStockReport>("/sales/negative-stock-report")
};
