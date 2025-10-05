# TransferTableModal Debugging Guide

## Issue
The TransferTableModal is not rendering when clicking "Transfer Order" from the context menu.

## Debugging Added

### 1. **TableContextMenu.tsx** - Context Menu Click Handlers
Added console logs to all context menu options:

- ✏️ **Rename** - Logs when rename is clicked
- 🔄 **Transfer** - Logs when transfer is clicked + table details (status, currentOrder, tableOrders)
- 🧹 **Clear** - Logs when clear is clicked + validation status
- 🗑️ **Delete** - Logs when delete is clicked + validation status

### 2. **TablesLayout.tsx** - Handler Functions
Added console logs to all handler functions:

- `handleRenameTable()` - Logs table and modal state change
- `handleTransferOrder()` - Logs table, order fetch, and modal state change
- `handleDeleteTable()` - Logs table and modal state change
- `requestClearTable()` - Logs table and dialog state change

### 3. **TransferTableModal.tsx** - Modal Rendering
Added console logs to:

- Component render - Shows isOpen, sourceTable, sourceOrder, tables count
- Early return check - Shows why modal returns null if data is missing

## How to Debug

### Step 1: Open Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Clear console

### Step 2: Right-click on a Table with an Order
1. Find a table with status "opened" (red background)
2. Right-click on it
3. Click "Transfer Order"

### Step 3: Check Console Logs

You should see this sequence:

```
🔄 [TableContextMenu] Transfer clicked for table: {id: X, number: Y, ...}
📋 [TableContextMenu] Table details: {status: "opened", currentOrder: {...}, tableOrders: N}
🔄 [TablesLayout] handleTransferOrder called for table: {id: X, ...}
📡 [TablesLayout] Fetching order details for orderId: Z
✅ [TablesLayout] Order data fetched: {...}
✅ [TablesLayout] Transfer modal state set to true
🔍 [TablesLayout] TransferTableModal render check: {showTransferModal: true, ...}
🔍 [TransferTableModal] Component render: {isOpen: true, sourceTable: {...}, sourceOrder: {...}}
```

### Step 4: Identify the Problem

#### If you see "⚠️ [TransferTableModal] Early return - missing data":
- **Problem**: Modal is returning null because sourceTable or sourceOrder is missing
- **Check**: The log will show which one is missing (hasSourceTable, hasSourceOrder)
- **Solution**: Fix the data flow in TablesLayout.tsx handleTransferOrder()

#### If you DON'T see "🔄 [TableContextMenu] Transfer clicked":
- **Problem**: Context menu click is not firing
- **Check**: Is the "Transfer Order" option visible in the context menu?
- **Solution**: Check table.status, table.currentOrder, or tableOrders data

#### If you see logs stop at "📡 [TablesLayout] Fetching order details":
- **Problem**: API call is failing
- **Check**: Network tab for failed requests
- **Solution**: Fix the ordersAPI.getOrder() call or backend endpoint

#### If showTransferModal is true but modal doesn't render:
- **Problem**: Dialog component issue or z-index problem
- **Check**: Inspect DOM for Dialog elements
- **Solution**: Check Dialog component props and CSS

## Expected Behavior

When working correctly:
1. ✅ Context menu shows "Transfer Order" for tables with orders
2. ✅ Clicking "Transfer Order" fetches order details
3. ✅ Modal state is set to true
4. ✅ TransferTableModal renders with all required props
5. ✅ Modal displays with source table info and destination selection

## Common Issues

### Issue 1: Modal Returns Null
**Symptom**: `⚠️ [TransferTableModal] Early return - missing data`

**Cause**: `sourceTable` or `sourceOrder` is null/undefined

**Fix**: Check `handleTransferOrder()` in TablesLayout.tsx - ensure both states are set correctly

### Issue 2: No Order Data
**Symptom**: `❌ [TablesLayout] No order found for table X`

**Cause**: `table.currentOrder?.orderId` is missing

**Fix**: Ensure tables are loaded with `includeOrders: true` in API call

### Issue 3: API Fetch Fails
**Symptom**: `❌ [TablesLayout] Failed to fetch order details`

**Cause**: ordersAPI.getOrder() throws error

**Fix**: Check backend endpoint and order ID validity

## Testing Other Context Menu Functions

### Rename Table
1. Right-click any table
2. Click "Rename Table"
3. Check console for: `✏️ [TableContextMenu] Rename clicked`
4. Modal should open

### Clear Table
1. Right-click a table with status "opened" or "reserved"
2. Click "Clear Table"
3. Check console for: `🧹 [TableContextMenu] Clear clicked`
4. Dialog should open

### Delete Table
1. Right-click a table with status NOT "opened"
2. Click "Delete Table"
3. Check console for: `🗑️ [TableContextMenu] Delete clicked`
4. Confirmation modal should open

## Next Steps

After identifying the issue from console logs:

1. **If data flow issue**: Fix state management in TablesLayout.tsx
2. **If API issue**: Fix backend endpoint or data structure
3. **If rendering issue**: Check Dialog component and CSS
4. **If validation issue**: Update conditional logic in TransferTableModal.tsx

## Remove Debugging

Once fixed, remove console.log statements from:
- `src/components/ui/TableContextMenu.tsx`
- `src/components/pos/TablesLayout.tsx`
- `src/components/tables/TransferTableModal.tsx`
