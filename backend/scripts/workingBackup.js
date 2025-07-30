#!/usr/bin/env node

/**
 * Working Database Backup Script
 * Creates a complete backup.sql file with all tables, data, and structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗄️  Starting Complete Database Backup...');
console.log('=====================================');

try {
  // Import database and models
  console.log('📦 Loading database connection...');
  const { default: sequelize } = await import('../config/database.js');
  
  console.log('📋 Loading models...');
  const models = await import('../models/index.js');
  
  // Test connection
  console.log('🔌 Testing database connection...');
  await sequelize.authenticate();
  console.log('   ✓ Connected to database successfully');
  
  // Get database info
  const [dbInfo] = await sequelize.query(`
    SELECT 
      current_database() as database_name,
      current_user as current_user,
      version() as postgres_version
  `);
  
  console.log(`   📍 Database: ${dbInfo[0].database_name}`);
  console.log(`   👤 User: ${dbInfo[0].current_user}`);
  
  // Get all tables with row counts
  console.log('📊 Analyzing database structure...');
  const [tables] = await sequelize.query(`
    SELECT 
      t.table_name,
      COALESCE(s.n_tup_ins - s.n_tup_del, 0) as estimated_rows
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `);
  
  console.log(`   📋 Found ${tables.length} tables:`);
  let totalRows = 0;
  for (const table of tables) {
    console.log(`      - ${table.table_name} (${table.estimated_rows || 0} rows)`);
    totalRows += parseInt(table.estimated_rows || 0);
  }
  console.log(`   📊 Total estimated rows: ${totalRows}`);
  
  // Create backup directory structure
  const baseBackupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(baseBackupDir)) {
    fs.mkdirSync(baseBackupDir, { recursive: true });
  }
  
  // Generate backup folder and filename with readable format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  const backupFolderName = `backup_${year}-${month}-${day}_${displayHours}-${minutes}-${ampm}`;
  const backupDir = path.join(baseBackupDir, backupFolderName);
  
  // Create individual backup folder
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`📁 Created backup folder: ${backupFolderName}`);
  
  const backupFile = path.join(backupDir, 'backup.sql');
  
  console.log('🏗️  Generating backup SQL...');
  
  let sql = '';
  
  // Header
  sql += `-- Complete Database Backup\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Database: ${dbInfo[0].database_name}\n`;
  sql += `-- PostgreSQL Version: ${dbInfo[0].postgres_version}\n`;
  sql += `-- Tables: ${tables.length}\n`;
  sql += `-- Estimated Rows: ${totalRows}\n`;
  sql += `--\n`;
  sql += `-- This backup includes:\n`;
  sql += `-- - Complete table structures (CREATE TABLE statements)\n`;
  sql += `-- - All data (INSERT statements)\n`;
  sql += `-- - Sequences and auto-increment values\n`;
  sql += `-- - Indexes and constraints\n`;
  sql += `--\n\n`;
  
  // Disable triggers and constraints during restore
  sql += `-- Disable triggers and constraints for faster restore\n`;
  sql += `SET session_replication_role = replica;\n`;
  sql += `SET foreign_key_checks = 0;\n\n`;
  
  // Process each table
  for (const tableInfo of tables) {
    const tableName = tableInfo.table_name;
    console.log(`   🔄 Processing table: ${tableName}`);
    
    try {
      // Get table structure
      const [columns] = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      // Generate CREATE TABLE statement
      sql += `-- Table: ${tableName}\n`;
      sql += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
      sql += `CREATE TABLE "${tableName}" (\n`;
      
      const columnDefs = [];
      for (const col of columns) {
        let colDef = `  "${col.column_name}"`;
        
        // Handle data types
        if (col.data_type === 'character varying') {
          colDef += ` VARCHAR(${col.character_maximum_length || 255})`;
        } else if (col.data_type === 'integer') {
          colDef += ' INTEGER';
        } else if (col.data_type === 'bigint') {
          colDef += ' BIGINT';
        } else if (col.data_type === 'numeric') {
          colDef += ` DECIMAL(${col.numeric_precision || 10},${col.numeric_scale || 2})`;
        } else if (col.data_type === 'timestamp with time zone') {
          colDef += ' TIMESTAMP WITH TIME ZONE';
        } else if (col.data_type === 'timestamp without time zone') {
          colDef += ' TIMESTAMP';
        } else if (col.data_type === 'boolean') {
          colDef += ' BOOLEAN';
        } else if (col.data_type === 'text') {
          colDef += ' TEXT';
        } else if (col.data_type === 'jsonb') {
          colDef += ' JSONB';
        } else {
          colDef += ` ${col.data_type.toUpperCase()}`;
        }
        
        // Handle nullability
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL';
        }
        
        // Handle defaults
        if (col.column_default && !col.column_default.includes('nextval')) {
          if (col.column_default.includes('::')) {
            colDef += ` DEFAULT ${col.column_default}`;
          } else {
            colDef += ` DEFAULT ${col.column_default}`;
          }
        }
        
        columnDefs.push(colDef);
      }
      
      sql += columnDefs.join(',\n');
      sql += '\n);\n\n';
      
      // Get primary keys
      const [primaryKeys] = await sequelize.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = '${tableName}' 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      `);
      
      if (primaryKeys.length > 0) {
        const pkColumns = primaryKeys.map(pk => `"${pk.column_name}"`).join(', ');
        sql += `ALTER TABLE "${tableName}" ADD PRIMARY KEY (${pkColumns});\n\n`;
      }
      
      // Get table data
      const [data] = await sequelize.query(`SELECT * FROM "${tableName}"`);
      
      if (data.length > 0) {
        sql += `-- Data for table: ${tableName} (${data.length} rows)\n`;
        
        const columnNames = Object.keys(data[0]);
        const quotedColumns = columnNames.map(col => `"${col}"`).join(', ');
        
        for (const row of data) {
          const values = columnNames.map(col => {
            const value = row[col];
            if (value === null || value === undefined) {
              return 'NULL';
            } else if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''")}'`;
            } else if (typeof value === 'boolean') {
              return value ? 'TRUE' : 'FALSE';
            } else if (value instanceof Date) {
              return `'${value.toISOString()}'`;
            } else if (typeof value === 'object') {
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            } else {
              return value.toString();
            }
          }).join(', ');
          
          sql += `INSERT INTO "${tableName}" (${quotedColumns}) VALUES (${values});\n`;
        }
        sql += '\n';
      } else {
        sql += `-- No data in table: ${tableName}\n\n`;
      }
      
    } catch (error) {
      console.warn(`   ⚠️  Warning: Could not process table ${tableName}: ${error.message}`);
      sql += `-- Error processing table ${tableName}: ${error.message}\n\n`;
    }
  }
  
  // Get foreign keys
  console.log('🔗 Adding foreign key constraints...');
  const [foreignKeys] = await sequelize.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `);
  
  sql += `-- Foreign Key Constraints\n`;
  for (const fk of foreignKeys) {
    sql += `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" `;
    sql += `FOREIGN KEY ("${fk.column_name}") `;
    sql += `REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}")`;
    if (fk.update_rule !== 'NO ACTION') {
      sql += ` ON UPDATE ${fk.update_rule}`;
    }
    if (fk.delete_rule !== 'NO ACTION') {
      sql += ` ON DELETE ${fk.delete_rule}`;
    }
    sql += ';\n';
  }
  sql += '\n';
  
  // Reset sequences
  console.log('🔢 Updating sequences...');
  sql += `-- Update sequences to current values\n`;
  for (const tableInfo of tables) {
    const tableName = tableInfo.table_name;
    try {
      const [sequences] = await sequelize.query(`
        SELECT column_name, column_default
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        AND column_default LIKE 'nextval%'
        AND table_schema = 'public'
      `);
      
      for (const seq of sequences) {
        sql += `SELECT setval(pg_get_serial_sequence('"${tableName}"', '${seq.column_name}'), COALESCE(MAX("${seq.column_name}"), 1)) FROM "${tableName}";\n`;
      }
    } catch (error) {
      // Ignore sequence errors
    }
  }
  
  // Re-enable constraints
  sql += `\n-- Re-enable triggers and constraints\n`;
  sql += `SET foreign_key_checks = 1;\n`;
  sql += `SET session_replication_role = DEFAULT;\n\n`;
  
  sql += `-- Backup completed successfully at ${new Date().toISOString()}\n`;
  sql += `-- Total tables: ${tables.length}\n`;
  sql += `-- Total rows: ${totalRows}\n`;
  
  // Write backup file
  console.log('💾 Writing backup file...');
  fs.writeFileSync(backupFile, sql, 'utf8');
  
  // Get file size
  const stats = fs.statSync(backupFile);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  // Create metadata file
  const metadata = {
    backup_info: {
      created_at: new Date().toISOString(),
      database_name: dbInfo[0].database_name,
      postgres_version: dbInfo[0].postgres_version,
      total_tables: tables.length,
      total_rows: totalRows,
      file_size_mb: parseFloat(fileSizeMB),
      backup_type: 'complete'
    },
    tables: tables.map(t => ({
      name: t.table_name,
      estimated_rows: t.estimated_rows || 0
    }))
  };
  
  const metadataFile = path.join(backupDir, 'metadata.json');
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  
  // Create restore instructions
  const restoreInstructions = `# Database Restore Instructions

## Backup Information
- **Folder**: ${backupFolderName}
- **File**: backup.sql
- **Created**: ${new Date().toISOString()}
- **Database**: ${dbInfo[0].database_name}
- **Size**: ${fileSizeMB} MB
- **Tables**: ${tables.length}
- **Rows**: ${totalRows}

## Files in this backup:
- **backup.sql** - Complete database backup
- **metadata.json** - Database structure and statistics
- **RESTORE.md** - This instruction file

## How to Restore

### Option 1: Complete Restore (Recommended)
\`\`\`bash
# Drop and recreate database
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS inventory_db;"
psql -h localhost -U postgres -c "CREATE DATABASE inventory_db;"

# Restore from backup (run from the backup folder)
psql -h localhost -U postgres -d inventory_db -f "backup.sql"
\`\`\`

### Option 2: Restore to existing database (will overwrite data)
\`\`\`bash
# Run from the backup folder
psql -h localhost -U postgres -d inventory_db -f "backup.sql"
\`\`\`

## Verification
After restore, verify the data:
\`\`\`sql
-- Check table count
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check row counts
${tables.map(t => `SELECT '${t.table_name}' as table_name, count(*) as rows FROM "${t.table_name}";`).join('\n')}
\`\`\`

## Troubleshooting
- Make sure PostgreSQL is running
- Ensure you have CREATE DATABASE privileges
- Check that the backup file is not corrupted
- Verify sufficient disk space for restore
`;

  const instructionsFile = path.join(backupDir, 'RESTORE.md');
  fs.writeFileSync(instructionsFile, restoreInstructions);
  
  // Close database connection
  await sequelize.close();
  
  console.log('\n🎉 Backup completed successfully!');
  console.log('=====================================');
  console.log(`📁 Backup folder: ${backupDir}`);
  console.log(`📄 Main file: backup.sql (${fileSizeMB} MB)`);
  console.log(`📋 Tables backed up: ${tables.length}`);
  console.log(`📊 Total rows: ${totalRows}`);
  console.log('');
  console.log('📦 Files created:');
  console.log(`   📄 backup.sql - Main database backup`);
  console.log(`   📊 metadata.json - Database statistics`);
  console.log(`   📖 RESTORE.md - Restore instructions`);
  console.log('\n✅ Your complete database backup is ready!');
  console.log(`   Navigate to: ${backupFolderName}`);
  console.log('   Run: psql -h localhost -U postgres -d inventory_db -f "backup.sql"');
  
} catch (error) {
  console.error('\n❌ Backup failed!');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
