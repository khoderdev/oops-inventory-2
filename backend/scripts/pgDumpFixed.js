import { exec } from "child_process";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from 'path';
import { promisify } from "util";
import os from "os";
import { findPostgreSQLPath } from './pgPathFinder.js';

// Set this to false to prevent writing config file during server startup
const WRITE_CONFIG_ON_STARTUP = false;

// Test if pg_dump is available
async function testPgDumpAvailability(pgDumpPath, pgDumpExecutable) {
  const pgDumpFullPath = pgDumpPath ? path.join(pgDumpPath, pgDumpExecutable) : pgDumpExecutable;
  
  try {
    const { stdout } = await execAsync(`"${pgDumpFullPath}" --version`);
    console.log(`✅ pg_dump version: ${stdout.trim()}`);
    return true;
  } catch (error) {
    console.error(`❌ Error testing pg_dump: ${error.message}`);
    
    // Provide detailed troubleshooting steps based on platform
    const platform = os.platform();
    let troubleshootingSteps = '';
    
    if (platform === 'win32') {
      troubleshootingSteps = `
        Windows Troubleshooting Steps:
        1. Make sure PostgreSQL is installed with the "Command Line Tools" option
        2. Verify that pg_dump.exe exists at: ${pgDumpFullPath}
        3. Add the PostgreSQL bin directory to your PATH environment variable:
           - Right-click on "This PC" > Properties > Advanced system settings > Environment Variables
           - Edit the PATH variable and add: ${pgDumpPath || 'C:\\Program Files\\PostgreSQL\\[VERSION]\\bin'}
        4. Restart your terminal or command prompt
        5. Test by running: pg_dump --version
        
        If using the API, make sure the PGPASSWORD environment variable is set correctly.
        
        You can also run the pgPathFinder.js script to automatically detect PostgreSQL:
        node backend/scripts/pgPathFinder.js
      `;
    } else {
      troubleshootingSteps = `
        Unix/Linux/macOS Troubleshooting Steps:
        1. Make sure PostgreSQL client tools are installed:
           - Debian/Ubuntu: sudo apt-get install postgresql-client
           - RHEL/CentOS: sudo yum install postgresql
           - macOS (Homebrew): brew install postgresql
        2. Verify that pg_dump exists at: ${pgDumpFullPath}
        3. Add the PostgreSQL bin directory to your PATH:
           - Add to ~/.bashrc or ~/.zshrc: export PATH="${pgDumpPath || '/usr/bin'}:$PATH"
        4. Restart your terminal
        5. Test by running: pg_dump --version
        
        If using the API, make sure the PGPASSWORD environment variable is set correctly.
        
        You can also run the pgPathFinder.js script to automatically detect PostgreSQL:
        node backend/scripts/pgPathFinder.js
      `;
    }
    
    throw new Error(`pg_dump not found or not working. ${error.message}\n${troubleshootingSteps}`);
  }
}

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🗄️  PostgreSQL pg_dump Compatible Backup");
console.log("========================================");

// Cross-platform PostgreSQL detection
async function findPostgreSQLBinPath() {
  try {
    // Check if we have a saved configuration
    const configPath = path.join(__dirname, '..', 'config', 'pgPath.json');
    console.log(`Looking for PostgreSQL configuration at: ${configPath}`);
    
    let pgInfo;
    
    // Create config directory if it doesn't exist
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      console.log(`Creating config directory: ${configDir}`);
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    if (fs.existsSync(configPath)) {
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('📋 Using saved PostgreSQL configuration');
        
        // Verify the saved path still works
        if (configData.inPath || (configData.binPath && fs.existsSync(configData.binPath))) {
          pgInfo = configData;
        } else {
          console.log('⚠️ Saved PostgreSQL path is no longer valid, detecting again...');
          pgInfo = await findPostgreSQLPath(WRITE_CONFIG_ON_STARTUP);
        }
      } catch (error) {
        console.log(`⚠️ Error reading saved configuration: ${error.message}`);
        pgInfo = await findPostgreSQLPath(WRITE_CONFIG_ON_STARTUP);
      }
    } else {
      // No saved configuration, detect PostgreSQL
      console.log('🔍 Detecting PostgreSQL installation...');
      pgInfo = await findPostgreSQLPath(WRITE_CONFIG_ON_STARTUP);
    }
    
    if (pgInfo.notFound) {
      throw new Error('PostgreSQL not found. Please install PostgreSQL and ensure pg_dump is available.');
    }
    
    return { 
      pgDumpPath: pgInfo.binPath, 
      pgDumpExecutable: pgInfo.executable 
    };
  } catch (error) {
    console.error(`❌ Error finding PostgreSQL: ${error.message}`);
    throw error;
  }
}


// Parse command line arguments for format selection
const args = process.argv.slice(2);
const formatArgs = args.filter(arg => arg.startsWith('--format='));

// If format is specified, use only that format; otherwise default to custom only
const selectedFormats = formatArgs.length > 0 
  ? formatArgs[0].replace('--format=', '').split(',').map(f => f.trim())
  : ['custom']; // Default to custom format only

// Validate format selection
const validFormats = ['custom', 'directory', 'sql', 'plain'];
// Map 'plain' to 'sql' for compatibility with backup.js
const normalizedFormats = selectedFormats.map(f => f === 'plain' ? 'sql' : f);
const invalidFormats = normalizedFormats.filter(f => !['custom', 'directory', 'sql'].includes(f));
if (invalidFormats.length > 0) {
  console.error(`❌ Invalid format(s): ${invalidFormats.join(', ')}`);
  console.error(`Valid formats: ${validFormats.join(', ')}`);
  process.exit(1);
}

console.log(`📋 Selected formats: ${normalizedFormats.join(', ')}`);

try {
  // Import database config to test connection
  console.log("📦 Testing database connection...");
  const { default: sequelize } = await import("../config/database.js");
  const testConnection = async () => {
    try {
      console.log('Testing database connection');
      await sequelize.authenticate();
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      return false;
    }
  };
  await testConnection();

  // Get database info
  const [dbInfo] = await sequelize.query(`
    SELECT current_database() as database_name, current_user as current_user
  `);
  console.log(`   📍 Database: ${dbInfo[0].database_name}`);
  console.log(`   👤 User: ${dbInfo[0].current_user}`);

  // Close sequelize connection
  await sequelize.close();

  // Find PostgreSQL installation path
  console.log('Locating PostgreSQL installation');
  const pgPath = await findPostgreSQLPath();
  if (!pgPath) {
    console.error("PostgreSQL installation not found");
    process.exit(1);
  }
  console.log('PostgreSQL installation found');

  // Find PostgreSQL bin path
  const { pgDumpPath, pgDumpExecutable } = await findPostgreSQLBinPath();
  console.log(`PostgreSQL bin path: ${pgDumpPath || 'Using PATH'}`);
  console.log(`pg_dump executable: ${pgDumpExecutable}`);

  // Test if pg_dump is available
  await testPgDumpAvailability(pgDumpPath, pgDumpExecutable);

  // Create backup directory structure
  const baseBackupDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(baseBackupDir)) {
    fs.mkdirSync(baseBackupDir, { recursive: true });
  }

  // Generate backup folder with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFolder = `pgdump_${timestamp}`;
  const backupPath = path.join(baseBackupDir, backupFolder);

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
    console.log(`Created backup folder: ${backupPath}`);
  }

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

    // Use full path to pg_dump executable if available
    const pgDumpCmd = pgDumpPath ? 
      path.join(pgDumpPath, pgDumpExecutable) : 
      pgDumpExecutable;
      
    console.log(`Using pg_dump command: ${pgDumpCmd}`);
    
    return `"${pgDumpCmd}" ${baseOptions} --format=${format} ${additionalOptions} --file="${outputFile}"`;
  }

  // Store created files for summary
  const createdFiles = [];

  // 1. Custom format backup (for pg_restore)
  if (normalizedFormats.includes('custom')) {
    console.log("   📦 Creating custom format backup...");
    const customBackupFile = path.join(backupPath, `${DB_CONFIG.database}.custom`);
    const customCmd = buildPgDumpCommand("custom", customBackupFile);

    console.log("Creating custom format backup");
    try {
      await execAsync(customCmd, { env });
      console.log("Custom format backup created successfully");
      
      // Verify the file was actually created
      if (fs.existsSync(customBackupFile)) {
        console.log(`✅ Custom backup file verified: ${customBackupFile}`);
        createdFiles.push({ name: `${DB_CONFIG.database}.custom`, type: "custom", path: customBackupFile });
      } else {
        throw new Error(`Custom backup file was not created: ${customBackupFile}`);
      }
    } catch (error) {
      console.error("Error creating custom format backup:", error);
      throw error; // Re-throw to fail the entire backup process
    }
  }

  // 2. Directory format backup (for pg_restore)
  if (normalizedFormats.includes('directory')) {
    console.log("   📁 Creating directory format backup...");
    const dirBackupPath = path.join(backupPath, `${DB_CONFIG.database}_dir`);
    const dirCmd = buildPgDumpCommand("directory", dirBackupPath);

    console.log("Creating directory format backup");
    try {
      await execAsync(dirCmd, { env });
      console.log("Directory format backup created successfully");
      
      // Verify the directory was actually created
      if (fs.existsSync(dirBackupPath)) {
        console.log(`✅ Directory backup verified: ${dirBackupPath}`);
        createdFiles.push({ name: `${DB_CONFIG.database}_dir/`, type: "directory", path: dirBackupPath });
      } else {
        throw new Error(`Directory backup was not created: ${dirBackupPath}`);
      }
    } catch (error) {
      console.error("Error creating directory format backup:", error);
      throw error; // Re-throw to fail the entire backup process
    }
  }

  // 3. Plain SQL backup (for psql)
  if (normalizedFormats.includes('sql')) {
    console.log("   📄 Creating plain SQL backup...");
    const sqlBackupFile = path.join(backupPath, `${DB_CONFIG.database}.sql`);
    // Use 'plain' format for pg_dump command
    const sqlCommand = buildPgDumpCommand("plain", sqlBackupFile, "--column-inserts");

    console.log("Creating plain SQL backup");
    try {
      await execAsync(sqlCommand, { env });
      console.log("Plain SQL backup created successfully");
      
      // Verify the file was actually created
      if (fs.existsSync(sqlBackupFile)) {
        console.log(`✅ SQL backup file verified: ${sqlBackupFile}`);
        createdFiles.push({ name: `${DB_CONFIG.database}.sql`, type: "sql", path: sqlBackupFile });
      } else {
        throw new Error(`SQL backup file was not created: ${sqlBackupFile}`);
      }
    } catch (error) {
      console.error("Error creating plain SQL backup:", error);
      throw error; // Re-throw to fail the entire backup process
    }
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
- **Selected Formats**: ${normalizedFormats.join(', ').toUpperCase()}

## Available Backup Formats

`;

  // Add instructions for each created format
  if (normalizedFormats.includes('custom') && fileStats.custom) {
    restoreInstructions += `### Custom Format (${DB_CONFIG.database}.custom)
**Best for**: pgAdmin Restore, pg_restore command
**Size**: ${(fileStats.custom.size / 1024 / 1024).toFixed(2)} MB

#### Using pgAdmin:
1. Right-click on your database → Restore
2. Select "${DB_CONFIG.database}.custom" file
3. Choose restore options and click Restore

#### Using pg_restore command:
\`\`\`bash
# Create new database first
createdb -U postgres new_inventory_db

# Restore from custom backup
pg_restore -U postgres -d new_inventory_db -v ${DB_CONFIG.database}.custom
\`\`\`

`;
  }

  if (normalizedFormats.includes('directory') && fileStats.directory) {
    restoreInstructions += `### Directory Format (${DB_CONFIG.database}_dir/)
**Best for**: Parallel restore, large databases
**Size**: ${(fileStats.directory.size / 1024 / 1024).toFixed(2)} MB

#### Using pg_restore command:
\`\`\`bash
# Create new database first
createdb -U postgres new_inventory_db

# Restore from directory backup (parallel jobs)
pg_restore -U postgres -d new_inventory_db -v -j 4 ${DB_CONFIG.database}_dir/
\`\`\`

`;
  }

  if (normalizedFormats.includes('sql') && fileStats.sql) {
    restoreInstructions += `### Plain SQL Format (${DB_CONFIG.database}.sql)
**Best for**: Cross-platform compatibility, manual editing
**Size**: ${(fileStats.sql.size / 1024 / 1024).toFixed(2)} MB

#### Using psql command:
\`\`\`bash
# The SQL file contains CREATE DATABASE, so just run:
psql -U postgres -f ${DB_CONFIG.database}.sql
\`\`\`

#### Using pgAdmin Query Tool:
1. Open pgAdmin Query Tool
2. Open ${DB_CONFIG.database}.sql file
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

  const instructionsFile = path.join(backupPath, "RESTORE.md");
  fs.writeFileSync(instructionsFile, restoreInstructions);

  console.log("\n🎉 pg_dump backup completed successfully!");
  console.log("==========================================");
  console.log(`📁 Backup folder: ${backupPath}`);
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
  console.log(`✅ Selected backup format${normalizedFormats.length !== 1 ? 's' : ''} created successfully!`);
  
  // Show usage instructions based on created formats
  const usageInstructions = [];
  if (normalizedFormats.includes('custom') || normalizedFormats.includes('directory')) {
    usageInstructions.push('Use backup.custom or backup_directory with pgAdmin Restore');
  }
  if (normalizedFormats.includes('sql')) {
    usageInstructions.push('Use backup.sql with psql or pgAdmin Query Tool');
  }
  
  usageInstructions.forEach(instruction => {
    console.log(`   ${instruction}`);
  });
  
  console.log("");
  console.log(`📝 Usage: node pgDumpFixed.js --format=${normalizedFormats.join(',')}`);
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
