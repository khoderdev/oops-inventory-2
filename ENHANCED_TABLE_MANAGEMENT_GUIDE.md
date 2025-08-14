# Enhanced Table Management System

This system provides flexible and easy table creation, renaming, and management for your restaurant POS system.

## Features

### 🚀 Quick Table Creation
- **One-click table creation** with smart defaults
- **Auto-numbering** - automatically assigns next available table number
- **Smart naming** - generates logical names based on section
- **Flexible customization** - override any default setting

### ✏️ Easy Table Renaming
- **Rename tables** without affecting orders
- **Change table numbers** with conflict validation
- **Safety checks** - prevents renaming during active service
- **Change tracking** - logs all rename operations

### 📦 Bulk Operations
- **Bulk create** multiple tables at once
- **Template duplication** - copy existing table settings
- **Batch setup** - perfect for new restaurant setup
- **Error handling** - continues processing even if some tables fail

### 🔧 Smart Utilities
- **Next number lookup** - get next available table number
- **Duplicate tables** - copy settings to create similar tables
- **Section management** - organize tables by restaurant areas

## API Endpoints

### Quick Create Table
```
POST /api/tables/quick-create
```

**Request Body:**
```json
{
  "section": "outdoor",
  "seats": 6,
  "shape": "rectangle",
  "customName": "Patio Table"
}
```

**Response:**
```json
{
  "message": "Table 14 created successfully",
  "table": {
    "id": "14",
    "number": 14,
    "name": "Patio Table",
    "seats": 6,
    "shape": "rectangle",
    "section": "outdoor",
    "status": "available"
  }
}
```

### Rename Table
```
PATCH /api/tables/:tableId/rename
```

**Request Body:**
```json
{
  "name": "VIP Corner Table",
  "number": 25
}
```

**Response:**
```json
{
  "message": "Table renamed from \"Table 14\" to \"VIP Corner Table\"",
  "table": {
    "id": "14",
    "number": 25,
    "name": "VIP Corner Table"
  },
  "changes": {
    "oldName": "Table 14",
    "newName": "VIP Corner Table",
    "oldNumber": 14,
    "newNumber": 25
  }
}
```

### Bulk Create Tables
```
POST /api/tables/bulk-create
```

**Request Body:**
```json
{
  "section": "indoor",
  "tables": [
    {
      "name": "Window Table 1",
      "seats": 2,
      "shape": "round"
    },
    {
      "name": "Window Table 2", 
      "seats": 2,
      "shape": "round"
    },
    {
      "name": "Center Table",
      "seats": 8,
      "shape": "rectangle"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Successfully created 3 tables",
  "created": 3,
  "errors": 0,
  "tables": [
    {
      "id": "15",
      "number": 15,
      "name": "Window Table 1",
      "seats": 2,
      "section": "indoor"
    }
  ],
  "errorDetails": []
}
```

### Duplicate Table
```
POST /api/tables/:tableId/duplicate
```

**Request Body:**
```json
{
  "customName": "VIP Table 2",
  "customNumber": 26
}
```

**Response:**
```json
{
  "message": "Table duplicated successfully",
  "originalTable": {
    "id": "14",
    "number": 25,
    "name": "VIP Corner Table"
  },
  "duplicateTable": {
    "id": "16",
    "number": 26,
    "name": "VIP Table 2",
    "seats": 6,
    "shape": "rectangle",
    "section": "outdoor"
  }
}
```

### Get Next Table Number
```
GET /api/tables/next-number
```

**Response:**
```json
{
  "nextNumber": 27,
  "suggestedName": "Table 27"
}
```

## Frontend Usage

### Using the Enhanced API Client

```typescript
import { tablesAPI } from '@/api/tables.api';

// Quick create a table
const createQuickTable = async () => {
  try {
    const response = await tablesAPI.quickCreateTable({
      section: "outdoor",
      seats: 4,
      shape: "square",
      customName: "Patio Corner"
    });
    
    toast.success(response.data.message);
    refreshTables();
  } catch (error) {
    toast.error('Failed to create table');
  }
};

// Rename a table
const renameTable = async (tableId: string) => {
  try {
    const response = await tablesAPI.renameTable(tableId, {
      name: "VIP Booth",
      number: 99
    });
    
    const { changes } = response.data;
    toast.success(`Renamed from "${changes.oldName}" to "${changes.newName}"`);
    refreshTables();
  } catch (error) {
    toast.error('Failed to rename table');
  }
};

// Bulk create tables
const setupNewSection = async () => {
  try {
    const response = await tablesAPI.bulkCreateTables({
      section: "terrace",
      tables: [
        { name: "Terrace 1", seats: 2, shape: "round" },
        { name: "Terrace 2", seats: 2, shape: "round" },
        { name: "Terrace 3", seats: 4, shape: "square" },
        { name: "Terrace VIP", seats: 8, shape: "rectangle" }
      ]
    });
    
    const { created, errors } = response.data;
    toast.success(`Created ${created} tables${errors > 0 ? ` (${errors} errors)` : ''}`);
    refreshTables();
  } catch (error) {
    toast.error('Failed to create tables');
  }
};

// Duplicate existing table
const duplicateTable = async (tableId: string) => {
  try {
    const response = await tablesAPI.duplicateTable(tableId, {
      customName: "Copy of VIP Table"
    });
    
    toast.success(response.data.message);
    refreshTables();
  } catch (error) {
    toast.error('Failed to duplicate table');
  }
};

// Get next available number
const getNextNumber = async () => {
  try {
    const response = await tablesAPI.getNextTableNumber();
    const { nextNumber, suggestedName } = response.data;
    
    console.log(`Next available: ${nextNumber} (${suggestedName})`);
    return { nextNumber, suggestedName };
  } catch (error) {
    console.error('Failed to get next number');
  }
};
```

## Business Logic & Validation

### Table Creation Rules

1. **Auto-numbering:**
   - Automatically finds highest existing table number
   - Assigns next sequential number
   - Can override with custom number (validates uniqueness)

2. **Smart naming:**
   - Default: `"Table {number}"`
   - With section: `"{Section} {number}"` (e.g., "Outdoor 14")
   - Custom names always take precedence

3. **Default values:**
   - Seats: 4
   - Shape: "square"
   - Section: "main"
   - Status: "available"
   - Position: { x: 0, y: 0 } (can be updated via drag & drop)

### Rename Validation

1. **Safety checks:**
   - Cannot rename tables with active orders
   - Must provide either name or number (or both)
   - Number uniqueness validation

2. **Change tracking:**
   - Logs old and new values
   - Returns detailed change summary
   - Console logging for audit trail

### Bulk Operations

1. **Error handling:**
   - Continues processing even if individual tables fail
   - Returns detailed error list
   - Provides success/failure counts

2. **Number assignment:**
   - Uses provided numbers when available
   - Auto-assigns sequential numbers for missing values
   - Validates uniqueness for all numbers

## Common Use Cases

### 🏪 New Restaurant Setup
```typescript
// Create all tables for a new restaurant
const setupRestaurant = async () => {
  // Outdoor section
  await tablesAPI.bulkCreateTables({
    section: "outdoor",
    tables: [
      { seats: 2, shape: "round" },
      { seats: 2, shape: "round" },
      { seats: 4, shape: "square" },
      { seats: 6, shape: "rectangle" }
    ]
  });
  
  // Indoor section
  await tablesAPI.bulkCreateTables({
    section: "indoor", 
    tables: [
      { seats: 4, shape: "square" },
      { seats: 4, shape: "square" },
      { seats: 8, shape: "rectangle" },
      { seats: 2, shape: "round" }
    ]
  });
};
```

### ✏️ Table Rebranding
```typescript
// Rename tables for special events
const rebrandForEvent = async () => {
  await tablesAPI.renameTable("1", { name: "Birthday VIP" });
  await tablesAPI.renameTable("2", { name: "Anniversary Special" });
  await tablesAPI.renameTable("3", { name: "Corporate Meeting" });
};
```

### 📦 Section Expansion
```typescript
// Add new patio section
const expandPatio = async () => {
  // Get next available number
  const { nextNumber } = await tablesAPI.getNextTableNumber();
  
  // Create patio tables starting from next number
  await tablesAPI.bulkCreateTables({
    section: "patio",
    tables: [
      { number: nextNumber, name: "Patio Corner", seats: 2 },
      { number: nextNumber + 1, name: "Patio Center", seats: 4 },
      { number: nextNumber + 2, name: "Patio VIP", seats: 8 }
    ]
  });
};
```

### 🔄 Template Duplication
```typescript
// Duplicate successful table layouts
const duplicateSuccessfulLayout = async () => {
  const vipTableId = "5"; // Existing VIP table
  
  // Create 3 more VIP tables with same settings
  await tablesAPI.duplicateTable(vipTableId, { customName: "VIP Table 2" });
  await tablesAPI.duplicateTable(vipTableId, { customName: "VIP Table 3" });
  await tablesAPI.duplicateTable(vipTableId, { customName: "VIP Table 4" });
};
```

## Error Handling

### Common Error Scenarios

**Table Number Conflict:**
```json
{
  "message": "Table number 25 already exists"
}
```

**Rename During Service:**
```json
{
  "message": "Cannot rename table with active orders. Please complete orders first."
}
```

**Missing Required Fields:**
```json
{
  "message": "Either name or number must be provided"
}
```

**Bulk Creation Errors:**
```json
{
  "message": "Successfully created 3 tables",
  "created": 3,
  "errors": 1,
  "errorDetails": ["Table 15 already exists"]
}
```

## Database Changes

The system automatically handles:
- ✅ Auto-incrementing table numbers
- ✅ Uniqueness validation
- ✅ Position offset for duplicated tables
- ✅ Section organization
- ✅ Status management
- ✅ Change logging

## Security & Safety

- ✅ Authentication required for all endpoints
- ✅ Active order validation before renaming
- ✅ Number uniqueness checks
- ✅ Input validation and sanitization
- ✅ Error handling with detailed feedback
- ✅ Transaction safety

## Integration Tips

### UI Components to Build

1. **Quick Create Button** - One-click table creation
2. **Rename Modal** - Easy table renaming interface
3. **Bulk Setup Wizard** - Multi-table creation flow
4. **Duplicate Action** - Right-click context menu
5. **Number Picker** - Shows next available numbers

### Real-time Updates

```typescript
// Refresh table list after operations
const handleTableOperation = async (operation: () => Promise<any>) => {
  try {
    await operation();
    // Refresh tables in UI
    await refreshTables();
    // Update table layout if needed
    updateTableLayout();
  } catch (error) {
    handleError(error);
  }
};
```

The enhanced table management system is now ready to use! It provides all the flexibility you need for easy table creation and renaming operations. 🎉
