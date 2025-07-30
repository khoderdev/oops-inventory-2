# Database Restore Instructions

## Backup Information
- **File**: complete_backup_2025-07-30T00-17-14.sql
- **Created**: 2025-07-30T00:17:15.522Z
- **Database**: inventory_db
- **Size**: 0.41 MB
- **Tables**: 17
- **Rows**: 504

## How to Restore

### Option 1: Complete Restore (Recommended)
```bash
# Drop and recreate database
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS inventory_db;"
psql -h localhost -U postgres -c "CREATE DATABASE inventory_db;"

# Restore from backup
psql -h localhost -U postgres -d inventory_db -f "complete_backup_2025-07-30T00-17-14.sql"
```

### Option 2: Restore to existing database (will overwrite data)
```bash
psql -h localhost -U postgres -d inventory_db -f "complete_backup_2025-07-30T00-17-14.sql"
```

## Verification
After restore, verify the data:
```sql
-- Check table count
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check row counts
SELECT 'DayOperations' as table_name, count(*) as rows FROM "DayOperations";
SELECT 'OrderItems' as table_name, count(*) as rows FROM "OrderItems";
SELECT 'Orders' as table_name, count(*) as rows FROM "Orders";
SELECT 'SaleMenuItems' as table_name, count(*) as rows FROM "SaleMenuItems";
SELECT 'Sales' as table_name, count(*) as rows FROM "Sales";
SELECT 'SystemLogs' as table_name, count(*) as rows FROM "SystemLogs";
SELECT 'Tables' as table_name, count(*) as rows FROM "Tables";
SELECT 'assignments' as table_name, count(*) as rows FROM "assignments";
SELECT 'audit_logs' as table_name, count(*) as rows FROM "audit_logs";
SELECT 'materials' as table_name, count(*) as rows FROM "materials";
SELECT 'menuItemIngredients' as table_name, count(*) as rows FROM "menuItemIngredients";
SELECT 'menuItems' as table_name, count(*) as rows FROM "menuItems";
SELECT 'sections' as table_name, count(*) as rows FROM "sections";
SELECT 'sessions' as table_name, count(*) as rows FROM "sessions";
SELECT 'stockEntries' as table_name, count(*) as rows FROM "stockEntries";
SELECT 'users' as table_name, count(*) as rows FROM "users";
SELECT 'wastings' as table_name, count(*) as rows FROM "wastings";
```

## Troubleshooting
- Make sure PostgreSQL is running
- Ensure you have CREATE DATABASE privileges
- Check that the backup file is not corrupted
- Verify sufficient disk space for restore
