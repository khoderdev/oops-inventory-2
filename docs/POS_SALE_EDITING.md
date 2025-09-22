# POS Sale Editing

This document explains how the POS system handles editing existing sales.

## Overview

When a user selects a sale for editing from the Sales History page, the system loads the sale data into the POS interface. When the user makes changes and saves or completes the payment, the system should update the existing sale instead of creating a new one.

## Implementation Details

### Sale Selection

1. In the Sales History page (`Sales.tsx`), when a user clicks on a sale row, the `handleSaleClick` function is called:
   - It sets the `selectedSaleForEdit` in the Redux store
   - It navigates to the POS screen

2. In the POS screen (`POSClient.tsx`), the `useEffect` hook detects the `selectedSaleForEdit` and loads the sale data into the cart:
   - It clears the current cart and state
   - It sets the order type, table, and employee based on the selected sale
   - It adds the sale items to the cart
   - It applies any discount and notes from the sale

### Sale Update

When the user makes changes to the sale, there are two possible actions:

#### Manual Save

When the user clicks "Save":

1. The `handleManualSave` function is called
2. It checks if `currentOrder?.id || selectedSaleForEdit?.id` exists
3. If it exists:
   - It prepares the update data with the current cart items, order type, etc.
   - It calls `updateOrder` with the appropriate ID and updated data
   - It shows a success message
4. If not:
   - It creates a new order with `createOrder`
5. After successful operations, it clears `selectedSaleForEdit` from the Redux store

#### Payment

When the user clicks "Pay":

1. The `handlePayment` function is called
2. If there's no current order but `selectedSaleForEdit` exists:
   - It prepares the update data with the current cart items, order type, etc.
   - It calls `updateOrder` first to update the existing sale
   - Then it calls `completeOrder` to finalize the payment
3. If there's no `selectedSaleForEdit`:
   - It creates a new order with `createOrder`
   - Then it calls `completeOrder` to finalize the payment
4. After successful operations, it clears `selectedSaleForEdit` from the Redux store

## Key Components

- `selectedSaleForEdit`: Redux state that stores the selected sale for editing
- `updateOrder`: API function that updates an existing order
- `createOrder`: API function that creates a new order
- `completeOrder`: API function that completes an order and converts it to a sale

## Error Handling

- If the cart is empty, the system shows an error message
- If the API calls fail, the system shows an error message and logs the error to the console
- TypeScript type safety ensures that the data passed to the API functions is correct

## Future Improvements

- Add a visual indicator in the POS interface to show that the user is editing an existing sale
- Add confirmation dialog when the user tries to cancel editing a sale
- Add ability to revert changes to the original sale data
