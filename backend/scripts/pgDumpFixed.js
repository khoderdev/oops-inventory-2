import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import os from "os";
import sequelize from "../config/database.js";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🗄️  PostgreSQL pg_dump Compatible Backup");
console.log("========================================");

// Cross-platform PostgreSQL detection
function findPostgreSQLPath() {
  const platform = os.platform();
  console.log(`🖥️  Detected OS: ${platform}`);

  if (platform === "win32") {
    // Windows paths
    const possiblePaths = ["C:\\Program Files\\PostgreSQL\\17\\bin", "C:\\Program Files\\PostgreSQL\\16\\bin", "C:\\Program Files\\PostgreSQL\\15\\bin", "C:\\Program Files\\PostgreSQL\\14\\bin", "C:\\Program Files\\PostgreSQL\\13\\bin", "C:\\Program Files (x86)\\PostgreSQL\\17\\bin", "C:\\Program Files (x86)\\PostgreSQL\\16\\bin", "C:\\Program Files (x86)\\PostgreSQL\\15\\bin"];

    for (const pgPath of possiblePaths) {
      const pgDumpPath = path.join(pgPath, "pg_dump.exe");
      if (fs.existsSync(pgDumpPath)) {
        console.log(`   ✓ Found PostgreSQL at: ${pgPath}`);
        return { binPath: pgPath, executable: "pg_dump.exe" };
      }
    }
  } else {
    // Linux/macOS paths
    const possiblePaths = ["/usr/bin", "/usr/local/bin", "/usr/local/pgsql/bin", "/opt/postgresql/bin", "/usr/lib/postgresql/17/bin", "/usr/lib/postgresql/16/bin", "/usr/lib/postgresql/15/bin", "/usr/lib/postgresql/14/bin", "/usr/lib/postgresql/13/bin"];

    for (const pgPath of possiblePaths) {
      const pgDumpPath = path.join(pgPath, "pg_dump");
      if (fs.existsSync(pgDumpPath)) {
        console.log(`   ✓ Found PostgreSQL at: ${pgPath}`);
        return { binPath: pgPath, executable: "pg_dump" };
      }
    }
  }

  // Try to find pg_dump in PATH
  console.log("   🔍 Checking if pg_dump is in PATH...");
  return { binPath: "", executable: platform === "win32" ? "pg_dump.exe" : "pg_dump" };
}

// Function to test pg_dump availability
async function testPgDumpAvailability(pgDumpCommand) {
  try {
    await execAsync(`${pgDumpCommand} --version`);
    return true;
  } catch (error) {
    return false;
  }
}

// Parse command line arguments for format selection
const args = process.argv.slice(2);
const formatArgs = args.filter(arg => arg.startsWith('--format='));
const selectedFormats = formatArgs.length > 0 
  ? formatArgs[0].replace('--format=', '').split(',').map(f => f.trim())
  : ['custom', 'directory', 'sql']; // Default to all formats

// Validate format selection
const validFormats = ['custom', 'directory', 'sql'];
const invalidFormats = selectedFormats.filter(f => !validFormats.includes(f));
if (invalidFormats.length > 0) {
  console.error(`❌ Invalid format(s): ${invalidFormats.join(', ')}`);
  console.error(`Valid formats: ${validFormats.join(', ')}`);
  process.exit(1);
}

console.log(`📋 Selected formats: ${selectedFormats.join(', ')}`);

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

  // Find PostgreSQL installation
  console.log("🔍 Locating PostgreSQL installation...");
  const pgInfo = findPostgreSQLPath();

  let pgDumpCommand;
  if (pgInfo.binPath) {
    pgDumpCommand = path.join(pgInfo.binPath, pgInfo.executable);
  } else {
    pgDumpCommand = pgInfo.executable;
  }

  // Test pg_dump availability
  console.log(`🧪 Testing pg_dump command: ${pgDumpCommand}`);
  const isAvailable = await testPgDumpAvailability(pgDumpCommand);

  if (!isAvailable) {
    throw new Error(`pg_dump command not found or not working: ${pgDumpCommand}`);
  }

  console.log("   ✓ pg_dump command is available");

  // Create backup directory structure
  const baseBackupDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(baseBackupDir)) {
    fs.mkdirSync(baseBackupDir, { recursive: true });
  }

  // Generate backup folder with readable format (including seconds for uniqueness)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  const backupFolderName = `pgdump_${year}-${month}-${day}_${displayHours}-${minutes}-${seconds}-${ampm}`;
  const backupDir = path.join(baseBackupDir, backupFolderName);

  // Remove existing backup folder if it exists (cleanup)
  if (fs.existsSync(backupDir)) {
    console.log(`🧹 Cleaning up existing backup folder...`);
    fs.rmSync(backupDir, { recursive: true, force: true });
  }

  // Create individual backup folder
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`📁 Created backup folder: ${backupFolderName}`);

  // Database configuration from main config
  const DB_CONFIG = {
    host: sequelize.config.host,
    database: sequelize.config.database,
    username: sequelize.config.username,
    password: sequelize.config.password,
    port: sequelize.config.port
  };
  
  console.log(`🗄️  Backing up database: ${DB_CONFIG.database}`);

  // Set PGPASSWORD environment variable
  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password };

  console.log(`🔄 Creating ${selectedFormats.length} backup format(s)...`);

  // Helper function to build pg_dump command
  function buildPgDumpCommand(format, outputFile, additionalOptions = "") {
    const baseOptions = `--host=${DB_CONFIG.host} --port=${DB_CONFIG.port} --username=${DB_CONFIG.username} --dbname=${DB_CONFIG.database} --verbose --clean --create --if-exists --no-owner --no-privileges`;

    if (os.platform() === "win32") {
      return `"${pgDumpCommand}" ${baseOptions} --format=${format} ${additionalOptions} --file="${outputFile}"`;
    } else {
      return `"${pgDumpCommand}" ${baseOptions} --format=${format} ${additionalOptions} --file="${outputFile}"`;
    }
  }

  // Store created files for summary
  const createdFiles = [];

  // 1. Custom format backup (for pg_restore)
  if (selectedFormats.includes('custom')) {
    console.log("   📦 Creating custom format backup...");
    const customBackupFile = path.join(backupDir, "backup.custom");
    const customCommand = buildPgDumpCommand("custom", customBackupFile);

    await execAsync(customCommand, { env });
    console.log("   ✓ Custom format backup created");
    createdFiles.push({ name: "backup.custom", type: "custom", path: customBackupFile });
  }

  // 2. Directory format backup (for pg_restore)
  if (selectedFormats.includes('directory')) {
    console.log("   📁 Creating directory format backup...");
    const dirBackupPath = path.join(backupDir, "backup_directory");

    // Ensure directory doesn't exist (pg_dump --format=directory fails if target exists)
    if (fs.existsSync(dirBackupPath)) {
      fs.rmSync(dirBackupPath, { recursive: true, force: true });
    }

    const dirCommand = buildPgDumpCommand("directory", dirBackupPath);

    await execAsync(dirCommand, { env });
    console.log("   ✓ Directory format backup created");
    createdFiles.push({ name: "backup_directory/", type: "directory", path: dirBackupPath });
  }

  // 3. Plain SQL backup (for psql)
  if (selectedFormats.includes('sql')) {
    console.log("   📄 Creating plain SQL backup...");
    const sqlBackupFile = path.join(backupDir, "backup.sql");
    const sqlCommand = buildPgDumpCommand("plain", sqlBackupFile, "--column-inserts");

    await execAsync(sqlCommand, { env });
    console.log("   ✓ Plain SQL backup created");
    createdFiles.push({ name: "backup.sql", type: "sql", path: sqlBackupFile });
  }

  // Get file sizes for created files
  const fileStats = {};
  createdFiles.forEach(file => {
    try {
      if (file.type === 'directory') {
        // Calculate directory size
        const dirSize = getDirSize(file.path);
        fileStats[file.type] = { size: dirSize, path: file.path };
      } else {
        const stats = fs.statSync(file.path);
        fileStats[file.type] = { size: stats.size, path: file.path };
      }
    } catch (error) {
      console.warn(`Warning: Could not get size for ${file.name}:`, error.message);
      fileStats[file.type] = { size: 0, path: file.path };
    }
  });

  // Helper function to calculate directory size
  function getDirSize(dirPath) {
    let totalSize = 0;
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          totalSize += getDirSize(filePath);
        } else {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not calculate size for directory ${dirPath}:`, error.message);
    }
    return totalSize;
  }

  // Create comprehensive restore instructions
  let restoreInstructions = `# PostgreSQL Backup Restore Instructions

## Backup Information
- **Created**: ${new Date().toLocaleString()}
- **Database**: ${DB_CONFIG.database}
- **PostgreSQL Version**: Compatible with PostgreSQL 17+
- **Selected Formats**: ${selectedFormats.join(', ').toUpperCase()}

## Available Backup Formats

`;

  // Add instructions for each created format
  if (selectedFormats.includes('custom') && fileStats.custom) {
    restoreInstructions += `### Custom Format (backup.custom)
**Best for**: pgAdmin Restore, pg_restore command
**Size**: ${(fileStats.custom.size / 1024 / 1024).toFixed(2)} MB

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

`;
  }

  if (selectedFormats.includes('directory') && fileStats.directory) {
    restoreInstructions += `### Directory Format (backup_directory/)
**Best for**: Parallel restore, large databases
**Size**: ${(fileStats.directory.size / 1024 / 1024).toFixed(2)} MB

#### Using pg_restore command:
\`\`\`bash
# Create new database first
createdb -U postgres new_inventory_db

# Restore from directory backup (parallel jobs)
pg_restore -U postgres -d new_inventory_db -v -j 4 backup_directory/
\`\`\`

`;
  }

  if (selectedFormats.includes('sql') && fileStats.sql) {
    restoreInstructions += `### Plain SQL Format (backup.sql)
**Best for**: Cross-platform compatibility, manual editing
**Size**: ${(fileStats.sql.size / 1024 / 1024).toFixed(2)} MB

#### Using psql command:
\`\`\`bash
# The SQL file contains CREATE DATABASE, so just run:
psql -U postgres -f backup.sql
\`\`\`

#### Using pgAdmin Query Tool:
1. Open pgAdmin Query Tool
2. Open backup.sql file
3. Execute the SQL statements

`;
  }

  restoreInstructions += `## Important Notes
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
  console.log(`📦 Files created (${createdFiles.length} format${createdFiles.length !== 1 ? 's' : ''}):`);
  
  // Show details for each created file
  createdFiles.forEach(file => {
    const stats = fileStats[file.type];
    const sizeStr = stats ? `(${(stats.size / 1024 / 1024).toFixed(2)} MB)` : '';
    
    switch (file.type) {
      case 'custom':
        console.log(`   📦 ${file.name} - Custom format ${sizeStr}`);
        break;
      case 'directory':
        console.log(`   📁 ${file.name} - Directory format ${sizeStr}`);
        break;
      case 'sql':
        console.log(`   📄 ${file.name} - Plain SQL ${sizeStr}`);
        break;
    }
  });
  
  console.log(`   📋 RESTORE.md - Detailed restore instructions`);

  console.log("");
  console.log(`✅ Selected backup format${selectedFormats.length !== 1 ? 's' : ''} created successfully!`);
  
  // Show usage instructions based on created formats
  const usageInstructions = [];
  if (selectedFormats.includes('custom') || selectedFormats.includes('directory')) {
    usageInstructions.push('Use backup.custom or backup_directory with pgAdmin Restore');
  }
  if (selectedFormats.includes('sql')) {
    usageInstructions.push('Use backup.sql with psql or pgAdmin Query Tool');
  }
  
  usageInstructions.forEach(instruction => {
    console.log(`   ${instruction}`);
  });
  
  console.log("");
  console.log(`📝 Usage: node pgDumpFixed.js --format=${selectedFormats.join(',')}`);
  console.log(`📝 Available formats: ${validFormats.join(', ')}`);
  console.log(`📝 Example: node pgDumpFixed.js --format=sql,custom`);
} catch (error) {
  console.error("\n❌ pg_dump backup failed!");
  console.error("Error:", error.message);

  console.error("\n💡 Cross-Platform Troubleshooting:");

  const platform = os.platform();
  if (platform === "win32") {
    console.error("\n🪟 Windows:");
    console.error("   1. Install PostgreSQL from: https://www.postgresql.org/download/windows/");
    console.error("   2. During installation, make sure 'Command Line Tools' is selected");
    console.error("   3. Add PostgreSQL bin to PATH:");
    console.error("      - Add: C:\\Program Files\\PostgreSQL\\[VERSION]\\bin");
    console.error("   4. Restart your terminal/command prompt");
    console.error("   5. Test with: pg_dump --version");
  } else if (platform === "linux") {
    console.error("\n🐧 Linux:");
    console.error("   Ubuntu/Debian:");
    console.error("     sudo apt update");
    console.error("     sudo apt install postgresql-client");
    console.error("   CentOS/RHEL/Fedora:");
    console.error("     sudo yum install postgresql (CentOS/RHEL)");
    console.error("     sudo dnf install postgresql (Fedora)");
    console.error("   Test with: pg_dump --version");
  } else if (platform === "darwin") {
    console.error("\n🍎 macOS:");
    console.error("   Using Homebrew:");
    console.error("     brew install postgresql");
    console.error("   Using MacPorts:");
    console.error("     sudo port install postgresql17");
    console.error("   Test with: pg_dump --version");
  }

  console.error("\n🔧 General Solutions:");
  console.error("   - Ensure PostgreSQL client tools are installed");
  console.error("   - Verify pg_dump is in your system PATH");
  console.error("   - Check PostgreSQL service is running");
  console.error("   - Verify database connection parameters");
  console.error("   - Check if PGPASSWORD environment variable is set correctly");

  console.error("\n📋 Quick Test:");
  console.error(`   Run: ${platform === "win32" ? "pg_dump.exe" : "pg_dump"} --version`);

  process.exit(1);
}
