# Stock Entry Logging System

A comprehensive, production-ready logging system for tracking all stock entry operations with detailed audit trails, user tracking, and powerful querying capabilities.

## Overview

The Stock Entry Logging System provides:
- **Detailed Audit Trails**: Track every action performed on stock entries
- **User Attribution**: Record who performed each action
- **Comprehensive Metadata**: Capture quantity changes, cost impacts, and business context
- **Powerful Querying**: Filter, search, and analyze logs with flexible APIs
- **Export Capabilities**: Export logs to CSV or JSON formats
- **Real-time Analytics**: Get insights into stock operations and user activity

## Architecture

### Core Components

1. **StockEntryLogSimple Model** (`models/StockEntryLogSimple.js`)
   - Database table: `stock_entry_logs_simple`
   - Stores all stock entry operation logs
   - Optimized for performance and querying

2. **StockEntryLoggerSimple Service** (`services/StockEntryLoggerSimple.js`)
   - Core logging service with validation and enrichment
   - Handles all types of stock operations
   - Provides helper methods for common queries

3. **StockEntryAuditHelperSimple** (`decorators/stockEntryAuditDecoratorSimple.js`)
   - Helper functions for easy integration
   - Simplified logging methods for controllers
   - Error handling and validation

4. **Logs API Routes** (`routes/logs.js`)
   - RESTful API for querying and retrieving logs
   - Advanced filtering, pagination, and search
   - Export and analytics endpoints

## Database Schema

### stock_entry_logs_simple Table

```sql
CREATE TABLE stock_entry_logs_simple (
  id SERIAL PRIMARY KEY,
  userId INTEGER,                    -- User who performed the action
  userName VARCHAR(100),              -- Cached user name
  actionType VARCHAR(50) NOT NULL,    -- Type of action (create, edit, etc.)
  actionDescription TEXT,             -- Human-readable description
  actionTimestamp TIMESTAMP NOT NULL, -- When the action occurred
  stockEntryId INTEGER NOT NULL,      -- ID of affected stock entry
  materialId INTEGER NOT NULL,        -- ID of the material
  materialName VARCHAR(200) NOT NULL, -- Cached material name
  quantityDelta DECIMAL(10,3),        -- Change in quantity
  costDelta DECIMAL(10,2),            -- Change in cost
  status VARCHAR(20) DEFAULT 'success', -- success/failure/warning
  errorMessage TEXT                   -- Error details if failed
);
```

## Action Types

The system tracks the following action types:

- `create` - New stock entry creation
- `edit` - Stock entry modifications
- `add_to_stock` - Adding inventory to existing stock
- `waste_from_stock` - Recording waste/loss
- `delete_stock` - Stock entry deletion
- `pos_toggle` - POS visibility changes
- `adjust_quantity` - Manual quantity adjustments
- `transfer_stock` - Stock transfers between entries
- `cost_update` - Cost modifications
- `system_correction` - System-initiated corrections

## Integration Guide

### 1. Basic Logging in Controllers

```javascript
import { logStockCreation, logStockEdit, logStockDeletion } from '../decorators/stockEntryAuditDecoratorSimple.js';

class StockController {
  async createStock(req, res) {
    try {
      const stockEntry = await StockEntry.create(req.body);
      await stockEntry.reload({ include: [{ model: Material, as: 'material' }] });
      
      // Simple logging call
      await logStockCreation(stockEntry, req.user, req);
      
      res.json({ success: true, data: stockEntry });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### 2. Advanced Logging with Custom Metadata

```javascript
import { StockEntryAuditHelperSimple } from '../decorators/stockEntryAuditDecoratorSimple.js';

// Log with custom metadata
await StockEntryAuditHelperSimple.logStockCreation(stockEntry, user, req, {
  source: 'bulk_import',
  category: 'inventory_replenishment',
  batchId: 'BATCH_2025_001',
  importFile: 'inventory_update.csv'
});
```

### 3. Service Layer Integration

```javascript
import StockEntryLoggerSimple from '../services/StockEntryLoggerSimple.js';

class StockService {
  async transferStock(fromId, toId, quantity, user, reason) {
    // ... business logic ...
    
    // Log the transfer
    await StockEntryLoggerSimple.logAction({
      actionType: 'transfer_stock',
      actionDescription: `Transferred ${quantity} units`,
      stockEntryId: fromId,
      materialId: fromStock.materialId,
      materialName: fromStock.material.name,
      userId: user.id,
      userName: user.fullName,
      quantityDelta: -quantity,
      metadata: { transferTo: toId, reason }
    });
  }
}
```

## API Documentation

### Base URL: `/api/logs`

### 1. Get All Stock Entry Logs

```http
GET /api/logs/stock-entries
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Records per page (default: 50)
- `stockEntryId` (number): Filter by stock entry ID
- `materialId` (number): Filter by material ID
- `userId` (number): Filter by user ID
- `actionType` (string|array): Filter by action type(s)
- `status` (string): Filter by status (success/failure)
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date
- `materialName` (string): Search material names (partial match)
- `userName` (string): Search user names (partial match)
- `sortBy` (string): Sort field (default: actionTimestamp)
- `sortOrder` (string): ASC or DESC (default: DESC)

**Example:**
```http
GET /api/logs/stock-entries?page=1&limit=20&actionType=create&startDate=2025-01-01
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 100,
      "recordsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {...},
    "sorting": {...}
  },
  "message": "Retrieved 20 log entries"
}
```

### 2. Get Stock Entry History

```http
GET /api/logs/stock-entries/:stockEntryId
```

**Query Parameters:**
- `limit` (number): Max records (default: 100)
- `actionTypes` (array): Filter by action types
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date

**Example:**
```http
GET /api/logs/stock-entries/123?limit=50&actionTypes=create,edit
```

### 3. Get Material Activity

```http
GET /api/logs/materials/:materialId
```

Returns all activity across all stock entries for a specific material.

### 4. Get User Activity

```http
GET /api/logs/users/:userId
```

Returns all stock entry actions performed by a specific user.

### 5. Get Logging Summary

```http
GET /api/logs/summary
```

**Query Parameters:**
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date
- `groupBy` (string): Group results by field

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalLogs": 1500,
      "successfulLogs": 1450,
      "failedLogs": 50,
      "successRate": "96.67%"
    },
    "actionBreakdown": [...],
    "recentActivity": [...],
    "topUsers": [...],
    "topMaterials": [...]
  }
}
```

### 6. Export Logs

```http
GET /api/logs/export?format=csv&startDate=2025-01-01
```

**Query Parameters:**
- `format` (string): 'json' or 'csv' (default: json)
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date
- `actionType` (string|array): Filter by action type(s)
- `status` (string): Filter by status
- `limit` (number): Max records (default: 1000)

### 7. Advanced Search

```http
GET /api/logs/search?q=waste&searchFields=actionDescription,materialName
```

**Query Parameters:**
- `q` (string): Search query (required)
- `searchFields` (array): Fields to search in
- `page` (number): Page number
- `limit` (number): Records per page
- Additional filter parameters

## Usage Examples

### 1. Track Stock Creation

```javascript
// In your stock controller
async createStockEntry(req, res) {
  try {
    const stockEntry = await StockEntry.create(req.body);
    await stockEntry.reload({ include: [{ model: Material, as: 'material' }] });
    
    // Log the creation
    await logStockCreation(stockEntry, req.user, req);
    
    res.status(201).json({ success: true, data: stockEntry });
  } catch (error) {
    // The logging system will automatically log failures
    res.status(500).json({ error: error.message });
  }
}
```

### 2. Track Stock Waste

```javascript
async recordWaste(req, res) {
  const { id } = req.params;
  const { quantity, unit, reason } = req.body;
  
  const originalStock = await StockEntry.findByPk(id, {
    include: [{ model: Material, as: 'material' }]
  });
  
  const originalData = originalStock.toJSON();
  
  // Update stock
  const newQuantity = originalStock.purchasedQuantity - quantity;
  await originalStock.update({ purchasedQuantity: newQuantity });
  await originalStock.reload();
  
  // Log the waste
  await logWasteFromStock(
    originalData, 
    originalStock.toJSON(), 
    quantity, 
    unit, 
    reason, 
    req.user, 
    req
  );
  
  res.json({ success: true, data: originalStock });
}
```

### 3. Generate Reports

```javascript
// Get material activity report
const materialReport = await fetch('/api/logs/materials/123?startDate=2025-01-01');
const data = await materialReport.json();

console.log(`Material ${data.data.materialId} had ${data.data.analytics.totalActivities} activities`);
console.log('Action breakdown:', data.data.analytics.actionBreakdown);
```

### 4. Monitor User Activity

```javascript
// Get user activity for the last 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const userActivity = await fetch(`/api/logs/users/456?startDate=${thirtyDaysAgo}`);
const data = await userActivity.json();

console.log(`User performed ${data.data.analytics.totalActivities} actions`);
console.log(`Success rate: ${data.data.analytics.successRate}%`);
```

## Performance Considerations

### Indexing
The system includes optimized database indexes for:
- `stockEntryId` - Fast stock entry history lookup
- `materialId` - Material activity queries
- `userId` - User activity tracking
- `actionTimestamp` - Time-based filtering
- `actionType` - Action type filtering

### Pagination
All list endpoints support pagination to handle large datasets efficiently.

### Caching
Consider implementing Redis caching for frequently accessed summary data.

## Error Handling

The logging system includes comprehensive error handling:

1. **Validation Errors**: Invalid data is caught and logged
2. **Database Errors**: Connection issues are handled gracefully
3. **Business Logic Errors**: Failed operations are automatically logged
4. **API Errors**: All endpoints return consistent error responses

## Security Considerations

1. **User Authentication**: All logging includes user context
2. **Data Sanitization**: Input data is validated and sanitized
3. **Access Control**: Implement proper permissions for log access
4. **Audit Trail Integrity**: Logs are immutable once created

## Monitoring and Alerts

Consider implementing:
- **High Error Rates**: Alert when failure rate exceeds threshold
- **Unusual Activity**: Monitor for suspicious patterns
- **Performance Metrics**: Track logging system performance
- **Storage Growth**: Monitor log table size and implement archiving

## Maintenance

### Log Retention
Implement a retention policy based on your needs:
```sql
-- Delete logs older than 2 years
DELETE FROM stock_entry_logs_simple 
WHERE actionTimestamp < NOW() - INTERVAL '2 years';
```

### Archiving
For long-term storage, consider archiving old logs to separate tables or external storage.

### Performance Monitoring
Regularly monitor query performance and add indexes as needed based on usage patterns.

## Troubleshooting

### Common Issues

1. **Missing Logs**: Check if logging calls are properly placed in controllers
2. **Performance Issues**: Review query patterns and add appropriate indexes
3. **Large Result Sets**: Use pagination and filtering to limit response sizes
4. **Memory Usage**: Monitor for memory leaks in long-running processes

### Debug Mode
Enable detailed logging by setting environment variables:
```bash
DEBUG_STOCK_LOGGING=true
LOG_LEVEL=debug
```

## Migration from Legacy System

If you have existing audit logs, create a migration script:

```javascript
// Example migration from old audit_logs table
async function migrateLegacyLogs() {
  const legacyLogs = await AuditLog.findAll({
    where: { resource: 'stock_entries' }
  });
  
  for (const log of legacyLogs) {
    await StockEntryLogSimple.create({
      actionType: log.action,
      actionDescription: log.description,
      stockEntryId: log.resourceId,
      userId: log.userId,
      actionTimestamp: log.createdAt,
      // ... map other fields
    });
  }
}
```

## Contributing

When adding new features:
1. Update the action types enum if adding new actions
2. Add corresponding API endpoints for new query patterns
3. Update this documentation
4. Add tests for new functionality
5. Consider backward compatibility

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Examine the example implementations
4. Check the database logs for errors
