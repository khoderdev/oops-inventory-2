import api from "@/lib/http";
import { Table } from "@/types/inventory";
import { CreateTableData, ReserveTableData, UpdateTableData } from "@/types/orders";

export const tablesAPI = {
  // Get all tables
  getTables: (params?: { section?: string; status?: string; includeOrders?: boolean }) => {
    return api.get<Table[]>('/tables', params ? { params } : undefined);
  },

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
  getTableSections: () => api.get<string[]>("/tables/sections"),

  // Transfer entire order from one table to another
  transferOrder: (data: { fromTableId: string; toTableId: string; orderId: string }) => api.post<{ message: string; order: any }, typeof data>("/tables/transfer-order", data),

  // Transfer specific items from one table to another
  transferItems: (data: { fromTableId: string; toTableId: string; itemIds: string[]; createNewOrder?: boolean }) => api.post<{ message: string; transfer: any }, typeof data>("/tables/transfer-items", data),

  // Quick create table with smart defaults
  quickCreateTable: (data: { section?: string; seats?: number; shape?: "round" | "square" | "rectangle"; customName?: string }) => api.post<{ message: string; table: Table }, typeof data>("/tables/quick-create", data),

  // Bulk create multiple tables
  bulkCreateTables: (data: {
    tables: Array<{
      number?: number;
      name?: string;
      seats?: number;
      shape?: "round" | "square" | "rectangle";
      position?: { x: number; y: number };
      section?: string;
      notes?: string;
    }>;
    section?: string;
  }) =>
    api.post<
      {
        message: string;
        created: number;
        errors: number;
        tables: Table[];
        errorDetails: string[];
      },
      typeof data
    >("/tables/bulk-create", data),

  // Rename table
  renameTable: (tableId: string, data: { name?: string; number?: number }) =>
    api.patch<
      {
        message: string;
        table: Table;
        changes: { oldName: string; newName: string; oldNumber: number; newNumber: number };
      },
      typeof data
    >(`/tables/${tableId}/rename`, data),

  // Duplicate table
  duplicateTable: (tableId: string, data?: { customName?: string; customNumber?: number }) =>
    api.post<
      {
        message: string;
        originalTable: { id: string; number: number; name: string };
        duplicateTable: Table;
      },
      typeof data
    >(`/tables/${tableId}/duplicate`, data || {}),

  // Get next available table number
  getNextTableNumber: () => api.get<{ nextNumber: number; suggestedName: string }>("/tables/next-number"),

  // Clear table (reset status and remove orders)
  clearTable: (tableId: string) => api.patch<Table, Record<string, never>>(`/tables/${tableId}/clear`, {})
};
