import api from "@/lib/http";
import { CreateMaterialData, Material, UpdateMaterialData, MaterialWithStock } from "@/types/inventory";

interface BulkDeleteResponse {
  deletedCount: number;
  notFoundIds: string[];
}

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
  };
}

interface MaterialsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  unitType?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  fields?: string;
  createdAt_from?: string;
  createdAt_to?: string;
  _t?: number; // Cache-busting timestamp
}

interface MaterialsWithStockQueryParams extends MaterialsQueryParams {
  includeStockEntries?: 'true' | 'false';
}

export const materialsAPI = {
  // Get materials with pagination support
  getMaterials: async (params?: MaterialsQueryParams): Promise<Material[]> => {
    const config = params ? { params } as any : undefined;
    const response = await api.get<PaginatedResponse<Material>>("/materials", config);
    return response.data.data;
  },
  
  // Get materials with stock information
  getMaterialsWithStock: async (params?: MaterialsWithStockQueryParams): Promise<MaterialWithStock[]> => {
    const config = params ? { params } as any : undefined;
    const response = await api.get<PaginatedResponse<MaterialWithStock>>("/materials/with-stock", config);
    return response.data.data;
  },
  
  // Get paginated materials (returns full response with pagination info)
  getMaterialsPaginated: async (params?: MaterialsQueryParams) => {
    const config = params ? { params } as any : undefined;
    return api.get<PaginatedResponse<Material>>("/materials", config);
  },
  
  // Get paginated materials with stock (returns full response with pagination info)
  getMaterialsWithStockPaginated: async (params?: MaterialsWithStockQueryParams) => {
    const config = params ? { params } as any : undefined;
    return api.get<PaginatedResponse<MaterialWithStock>>("/materials/with-stock", config);
  },
  
  // Legacy method for backward compatibility - gets all materials without pagination
  getAllMaterials: async (): Promise<Material[]> => {
    const response = await api.get<PaginatedResponse<Material>>("/materials", { 
      params: { limit: 1000 } as any // Get a large number to simulate "all"
    } as any);
    return response.data.data;
  },
  
  getMaterial: (id: string) => api.get<Material>(`/materials/${id}`),
  createMaterial: (materialData: CreateMaterialData) => api.post<Material, CreateMaterialData>("/materials", materialData),
  updateMaterial: (id: string, materialData: UpdateMaterialData) => api.put<Material, UpdateMaterialData>(`/materials/${id}`, materialData),
  updateMaterialPOS: (id: string, materialData: UpdateMaterialData) => api.patch<Material, UpdateMaterialData>(`/materials/${id}`, materialData),
  deleteMaterial: (id: string) => api.delete<null>(`/materials/${id}`),
  
  // Bulk delete materials
  bulkDeleteMaterials(ids: string[]): Promise<{ data: BulkDeleteResponse }> {
    return api.post<BulkDeleteResponse, { ids: string[] }>("/materials/delete-all", { ids });
  },
  
  // Bulk update materials categories
  bulkUpdateMaterialCategories: (ids: string[], categoryId: number) => 
    api.post<null, { ids: string[], categoryId: number }>("/materials/update-all-categories", { ids, categoryId })
};
