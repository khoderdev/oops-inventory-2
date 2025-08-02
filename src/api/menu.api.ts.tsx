import api from "@/lib/http";
import { CreateMenuItemData, MenuItem, UpdateMenuItemData } from "@/types/inventory";

export const menuAPI = {
  getMenus: () => api.get<MenuItem[]>("/menu-items"),
  getMenuItem: (id: string) => api.get<MenuItem>(`/menu-items/${id}`),
  createMenuItem: (menuItemData: CreateMenuItemData) => api.post<MenuItem, CreateMenuItemData>("/menu-items", menuItemData),
  updateMenuItem: (id: string, menuItemData: UpdateMenuItemData) => api.put<MenuItem, UpdateMenuItemData>(`/menu-items/${id}`, menuItemData),
  deleteMenuItem: (id: string) => api.delete<null>(`/menu-items/${id}`),

  // Printer assignment methods
  getMenuItemsWithPrinters: () => api.get<MenuItem[]>("/menu-items/with-printers"),
  assignPrinter: (id: string | number, printerId: number | null) => api.patch<{ menuItem: MenuItem }, { printerId: number | null }>(`/menu-items/${id}/assign-printer`, { printerId }),
  bulkAssignPrinter: (menuItemIds: (string | number)[], printerId: number | null) => api.patch<{ updatedCount: number; menuItems: MenuItem[] }, { menuItemIds: (string | number)[]; printerId: number | null }>("/menu-items/bulk-assign-printer", { menuItemIds, printerId })
};
