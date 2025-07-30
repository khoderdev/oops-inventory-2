#!/usr/bin/env node

/**
 * Complete Database Backup Script
 *
 * This script creates a comprehensive backup of the PostgreSQL database including:
 * - All table schemas and structures
 * - All data with proper escaping
 * - All indexes and constraints
 * - All foreign key relationships
 * - All sequences and their current values
 * - All ENUM types
 * - All triggers and functions
 *
 * Usage: node scripts/dbBackup.js [output-file]
 * Example: node scripts/dbBackup.js backup.sql
 */

import chalk from "chalk";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

// Import database configuration
import sequelize from "../config/database.js";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration from your config
const DB_CONFIG = {
  host: "localhost",
  database: "inventory_db",
  username: "postgres",
  password: "postgres",
  port: 5432
};

/**
 * Generate timestamp for backup file naming
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/:/g, "-").replace(/\./g, "-").replace("T", "_").slice(0, 19);
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDirectory() {
  const backupDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(chalk.green(`✓ Created backup directory: ${backupDir}`));
  }
  return backupDir;
}

/**
 * Generate comprehensive database backup using pg_dump
 */
async function createDatabaseBackup(outputFile) {
  console.log(chalk.blue("🚀 Starting comprehensive database backup..."));

  const timestamp = getTimestamp();
  const backupDir = ensureBackupDirectory();

  // Use provided filename or generate one with timestamp
  const filename = outputFile || `inventory_db_backup_${timestamp}.sql`;
  const fullPath = path.isAbsolute(filename) ? filename : path.join(backupDir, filename);

  // Set PGPASSWORD environment variable to avoid password prompt
  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password };

  try {
    console.log(chalk.yellow("📊 Gathering database information..."));

    // Test database connection first
    await sequelize.authenticate();
    console.log(chalk.green("✓ Database connection successful"));

    // Get database size and table count
    const [results] = await sequelize.query(`
      SELECT 
        pg_size_pretty(pg_database_size('${DB_CONFIG.database}')) as db_size,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
    `);

    const { db_size, table_count } = results[0];
    console.log(chalk.cyan(`📈 Database size: ${db_size}`));
    console.log(chalk.cyan(`📋 Tables to backup: ${table_count}`));

    console.log(chalk.yellow("🔄 Creating comprehensive backup..."));

    // Comprehensive pg_dump command with all options
    const dumpCommand = [
      "pg_dump",
      `--host=${DB_CONFIG.host}`,
      `--port=${DB_CONFIG.port}`,
      `--username=${DB_CONFIG.username}`,
      `--dbname=${DB_CONFIG.database}`,
      "--verbose", // Verbose output
      "--clean", // Include DROP statements
      "--create", // Include CREATE DATABASE statement
      "--if-exists", // Use IF EXISTS for DROP statements
      "--column-inserts", // Use column names in INSERT statements
      "--disable-triggers", // Disable triggers during restore
      "--no-owner", // Don't output ownership commands
      "--no-privileges", // Don't output privilege commands
      "--schema-only", // First pass: schema only
      `--file="${fullPath}.schema"`
    ].join(" ");

    // Create schema backup
    console.log(chalk.yellow("📝 Backing up database schema..."));
    await execAsync(dumpCommand, { env });
    console.log(chalk.green("✓ Schema backup completed"));

    // Create data-only backup
    const dataCommand = dumpCommand.replace("--schema-only", "--data-only").replace('.schema"', '.data"');

    console.log(chalk.yellow("💾 Backing up database data..."));
    await execAsync(dataCommand, { env });
    console.log(chalk.green("✓ Data backup completed"));

    // Create complete backup (schema + data)
    const completeCommand = ["pg_dump", `--host=${DB_CONFIG.host}`, `--port=${DB_CONFIG.port}`, `--username=${DB_CONFIG.username}`, `--dbname=${DB_CONFIG.database}`, "--verbose", "--clean", "--create", "--if-exists", "--column-inserts", "--disable-triggers", "--no-owner", "--no-privileges", `--file="${fullPath}"`].join(" ");

    console.log(chalk.yellow("🔗 Creating complete backup (schema + data)..."));
    await execAsync(completeCommand, { env });
    console.log(chalk.green("✓ Complete backup created"));

    // Get file sizes
    const stats = fs.statSync(fullPath);
    const schemaStats = fs.statSync(`${fullPath}.schema`);
    const dataStats = fs.statSync(`${fullPath}.data`);

    console.log(chalk.green("\n🎉 Backup completed successfully!"));
    console.log(chalk.cyan("📁 Backup files created:"));
    console.log(chalk.white(`   • Complete: ${fullPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`));
    console.log(chalk.white(`   • Schema:   ${fullPath}.schema (${(schemaStats.size / 1024).toFixed(2)} KB)`));
    console.log(chalk.white(`   • Data:     ${fullPath}.data (${(dataStats.size / 1024 / 1024).toFixed(2)} MB)`));

    // Create additional metadata file
    await createMetadataFile(fullPath, db_size, table_count);

    return fullPath;
  } catch (error) {
    console.error(chalk.red("❌ Backup failed:"), error.message);
    throw error;
  }
}

/**
 * Create metadata file with backup information
 */
async function createMetadataFile(backupPath, dbSize, tableCount) {
  try {
    console.log(chalk.yellow("📋 Creating backup metadata..."));

    // Get table information
    const [tables] = await sequelize.query(`
      SELECT 
        table_name,
        (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
      FROM (
        SELECT 
          table_name, 
          table_schema,
          query_to_xml(format('select count(*) as cnt from %I.%I', table_schema, table_name), false, true, '') as xml_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ) t
      ORDER BY table_name;
    `);

    // Get indexes information
    const [indexes] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    // Get foreign keys information
    const [foreignKeys] = await sequelize.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    const metadata = {
      backup_info: {
        created_at: new Date().toISOString(),
        database_name: DB_CONFIG.database,
        database_size: dbSize,
        total_tables: tableCount,
        backup_type: "complete",
        pg_dump_version: "PostgreSQL pg_dump"
      },
      tables: tables.map(table => ({
        name: table.table_name,
        row_count: table.row_count || 0
      })),
      indexes: indexes.map(idx => ({
        table: idx.tablename,
        name: idx.indexname,
        definition: idx.indexdef
      })),
      foreign_keys: foreignKeys.map(fk => ({
        table: fk.table_name,
        column: fk.column_name,
        references_table: fk.foreign_table_name,
        references_column: fk.foreign_column_name,
        constraint_name: fk.constraint_name
      })),
      model_relationships: {
        description: "Sequelize model relationships from models/index.js",
        relationships: [
          "Material → StockEntry (hasMany)",
          "StockEntry → Material (belongsTo)",
          "Material → Assignment (hasMany)",
          "Assignment → Material (belongsTo)",
          "Section → Assignment (hasMany)",
          "Assignment → Section (belongsTo)",
          "StockEntry → Assignment (hasMany)",
          "Assignment → StockEntry (belongsTo)",
          "MenuItem → Assignment (hasMany)",
          "Assignment → MenuItem (belongsTo)",
          "MenuItem ↔ Material (belongsToMany through MenuItemIngredient)",
          "MenuItem → MenuItemIngredient (hasMany)",
          "MenuItemIngredient → MenuItem (belongsTo)",
          "Material → MenuItemIngredient (hasMany)",
          "MenuItemIngredient → Material (belongsTo)",
          "Sale → SaleMenuItem (hasMany)",
          "SaleMenuItem → Sale (belongsTo)",
          "MenuItem → SaleMenuItem (hasMany)",
          "SaleMenuItem → MenuItem (belongsTo)",
          "Sale → Section (belongsTo)",
          "Sale → User (belongsTo)",
          "Section → Sale (hasMany)",
          "StockEntry → Wasting (hasMany)",
          "Wasting → StockEntry (belongsTo)",
          "User → Session (hasMany)",
          "Session → User (belongsTo)",
          "User → AuditLog (hasMany)",
          "AuditLog → User (belongsTo)",
          "User → User (self-referencing for createdBy/updatedBy)",
          "Order → OrderItem (hasMany)",
          "OrderItem → Order (belongsTo)",
          "Table → Order (hasMany)",
          "Order → Table (belongsTo)",
          "Order → Sale (belongsTo)",
          "Sale → Order (hasOne)",
          "OrderItem → Material (belongsTo)",
          "Material → OrderItem (hasMany)",
          "OrderItem → MenuItem (belongsTo)",
          "MenuItem → OrderItem (hasMany)",
          "OrderItem → Assignment (belongsTo)",
          "Assignment → OrderItem (hasMany)",
          "User → Order (hasMany for createdBy/updatedBy)",
          "Order → User (belongsTo for creator/updater)"
        ]
      }
    };

    const metadataPath = `${backupPath}.metadata.json`;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(chalk.green(`✓ Metadata file created: ${metadataPath}`));
  } catch (error) {
    console.warn(chalk.yellow("⚠️  Could not create metadata file:"), error.message);
  }
}

/**
 * Create restore instructions file
 */
function createRestoreInstructions(backupPath) {
  const instructionsPath = `${backupPath}.RESTORE_INSTRUCTIONS.md`;
  const instructions = `# Database Restore Instructions

## Files Created
- \`${path.basename(backupPath)}\` - Complete backup (schema + data)
- \`${path.basename(backupPath)}.schema\` - Schema only backup
- \`${path.basename(backupPath)}.data\` - Data only backup
- \`${path.basename(backupPath)}.metadata.json\` - Backup metadata and structure info

## Restore Options

### Option 1: Complete Restore (Recommended)
\`\`\`bash
# This will drop and recreate the entire database
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS inventory_db;"
psql -h localhost -U postgres -c "CREATE DATABASE inventory_db;"
psql -h localhost -U postgres -d inventory_db -f "${path.basename(backupPath)}"
\`\`\`

### Option 2: Schema Only Restore
\`\`\`bash
psql -h localhost -U postgres -d inventory_db -f "${path.basename(backupPath)}.schema"
\`\`\`

### Option 3: Data Only Restore (requires existing schema)
\`\`\`bash
psql -h localhost -U postgres -d inventory_db -f "${path.basename(backupPath)}.data"
\`\`\`

### Option 4: Using pg_restore (if you prefer)
\`\`\`bash
# For complete restore
pg_restore -h localhost -U postgres -d inventory_db -c -v "${path.basename(backupPath)}"
\`\`\`

## Environment Setup
Make sure you have:
1. PostgreSQL installed and running
2. Database user 'postgres' with appropriate permissions
3. Set PGPASSWORD environment variable or use .pgpass file

## Verification After Restore
\`\`\`sql
-- Check table count
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check data integrity
SELECT 
  table_name,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT 
    table_name, 
    query_to_xml(format('select count(*) as cnt from %I.%I', 'public', table_name), false, true, '') as xml_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
) t
ORDER BY table_name;
\`\`\`

## Troubleshooting
- If you get permission errors, make sure the postgres user has CREATE DATABASE privileges
- If foreign key constraints fail, the backup includes proper ordering to handle dependencies
- Check the metadata.json file for detailed information about the original database structure
`;

  fs.writeFileSync(instructionsPath, instructions);
  console.log(chalk.green(`✓ Restore instructions created: ${instructionsPath}`));
}

/**
 * Main execution function
 */
async function main() {
  try {
    const outputFile = process.argv[2];

    console.log(chalk.blue.bold("🗄️  Database Backup Utility"));
    console.log(chalk.gray("====================================="));
    console.log(chalk.cyan(`📍 Database: ${DB_CONFIG.database}`));
    console.log(chalk.cyan(`🏠 Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`));
    console.log(chalk.cyan(`👤 User: ${DB_CONFIG.username}`));
    console.log("");

    const backupPath = await createDatabaseBackup(outputFile);
    createRestoreInstructions(backupPath);

    console.log("");
    console.log(chalk.green.bold("✅ Backup process completed successfully!"));
    console.log(chalk.gray("====================================="));
    console.log(chalk.white("You can now use this backup to restore your database on any PostgreSQL server."));
    console.log(chalk.white("See the RESTORE_INSTRUCTIONS.md file for detailed restore steps."));
  } catch (error) {
    console.error(chalk.red.bold("❌ Backup process failed!"));
    console.error(chalk.red(error.message));
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error(chalk.red("Unhandled Rejection at:"), promise, chalk.red("reason:"), reason);
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createDatabaseBackup, createMetadataFile };
