#!/usr/bin/env node

/**
 * Simple Database Backup Script (No pg_dump required)
 * 
 * This script creates a comprehensive backup using only Sequelize and Node.js
 * Works on Windows without requiring PostgreSQL client tools
 * 
 * Usage: node scripts/simpleBackup.js [output-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Import all models and sequelize
import { 
  sequelize, 
  User, 
  Material, 
  StockEntry, 
  MenuItem, 
  MenuItemIngredient,
  Section,
  Assignment,
  Sale,
  SaleMenuItem,
  Order,
  OrderItem,
  Table,
  Session,
  AuditLog,
  StockEntryLogSimple,
  Wasting,
  DayOperation
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate timestamp for backup file naming
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-')
    .replace('T', '_')
    .slice(0, 19);
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDirectory() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(chalk.green(`✓ Created backup directory: ${backupDir}`));
  }
  return backupDir;
}

/**
 * Escape SQL values for safe insertion
 */
function escapeSqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  
  return value.toString();
}

/**
 * Generate CREATE TABLE statement from Sequelize model
 */
function generateCreateTableSQL(model) {
  const tableName = model.getTableName();
  const attributes = model.getAttributes();
  
  let sql = `-- Table: ${tableName}\n`;
  sql += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
  sql += `CREATE TABLE "${tableName}" (\n`;
  
  const columns = [];
  
  for (const [columnName, attribute] of Object.entries(attributes)) {
    let columnDef = `  "${columnName}"`;
    
    // Handle data types
    if (attribute.type.constructor.name === 'INTEGER') {
      columnDef += ' INTEGER';
      if (attribute.autoIncrement) {
        columnDef += ' SERIAL';
      }
    } else if (attribute.type.constructor.name === 'STRING') {
      const length = attribute.type._length || 255;
      columnDef += ` VARCHAR(${length})`;
    } else if (attribute.type.constructor.name === 'TEXT') {
      columnDef += ' TEXT';
    } else if (attribute.type.constructor.name === 'BOOLEAN') {
      columnDef += ' BOOLEAN';
    } else if (attribute.type.constructor.name === 'DATE') {
      columnDef += ' TIMESTAMP WITH TIME ZONE';
    } else if (attribute.type.constructor.name === 'DECIMAL') {
      const precision = attribute.type._precision || 10;
      const scale = attribute.type._scale || 2;
      columnDef += ` DECIMAL(${precision},${scale})`;
    } else if (attribute.type.constructor.name === 'JSONB') {
      columnDef += ' JSONB';
    } else if (attribute.type.constructor.name === 'ENUM') {
      columnDef += ` VARCHAR(50)`;
    } else {
      columnDef += ' TEXT'; // fallback
    }
    
    // Handle constraints
    if (attribute.allowNull === false) {
      columnDef += ' NOT NULL';
    }
    
    if (attribute.primaryKey) {
      columnDef += ' PRIMARY KEY';
    }
    
    if (attribute.unique) {
      columnDef += ' UNIQUE';
    }
    
    if (attribute.defaultValue !== undefined) {
      if (typeof attribute.defaultValue === 'string') {
        columnDef += ` DEFAULT '${attribute.defaultValue}'`;
      } else if (typeof attribute.defaultValue === 'boolean') {
        columnDef += ` DEFAULT ${attribute.defaultValue ? 'TRUE' : 'FALSE'}`;
      } else {
        columnDef += ` DEFAULT ${attribute.defaultValue}`;
      }
    }
    
    columns.push(columnDef);
  }
  
  sql += columns.join(',\n');
  sql += '\n);\n\n';
  
  return sql;
}

/**
 * Generate INSERT statements for table data
 */
async function generateInsertSQL(model) {
  const tableName = model.getTableName();
  const data = await model.findAll({ raw: true });
  
  if (data.length === 0) {
    return `-- No data in table: ${tableName}\n\n`;
  }
  
  let sql = `-- Data for table: ${tableName}\n`;
  
  const columns = Object.keys(data[0]);
  const columnNames = columns.map(col => `"${col}"`).join(', ');
  
  for (const row of data) {
    const values = columns.map(col => escapeSqlValue(row[col])).join(', ');
    sql += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
  }
  
  sql += '\n';
  return sql;
}

/**
 * Create comprehensive database backup
 */
async function createDatabaseBackup(outputFile) {
  console.log(chalk.blue('🚀 Starting database backup...'));
  
  const timestamp = getTimestamp();
  const backupDir = ensureBackupDirectory();
  
  // Use provided filename or generate one with timestamp
  const filename = outputFile || `inventory_db_backup_${timestamp}.sql`;
  const fullPath = path.isAbsolute(filename) ? filename : path.join(backupDir, filename);
  
  try {
    console.log(chalk.yellow('📊 Testing database connection...'));
    
    // Test database connection
    await sequelize.authenticate();
    console.log(chalk.green('✓ Database connection successful'));
    
    // Get database info
    const [dbInfo] = await sequelize.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `);
    
    console.log(chalk.cyan(`📍 Database: ${dbInfo[0].database_name}`));
    console.log(chalk.cyan(`👤 User: ${dbInfo[0].current_user}`));
    
    let backupSQL = '';
    
    // Add header
    backupSQL += `-- Database Backup Generated on ${new Date().toISOString()}\n`;
    backupSQL += `-- Database: ${dbInfo[0].database_name}\n`;
    backupSQL += `-- PostgreSQL Version: ${dbInfo[0].postgres_version}\n`;
    backupSQL += `-- Generated by: Simple Backup Script\n\n`;
    
    backupSQL += `-- Disable triggers during restore\n`;
    backupSQL += `SET session_replication_role = replica;\n\n`;
    
    // Define models in dependency order (to handle foreign keys)
    const modelsInOrder = [
      { model: User, name: 'User' },
      { model: Section, name: 'Section' },
      { model: Material, name: 'Material' },
      { model: StockEntry, name: 'StockEntry' },
      { model: MenuItem, name: 'MenuItem' },
      { model: MenuItemIngredient, name: 'MenuItemIngredient' },
      { model: Assignment, name: 'Assignment' },
      { model: Table, name: 'Table' },
      { model: Sale, name: 'Sale' },
      { model: SaleMenuItem, name: 'SaleMenuItem' },
      { model: Order, name: 'Order' },
      { model: OrderItem, name: 'OrderItem' },
      { model: Session, name: 'Session' },
      { model: AuditLog, name: 'AuditLog' },
      { model: StockEntryLogSimple, name: 'StockEntryLogSimple' },
      { model: Wasting, name: 'Wasting' },
      { model: DayOperation, name: 'DayOperation' }
    ];
    
    console.log(chalk.yellow('🏗️  Generating table schemas...'));
    
    // Generate CREATE TABLE statements
    for (const { model, name } of modelsInOrder) {
      try {
        console.log(chalk.gray(`   Creating schema for ${name}...`));
        backupSQL += generateCreateTableSQL(model);
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Warning: Could not generate schema for ${name}: ${error.message}`));
      }
    }
    
    console.log(chalk.yellow('💾 Exporting table data...'));
    
    // Generate INSERT statements
    for (const { model, name } of modelsInOrder) {
      try {
        console.log(chalk.gray(`   Exporting data from ${name}...`));
        const insertSQL = await generateInsertSQL(model);
        backupSQL += insertSQL;
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Warning: Could not export data from ${name}: ${error.message}`));
        backupSQL += `-- Error exporting ${name}: ${error.message}\n\n`;
      }
    }
    
    // Add footer
    backupSQL += `-- Re-enable triggers\n`;
    backupSQL += `SET session_replication_role = DEFAULT;\n\n`;
    backupSQL += `-- Update sequences to current values\n`;
    
    // Update sequences
    for (const { model, name } of modelsInOrder) {
      try {
        const tableName = model.getTableName();
        const attributes = model.getAttributes();
        
        // Find auto-increment columns
        for (const [columnName, attribute] of Object.entries(attributes)) {
          if (attribute.autoIncrement) {
            backupSQL += `SELECT setval(pg_get_serial_sequence('"${tableName}"', '${columnName}'), COALESCE(MAX("${columnName}"), 1)) FROM "${tableName}";\n`;
          }
        }
      } catch (error) {
        // Ignore sequence errors
      }
    }
    
    backupSQL += `\n-- Backup completed successfully\n`;
    
    // Write backup file
    fs.writeFileSync(fullPath, backupSQL, 'utf8');
    
    // Get file size
    const stats = fs.statSync(fullPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(chalk.green('\n🎉 Backup completed successfully!'));
    console.log(chalk.cyan(`📁 Backup file: ${fullPath}`));
    console.log(chalk.cyan(`📊 File size: ${fileSizeMB} MB`));
    
    // Create metadata
    await createMetadataFile(fullPath, modelsInOrder);
    
    return fullPath;
    
  } catch (error) {
    console.error(chalk.red('❌ Backup failed:'), error.message);
    console.error(chalk.red('Stack trace:'), error.stack);
    throw error;
  }
}

/**
 * Create metadata file
 */
async function createMetadataFile(backupPath, modelsInOrder) {
  try {
    console.log(chalk.yellow('📋 Creating backup metadata...'));
    
    const metadata = {
      backup_info: {
        created_at: new Date().toISOString(),
        backup_type: 'sequelize_simple',
        node_version: process.version,
        platform: process.platform
      },
      tables: []
    };
    
    // Get row counts
    for (const { model, name } of modelsInOrder) {
      try {
        const count = await model.count();
        metadata.tables.push({
          name: model.getTableName(),
          model_name: name,
          row_count: count
        });
      } catch (error) {
        metadata.tables.push({
          name: model.getTableName(),
          model_name: name,
          row_count: 0,
          error: error.message
        });
      }
    }
    
    const metadataPath = `${backupPath}.metadata.json`;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(chalk.green(`✓ Metadata file created: ${metadataPath}`));
    
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not create metadata file:'), error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    const outputFile = process.argv[2];
    
    console.log(chalk.blue.bold('🗄️  Simple Database Backup Utility'));
    console.log(chalk.gray('====================================='));
    console.log('');
    
    const backupPath = await createDatabaseBackup(outputFile);
    
    console.log('');
    console.log(chalk.green.bold('✅ Backup process completed successfully!'));
    console.log(chalk.gray('====================================='));
    console.log(chalk.white('To restore this backup:'));
    console.log(chalk.cyan(`psql -h localhost -U postgres -d inventory_db -f "${path.basename(backupPath)}"`));
    
  } catch (error) {
    console.error(chalk.red.bold('❌ Backup process failed!'));
    console.error(chalk.red(error.message));
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createDatabaseBackup };
