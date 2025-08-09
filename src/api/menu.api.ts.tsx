import api from "@/lib/http";
import { CreateMenuItemData, MenuItem, UpdateMenuItemData } from "@/types/inventory";

// Helper function to create FormData for menu item with image
const createFormData = (menuItemData: CreateMenuItemData | UpdateMenuItemData, imageFile?: File): FormData | CreateMenuItemData | UpdateMenuItemData => {
  if (imageFile) {
    const formData = new FormData();
    
    // Add all menu item fields to FormData
    Object.entries(menuItemData).forEach(([key, value]) => {
      if (key === 'ingredients') {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Add the image file
    formData.append('image', imageFile);
    
    return formData;
  }
  
  return menuItemData;
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
  bulkUpdateCategory: (menuItemIds: (string | number)[], category: string) => api.patch<{ updatedCount: number; menuItems: MenuItem[]; message: string }, { menuItemIds: (string | number)[]; category: string }>("/menu-items/bulk-update-category", { menuItemIds, category })
};
