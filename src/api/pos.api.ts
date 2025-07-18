import api from "@/lib/http";
import { Material, Section, SectionAssignment, StockEntry, SaleRecord } from "@/types/inventory";

export const posAPI = {
  getMaterials: () => api.get<Material[]>("/materials"),
  getSections: () => api.get<Section[]>("/sections"),
  getAssignments: () => api.get<SectionAssignment[]>("/assignments"),
  getStockEntries: () => api.get<StockEntry[]>("/stock-entries"),
  createSale: (saleData: Omit<SaleRecord, "id">) => api.post("/sales", saleData)
};
