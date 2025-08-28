import api from "@/lib/http";
import { CreateSauceData, UpdateSauceData, Sauce } from "@/types/inventory";

export interface SaucesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  _t?: number;
}

export interface SaucesResponse {
  data: Sauce[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

class SaucesAPI {
  private client = api;

  /**
   * Get all sauces with optional filtering and pagination
   */
  async getSauces(params?: SaucesQueryParams): Promise<SaucesResponse> {
    try {
      const response = await this.client.get<SaucesResponse>("/sauces", { params, headers: undefined });
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching sauces:", error);
      throw error;
    }
  }

  /**
   * Get a single sauce by ID
   */
  async getSauce(id: string): Promise<{ data: Sauce }> {
    try {
      const response = await this.client.get<{ data: Sauce }>(`/sauces/${id}`, { headers: undefined });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching sauce ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new sauce
   */
  async createSauce(data: CreateSauceData): Promise<{ data: Sauce }> {
    try {
      const response = await this.client.post<{ data: Sauce }, CreateSauceData>("/sauces", data, { headers: undefined });
      return response.data;
    } catch (error) {
      console.error("❌ Error creating sauce:", error);
      throw error;
    }
  }

  /**
   * Update an existing sauce
   */
  async updateSauce(id: string, data: UpdateSauceData): Promise<{ data: Sauce }> {
    try {
      const response = await this.client.put<{ data: Sauce }, UpdateSauceData>(`/sauces/${id}`, data, { headers: undefined });
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating sauce ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a sauce
   */
  async deleteSauce(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.delete<{ success: boolean; message: string }>(`/sauces/${id}`, { headers: undefined });
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting sauce ${id}:`, error);
      throw error;
    }
  }

  /**
   * Bulk delete sauces
   */
  async bulkDeleteSauces(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    try {
      const response = await this.client.post("/sauces/bulk-delete", { ids }, { headers: undefined });
      const data = response.data as { message: string; deletedCount: number };
      return {
        message: data.message,
        deletedCount: data.deletedCount
      };
    } catch (error) {
      console.error("❌ Error bulk deleting sauces:", error);
      throw error;
    }
  }

  /**
   * Toggle POS visibility for a sauce
   */
  async togglePOSVisibility(id: string, isPOSItem: boolean): Promise<{ data: Sauce }> {
    try {
      const response = await this.client.patch(`/sauces/${id}/pos-visibility`, { isPOSItem }, { headers: undefined });
      return response as { data: Sauce };
    } catch (error) {
      console.error(`❌ Error toggling POS visibility for sauce ${id}:`, error);
      throw error;
    }
  }

  /**
   * Toggle active status for a sauce
   */
  async toggleActiveStatus(id: string, isActive: boolean): Promise<{ data: Sauce }> {
    try {
      const response = await this.client.patch(`/sauces/${id}/active-status`, { isActive }, { headers: undefined });
      return response as { data: Sauce };
    } catch (error) {
      console.error(`❌ Error toggling active status for sauce ${id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate sauce cost based on ingredients
   */
  async calculateSauceCost(ingredients: Array<{ materialId: string; quantity: number; unit: string }>): Promise<{
    totalCost: number;
    ingredientCosts: Array<{
      materialId: string;
      materialName: string;
      quantity: number;
      unit: string;
      costPerUnit: number;
      totalCost: number;
    }>;
  }> {
    try {
      const response = await this.client.post("/sauces/calculate-cost", { ingredients }, { headers: undefined });

      // Type-cast the response data to match expected structure
      const responseData = response.data as {
        totalCost: number;
        ingredientCosts: Array<{
          materialId: string;
          materialName: string;
          quantity: number;
          unit: string;
          costPerUnit: number;
          totalCost: number;
        }>;
      };

      // Extract totalCost and ingredientCosts from the response
      return {
        totalCost: responseData.totalCost,
        ingredientCosts: responseData.ingredientCosts
      };
    } catch (error) {
      console.error("❌ Error calculating sauce cost:", error);
      throw error;
    }
  }

  /**
   * Get sauce categories
   */
  async getSauceCategories(): Promise<{ data: string[] }> {
    try {
      const response = await this.client.get("/sauces/categories", { headers: undefined });
      return { data: response.data as string[] };
    } catch (error) {
      console.error("❌ Error fetching sauce categories:", error);
      throw error;
    }
  }
}

export const saucesAPI = new SaucesAPI();
