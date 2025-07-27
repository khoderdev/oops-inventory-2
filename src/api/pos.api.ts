import api from "@/lib/http";
import { Material, POSItemsResponse, SaleRecord, SaleResponse, Section, SectionAssignment, StockEntry } from "@/types/inventory";

export const posAPI = {
  getMaterials: () => api.get<Material[]>("/materials"),
  getSections: () => api.get<Section[]>("/sections"),
  getAssignments: () => api.get<SectionAssignment[]>("/assignments"),
  getStockEntries: () => api.get<StockEntry[]>("/stock-entries"),
  createSale: (saleData: Omit<SaleRecord, "id">) => api.post<SaleResponse, Omit<SaleRecord, "id">>("/sales", saleData),
  getPOSItems: () => api.get<POSItemsResponse>("/pos/items"),
  getPOSItemsByCategory: (category: string) => api.get<POSItemsResponse>(`/pos/items/category/${category}`)
};
