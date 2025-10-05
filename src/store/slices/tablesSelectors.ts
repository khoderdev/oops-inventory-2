import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { TableWithOrder } from "./tablesSlice";
import { Table } from "@/types/inventory";

// ============================================================================
// BASE SELECTORS
// ============================================================================

export const selectTablesState = (state: RootState) => state.tables;

export const selectTables = (state: RootState) => state.tables.tables;
export const selectInactiveTables = (state: RootState) => state.tables.inactiveTables;
export const selectTableDetails = (state: RootState) => state.tables.tableDetails;
export const selectTablesBySection = (state: RootState) => state.tables.tablesBySection;
export const selectTablesByStatus = (state: RootState) => state.tables.tablesByStatus;

export const selectSelectedTable = (state: RootState) => state.tables.selectedTable;
export const selectSelectedTableId = (state: RootState) => state.tables.selectedTableId;
export const selectHoveredTable = (state: RootState) => state.tables.hoveredTable;

export const selectSections = (state: RootState) => state.tables.sections;
export const selectActiveSection = (state: RootState) => state.tables.activeSection;

export const selectTableOrders = (state: RootState) => state.tables.tableOrders;
export const selectPrintedTables = (state: RootState) => state.tables.printedTables;

// Loading states
export const selectIsLoading = (state: RootState) => state.tables.isLoading;
export const selectIsLoadingDetails = (state: RootState) => state.tables.isLoadingDetails;
export const selectIsLoadingInactive = (state: RootState) => state.tables.isLoadingInactive;
export const selectIsCreating = (state: RootState) => state.tables.isCreating;
export const selectIsUpdating = (state: RootState) => state.tables.isUpdating;
export const selectIsDeleting = (state: RootState) => state.tables.isDeleting;
export const selectIsReserving = (state: RootState) => state.tables.isReserving;
export const selectIsClearing = (state: RootState) => state.tables.isClearing;
export const selectIsTransferring = (state: RootState) => state.tables.isTransferring;
export const selectIsBulkCreating = (state: RootState) => state.tables.isBulkCreating;
export const selectIsDuplicating = (state: RootState) => state.tables.isDuplicating;

// Error states
export const selectError = (state: RootState) => state.tables.error;
export const selectDetailsError = (state: RootState) => state.tables.detailsError;
export const selectCreateError = (state: RootState) => state.tables.createError;
export const selectUpdateError = (state: RootState) => state.tables.updateError;
export const selectDeleteError = (state: RootState) => state.tables.deleteError;
export const selectReserveError = (state: RootState) => state.tables.reserveError;
export const selectClearError = (state: RootState) => state.tables.clearError;
export const selectTransferError = (state: RootState) => state.tables.transferError;
export const selectBulkCreateError = (state: RootState) => state.tables.bulkCreateError;
export const selectDuplicateError = (state: RootState) => state.tables.duplicateError;

// Success messages
export const selectSuccessMessage = (state: RootState) => state.tables.successMessage;
export const selectCreateSuccess = (state: RootState) => state.tables.createSuccess;
export const selectUpdateSuccess = (state: RootState) => state.tables.updateSuccess;
export const selectDeleteSuccess = (state: RootState) => state.tables.deleteSuccess;
export const selectReserveSuccess = (state: RootState) => state.tables.reserveSuccess;
export const selectClearSuccess = (state: RootState) => state.tables.clearSuccess;
export const selectTransferSuccess = (state: RootState) => state.tables.transferSuccess;
export const selectBulkCreateSuccess = (state: RootState) => state.tables.bulkCreateSuccess;
export const selectDuplicateSuccess = (state: RootState) => state.tables.duplicateSuccess;

// Filters
export const selectFilters = (state: RootState) => state.tables.filters;

// UI state
export const selectIsArrangeMode = (state: RootState) => state.tables.isArrangeMode;
export const selectIsDragMode = (state: RootState) => state.tables.isDragMode;
export const selectSelectedTool = (state: RootState) => state.tables.selectedTool;
export const selectShowTablesLayout = (state: RootState) => state.tables.showTablesLayout;
export const selectShowRenameModal = (state: RootState) => state.tables.showRenameModal;
export const selectShowTransferModal = (state: RootState) => state.tables.showTransferModal;
export const selectShowDeleteModal = (state: RootState) => state.tables.showDeleteModal;
export const selectShowClearModal = (state: RootState) => state.tables.showClearModal;
export const selectShowInactiveTablesModal = (state: RootState) =>
  state.tables.showInactiveTablesModal;
export const selectShowReservationModal = (state: RootState) => state.tables.showReservationModal;
export const selectIsContextMenuOpen = (state: RootState) => state.tables.isContextMenuOpen;

// Drag state
export const selectDragState = (state: RootState) => state.tables.dragState;
export const selectTempPositions = (state: RootState) => state.tables.tempPositions;
export const selectIsUpdatingPosition = (state: RootState) => state.tables.isUpdatingPosition;

// Table for action
export const selectSelectedTableForAction = (state: RootState) =>
  state.tables.selectedTableForAction;
export const selectTableToClear = (state: RootState) => state.tables.tableToClear;
export const selectTableToDelete = (state: RootState) => state.tables.tableToDelete;
export const selectTableToRename = (state: RootState) => state.tables.tableToRename;

// Transfer state
export const selectTransferSourceTable = (state: RootState) => state.tables.transferSourceTable;
export const selectTransferSourceOrder = (state: RootState) => state.tables.transferSourceOrder;
export const selectTransferDestinationTable = (state: RootState) =>
  state.tables.transferDestinationTable;

// Inactive tables count
export const selectInactiveTablesCount = (state: RootState) => state.tables.inactiveTablesCount;

// Popup state
export const selectPopupPosition = (state: RootState) => state.tables.popupPosition;

// Last operation
export const selectLastOperation = (state: RootState) => state.tables.lastOperation;

// Next table number
export const selectNextTableNumber = (state: RootState) => state.tables.nextTableNumber;
export const selectSuggestedTableName = (state: RootState) => state.tables.suggestedTableName;

// Bulk selection
export const selectSelectedTableIds = (state: RootState) => state.tables.selectedTableIds;
export const selectBulkOperationInProgress = (state: RootState) =>
  state.tables.bulkOperationInProgress;

// ============================================================================
// MEMOIZED SELECTORS
// ============================================================================

/**
 * Select table by ID
 */
export const selectTableById = createSelector(
  [selectTables, (_: RootState, tableId: string) => tableId],
  (tables, tableId) => tables.find((table) => table.id === tableId)
);

/**
 * Select tables by section
 */
export const selectTablesBySpecificSection = createSelector(
  [selectTables, (_: RootState, section: string) => section],
  (tables, section) => tables.filter((table) => table.section === section)
);

/**
 * Select tables by status
 */
export const selectTablesBySpecificStatus = createSelector(
  [selectTables, (_: RootState, status: Table["status"]) => status],
  (tables, status) => tables.filter((table) => table.status === status)
);

/**
 * Select available tables
 */
export const selectAvailableTables = createSelector([selectTables], (tables) =>
  tables.filter((table) => table.status === "available")
);

/**
 * Select opened tables (with active orders)
 */
export const selectOpenedTables = createSelector([selectTables], (tables) =>
  tables.filter((table) => table.status === "opened")
);

/**
 * Select reserved tables
 */
export const selectReservedTables = createSelector([selectTables], (tables) =>
  tables.filter((table) => table.status === "reserved")
);

/**
 * Select tables that need cleaning
 */
export const selectCleaningTables = createSelector([selectTables], (tables) =>
  tables.filter((table) => table.status === "cleaning")
);

/**
 * Select tables with orders
 */
export const selectTablesWithOrders = createSelector([selectTables], (tables) =>
  tables.filter((table) => table.currentOrder)
);

/**
 * Select tables without orders
 */
export const selectTablesWithoutOrders = createSelector([selectTables], (tables) =>
  tables.filter((table) => !table.currentOrder)
);

/**
 * Select printed tables (full table objects)
 */
export const selectPrintedTableObjects = createSelector(
  [selectTables, selectPrintedTables],
  (tables, printedTableIds) =>
    tables.filter((table) => printedTableIds.includes(table.id.toString()))
);

/**
 * Select tables count by status
 */
export const selectTablesCountByStatus = createSelector([selectTables], (tables) => {
  return tables.reduce(
    (acc, table) => {
      acc[table.status] = (acc[table.status] || 0) + 1;
      return acc;
    },
    {
      available: 0,
      opened: 0,
      reserved: 0,
      cleaning: 0,
    } as Record<Table["status"], number>
  );
});

/**
 * Select tables count by section
 */
export const selectTablesCountBySection = createSelector([selectTables], (tables) => {
  return tables.reduce((acc, table) => {
    const section = table.section || "default";
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
});

/**
 * Select total tables count
 */
export const selectTotalTablesCount = createSelector(
  [selectTables],
  (tables) => tables.length
);

/**
 * Select total active tables count
 */
export const selectActiveTablesCount = createSelector(
  [selectTables],
  (tables) => tables.filter((table) => table.status !== "cleaning").length
);

/**
 * Select filtered tables based on current filters
 */
export const selectFilteredTables = createSelector(
  [selectTables, selectFilters],
  (tables, filters) => {
    let filtered = tables;

    if (filters.section) {
      filtered = filtered.filter((table) => table.section === filters.section);
    }

    if (filters.status) {
      filtered = filtered.filter((table) => table.status === filters.status);
    }

    return filtered;
  }
);

/**
 * Select tables for current section
 */
export const selectTablesForActiveSection = createSelector(
  [selectTables, selectActiveSection],
  (tables, activeSection) => {
    if (!activeSection) return tables;
    return tables.filter((table) => table.section === activeSection);
  }
);

/**
 * Check if any table is being updated
 */
export const selectIsAnyTableLoading = createSelector(
  [
    selectIsLoading,
    selectIsCreating,
    selectIsUpdating,
    selectIsDeleting,
    selectIsReserving,
    selectIsClearing,
    selectIsTransferring,
    selectIsBulkCreating,
    selectIsDuplicating,
  ],
  (
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isReserving,
    isClearing,
    isTransferring,
    isBulkCreating,
    isDuplicating
  ) =>
    isLoading ||
    isCreating ||
    isUpdating ||
    isDeleting ||
    isReserving ||
    isClearing ||
    isTransferring ||
    isBulkCreating ||
    isDuplicating
);

/**
 * Check if any error exists
 */
export const selectHasAnyError = createSelector(
  [
    selectError,
    selectCreateError,
    selectUpdateError,
    selectDeleteError,
    selectReserveError,
    selectClearError,
    selectTransferError,
    selectBulkCreateError,
    selectDuplicateError,
  ],
  (
    error,
    createError,
    updateError,
    deleteError,
    reserveError,
    clearError,
    transferError,
    bulkCreateError,
    duplicateError
  ) =>
    !!(
      error ||
      createError ||
      updateError ||
      deleteError ||
      reserveError ||
      clearError ||
      transferError ||
      bulkCreateError ||
      duplicateError
    )
);

/**
 * Get all error messages
 */
export const selectAllErrors = createSelector(
  [
    selectError,
    selectCreateError,
    selectUpdateError,
    selectDeleteError,
    selectReserveError,
    selectClearError,
    selectTransferError,
    selectBulkCreateError,
    selectDuplicateError,
  ],
  (
    error,
    createError,
    updateError,
    deleteError,
    reserveError,
    clearError,
    transferError,
    bulkCreateError,
    duplicateError
  ) => {
    const errors: string[] = [];
    if (error) errors.push(error);
    if (createError) errors.push(createError);
    if (updateError) errors.push(updateError);
    if (deleteError) errors.push(deleteError);
    if (reserveError) errors.push(reserveError);
    if (clearError) errors.push(clearError);
    if (transferError) errors.push(transferError);
    if (bulkCreateError) errors.push(bulkCreateError);
    if (duplicateError) errors.push(duplicateError);
    return errors;
  }
);

/**
 * Check if any success message exists
 */
export const selectHasAnySuccess = createSelector(
  [
    selectSuccessMessage,
    selectCreateSuccess,
    selectUpdateSuccess,
    selectDeleteSuccess,
    selectReserveSuccess,
    selectClearSuccess,
    selectTransferSuccess,
    selectBulkCreateSuccess,
    selectDuplicateSuccess,
  ],
  (
    successMessage,
    createSuccess,
    updateSuccess,
    deleteSuccess,
    reserveSuccess,
    clearSuccess,
    transferSuccess,
    bulkCreateSuccess,
    duplicateSuccess
  ) =>
    !!(
      successMessage ||
      createSuccess ||
      updateSuccess ||
      deleteSuccess ||
      reserveSuccess ||
      clearSuccess ||
      transferSuccess ||
      bulkCreateSuccess ||
      duplicateSuccess
    )
);

/**
 * Get all success messages
 */
export const selectAllSuccessMessages = createSelector(
  [
    selectSuccessMessage,
    selectCreateSuccess,
    selectUpdateSuccess,
    selectDeleteSuccess,
    selectReserveSuccess,
    selectClearSuccess,
    selectTransferSuccess,
    selectBulkCreateSuccess,
    selectDuplicateSuccess,
  ],
  (
    successMessage,
    createSuccess,
    updateSuccess,
    deleteSuccess,
    reserveSuccess,
    clearSuccess,
    transferSuccess,
    bulkCreateSuccess,
    duplicateSuccess
  ) => {
    const messages: string[] = [];
    if (successMessage) messages.push(successMessage);
    if (createSuccess) messages.push(createSuccess);
    if (updateSuccess) messages.push(updateSuccess);
    if (deleteSuccess) messages.push(deleteSuccess);
    if (reserveSuccess) messages.push(reserveSuccess);
    if (clearSuccess) messages.push(clearSuccess);
    if (transferSuccess) messages.push(transferSuccess);
    if (bulkCreateSuccess) messages.push(bulkCreateSuccess);
    if (duplicateSuccess) messages.push(duplicateSuccess);
    return messages;
  }
);

/**
 * Select tables with specific order count
 */
export const selectTablesWithOrderCount = createSelector(
  [selectTables, selectTableOrders],
  (tables, tableOrders) => {
    return tables.map((table) => ({
      ...table,
      orderCount: tableOrders[table.id] || tableOrders[table.number.toString()] || 0,
    }));
  }
);

/**
 * Select tables sorted by number
 */
export const selectTablesSortedByNumber = createSelector([selectTables], (tables) => {
  return [...tables].sort((a, b) => a.number - b.number);
});

/**
 * Select tables sorted by status priority (opened > reserved > cleaning > available)
 */
export const selectTablesSortedByStatusPriority = createSelector([selectTables], (tables) => {
  const statusPriority: Record<Table["status"], number> = {
    opened: 1,
    reserved: 2,
    cleaning: 3,
    available: 4,
  };

  return [...tables].sort((a, b) => {
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    return a.number - b.number;
  });
});

/**
 * Select tables grouped by section with counts
 */
export const selectTablesSectionsSummary = createSelector([selectTables], (tables) => {
  const sections = tables.reduce((acc, table) => {
    const section = table.section || "default";
    if (!acc[section]) {
      acc[section] = {
        name: section,
        total: 0,
        available: 0,
        opened: 0,
        reserved: 0,
        cleaning: 0,
        tables: [],
      };
    }
    acc[section].total++;
    acc[section][table.status]++;
    acc[section].tables.push(table);
    return acc;
  }, {} as Record<string, { name: string; total: number; available: number; opened: number; reserved: number; cleaning: number; tables: TableWithOrder[] }>);

  return Object.values(sections);
});

/**
 * Select table statistics
 */
export const selectTableStatistics = createSelector(
  [selectTables, selectInactiveTablesCount],
  (tables, inactiveCount) => {
    const total = tables.length;
    const active = tables.length;
    const inactive = inactiveCount;
    const available = tables.filter((t) => t.status === "available").length;
    const opened = tables.filter((t) => t.status === "opened").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    const cleaning = tables.filter((t) => t.status === "cleaning").length;
    const withOrders = tables.filter((t) => t.currentOrder).length;

    const availablePercentage = total > 0 ? (available / total) * 100 : 0;
    const occupancyRate = total > 0 ? ((opened + reserved) / total) * 100 : 0;

    return {
      total,
      active,
      inactive,
      available,
      opened,
      reserved,
      cleaning,
      withOrders,
      availablePercentage: Math.round(availablePercentage * 10) / 10,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
    };
  }
);

/**
 * Select if transfer is ready (source and destination selected)
 */
export const selectIsTransferReady = createSelector(
  [selectTransferSourceTable, selectTransferDestinationTable],
  (sourceTable, destinationTable) => !!(sourceTable && destinationTable)
);

/**
 * Select available destination tables for transfer (excluding source table)
 */
export const selectAvailableDestinationTables = createSelector(
  [selectTables, selectTransferSourceTable],
  (tables, sourceTable) => {
    if (!sourceTable) return tables;
    return tables.filter(
      (table) => table.id !== sourceTable.id && table.status !== "cleaning"
    );
  }
);

/**
 * Select selected tables (full objects)
 */
export const selectSelectedTableObjects = createSelector(
  [selectTables, selectSelectedTableIds],
  (tables, selectedIds) => {
    const idsArray = Array.from(selectedIds);
    return tables.filter((table) => idsArray.includes(table.id));
  }
);

/**
 * Select if multiple tables are selected
 */
export const selectHasMultipleTablesSelected = createSelector(
  [selectSelectedTableIds],
  (selectedIds) => selectedIds.size > 1
);

/**
 * Select table with current position (including temp position during drag)
 */
export const selectTableWithPosition = createSelector(
  [
    selectTableById,
    selectTempPositions,
    selectDragState,
    (_: RootState, tableId: string) => tableId,
  ],
  (table, tempPositions, dragState, tableId) => {
    if (!table) return null;

    const isDragging = dragState?.tableId === tableId;
    const tempPosition = tempPositions[tableId];

    return {
      ...table,
      position: isDragging && tempPosition ? tempPosition : table.position,
      isDragging,
    };
  }
);

/**
 * Check if table can be deleted (not opened)
 */
export const selectCanDeleteTable = createSelector(
  [selectTableById, (_: RootState, tableId: string) => tableId],
  (table) => {
    if (!table) return false;
    return table.status !== "opened";
  }
);

/**
 * Check if table can be cleared (has reservation or order)
 */
export const selectCanClearTable = createSelector(
  [selectTableById, (_: RootState, tableId: string) => tableId],
  (table) => {
    if (!table) return false;
    return table.status === "reserved" || table.status === "opened";
  }
);

/**
 * Check if table can be transferred (has order)
 */
export const selectCanTransferTable = createSelector(
  [selectTableById, (_: RootState, tableId: string) => tableId],
  (table) => {
    if (!table) return false;
    return table.status === "opened" && !!table.currentOrder;
  }
);
