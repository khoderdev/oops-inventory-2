import api from "@/lib/http";
import { CreateStockEntryData, StockEntry, UpdateStockEntryData, AddStockData, AddStockResponse, RecordWasteData, RecordWasteResponse } from "@/types/inventory";

export const stockAPI = {
  getStockEntries: () => api.get<StockEntry[]>("/stock-entries"),
  getStockEntry: (id: string) => api.get<StockEntry>(`/stock-entries/${id}`),
  createStockEntry: (stockEntryData: CreateStockEntryData) => api.post<StockEntry, CreateStockEntryData>("/stock-entries", stockEntryData),
  addToStock: (addStockData: AddStockData) => api.post<AddStockResponse, AddStockData>("/stock-entries/add-stock", addStockData),
  recordWaste: (wasteData: RecordWasteData) => api.post<RecordWasteResponse, RecordWasteData>("/stock-entries/record-waste", wasteData),
  addToSpecificEntry: (id: string, data: { additionalQuantity: number; unit: string; additionDate?: Date; notes?: string }) => api.post<{ message: string; stockEntry: StockEntry }, { additionalQuantity: number; unit: string; additionDate?: Date; notes?: string }>(`/stock-entries/${id}/add-to-entry`, data),
  wasteFromSpecificEntry: (id: string, data: { wasteQuantity: number; unit: string; wasteReason: string; wasteDate?: Date; notes?: string }) => api.post<{ message: string; stockEntry: StockEntry; wastedQuantity: number; wastedUnit: string; reason: string }, { wasteQuantity: number; unit: string; wasteReason: string; wasteDate?: Date; notes?: string }>(`/stock-entries/${id}/waste-from-entry`, data),
  updateStockEntry: (id: string, stockEntryData: UpdateStockEntryData) => api.put<StockEntry, UpdateStockEntryData>(`/stock-entries/${id}`, stockEntryData),
  deleteStockEntry: (id: string) => api.delete<null>(`/stock-entries/${id}`)
};
