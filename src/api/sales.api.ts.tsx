import api from "@/lib/http";
import { NegativeStockReport, SaleRecord, SaleResponse } from "@/types/inventory";

export interface StockRestorationItem {
  type: "individual_item" | "menu_item_ingredient";
  materialId: number;
  materialName: string;
  assignmentId?: number;
  stockEntryId: number;
  menuItemId?: number;
  menuItemName?: string;
  quantityRestored: number;
  unit: string;
  oldAssignmentQuantity?: number;
  newAssignmentQuantity?: number;
  oldStockQuantity: number;
  newStockQuantity: number;
  action?: string;
}

export interface RevertSaleResponse {
  message: string;
  saleId: string;
  stockRestorationReport: StockRestorationItem[];
  totalItemsRestored: number;
}

export const salesAPI = {
  getSales: () => api.get<SaleRecord[]>("/sales"),
  getSale: (id: string) => api.get<SaleRecord>(`/sales/${id}`),
  createSale: (saleData: SaleRecord) => api.post<SaleResponse, SaleRecord>("/sales", saleData),
  updateSale: (id: string, saleData: SaleRecord) => api.put<SaleRecord, SaleRecord>(`/sales/${id}`, saleData),
  deleteSale: (id: string) => api.delete<null>(`/sales/${id}`),
  revertSale: (id: string) => api.post<RevertSaleResponse, Record<string, never>>(`/sales/${id}/revert`, {}),
  getNegativeStockReport: () => api.get<NegativeStockReport>("/sales/negative-stock-report")
};
