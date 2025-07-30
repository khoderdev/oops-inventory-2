#!/usr/bin/env node

/**
 * PostgreSQL pg_dump Compatible Backup Script
 * Creates backups compatible with pg_restore for pgAdmin
 */

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🗄️  PostgreSQL pg_dump Compatible Backup");
console.log("========================================");

try {
  // Import database config to test connection
  console.log("📦 Testing database connection...");
  const { default: sequelize } = await import("../config/database.js");
  await sequelize.authenticate();
  console.log("   ✓ Database connection successful");

  // Get database info
  const [dbInfo] = await sequelize.query(`
    SELECT current_database() as database_name, current_user as current_user
  `);
  console.log(`   📍 Database: ${dbInfo[0].database_name}`);
  console.log(`   👤 User: ${dbInfo[0].current_user}`);

  // Close sequelize connection
  await sequelize.close();

  // Create backup directory structure
  const baseBackupDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(baseBackupDir)) {
    fs.mkdirSync(baseBackupDir, { recursive: true });
  }

  // Generate backup folder with readable format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  const backupFolderName = `pgdump_${year}-${month}-${day}_${displayHours}-${minutes}-${ampm}`;
  const backupDir = path.join(baseBackupDir, backupFolderName);

  // Create individual backup folder
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`📁 Created backup folder: ${backupFolderName}`);

  // Database configuration
  const DB_CONFIG = {
    host: "localhost",
    database: "inventory_db",
    username: "postgres",
    password: "postgres",
    port: 5432
  };

  // PostgreSQL bin path (auto-detected)
  const PG_BIN_PATH = "C:\\Program Files\\PostgreSQL\\17\\bin";

  // Set PGPASSWORD environment variable
  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password };

  console.log("🔄 Creating multiple backup formats...");

  // 1. Custom format backup (for pg_restore)
  console.log("   📦 Creating custom format backup...");
  const customBackupFile = path.join(backupDir, "backup.custom");
  const customCommand = [
    `"${path.join(PG_BIN_PATH, "pg_dump.exe")}"`,
    `--host=${DB_CONFIG.host}`,
    `--port=${DB_CONFIG.port}`,
    `--username=${DB_CONFIG.username}`,
    `--dbname=${DB_CONFIG.database}`,
    "--format=custom",
    "--verbose",
    "--clean",
    "--create",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    `--file="${customBackupFile}"`
  ].join(" ");

  await execAsync(customCommand, { env });
  console.log("   ✓ Custom format backup created");

  // 2. Directory format backup (for pg_restore)
  console.log("   📁 Creating directory format backup...");
  const dirBackupPath = path.join(backupDir, "backup_directory");
  const dirCommand = [
    `"${path.join(PG_BIN_PATH, "pg_dump.exe")}",
    `--host=${DB_CONFIG.host}`,
    `--port=${DB_CONFIG.port}`,
    `--username=${DB_CONFIG.username}`,
    `--dbname=${DB_CONFIG.database}`,
    "--format=directory",
    "--verbose",
    "--clean",
    "--create",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    `--file="${dirBackupPath}"`
  ].join(" ");

  await execAsync(dirCommand, { env });
  console.log("   ✓ Directory format backup created");

  // 3. Plain SQL backup (for psql)
  console.log("   📄 Creating plain SQL backup...");
  const sqlBackupFile = path.join(backupDir, "backup.sql");
  const sqlCommand = ["pg_dump", `--host=${DB_CONFIG.host}`, `--port=${DB_CONFIG.port}`, `--username=${DB_CONFIG.username}`, `--dbname=${DB_CONFIG.database}`, "--format=plain", "--verbose", "--clean", "--create", "--if-exists", "--column-inserts", "--no-owner", "--no-privileges", `--file="${sqlBackupFile}"`].join(" ");

  await execAsync(sqlCommand, { env });
  console.log("   ✓ Plain SQL backup created");

  // Get file sizes
  const customStats = fs.statSync(customBackupFile);
  const sqlStats = fs.statSync(sqlBackupFile);

  // Create comprehensive restore instructions
  const restoreInstructions = `# PostgreSQL Backup Restore Instructions

## Backup Information
- **Folder**: ${backupFolderName}
- **Created**: ${new Date().toISOString()}
- **Database**: ${DB_CONFIG.database}
- **Formats**: Custom, Directory, Plain SQL

## Files in this backup:
- **backup.custom** - Custom format (${(customStats.size / 1024 / 1024).toFixed(2)} MB) - Use with pg_restore
- **backup_directory/** - Directory format - Use with pg_restore
- **backup.sql** - Plain SQL (${(sqlStats.size / 1024 / 1024).toFixed(2)} MB) - Use with psql
- **RESTORE.md** - This instruction file

## Restore Methods

### Method 1: Using pgAdmin Restore Feature
1. Open pgAdmin
2. Right-click on "Databases" → Create → Database
3. Name it "inventory_db_restored" (or any name)
4. Right-click on the new database → Restore...
5. Select **backup.custom** file
6. Click "Restore"

### Method 2: Using pg_restore command (Custom format)
\`\`\`bash
# Create new database
psql -h localhost -U postgres -c "CREATE DATABASE inventory_db_restored;"

# Restore from custom format
pg_restore -h localhost -U postgres -d inventory_db_restored -v -c --if-exists "backup.custom"
\`\`\`

### Method 3: Using pg_restore command (Directory format)
\`\`\`bash
# Create new database
psql -h localhost -U postgres -c "CREATE DATABASE inventory_db_restored;"

# Restore from directory format
pg_restore -h localhost -U postgres -d inventory_db_restored -v -c --if-exists "backup_directory"
\`\`\`

### Method 4: Using psql command (Plain SQL)
\`\`\`bash
# Create new database
psql -h localhost -U postgres -c "CREATE DATABASE inventory_db_restored;"

# Restore from SQL file
psql -h localhost -U postgres -d inventory_db_restored -f "backup.sql"
\`\`\`

### Method 5: Using pgAdmin Query Tool (Plain SQL)
1. Open pgAdmin
2. Create a new database
3. Right-click database → Query Tool
4. Open backup.sql file
5. Execute the SQL

## Verification
After restore, verify the data:
\`\`\`sql
-- Check table count
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check some data
SELECT count(*) FROM users;
SELECT count(*) FROM materials;
SELECT count(*) FROM "stockEntries";
\`\`\`

## Troubleshooting
- **pg_restore error**: Make sure you're using the correct format file
- **Permission denied**: Ensure PostgreSQL user has necessary privileges
- **File not found**: Check file paths and ensure files exist
- **Connection refused**: Verify PostgreSQL is running and accessible

## Format Comparison
- **Custom format**: Compressed, fastest restore, best for large databases
- **Directory format**: Multiple files, parallel restore support
- **Plain SQL**: Human-readable, works with any PostgreSQL tool
`;

  const instructionsFile = path.join(backupDir, "RESTORE.md");
  fs.writeFileSync(instructionsFile, restoreInstructions);

  console.log("\n🎉 pg_dump backup completed successfully!");
  console.log("==========================================");
  console.log(`📁 Backup folder: ${backupDir}`);
  console.log("");
  console.log("📦 Files created:");
  console.log(`   📦 backup.custom - Custom format (${(customStats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   📁 backup_directory/ - Directory format`);
  console.log(`   📄 backup.sql - Plain SQL (${(sqlStats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   📖 RESTORE.md - Restore instructions`);
  console.log("");
  console.log("✅ All backup formats created successfully!");
  console.log("   Use backup.custom or backup_directory with pgAdmin Restore");
  console.log("   Use backup.sql with psql or pgAdmin Query Tool");
} catch (error) {
  console.error("\n❌ pg_dump backup failed!");
  console.error("Error:", error.message);

  if (error.message.includes("pg_dump")) {
    console.error("\n💡 Troubleshooting:");
    console.error("   - Make sure PostgreSQL client tools are installed");
    console.error("   - Add PostgreSQL bin directory to your PATH");
    console.error("   - Verify pg_dump command is available");
  }

  process.exit(1);
}
