import api from "@/lib/http";
import { AddStockData, AddStockResponse, CreateStockEntryData, RecordWasteData, RecordWasteResponse, StockEntry, UpdateStockEntryData, StockEntryWithMaterial } from "@/types/inventory";
import { format, isValid, parse } from "date-fns";

// Types for paginated responses
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
  };
  filters: Record<string, any>;
  meta: {
    requestTime: string;
    totalDataSize: number;
    negativeEntriesCount?: number;
    categories?: string[];
  };
}

export interface StockEntriesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  materialId?: string;
  isPOSItem?: string;
  printerId?: string;
  purchaseDate_from?: string;
  purchaseDate_to?: string;
  expiryDate_from?: string;
  expiryDate_to?: string;
  totalCost_from?: string;
  totalCost_to?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  fields?: string;
  includeMaterial?: "true" | "false";
}

export interface BeverageStockQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  materialId?: string;
  isPOSItem?: string;
  purchaseDate_from?: string;
  purchaseDate_to?: string;
  expiryDate_from?: string;
  expiryDate_to?: string;
  totalCost_from?: string;
  totalCost_to?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  fields?: string;
  includeMaterial?: "true" | "false";
}

export interface BeverageNamesResponse {
  data: string[];
  count: number;
  meta: {
    requestTime: string;
  };
}

export const stockAPI = {
  // Get stock entries with pagination support
  getStockEntries: async (params?: StockEntriesQueryParams): Promise<StockEntryWithMaterial[]> => {
    const config = params ? ({ params } as any) : undefined;
    const response = await api.get<PaginatedResponse<StockEntryWithMaterial>>("/stock-entries", config);
    return response.data.data;
  },

  // Get paginated stock entries (returns full response with pagination info)
  getStockEntriesPaginated: async (params?: StockEntriesQueryParams) => {
    const config = params ? ({ params } as any) : undefined;
    return api.get<PaginatedResponse<StockEntryWithMaterial>>("/stock-entries", config);
  },

  // Legacy method for backward compatibility - gets all stock entries without pagination
  getAllStockEntries: async (): Promise<StockEntry[]> => {
    const response = await api.get<PaginatedResponse<StockEntry>>("/stock-entries", {
      params: { limit: 1000, includeMaterial: "false" } as any // Get a large number to simulate "all"
    } as any);
    return response.data.data;
  },

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

  updateStockEntry: (id: string, stockEntryData: UpdateStockEntryData) => {
    console.log("📡 stockAPI.updateStockEntry called with:", { id, stockEntryData });
    return api.put<StockEntry, UpdateStockEntryData>(`/stock-entries/${id}`, stockEntryData);
  },
  updateStockEntryPOS: (id: string, posData: { isPOSItem: boolean }) => api.patch<StockEntry, { isPOSItem: boolean }>(`/stock-entries/${id}/pos`, posData),
  deleteStockEntry: (id: string) => api.delete<null>(`/stock-entries/${id}`),

  // Printer assignment methods
  getStockEntriesWithPrinters: async (params?: StockEntriesQueryParams): Promise<StockEntryWithMaterial[]> => {
    const config = params ? ({ params } as any) : undefined;
    const response = await api.get<PaginatedResponse<StockEntryWithMaterial>>("/stock-entries/with-printers", config);
    return response.data.data;
  },

  // Get paginated stock entries with printers (returns full response with pagination info)
  getStockEntriesWithPrintersPaginated: async (params?: StockEntriesQueryParams) => {
    const config = params ? ({ params } as any) : undefined;
    return api.get<PaginatedResponse<StockEntryWithMaterial>>("/stock-entries/with-printers", config);
  },
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

//--------------------------------------------------------

export const beverageStockAPI = {
  // Get beverage stock entries with pagination support
  getBeverageStockEntries: async (params?: BeverageStockQueryParams): Promise<StockEntryWithMaterial[]> => {
    const config = params ? ({ params } as any) : undefined;
    const response = await api.get<PaginatedResponse<StockEntryWithMaterial>>("/stock-entries/beverage", config);
    return response.data.data;
  },

  // Get paginated beverage stock entries (returns full response with pagination info)
  getBeverageStockEntriesPaginated: async (params?: BeverageStockQueryParams) => {
    const config = params ? ({ params } as any) : undefined;
    return api.get<PaginatedResponse<StockEntryWithMaterial>>("/stock-entries/beverage", config);
  },

  // Get beverage stock entry by ID
  getBeverageStockEntry: (id: string) => api.get<StockEntryWithMaterial>(`/stock-entries/beverage/${id}`),

  // Get unique beverage names from stock entries
  getUniqueBeverageNames: async (): Promise<string[]> => {
    const response = await api.get<BeverageNamesResponse>("/stock-entries/beverage/names/unique");
    return response.data.data;
  }
};
