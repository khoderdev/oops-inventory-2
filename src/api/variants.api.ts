import api from "../lib/http";

export interface Variant {
  id: number;
  menuItemId: number;
  name: string;
  volume: string;
  unit: string;
  price: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantData {
  menuItemId: number;
  name: string;
  volume: number;
  unit: string;
  price: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateVariantData {
  name?: string;
  volume?: number;
  unit?: string;
  price?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface VariantsQueryParams {
  menuItemId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface VariantsResponse {
  data: Variant[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

class VariantsAPI {

  // Get all variants with filtering
  async getVariants(params?: VariantsQueryParams): Promise<VariantsResponse> {
    const response = await api.get<VariantsResponse | Variant[]>('/variants', { params });
    // Check if response.data already has the VariantsResponse structure
    if (response.data && 'data' in response.data && 
        'totalItems' in response.data && 
        'totalPages' in response.data && 
        'currentPage' in response.data) {
      return response.data as VariantsResponse;
    }
    
    // If not, assume the response is just the variants array and build the response structure
    const variants = Array.isArray(response.data) ? response.data : [];
    return {
      data: variants,
      totalItems: variants.length,
      totalPages: 1,
      currentPage: 1
    };
  }

  // Get variants for specific menu item
  async getVariantsByMenuItemId(menuItemId: number): Promise<Variant[]> {
    const response = await api.get<Variant[] | { data: Variant[] }>(`/variants/menu-item/${menuItemId}`);
    // Check if response.data has a data property
    return 'data' in response.data ? response.data.data : response.data;
  }

  // Get single variant by ID
  async getVariant(id: number): Promise<Variant> {
    const response = await api.get<Variant | { data: Variant }>(`/variants/${id}`);
    // Check if response.data has a data property
    return 'data' in response.data ? response.data.data : response.data;
  }

  // Create single variant
  async createVariant(data: CreateVariantData): Promise<Variant> {
    const response = await api.post<Variant | { data: Variant }, CreateVariantData>('/variants', data);
    // Check if response.data has a data property
    return 'data' in response.data ? response.data.data : response.data;
  }

  // Create multiple variants
  async createVariantsBulk(variants: CreateVariantData[]): Promise<Variant[]> {
    const response = await api.post<Variant[] | { data: Variant[] }, { variants: CreateVariantData[] }>('/variants/bulk', { variants });
    // Check if response.data has a data property
    return 'data' in response.data ? response.data.data : response.data;
  }

  // Update variant
  async updateVariant(id: number, data: UpdateVariantData): Promise<Variant> {
    const response = await api.put<Variant | { data: Variant }, UpdateVariantData>(`/variants/${id}`, data);
    // Check if response.data has a data property
    return 'data' in response.data ? response.data.data : response.data;
  }

  // Toggle variant status
  async toggleVariantStatus(id: number): Promise<Variant> {
    const response = await api.patch<Variant | { data: Variant }, null>(`/variants/${id}/toggle-status`, null);
    // Check if response.data has a data property
    return 'data' in response.data ? response.data.data : response.data;
  }

  // Delete variant
  async deleteVariant(id: number): Promise<void> {
    await api.delete(`/variants/${id}`);
  }

  // Bulk delete variants
  async deleteVariantsBulk(ids: number[]): Promise<void> {
    await api.delete('/variants/bulk', { data: { ids } });
  }
}

export const variantsAPI = new VariantsAPI();
