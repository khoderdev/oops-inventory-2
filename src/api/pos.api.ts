import api from "@/lib/http";
import { Material, SaleRecord, SaleResponse, Section, SectionAssignment, StockEntry } from "@/types/inventory";

export const posAPI = {
  getMaterials: () => api.get<Material[]>("/materials"),
  getSections: () => api.get<Section[]>("/sections"),
  getAssignments: () => api.get<SectionAssignment[]>("/assignments"),
  getStockEntries: () => api.get<StockEntry[]>("/stock-entries"),
  createSale: (saleData: Omit<SaleRecord, "id">) => api.post<SaleResponse, Omit<SaleRecord, "id">>("/sales", saleData),
  getPOSItems: () => api.get<Material[]>("/pos/items"),
  getPOSItemsByCategory: (category: string) => api.get<Material[]>(`/pos/items/category/${category}`)
};
