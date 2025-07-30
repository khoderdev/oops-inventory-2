# Database Backup Script

This directory contains the comprehensive database backup script for your inventory management system.

## 🎯 What the Backup Script Does

The `dbBackup.js` script creates a **complete backup** of your PostgreSQL database including:

### ✅ Database Structure
- **All table schemas** with proper data types and constraints
- **All indexes** (primary keys, foreign keys, unique constraints, custom indexes)
- **All ENUM types** (like order status, user roles, etc.)
- **All sequences** with their current values
- **All triggers and functions**

### ✅ Database Relations
- **Foreign key relationships** between all tables
- **Junction tables** (like MenuItemIngredient for many-to-many relationships)
- **Self-referencing relationships** (like User createdBy/updatedBy)
- **Cascade rules** (ON DELETE CASCADE, ON UPDATE CASCADE, etc.)

### ✅ Complete Data
- **All table data** with proper escaping for special characters
- **JSONB data** (like user permissions) properly formatted
- **Binary data** (if any) properly encoded
- **NULL values** handled correctly

### ✅ Additional Features
- **Multiple backup formats**: Complete, Schema-only, Data-only
- **Metadata file** with table statistics and relationship mapping
- **Restore instructions** with step-by-step guide
- **Comprehensive logging** with colored output
- **Error handling** with detailed error messages

## 🚀 How to Use

### Option 1: Using npm scripts (Recommended)
```bash
# Create backup with auto-generated filename
npm run backup

# Create backup with custom filename
npm run backup:custom my-backup.sql
```

### Option 2: Direct node execution
```bash
# Auto-generated filename with timestamp
node scripts/dbBackup.js

# Custom filename
node scripts/dbBackup.js my-custom-backup.sql

# Full path
node scripts/dbBackup.js /path/to/my-backup.sql
```

## 📁 Output Files

The script creates several files:

1. **`backup.sql`** - Complete backup (schema + data)
2. **`backup.sql.schema`** - Schema-only backup
3. **`backup.sql.data`** - Data-only backup
4. **`backup.sql.metadata.json`** - Database metadata and statistics
5. **`backup.sql.RESTORE_INSTRUCTIONS.md`** - Detailed restore guide

## 🗂️ Database Tables Included

Based on your models, the backup includes all these tables:

### Core Tables
- **users** - User accounts with roles and permissions
- **materials** - Raw materials and ingredients
- **stock_entries** - Inventory stock entries
- **sections** - Restaurant sections/areas

### Menu & Sales
- **menu_items** - Menu items
- **menu_item_ingredients** - Menu item recipes (junction table)
- **sales** - Sales transactions
- **sale_menu_items** - Items sold in each sale

### Orders & POS
- **orders** - Customer orders
- **order_items** - Items in each order
- **tables** - Restaurant tables
- **assignments** - Material assignments

### Audit & Logging
- **audit_logs** - General audit trail
- **stock_entry_logs_simple** - Stock entry specific logs
- **sessions** - User sessions
- **day_operations** - Daily operations tracking

### Waste Management
- **wastings** - Waste tracking records

## 🔄 Database Relationships Backed Up

The script preserves all these relationships:

```
Material → StockEntry (1:many)
Material → Assignment (1:many)
Material ↔ MenuItem (many:many through MenuItemIngredient)
Section → Assignment (1:many)
StockEntry → Assignment (1:many)
MenuItem → Assignment (1:many)
Sale → SaleMenuItem (1:many)
User → Session (1:many)
User → AuditLog (1:many)
Order → OrderItem (1:many)
Table → Order (1:many)
Order → Sale (1:1)
StockEntry → Wasting (1:many)
User → User (self-referencing)
```

## 🛠️ Prerequisites

Make sure you have:

1. **PostgreSQL installed** and running
2. **pg_dump utility** available in your PATH
3. **Database connection** working (the script tests this first)
4. **Sufficient disk space** for the backup files

## 📊 Backup Information

The script provides detailed information during backup:
- Database size
- Number of tables
- Backup progress
- File sizes created
- Completion status

## 🔧 Troubleshooting

### Common Issues:

1. **"pg_dump: command not found"**
   - Install PostgreSQL client tools
   - Add PostgreSQL bin directory to your PATH

2. **"Connection refused"**
   - Make sure PostgreSQL is running
   - Check database configuration in `config/database.js`

3. **"Permission denied"**
   - Make sure postgres user has necessary privileges
   - Check if database exists

4. **"Out of disk space"**
   - Free up disk space
   - Choose a different backup location

## 🔐 Security Notes

- The script uses environment variables for database password
- Backup files contain sensitive data - store securely
- Consider encrypting backup files for production use
- Regularly test restore procedures

## 📈 Performance

- Backup time depends on database size
- Typical backup for small-medium database: 1-5 minutes
- Large databases (>1GB): 10-30 minutes
- The script shows progress and timing information

## 🎯 Use Cases

### Development
- Before major migrations
- Before testing destructive operations
- Daily development backups

### Production
- Scheduled daily/weekly backups
- Before system updates
- Disaster recovery preparation

### Migration
- Moving to new server
- Database version upgrades
- Environment cloning

## 📝 Restore Instructions

The script automatically creates detailed restore instructions. Common restore commands:

```bash
# Complete restore (drops and recreates database)
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS inventory_db;"
psql -h localhost -U postgres -c "CREATE DATABASE inventory_db;"
psql -h localhost -U postgres -d inventory_db -f backup.sql

# Schema only
psql -h localhost -U postgres -d inventory_db -f backup.sql.schema

# Data only (requires existing schema)
psql -h localhost -U postgres -d inventory_db -f backup.sql.data
```

---

**Created by**: Database Backup Script Generator  
**Compatible with**: PostgreSQL 12+, Node.js 16+, Sequelize 6+  
**Last updated**: 2025-07-30
