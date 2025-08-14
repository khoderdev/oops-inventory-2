# Table Transfer System

This system allows you to easily move orders and individual items between tables in your restaurant POS system.

## Features

### 1. Transfer Entire Order
Move a complete order from one table to another table.

**Use Case:** Customer moves from Table 1 to Table 5 with their entire order (burger, salad, pepsi).

### 2. Transfer Specific Items
Move only selected items from one table to another table.

**Use Case:** Table 3 has chicken sub and fries, but customer wants to move only the fries to Table 7.

## API Endpoints

### Transfer Complete Order
```
POST /api/tables/transfer-order
```

**Request Body:**
```json
{
  "fromTableId": "1",
  "toTableId": "5", 
  "orderId": "123"
}
```

**Response:**
```json
{
  "message": "Order successfully transferred from Table 1 to Table 5",
  "order": {
    "id": 123,
    "orderNumber": "T5-1692123456",
    "fromTable": 1,
    "toTable": 5,
    "itemCount": 3
  }
}
```

### Transfer Specific Items
```
POST /api/tables/transfer-items
```

**Request Body:**
```json
{
  "fromTableId": "3",
  "toTableId": "7",
  "itemIds": ["456"],
  "createNewOrder": true
}
```

**Response:**
```json
{
  "message": "1 items successfully transferred from Table 3 to Table 7",
  "transfer": {
    "fromTable": 3,
    "toTable": 7,
    "itemsTransferred": 1,
    "transferredTotal": "8.50",
    "allItemsTransferred": false,
    "items": [
      {
        "id": "456",
        "name": "Fries",
        "quantity": 1,
        "price": "8.50",
        "total": "8.50"
      }
    ]
  }
}
```

## Frontend Usage

### Using the API Client

```typescript
import { tablesAPI } from '@/api/tables.api';

// Transfer entire order
const transferOrder = async () => {
  try {
    const response = await tablesAPI.transferOrder({
      fromTableId: "1",
      toTableId: "5",
      orderId: "123"
    });
    console.log(response.data.message);
  } catch (error) {
    console.error('Transfer failed:', error);
  }
};

// Transfer specific items
const transferItems = async () => {
  try {
    const response = await tablesAPI.transferItems({
      fromTableId: "3",
      toTableId: "7", 
      itemIds: ["456"],
      createNewOrder: true
    });
    console.log(response.data.message);
  } catch (error) {
    console.error('Transfer failed:', error);
  }
};
```

## Business Logic

### Order Transfer Rules

1. **Source Table Requirements:**
   - Must have an active order (draft, confirmed, preparing, or ready status)
   - Table must be active

2. **Destination Table Requirements:**
   - Must be active
   - For complete order transfer: Must NOT have an active order
   - For item transfer: Can have existing order (items will be merged)

3. **Automatic Status Updates:**
   - Source table becomes "available" if all items transferred
   - Destination table becomes "opened" 
   - Order totals are automatically recalculated

### Item Transfer Scenarios

#### Scenario 1: Transfer to Empty Table
- Creates new order on destination table
- Transfers selected items
- Recalculates totals for both orders

#### Scenario 2: Transfer to Table with Existing Order  
- Merges items into existing destination order
- Updates destination order totals
- Source order keeps remaining items

#### Scenario 3: Transfer All Items
- Source order is cancelled
- Source table becomes available
- All items moved to destination

## Error Handling

### Common Error Responses

**Missing Required Fields:**
```json
{
  "message": "Missing required fields: fromTableId, toTableId, and orderId are required"
}
```

**Same Table Transfer:**
```json
{
  "message": "Cannot transfer order to the same table"
}
```

**Table Not Found:**
```json
{
  "message": "Source table not found"
}
```

**Destination Has Active Order:**
```json
{
  "message": "Destination table already has an active order. Use transferItems to merge orders."
}
```

**No Active Order:**
```json
{
  "message": "Destination table has no active order. Set createNewOrder=true to create a new order."
}
```

## Implementation Examples

### Complete Order Transfer Flow
```typescript
// Example: Move entire order from Table 1 to Table 5
const moveCustomerToNewTable = async () => {
  const fromTableId = "1";
  const toTableId = "5"; 
  const orderId = "123";

  try {
    const result = await tablesAPI.transferOrder({
      fromTableId,
      toTableId, 
      orderId
    });
    
    // Show success message
    toast.success(result.data.message);
    
    // Refresh table data
    refreshTables();
    
  } catch (error) {
    toast.error('Failed to transfer order');
  }
};
```

### Selective Item Transfer Flow
```typescript
// Example: Move only fries from Table 3 to Table 7
const moveSpecificItems = async () => {
  const fromTableId = "3";
  const toTableId = "7";
  const friesItemId = "456";

  try {
    const result = await tablesAPI.transferItems({
      fromTableId,
      toTableId,
      itemIds: [friesItemId],
      createNewOrder: true // Create new order if table 7 is empty
    });
    
    // Show transfer summary
    const { transfer } = result.data;
    toast.success(
      `Transferred ${transfer.itemsTransferred} items (${transfer.transferredTotal}) 
       from Table ${transfer.fromTable} to Table ${transfer.toTable}`
    );
    
    // Refresh both tables
    refreshTables();
    
  } catch (error) {
    toast.error('Failed to transfer items');
  }
};
```

## Database Changes

The system automatically handles:
- ✅ Order table updates (tableId changes)
- ✅ OrderItem table updates (orderId changes for item transfers)
- ✅ Table status updates (available/opened)
- ✅ Order total recalculations
- ✅ Order cancellation when all items transferred

## Security & Validation

- ✅ Authentication required for all endpoints
- ✅ Table existence validation
- ✅ Order ownership validation  
- ✅ Active status validation
- ✅ Transferable order status validation
- ✅ Automatic total recalculation
- ✅ Transaction safety with error rollback

## Next Steps

To integrate this into your POS interface:

1. **Add Transfer Buttons** to table management UI
2. **Create Transfer Modal** for selecting destination table
3. **Add Item Selection** for partial transfers
4. **Implement Real-time Updates** to refresh table states
5. **Add Transfer History** logging for audit trails

The system is now ready to use! Both endpoints are fully functional and handle all edge cases safely.
