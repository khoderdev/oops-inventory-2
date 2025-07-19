import api from "@/lib/http";
import { CreateMenuItemData, MenuItem, UpdateMenuItemData } from "@/types/inventory";

export const menuAPI = {
  getMenus: () => api.get<MenuItem[]>("/menu-items"),
  getMenuItem: (id: string) => api.get<MenuItem>(`/menu-items/${id}`),
  createMenuItem: (menuItemData: CreateMenuItemData) => api.post<MenuItem, CreateMenuItemData>("/menu-items", menuItemData),
  updateMenuItem: (id: string, menuItemData: UpdateMenuItemData) => api.put<MenuItem, UpdateMenuItemData>(`/menu-items/${id}`, menuItemData),
  deleteMenuItem: (id: string) => api.delete<null>(`/menu-items/${id}`)
};
//