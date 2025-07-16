import api from "@/lib/http";
import { CreateStockEntryData, StockEntry, UpdateStockEntryData } from "@/types/inventory";

export const stockAPI = {
  getStockEntries: () => api.get<StockEntry[]>("/stock-entries"),
  getStockEntry: (id: string) => api.get<StockEntry>(`/stock-entries/${id}`),
  createStockEntry: (stockEntryData: CreateStockEntryData) => api.post<StockEntry, CreateStockEntryData>("/stock-entries", stockEntryData),
  updateStockEntry: (id: string, stockEntryData: UpdateStockEntryData) => api.put<StockEntry, UpdateStockEntryData>(`/stock-entries/${id}`, stockEntryData),
  deleteStockEntry: (id: string) => api.delete<null>(`/stock-entries/${id}`)
};
