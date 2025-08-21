import { Category, CategoryFilters, CategoriesResponse, CategoryResponse, CategoryFormData, SortOrderUpdate, CategoryTypeEntity, CategoryTypeFilters, CategoryTypesResponse, CategoryTypeResponse, CategoryTypeFormData, BulkCategoryTypeRequest, BulkDeleteRequest, BulkDeleteResponse, BulkUpdateResponse } from "@/types/categories";
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

// Get categories by type (any string type)
export const getCategoriesByType = async (type: string, isActive: boolean = true): Promise<CategoriesResponse> => {
  const params = new URLSearchParams();
  if (isActive !== undefined) params.append("isActive", isActive.toString());
  const response = await api.get(`/categories/type/${type}?${params.toString()}`);
  return response.data as CategoriesResponse;
};

// Get all categories regardless of type
export const getAllCategoriesByType = async (isActive: boolean = true): Promise<CategoriesResponse> => {
  const params = new URLSearchParams();
  if (isActive !== undefined) params.append("isActive", isActive.toString());
  const response = await api.get(`/categories/type/all?${params.toString()}`);
  return response.data as CategoriesResponse;
};

// Get single category by ID
export const getCategoryById = async (id: number): Promise<CategoryResponse> => {
  const response = await api.get(`/categories/${id}`);
  const body: any = (response as any).data;
  const payload = (body?.data ?? body) as Category;
  return {
    success: true,
    data: payload
  };
};

// Create new category
export const createCategory = async (categoryData: CategoryFormData): Promise<CategoryResponse> => {
  const response = await api.post('/categories', categoryData);
  const body: any = (response as any).data;
  const payload = (body?.data ?? body) as Category;
  return {
    success: true,
    data: payload
  };
};

// Update category
export const updateCategory = async (id: number, categoryData: Partial<CategoryFormData>): Promise<CategoryResponse> => {
  const response = await api.put(`/categories/${id}`, categoryData);
  const body: any = (response as any).data;
  const payload = (body?.data ?? body) as Category;
  return {
    success: true,
    data: payload
  };
};

// Delete category
export const deleteCategory = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/categories/${id}`);
  return response.data as { success: boolean; message: string };
};

// Bulk update sort orders
export const updateSortOrders = async (categories: SortOrderUpdate[]): Promise<{ success: boolean; message: string }> => {
  const response = await api.put('/categories/sort-orders', { categories });
  return response.data as { success: boolean; message: string };
};

// Bulk delete categories
export const bulkDeleteCategories = async (deleteData: BulkDeleteRequest): Promise<BulkDeleteResponse> => {
  const response = await api.delete("/categories/bulk", { data: deleteData } as any);
  return response.data as BulkDeleteResponse;
};

// Bulk update categories
export const bulkUpdateCategories = async (ids: number[], data: Partial<Category>): Promise<BulkUpdateResponse> => {
  const response = await api.put("/categories/bulk", { ids, data });
  return response.data as BulkUpdateResponse;
};

// Get categories by specific type (for dropdowns)
export const getCategoriesForDropdown = async (type: string): Promise<{ value: string; label: string }[]> => {
  const response = await getCategoriesByType(type, true);
  return response.totalItems.map(cat => ({ value: cat.value, label: cat.name }));
};

// Get material categories (for dropdowns) - backward compatibility
export const getMaterialCategories = async (): Promise<{ value: string; label: string }[]> => {
  return getCategoriesForDropdown("materials");
};

// Get menu item categories (for dropdowns) - backward compatibility
export const getMenuItemCategories = async (): Promise<{ value: string; label: string }[]> => {
  return getCategoriesForDropdown("menu_items");
};

// Get beverage categories (for dropdowns)
export const getBeverageCategories = async (): Promise<{ value: string; label: string }[]> => {
  return getCategoriesForDropdown("beverages");
};

// ===== CATEGORY TYPES API FUNCTIONS =====

// Get all category types with filtering and pagination
export const getCategoryTypes = async (filters: CategoryTypeFilters = {}): Promise<CategoryTypesResponse> => {
  const params = new URLSearchParams();
  if (filters.type) params.append("type", filters.type);
  if (filters.categoryId) params.append("categoryId", filters.categoryId.toString());
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.fields) params.append("fields", filters.fields);
  const response = await api.get(`/categories/types?${params.toString()}`);
  return response.data as CategoryTypesResponse;
};

// Get category types by category ID
export const getCategoryTypesByCategoryId = async (categoryId: number): Promise<{ success: boolean; data: CategoryTypeEntity[] }> => {
  const response = await api.get(`/categories/types/category/${categoryId}`);
  return response.data as { success: boolean; data: CategoryTypeEntity[] };
};

// Get category types by type
export const getCategoryTypesByType = async (type: string): Promise<{ success: boolean; data: CategoryTypeEntity[] }> => {
  const response = await api.get(`/categories/types/type/${type}`);
  return response.data as { success: boolean; data: CategoryTypeEntity[] };
};

// Get single category type by ID
export const getCategoryTypeById = async (id: number): Promise<CategoryTypeResponse> => {
  const response = await api.get(`/categories/types/${id}`);
  return response.data as CategoryTypeResponse;
};

// Create new category type
export const createCategoryType = async (categoryTypeData: CategoryTypeFormData): Promise<CategoryTypeResponse> => {
  const response = await api.post("/categories/types", categoryTypeData);
  return response.data as CategoryTypeResponse;
};

// Update category type
export const updateCategoryType = async (id: number, categoryTypeData: Partial<CategoryTypeFormData>): Promise<CategoryTypeResponse> => {
  const response = await api.put(`/categories/types/${id}`, categoryTypeData);
  return response.data as CategoryTypeResponse;
};

// Delete category type
export const deleteCategoryType = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/categories/types/${id}`);
  return response.data as { success: boolean; message: string };
};

// Bulk create category types
export const bulkCreateCategoryTypes = async (categoryTypesData: BulkCategoryTypeRequest): Promise<{ success: boolean; message: string; data: CategoryTypeEntity[] }> => {
  const response = await api.post("/categories/types/bulk", categoryTypesData);
  return response.data as { success: boolean; message: string; data: CategoryTypeEntity[] };
};

// Bulk delete category types
export const bulkDeleteCategoryTypes = async (deleteData: BulkDeleteRequest): Promise<{ success: boolean; message: string; deletedCount: number }> => {
  const response = await api.delete("/categories/types/bulk", { data: deleteData } as any);
  return response.data as { success: boolean; message: string; deletedCount: number };
};

export default {
  // Category functions
  getCategories,
  getCategoriesByType,
  getAllCategoriesByType,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateSortOrders,
  bulkDeleteCategories,
  bulkUpdateCategories,
  getCategoriesForDropdown,
  getMaterialCategories,
  getMenuItemCategories,
  getBeverageCategories,

  // CategoryType functions
  getCategoryTypes,
  getCategoryTypesByCategoryId,
  getCategoryTypesByType,
  getCategoryTypeById,
  createCategoryType,
  updateCategoryType,
  deleteCategoryType,
  bulkCreateCategoryTypes,
  bulkDeleteCategoryTypes
};
