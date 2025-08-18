import api from "@/lib/http";
import { StockEntryWithMaterial } from "@/types/inventory";

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
    categories?: string[];
  };
}

interface BeverageStockQueryParams {
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

interface BeverageNamesResponse {
  data: string[];
  count: number;
  meta: {
    requestTime: string;
  };
}

export const beverageStockAPI = {
  // Get beverage stock entries with pagination support
  getBeverageStockEntries: async (params?: BeverageStockQueryParams): Promise<StockEntryWithMaterial[]> => {
    const config = params ? ({ params } as any) : undefined;
    const response = await api.get<PaginatedResponse<StockEntryWithMaterial>>("/beverage-stock", config);
    return response.data.data;
  },

  // Get paginated beverage stock entries (returns full response with pagination info)
  getBeverageStockEntriesPaginated: async (params?: BeverageStockQueryParams) => {
    const config = params ? ({ params } as any) : undefined;
    return api.get<PaginatedResponse<StockEntryWithMaterial>>("/beverage-stock", config);
  },

  // Get beverage stock entry by ID
  getBeverageStockEntry: (id: string) => api.get<StockEntryWithMaterial>(`/beverage-stock/${id}`),

  // Get unique beverage names from stock entries
  getUniqueBeverageNames: async (): Promise<string[]> => {
    const response = await api.get<BeverageNamesResponse>("/beverage-stock/names/unique");
    return response.data.data;
  }
};
