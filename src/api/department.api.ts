import api from "@/lib/http";
import type { CreateDepartmentData, DepartmentFilters, DepartmentResponse, DepartmentsResponse, DepartmentStatsResponse, UpdateDepartmentData } from "@/types/department";

export const departmentAPI = {
  // List departments with pagination, isActive filter, and search
  async getDepartments(filters?: DepartmentFilters): Promise<DepartmentsResponse> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const response = await api.get<DepartmentsResponse>(`/departments${params.toString() ? `?${params.toString()}` : ""}`);
    return response.data;
  },

  // Get a single department by ID
  async getDepartment(id: number): Promise<DepartmentResponse> {
    const response = await api.get<DepartmentResponse>(`/departments/${id}`);
    return response.data;
  },

  // Create a new department
  async createDepartment(data: CreateDepartmentData): Promise<DepartmentResponse> {
    const payload: CreateDepartmentData = {
      ...data,
      code: data.code.toUpperCase()
    };
    const response = await api.post<DepartmentResponse, CreateDepartmentData>("/departments", payload);
    return response.data;
  },

  // Update an existing department
  async updateDepartment(id: number, data: UpdateDepartmentData): Promise<DepartmentResponse> {
    const payload: UpdateDepartmentData = {
      ...data,
      ...(data.code ? { code: data.code.toUpperCase() } : {})
    };
    const response = await api.put<DepartmentResponse, UpdateDepartmentData>(`/departments/${id}`, payload);
    return response.data;
  },

  // Soft delete (deactivate) a department
  async deleteDepartment(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/departments/${id}`);
    return response.data;
  },

  // Get statistics for departments
  async getDepartmentStats(): Promise<DepartmentStatsResponse> {
    const response = await api.get<DepartmentStatsResponse>("/departments/stats");
    return response.data;
  }
};

export default departmentAPI;
