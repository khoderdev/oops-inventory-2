# Day Operations Relational Tables

## Overview

This document explains the migration from JSON-based storage to relational tables for the Day Operations functionality. This change improves efficiency, flexibility, and query performance by moving data from JSON fields to dedicated tables.

## New Tables

The following new tables have been created:

1. **DayOperationStockSnapshot**
   - Stores opening and closing stock snapshots
   - Replaces `openingStockSnapshot` and `closingStockSnapshot` JSON fields
   - Provides better querying and filtering capabilities

2. **DayOperationStockVariance**
   - Stores stock variances between opening and closing snapshots
   - Replaces `stockVariances` JSON field
   - Enables better reporting and analysis of stock changes

3. **DayOperationActivity**
   - Stores activity logs for day operations
   - Replaces `activityLogs` JSON field
   - Allows for more detailed activity tracking and filtering

4. **DayOperationUserStats**
   - Stores user-specific statistics for day operations
   - Replaces user stats in `reportData.userOrderStats` JSON field
   - Enables better user performance tracking and reporting

## Benefits

1. **Improved Performance**
   - Reduced transaction size by eliminating large JSON objects
   - Batch processing for large datasets
   - Better error handling and recovery
   - Reduced memory usage

2. **Better Data Integrity**
   - Proper foreign key constraints
   - Type validation at the database level
   - Indexing for faster queries
   - Normalized data structure

3. **Enhanced Flexibility**
   - Easier to add new fields or modify existing ones
   - Better support for complex queries
   - More efficient data updates
   - Improved reporting capabilities

## Implementation Details

### Database Structure

Each table has appropriate indexes and foreign key relationships to ensure data integrity and query performance. The tables are designed to work together to provide a complete view of day operations.

### Backward Compatibility

The original JSON fields are maintained for backward compatibility but are now set to empty arrays/objects instead of null. This ensures that existing code that expects these fields will continue to work while new code can use the relational tables.

### Error Handling

Comprehensive error handling has been added to ensure that the system can recover from failures and continue operating. This includes:

- Transaction management with proper rollbacks
- Batch processing with error recovery
- Detailed logging for troubleshooting
- Graceful degradation when components fail

## Usage

### Retrieving Data

Use the helper functions in `dayOperationsControllerHelpers.js` to retrieve data from the relational tables:

```javascript
// Get stock snapshots
const openingSnapshots = await getStockSnapshots(dayOperationId, 'opening');
const closingSnapshots = await getStockSnapshots(dayOperationId, 'closing');

// Get stock variances
const variances = await getStockVariances(dayOperationId);

// Get activity logs
const activities = await getActivityLogs(dayOperationId);

// Get user stats
const userStats = await getUserStats(dayOperationId);
```

### Creating Data

Use the helper functions to create data in the relational tables:

```javascript
// Create stock snapshots
await createStockSnapshots(dayOperationId, stockEntries, 'opening', now, transaction);

// Create stock variances
await createStockVariances(dayOperationId, openingSnapshots, closingSnapshots, transaction);

// Create activity log
await createActivityLog(dayOperationId, activityType, description, userId, userName, metadata, transaction);

// Get or create user stats
const userStats = await getOrCreateUserStats(dayOperationId, userId, transaction);
```

## Migration

A migration script is provided to move data from the JSON fields to the relational tables. Run the script using:

```bash
node migrations/runDayOperationsMigration.js
```

This will:
1. Create the new tables if they don't exist
2. Migrate data from the JSON fields to the relational tables
3. Log the progress and any errors

## Conclusion

This migration to relational tables significantly improves the performance, reliability, and flexibility of the Day Operations functionality. The system is now more robust and can handle larger datasets with better error recovery.
