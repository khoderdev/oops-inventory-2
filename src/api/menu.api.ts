import api from "@/lib/http";
import { CreateMenuItemData, MenuItem, UpdateMenuItemData } from "@/types/inventory";

// Query parameters interface for menu items
interface MenuItemsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  _t?: number; // Cache-busting timestamp
  isActive?: boolean; // Active status filter
}

// Interface for beverage variant creation request
export interface CreateBeverageVariantsRequest {
  baseMenuItem: MenuItem;
  selectedVariants: string[];
  priceAdjustments: Record<string, number>;
  nameFormat: "prefix" | "suffix";
}

// Helper function to process menu item data for JSON requests
const processMenuItemData = (menuItemData: CreateMenuItemData | UpdateMenuItemData): CreateMenuItemData | UpdateMenuItemData => {
  console.log('🔍 processMenuItemData - START - Raw input data:', {
    menuItemData,
    beverageFields: {
      beverageStockId: (menuItemData as any).beverageStockId,
      unit: (menuItemData as any).unit,
      availableQuantity: (menuItemData as any).availableQuantity,
      costPerUnit: (menuItemData as any).costPerUnit,
      variants: (menuItemData as any).variants
    },
    image: (menuItemData as any).image ? 'base64 data present' : 'no image'
  });
  
  const processedData = { ...menuItemData };
  
  // Process ingredients to ensure material IDs are in the correct format
  if (processedData.ingredients && Array.isArray(processedData.ingredients)) {
    processedData.ingredients = processedData.ingredients.map(ingredient => {
      if (ingredient.materialId && typeof ingredient.materialId === 'string' && ingredient.materialId.startsWith('material-')) {
        const materialId = ingredient.materialId.replace('material-', '');
        console.log('🔧 Processed material ID:', { 
          from: ingredient.materialId, 
          to: materialId 
        });
        return { ...ingredient, materialId };
      }
      return ingredient;
    });
  }

  // Preserve the category object structure for backend
  if (processedData.category && typeof processedData.category === 'object') {
    const originalCategory = processedData.category;
    // Keep the full category object intact
    console.log('🔍 Category preserved:', { category: originalCategory });
  }
  
  console.log('🔍 processMenuItemData - END - Final output:', {
    processedData,
    beverageFields: {
      beverageStockId: (processedData as any).beverageStockId,
      unit: (processedData as any).unit,
      availableQuantity: (processedData as any).availableQuantity,
      costPerUnit: (processedData as any).costPerUnit,
      variants: (processedData as any).variants
    },
    image: (processedData as any).image ? 'base64 data included' : 'no image'
  });
  
  return processedData;
};

export const menuAPI = {
  getMenus: () => api.get<MenuItem[]>(`/menu-items?_t=${Date.now()}`),
  getMenuItems: async (params?: MenuItemsQueryParams): Promise<MenuItem[]> => {
    const usp = new URLSearchParams();
    // Always add cache-busting
    usp.set("_t", String(Date.now()));
    if (params) {
      if (params.page !== undefined) usp.set("page", String(params.page));
      if (params.limit !== undefined) usp.set("limit", String(params.limit));
      if (params.search) usp.set("search", params.search);
      if (params.category) usp.set("category", params.category);
      if (params.sortBy) usp.set("sortBy", params.sortBy);
      if (params.sortOrder) usp.set("sortOrder", params.sortOrder);
      if (params.isActive !== undefined) usp.set("isActive", String(params.isActive));
    }
    const url = `/menu-items${usp.toString() ? `?${usp.toString()}` : ""}`;
    const response = await api.get<{ data: MenuItem[] } | MenuItem[]>(url);
    // Handle both paginated response format and direct array format
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return (response.data as { data: MenuItem[] }).data;
    }
  },
  getMenuItem: (id: string) => api.get<MenuItem>(`/menu-items/${id}`),
  createMenuItem: (menuItemData: CreateMenuItemData) => {
    // Process the data first
    const data = processMenuItemData(menuItemData);
    
    // Ensure ingredients have the correct format
    const processedData = {
      ...data,
      ingredients: data.ingredients?.map(ingredient => ({
        ...ingredient,
        // Ensure materialId is a number if it's a numeric string
        materialId: typeof ingredient.materialId === 'string' && !isNaN(Number(ingredient.materialId)) 
          ? Number(ingredient.materialId) 
          : ingredient.materialId
      })) || []
    };
    
    // Debug logging to see what's being sent to API
    console.log("🌐 API: Sending to backend:", {
      dataType: 'JSON',
      originalData: menuItemData,
      processedData: processedData,
      ingredientsCheck: processedData.ingredients?.map(i => ({
        materialId: i.materialId,
        type: typeof i.materialId
      }))
    });
    
    // Update the createMenuItem function to ensure proper logging and data processing
    console.log("🌐 API: Creating menu item with processed data:", processedData);
    return api.post<MenuItem, CreateMenuItemData>('/menu-items', processedData as CreateMenuItemData);
  },
  updateMenuItem: (id: string, menuItemData: UpdateMenuItemData) => {
    // Process the data first
    const data = processMenuItemData(menuItemData);
    
    // Ensure ingredients have the correct format
    const processedData = {
      ...data,
      ingredients: data.ingredients?.map(ingredient => ({
        ...ingredient,
        // Ensure materialId is a number if it's a numeric string
        materialId: typeof ingredient.materialId === 'string' && !isNaN(Number(ingredient.materialId)) 
          ? Number(ingredient.materialId) 
          : ingredient.materialId
      })) || []
    };
    
    // Debug logging to see what's being sent to API
    console.log("🌐 API: Updating menu item:", {
      id,
      dataType: 'JSON',
      originalData: menuItemData,
      processedData: processedData,
      ingredientsCheck: processedData.ingredients?.map(i => ({
        materialId: i.materialId,
        type: typeof i.materialId
      }))
    });
    
    return api.put<MenuItem, UpdateMenuItemData>(`/menu-items/${id}`, processedData as UpdateMenuItemData);
  },
  deleteMenuItem: (id: string) => {
    const idStr = String(id).trim();
    const isNumeric = /^\d+$/.test(idStr);
    console.log("🗑️ API.deleteMenuItem called", { id, idStr, isNumeric });
    if (!isNumeric) {
      const message = idStr.startsWith("menu-")
        ? "Cannot delete unsaved menu item. Please save it first."
        : `Invalid menu item ID: ${idStr}`;
      return Promise.reject({ message, status: 400, details: { id } });
    }
    return api.delete<null>(`/menu-items/${idStr}`);
  },

  // Printer assignment methods
  getMenuItemsWithPrinters: () => api.get<MenuItem[]>("/menu-items/with-printers"),
  assignPrinter: (id: string | number, printerId: number | null) => api.patch<{ menuItem: MenuItem }, { printerId: number | null }>(`/menu-items/${id}/assign-printer`, { printerId }),
  bulkAssignPrinter: (menuItemIds: (string | number)[], printerId: number | null) => api.patch<{ updatedCount: number; menuItems: MenuItem[] }, { menuItemIds: (string | number)[]; printerId: number | null }>("/menu-items/bulk-assign-printer", { menuItemIds, printerId }),
  
  // Bulk category update method
  bulkUpdateCategory: (menuItemIds: (string | number)[], category: string) => api.patch<{ updatedCount: number; menuItems: MenuItem[]; message: string }, { menuItemIds: (string | number)[]; category: string }>("/menu-items/bulk-update-category", { menuItemIds, category }),
  
  // Beverage variant creation method
  createBeverageVariants: (variantData: CreateBeverageVariantsRequest) => 
    api.post<{ message: string; variants: MenuItem[] }, CreateBeverageVariantsRequest>(
      "/menu-items/beverage-variants", 
      variantData
    ),
    
  // Get beverage menu items
  getBeverageMenuItems: async (isActive: boolean = true): Promise<MenuItem[]> => {
    const params = new URLSearchParams({
      isActive: isActive.toString(),
      _t: Date.now().toString()
    });
    console.log('🍹 Fetching beverage menu items with params:', Object.fromEntries(params));
    const response = await api.get<MenuItem[]>(`/menu-items/type/beverage?${params.toString()}`);
    return response.data;
  },
  
  // Get food menu items
  getFoodMenuItems: async (isActive: boolean = true): Promise<MenuItem[]> => {
    const params = new URLSearchParams({
      isActive: isActive.toString(),
      _t: Date.now().toString()
    });
    console.log('🍔 Fetching food menu items with params:', Object.fromEntries(params));
    const response = await api.get<MenuItem[]>(`/menu-items/type/food?${params.toString()}`);
    return response.data;
  }
};
