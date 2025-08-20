import api from "@/lib/http";
import { BeverageItem, CreateMenuItemData, MenuItem, UpdateMenuItemData } from "@/types/inventory";

// Query parameters interface for menu items
interface MenuItemsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  _t?: number; // Cache-busting timestamp
}

// Interface for beverage variant creation request
export interface CreateBeverageVariantsRequest {
  baseMenuItem: BeverageItem;
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
  getMenus: () => api.get<MenuItem[]>("/menu-items"),
  getMenuItems: async (params?: MenuItemsQueryParams): Promise<MenuItem[]> => {
    const config = params ? { params } as any : undefined;
    const response = await api.get<{ data: MenuItem[] } | MenuItem[]>("/menu-items", config);
    // Handle both paginated response format and direct array format
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return (response.data as { data: MenuItem[] }).data;
    }
  },
  getMenuItem: (id: string) => api.get<MenuItem>(`/menu-items/${id}`),
  createMenuItem: (menuItemData: CreateMenuItemData) => {
    const data = processMenuItemData(menuItemData);
    
    // Debug logging to see what's being sent to API
    console.log("🌐 API: Sending to backend:", {
      dataType: 'JSON',
      originalData: menuItemData,
      processedData: data
    });
    
    return api.post<MenuItem, CreateMenuItemData>("/menu-items", data as CreateMenuItemData);
  },
  updateMenuItem: (id: string, menuItemData: UpdateMenuItemData) => {
    const data = processMenuItemData(menuItemData);
    
    // Debug logging to see what's being sent to API
    console.log("🌐 API: Updating menu item:", {
      id,
      dataType: 'JSON',
      originalData: menuItemData,
      processedData: data
    });
    
    return api.put<MenuItem, UpdateMenuItemData>(`/menu-items/${id}`, data as UpdateMenuItemData);
  },
  deleteMenuItem: (id: string) => api.delete<null>(`/menu-items/${id}`),

  // Printer assignment methods
  getMenuItemsWithPrinters: () => api.get<MenuItem[]>("/menu-items/with-printers"),
  assignPrinter: (id: string | number, printerId: number | null) => api.patch<{ menuItem: MenuItem }, { printerId: number | null }>(`/menu-items/${id}/assign-printer`, { printerId }),
  bulkAssignPrinter: (menuItemIds: (string | number)[], printerId: number | null) => api.patch<{ updatedCount: number; menuItems: MenuItem[] }, { menuItemIds: (string | number)[]; printerId: number | null }>("/menu-items/bulk-assign-printer", { menuItemIds, printerId }),
  
  // Bulk category update method
  bulkUpdateCategory: (menuItemIds: (string | number)[], category: string) => api.patch<{ updatedCount: number; menuItems: MenuItem[]; message: string }, { menuItemIds: (string | number)[]; category: string }>("/menu-items/bulk-update-category", { menuItemIds, category }),
  
  // Beverage variant creation method
  createBeverageVariants: (variantData: CreateBeverageVariantsRequest) => 
    api.post<{ message: string; variants: BeverageItem[] }, CreateBeverageVariantsRequest>(
      "/menu-items/beverage-variants", 
      variantData
    )
};
