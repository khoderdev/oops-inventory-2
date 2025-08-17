import api from "@/lib/http";
import type { CreateEmployeeData, CreateSettlementData, Employee, EmployeeFilters, EmployeeResponse, EmployeeSettlement, EmployeeSettlementResponse, EmployeeSettlementsResponse, EmployeesResponse, EmployeeStats, EmployeeUsage, EmployeeUsageResponse, EmployeeUsagesResponse, MarkAsPaidData, MonthlyUsageSummary, RecordUsageData, SettlementFilters, SettlementPreview, SettlementStats, UpdateEmployeeData, UpdateSettlementData, UsageFilters, UsageStats } from "@/types/employee";

// Employee Management API
export const employeeAPI = {
  // Employee CRUD operations
  async getEmployees(filters?: EmployeeFilters): Promise<EmployeesResponse> {
    const params = new URLSearchParams();
    if (filters?.department) params.append("department", filters.department);
    if (filters?.isActive !== undefined) params.append("isActive", filters.isActive.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await api.get<EmployeesResponse>(`/employees?${params.toString()}`);
    return response.data;
  },

  async getEmployee(id: number): Promise<EmployeeResponse> {
    const response = await api.get<EmployeeResponse>(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(data: CreateEmployeeData): Promise<EmployeeResponse> {
    const response = await api.post<EmployeeResponse, CreateEmployeeData>("/employees", data);
    return response.data;
  },

  async updateEmployee(id: number, data: UpdateEmployeeData): Promise<EmployeeResponse> {
    const response = await api.put<EmployeeResponse, UpdateEmployeeData>(`/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/employees/${id}`);
    return response.data;
  },

  async getEmployeeStats(): Promise<{ success: boolean; data: EmployeeStats; message: string }> {
    const response = await api.get<{ success: boolean; data: EmployeeStats; message: string }>("/employees/stats");
    return response.data;
  },

  // Employee Usage operations
  async recordUsage(data: RecordUsageData): Promise<EmployeeUsageResponse> {
    const response = await api.post<EmployeeUsageResponse, RecordUsageData>("/employees/usage", data);
    return response.data;
  },

  async getUsageHistory(filters?: UsageFilters): Promise<EmployeeUsagesResponse> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employeeId", filters.employeeId.toString());
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.usageType) params.append("usageType", filters.usageType);
    if (filters?.isSettled !== undefined) params.append("isSettled", filters.isSettled.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await api.get<EmployeeUsagesResponse>(`/employees/usage?${params.toString()}`);
    return response.data;
  },

  async getMonthlyUsageSummary(employeeId: number, month: number, year: number): Promise<{ success: boolean; data: MonthlyUsageSummary; message: string }> {
    const response = await api.get<{ success: boolean; data: MonthlyUsageSummary; message: string }>(`/employees/${employeeId}/usage/monthly?month=${month}&year=${year}`);
    return response.data;
  },

  async updateUsage(id: number, data: Partial<EmployeeUsage>): Promise<EmployeeUsageResponse> {
    const response = await api.put<EmployeeUsageResponse, Partial<EmployeeUsage>>(`/employees/usage/${id}`, data);
    return response.data;
  },

  async deleteUsage(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/employees/usage/${id}`);
    return response.data;
  },

  async getUsages(filters?: UsageFilters): Promise<EmployeeUsagesResponse> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employeeId", filters.employeeId.toString());
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.usageType) params.append("usageType", filters.usageType);
    if (filters?.isSettled !== undefined) params.append("isSettled", filters.isSettled.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await api.get<EmployeeUsagesResponse>(`/employees/usage?${params.toString()}`);
    return response.data;
  },

  async getUsageStats(filters?: Omit<UsageFilters, "page" | "limit">): Promise<{ success: boolean; data: UsageStats; message: string }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employeeId", filters.employeeId.toString());
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const response = await api.get<{ success: boolean; data: UsageStats; message: string }>(`/employees/usage/stats?${params.toString()}`);
    return response.data;
  },

  // Employee Settlement operations
  async getSettlements(filters?: SettlementFilters): Promise<EmployeeSettlementsResponse> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employeeId", filters.employeeId.toString());
    if (filters?.month) params.append("month", filters.month.toString());
    if (filters?.year) params.append("year", filters.year.toString());
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await api.get<EmployeeSettlementsResponse>(`/employees/settlements?${params.toString()}`);
    return response.data;
  },

  async getSettlement(id: number): Promise<EmployeeSettlementResponse> {
    const response = await api.get<EmployeeSettlementResponse>(`/employees/settlements/${id}`);
    return response.data;
  },

  async createSettlement(data: CreateSettlementData): Promise<EmployeeSettlementResponse> {
    const response = await api.post<EmployeeSettlementResponse, CreateSettlementData>("/employees/settlements", data);
    return response.data;
  },

  async previewSettlement(data: CreateSettlementData): Promise<{ success: boolean; data: SettlementPreview; message: string }> {
    const response = await api.post<{ success: boolean; data: SettlementPreview; message: string }, CreateSettlementData>("/employees/settlements/preview", data);
    return response.data;
  },

  async updateSettlement(id: number, data: UpdateSettlementData): Promise<EmployeeSettlementResponse> {
    const response = await api.put<EmployeeSettlementResponse, UpdateSettlementData>(`/employees/settlements/${id}`, data);
    return response.data;
  },

  async approveSettlement(id: number, notes?: string): Promise<EmployeeSettlementResponse> {
    const response = await api.put<EmployeeSettlementResponse, { notes?: string }>(`/employees/settlements/${id}/approve`, { notes });
    return response.data;
  },

  async markSettlementAsPaid(id: number, data: MarkAsPaidData): Promise<EmployeeSettlementResponse> {
    const response = await api.put<EmployeeSettlementResponse, MarkAsPaidData>(`/employees/settlements/${id}/pay`, data);
    return response.data;
  },

  async deleteSettlement(id: number, force?: boolean): Promise<{ success: boolean; message: string }> {
    const url = `/employees/settlements/${id}${force ? '?force=true' : ''}`;
    const response = await api.delete<{ success: boolean; message: string }>(url);
    return response.data;
  },

  async getPendingSettlements(): Promise<{ success: boolean; data: EmployeeSettlement[]; message: string }> {
    const response = await api.get<{ success: boolean; data: EmployeeSettlement[]; message: string }>("/employees/settlements/pending");
    return response.data;
  },

  async getSettlementStats(filters?: { year?: number; month?: number }): Promise<{ success: boolean; data: SettlementStats; message: string }> {
    const params = new URLSearchParams();
    if (filters?.year) params.append("year", filters.year.toString());
    if (filters?.month) params.append("month", filters.month.toString());

    const response = await api.get<{ success: boolean; data: SettlementStats; message: string }>(`/employees/settlements/stats?${params.toString()}`);
    return response.data;
  },

  // Add usages to an existing settlement by updating each usage record
  async addUsagesToSettlement(settlementId: number, usageIds: number[]): Promise<{ success: boolean; updated: number; failed: number }> {
    if (!Array.isArray(usageIds) || usageIds.length === 0) {
      return { success: true, updated: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      usageIds.map(id =>
        api.put<EmployeeUsageResponse, Partial<EmployeeUsage>>(`/employees/usage/${id}`, {
          settlementId,
          isSettled: true
        })
      )
    );

    const updated = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - updated;

    if (failed > 0) {
      throw new Error(`Failed to add ${failed} usage(s) to settlement`);
    }

    return { success: true, updated, failed: 0 };
  },

  // Utility functions
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(new Date(date));
  },

  formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(date));
  },

  getEmployeeFullName(employee: Employee): string {
    if (employee.user) {
      return `${employee.user.firstName} ${employee.user.lastName}`;
    }
    return employee.employeeNumber;
  },

  getDepartmentLabel(department: string): string {
    const labels: Record<string, string> = {
      kitchen: "Kitchen",
      service: "Service",
      management: "Management",
      cleaning: "Cleaning",
      security: "Security",
      other: "Other"
    };
    return labels[department] || department;
  },

  getUsageTypeLabel(usageType: string): string {
    const labels: Record<string, string> = {
      material: "Material",
      menu_item: "Menu Item",
      stock_entry: "Stock Entry"
    };
    return labels[usageType] || usageType;
  },

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: "Pending",
      approved: "Approved",
      paid: "Paid",
      disputed: "Disputed",
      cancelled: "Cancelled"
    };
    return labels[status] || status;
  },

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      disputed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  },

  calculateDiscountAmount(totalCost: number, discountPercentage: number): number {
    return totalCost * (discountPercentage / 100);
  },

  calculateFinalCost(totalCost: number, discountPercentage: number): number {
    const discountAmount = this.calculateDiscountAmount(totalCost, discountPercentage);
    return totalCost - discountAmount;
  },

  getMonthName(month: number): string {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[month - 1] || "";
  },

  getCurrentMonth(): number {
    return new Date().getMonth() + 1;
  },

  getCurrentYear(): number {
    return new Date().getFullYear();
  },

  // POS Integration helpers
  async recordPOSUsage(
    employeeId: number,
    items: Array<{
      type: "material" | "menu_item" | "stock_entry";
      itemId: number;
      itemName: string;
      quantity: number;
      unit: string;
      unitCost: number;
    }>,
    posTransactionId: string,
    notes?: string
  ): Promise<EmployeeUsageResponse[]> {
    const usagePromises = items.map(item =>
      this.recordUsage({
        employeeId,
        usageType: item.type,
        materialId: item.type === "material" ? item.itemId : undefined,
        menuItemId: item.type === "menu_item" ? item.itemId : undefined,
        stockEntryId: item.type === "stock_entry" ? item.itemId : undefined,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        posTransactionId,
        notes: notes || `POS Transaction: ${item.itemName}`
      })
    );

    return Promise.all(usagePromises);
  }
};

// Named export for dynamic import usage in components
export async function addUsagesToSettlement(settlementId: number, usageIds: number[]) {
  return employeeAPI.addUsagesToSettlement(settlementId, usageIds);
}

export default employeeAPI;
