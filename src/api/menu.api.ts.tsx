import api from "@/lib/http";
import { BeverageItem, CreateMenuItemData, MenuItem, UpdateMenuItemData } from "@/types/inventory";

// Interface for beverage variant creation request
export interface CreateBeverageVariantsRequest {
  baseMenuItem: BeverageItem;
  selectedVariants: string[];
  priceAdjustments: Record<string, number>;
  nameFormat: "prefix" | "suffix";
}

// Helper function to create FormData for menu item with image
const createFormData = (menuItemData: CreateMenuItemData | UpdateMenuItemData, imageFile?: File): FormData | CreateMenuItemData | UpdateMenuItemData => {

  
  // Check if we have a valid imageFile (not empty object)
  const hasValidImageFile = imageFile && imageFile.size > 0 && imageFile.name;
  
  // Check if we have base64 image data (in the 'image' field)
  const hasBase64Image = (menuItemData as any).image && typeof (menuItemData as any).image === 'string' && (menuItemData as any).image.startsWith('data:image/');
  
  // Use FormData if we have either a valid file OR base64 image data
  if (hasValidImageFile || hasBase64Image) {
    const formData = new FormData();
    
    // Add all menu item fields to FormData
    Object.entries(menuItemData).forEach(([key, value]) => {
      if (key === 'ingredients') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'category' && typeof value === 'object' && value !== null) {
        // Handle category object by sending it as JSON string
        formData.append(key, JSON.stringify(value));
      } else if (key === 'image' && typeof value === 'string' && value.startsWith('data:image/')) {
        // Handle base64 image data - send it as imageBase64 to backend
        formData.append('imageBase64', value);
      } else if (value !== undefined && value !== null && key !== 'imageFile') {
        formData.append(key, value.toString());
      }
    });
    
    // Add the image file with a different field name (only if we have a valid file)
    if (hasValidImageFile) {
      formData.append('imageFile', imageFile);
    }
    
    return formData;
  }
  
  // Even without image, ensure category object is handled properly
  const processedData = { ...menuItemData };
  if (processedData.category && typeof processedData.category === 'object') {
    // Keep the category object as-is for JSON requests
    // The backend will handle it properly as an object
  }
  
  return processedData;
};

export const menuAPI = {
  getMenus: () => api.get<MenuItem[]>("/menu-items"),
  getMenuItem: (id: string) => api.get<MenuItem>(`/menu-items/${id}`),
  createMenuItem: (menuItemData: CreateMenuItemData, imageFile?: File) => {
    const data = createFormData(menuItemData, imageFile);
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
