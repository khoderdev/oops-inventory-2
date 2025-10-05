import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { tablesAPI } from "@/api/tables.api";
import { ordersAPI } from "@/api/orders.api";
import { Table } from "@/types/inventory";
import { Order } from "@/types/orders";
import { CreateTableData, UpdateTableData, ReserveTableData } from "@/types/orders";

// ============================================================================
// STATE INTERFACE
// ============================================================================

export interface TableWithOrder extends Table {
  order?: Order;
  orderCount?: number;
  isPrinted?: boolean;
}

interface TablesState {
  // Tables data
  tables: TableWithOrder[];
  inactiveTables: Table[];
  tableDetails: Record<string, TableWithOrder>; // Cache for full table details by ID
  tablesBySection: Record<string, TableWithOrder[]>; // Tables grouped by section
  tablesByStatus: Record<Table["status"], TableWithOrder[]>; // Tables grouped by status

  // Current active/selected table
  selectedTable: TableWithOrder | null;
  selectedTableId: string | null;
  hoveredTable: TableWithOrder | null;

  // Table sections
  sections: string[];
  activeSection: string | null;

  // Table orders mapping
  tableOrders: Record<string, number>; // tableId/tableNumber -> order count
  printedTables: string[]; // Array of table IDs that have been printed

  // Loading states
  isLoading: boolean;
  isLoadingDetails: boolean;
  isLoadingInactive: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isReserving: boolean;
  isClearing: boolean;
  isTransferring: boolean;
  isBulkCreating: boolean;
  isDuplicating: boolean;

  // Error states
  error: string | null;
  detailsError: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  reserveError: string | null;
  clearError: string | null;
  transferError: string | null;
  bulkCreateError: string | null;
  duplicateError: string | null;

  // Success messages
  successMessage: string | null;
  createSuccess: string | null;
  updateSuccess: string | null;
  deleteSuccess: string | null;
  reserveSuccess: string | null;
  clearSuccess: string | null;
  transferSuccess: string | null;
  bulkCreateSuccess: string | null;
  duplicateSuccess: string | null;

  // Filters
  filters: {
    section?: string;
    status?: Table["status"];
    includeOrders?: boolean;
    isActive?: boolean;
  };

  // UI state
  isArrangeMode: boolean;
  isDragMode: boolean;
  selectedTool: "select" | "round-table" | "square-table" | "rectangular-table";
  showTablesLayout: boolean;
  showRenameModal: boolean;
  showTransferModal: boolean;
  showDeleteModal: boolean;
  showClearModal: boolean;
  showInactiveTablesModal: boolean;
  showReservationModal: boolean;
  isContextMenuOpen: boolean;

  // Drag state
  dragState: {
    isDragging: boolean;
    tableId: string;
    offset: { x: number; y: number };
    startPosition: { x: number; y: number };
  } | null;
  tempPositions: Record<string, { x: number; y: number }>;
  isUpdatingPosition: string | null;

  // Table for action (rename, delete, transfer, etc.)
  selectedTableForAction: TableWithOrder | null;
  tableToClear: TableWithOrder | null;
  tableToDelete: TableWithOrder | null;
  tableToRename: TableWithOrder | null;

  // Transfer state
  transferSourceTable: TableWithOrder | null;
  transferSourceOrder: Order | null;
  transferDestinationTable: TableWithOrder | null;

  // Inactive tables count
  inactiveTablesCount: number;

  // Popup state
  popupPosition: { x: number; y: number } | null;

  // Last operation metadata
  lastOperation: {
    type:
      | "create"
      | "update"
      | "delete"
      | "reserve"
      | "clear"
      | "transfer"
      | "bulkCreate"
      | "duplicate"
      | "rename"
      | "activate"
      | "deactivate"
      | null;
    tableId: string | null;
    timestamp: number | null;
  };

  // Next available table number
  nextTableNumber: number;
  suggestedTableName: string;

  // Bulk operations
  selectedTableIds: Set<string>;
  bulkOperationInProgress: boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: TablesState = {
  tables: [],
  inactiveTables: [],
  tableDetails: {},
  tablesBySection: {},
  tablesByStatus: {
    available: [],
    opened: [],
    reserved: [],
    cleaning: [],
  },
  selectedTable: null,
  selectedTableId: null,
  hoveredTable: null,
  sections: [],
  activeSection: null,
  tableOrders: {},
  printedTables: [],
  isLoading: false,
  isLoadingDetails: false,
  isLoadingInactive: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isReserving: false,
  isClearing: false,
  isTransferring: false,
  isBulkCreating: false,
  isDuplicating: false,
  error: null,
  detailsError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  reserveError: null,
  clearError: null,
  transferError: null,
  bulkCreateError: null,
  duplicateError: null,
  successMessage: null,
  createSuccess: null,
  updateSuccess: null,
  deleteSuccess: null,
  reserveSuccess: null,
  clearSuccess: null,
  transferSuccess: null,
  bulkCreateSuccess: null,
  duplicateSuccess: null,
  filters: {
    includeOrders: true,
    isActive: true,
  },
  isArrangeMode: false,
  isDragMode: false,
  selectedTool: "select",
  showTablesLayout: false,
  showRenameModal: false,
  showTransferModal: false,
  showDeleteModal: false,
  showClearModal: false,
  showInactiveTablesModal: false,
  showReservationModal: false,
  isContextMenuOpen: false,
  dragState: null,
  tempPositions: {},
  isUpdatingPosition: null,
  selectedTableForAction: null,
  tableToClear: null,
  tableToDelete: null,
  tableToRename: null,
  transferSourceTable: null,
  transferSourceOrder: null,
  transferDestinationTable: null,
  inactiveTablesCount: 0,
  popupPosition: null,
  lastOperation: {
    type: null,
    tableId: null,
    timestamp: null,
  },
  nextTableNumber: 1,
  suggestedTableName: "Table 1",
  selectedTableIds: new Set(),
  bulkOperationInProgress: false,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Fetch all tables with optional filters
 */
export const fetchTables = createAsyncThunk(
  "tables/fetchTables",
  async (
    params: {
      section?: string;
      status?: Table["status"];
      includeOrders?: boolean;
      isActive?: boolean;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.getTables(params);
      
      // Handle various response structures
      let tables: any[] = [];
      if (Array.isArray(response)) {
        tables = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        const responseData = (response as any).data;
        if (Array.isArray(responseData)) {
          tables = responseData;
        } else if (responseData && typeof responseData === 'object') {
          if ('data' in responseData && Array.isArray(responseData.data)) {
            tables = responseData.data;
          } else if ('tables' in responseData && Array.isArray(responseData.tables)) {
            tables = responseData.tables;
          }
        }
      }
      
      console.log("📊 [fetchTables] Processed tables:", tables.length);
      return tables;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch tables");
    }
  }
);

/**
 * Fetch inactive tables
 */
export const fetchInactiveTables = createAsyncThunk(
  "tables/fetchInactiveTables",
  async (_, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.getTables({ isActive: false });
      
      // Handle various response structures
      let tables: any[] = [];
      if (Array.isArray(response)) {
        tables = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        const responseData = (response as any).data;
        if (Array.isArray(responseData)) {
          tables = responseData;
        } else if (responseData && typeof responseData === 'object') {
          if ('data' in responseData && Array.isArray(responseData.data)) {
            tables = responseData.data;
          } else if ('tables' in responseData && Array.isArray(responseData.tables)) {
            tables = responseData.tables;
          }
        }
      }
      
      console.log("📊 [fetchInactiveTables] Processed tables:", tables.length);
      return tables;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch inactive tables");
    }
  }
);

/**
 * Fetch single table by ID
 */
export const fetchTableById = createAsyncThunk(
  "tables/fetchTableById",
  async (tableId: string, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.getTable(tableId);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch table");
    }
  }
);

/**
 * Create new table
 */
export const createTable = createAsyncThunk(
  "tables/createTable",
  async (data: CreateTableData, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.createTable(data);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create table");
    }
  }
);

/**
 * Quick create table with smart defaults
 */
export const quickCreateTable = createAsyncThunk(
  "tables/quickCreateTable",
  async (
    data: {
      section?: string;
      seats?: number;
      shape?: "round" | "square" | "rectangle";
      customName?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.quickCreateTable(data);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to quick create table");
    }
  }
);

/**
 * Bulk create multiple tables
 */
export const bulkCreateTables = createAsyncThunk(
  "tables/bulkCreateTables",
  async (
    data: {
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
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.bulkCreateTables(data);
      return {
        tables: response.data?.tables || [],
        created: response.data?.created || 0,
        errors: response.data?.errors || 0,
        errorDetails: response.data?.errorDetails || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to bulk create tables");
    }
  }
);

/**
 * Update table
 */
export const updateTable = createAsyncThunk(
  "tables/updateTable",
  async (
    { tableId, data }: { tableId: string; data: UpdateTableData },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.updateTable(tableId, data);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update table");
    }
  }
);

/**
 * Update table position
 */
export const updateTablePosition = createAsyncThunk(
  "tables/updateTablePosition",
  async (
    { tableId, position }: { tableId: string; position: { x: number; y: number } },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.updateTable(tableId, { position });
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update table position");
    }
  }
);

/**
 * Rename table
 */
export const renameTable = createAsyncThunk(
  "tables/renameTable",
  async (
    { tableId, data }: { tableId: string; data: { name?: string; number?: number } },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.renameTable(tableId, data);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to rename table");
    }
  }
);

/**
 * Duplicate table
 */
export const duplicateTable = createAsyncThunk(
  "tables/duplicateTable",
  async (
    {
      tableId,
      data,
    }: { tableId: string; data?: { customName?: string; customNumber?: number } },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.duplicateTable(tableId, data);
      const table = response.data?.duplicateTable || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to duplicate table");
    }
  }
);

/**
 * Delete table
 */
export const deleteTable = createAsyncThunk(
  "tables/deleteTable",
  async (tableId: string, { rejectWithValue }) => {
    try {
      await tablesAPI.deleteTable(tableId);
      return tableId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete table");
    }
  }
);

/**
 * Reserve table
 */
export const reserveTable = createAsyncThunk(
  "tables/reserveTable",
  async (
    { tableId, data }: { tableId: string; data: ReserveTableData },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.reserveTable(tableId, data);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to reserve table");
    }
  }
);

/**
 * Clear table reservation
 */
export const clearTableReservation = createAsyncThunk(
  "tables/clearTableReservation",
  async (tableId: string, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.clearReservation(tableId);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to clear reservation");
    }
  }
);

/**
 * Clear table (reset status and remove orders)
 */
export const clearTable = createAsyncThunk(
  "tables/clearTable",
  async (tableId: string, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.clearTable(tableId);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to clear table");
    }
  }
);

/**
 * Mark table for cleaning
 */
export const markTableForCleaning = createAsyncThunk(
  "tables/markTableForCleaning",
  async (tableId: string, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.markForCleaning(tableId);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark table for cleaning");
    }
  }
);

/**
 * Mark table as clean
 */
export const markTableAsClean = createAsyncThunk(
  "tables/markTableAsClean",
  async (tableId: string, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.markAsClean(tableId);
      const table = response.data?.table || response.data || response;
      return table;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark table as clean");
    }
  }
);

/**
 * Transfer entire order from one table to another
 */
export const transferOrder = createAsyncThunk(
  "tables/transferOrder",
  async (
    data: { fromTableId: string; toTableId: string; orderId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.transferOrder(data);
      return {
        message: response.data?.message || "Order transferred successfully",
        order: response.data?.order,
        fromTableId: data.fromTableId,
        toTableId: data.toTableId,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to transfer order");
    }
  }
);

/**
 * Transfer specific items from one table to another
 */
export const transferItems = createAsyncThunk(
  "tables/transferItems",
  async (
    data: {
      fromTableId: string;
      toTableId: string;
      itemIds: string[];
      createNewOrder?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await tablesAPI.transferItems(data);
      return {
        message: response.data?.message || "Items transferred successfully",
        transfer: response.data?.transfer,
        fromTableId: data.fromTableId,
        toTableId: data.toTableId,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to transfer items");
    }
  }
);

/**
 * Fetch table sections
 */
export const fetchTableSections = createAsyncThunk(
  "tables/fetchTableSections",
  async (_, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.getTableSections();
      const sections = Array.isArray(response) ? response : response.data || [];
      return sections;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch table sections");
    }
  }
);

/**
 * Get next available table number
 */
export const fetchNextTableNumber = createAsyncThunk(
  "tables/fetchNextTableNumber",
  async (_, { rejectWithValue }) => {
    try {
      const response = await tablesAPI.getNextTableNumber();
      return {
        nextNumber: response.data?.nextNumber || 1,
        suggestedName: response.data?.suggestedName || "Table 1",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch next table number"
      );
    }
  }
);

/**
 * Fetch order for a specific table
 */
export const fetchTableOrder = createAsyncThunk(
  "tables/fetchTableOrder",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrder(orderId);
      const responseData = response.data as { data?: any } | any;
      const order = responseData?.data || responseData || response;
      return order;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch table order");
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const tablesSlice = createSlice({
  name: "tables",
  initialState,
  reducers: {
    // ========================================================================
    // UI STATE ACTIONS
    // ========================================================================

    setSelectedTable: (state, action: PayloadAction<TableWithOrder | null>) => {
      state.selectedTable = action.payload;
      state.selectedTableId = action.payload?.id || null;
    },

    setHoveredTable: (state, action: PayloadAction<TableWithOrder | null>) => {
      state.hoveredTable = action.payload;
    },

    setPopupPosition: (state, action: PayloadAction<{ x: number; y: number } | null>) => {
      state.popupPosition = action.payload;
    },

    setActiveSection: (state, action: PayloadAction<string | null>) => {
      state.activeSection = action.payload;
    },

    setFilters: (
      state,
      action: PayloadAction<{
        section?: string;
        status?: Table["status"];
        includeOrders?: boolean;
        isActive?: boolean;
      }>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = {
        includeOrders: true,
        isActive: true,
      };
    },

    // ========================================================================
    // ARRANGE MODE ACTIONS
    // ========================================================================

    setArrangeMode: (state, action: PayloadAction<boolean>) => {
      state.isArrangeMode = action.payload;
      if (!action.payload) {
        state.isDragMode = false;
        state.selectedTool = "select";
        state.dragState = null;
        state.tempPositions = {};
      }
    },

    setDragMode: (state, action: PayloadAction<boolean>) => {
      state.isDragMode = action.payload;
      if (action.payload) {
        state.selectedTool = "select";
      }
    },

    setSelectedTool: (
      state,
      action: PayloadAction<"select" | "round-table" | "square-table" | "rectangular-table">
    ) => {
      state.selectedTool = action.payload;
    },

    // ========================================================================
    // DRAG STATE ACTIONS
    // ========================================================================

    setDragState: (
      state,
      action: PayloadAction<{
        isDragging: boolean;
        tableId: string;
        offset: { x: number; y: number };
        startPosition: { x: number; y: number };
      } | null>
    ) => {
      state.dragState = action.payload;
    },

    setTempPosition: (
      state,
      action: PayloadAction<{ tableId: string; position: { x: number; y: number } }>
    ) => {
      state.tempPositions[action.payload.tableId] = action.payload.position;
    },

    clearTempPosition: (state, action: PayloadAction<string>) => {
      delete state.tempPositions[action.payload];
    },

    clearAllTempPositions: (state) => {
      state.tempPositions = {};
    },

    setIsUpdatingPosition: (state, action: PayloadAction<string | null>) => {
      state.isUpdatingPosition = action.payload;
    },

    // ========================================================================
    // MODAL STATE ACTIONS
    // ========================================================================

    setShowTablesLayout: (state, action: PayloadAction<boolean>) => {
      state.showTablesLayout = action.payload;
    },

    setShowRenameModal: (state, action: PayloadAction<boolean>) => {
      state.showRenameModal = action.payload;
    },

    setShowTransferModal: (state, action: PayloadAction<boolean>) => {
      state.showTransferModal = action.payload;
    },

    setShowDeleteModal: (state, action: PayloadAction<boolean>) => {
      state.showDeleteModal = action.payload;
    },

    setShowClearModal: (state, action: PayloadAction<boolean>) => {
      state.showClearModal = action.payload;
    },

    setShowInactiveTablesModal: (state, action: PayloadAction<boolean>) => {
      state.showInactiveTablesModal = action.payload;
    },

    setShowReservationModal: (state, action: PayloadAction<boolean>) => {
      state.showReservationModal = action.payload;
    },

    setIsContextMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isContextMenuOpen = action.payload;
      if (action.payload) {
        // Clear hover state when context menu opens
        state.hoveredTable = null;
        state.popupPosition = null;
      }
    },

    // ========================================================================
    // TABLE FOR ACTION ACTIONS
    // ========================================================================

    setSelectedTableForAction: (state, action: PayloadAction<TableWithOrder | null>) => {
      state.selectedTableForAction = action.payload;
    },

    setTableToClear: (state, action: PayloadAction<TableWithOrder | null>) => {
      state.tableToClear = action.payload;
    },

    setTableToDelete: (state, action: PayloadAction<TableWithOrder | null>) => {
      state.tableToDelete = action.payload;
    },

    setTableToRename: (state, action: PayloadAction<TableWithOrder | null>) => {
      state.tableToRename = action.payload;
    },

    // ========================================================================
    // TRANSFER STATE ACTIONS
    // ========================================================================

    setTransferSourceTable: (state, action: PayloadAction<TableWithOrder | null>) => {
      state.transferSourceTable = action.payload;
    },

    setTransferSourceOrder: (state, action: PayloadAction<Order | null>) => {
      state.transferSourceOrder = action.payload;
    },

    setTransferDestinationTable: (state, action: PayloadAction<TableWithOrder | null>) => {
      state.transferDestinationTable = action.payload;
    },

    clearTransferState: (state) => {
      state.transferSourceTable = null;
      state.transferSourceOrder = null;
      state.transferDestinationTable = null;
    },

    // ========================================================================
    // TABLE ORDERS MAPPING ACTIONS
    // ========================================================================

    setTableOrders: (state, action: PayloadAction<Record<string, number>>) => {
      state.tableOrders = action.payload;
    },

    updateTableOrderCount: (
      state,
      action: PayloadAction<{ tableId: string; count: number }>
    ) => {
      state.tableOrders[action.payload.tableId] = action.payload.count;
    },

    clearTableOrderCount: (state, action: PayloadAction<string>) => {
      delete state.tableOrders[action.payload];
    },

    // ========================================================================
    // PRINTED TABLES ACTIONS
    // ========================================================================

    setPrintedTables: (state, action: PayloadAction<string[]>) => {
      state.printedTables = action.payload;
    },

    addPrintedTable: (state, action: PayloadAction<string>) => {
      if (!state.printedTables.includes(action.payload)) {
        state.printedTables.push(action.payload);
      }
    },

    removePrintedTable: (state, action: PayloadAction<string>) => {
      state.printedTables = state.printedTables.filter((id) => id !== action.payload);
    },

    clearPrintedTables: (state) => {
      state.printedTables = [];
    },

    // ========================================================================
    // BULK SELECTION ACTIONS
    // ========================================================================

    toggleTableSelection: (state, action: PayloadAction<string>) => {
      const tableId = action.payload;
      const newSet = new Set(state.selectedTableIds);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      state.selectedTableIds = newSet;
    },

    selectAllTables: (state) => {
      state.selectedTableIds = new Set(state.tables.map((t) => t.id));
    },

    clearTableSelection: (state) => {
      state.selectedTableIds = new Set();
    },

    // ========================================================================
    // ERROR & SUCCESS MESSAGE ACTIONS
    // ========================================================================

    clearError: (state) => {
      state.error = null;
      state.detailsError = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
      state.reserveError = null;
      state.clearError = null;
      state.transferError = null;
      state.bulkCreateError = null;
      state.duplicateError = null;
    },

    clearSuccessMessage: (state) => {
      state.successMessage = null;
      state.createSuccess = null;
      state.updateSuccess = null;
      state.deleteSuccess = null;
      state.reserveSuccess = null;
      state.clearSuccess = null;
      state.transferSuccess = null;
      state.bulkCreateSuccess = null;
      state.duplicateSuccess = null;
    },

    // ========================================================================
    // DIRECT STATE UPDATES (for optimistic updates)
    // ========================================================================

    updateTableInState: (state, action: PayloadAction<TableWithOrder>) => {
      const index = state.tables.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tables[index] = action.payload;
      }
      // Update cache
      state.tableDetails[action.payload.id] = action.payload;
      // Update selected table if it's the same
      if (state.selectedTable?.id === action.payload.id) {
        state.selectedTable = action.payload;
      }
    },

    removeTableFromState: (state, action: PayloadAction<string>) => {
      state.tables = state.tables.filter((t) => t.id !== action.payload);
      delete state.tableDetails[action.payload];
      if (state.selectedTable?.id === action.payload) {
        state.selectedTable = null;
        state.selectedTableId = null;
      }
    },

    addTableToState: (state, action: PayloadAction<TableWithOrder>) => {
      state.tables.push(action.payload);
      state.tableDetails[action.payload.id] = action.payload;
    },

    // ========================================================================
    // RESET STATE
    // ========================================================================

    resetTablesState: () => initialState,
  },

  extraReducers: (builder) => {
    // ========================================================================
    // FETCH TABLES
    // ========================================================================
    builder
      .addCase(fetchTables.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tables = action.payload;
        state.error = null;

        // Group tables by section
        const groupedBySection: Record<string, TableWithOrder[]> = {};
        action.payload.forEach((table) => {
          const section = table.section || "default";
          if (!groupedBySection[section]) {
            groupedBySection[section] = [];
          }
          groupedBySection[section].push(table);
        });
        state.tablesBySection = groupedBySection;

        // Group tables by status
        state.tablesByStatus = {
          available: action.payload.filter((t) => t.status === "available"),
          opened: action.payload.filter((t) => t.status === "opened"),
          reserved: action.payload.filter((t) => t.status === "reserved"),
          cleaning: action.payload.filter((t) => t.status === "cleaning"),
        };

        // Extract unique sections
        state.sections = Array.from(
          new Set(action.payload.map((t) => t.section).filter(Boolean))
        ) as string[];

        // Update table orders mapping
        const ordersMapping: Record<string, number> = {};
        action.payload.forEach((table) => {
          if (table.currentOrder) {
            ordersMapping[table.id] = table.currentOrder.itemCount || 0;
            ordersMapping[table.number.toString()] = table.currentOrder.itemCount || 0;
          }
        });
        state.tableOrders = ordersMapping;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // FETCH INACTIVE TABLES
    // ========================================================================
    builder
      .addCase(fetchInactiveTables.pending, (state) => {
        state.isLoadingInactive = true;
        state.error = null;
      })
      .addCase(fetchInactiveTables.fulfilled, (state, action) => {
        state.isLoadingInactive = false;
        state.inactiveTables = action.payload;
        state.inactiveTablesCount = action.payload.length;
        state.error = null;
      })
      .addCase(fetchInactiveTables.rejected, (state, action) => {
        state.isLoadingInactive = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // FETCH TABLE BY ID
    // ========================================================================
    builder
      .addCase(fetchTableById.pending, (state) => {
        state.isLoadingDetails = true;
        state.detailsError = null;
      })
      .addCase(fetchTableById.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        const table = action.payload as TableWithOrder;
        state.tableDetails[table.id] = table;
        state.detailsError = null;
      })
      .addCase(fetchTableById.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.detailsError = action.payload as string;
      });

    // ========================================================================
    // CREATE TABLE
    // ========================================================================
    builder
      .addCase(createTable.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTable.fulfilled, (state, action) => {
        state.isCreating = false;
        const table = action.payload as TableWithOrder;
        state.tables.push(table);
        state.tableDetails[table.id] = table;
        state.createSuccess = `Table ${table.number} created successfully`;
        state.lastOperation = {
          type: "create",
          tableId: table.id,
          timestamp: Date.now(),
        };
      })
      .addCase(createTable.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload as string;
      });

    // ========================================================================
    // QUICK CREATE TABLE
    // ========================================================================
    builder
      .addCase(quickCreateTable.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(quickCreateTable.fulfilled, (state, action) => {
        state.isCreating = false;
        const table = action.payload as TableWithOrder;
        state.tables.push(table);
        state.tableDetails[table.id] = table;
        state.createSuccess = `Table ${table.number} created successfully`;
        state.lastOperation = {
          type: "create",
          tableId: table.id,
          timestamp: Date.now(),
        };
      })
      .addCase(quickCreateTable.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload as string;
      });

    // ========================================================================
    // BULK CREATE TABLES
    // ========================================================================
    builder
      .addCase(bulkCreateTables.pending, (state) => {
        state.isBulkCreating = true;
        state.bulkCreateError = null;
        state.bulkOperationInProgress = true;
      })
      .addCase(bulkCreateTables.fulfilled, (state, action) => {
        state.isBulkCreating = false;
        state.bulkOperationInProgress = false;
        const tables = action.payload.tables as TableWithOrder[];
        state.tables.push(...tables);
        tables.forEach((table) => {
          state.tableDetails[table.id] = table;
        });
        state.bulkCreateSuccess = `${action.payload.created} tables created successfully`;
        if (action.payload.errors > 0) {
          state.bulkCreateError = `${action.payload.errors} tables failed to create`;
        }
        state.lastOperation = {
          type: "bulkCreate",
          tableId: null,
          timestamp: Date.now(),
        };
      })
      .addCase(bulkCreateTables.rejected, (state, action) => {
        state.isBulkCreating = false;
        state.bulkOperationInProgress = false;
        state.bulkCreateError = action.payload as string;
      });

    // ========================================================================
    // UPDATE TABLE
    // ========================================================================
    builder
      .addCase(updateTable.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateTable.fulfilled, (state, action) => {
        state.isUpdating = false;
        const table = action.payload as TableWithOrder;
        const index = state.tables.findIndex((t) => t.id === table.id);
        if (index !== -1) {
          state.tables[index] = table;
        }
        state.tableDetails[table.id] = table;
        if (state.selectedTable?.id === table.id) {
          state.selectedTable = table;
        }
        state.updateSuccess = `Table ${table.number} updated successfully`;
        state.lastOperation = {
          type: "update",
          tableId: table.id,
          timestamp: Date.now(),
        };
      })
      .addCase(updateTable.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // ========================================================================
    // UPDATE TABLE POSITION
    // ========================================================================
    builder
      .addCase(updateTablePosition.pending, (state, action) => {
        state.isUpdatingPosition = action.meta.arg.tableId;
      })
      .addCase(updateTablePosition.fulfilled, (state, action) => {
        state.isUpdatingPosition = null;
        const table = action.payload as TableWithOrder;
        const index = state.tables.findIndex((t) => t.id === table.id);
        if (index !== -1) {
          state.tables[index] = table;
        }
        state.tableDetails[table.id] = table;
        if (state.selectedTable?.id === table.id) {
          state.selectedTable = table;
        }
        // Clear temp position
        delete state.tempPositions[table.id];
      })
      .addCase(updateTablePosition.rejected, (state, action) => {
        state.isUpdatingPosition = null;
        state.updateError = action.payload as string;
        // Clear temp position on error
        if (action.meta.arg.tableId) {
          delete state.tempPositions[action.meta.arg.tableId];
        }
      });

    // ========================================================================
    // RENAME TABLE
    // ========================================================================
    builder
      .addCase(renameTable.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(renameTable.fulfilled, (state, action) => {
        state.isUpdating = false;
        const table = action.payload as TableWithOrder;
        const index = state.tables.findIndex((t) => t.id === table.id);
        if (index !== -1) {
          state.tables[index] = table;
        }
        state.tableDetails[table.id] = table;
        if (state.selectedTable?.id === table.id) {
          state.selectedTable = table;
        }
        state.updateSuccess = `Table renamed successfully`;
        state.lastOperation = {
          type: "rename",
          tableId: table.id,
          timestamp: Date.now(),
        };
      })
      .addCase(renameTable.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // ========================================================================
    // DUPLICATE TABLE
    // ========================================================================
    builder
      .addCase(duplicateTable.pending, (state) => {
        state.isDuplicating = true;
        state.duplicateError = null;
      })
      .addCase(duplicateTable.fulfilled, (state, action) => {
        state.isDuplicating = false;
        const table = action.payload as TableWithOrder;
        state.tables.push(table);
        state.tableDetails[table.id] = table;
        state.duplicateSuccess = `Table ${table.number} duplicated successfully`;
        state.lastOperation = {
          type: "duplicate",
          tableId: table.id,
          timestamp: Date.now(),
        };
      })
      .addCase(duplicateTable.rejected, (state, action) => {
        state.isDuplicating = false;
        state.duplicateError = action.payload as string;
      });

    // ========================================================================
    // DELETE TABLE
    // ========================================================================
    builder
      .addCase(deleteTable.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.tables = state.tables.filter((t) => t.id !== action.payload);
        delete state.tableDetails[action.payload];
        if (state.selectedTable?.id === action.payload) {
          state.selectedTable = null;
          state.selectedTableId = null;
        }
        state.deleteSuccess = "Table deleted successfully";
        state.lastOperation = {
          type: "delete",
          tableId: action.payload,
          timestamp: Date.now(),
        };
      })
      .addCase(deleteTable.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      });

    // ========================================================================
    // RESERVE TABLE
    // ========================================================================
    builder
      .addCase(reserveTable.pending, (state) => {
        state.isReserving = true;
        state.reserveError = null;
      })
      .addCase(reserveTable.fulfilled, (state, action) => {
        state.isReserving = false;
        const table = action.payload as TableWithOrder;
        const index = state.tables.findIndex((t) => t.id === table.id);
        if (index !== -1) {
          state.tables[index] = table;
        }
        state.tableDetails[table.id] = table;
        if (state.selectedTable?.id === table.id) {
          state.selectedTable = table;
        }
        state.reserveSuccess = `Table ${table.number} reserved successfully`;
        state.lastOperation = {
          type: "reserve",
          tableId: table.id,
          timestamp: Date.now(),
        };
      })
      .addCase(reserveTable.rejected, (state, action) => {
        state.isReserving = false;
        state.reserveError = action.payload as string;
      });

    // ========================================================================
    // CLEAR TABLE RESERVATION
    // ========================================================================
    builder
      .addCase(clearTableReservation.pending, (state) => {
        state.isClearing = true;
        state.clearError = null;
      })
      .addCase(clearTableReservation.fulfilled, (state, action) => {
        state.isClearing = false;
        const table = action.payload as TableWithOrder;
        const index = state.tables.findIndex((t) => t.id === table.id);
        if (index !== -1) {
          state.tables[index] = table;
        }
        state.tableDetails[table.id] = table;
        if (state.selectedTable?.id === table.id) {
          state.selectedTable = table;
        }
        state.clearSuccess = `Table ${table.number} reservation cleared`;
        state.lastOperation = {
          type: "clear",
          tableId: table.id,
          timestamp: Date.now(),
        };
      })
      .addCase(clearTableReservation.rejected, (state, action) => {
        state.isClearing = false;
        state.clearError = action.payload as string;
      });

    // ========================================================================
    // CLEAR TABLE
    // ========================================================================
    builder
      .addCase(clearTable.pending, (state) => {
        state.isClearing = true;
        state.clearError = null;
      })
      .addCase(clearTable.fulfilled, (state, action) => {
        state.isClearing = false;
        const table = action.payload as TableWithOrder;
        const index = state.tables.findIndex((t) => t.id === table.id);
        if (index !== -1) {
          state.tables[index] = table;
        }
        state.tableDetails[table.id] = table;
        if (state.selectedTable?.id === table.id) {
          state.selectedTable = table;
        }
        // Clear table order count
        delete state.tableOrders[table.id];
        delete state.tableOrders[table.number.toString()];
        state.clearSuccess = `Table ${table.number} cleared successfully`;
        state.lastOperation = {
          type: "clear",
          tableId: table.id,
          timestamp: Date.now(),
        };
      })
      .addCase(clearTable.rejected, (state, action) => {
        state.isClearing = false;
        state.clearError = action.payload as string;
      });

    // ========================================================================
    // MARK TABLE FOR CLEANING
    // ========================================================================
    builder
      .addCase(markTableForCleaning.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(markTableForCleaning.fulfilled, (state, action) => {
        state.isUpdating = false;
        const table = action.payload as TableWithOrder;
        const index = state.tables.findIndex((t) => t.id === table.id);
        if (index !== -1) {
          state.tables[index] = table;
        }
        state.tableDetails[table.id] = table;
        if (state.selectedTable?.id === table.id) {
          state.selectedTable = table;
        }
        state.updateSuccess = `Table ${table.number} marked for cleaning`;
      })
      .addCase(markTableForCleaning.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // ========================================================================
    // MARK TABLE AS CLEAN
    // ========================================================================
    builder
      .addCase(markTableAsClean.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(markTableAsClean.fulfilled, (state, action) => {
        state.isUpdating = false;
        const table = action.payload as TableWithOrder;
        const index = state.tables.findIndex((t) => t.id === table.id);
        if (index !== -1) {
          state.tables[index] = table;
        }
        state.tableDetails[table.id] = table;
        if (state.selectedTable?.id === table.id) {
          state.selectedTable = table;
        }
        state.updateSuccess = `Table ${table.number} marked as clean`;
      })
      .addCase(markTableAsClean.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // ========================================================================
    // TRANSFER ORDER
    // ========================================================================
    builder
      .addCase(transferOrder.pending, (state) => {
        state.isTransferring = true;
        state.transferError = null;
      })
      .addCase(transferOrder.fulfilled, (state, action) => {
        state.isTransferring = false;
        state.transferSuccess = action.payload.message;
        state.lastOperation = {
          type: "transfer",
          tableId: action.payload.toTableId,
          timestamp: Date.now(),
        };
        // Clear transfer state
        state.transferSourceTable = null;
        state.transferSourceOrder = null;
        state.transferDestinationTable = null;
      })
      .addCase(transferOrder.rejected, (state, action) => {
        state.isTransferring = false;
        state.transferError = action.payload as string;
      });

    // ========================================================================
    // TRANSFER ITEMS
    // ========================================================================
    builder
      .addCase(transferItems.pending, (state) => {
        state.isTransferring = true;
        state.transferError = null;
      })
      .addCase(transferItems.fulfilled, (state, action) => {
        state.isTransferring = false;
        state.transferSuccess = action.payload.message;
        state.lastOperation = {
          type: "transfer",
          tableId: action.payload.toTableId,
          timestamp: Date.now(),
        };
      })
      .addCase(transferItems.rejected, (state, action) => {
        state.isTransferring = false;
        state.transferError = action.payload as string;
      });

    // ========================================================================
    // FETCH TABLE SECTIONS
    // ========================================================================
    builder
      .addCase(fetchTableSections.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTableSections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sections = action.payload;
      })
      .addCase(fetchTableSections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // FETCH NEXT TABLE NUMBER
    // ========================================================================
    builder
      .addCase(fetchNextTableNumber.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNextTableNumber.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nextTableNumber = action.payload.nextNumber;
        state.suggestedTableName = action.payload.suggestedName;
      })
      .addCase(fetchNextTableNumber.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // FETCH TABLE ORDER
    // ========================================================================
    builder
      .addCase(fetchTableOrder.pending, (state) => {
        state.isLoadingDetails = true;
      })
      .addCase(fetchTableOrder.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        // Store order in transfer state if needed
        state.transferSourceOrder = action.payload;
      })
      .addCase(fetchTableOrder.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.detailsError = action.payload as string;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  // UI State
  setSelectedTable,
  setHoveredTable,
  setPopupPosition,
  setActiveSection,
  setFilters,
  clearFilters,

  // Arrange Mode
  setArrangeMode,
  setDragMode,
  setSelectedTool,

  // Drag State
  setDragState,
  setTempPosition,
  clearTempPosition,
  clearAllTempPositions,
  setIsUpdatingPosition,

  // Modal State
  setShowTablesLayout,
  setShowRenameModal,
  setShowTransferModal,
  setShowDeleteModal,
  setShowClearModal,
  setShowInactiveTablesModal,
  setShowReservationModal,
  setIsContextMenuOpen,

  // Table for Action
  setSelectedTableForAction,
  setTableToClear,
  setTableToDelete,
  setTableToRename,

  // Transfer State
  setTransferSourceTable,
  setTransferSourceOrder,
  setTransferDestinationTable,
  clearTransferState,

  // Table Orders Mapping
  setTableOrders,
  updateTableOrderCount,
  clearTableOrderCount,

  // Printed Tables
  setPrintedTables,
  addPrintedTable,
  removePrintedTable,
  clearPrintedTables,

  // Bulk Selection
  toggleTableSelection,
  selectAllTables,
  clearTableSelection,

  // Error & Success
  clearError,
  clearSuccessMessage,

  // Direct State Updates
  updateTableInState,
  removeTableFromState,
  addTableToState,

  // Reset
  resetTablesState,
} = tablesSlice.actions;

export default tablesSlice.reducer;
