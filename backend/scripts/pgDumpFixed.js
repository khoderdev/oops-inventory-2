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
  const PG_DUMP_EXE = path.join(PG_BIN_PATH, "pg_dump.exe");

  // Set PGPASSWORD environment variable
  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password };

  console.log("🔄 Creating multiple backup formats...");

  // 1. Custom format backup (for pg_restore)
  console.log("   📦 Creating custom format backup...");
  const customBackupFile = path.join(backupDir, "backup.custom");
  const customCommand = `"${PG_DUMP_EXE}" --host=${DB_CONFIG.host} --port=${DB_CONFIG.port} --username=${DB_CONFIG.username} --dbname=${DB_CONFIG.database} --format=custom --verbose --clean --create --if-exists --no-owner --no-privileges --file="${customBackupFile}"`;

  await execAsync(customCommand, { env });
  console.log("   ✓ Custom format backup created");

  // 2. Directory format backup (for pg_restore)
  console.log("   📁 Creating directory format backup...");
  const dirBackupPath = path.join(backupDir, "backup_directory");
  const dirCommand = `"${PG_DUMP_EXE}" --host=${DB_CONFIG.host} --port=${DB_CONFIG.port} --username=${DB_CONFIG.username} --dbname=${DB_CONFIG.database} --format=directory --verbose --clean --create --if-exists --no-owner --no-privileges --file="${dirBackupPath}"`;

  await execAsync(dirCommand, { env });
  console.log("   ✓ Directory format backup created");

  // 3. Plain SQL backup (for psql)
  console.log("   📄 Creating plain SQL backup...");
  const sqlBackupFile = path.join(backupDir, "backup.sql");
  const sqlCommand = `"${PG_DUMP_EXE}" --host=${DB_CONFIG.host} --port=${DB_CONFIG.port} --username=${DB_CONFIG.username} --dbname=${DB_CONFIG.database} --format=plain --verbose --clean --create --if-exists --column-inserts --no-owner --no-privileges --file="${sqlBackupFile}"`;

  await execAsync(sqlCommand, { env });
  console.log("   ✓ Plain SQL backup created");

  // Get file sizes
  const customStats = fs.statSync(customBackupFile);
  const sqlStats = fs.statSync(sqlBackupFile);

  // Create comprehensive restore instructions
  const restoreInstructions = `# PostgreSQL Backup Restore Instructions

## Backup Information
- **Created**: ${new Date().toLocaleString()}
- **Database**: ${DB_CONFIG.database}
- **PostgreSQL Version**: Compatible with PostgreSQL 17+

## Available Backup Formats

### 1. Custom Format (backup.custom)
**Best for**: pgAdmin Restore, pg_restore command
**Size**: ${(customStats.size / 1024 / 1024).toFixed(2)} MB

#### Using pgAdmin:
1. Right-click on your database → Restore
2. Select "backup.custom" file
3. Choose restore options and click Restore

#### Using pg_restore command:
\`\`\`bash
# Create new database first
createdb -U postgres new_inventory_db

# Restore from custom backup
pg_restore -U postgres -d new_inventory_db -v backup.custom
\`\`\`

### 2. Directory Format (backup_directory/)
**Best for**: Parallel restore, large databases
**Format**: Directory with multiple files

#### Using pg_restore command:
\`\`\`bash
# Create new database first
createdb -U postgres new_inventory_db

# Restore from directory backup (parallel jobs)
pg_restore -U postgres -d new_inventory_db -v -j 4 backup_directory/
\`\`\`

### 3. Plain SQL Format (backup.sql)
**Best for**: Cross-platform compatibility, manual editing
**Size**: ${(sqlStats.size / 1024 / 1024).toFixed(2)} MB

#### Using psql command:
\`\`\`bash
# The SQL file contains CREATE DATABASE, so just run:
psql -U postgres -f backup.sql
\`\`\`

#### Using pgAdmin Query Tool:
1. Open pgAdmin Query Tool
2. Open backup.sql file
3. Execute the SQL statements

## Important Notes
- All backups include schema, data, indexes, and constraints
- Backups are created with --clean and --create flags
- No ownership or privilege information is included for portability
- **Custom** and **Directory** formats: Use with pg_restore or pgAdmin Restore
- **Plain SQL** format: Use with psql or pgAdmin Query Tool

## Troubleshooting
- Ensure target PostgreSQL version is compatible
- For permission issues, run as database superuser
- For large databases, use directory format with parallel restore
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
  console.log(`   📋 RESTORE.md - Detailed restore instructions`);

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
