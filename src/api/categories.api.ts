import { Category, CategoryFilters, CategoriesResponse, CategoryResponse, CategoryFormData, SortOrderUpdate } from "@/types/categories";
import api from "../lib/http";

// Get all categories with filtering and pagination
export const getCategories = async (filters: CategoryFilters = {}): Promise<CategoriesResponse> => {
  const params = new URLSearchParams();

  if (filters.type) params.append("type", filters.type);
  if (filters.isActive !== undefined) params.append("isActive", filters.isActive.toString());
  if (filters.search) params.append("search", filters.search);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

  const response = await api.get(`/categories?${params.toString()}`);
  return response.data as CategoriesResponse;
};

// Get categories by type (materials or menu_items)
export const getCategoriesByType = async (type: "materials" | "menu_items", isActive: boolean = true): Promise<CategoriesResponse> => {
  const params = new URLSearchParams();
  if (isActive !== undefined) params.append("isActive", isActive.toString());

  const response = await api.get(`/categories/type/${type}?${params.toString()}`);
  return response.data as CategoriesResponse;
};

// Get single category by ID
export const getCategoryById = async (id: number): Promise<CategoryResponse> => {
  const response = await api.get(`/categories/${id}`);
  return {
    success: true,
    data: response.data as Category
  };
};

// Create new category
export const createCategory = async (categoryData: CategoryFormData): Promise<CategoryResponse> => {
  const response = await api.post("/categories", categoryData);
  return {
    success: true,
    data: response.data as Category
  };
};

// Update category
export const updateCategory = async (id: number, categoryData: Partial<CategoryFormData>): Promise<CategoryResponse> => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return {
    success: true,
    data: response.data as Category
  };
};

// Delete category
export const deleteCategory = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/categories/${id}`);
  return {
    success: true,
    message: "Category deleted successfully"
  };
};

// Bulk update sort orders
export const updateSortOrders = async (categories: SortOrderUpdate[]): Promise<{ success: boolean; message: string }> => {
  const response = await api.put("/categories/sort-orders", { categories });
  return {
    success: true,
    message: "Sort orders updated successfully"
  };
};

// Get material categories (for dropdowns)
export const getMaterialCategories = async (): Promise<{ value: string; label: string }[]> => {
  const response = await getCategoriesByType("materials", true);
  return response.totalItems.map(cat => ({ value: cat.value, label: cat.name }));
};

// Get menu item categories (for dropdowns)
export const getMenuItemCategories = async (): Promise<{ value: string; label: string }[]> => {
  const response = await getCategoriesByType("menu_items", true);
  return response.totalItems.map(cat => ({ value: cat.value, label: cat.name }));
};

export default {
  getCategories,
  getCategoriesByType,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateSortOrders,
  getMaterialCategories,
  getMenuItemCategories
};
