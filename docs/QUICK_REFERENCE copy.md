# Redux State Management - Quick Reference

## 🎯 What Changed

### Before
```typescript
// Local state in components
const [paymentAmount, setPaymentAmount] = useState("");
const [showDayCloseDialog, setShowDayCloseDialog] = useState(false);
```

### After
```typescript
// Redux state
const { paymentAmount, showDayCloseDialog } = useAppSelector(state => state.pos);
dispatch(setPaymentAmount("100"));
dispatch(setShowDayCloseDialog(true));
```

---

## 🔧 New Redux Actions Available

### POS Slice Actions

#### State Setters
```typescript
dispatch(setPaymentAmount("100"));
dispatch(setShowDayCloseDialog(true));
dispatch(setClosingCash("500"));
dispatch(setDayCloseNotes("Good day"));
dispatch(setPrinterSelectionContext("payment"));
```

#### Cleanup Actions
```typescript
dispatch(resetPaymentState());        // Clear payment dialog
dispatch(resetDayCloseState());       // Clear day close dialog
dispatch(resetPrinterSelectionState()); // Clear printer selection
dispatch(resetDialogsState());        // Close all dialogs
dispatch(resetEphemeralState());      // Clear errors/messages
dispatch(resetSalesHistoryFilters()); // Reset report filters
```

### Tables Slice Actions

```typescript
dispatch(resetTablesUIState()); // Reset arrange mode, drag state, etc.
```

---

## 🧹 Cleanup Patterns

### Pattern 1: Reset on Dialog Close
```typescript
useEffect(() => {
  if (!showPaymentDialog) {
    dispatch(resetPaymentState());
  }
}, [showPaymentDialog, dispatch]);
```

### Pattern 2: Reset on Unmount
```typescript
useEffect(() => {
  return () => {
    dispatch(resetEphemeralState());
  };
}, [dispatch]);
```

### Pattern 3: Using Helper Hook
```typescript
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';

const MyComponent = () => {
  useResetOnUnmount(resetPaymentState);
  // Component automatically cleans up on unmount
};
```

---

## 💾 What Gets Persisted

### ✅ Persisted (Survives Reload)
- Cart items
- Order type
- Selected table
- Selected employee
- Order notes
- Applied discount
- Last sale data

### ❌ NOT Persisted (Resets on Reload)
- Dialog states (open/closed)
- Loading states
- Error messages
- Success messages
- Payment amount
- Day close form data
- Printer selection context
- Arrange mode
- Drag state
- Hover state

---

## 🔄 Cache Invalidation

### Automatic Invalidation
```typescript
// When order is completed
dispatch(completeOrder(...)) 
// → Invalidates: ['Orders', 'Tables']

// When order is voided
dispatch(voidOrder(...))
// → Invalidates: ['Orders', 'Tables']

// When items are added/removed
dispatch(addOrderItems(...))
dispatch(removeOrderItems(...))
// → Invalidates: ['Orders']
```

---

## 🐛 Debugging

### Check Console for Cleanup Logs
```
🧹 [TablesLayout] Cleaning up ephemeral UI state on unmount
🧹 [POSClient] Cleaning up ephemeral state on unmount
🧹 [useResetOnUnmount] Cleaning up state: pos/resetPaymentState
```

### Check Persisted State
```javascript
// In browser console
console.log(localStorage.getItem('persist:pos'));
console.log(localStorage.getItem('persist:tables'));
```

### Check Redux State
```javascript
// With Redux DevTools
window.__REDUX_DEVTOOLS_EXTENSION__.getState()
```

---

## 📝 Common Tasks

### Add New Ephemeral State Field

1. **Add to interface:**
```typescript
// In posSlice.ts
interface POSState {
  myNewField: string;
}
```

2. **Add to initialState:**
```typescript
const initialState: POSState = {
  myNewField: "",
};
```

3. **Add setter:**
```typescript
setMyNewField: (state, action: PayloadAction<string>) => {
  state.myNewField = action.payload;
}
```

4. **Add to blacklist:**
```typescript
// In store/index.ts
blacklist: [
  'myNewField',  // Add here
]
```

5. **Add reset action:**
```typescript
resetMyFeatureState: (state) => {
  state.myNewField = "";
}
```

6. **Export:**
```typescript
export const {
  setMyNewField,
  resetMyFeatureState
} = posSlice.actions;
```

### Add Cleanup to Component

```typescript
import { resetMyFeatureState } from '@/store/slices/posSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    return () => {
      dispatch(resetMyFeatureState());
    };
  }, [dispatch]);
};
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Use local state for shared data
```typescript
// BAD
const [paymentAmount, setPaymentAmount] = useState("");
```

### ✅ DO: Use Redux for shared data
```typescript
// GOOD
const { paymentAmount } = useAppSelector(state => state.pos);
dispatch(setPaymentAmount("100"));
```

### ❌ DON'T: Forget to add cleanup
```typescript
// BAD - State will leak
const MyDialog = ({ isOpen }) => {
  // No cleanup effect
};
```

### ✅ DO: Add cleanup effects
```typescript
// GOOD - State resets on close
const MyDialog = ({ isOpen }) => {
  useEffect(() => {
    if (!isOpen) {
      dispatch(resetDialogState());
    }
  }, [isOpen, dispatch]);
};
```

### ❌ DON'T: Persist ephemeral state
```typescript
// BAD - Don't add to whitelist
whitelist: ['paymentAmount']  // This is ephemeral!
```

### ✅ DO: Add to blacklist instead
```typescript
// GOOD
blacklist: ['paymentAmount']
```

---

## 📚 Documentation Files

1. **`POS_STATE_AUDIT.md`** - Complete analysis of all components
2. **`IMPLEMENTATION_SUMMARY.md`** - What was implemented
3. **`TESTING_GUIDE.md`** - How to test
4. **`FINAL_IMPLEMENTATION_REPORT.md`** - Complete report
5. **`QUICK_REFERENCE.md`** - This file

---

## 🚀 Quick Test

```bash
# 1. Clear storage
localStorage.clear();

# 2. Reload app

# 3. Add items to cart

# 4. Open payment dialog

# 5. Close payment dialog

# 6. Reopen payment dialog
# → Payment amount should be empty ✅

# 7. Reload page
# → Cart should still be there ✅
# → Payment dialog should be closed ✅
```

---

## 📞 Need Help?

1. Check console for cleanup logs
2. Use Redux DevTools to inspect state
3. Review `TESTING_GUIDE.md` for detailed tests
4. Check `FINAL_IMPLEMENTATION_REPORT.md` for complete details
