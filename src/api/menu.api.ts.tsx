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

// Helper function to create FormData for menu item with image
const createFormData = (menuItemData: CreateMenuItemData | UpdateMenuItemData, imageFile?: File): FormData | CreateMenuItemData | UpdateMenuItemData => {
  console.log('🔍 createFormData - START - Raw input data:', {
    menuItemData,
    imageFile: imageFile ? { name: imageFile.name, size: imageFile.size } : 'none',
    beverageFields: {
      beverageStockId: (menuItemData as any).beverageStockId,
      unit: (menuItemData as any).unit,
      availableQuantity: (menuItemData as any).availableQuantity,
      costPerUnit: (menuItemData as any).costPerUnit,
      variants: (menuItemData as any).variants
    }
  });

  // Check if we have a valid imageFile (not empty object)
  const hasValidImageFile = imageFile && imageFile.size > 0 && imageFile.name;
  
  // Check if we have base64 image data (in the 'image' field)
  const hasBase64Image = (menuItemData as any).image && typeof (menuItemData as any).image === 'string' && (menuItemData as any).image.startsWith('data:image/');
  
  console.log('🔍 createFormData - Image check:', {
    hasValidImageFile,
    hasBase64Image,
    willUseFormData: hasValidImageFile || hasBase64Image
  });
  
  // Use FormData if we have either a valid file OR base64 image data
  if (hasValidImageFile || hasBase64Image) {
    console.log('🔍 createFormData - Using FormData path');
    const formData = new FormData();
    
    // Add all menu item fields to FormData, including beverage-specific fields
    Object.entries(menuItemData).forEach(([key, value]) => {
      console.log(`🔍 FormData processing field: ${key} =`, value);
      
      if (key === 'ingredients') {
        formData.append(key, JSON.stringify(value));
        console.log(`✅ Added ${key} as JSON:`, JSON.stringify(value));
      } else if (key === 'variants' && typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
        console.log(`✅ Added ${key} as JSON:`, JSON.stringify(value));
      } else if (key === 'category' && typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
        console.log(`✅ Added ${key} as JSON:`, JSON.stringify(value));
      } else if (key === 'image' && typeof value === 'string' && value.startsWith('data:image/')) {
        formData.append('imageBase64', value);
        console.log(`✅ Added ${key} as imageBase64`);
      } else if (value !== undefined && value !== null && key !== 'imageFile') {
        // This handles all beverage fields: beverageStockId, unit, availableQuantity, costPerUnit
        formData.append(key, value.toString());
        console.log(`✅ Added ${key} as string:`, value.toString());
      } else {
        console.log(`❌ Skipped ${key}:`, value);
      }
    });
    
    // Add the image file with a different field name (only if we have a valid file)
    if (hasValidImageFile) {
      formData.append('imageFile', imageFile);
      console.log('✅ Added imageFile to FormData');
    }
    
    // Log FormData contents
    console.log('🔍 FormData final contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    
    return formData;
  }
  
  // For JSON requests, preserve all fields including beverage-specific ones
  console.log('🔍 createFormData - Using JSON path');
  console.log('🔧 createFormData JSON mode - input data:', menuItemData);
  
  const processedData = { ...menuItemData };
  
  console.log('🔍 JSON processing - Before category handling:', {
    originalCategory: processedData.category,
    beverageFields: {
      beverageStockId: (processedData as any).beverageStockId,
      unit: (processedData as any).unit,
      availableQuantity: (processedData as any).availableQuantity,
      costPerUnit: (processedData as any).costPerUnit,
      variants: (processedData as any).variants
    }
  });
  
  // Handle category object - extract the name for backend
  if (processedData.category && typeof processedData.category === 'object') {
    const originalCategory = processedData.category;
    (processedData as any).category = (processedData.category as any).name || processedData.category;
    console.log('🔍 Category conversion:', { from: originalCategory, to: (processedData as any).category });
  }
  
  console.log('🔍 JSON processing - After category handling:', {
    processedCategory: processedData.category,
    beverageFields: {
      beverageStockId: (processedData as any).beverageStockId,
      unit: (processedData as any).unit,
      availableQuantity: (processedData as any).availableQuantity,
      costPerUnit: (processedData as any).costPerUnit,
      variants: (processedData as any).variants
    }
  });
  
  // Preserve all beverage-specific fields (beverageStockId, unit, availableQuantity, costPerUnit, variants)
  // These fields are already in the correct format from BeverageItemForm
  
  console.log('🔧 createFormData JSON mode - final output:', processedData);
  console.log('🔍 createFormData - END - Final beverage fields check:', {
    beverageStockId: (processedData as any).beverageStockId,
    unit: (processedData as any).unit,
    availableQuantity: (processedData as any).availableQuantity,
    costPerUnit: (processedData as any).costPerUnit,
    variants: (processedData as any).variants
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
  createMenuItem: (menuItemData: CreateMenuItemData, imageFile?: File) => {
    const data = createFormData(menuItemData, imageFile);
    
    // Debug logging to see what's being sent to API
    console.log("🌐 API: Sending to backend:", {
      dataType: data instanceof FormData ? 'FormData' : 'JSON',
      originalData: menuItemData,
      processedData: data instanceof FormData ? 'FormData (check network tab)' : data
    });
    
    return api.post<MenuItem, FormData | CreateMenuItemData>("/menu-items", data as FormData | CreateMenuItemData);
  },
  updateMenuItem: (id: string, menuItemData: UpdateMenuItemData, imageFile?: File) => {
    const data = createFormData(menuItemData, imageFile);
    return api.put<MenuItem, FormData | UpdateMenuItemData>(`/menu-items/${id}`, data as FormData | UpdateMenuItemData);
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
