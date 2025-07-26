import api from "@/lib/http";
import { Table } from "@/types/inventory";
import { CreateTableData, ReserveTableData, UpdateTableData } from "@/types/orders";

export const tablesAPI = {
  // Get all tables
  getTables: (params?: { section?: string; status?: string; includeOrders?: boolean }) => api.get<Table[]>("/tables", { params }),

  // Get specific table by ID
  getTable: (tableId: string) => api.get<Table>(`/tables/${tableId}`),

  // Create new table
  createTable: (data: CreateTableData) => api.post<Table, CreateTableData>("/tables", data),

  // Update table
  updateTable: (tableId: string, data: UpdateTableData) => api.put<Table, UpdateTableData>(`/tables/${tableId}`, data),

  // Delete table
  deleteTable: (tableId: string) => api.delete(`/tables/${tableId}`),

  // Reserve table
  reserveTable: (tableId: string, data: ReserveTableData) => api.patch<Table, ReserveTableData>(`/tables/${tableId}/reserve`, data),

  // Clear table reservation
  clearReservation: (tableId: string) => api.patch<Table, Record<string, never>>(`/tables/${tableId}/clear-reservation`, {}),

  // Mark table for cleaning
  markForCleaning: (tableId: string) => api.patch<Table, Record<string, never>>(`/tables/${tableId}/cleaning`, {}),

  // Mark table as clean
  markAsClean: (tableId: string) => api.patch<Table, Record<string, never>>(`/tables/${tableId}/clean`, {}),

  // Get table sections
  getTableSections: () => api.get<string[]>("/tables/sections")
};
