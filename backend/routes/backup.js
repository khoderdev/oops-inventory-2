import archiver from "archiver";
import { exec } from "child_process";
import express from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import sequelize from "../config/database.js";
import { findPostgreSQLPath } from "../scripts/pgPathFinder.js";
import { promisify } from "node:util";
import { exec as execCallback, execSync } from "node:child_process";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define backup directory path
const BACKUP_DIR = path.join(__dirname, "..", "backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Initialize PostgreSQL bin path and executable extension
let PG_BIN_PATH = "";
let PG_EXECUTABLE_EXT = os.platform() === "win32" ? ".exe" : "";

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit
  }
});

// Helper function to find PostgreSQL bin path using the advanced path finder
async function findPostgreSQLBinPath() {
  try {
    // Check if we have a saved configuration
    const configPath = path.join(__dirname, "..", "config", "pgPath.json");
    let pgInfo;

    if (fs.existsSync(configPath)) {
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
        console.log("📋 Using saved PostgreSQL configuration");

        // Verify the saved path still works
        if (configData.inPath || (configData.binPath && fs.existsSync(configData.binPath))) {
          pgInfo = configData;
        } else {
          console.log("⚠️ Saved PostgreSQL path is no longer valid, detecting again...");
          pgInfo = await findPostgreSQLPath();
        }
      } catch (error) {
        console.log(`⚠️ Error reading saved configuration: ${error.message}`);
        pgInfo = await findPostgreSQLPath();
      }
    } else {
      // No saved configuration, detect PostgreSQL
      console.log("🔍 Detecting PostgreSQL installation...");
      pgInfo = await findPostgreSQLPath();
    }

    const platform = os.platform();
    const executableExtension = platform === "win32" ? ".exe" : "";

    return {
      pgDumpPath: pgInfo.binPath,
      executableExtension: executableExtension
    };
  } catch (error) {
    console.error(`❌ Error finding PostgreSQL: ${error.message}`);
    // Fallback to default behavior
    const platform = os.platform();
    return {
      pgDumpPath: "",
      executableExtension: platform === "win32" ? ".exe" : ""
    };
  }
}

// Helper function to execute shell commands with larger buffer
const execAsync = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    // Increase max buffer size to handle large outputs
    const execOptions = {
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      ...options
    };

    exec(command, execOptions, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

// Helper function to get database info
const getDatabaseStats = async () => {
  try {
    // Get basic database info
    const [dbResult] = await sequelize.query(`
      SELECT 
        current_database() as database_name,
        version() as version,
        pg_database_size(current_database()) as size_bytes
    `);

    let tables = 0;
    let totalRecords = 0;

    try {
      // Get table count
      const [tablesResult] = await sequelize.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      tables = parseInt(tablesResult[0].table_count) || 0;
    } catch (tableError) {
      console.warn("Could not get table count:", tableError.message);
    }

    try {
      // Get record statistics - try multiple approaches for compatibility
      let recordsResult;
      try {
        // Try with relname first (more common)
        [recordsResult] = await sequelize.query(`
          SELECT 
            schemaname,
            relname as tablename,
            COALESCE(n_tup_ins, 0) + COALESCE(n_tup_upd, 0) + COALESCE(n_tup_del, 0) as total_records
          FROM pg_stat_user_tables
        `);
      } catch (relnameError) {
        // Fallback to tablename if relname doesn't work
        [recordsResult] = await sequelize.query(`
          SELECT 
            schemaname,
            tablename,
            COALESCE(n_tup_ins, 0) + COALESCE(n_tup_upd, 0) + COALESCE(n_tup_del, 0) as total_records
          FROM pg_stat_user_tables
        `);
      }
      totalRecords = recordsResult.reduce((sum, table) => sum + parseInt(table.total_records || 0), 0);
    } catch (recordsError) {
      console.warn("Could not get record statistics:", recordsError.message);
    }

    return {
      name: dbResult[0].database_name,
      version: dbResult[0].version.split(" ")[1] || "Unknown", // Extract version number
      size: parseInt(dbResult[0].size_bytes) || 0,
      tables: tables,
      records: totalRecords
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    // Return fallback values instead of throwing
    return {
      name: "Unknown",
      version: "Unknown",
      size: 0,
      tables: 0,
      records: 0
    };
  }
};

// Helper function to get backup metadata
const getBackupMetadata = async (backupPath, type) => {
  try {
    const stats = await fsPromises.stat(backupPath);
    const dbStats = await getDatabaseStats();

    return {
      size: stats.size,
      createdAt: stats.birthtime.toISOString(),
      metadata: {
        database: dbStats.name,
        version: dbStats.version,
        tables: dbStats.tables,
        records: dbStats.records
      }
    };
  } catch (error) {
    return {
      size: 0,
      createdAt: new Date().toISOString(),
      metadata: null
    };
  }
};

// Helper function to run backup script
const runBackupScript = async (format = "custom") => {
  try {
    // Map 'sql' to 'plain' for pg_dump compatibility
    const pgDumpFormat = format === "sql" ? "sql" : format;

    const scriptPath = path.join(__dirname, "..", "scripts", "pgDumpFixed.js");
    console.log(`Running backup with format: ${pgDumpFormat}`);
    const result = await execAsync(`node "${scriptPath}" --format=${pgDumpFormat}`, {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env }
    });
    return result;
  } catch (error) {
    console.error("Backup script error:", error);
    throw error;
  }
};

// Get database information
router.get("/database-info", async (req, res) => {
  try {
    const dbInfo = await getDatabaseStats();

    // Get last backup info
    try {
      const backupDirs = await fs.promises.readdir(BACKUP_DIR);
      const pgdumpDirs = backupDirs
        .filter(dir => dir.startsWith("pgdump_"))
        .sort()
        .reverse();

      if (pgdumpDirs.length > 0) {
        const lastBackupDir = path.join(BACKUP_DIR, pgdumpDirs[0]);
        const stats = await fs.promises.stat(lastBackupDir);
        dbInfo.lastBackup = stats.birthtime.toISOString();
      }
    } catch (error) {
      // No backups found, that's okay
    }

    res.json({
      success: true,
      data: dbInfo
    });
  } catch (error) {
    console.error("Error getting database info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get database information",
      error: error.message
    });
  }
});

// Initialize PostgreSQL paths before handling requests
async function initPostgreSQLPaths() {
  try {
    const { pgDumpPath, executableExtension } = await findPostgreSQLBinPath();
    PG_BIN_PATH = pgDumpPath;
    PG_EXECUTABLE_EXT = executableExtension;
    console.log(`🔍 PostgreSQL bin path initialized: ${PG_BIN_PATH || "Using PATH"}`);
    return true;
  } catch (error) {
    console.error(`❌ Error initializing PostgreSQL paths: ${error.message}`);
    return false;
  }
}

// Initialize paths on server startup
initPostgreSQLPaths();

// Create a new backup
router.post("/create", async (req, res) => {
  try {
    // Extract format from the formats array if provided, otherwise default to custom
    const { name, formats, includeData = true, includeSchema = true } = req.body;
    const type = formats && formats.length > 0 ? formats[0] : "custom";

    console.log(`Creating backup with name: ${name}, format: ${type}`);

    // Generate backup name if not provided
    const backupName = name || `backup_${new Date().toISOString().replace(/[:.]/g, "-")}`;

    // Run the backup script with the specified format
    const result = await runBackupScript(type);

    // Find the created backup directory
    const backupDirs = await fsPromises.readdir(BACKUP_DIR);
    const latestBackup = backupDirs
      .filter(dir => dir.startsWith("pgdump_"))
      .sort()
      .reverse()[0];

    if (!latestBackup) {
      throw new Error("Backup was created but directory not found");
    }

    const backupDir = path.join(BACKUP_DIR, latestBackup);
    const backupFiles = await fs.promises.readdir(backupDir);

    // Determine the main backup file based on type
    let mainFile;
    switch (type) {
      case "custom":
        mainFile = backupFiles.find(f => f.endsWith(".custom"));
        break;
      case "directory":
        mainFile = backupFiles.find(f => f === "backup_directory");
        break;
      case "sql":
        mainFile = backupFiles.find(f => f.endsWith(".sql"));
        break;
      default:
        mainFile = backupFiles.find(f => f.endsWith(".custom"));
    }

    if (!mainFile) {
      throw new Error(`No ${type} backup file found`);
    }

    const backupPath = path.join(backupDir, mainFile);
    const metadata = await getBackupMetadata(backupPath, type);

    // Create a backup ID that includes the format
    const backupId = `${latestBackup}_${type}`;

    const backupInfo = {
      id: backupId,
      name: backupName,
      type,
      path: backupPath,
      size: metadata.size,
      createdAt: metadata.createdAt,
      metadata: metadata.metadata
    };

    res.json({
      success: true,
      data: {
        backup: backupInfo,
        message: "Backup created successfully"
      }
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create backup",
      error: error.message
    });
  }
});

// Get backup progress (placeholder for real-time updates)
router.get("/progress/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;

    // For now, return completed status
    // In a real implementation, you'd track progress in a database or cache
    res.json({
      success: true,
      data: {
        status: "completed",
        progress: 100,
        message: "Backup completed successfully",
        currentStep: "Finished"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get backup progress",
      error: error.message
    });
  }
});

// List all backups
router.get("/list", async (req, res) => {
  try {
    const backupDirs = await fsPromises.readdir(BACKUP_DIR);
    // Include manual backups (pgdump_), scheduled backups (scheduled_), and uploaded backups (uploaded_)
    const allBackupDirs = backupDirs.filter(dir => dir.startsWith("pgdump_") || dir.startsWith("scheduled_") || dir.startsWith("uploaded_"));

    const backups = [];

    for (const dirName of allBackupDirs) {
      const backupDir = path.join(BACKUP_DIR, dirName);
      const backupFiles = await fsPromises.readdir(backupDir);

      // Check for different backup types
      const customFile = backupFiles.find(f => f.endsWith(".custom"));
      const sqlFile = backupFiles.find(f => f.endsWith(".sql"));
      const dirFile = backupFiles.find(f => f === "backup_directory");

      // Create a single backup entry with multiple formats
      const availableFormats = [];
      let primaryMetadata = null;
      let totalSize = 0;
      let createdAt = null;

      if (customFile) {
        const filePath = path.join(backupDir, customFile);
        const metadata = await getBackupMetadata(filePath, "custom");
        availableFormats.push({
          type: "custom",
          id: `${dirName}_custom`,
          path: filePath,
          size: metadata.size,
          filename: customFile
        });
        totalSize += metadata.size;
        if (!primaryMetadata) {
          primaryMetadata = metadata.metadata;
          createdAt = metadata.createdAt;
        }
      }

      if (sqlFile) {
        const filePath = path.join(backupDir, sqlFile);
        const metadata = await getBackupMetadata(filePath, "sql");
        availableFormats.push({
          type: "sql",
          id: `${dirName}_sql`,
          path: filePath,
          size: metadata.size,
          filename: sqlFile
        });
        totalSize += metadata.size;
        if (!primaryMetadata) {
          primaryMetadata = metadata.metadata;
          createdAt = metadata.createdAt;
        }
      }

      if (dirFile) {
        const dirPath = path.join(backupDir, dirFile);
        const metadata = await getBackupMetadata(dirPath, "directory");
        availableFormats.push({
          type: "directory",
          id: `${dirName}_directory`,
          path: dirPath,
          size: metadata.size,
          filename: "backup_directory"
        });
        totalSize += metadata.size;
        if (!primaryMetadata) {
          primaryMetadata = metadata.metadata;
          createdAt = metadata.createdAt;
        }
      }

      // Only add backup if at least one format is available
      if (availableFormats.length > 0) {
        backups.push({
          id: dirName,
          name: dirName,
          formats: availableFormats,
          totalSize: totalSize,
          createdAt: createdAt,
          metadata: primaryMetadata
        });
      }
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        backups,
        total: backups.length
      }
    });
  } catch (error) {
    console.error("Error listing backups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list backups",
      error: error.message
    });
  }
});

// Delete a backup
router.delete("/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;

    // Extract the directory name from the backup ID
    // Handle both format-specific IDs (pgdump_2025-07-30_4-23-AM_custom) and directory IDs (pgdump_2025-07-30_4-23-AM)
    let dirName;
    if (backupId.endsWith("_custom") || backupId.endsWith("_sql") || backupId.endsWith("_directory")) {
      // Format-specific ID - remove the format suffix
      dirName = backupId.split("_").slice(0, -1).join("_");
    } else {
      // Directory ID - use as is
      dirName = backupId;
    }
    const backupDir = path.join(BACKUP_DIR, dirName);

    // Check if backup directory exists
    try {
      await fsPromises.access(backupDir);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Backup not found"
      });
    }

    // Remove the entire backup directory
    await fsPromises.rm(backupDir, { recursive: true, force: true });

    res.json({
      success: true,
      message: "Backup deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete backup",
      error: error.message
    });
  }
});

// Validate a backup
router.get("/validate/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;

    console.log(`🔍 Validating backup: ${backupId}`);

    // Parse backup ID to get directory and type
    const parts = backupId.split("_");
    const type = parts[parts.length - 1];

    // The directory name is the full backup ID without the type suffix
    const dirName = backupId.substring(0, backupId.length - type.length - 1);

    const backupDir = path.join(BACKUP_DIR, dirName);

    // Check if backup directory exists
    try {
      await fsPromises.access(backupDir);
    } catch (error) {
      console.error(`❌ Backup directory not found: ${backupDir}`);
      return res.status(404).json({
        success: false,
        message: "Backup not found",
        error: "Directory not found"
      });
    }

    // Check for backup files
    const files = await fsPromises.readdir(backupDir);
    console.log(`📄 Found files in backup directory:`, files);

    let mainFile;
    let issues = [];

    switch (type) {
      case "custom":
        mainFile = files.find(f => f.endsWith(".custom"));
        if (!mainFile) issues.push("Custom backup file not found");
        break;
      case "sql":
        mainFile = files.find(f => f.endsWith(".sql"));
        if (!mainFile) issues.push("SQL backup file not found");
        break;
      case "directory":
        mainFile = files.find(f => f === "backup_directory");
        if (!mainFile) issues.push("Directory backup not found");
        break;
      default:
        issues.push(`Unknown backup type: ${type}`);
    }

    if (issues.length > 0) {
      console.error(`❌ Validation failed:`, issues);
      return res.status(400).json({
        success: false,
        data: { valid: false, issues, metadata: {} }
      });
    }

    const backupPath = path.join(backupDir, mainFile);
    const metadata = await getBackupMetadata(backupPath, type);

    console.log(`✅ Backup validated successfully`);
    res.json({
      success: true,
      data: { valid: true, issues: [], metadata: metadata.metadata }
    });
  } catch (error) {
    console.error(`❌ Error validating backup:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to validate backup",
      error: error.message
    });
  }
});

// Download a backup
router.get("/download/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;

    // Parse backup ID to get directory and type
    const parts = backupId.split("_");
    const type = parts[parts.length - 1];

    // The directory name is the full backup ID without the type suffix
    // For example: pgdump_2025-08-20_5-41-51-AM
    const dirName = backupId.substring(0, backupId.length - type.length - 1);

    console.log(`📥 Downloading backup: ${backupId}, type: ${type}, dirName: ${dirName}`);

    const backupDir = path.join(BACKUP_DIR, dirName);

    let filePath;
    let fileName;

    // Log directory contents to help diagnose issues
    console.log(`📂 Checking backup directory: ${backupDir}`);
    try {
      const allFiles = await fsPromises.readdir(backupDir);
      console.log(`📄 Available files in backup directory:`, allFiles);
    } catch (dirError) {
      console.error(`❌ Error reading backup directory: ${dirError.message}`);
    }

    switch (type) {
      case "custom":
        console.log(`🔍 Looking for custom format backup file`);
        const customFiles = await fsPromises.readdir(backupDir);
        const customFile = customFiles.find(f => f.endsWith(".custom"));
        if (!customFile) throw new Error("Custom backup file not found");
        filePath = path.join(backupDir, customFile);
        fileName = `${dirName}.custom`;
        console.log(`✅ Found custom backup file: ${customFile}`);
        break;

      case "sql":
        console.log(`🔍 Looking for SQL format backup file`);
        const sqlFiles = await fsPromises.readdir(backupDir);
        console.log(`📄 SQL search - Found files:`, sqlFiles);
        const sqlFile = sqlFiles.find(f => f.endsWith(".sql"));
        if (!sqlFile) {
          console.error(`❌ SQL backup file not found in directory`);
          throw new Error("SQL backup file not found");
        }
        filePath = path.join(backupDir, sqlFile);
        fileName = `${dirName}.sql`;
        console.log(`✅ Found SQL backup file: ${sqlFile}`);
        break;

      case "directory":
        // For directory backups, create a ZIP file on-the-fly
        fileName = `${dirName}.zip`;

        // Set headers for ZIP download
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/zip");

        // Create archive and pipe to response
        const archive = archiver("zip", {
          zlib: { level: 9 } // Maximum compression
        });

        // Handle archive errors
        archive.on("error", err => {
          console.error("Archive error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Failed to create archive",
              error: err.message
            });
          }
        });

        // Pipe archive to response
        archive.pipe(res);

        // Add the entire backup directory to the archive
        archive.directory(backupDir, false);

        // Finalize the archive
        await archive.finalize();
        return; // Exit early since we've handled the response

      default:
        throw new Error("Invalid backup type");
    }

    // Check if file exists
    await fsPromises.access(filePath);

    // Set appropriate headers
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Stream the file
    const fileStream = await fsPromises.readFile(filePath);
    res.send(fileStream);
  } catch (error) {
    console.error("Error downloading backup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download backup",
      error: error.message
    });
  }
});

// Restore from backup
router.post("/restore/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;
    const { targetDatabase, dropExisting = false, restoreData = true, restoreSchema = true } = req.body;

    // Parse backup ID to get directory and type
    const parts = backupId.split("_");
    const type = parts[parts.length - 1];
    const dirName = parts.slice(0, -1).join("_");

    const backupDir = path.join(BACKUP_DIR, dirName);

    let restoreCommand;
    let filePath;
    let tempFilePath = null;

    const pgRestorePath = PG_BIN_PATH ? path.join(PG_BIN_PATH, `pg_restore${PG_EXECUTABLE_EXT}`) : `pg_restore${PG_EXECUTABLE_EXT}`;
    const psqlPath = PG_BIN_PATH ? path.join(PG_BIN_PATH, `psql${PG_EXECUTABLE_EXT}`) : `psql${PG_EXECUTABLE_EXT}`;

    const dbConfig = {
      host: sequelize.config.host,
      port: sequelize.config.port,
      username: sequelize.config.username,
      password: sequelize.config.password,
      database: targetDatabase || sequelize.config.database
    };

    console.log(`🔄 Restoring to database: ${dbConfig.database}`);
    console.log(`🛠️  Using PostgreSQL tools from: ${PG_BIN_PATH || "PATH"}`);
    console.log(`📋 Request body:`, { targetDatabase, dropExisting, restoreData, restoreSchema });

    switch (type) {
      case "custom":
        const customFiles = await fs.readdir(backupDir);
        const customFile = customFiles.find(f => f.endsWith(".custom"));
        if (!customFile) throw new Error("Custom backup file not found");
        filePath = path.join(backupDir, customFile);

        restoreCommand = `"${pgRestorePath}" --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --verbose`;
        if (dropExisting) restoreCommand += " --clean";
        if (!restoreData) restoreCommand += " --schema-only";
        if (!restoreSchema) restoreCommand += " --data-only";
        restoreCommand += ` "${filePath}"`;
        break;

      case "sql":
        // Log directory scanning and file selection
        const sqlFiles = await fsPromises.readdir(backupDir);
        console.log(`📂 Found ${sqlFiles.length} files in backup directory: ${backupDir}`);
        console.log(`📜 Files: ${sqlFiles.join(", ")}`);

        const sqlFile = sqlFiles.find(f => f.endsWith(".sql"));
        if (!sqlFile) {
          console.error(`❌ Error: No SQL backup file found in ${backupDir}`);
          throw new Error("SQL backup file not found");
        }
        console.log(`✅ Selected SQL file: ${sqlFile}`);
        filePath = path.join(backupDir, sqlFile);

        // Read and log SQL file content
        let sqlContent = await fsPromises.readFile(filePath, "utf8");
        console.log(`📄 Read SQL file: ${filePath}, size: ${sqlContent.length} bytes`);
        let hasDbCommands = sqlContent.includes("DROP DATABASE") || sqlContent.includes("CREATE DATABASE");
        console.log(`🔍 Database commands detected: ${hasDbCommands ? "Yes (DROP/CREATE DATABASE)" : "No"}`);

        // Log content around line 28 in original file
        let lines = sqlContent.split("\n");
        let contextStart = Math.max(0, 25); // Show lines 26-35
        let contextEnd = Math.min(lines.length, 35);
        console.log(`🔍 Content around line 28 in ${sqlFile} (lines ${contextStart + 1}-${contextEnd}):`);
        for (let i = contextStart; i < contextEnd; i++) {
          console.log(`  Line ${i + 1}: ${lines[i].slice(0, 100)}${lines[i].length > 100 ? "..." : ""}`);
        }

        // Log DO block processing
        console.log(`🛠️ Processing DO blocks in SQL content...`);
        let doBlockCount = 0;
        let doBlocks = [];
        // Find all DO blocks with their line numbers
        let lineNumber = 0;
        let currentBlock = "";
        let inBlock = false;
        let blockStartLine = 0;
        lines = sqlContent.split("\n");
        for (let i = 0; i < lines.length; i++) {
          lineNumber++;
          const line = lines[i];
          if (line.match(/^\s*DO\s+\$[^\$]*\$\s*$/i)) {
            inBlock = true;
            blockStartLine = lineNumber;
            currentBlock = line + "\n";
            continue;
          }
          if (inBlock) {
            currentBlock += line + "\n";
            if (line.match(/\$\s*(?:LANGUAGE\s+plpgsql\s*;)?$/i) || line.match(/\$\s*$/)) {
              inBlock = false;
              doBlocks.push({ block: currentBlock.trim(), startLine: blockStartLine });
              doBlockCount++;
              currentBlock = "";
            }
          }
        }
        if (inBlock) {
          // Handle unterminated block
          doBlocks.push({ block: currentBlock.trim(), startLine: blockStartLine });
          doBlockCount++;
        }
        console.log(`🔢 Found ${doBlockCount} potential DO blocks to process`);
        if (doBlockCount > 0) {
          console.log(`📜 DO blocks found:`);
          doBlocks.forEach((block, index) => {
            console.log(`  Block ${index + 1} (starting at line ${block.startLine}): ${block.block.slice(0, 50)}...`);
          });
        }

        // Fix DO blocks
        sqlContent = sqlContent.replace(/DO\s+\$[^\$]*\$([\s\S]*?)(?=\$[^\$]*\$|$)/gi, (match, block, offset) => {
          const blockStartLine = sqlContent.slice(0, offset).split("\n").length;
          console.log(`🔧 Processing DO block at line ${blockStartLine}: ${match.slice(0, 50)}...`);
          let cleanedBlock = block.trim();

          // Remove any existing END statements at the end
          cleanedBlock = cleanedBlock.replace(/\s*END\s*\$\$\s*LANGUAGE\s+\w+\s*;?\s*$/i, "");
          console.log(`🧹 Cleaned block (removed END): ${cleanedBlock.slice(0, 50)}...`);

          // Ensure the block starts with BEGIN if it doesn't already
          if (!cleanedBlock.trim().toUpperCase().startsWith("BEGIN") && !cleanedBlock.trim().toUpperCase().startsWith("DECLARE")) {
            console.log(`➕ Adding BEGIN/END to block`);
            cleanedBlock = `BEGIN\n${cleanedBlock}\nEND`;
          }

          // Add the language specifier
          const blockWithoutLang = cleanedBlock.replace(/\s*LANGUAGE\s+[a-zA-Z_]+\s*;?\s*$/, "").trim();
          return `DO $$\n${blockWithoutLang}\n$$ LANGUAGE plpgsql;\n`;
        });

        // Clean up malformed DO blocks
        console.log(`🧹 Cleaning up malformed DO blocks...`);
        let malformedBlockCount = 0;
        sqlContent = sqlContent.replace(/DO\s+\$[^\$]*\$[^\$]*\$\s*(?:LANGUAGE\s+plpgsql\s*;)?/gi, (match, offset) => {
          const blockStartLine = sqlContent.slice(0, offset).split("\n").length;
          const blockMatch = match.match(/DO\s+\$[^\$]*\$([^$]*)\$\s*(?:LANGUAGE\s+plpgsql\s*;)?/is);
          if (blockMatch && blockMatch[1]) {
            const blockContent = blockMatch[1].trim();
            console.log(`⚠️ Processing potential malformed DO block at line ${blockStartLine}: ${blockContent.slice(0, 50)}...`);
            if (!/^\s*(BEGIN|DECLARE)\b/i.test(blockContent)) {
              malformedBlockCount++;
              console.log(`🔧 Fixing malformed block by adding BEGIN/END`);
              return `DO $$\nBEGIN\n${blockContent}\nEND\n$$ LANGUAGE plpgsql;`;
            }
            console.log(`✅ Valid DO block, no changes needed`);
            return match;
          }
          malformedBlockCount++;
          console.log(`🗑️ Commenting out malformed DO block at line ${blockStartLine}: ${match.slice(0, 50)}...`);
          return `-- Skipped malformed DO block at line ${blockStartLine}: ${match.replace(/\n/g, " ").slice(0, 100)}...`;
        });
        console.log(`🔢 Processed ${malformedBlockCount} malformed DO blocks`);

        // Validate SQL content
        console.log(`🔍 Validating SQL content for potential syntax errors...`);
        const potentialIssues = (sqlContent.match(/DO\s+\$[^\$]*\$/gi) || []).filter(block => !block.includes("$$ LANGUAGE plpgsql"));
        if (potentialIssues.length > 0) {
          console.warn(`⚠️ Found ${potentialIssues.length} potentially malformed DO blocks without proper termination:`);
          potentialIssues.forEach((block, index) => {
            console.warn(`  Issue ${index + 1}: ${block.slice(0, 50)}...`);
          });
        } else {
          console.log(`✅ No obvious syntax issues detected in DO blocks`);
        }

        // Write the modified content to a temporary file
        const tempSqlFile = path.join(backupDir, "temp_restore.sql");
        await fsPromises.writeFile(tempSqlFile, sqlContent);
        console.log(`💾 Wrote modified SQL content to temporary file: ${tempSqlFile}`);
        filePath = tempSqlFile;

        if (hasDbCommands) {
          tempFilePath = path.join(backupDir, `temp_${sqlFile}`);
          console.log(`📝 Creating temporary file for database commands: ${tempFilePath}`);

          const dbNameMatch = sqlContent.match(/(?:DROP DATABASE IF EXISTS|CREATE DATABASE)\s+(\w+)/i);
          const originalDbName = dbNameMatch ? dbNameMatch[1] : null;
          console.log(`🔍 Original database name: ${originalDbName || "Not found"}`);
          console.log(`🎯 Target database name: ${dbConfig.database}`);

          let modifiedContent = sqlContent;

          if (originalDbName && originalDbName !== dbConfig.database) {
            console.log(`🔄 Replacing database name '${originalDbName}' with '${dbConfig.database}'`);
            modifiedContent = sqlContent
              .replace(new RegExp(`DROP DATABASE IF EXISTS ${originalDbName}`, "gi"), `DROP DATABASE IF EXISTS ${dbConfig.database}`)
              .replace(new RegExp(`CREATE DATABASE ${originalDbName}`, "gi"), `CREATE DATABASE ${dbConfig.database}`)
              .replace(new RegExp(`\\\\connect ${originalDbName}`, "gi"), `\\connect ${dbConfig.database}`);
            console.log(`🔍 Connect command replaced: ${modifiedContent.includes(`\\connect ${dbConfig.database}`) ? "Success" : "Not found"}`);
          }

          console.log(`🔧 Adding enhanced connection termination script`);
          const enhancedConnectionTermination = `
              -- Enhanced connection termination with error handling
              DO $$
              DECLARE
                r RECORD;
                terminated_count INTEGER := 0;
              BEGIN
                RAISE NOTICE 'Attempting to terminate connections to database: ${dbConfig.database}';
                FOR r IN SELECT pid FROM pg_stat_activity WHERE datname = '${dbConfig.database}' AND pid <> pg_backend_pid()
                LOOP
                  BEGIN
                    PERFORM pg_terminate_backend(r.pid);
                    terminated_count := terminated_count + 1;
                    RAISE NOTICE 'Terminated connection: %', r.pid;
                  EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to terminate connection: %, Error: %', r.pid, SQLERRM;
                  END;
                END LOOP;
                
                IF terminated_count > 0 THEN
                  PERFORM pg_sleep(1);
                END IF;
                
                FOR r IN SELECT pid FROM pg_stat_activity WHERE datname = '${dbConfig.database}' AND pid <> pg_backend_pid()
                LOOP
                  BEGIN
                    PERFORM pg_terminate_backend(r.pid);
                    RAISE NOTICE 'Force terminated connection: %', r.pid;
                  EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to force terminate connection: %, Error: %', r.pid, SQLERRM;
                  END;
                END LOOP;
                
                RAISE NOTICE 'Connection termination completed for database: ${dbConfig.database}';
              END $$;
            `;

          console.log(`🔄 Adding connection termination before DROP DATABASE`);
          const dropDbPattern = new RegExp(`(DROP DATABASE IF EXISTS ${dbConfig.database})`, "gi");
          modifiedContent = modifiedContent.replace(dropDbPattern, `${enhancedConnectionTermination}\n\n$1`);

          if (dropExisting) {
            console.log(`🔧 Complete database replacement mode enabled (dropExisting: true)`);
          } else {
            console.log(`⚠️ Preserving existing database (dropExisting: false)`);
            console.log(`⚠️ Removing DROP/CREATE DATABASE commands to avoid conflicts`);
            modifiedContent = modifiedContent.replace(new RegExp(`${enhancedConnectionTermination}`, "g"), "-- Database preservation mode: Connection termination removed");
            modifiedContent = modifiedContent.replace(/DROP DATABASE IF EXISTS [^;]+;/gi, "-- Database preservation mode: DROP DATABASE command removed");
            modifiedContent = modifiedContent.replace(/CREATE DATABASE [^;]+;/gi, "-- Database preservation mode: CREATE DATABASE command removed");
            modifiedContent = modifiedContent.replace(/\\connect [^;\n]+/gi, "-- Database preservation mode: connect command removed");
            console.log(`🔄 Added IF NOT EXISTS to CREATE EXTENSION statements`);
            modifiedContent = modifiedContent.replace(/CREATE EXTENSION ([^\s;]+)/g, "CREATE EXTENSION IF NOT EXISTS $1");
            console.log(`🔄 Added foreign key constraint handling for partial restore`);
            modifiedContent = `-- Foreign key constraint handling for partial restore\nSET session_replication_role = replica; -- Disable FK checks temporarily\n${modifiedContent}\nSET session_replication_role = DEFAULT; -- Re-enable FK checks\n`;
          }

          console.log(`🛠️ Preprocessing SQL content for DO blocks and transaction handling`);
          let doBlockPreprocessCount = 0;
          modifiedContent = modifiedContent
            .replace(/DO\s*\$\$([^$]*)\$$\s*LANGUAGE\s+plpgsql\s*;/gi, (match, content, offset) => {
              const blockStartLine = modifiedContent.slice(0, offset).split("\n").length;
              doBlockPreprocessCount++;
              if (!content.trim().toUpperCase().includes("BEGIN")) {
                console.log(`🔧 Adding BEGIN/END to DO block at line ${blockStartLine}: ${content.slice(0, 50)}...`);
                return `DO $$\nBEGIN\n${content.trim()}\nEND\n$$ LANGUAGE plpgsql;`;
              }
              console.log(`✅ Valid DO block at line ${blockStartLine}: ${content.slice(0, 50)}...`);
              return match;
            })
            .replace(/DO\s*\$\$[^$]*\$$\s*(?:LANGUAGE\s+plpgsql\s*;)?/gi, (match, offset) => {
              const blockStartLine = modifiedContent.slice(0, offset).split("\n").length;
              console.log(`🗑️ Commenting out problematic DO block at line ${blockStartLine}: ${match.slice(0, 50)}...`);
              return `-- Skipped problematic DO block at line ${blockStartLine}: ${match.replace(/\n/g, " ").slice(0, 100)}...`;
            })
            .replace(/^/m, "BEGIN;\n")
            .replace(/$/m, "\nCOMMIT;");

          // Log content around line 28 in temp file
          lines = modifiedContent.split("\n");
          contextStart = Math.max(0, 25);
          contextEnd = Math.min(lines.length, 35);
          console.log(`🔍 Content around line 28 in ${tempFilePath} (lines ${contextStart + 1}-${contextEnd}):`);
          for (let i = contextStart; i < contextEnd; i++) {
            console.log(`  Line ${i + 1}: ${lines[i].slice(0, 100)}${lines[i].length > 100 ? "..." : ""}`);
          }

          await fsPromises.writeFile(tempFilePath, modifiedContent);
          console.log(`💾 Wrote modified SQL content to: ${tempFilePath}`);
          filePath = tempFilePath;

          if (dropExisting) {
            console.log(`🔄 Restore mode: Connecting to postgres database for full restore`);
            restoreCommand = `"${psqlPath}" --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=postgres --set ON_ERROR_STOP=on --set VERBOSE=on --file="${filePath}"`;
          } else {
            console.log(`🔄 Restore mode: Connecting to target database ${dbConfig.database} with error reporting`);
            restoreCommand = `"${psqlPath}" --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --echo-errors --set VERBOSE=on --file="${filePath}"`;
          }
          console.log(`📜 Restore command: ${restoreCommand}`);
        } else {
          console.log(`🔍 No database-level commands detected, restoring to target database ${dbConfig.database}`);
          if (!dropExisting) {
            console.log(`⚠️ Schema-only restore mode (dropExisting: false)`);
            tempFilePath = path.join(backupDir, `temp_${sqlFile}`);
            let modifiedContent = sqlContent;

            console.log(`🔄 Adding foreign key constraint handling for schema-only restore`);
            modifiedContent = `-- Foreign key constraint handling for schema-only restore\nSET session_replication_role = replica; -- Disable FK checks temporarily\n${modifiedContent}\nSET session_replication_role = DEFAULT; -- Re-enable FK checks\n`;

            console.log(`🔄 Adding IF NOT EXISTS to CREATE EXTENSION statements`);
            modifiedContent = modifiedContent.replace(/CREATE EXTENSION ([^\s;]+)/g, "CREATE EXTENSION IF NOT EXISTS $1");

            await fsPromises.writeFile(tempFilePath, modifiedContent);
            console.log(`💾 Wrote modified schema-only content to: ${tempFilePath}`);
            filePath = tempFilePath;
          }

          if (dropExisting) {
            console.log(`🔄 Restore mode: Full restore to ${dbConfig.database} with error stopping`);
            restoreCommand = `"${psqlPath}" --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --set ON_ERROR_STOP=on --set VERBOSE=on --file="${filePath}"`;
          } else {
            console.log(`🔄 Restore mode: Schema-only restore to ${dbConfig.database} with error reporting`);
            restoreCommand = `"${psqlPath}" --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --echo-errors --set VERBOSE=on --file="${filePath}"`;
          }
          console.log(`📜 Restore command: ${restoreCommand}`);
        }

        // Execute restore command and capture output
        console.log(`⚡ Executing restore command: ${restoreCommand}`);
        try {
          const execPromise = promisify(execCallback);
          const { stdout, stderr } = await execPromise(restoreCommand, { env: { ...process.env, PGPASSWORD: dbConfig.password } });
          console.log(`✅ Restore command executed successfully`);
          console.log(`📜 psql stdout: ${stdout.slice(0, 500)}${stdout.length > 500 ? "..." : ""}`);
          if (stderr) {
            console.warn(`⚠️ psql stderr: ${stderr.slice(0, 500)}${stderr.length > 500 ? "..." : ""}`);
          }
        } catch (error) {
          console.error(`❌ Error restoring backup: ${error.message}`);
          console.error(`📜 psql stderr: ${error.stderr ? error.stderr.slice(0, 500) + (error.stderr.length > 500 ? "..." : "") : "No stderr"}`);
          // Fallback: Try synchronous execution
          console.log(`🔄 Attempting synchronous execution to capture more output...`);
          try {
            const output = execSync(restoreCommand, { env: { ...process.env, PGPASSWORD: dbConfig.password }, encoding: "utf8" });
            console.log(`📜 Synchronous psql output: ${output.slice(0, 500)}${output.length > 500 ? "..." : ""}`);
          } catch (syncError) {
            console.error(`❌ Synchronous execution failed: ${syncError.message}`);
            console.error(`📜 Synchronous psql stderr: ${syncError.stderr ? syncError.stderr.slice(0, 500) + (syncError.stderr.length > 500 ? "..." : "") : "No stderr"}`);
          }
          throw error;
        }
        break;
      case "directory":
        const dirPath = path.join(backupDir, "backup_directory");
        restoreCommand = `"${pgRestorePath}" --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --verbose`;
        if (dropExisting) restoreCommand += " --clean";
        if (!restoreData) restoreCommand += " --schema-only";
        if (!restoreSchema) restoreCommand += " --data-only";
        restoreCommand += ` "${dirPath}"`;
        break;

      default:
        throw new Error("Invalid backup type");
    }

    // Set PGPASSWORD environment variable
    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    // Execute restore command
    console.log(`⚡ Executing restore command: ${restoreCommand}`);
    const startTime = Date.now();
    await execAsync(restoreCommand, { env });
    const duration = Date.now() - startTime;

    // Cleanup temp file if created
    if (typeof tempFilePath !== "undefined" && tempFilePath) {
      try {
        await fsPromises.unlink(tempFilePath);
        console.log(`🗑️ Cleaned up temp file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to cleanup temp file: ${cleanupError.message}`);
      }
    }

    // VERIFY STOCKENTRIES TABLE RESTORATION - ADD THIS SECTION
    console.log("🔍 Verifying stockEntries table restoration...");
    try {
      // Check if stockEntries table exists
      const tableExists = await sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'stockEntries'
        )`,
        { type: sequelize.QueryTypes.SELECT }
      );

      console.log(`✅ stockEntries table exists: ${tableExists[0].exists}`);

      // If table exists, check record count
      if (tableExists[0].exists) {
        const stockEntriesCount = await sequelize.query('SELECT COUNT(*) as count FROM "stockEntries"', { type: sequelize.QueryTypes.SELECT });
        console.log(`📊 stockEntries record count: ${stockEntriesCount[0].count}`);
      }
    } catch (verificationError) {
      console.warn("⚠️ Could not verify stockEntries table:", verificationError.message);
    }

    // Get restore statistics and check for potential data integrity issues
    const dbStats = await getDatabaseStats();
    console.log(`📈 Database stats after restore:`, {
      tables: dbStats.tables,
      records: dbStats.records,
      database: dbStats.name
    });

    // Check for potential foreign key constraint issues
    let warnings = [];
    if (!dropExisting) {
      // Check if menuItemIngredients table has data (common foreign key issue)
      try {
        const menuItemIngredientsCount = await sequelize.query('SELECT COUNT(*) as count FROM "menuItemIngredients"', { type: sequelize.QueryTypes.SELECT });
        const menuItemsCount = await sequelize.query('SELECT COUNT(*) as count FROM "menuItems"', { type: sequelize.QueryTypes.SELECT });

        if (menuItemsCount[0].count > 0 && menuItemIngredientsCount[0].count === 0) {
          warnings.push({
            type: "foreign_key_violation",
            message: "Menu items exist but no ingredients were restored. This indicates foreign key constraint violations.",
            recommendation: "Use dropExisting: true for complete data integrity"
          });
        }
      } catch (checkError) {
        console.warn("Could not check for foreign key issues:", checkError.message);
      }
    }

    const response = {
      success: true,
      data: {
        message: dropExisting ? "Database restored successfully with complete data integrity" : "Database restored with potential data integrity issues",
        restoredTables: dbStats.tables,
        restoredRecords: dbStats.records,
        stockEntriesCount: dbStats.stockEntriesCount, // Add this line
        duration: Math.round(duration / 1000), // Convert to seconds
        warnings: warnings.length > 0 ? warnings : undefined,
        recommendation: !dropExisting && warnings.length > 0 ? "For complete data integrity, use dropExisting: true when restoring" : undefined
      }
    };

    if (warnings.length > 0) {
      console.warn("⚠️  Restore completed with warnings:", warnings);
    }

    console.log("✅ Restore process completed successfully");
    res.json(response);
  } catch (error) {
    // Cleanup temp file if created
    if (typeof tempFilePath !== "undefined" && tempFilePath) {
      try {
        await fsPromises.unlink(tempFilePath);
        console.log(`🗑️ Cleaned up temp file after error: ${tempFilePath}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to cleanup temp file after error: ${cleanupError.message}`);
      }
    }

    console.error("❌ Error restoring backup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore backup",
      error: error.message
    });
  }
});

// Upload backup file
router.post("/upload", upload.single("backup"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No backup file provided"
      });
    }

    const { name } = req.body;
    const uploadedFile = req.file;

    // Determine backup type from file extension
    let type = "custom";
    if (uploadedFile.originalname.endsWith(".sql")) {
      type = "sql";
    } else if (uploadedFile.originalname.endsWith(".tar")) {
      type = "directory";
    }

    // Create backup directory
    const backupName = name || `uploaded_${Date.now()}`;
    const backupDir = path.join(BACKUP_DIR, backupName);
    await fsPromises.mkdir(backupDir, { recursive: true });

    // Move uploaded file to backup directory
    const targetFileName = type === "sql" ? "backup.sql" : "backup.custom";
    const targetPath = path.join(backupDir, targetFileName);
    await fsPromises.rename(uploadedFile.path, targetPath);

    // Get metadata
    const metadata = await getBackupMetadata(targetPath, type);

    const backupInfo = {
      id: `${backupName}_${type}`,
      name: backupName,
      type,
      path: targetPath,
      size: metadata.size,
      createdAt: metadata.createdAt,
      metadata: metadata.metadata
    };

    res.json({
      success: true,
      data: {
        backup: backupInfo,
        message: "Backup uploaded successfully"
      }
    });
  } catch (error) {
    console.error("Error uploading backup:", error);

    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      await fsPromises.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload backup",
      error: error.message
    });
  }
});

export default router;






