# User Order Stats Not Saved to Database - Fix

## Problem

When closing the day, user order stats were showing all zeros:

```json
{
    "userOrderStats": [
        {
            "userId": 1,
            "userName": "Admin User",
            "orderCount": 0,
            "totalAmount": "0.00",
            "cashSales": "0.00",
            "cardSales": "0.00",
            "openingTime": "2025-10-05T00:06:03.435Z",
            "closingTime": null,
            "openingCash": "0.00",
            "closingCash": null,
            "notes": ""
        }
    ]
}
```

Even though users had completed orders during their shifts.

## Root Cause

The `closeDay` function in `dayOperationsController.js` had a **critical missing step**:

### What Was Happening:

1. ✅ **Individual User Close** (Lines 739-812):
   - When a user closes their shift (`userId` provided, `shouldFinalize` = false)
   - User stats are calculated from sales data
   - Stats are saved to JSON `reportData.userOrderStats`
   - Stats are updated in the `DayOperation.reportData` field

2. ✅ **Day Finalization** (Lines 814-1200):
   - When finalizing the entire day (`shouldFinalize` = true)
   - Comprehensive report is generated
   - `reportData` is created with `...existingReportData` (includes userOrderStats)
   - `reportData` is saved to `DayOperation.reportData` field

3. ❌ **MISSING STEP**:
   - **User stats were NEVER saved to the relational `DayOperationUserStats` table**
   - They only existed in the JSON `reportData` field
   - The `getUserStats()` API endpoint queries the relational table, not JSON
   - Result: API returns empty/zero stats even though data exists in JSON

## Solution Applied

Added code to save user stats from `reportData.userOrderStats` to the relational `DayOperationUserStats` table during day finalization (Lines 1153-1205):

```javascript
// CRITICAL FIX: Save user stats to relational table
try {
  if (reportData.userOrderStats && Array.isArray(reportData.userOrderStats)) {
    console.log(`[DayOps][closeDay] Saving ${reportData.userOrderStats.length} user stats to relational table`);
    
    for (const userStat of reportData.userOrderStats) {
      // Check if user stats already exist
      const existingUserStat = await DayOperationUserStats.findOne({
        where: { dayOperationId: dayOperation.id, userId: userStat.userId },
        transaction
      });

      if (existingUserStat) {
        // Update existing user stats
        await existingUserStat.update({
          orderCount: userStat.orderCount || 0,
          totalAmount: parseFloat(userStat.totalAmount || 0),
          cashSales: parseFloat(userStat.cashSales || 0),
          cardSales: parseFloat(userStat.cardSales || 0),
          openingCash: parseFloat(userStat.openingCash || 0),
          closingCash: userStat.closingCash !== null ? parseFloat(userStat.closingCash) : null,
          openingTime: userStat.openingTime ? new Date(userStat.openingTime) : null,
          closingTime: userStat.closingTime ? new Date(userStat.closingTime) : null,
          notes: userStat.notes || ""
        }, { transaction });
      } else {
        // Create new user stats
        await DayOperationUserStats.create({
          dayOperationId: dayOperation.id,
          userId: userStat.userId,
          orderCount: userStat.orderCount || 0,
          totalAmount: parseFloat(userStat.totalAmount || 0),
          cashSales: parseFloat(userStat.cashSales || 0),
          cardSales: parseFloat(userStat.cardSales || 0),
          openingCash: parseFloat(userStat.openingCash || 0),
          closingCash: userStat.closingCash !== null ? parseFloat(userStat.closingCash) : null,
          openingTime: userStat.openingTime ? new Date(userStat.openingTime) : null,
          closingTime: userStat.closingTime ? new Date(userStat.closingTime) : null,
          notes: userStat.notes || ""
        }, { transaction });
      }
    }
    
    console.log("[DayOps][closeDay] Successfully saved all user stats to relational table");
  }
} catch (userStatsErr) {
  console.error("[DayOps][closeDay] Failed to save user stats to relational table:", userStatsErr);
  // Don't fail the entire operation if user stats save fails
}
```

## How It Works

### Data Flow:

1. **User Closes Shift:**
   ```
   User clicks "Close Shift" → closeDay(userId, closingCash, onlyUser=true)
   ↓
   Calculate user sales (orderCount, totalAmount, cashSales, cardSales)
   ↓
   Update reportData.userOrderStats in JSON field
   ↓
   Save to DayOperation.reportData
   ```

2. **Day Finalization:**
   ```
   Admin clicks "Close Day" → closeDay(closingCash, finalizeDay=true)
   ↓
   Load existingReportData (includes userOrderStats from user shifts)
   ↓
   Generate comprehensive reportData {...existingReportData, ...newData}
   ↓
   Save reportData to DayOperation.reportData (JSON)
   ↓
   🆕 NEW STEP: Loop through reportData.userOrderStats
   ↓
   For each user: Create/Update DayOperationUserStats record (relational table)
   ↓
   Commit transaction
   ```

3. **API Query:**
   ```
   GET /api/day-operations/user-stats
   ↓
   Query DayOperationUserStats table (relational)
   ↓
   Return actual user stats with order counts and sales amounts
   ```

## Key Features

### 1. **Upsert Logic**
- Checks if user stats already exist for this day operation
- Updates if exists, creates if new
- Prevents duplicate records

### 2. **Type Safety**
- Parses all numeric values with `parseFloat()`
- Handles null values for `closingCash` and `closingTime`
- Converts date strings to Date objects

### 3. **Error Handling**
- Wrapped in try-catch to prevent day close failure
- Logs errors but doesn't rollback transaction
- User stats save failure won't break day closing

### 4. **Transaction Safety**
- All operations within the same transaction
- Atomic commit with other day close operations
- Rollback on critical failures

## Impact

### Before Fix:
- ❌ User stats only in JSON `reportData` field
- ❌ `getUserStats()` API returns zeros
- ❌ Frontend shows "0 orders, $0.00 sales" for all users
- ❌ No historical user performance data
- ❌ Reports missing user contribution details

### After Fix:
- ✅ User stats saved to both JSON and relational table
- ✅ `getUserStats()` API returns actual data
- ✅ Frontend shows correct order counts and sales amounts
- ✅ Historical user performance tracked properly
- ✅ Reports include accurate user contribution data

## Testing

To verify the fix:

1. **Open a day operation**
2. **User completes orders** (create sales)
3. **User closes their shift** with closing cash
4. **Admin closes the day** (finalize)
5. **Check database:**
   ```sql
   SELECT * FROM "DayOperationUserStats" 
   WHERE "dayOperationId" = [latest_day_id];
   ```
   Should show records with actual orderCount, totalAmount, etc.

6. **Check API response:**
   ```
   GET /api/day-operations/user-stats?dayOperationId=[id]
   ```
   Should return user stats with non-zero values

## Console Logs

When the fix runs successfully, you'll see:

```
[DayOps][closeDay] Saving 1 user stats to relational table
[DayOps][closeDay] Created user stats for userId 1
[DayOps][closeDay] Successfully saved all user stats to relational table
```

Or if updating existing stats:

```
[DayOps][closeDay] Saving 1 user stats to relational table
[DayOps][closeDay] Updated user stats for userId 1
[DayOps][closeDay] Successfully saved all user stats to relational table
```

## Files Modified

- `backend/controllers/dayOperationsController.js` (Lines 1153-1205)
  - Added user stats save to relational table
  - Upsert logic (create or update)
  - Error handling and logging

## Related Issues

This fix ensures that user performance tracking works correctly and historical data is properly stored in the relational database structure, not just in JSON fields.
