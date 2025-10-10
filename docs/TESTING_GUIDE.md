# POS Redux State Management - Testing Guide

**Purpose:** Verify that ephemeral state cleanup is working correctly after implementing Redux-first architecture improvements.

---

## Quick Test Summary

### ✅ What Should Work Now

1. **Tables Layout Cleanup**
   - Arrange mode should NOT persist across sessions
   - Drag mode should reset when component unmounts
   - Hover popups should disappear when closing
   - Modal states should reset properly

2. **POS Client Cleanup**
   - Error messages should clear on unmount
   - Success messages should clear on unmount
   - Loading states should reset properly

3. **Persistence**
   - Only cart, order data, and user selections should persist
   - UI state (dialogs, loading, errors) should NOT persist

---

## Manual Testing Checklist

### Test 1: Tables Layout State Cleanup

**Objective:** Verify ephemeral UI state doesn't persist

**Steps:**
1. Open POS Client
2. Click "Table" order type button
3. Click "Settings" to enter arrange mode
4. Enable "Drag" mode
5. Hover over a table (should see popup)
6. Click "Exit Settings"
7. Close Tables Layout dialog
8. Reopen Tables Layout

**Expected Results:**
- ✅ Arrange mode should be OFF
- ✅ Drag mode should be OFF
- ✅ No hover popup should appear
- ✅ Selected tool should be "select"

**How to Verify:**
```javascript
// Open browser console and check Redux state:
console.log(window.__REDUX_DEVTOOLS_EXTENSION__.getState().tables);

// Should see:
// isArrangeMode: false
// isDragMode: false
// hoveredTable: null
// popupPosition: null
// selectedTool: "select"
```

---

### Test 2: Tables Layout Persistence

**Objective:** Verify only important data persists

**Steps:**
1. Open Tables Layout
2. Select a table
3. Enable arrange mode
4. Start dragging a table
5. **Reload the page** (F5)
6. Check Redux state

**Expected Results:**
- ✅ Selected table SHOULD persist
- ✅ Table orders count SHOULD persist
- ✅ Printed tables SHOULD persist
- ❌ Arrange mode should be OFF (not persisted)
- ❌ Drag state should be null (not persisted)
- ❌ Hover state should be null (not persisted)

**How to Verify:**
```javascript
// After reload, check localStorage:
const persistedState = JSON.parse(localStorage.getItem('persist:tables'));
console.log(persistedState);

// Should NOT contain:
// - isArrangeMode
// - isDragMode
// - hoveredTable
// - dragState
```

---

### Test 3: POS Client Error/Success Cleanup

**Objective:** Verify ephemeral messages clear on unmount

**Steps:**
1. Open POS Client
2. Trigger an error (try to void a non-existent order)
3. Wait for error message to appear
4. Navigate away from POS (or close component)
5. Navigate back to POS

**Expected Results:**
- ✅ Error message should be gone
- ✅ Success message should be gone
- ✅ Loading state should be false

**How to Verify:**
```javascript
// Check Redux state after returning:
console.log(window.__REDUX_DEVTOOLS_EXTENSION__.getState().pos);

// Should see:
// error: null
// successMessage: null
// isLoading: false
// showSuccessCheckmark: false
```

---

### Test 4: Dialog State Persistence

**Objective:** Verify dialogs don't persist across reloads

**Steps:**
1. Open POS Client
2. Open Payment Dialog
3. Open Discount Dialog
4. Open Notes Dialog
5. **Reload the page** (F5)
6. Check if any dialogs are open

**Expected Results:**
- ❌ Payment dialog should be CLOSED
- ❌ Discount dialog should be CLOSED
- ❌ Notes dialog should be CLOSED
- ❌ All other dialogs should be CLOSED

**How to Verify:**
```javascript
// After reload, check state:
const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState().pos;
console.log({
  showPaymentDialog: state.showPaymentDialog,
  showDiscountDialog: state.showDiscountDialog,
  showNotesDialog: state.showNotesDialog,
  showVoidDialog: state.showVoidDialog,
  showOrdersDialog: state.showOrdersDialog
});

// All should be: false
```

---

### Test 5: Cart Persistence (Should Work)

**Objective:** Verify important data DOES persist

**Steps:**
1. Open POS Client
2. Add items to cart
3. Select a table
4. Select order type "Table"
5. Apply a discount
6. Add order notes
7. **Reload the page** (F5)
8. Check if data persisted

**Expected Results:**
- ✅ Cart items SHOULD be there
- ✅ Selected table SHOULD be selected
- ✅ Order type SHOULD be "Table"
- ✅ Discount SHOULD be applied
- ✅ Order notes SHOULD be present

**How to Verify:**
```javascript
// After reload:
const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState().pos;
console.log({
  cart: state.cart,
  selectedTable: state.selectedTable,
  orderType: state.orderType,
  appliedDiscount: state.appliedDiscount,
  orderNotes: state.orderNotes
});

// All should have values
```

---

### Test 6: Complete Order Cleanup

**Objective:** Verify state resets after completing order

**Steps:**
1. Add items to cart
2. Apply discount
3. Add notes
4. Complete the order (pay)
5. Check Redux state

**Expected Results:**
- ✅ Cart should be empty
- ✅ Discount should be removed
- ✅ Notes should be cleared
- ✅ Success animation should show then clear

---

## Automated Testing (Future)

### Unit Tests for Reducers

```typescript
import { configureStore } from '@reduxjs/toolkit';
import posReducer, { resetDialogsState, resetEphemeralState } from '@/store/slices/posSlice';
import tablesReducer, { resetTablesUIState } from '@/store/slices/tablesSlice';

describe('POS State Cleanup', () => {
  describe('resetDialogsState', () => {
    it('should reset all dialog visibility flags', () => {
      const store = configureStore({
        reducer: { pos: posReducer }
      });
      
      // Set some dialogs to open
      store.dispatch({ type: 'pos/setShowPaymentDialog', payload: true });
      store.dispatch({ type: 'pos/setShowDiscountDialog', payload: true });
      store.dispatch({ type: 'pos/setShowNotesDialog', payload: true });
      
      // Reset
      store.dispatch(resetDialogsState());
      
      // Verify
      const state = store.getState().pos;
      expect(state.showPaymentDialog).toBe(false);
      expect(state.showDiscountDialog).toBe(false);
      expect(state.showNotesDialog).toBe(false);
      expect(state.showVoidDialog).toBe(false);
      expect(state.showOrdersDialog).toBe(false);
    });
  });

  describe('resetEphemeralState', () => {
    it('should reset error and success messages', () => {
      const store = configureStore({
        reducer: { pos: posReducer }
      });
      
      // Set some ephemeral state
      store.dispatch({ type: 'pos/setError', payload: 'Test error' });
      store.dispatch({ type: 'pos/setSuccessMessage', payload: 'Test success' });
      store.dispatch({ type: 'pos/setShowSuccessCheckmark', payload: true });
      
      // Reset
      store.dispatch(resetEphemeralState());
      
      // Verify
      const state = store.getState().pos;
      expect(state.error).toBe(null);
      expect(state.successMessage).toBe(null);
      expect(state.showSuccessCheckmark).toBe(false);
    });
  });

  describe('resetTablesUIState', () => {
    it('should reset all ephemeral tables UI state', () => {
      const store = configureStore({
        reducer: { tables: tablesReducer }
      });
      
      // Set some UI state
      store.dispatch({ type: 'tables/setIsArrangeMode', payload: true });
      store.dispatch({ type: 'tables/setIsDragMode', payload: true });
      store.dispatch({ type: 'tables/setSelectedTool', payload: 'round-table' });
      
      // Reset
      store.dispatch(resetTablesUIState());
      
      // Verify
      const state = store.getState().tables;
      expect(state.isArrangeMode).toBe(false);
      expect(state.isDragMode).toBe(false);
      expect(state.selectedTool).toBe('select');
      expect(state.hoveredTable).toBe(null);
      expect(state.popupPosition).toBe(null);
    });
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import TablesLayout from '@/components/pos/TablesLayout';

describe('TablesLayout Cleanup Integration', () => {
  it('should reset UI state when component unmounts', async () => {
    const { unmount } = render(
      <Provider store={store}>
        <TablesLayout onTableSelect={jest.fn()} onClose={jest.fn()} />
      </Provider>
    );
    
    // Enable arrange mode
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);
    
    // Verify arrange mode is on
    expect(store.getState().tables.isArrangeMode).toBe(true);
    
    // Unmount component
    unmount();
    
    // Verify state was reset
    await waitFor(() => {
      expect(store.getState().tables.isArrangeMode).toBe(false);
      expect(store.getState().tables.isDragMode).toBe(false);
      expect(store.getState().tables.hoveredTable).toBe(null);
    });
  });
});
```

---

## Debugging Tips

### Check Redux DevTools

1. Install Redux DevTools browser extension
2. Open browser console
3. Click "Redux" tab
4. Watch state changes in real-time

### Check Persisted State

```javascript
// View what's actually persisted in localStorage
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('persist:')) {
    console.log(key, JSON.parse(localStorage.getItem(key)));
  }
});
```

### Enable Debug Logging

The cleanup actions already have console.log statements:

```
🧹 [TablesLayout] Cleaning up ephemeral UI state on unmount
🧹 [POSClient] Cleaning up ephemeral state on unmount
🧹 [useResetOnUnmount] Cleaning up state: pos/resetDialogsState
```

Watch for these in the console to verify cleanup is happening.

---

## Common Issues & Solutions

### Issue 1: State Not Resetting

**Symptom:** Arrange mode still on after closing Tables Layout

**Possible Causes:**
1. Cleanup effect not running
2. Action not dispatched
3. Reducer not handling action

**Solution:**
```javascript
// Check if action is dispatched:
// Open Redux DevTools → Action tab
// Look for: tables/resetTablesUIState

// If not found, check component:
// - Is useEffect cleanup running?
// - Is dispatch imported correctly?
```

### Issue 2: State Persisting When It Shouldn't

**Symptom:** Dialog state persists after reload

**Possible Causes:**
1. Field not in blacklist
2. Persistence config not applied
3. Cache issue

**Solution:**
```javascript
// Clear persisted state:
localStorage.removeItem('persist:pos');
localStorage.removeItem('persist:tables');
// Then reload page

// Check blacklist in src/store/index.ts
// Ensure field is listed in blacklist array
```

### Issue 3: Important Data Not Persisting

**Symptom:** Cart is empty after reload

**Possible Causes:**
1. Field not in whitelist
2. Persistence config error
3. Redux persist not initialized

**Solution:**
```javascript
// Check whitelist in src/store/index.ts
// Ensure 'cart' is in whitelist array

// Verify persist is working:
console.log(localStorage.getItem('persist:pos'));
// Should see cart data
```

---

## Performance Verification

### Check for Memory Leaks

```javascript
// Before cleanup implementation:
// 1. Open Tables Layout
// 2. Enable arrange mode
// 3. Close and reopen 10 times
// 4. Check memory usage (Chrome DevTools → Memory)

// After cleanup implementation:
// Memory should not grow significantly
// State should reset each time
```

### Check for Unnecessary Re-renders

```javascript
// Use React DevTools Profiler
// 1. Start profiling
// 2. Open/close Tables Layout
// 3. Check render count
// Should not trigger unnecessary renders in other components
```

---

## Success Criteria

### ✅ All Tests Pass When:

1. **Ephemeral state resets on unmount**
   - Tables UI state (arrange, drag, hover)
   - Error/success messages
   - Loading states

2. **Persistence works correctly**
   - Cart data persists
   - Order data persists
   - UI state does NOT persist

3. **No memory leaks**
   - State doesn't accumulate
   - Cleanup runs on unmount

4. **No breaking changes**
   - All existing functionality works
   - User experience unchanged
   - Performance not degraded

---

## Next Steps After Testing

1. ✅ If all tests pass → Mark Phase 3 complete
2. ⚠️ If issues found → Debug and fix
3. 📝 Document any edge cases
4. 🚀 Proceed to Phase 2 (move local state to Redux)

---

## Contact & Support

If you encounter issues:
1. Check Redux DevTools for state
2. Check browser console for cleanup logs
3. Review `POS_STATE_AUDIT.md` for implementation details
4. Review `IMPLEMENTATION_SUMMARY.md` for what was changed
