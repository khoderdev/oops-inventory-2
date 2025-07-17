import api from "@/lib/http";
import { SaleRecord } from "@/types/inventory";

export const salesAPI = {
  getSales: () => api.get<SaleRecord[]>("/sales"),
  getSale: (id: string) => api.get<SaleRecord>(`/sales/${id}`),
  createSale: (saleData: SaleRecord) => api.post<SaleRecord, SaleRecord>("/sales", saleData),
  updateSale: (id: string, saleData: SaleRecord) => api.put<SaleRecord, SaleRecord>(`/sales/${id}`, saleData),
  deleteSale: (id: string) => api.delete<null>(`/sales/${id}`)
};
