import api from "@/lib/http";

export interface VariantIngredient {
  id: number;
  variantId: number;
  materialId?: number;
  sauceId?: number;
  quantity: number;
  unit: string;
  cost: number;
  sortOrder: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  variant?: {
    id: number;
    name: string;
    volume: number;
    unit: string;
    price: number;
  };
  material?: {
    id: number;
    name: string;
    unit: string;
    unitType: string;
  };
  sauce?: {
    id: number;
    name: string;
    totalCost: number;
    costPerUnit: number;
    yield: number;
    yieldUnit: string;
  };
}

export interface CreateVariantIngredientData {
  variantId: number;
  materialId?: number;
  sauceId?: number;
  quantity: number;
  unit: string;
  cost?: number;
  sortOrder?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateVariantIngredientData {
  variantId?: number;
  materialId?: number;
  sauceId?: number;
  quantity?: number;
  unit?: string;
  cost?: number;
  sortOrder?: number;
  isActive?: boolean;
  notes?: string;
}

export interface VariantIngredientsResponse {
  success: boolean;
  data: VariantIngredient[];
  count: number;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface VariantIngredientResponse {
  success: boolean;
  data: VariantIngredient;
  message?: string;
}

// Get all variant ingredients with optional filtering
export const getAllVariantIngredients = async (params?: {
  variantId?: number;
  materialId?: number;
  sauceId?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<VariantIngredientsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.variantId) queryParams.append('variantId', params.variantId.toString());
  if (params?.materialId) queryParams.append('materialId', params.materialId.toString());
  if (params?.sauceId) queryParams.append('sauceId', params.sauceId.toString());
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const url = `/variant-ingredients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await api.get<VariantIngredientsResponse>(url);
  return response.data;
};

// Get ingredients for a specific variant
export const getIngredientsByVariantId = async (
  variantId: number,
  includeInactive = false
): Promise<VariantIngredientsResponse> => {
  const queryParams = new URLSearchParams();
  if (includeInactive) queryParams.append('includeInactive', 'true');
  
  const url = `/variant-ingredients/variant/${variantId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await api.get<VariantIngredientsResponse>(url);
  return response.data;
};

// Get a single variant ingredient by ID
export const getVariantIngredientById = async (id: number): Promise<VariantIngredientResponse> => {
  const response = await api.get<VariantIngredientResponse>(`/variant-ingredients/${id}`);
  return response.data;
};

// Create a new variant ingredient
export const createVariantIngredient = async (
  data: CreateVariantIngredientData
): Promise<VariantIngredientResponse> => {
  const response = await api.post<VariantIngredientResponse, CreateVariantIngredientData>('/variant-ingredients', data);
  return response.data;
};

// Update a variant ingredient
export const updateVariantIngredient = async (
  id: number,
  data: UpdateVariantIngredientData
): Promise<VariantIngredientResponse> => {
  const response = await api.put<VariantIngredientResponse, UpdateVariantIngredientData>(`/variant-ingredients/${id}`, data);
  return response.data;
};

// Delete a variant ingredient
export const deleteVariantIngredient = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/variant-ingredients/${id}`);
  return response.data;
};

// Bulk create variant ingredients
export const bulkCreateVariantIngredients = async (
  ingredients: CreateVariantIngredientData[]
): Promise<VariantIngredientsResponse> => {
  const response = await api.post<VariantIngredientsResponse, { ingredients: CreateVariantIngredientData[] }>('/variant-ingredients/bulk', { ingredients });
  return response.data;
};

// Toggle ingredient active status
export const toggleIngredientStatus = async (id: number): Promise<VariantIngredientResponse> => {
  const response = await api.patch<VariantIngredientResponse, Record<string, never>>(`/variant-ingredients/${id}/toggle-status`, {});
  return response.data;
};

// Helper function to calculate ingredient cost based on material/sauce data
export const calculateIngredientCost = (
  ingredient: VariantIngredient,
  stockEntries?: any[]
): number => {
  if (ingredient.material && stockEntries) {
    // Find stock entry for this material
    const stockEntry = stockEntries.find(entry => entry.materialId === ingredient.materialId);
    if (stockEntry) {
      // Calculate cost based on quantity and unit conversion
      // This would need proper unit conversion logic
      return (ingredient.quantity * stockEntry.costPerUnit) || 0;
    }
  }
  
  if (ingredient.sauce) {
    // Calculate cost based on sauce cost per unit
    return (ingredient.quantity * ingredient.sauce.costPerUnit) || 0;
  }
  
  return ingredient.cost || 0;
};

// Helper function to get ingredient display name
export const getIngredientDisplayName = (ingredient: VariantIngredient): string => {
  if (ingredient.material) {
    return ingredient.material.name;
  }
  if (ingredient.sauce) {
    return ingredient.sauce.name;
  }
  return 'Unknown Ingredient';
};

// Helper function to get ingredient unit
export const getIngredientUnit = (ingredient: VariantIngredient): string => {
  return ingredient.unit || ingredient.material?.unit || ingredient.sauce?.yieldUnit || '';
};
