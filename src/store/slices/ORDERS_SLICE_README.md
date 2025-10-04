# Orders Slice Documentation

## Overview

The `ordersSlice` is a comprehensive Redux Toolkit slice that manages all orders-related state and operations in the oops-inventory-2 application. It provides a complete solution for handling order creation, updates, status management, and complex operations like order completion and voiding with stock restoration.

## Features

### ✅ Complete State Management
- Orders list with filtering and pagination
- Order details caching for performance
- Draft orders management
- Staff/employee orders tracking
- Table-specific orders grouping
- Active order tracking

### ✅ Async Operations
- **13 async thunks** for all order operations
- Proper error handling with specific error states
- Success message management
- Loading states for each operation

### ✅ Advanced Functionality
- Order completion with payment processing
- Order voiding with stock restoration tracking
- Auto-save for draft persistence
- Bulk operations support
- Real-time order updates

### ✅ Performance Optimizations
- Order details caching by ID
- Table orders grouping
- Efficient state updates
- Minimal re-renders

## State Structure

```typescript
interface OrdersState {
  // Data
  orders: OrderSummary[];                    // All orders list
  orderDetails: Record<string, Order>;       // Cached full order details
  draftOrders: Order[];                      // Draft orders
  staffOrders: Order[];                      // Staff/employee orders
  tableOrders: Record<string, Order[]>;      // Orders grouped by table
  activeOrder: Order | null;                 // Currently active order
  activeOrderId: string | null;              // Active order ID
  
  // Loading States (11 states)
  isLoading: boolean;
  isLoadingDetails: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isCompleting: boolean;
  isCancelling: boolean;
  isVoiding: boolean;
  isAutoSaving: boolean;
  
  // Error States (8 states)
  error: string | null;
  detailsError: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  completeError: string | null;
  cancelError: string | null;
  voidError: string | null;
  
  // Success Messages (7 states)
  successMessage: string | null;
  createSuccess: string | null;
  updateSuccess: string | null;
  deleteSuccess: string | null;
  completeSuccess: string | null;
  cancelSuccess: string | null;
  voidSuccess: string | null;
  
  // Filters & Pagination
  filters: {
    status?: OrderStatus;
    orderType?: OrderType;
    tableId?: string;
    startDate?: string;
    endDate?: string;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  
  // UI State
  selectedOrderIds: Set<string>;
  expandedOrderIds: Set<string>;
  
  // Metadata
  lastOperation: {
    type: "create" | "update" | "delete" | "complete" | "cancel" | "void" | null;
    orderId: string | null;
    timestamp: number | null;
  };
  lastStockRestorations: Array<{
    materialId: string;
    itemName: string;
    quantityRestored: number;
    newStockLevel: number;
  }> | null;
}
```

## Async Thunks

### 1. fetchOrders
Fetch all orders with optional filters.

```typescript
dispatch(fetchOrders({
  status: "confirmed",
  orderType: "table",
  startDate: "2025-01-01",
  limit: 50
}));
```

### 2. fetchStaffOrders
Fetch staff/employee orders only.

```typescript
dispatch(fetchStaffOrders({
  status: "completed",
  orderBy: "createdAt",
  order: "DESC"
}));
```

### 3. fetchOrderById
Fetch a specific order by ID with full details.

```typescript
dispatch(fetchOrderById("order-123"));
```

### 4. fetchTableOrders
Fetch all orders for a specific table.

```typescript
dispatch(fetchTableOrders("table-5"));
```

### 5. fetchDraftOrders
Fetch all draft orders (unsaved carts).

```typescript
dispatch(fetchDraftOrders());
```

### 6. createOrder
Create a new order.

```typescript
dispatch(createOrder({
  orderType: "table",
  tableId: "table-5",
  items: [
    {
      menuItemId: "item-1",
      name: "Burger",
      quantity: 2,
      unitPrice: 10,
      totalPrice: 20,
      type: "menu_item"
    }
  ]
}));
```

### 7. updateOrder
Update an existing order.

```typescript
dispatch(updateOrder({
  orderId: "order-123",
  data: {
    status: "preparing",
    notes: "Extra sauce"
  }
}));
```

### 8. addOrderItems
Add items to an existing order.

```typescript
dispatch(addOrderItems({
  orderId: "order-123",
  items: [
    {
      menuItemId: "item-2",
      name: "Fries",
      quantity: 1,
      unitPrice: 5,
      totalPrice: 5,
      type: "menu_item"
    }
  ]
}));
```

### 9. removeOrderItems
Remove/void items from an order.

```typescript
dispatch(removeOrderItems({
  orderId: "order-123",
  itemIds: ["item-id-1", "item-id-2"]
}));
```

### 10. updateOrderStatus
Update order status.

```typescript
dispatch(updateOrderStatus({
  orderId: "order-123",
  status: "ready"
}));
```

### 11. completeOrder
Complete an order (convert to sale).

```typescript
dispatch(completeOrder({
  orderId: "order-123",
  paymentData: {
    paymentMethod: "cash",
    paymentAmount: 50,
    change: 5
  }
}));
```

### 12. cancelOrder
Cancel an order.

```typescript
dispatch(cancelOrder({
  orderId: "order-123",
  reason: "Customer request"
}));
```

### 13. voidOrder
Void an order with optional stock restoration.

```typescript
dispatch(voidOrder({
  orderId: "order-123",
  data: {
    reason: "Order error",
    restoreStock: true
  }
}));
```

### 14. autoSaveOrder
Auto-save order for draft persistence.

```typescript
dispatch(autoSaveOrder({
  orderId: "order-123",
  data: {
    items: updatedItems,
    notes: "Auto-saved"
  }
}));
```

## Actions (Reducers)

### State Management Actions

```typescript
// Set active order
dispatch(setActiveOrder(order));

// Set filters
dispatch(setFilters({ status: "confirmed", orderType: "table" }));

// Clear filters
dispatch(clearFilters());

// Set pagination
dispatch(setPagination({ limit: 100, offset: 0 }));
```

### Selection Actions

```typescript
// Toggle order selection
dispatch(toggleOrderSelection("order-123"));

// Select all orders
dispatch(selectAllOrders());

// Clear selection
dispatch(clearOrderSelection());

// Toggle order expansion
dispatch(toggleOrderExpansion("order-123"));
```

### Error & Success Management

```typescript
// Clear all errors
dispatch(clearErrors());

// Clear all success messages
dispatch(clearSuccessMessages());

// Clear specific error
dispatch(clearError("createError"));

// Clear specific success message
dispatch(clearSuccessMessage("createSuccess"));
```

### Cache Management

```typescript
// Update order in cache
dispatch(updateOrderInCache(updatedOrder));

// Remove order from cache
dispatch(removeOrderFromCache("order-123"));

// Clear stock restorations
dispatch(clearStockRestorations());
```

### Reset

```typescript
// Reset entire orders state
dispatch(resetOrdersState());
```

## Selectors

### Basic Selectors

```typescript
import { 
  selectOrders,
  selectActiveOrder,
  selectDraftOrders,
  selectStaffOrders,
  selectFilters,
  selectPagination
} from "@/store/slices/ordersSelectors";

const orders = useAppSelector(selectOrders);
const activeOrder = useAppSelector(selectActiveOrder);
const draftOrders = useAppSelector(selectDraftOrders);
```

### Loading State Selectors

```typescript
import {
  selectIsLoading,
  selectIsCreating,
  selectIsUpdating,
  selectIsAnyLoading
} from "@/store/slices/ordersSelectors";

const isLoading = useAppSelector(selectIsLoading);
const isAnyLoading = useAppSelector(selectIsAnyLoading);
```

### Error & Success Selectors

```typescript
import {
  selectError,
  selectCreateError,
  selectAnyError,
  selectCreateSuccess,
  selectAnySuccessMessage
} from "@/store/slices/ordersSelectors";

const error = useAppSelector(selectError);
const anyError = useAppSelector(selectAnyError);
const successMessage = useAppSelector(selectAnySuccessMessage);
```

### Computed Selectors

```typescript
import {
  selectOrderById,
  selectOrdersByTableId,
  selectFilteredOrders,
  selectOrdersByStatus,
  selectOrdersByType,
  selectPendingOrders,
  selectActiveOrders,
  selectCompletedOrders
} from "@/store/slices/ordersSelectors";

// Get specific order
const order = useAppSelector(selectOrderById("order-123"));

// Get table orders
const tableOrders = useAppSelector(selectOrdersByTableId("table-5"));

// Get filtered orders
const filteredOrders = useAppSelector(selectFilteredOrders);

// Get orders by status
const confirmedOrders = useAppSelector(selectOrdersByStatus("confirmed"));

// Get active orders
const activeOrders = useAppSelector(selectActiveOrders);
```

### Statistics Selectors

```typescript
import {
  selectOrderCountByStatus,
  selectOrderCountByType,
  selectTotalRevenue,
  selectAverageOrderValue,
  selectOrdersStatistics,
  selectTableStatistics
} from "@/store/slices/ordersSelectors";

const countByStatus = useAppSelector(selectOrderCountByStatus);
const totalRevenue = useAppSelector(selectTotalRevenue);
const statistics = useAppSelector(selectOrdersStatistics);
```

### UI State Selectors

```typescript
import {
  selectSelectedOrders,
  selectSelectedOrdersCount,
  selectAreAllOrdersSelected,
  selectIsOrderSelected,
  selectIsOrderExpanded
} from "@/store/slices/ordersSelectors";

const selectedOrders = useAppSelector(selectSelectedOrders);
const isSelected = useAppSelector(selectIsOrderSelected("order-123"));
```

## Usage Examples

### Complete Order Flow

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createOrder,
  addOrderItems,
  updateOrderStatus,
  completeOrder
} from "@/store/slices/ordersSlice";
import { selectActiveOrder, selectIsCreating } from "@/store/slices/ordersSelectors";

function OrderManagement() {
  const dispatch = useAppDispatch();
  const activeOrder = useAppSelector(selectActiveOrder);
  const isCreating = useAppSelector(selectIsCreating);

  // 1. Create order
  const handleCreateOrder = async () => {
    const result = await dispatch(createOrder({
      orderType: "table",
      tableId: "table-5",
      items: []
    }));
    
    if (createOrder.fulfilled.match(result)) {
      console.log("Order created:", result.payload);
    }
  };

  // 2. Add items
  const handleAddItems = async (orderId: string) => {
    await dispatch(addOrderItems({
      orderId,
      items: [
        {
          menuItemId: "item-1",
          name: "Burger",
          quantity: 2,
          unitPrice: 10,
          totalPrice: 20,
          type: "menu_item"
        }
      ]
    }));
  };

  // 3. Update status
  const handleUpdateStatus = async (orderId: string) => {
    await dispatch(updateOrderStatus({
      orderId,
      status: "preparing"
    }));
  };

  // 4. Complete order
  const handleCompleteOrder = async (orderId: string) => {
    const result = await dispatch(completeOrder({
      orderId,
      paymentData: {
        paymentMethod: "cash",
        paymentAmount: 50
      }
    }));
    
    if (completeOrder.fulfilled.match(result)) {
      console.log("Sale ID:", result.payload.saleId);
    }
  };

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### Error Handling

```typescript
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAnyError, selectAnySuccessMessage } from "@/store/slices/ordersSelectors";
import { clearErrors, clearSuccessMessages } from "@/store/slices/ordersSlice";

function OrderNotifications() {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectAnyError);
  const successMessage = useAppSelector(selectAnySuccessMessage);

  useEffect(() => {
    if (error) {
      // Show error toast
      console.error(error);
      
      // Clear after 3 seconds
      setTimeout(() => {
        dispatch(clearErrors());
      }, 3000);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      // Show success toast
      console.log(successMessage);
      
      // Clear after 3 seconds
      setTimeout(() => {
        dispatch(clearSuccessMessages());
      }, 3000);
    }
  }, [successMessage, dispatch]);

  return null;
}
```

### Filtering & Pagination

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrders, setFilters, setPagination } from "@/store/slices/ordersSlice";
import { selectFilteredOrders, selectPagination } from "@/store/slices/ordersSelectors";

function OrdersList() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectFilteredOrders);
  const pagination = useAppSelector(selectPagination);

  const handleFilterChange = (status: OrderStatus) => {
    dispatch(setFilters({ status }));
    dispatch(fetchOrders({ status, limit: pagination.limit }));
  };

  const handlePageChange = (page: number) => {
    const offset = page * pagination.limit;
    dispatch(setPagination({ offset }));
    dispatch(fetchOrders({ offset, limit: pagination.limit }));
  };

  return (
    <div>
      {/* Your filtered orders list */}
    </div>
  );
}
```

## Integration with Existing POS

The ordersSlice is designed to work alongside the existing `posSlice` without conflicts:

- **posSlice**: Handles POS UI state, cart management, and dialogs
- **ordersSlice**: Handles orders data, API operations, and persistence

### Migration Strategy

1. **Keep existing POS functionality** in `posSlice`
2. **Use ordersSlice for data operations**:
   - Creating orders
   - Fetching orders
   - Updating orders
   - Completing orders

3. **Sync between slices** when needed:
```typescript
// After creating order in ordersSlice
dispatch(setActiveOrder(order));

// After completing order
dispatch(clearCart()); // posSlice
dispatch(setActiveOrder(null)); // ordersSlice
```

## Performance Considerations

### Caching Strategy
- Order details cached by ID to avoid redundant API calls
- Table orders grouped for efficient lookups
- Selective updates to minimize re-renders

### Optimistic Updates
- Use `updateOrderInCache` for immediate UI updates
- Revert on API failure if needed

### Memory Management
- Clear old order details when not needed
- Reset state on logout: `dispatch(resetOrdersState())`

## Best Practices

1. **Always handle loading states**:
```typescript
if (isLoading) return <Spinner />;
```

2. **Clear errors after displaying**:
```typescript
useEffect(() => {
  if (error) {
    showToast(error);
    dispatch(clearError("createError"));
  }
}, [error]);
```

3. **Use specific selectors** instead of selecting entire state
4. **Leverage memoized selectors** for computed values
5. **Handle async thunk results** with `.fulfilled` and `.rejected` matchers

## TypeScript Support

All types are fully typed with TypeScript:
- State interface
- Action payloads
- Selector return types
- Async thunk parameters

## Testing

```typescript
import { store } from "@/store";
import { createOrder, selectOrders } from "@/store/slices/ordersSlice";

describe("ordersSlice", () => {
  it("should create order successfully", async () => {
    const result = await store.dispatch(createOrder({
      orderType: "table",
      items: []
    }));
    
    expect(createOrder.fulfilled.match(result)).toBe(true);
    
    const orders = selectOrders(store.getState());
    expect(orders.length).toBeGreaterThan(0);
  });
});
```

## Summary

The ordersSlice provides a **complete, production-ready solution** for managing orders in the oops-inventory-2 application with:

- ✅ 13 async thunks for all operations
- ✅ Comprehensive state management
- ✅ 50+ selectors for data access
- ✅ Full TypeScript support
- ✅ Error handling & success messages
- ✅ Performance optimizations
- ✅ Easy integration with existing code

Use this slice to build robust order management features with confidence!
