# Tables Slice Documentation

## Overview

The **tablesSlice** is a comprehensive Redux Toolkit slice that manages all table-related state and operations for the restaurant POS system. It provides a complete solution for table management, including CRUD operations, drag-and-drop positioning, table transfers, reservations, and real-time order tracking.

## Architecture

### State Structure

```typescript
interface TablesState {
  // Core Data
  tables: TableWithOrder[];                    // Active tables with order info
  inactiveTables: Table[];                     // Deactivated tables
  tableDetails: Record<string, TableWithOrder>; // Cached table details by ID
  tablesBySection: Record<string, TableWithOrder[]>; // Tables grouped by section
  tablesByStatus: Record<Table["status"], TableWithOrder[]>; // Tables grouped by status
  
  // Selection & UI
  selectedTable: TableWithOrder | null;
  hoveredTable: TableWithOrder | null;
  popupPosition: { x: number; y: number } | null;
  
  // Table Management
  sections: string[];
  activeSection: string | null;
  tableOrders: Record<string, number>;         // Order counts by table
  printedTables: string[];                     // IDs of printed tables
  
  // Loading States (12 different operations)
  isLoading, isCreating, isUpdating, isDeleting, etc.
  
  // Error States (10 different error types)
  error, createError, updateError, deleteError, etc.
  
  // Success Messages (9 different success types)
  successMessage, createSuccess, updateSuccess, etc.
  
  // Filters
  filters: {
    section?: string;
    status?: Table["status"];
    includeOrders?: boolean;
    isActive?: boolean;
  };
  
  // Arrange Mode (drag & drop)
  isArrangeMode: boolean;
  isDragMode: boolean;
  selectedTool: "select" | "round-table" | "square-table" | "rectangular-table";
  dragState: { isDragging, tableId, offset, startPosition } | null;
  tempPositions: Record<string, { x: number; y: number }>;
  isUpdatingPosition: string | null;
  
  // Modal States (8 different modals)
  showTablesLayout, showRenameModal, showTransferModal, etc.
  
  // Transfer Operations
  transferSourceTable: TableWithOrder | null;
  transferSourceOrder: Order | null;
  transferDestinationTable: TableWithOrder | null;
  
  // Bulk Operations
  selectedTableIds: Set<string>;
  bulkOperationInProgress: boolean;
  
  // Metadata
  lastOperation: { type, tableId, timestamp };
  nextTableNumber: number;
  suggestedTableName: string;
  inactiveTablesCount: number;
}
```

## Async Thunks (API Operations)

### Table CRUD Operations

#### `fetchTables(params?)`
Fetches all tables with optional filters.

```typescript
dispatch(fetchTables({
  section: "main",
  status: "opened",
  includeOrders: true,
  isActive: true
}));
```

**Returns:** `TableWithOrder[]`

**Features:**
- Automatically groups tables by section and status
- Updates table orders mapping
- Extracts unique sections
- Handles both array and object API responses

---

#### `fetchInactiveTables()`
Fetches all inactive/deactivated tables.

```typescript
dispatch(fetchInactiveTables());
```

**Returns:** `Table[]`

**Use Case:** Managing inactive tables, reactivation workflow

---

#### `fetchTableById(tableId)`
Fetches detailed information for a specific table.

```typescript
dispatch(fetchTableById("table-123"));
```

**Returns:** `TableWithOrder`

**Use Case:** Loading table details for editing, viewing orders

---

#### `createTable(data)`
Creates a new table.

```typescript
dispatch(createTable({
  number: 15,
  name: "VIP Table",
  seats: 6,
  shape: "rectangle",
  position: { x: 50, y: 50 },
  section: "vip",
  notes: "Window view"
}));
```

**Returns:** `TableWithOrder`

**Features:**
- Validates table data
- Assigns next available number if not provided
- Updates last operation metadata

---

#### `quickCreateTable(data)`
Quick create with smart defaults.

```typescript
dispatch(quickCreateTable({
  section: "patio",
  seats: 4,
  shape: "round"
}));
```

**Returns:** `TableWithOrder`

**Features:**
- Auto-assigns table number
- Auto-generates table name
- Smart default positioning

---

#### `bulkCreateTables(data)`
Creates multiple tables at once.

```typescript
dispatch(bulkCreateTables({
  section: "main",
  tables: [
    { seats: 4, shape: "round" },
    { seats: 6, shape: "rectangle" },
    { seats: 2, shape: "square" }
  ]
}));
```

**Returns:** `{ tables, created, errors, errorDetails }`

**Features:**
- Batch creation with transaction support
- Detailed error reporting
- Partial success handling

---

#### `updateTable({ tableId, data })`
Updates table properties.

```typescript
dispatch(updateTable({
  tableId: "table-123",
  data: {
    seats: 8,
    name: "Premium Table",
    status: "available"
  }
}));
```

**Returns:** `TableWithOrder`

**Features:**
- Partial updates supported
- Validates status transitions
- Updates all cached references

---

#### `updateTablePosition({ tableId, position })`
Updates table position (for drag & drop).

```typescript
dispatch(updateTablePosition({
  tableId: "table-123",
  position: { x: 65, y: 45 }
}));
```

**Returns:** `TableWithOrder`

**Features:**
- Optimistic UI updates with temp positions
- Automatic rollback on error
- Position constraint validation

---

#### `renameTable({ tableId, data })`
Renames a table.

```typescript
dispatch(renameTable({
  tableId: "table-123",
  data: {
    name: "Corner Table",
    number: 20
  }
}));
```

**Returns:** `TableWithOrder`

**Features:**
- Validates unique table numbers
- Updates all references
- Preserves other table properties

---

#### `duplicateTable({ tableId, data? })`
Duplicates an existing table.

```typescript
dispatch(duplicateTable({
  tableId: "table-123",
  data: {
    customName: "Table Copy",
    customNumber: 25
  }
}));
```

**Returns:** `TableWithOrder`

**Features:**
- Copies all properties except ID
- Auto-assigns new number if not provided
- Smart positioning (offset from original)

---

#### `deleteTable(tableId)`
Deletes a table.

```typescript
dispatch(deleteTable("table-123"));
```

**Returns:** `tableId` (string)

**Validation:**
- Cannot delete tables with active orders (status: "opened")
- Removes from all caches and mappings

---

### Table Status Operations

#### `reserveTable({ tableId, data })`
Reserves a table.

```typescript
dispatch(reserveTable({
  tableId: "table-123",
  data: {
    reservedBy: "John Doe",
    reservedUntil: "2025-10-05T20:00:00Z",
    notes: "Birthday celebration"
  }
}));
```

**Returns:** `TableWithOrder`

**Features:**
- Sets status to "reserved"
- Stores reservation metadata
- Prevents double-booking

---

#### `clearTableReservation(tableId)`
Clears a table reservation.

```typescript
dispatch(clearTableReservation("table-123"));
```

**Returns:** `TableWithOrder`

**Features:**
- Removes reservation metadata
- Sets status back to "available"
- Preserves table configuration

---

#### `clearTable(tableId)`
Completely clears a table (removes orders and resets status).

```typescript
dispatch(clearTable("table-123"));
```

**Returns:** `TableWithOrder`

**Features:**
- Removes all orders
- Resets status to "available"
- Clears order count mapping
- Comprehensive cleanup

---

#### `markTableForCleaning(tableId)`
Marks table as needing cleaning.

```typescript
dispatch(markTableForCleaning("table-123"));
```

**Returns:** `TableWithOrder`

**Use Case:** After customers leave, before next seating

---

#### `markTableAsClean(tableId)`
Marks table as clean and ready.

```typescript
dispatch(markTableAsClean("table-123"));
```

**Returns:** `TableWithOrder`

**Features:**
- Sets status to "available"
- Ready for next customers

---

### Transfer Operations

#### `transferOrder(data)`
Transfers entire order from one table to another.

```typescript
dispatch(transferOrder({
  fromTableId: "table-5",
  toTableId: "table-12",
  orderId: "order-456"
}));
```

**Returns:** `{ message, order, fromTableId, toTableId }`

**Features:**
- Moves complete order
- Updates both tables' status
- Maintains order history
- Clears transfer state on completion

---

#### `transferItems(data)`
Transfers specific items between tables.

```typescript
dispatch(transferItems({
  fromTableId: "table-5",
  toTableId: "table-12",
  itemIds: ["item-1", "item-2", "item-3"],
  createNewOrder: true
}));
```

**Returns:** `{ message, transfer, fromTableId, toTableId }`

**Features:**
- Selective item transfer
- Optional new order creation
- Split bill support
- Updates order counts

---

### Utility Operations

#### `fetchTableSections()`
Fetches all available table sections.

```typescript
dispatch(fetchTableSections());
```

**Returns:** `string[]`

**Use Case:** Section filter dropdowns, section management

---

#### `fetchNextTableNumber()`
Gets next available table number.

```typescript
dispatch(fetchNextTableNumber());
```

**Returns:** `{ nextNumber, suggestedName }`

**Use Case:** Auto-numbering new tables

---

#### `fetchTableOrder(orderId)`
Fetches order details for a table.

```typescript
dispatch(fetchTableOrder("order-456"));
```

**Returns:** `Order`

**Use Case:** Transfer modal, order details popup

---

## Synchronous Actions

### UI State Management

```typescript
// Table selection
dispatch(setSelectedTable(table));
dispatch(setHoveredTable(table));
dispatch(setPopupPosition({ x: 100, y: 200 }));

// Section management
dispatch(setActiveSection("patio"));

// Filters
dispatch(setFilters({ status: "opened", section: "main" }));
dispatch(clearFilters());
```

---

### Arrange Mode (Drag & Drop)

```typescript
// Enable/disable arrange mode
dispatch(setArrangeMode(true));
dispatch(setDragMode(true));
dispatch(setSelectedTool("round-table")); // or "square-table", "rectangular-table", "select"

// Drag state management
dispatch(setDragState({
  isDragging: true,
  tableId: "table-123",
  offset: { x: 10, y: 10 },
  startPosition: { x: 50, y: 50 }
}));

// Temporary positions during drag
dispatch(setTempPosition({ tableId: "table-123", position: { x: 55, y: 55 } }));
dispatch(clearTempPosition("table-123"));
dispatch(clearAllTempPositions());

// Position update tracking
dispatch(setIsUpdatingPosition("table-123"));
```

---

### Modal Management

```typescript
// Show/hide modals
dispatch(setShowTablesLayout(true));
dispatch(setShowRenameModal(true));
dispatch(setShowTransferModal(true));
dispatch(setShowDeleteModal(true));
dispatch(setShowClearModal(true));
dispatch(setShowInactiveTablesModal(true));
dispatch(setShowReservationModal(true));
dispatch(setIsContextMenuOpen(true));
```

---

### Table Action Selection

```typescript
// Set table for specific actions
dispatch(setSelectedTableForAction(table));
dispatch(setTableToClear(table));
dispatch(setTableToDelete(table));
dispatch(setTableToRename(table));
```

---

### Transfer State Management

```typescript
// Set transfer source and destination
dispatch(setTransferSourceTable(sourceTable));
dispatch(setTransferSourceOrder(order));
dispatch(setTransferDestinationTable(destinationTable));

// Clear transfer state
dispatch(clearTransferState());
```

---

### Table Orders Mapping

```typescript
// Manage order counts
dispatch(setTableOrders({ "table-5": 3, "table-12": 5 }));
dispatch(updateTableOrderCount({ tableId: "table-5", count: 4 }));
dispatch(clearTableOrderCount("table-5"));
```

---

### Printed Tables Management

```typescript
// Track printed tables
dispatch(setPrintedTables(["table-5", "table-12"]));
dispatch(addPrintedTable("table-8"));
dispatch(removePrintedTable("table-5"));
dispatch(clearPrintedTables());
```

---

### Bulk Selection

```typescript
// Manage bulk selection
dispatch(toggleTableSelection("table-5"));
dispatch(selectAllTables());
dispatch(clearTableSelection());
```

---

### Error & Success Management

```typescript
// Clear messages
dispatch(clearError());
dispatch(clearSuccessMessage());
```

---

### Direct State Updates (Optimistic Updates)

```typescript
// Optimistic updates
dispatch(updateTableInState(updatedTable));
dispatch(removeTableFromState("table-123"));
dispatch(addTableToState(newTable));
```

---

### Reset State

```typescript
// Reset entire state to initial
dispatch(resetTablesState());
```

---

## Selectors

### Basic Selectors

```typescript
import { 
  selectTables,
  selectSelectedTable,
  selectIsLoading,
  selectError
} from "@/store/slices/tablesSelectors";

const tables = useAppSelector(selectTables);
const selectedTable = useAppSelector(selectSelectedTable);
const isLoading = useAppSelector(selectIsLoading);
const error = useAppSelector(selectError);
```

---

### Memoized Selectors

#### Table Filtering

```typescript
// Get table by ID
const table = useAppSelector((state) => selectTableById(state, "table-123"));

// Get tables by section
const patioTables = useAppSelector((state) => 
  selectTablesBySpecificSection(state, "patio")
);

// Get tables by status
const openedTables = useAppSelector((state) => 
  selectTablesBySpecificStatus(state, "opened")
);

// Convenience selectors
const availableTables = useAppSelector(selectAvailableTables);
const openedTables = useAppSelector(selectOpenedTables);
const reservedTables = useAppSelector(selectReservedTables);
const cleaningTables = useAppSelector(selectCleaningTables);
```

---

#### Order-Related Selectors

```typescript
// Tables with/without orders
const tablesWithOrders = useAppSelector(selectTablesWithOrders);
const tablesWithoutOrders = useAppSelector(selectTablesWithoutOrders);

// Tables with order counts
const tablesWithCounts = useAppSelector(selectTablesWithOrderCount);

// Printed tables
const printedTableObjects = useAppSelector(selectPrintedTableObjects);
```

---

#### Statistics & Counts

```typescript
// Count by status
const countsByStatus = useAppSelector(selectTablesCountByStatus);
// Returns: { available: 10, opened: 5, reserved: 2, cleaning: 1 }

// Count by section
const countsBySection = useAppSelector(selectTablesCountBySection);
// Returns: { main: 12, patio: 6, vip: 4 }

// Total counts
const totalCount = useAppSelector(selectTotalTablesCount);
const activeCount = useAppSelector(selectActiveTablesCount);

// Comprehensive statistics
const stats = useAppSelector(selectTableStatistics);
/* Returns: {
  total: 18,
  active: 17,
  inactive: 3,
  available: 10,
  opened: 5,
  reserved: 2,
  cleaning: 1,
  withOrders: 5,
  availablePercentage: 55.6,
  occupancyRate: 38.9
} */
```

---

#### Filtered & Sorted Selectors

```typescript
// Filtered by current filters
const filteredTables = useAppSelector(selectFilteredTables);

// Filtered by active section
const sectionTables = useAppSelector(selectTablesForActiveSection);

// Sorted tables
const sortedByNumber = useAppSelector(selectTablesSortedByNumber);
const sortedByPriority = useAppSelector(selectTablesSortedByStatusPriority);
```

---

#### Section Summary

```typescript
const sectionsSummary = useAppSelector(selectTablesSectionsSummary);
/* Returns: [
  {
    name: "main",
    total: 12,
    available: 8,
    opened: 3,
    reserved: 1,
    cleaning: 0,
    tables: [...]
  },
  ...
] */
```

---

#### Transfer Selectors

```typescript
// Check if transfer is ready
const isTransferReady = useAppSelector(selectIsTransferReady);

// Get available destination tables (excluding source)
const destinationTables = useAppSelector(selectAvailableDestinationTables);
```

---

#### Bulk Selection Selectors

```typescript
// Get selected table objects
const selectedTables = useAppSelector(selectSelectedTableObjects);

// Check if multiple selected
const hasMultiple = useAppSelector(selectHasMultipleTablesSelected);
```

---

#### Position & Drag Selectors

```typescript
// Get table with current position (including temp during drag)
const tableWithPosition = useAppSelector((state) => 
  selectTableWithPosition(state, "table-123")
);
```

---

#### Validation Selectors

```typescript
// Check table capabilities
const canDelete = useAppSelector((state) => 
  selectCanDeleteTable(state, "table-123")
);

const canClear = useAppSelector((state) => 
  selectCanClearTable(state, "table-123")
);

const canTransfer = useAppSelector((state) => 
  selectCanTransferTable(state, "table-123")
);
```

---

#### Loading & Error Selectors

```typescript
// Check if any operation is loading
const isAnyLoading = useAppSelector(selectIsAnyTableLoading);

// Check if any error exists
const hasError = useAppSelector(selectHasAnyError);

// Get all errors
const allErrors = useAppSelector(selectAllErrors);
// Returns: string[]

// Get all success messages
const allSuccess = useAppSelector(selectAllSuccessMessages);
// Returns: string[]
```

---

## Usage Examples

### Example 1: Tables Layout Component

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTables,
  setSelectedTable,
  setHoveredTable,
  setPopupPosition,
  updateTablePosition,
} from "@/store/slices/tablesSlice";
import {
  selectTables,
  selectSelectedTable,
  selectHoveredTable,
  selectPopupPosition,
  selectIsLoading,
} from "@/store/slices/tablesSelectors";

function TablesLayout() {
  const dispatch = useAppDispatch();
  const tables = useAppSelector(selectTables);
  const selectedTable = useAppSelector(selectSelectedTable);
  const hoveredTable = useAppSelector(selectHoveredTable);
  const popupPosition = useAppSelector(selectPopupPosition);
  const isLoading = useAppSelector(selectIsLoading);

  useEffect(() => {
    dispatch(fetchTables({ includeOrders: true }));
  }, [dispatch]);

  const handleTableClick = (table: Table) => {
    dispatch(setSelectedTable(table));
  };

  const handleTableHover = (table: Table, e: React.MouseEvent) => {
    dispatch(setHoveredTable(table));
    dispatch(setPopupPosition({ x: e.clientX, y: e.clientY }));
  };

  const handleTableDragEnd = (tableId: string, position: { x: number; y: number }) => {
    dispatch(updateTablePosition({ tableId, position }));
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="tables-layout">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          isSelected={selectedTable?.id === table.id}
          onClick={() => handleTableClick(table)}
          onHover={(e) => handleTableHover(table, e)}
          onDragEnd={(pos) => handleTableDragEnd(table.id, pos)}
        />
      ))}
      {hoveredTable && popupPosition && (
        <TablePopup table={hoveredTable} position={popupPosition} />
      )}
    </div>
  );
}
```

---

### Example 2: Transfer Modal

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  transferOrder,
  setTransferSourceTable,
  setTransferDestinationTable,
  clearTransferState,
} from "@/store/slices/tablesSlice";
import {
  selectTransferSourceTable,
  selectTransferSourceOrder,
  selectAvailableDestinationTables,
  selectIsTransferring,
  selectIsTransferReady,
} from "@/store/slices/tablesSelectors";

function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const dispatch = useAppDispatch();
  const sourceTable = useAppSelector(selectTransferSourceTable);
  const sourceOrder = useAppSelector(selectTransferSourceOrder);
  const destinationTables = useAppSelector(selectAvailableDestinationTables);
  const isTransferring = useAppSelector(selectIsTransferring);
  const isReady = useAppSelector(selectIsTransferReady);

  const handleTransfer = async () => {
    if (!sourceTable || !sourceOrder || !destinationTable) return;

    await dispatch(
      transferOrder({
        fromTableId: sourceTable.id,
        toTableId: destinationTable.id,
        orderId: sourceOrder.id,
      })
    ).unwrap();

    dispatch(clearTransferState());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Transfer Order</h2>
      <div>
        <p>From: Table {sourceTable?.number}</p>
        <p>Order: {sourceOrder?.orderNumber}</p>
      </div>
      <select
        onChange={(e) => {
          const table = destinationTables.find((t) => t.id === e.target.value);
          dispatch(setTransferDestinationTable(table || null));
        }}
      >
        <option value="">Select destination table</option>
        {destinationTables.map((table) => (
          <option key={table.id} value={table.id}>
            Table {table.number} - {table.status}
          </option>
        ))}
      </select>
      <button
        onClick={handleTransfer}
        disabled={!isReady || isTransferring}
      >
        {isTransferring ? "Transferring..." : "Transfer Order"}
      </button>
    </Modal>
  );
}
```

---

### Example 3: Table Statistics Dashboard

```typescript
import { useAppSelector } from "@/store/hooks";
import {
  selectTableStatistics,
  selectTablesCountByStatus,
  selectTablesSectionsSummary,
} from "@/store/slices/tablesSelectors";

function TablesDashboard() {
  const stats = useAppSelector(selectTableStatistics);
  const statusCounts = useAppSelector(selectTablesCountByStatus);
  const sectionsSummary = useAppSelector(selectTablesSectionsSummary);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard title="Total Tables" value={stats.total} />
        <StatCard title="Available" value={stats.available} color="green" />
        <StatCard title="Occupied" value={stats.opened} color="red" />
        <StatCard title="Reserved" value={stats.reserved} color="yellow" />
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          color="blue"
        />
      </div>

      <div className="status-breakdown">
        <h3>Status Breakdown</h3>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status}>
            <span>{status}</span>
            <span>{count}</span>
          </div>
        ))}
      </div>

      <div className="sections-summary">
        <h3>Sections Summary</h3>
        {sectionsSummary.map((section) => (
          <div key={section.name}>
            <h4>{section.name}</h4>
            <p>Total: {section.total}</p>
            <p>Available: {section.available}</p>
            <p>Opened: {section.opened}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Example 4: Bulk Operations

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  toggleTableSelection,
  selectAllTables,
  clearTableSelection,
  bulkCreateTables,
} from "@/store/slices/tablesSlice";
import {
  selectSelectedTableIds,
  selectSelectedTableObjects,
  selectHasMultipleTablesSelected,
} from "@/store/slices/tablesSelectors";

function BulkTableOperations() {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(selectSelectedTableIds);
  const selectedTables = useAppSelector(selectSelectedTableObjects);
  const hasMultiple = useAppSelector(selectHasMultipleTablesSelected);

  const handleBulkCreate = () => {
    dispatch(
      bulkCreateTables({
        section: "main",
        tables: [
          { seats: 4, shape: "round" },
          { seats: 6, shape: "rectangle" },
          { seats: 2, shape: "square" },
        ],
      })
    );
  };

  return (
    <div>
      <button onClick={() => dispatch(selectAllTables())}>
        Select All
      </button>
      <button onClick={() => dispatch(clearTableSelection())}>
        Clear Selection
      </button>
      <button onClick={handleBulkCreate}>
        Bulk Create Tables
      </button>
      <p>Selected: {selectedIds.size} tables</p>
      {hasMultiple && <p>Multiple tables selected</p>}
    </div>
  );
}
```

---

## Integration with Other Slices

### With Orders Slice

```typescript
// When order is created/updated, update table status
dispatch(fetchTables({ includeOrders: true }));

// When order is completed, clear table
dispatch(clearTable(tableId));
```

---

### With POS Slice

```typescript
// When selecting table in POS
dispatch(setSelectedTable(table));

// When order is printed
dispatch(addPrintedTable(tableId));

// When payment is completed
dispatch(clearTable(tableId));
```

---

### With Sales Slice

```typescript
// Track table sales
const tableOrders = useAppSelector(selectTableOrders);

// Update order counts after sale
dispatch(updateTableOrderCount({ tableId, count: newCount }));
```

---

## Best Practices

### 1. Always Use Selectors

```typescript
// ✅ Good
const tables = useAppSelector(selectTables);

// ❌ Bad
const tables = useAppSelector((state) => state.tables.tables);
```

---

### 2. Handle Loading States

```typescript
const isLoading = useAppSelector(selectIsLoading);
const isAnyLoading = useAppSelector(selectIsAnyTableLoading);

if (isLoading) return <LoadingSpinner />;
```

---

### 3. Handle Errors Gracefully

```typescript
const error = useAppSelector(selectError);
const allErrors = useAppSelector(selectAllErrors);

useEffect(() => {
  if (error) {
    toast.error(error);
    dispatch(clearError());
  }
}, [error]);
```

---

### 4. Clean Up on Unmount

```typescript
useEffect(() => {
  return () => {
    dispatch(clearTransferState());
    dispatch(clearTableSelection());
    dispatch(clearError());
  };
}, []);
```

---

### 5. Optimistic Updates

```typescript
// Update UI immediately
dispatch(updateTableInState(updatedTable));

// Then sync with server
dispatch(updateTable({ tableId, data }))
  .unwrap()
  .catch(() => {
    // Rollback on error
    dispatch(updateTableInState(originalTable));
  });
```

---

### 6. Use Memoized Selectors for Derived Data

```typescript
// ✅ Good - memoized, only recalculates when tables change
const stats = useAppSelector(selectTableStatistics);

// ❌ Bad - recalculates on every render
const stats = useMemo(() => calculateStats(tables), [tables]);
```

---

## Performance Considerations

1. **Memoized Selectors**: All complex selectors use `createSelector` for memoization
2. **Grouped Data**: Tables are pre-grouped by section and status for fast filtering
3. **Cached Details**: Table details are cached to avoid redundant API calls
4. **Optimistic Updates**: UI updates immediately with temp positions during drag
5. **Batch Operations**: Bulk create reduces API calls for multiple tables
6. **Selective Re-renders**: Only affected components re-render on state changes

---

## TypeScript Support

All types are fully typed with TypeScript:

```typescript
import type { TableWithOrder } from "@/store/slices/tablesSlice";
import type { RootState } from "@/store";

// Type-safe selectors
const table: TableWithOrder | undefined = useAppSelector((state: RootState) =>
  selectTableById(state, tableId)
);

// Type-safe actions
dispatch(setSelectedTable(table)); // table must be TableWithOrder | null
```

---

## Testing

```typescript
import { store } from "@/store";
import { fetchTables, setSelectedTable } from "@/store/slices/tablesSlice";
import { selectTables, selectSelectedTable } from "@/store/slices/tablesSelectors";

describe("Tables Slice", () => {
  it("should fetch tables", async () => {
    await store.dispatch(fetchTables());
    const tables = selectTables(store.getState());
    expect(tables).toBeDefined();
  });

  it("should select table", () => {
    const table = { id: "1", number: 5, /* ... */ };
    store.dispatch(setSelectedTable(table));
    const selected = selectSelectedTable(store.getState());
    expect(selected).toEqual(table);
  });
});
```

---

## Migration Guide

If migrating from local state to Redux:

```typescript
// Before (local state)
const [tables, setTables] = useState([]);
const [selectedTable, setSelectedTable] = useState(null);

// After (Redux)
const tables = useAppSelector(selectTables);
const selectedTable = useAppSelector(selectSelectedTable);
const dispatch = useAppDispatch();

// Replace setSelectedTable(table) with:
dispatch(setSelectedTable(table));
```

---

## Troubleshooting

### Tables not loading
- Check `selectIsLoading` and `selectError`
- Verify API endpoint is correct
- Check network tab for failed requests

### Drag & drop not working
- Ensure `isArrangeMode` and `isDragMode` are true
- Check `dragState` is being set correctly
- Verify `tempPositions` are updating

### Transfer not working
- Check `selectIsTransferReady` returns true
- Verify source and destination tables are set
- Check `selectTransferError` for error messages

---

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Table layout templates
- [ ] Custom table shapes
- [ ] Table merging/splitting
- [ ] Reservation scheduling
- [ ] Waitlist integration
- [ ] Table turn time tracking
- [ ] Heat map visualization

---

## Related Documentation

- [Orders Slice](./ORDERS_SLICE_README.md)
- [POS Slice](./posSlice.ts)
- [API Documentation](../../api/tables.api.ts)
- [Component Documentation](../../components/pos/TablesLayout.tsx)
