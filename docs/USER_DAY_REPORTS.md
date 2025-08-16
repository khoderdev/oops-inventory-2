# Individual User Day Reports

This document describes the implementation of individual user day reports in the OOPS Inventory system.

## Overview

The Individual User Day Reports feature allows the system to track and report on day operations on a per-user basis. This is useful for businesses where multiple users (staff members) open and close their own cash registers independently during a business day.

## Data Structure

### UserDayReport Interface

The `UserDayReport` interface extends the `DayOperationReport` interface to include user-specific data:

```typescript
export interface UserDayReport {
  userId: number | string;
  userName: string;
  openingTime?: string;
  closingTime?: string;
  openingCash: number;
  closingCash: number;
  expectedClosingCash: number;
  variance: number;
  variancePercentage: number;
  orderCount: number;
  totalAmount: number;
  notes?: string;
}
```

### DayOperationReport Extension

The `DayOperationReport` interface was extended to include an optional array of `UserDayReport` objects:

```typescript
export interface DayOperationReport {
  // Existing fields...
  userReports?: UserDayReport[];
  // Other fields...
}
```

## Backend Implementation

### Report Generation

In `dayOperationReportsController.js`, the `generateReport` function was modified to:

1. Check if `userOrderStats` exists in the day operation's report data
2. For each user, calculate:
   - Expected closing cash = opening cash + cash sales
   - Variance = actual closing cash - expected closing cash
   - Variance percentage = (variance / expected closing cash) * 100
3. Create a `userReports` array with all user-specific data
4. Include this array in the created `DayOperationReport` record

```javascript
// Generate user-specific reports
const userReports = [];

// If userOrderStats exists in reportData, use it to generate user reports
if (dayOperation.reportData?.userOrderStats && Array.isArray(dayOperation.reportData.userOrderStats)) {
  for (const userStat of dayOperation.reportData.userOrderStats) {
    // Calculate expected closing cash for this user based on their sales
    const openingCash = userStat.openingCash || 0;
    const totalCashSales = userStat.cashSales || 0;
    const expectedClosingCash = openingCash + totalCashSales;
    const actualClosingCash = userStat.closingCash || 0;
    const variance = actualClosingCash - expectedClosingCash;
    const variancePercentage = expectedClosingCash > 0 ? (variance / expectedClosingCash) * 100 : 0;
    
    userReports.push({
      userId: userStat.userId,
      userName: userStat.userName,
      openingTime: userStat.openingTime,
      closingTime: userStat.closingTime,
      openingCash: openingCash,
      closingCash: actualClosingCash,
      expectedClosingCash: expectedClosingCash,
      variance: variance,
      variancePercentage: variancePercentage,
      orderCount: userStat.orderCount || 0,
      totalAmount: userStat.totalAmount || 0,
      notes: userStat.notes
    });
  }
}

// Include userReports in the created report
const report = await DayOperationReport.create({
  // Other fields...
  userReports: userReports,
  // Other fields...
}, { transaction });
```

## Frontend Implementation

### DailyReports Component

The `DailyReports.tsx` component was updated to display a new section for individual user reports:

1. A new section titled "Individual User Reports" is added to the report display
2. The section is only shown if `selectedReport.userReports` exists and has items
3. A table displays each user's:
   - Staff name
   - Opening cash
   - Expected closing cash
   - Actual closing cash
   - Variance (color-coded based on positive/negative value)
   - Number of orders
   - Total sales amount
4. A footer row shows totals across all users

## Edge Cases and Error Handling

The implementation includes handling for various edge cases:

1. Missing user data: If `userOrderStats` doesn't exist or isn't an array, no user reports are generated
2. Missing values: Default values (0) are used for missing numeric fields
3. Division by zero: Variance percentage is set to 0 if expected closing cash is 0
4. Optional fields: Fields like `openingTime`, `closingTime`, and `notes` are optional

## Testing

To test this feature:

1. Have multiple users open and close their days individually
2. Generate a day operation report
3. Verify that the report includes the "Individual User Reports" section
4. Check that expected closing cash, variance, and other calculations are correct
5. Test with edge cases like missing data or zero values

## Future Enhancements

Possible future enhancements to this feature:

1. Filtering and sorting options for user reports
2. User-specific performance metrics and trends
3. Exporting user reports to CSV or PDF
4. Visual charts for user performance comparison
