import api from "@/lib/http";
import { AddStockData, AddStockResponse, CreateStockEntryData, RecordWasteData, RecordWasteResponse, StockEntry, UpdateStockEntryData } from "@/types/inventory";
import { format, isValid, parse } from "date-fns";

export const stockAPI = {
  getStockEntries: () => api.get<StockEntry[]>("/stock-entries"),
  getStockEntry: (id: string) => api.get<StockEntry>(`/stock-entries/${id}`),
  createStockEntry: (stockEntryData: CreateStockEntryData) => api.post<StockEntry, CreateStockEntryData>("/stock-entries", stockEntryData),
  addToStock: (addStockData: AddStockData) => api.post<AddStockResponse, AddStockData>("/stock-entries/add-stock", addStockData),
  recordWaste: (wasteData: RecordWasteData) => api.post<RecordWasteResponse, RecordWasteData>("/stock-entries/record-waste", wasteData),
  addToSpecificEntry: (id: string, data: { additionalQuantity: number; unit: string; additionDate?: Date; notes?: string }) => api.post<{ message: string; stockEntry: StockEntry }, { additionalQuantity: number; unit: string; additionDate?: Date; notes?: string }>(`/stock-entries/${id}/add-to-entry`, data),

  // Optimistic update
  wasteFromSpecificEntry: (
    id: string,
    data: {
      wasteQuantity: number;
      unit: string;
      wasteReason: string;
      wasteDate?: Date;
      notes?: string;
    }
  ) =>
    api.post<
      { message: string; stockEntry: StockEntry; wastedQuantity: number; wastedUnit: string; reason: string },
      {
        wasteQuantity: number;
        unit: string;
        wasteReason: string;
        wasteDate?: Date;
        notes?: string;
      }
    >(`/stock-entries/${id}/waste-from-entry`, data),

  updateStockEntry: (id: string, stockEntryData: UpdateStockEntryData) => api.put<StockEntry, UpdateStockEntryData>(`/stock-entries/${id}`, stockEntryData),
  updateStockEntryPOS: (id: string, posData: { isPOSItem: boolean }) => api.patch<StockEntry, { isPOSItem: boolean }>(`/stock-entries/${id}/pos`, posData),
  deleteStockEntry: (id: string) => api.delete<null>(`/stock-entries/${id}`),

  // Printer assignment methods
  getStockEntriesWithPrinters: () => api.get<StockEntry[]>("/stock-entries/with-printers"),
  assignPrinter: (id: string | number, printerId: number | null) => api.patch<{ stockEntry: StockEntry }, { printerId: number | null }>(`/stock-entries/${id}/assign-printer`, { printerId }),
  bulkAssignPrinter: (stockEntryIds: (string | number)[], printerId: number | null) => api.patch<{ updatedCount: number; stockEntries: StockEntry[] }, { stockEntryIds: (string | number)[]; printerId: number | null }>("/stock-entries/bulk-assign-printer", { stockEntryIds, printerId }),
  async getWastageReport({ startDate, endDate }: { startDate?: string; endDate?: string }) {
    // Parse and validate dates
    const parseDate = (dateStr?: string): string | null => {
      if (!dateStr) return null;
      const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
      if (!isValid(parsed)) {
        const fallback = parse(dateStr, "MM/dd/yyyy", new Date());
        return isValid(fallback) ? format(fallback, "yyyy-MM-dd") : null;
      }
      return format(parsed, "yyyy-MM-dd");
    };

    const formattedStartDate = parseDate(startDate);
    const formattedEndDate = parseDate(endDate);

    if (!formattedStartDate) {
      throw new Error("Invalid startDate format. Use YYYY-MM-DD or MM/DD/YYYY");
    }

    const response = await api.get("/stock-entries/wastage-report", {
      params: {
        startDate: formattedStartDate,
        endDate: formattedEndDate || format(new Date(), "yyyy-MM-dd")
      },
      headers: undefined
    });
    return response.data;
  }
};
