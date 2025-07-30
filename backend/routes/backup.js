import archiver from "archiver";
import { exec } from "child_process";
import express from "express";
import fs from "fs/promises";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import sequelize from "../config/database.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit
  }
});

// PostgreSQL configuration
const PG_BIN_PATH = "C:\\Program Files\\PostgreSQL\\17\\bin";
const BACKUP_DIR = path.join(__dirname, "..", "backups");

// Ensure backup directory exists
await fs.mkdir(BACKUP_DIR, { recursive: true }).catch(() => {});

// Helper function to execute shell commands
const execAsync = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
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
    const stats = await fs.stat(backupPath);
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
const runBackupScript = async () => {
  try {
    const scriptPath = path.join(__dirname, "..", "scripts", "pgDumpFixed.js");
    const result = await execAsync(`node "${scriptPath}"`, {
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
      const backupDirs = await fs.readdir(BACKUP_DIR);
      const pgdumpDirs = backupDirs
        .filter(dir => dir.startsWith("pgdump_"))
        .sort()
        .reverse();

      if (pgdumpDirs.length > 0) {
        const lastBackupDir = path.join(BACKUP_DIR, pgdumpDirs[0]);
        const stats = await fs.stat(lastBackupDir);
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

// Create a new backup
router.post("/create", async (req, res) => {
  try {
    const { name, type = "custom", includeData = true, includeSchema = true } = req.body;

    // Generate backup name if not provided
    const backupName = name || `backup_${new Date().toISOString().replace(/[:.]/g, "-")}`;

    // Run the backup script
    const result = await runBackupScript();

    // Find the created backup directory
    const backupDirs = await fs.readdir(BACKUP_DIR);
    const latestBackup = backupDirs
      .filter(dir => dir.startsWith("pgdump_"))
      .sort()
      .reverse()[0];

    if (!latestBackup) {
      throw new Error("Backup was created but directory not found");
    }

    const backupDir = path.join(BACKUP_DIR, latestBackup);
    const backupFiles = await fs.readdir(backupDir);

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

    const backupInfo = {
      id: latestBackup,
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
    const backupDirs = await fs.readdir(BACKUP_DIR);
    // Include both manual backups (pgdump_) and scheduled backups (scheduled_)
    const allBackupDirs = backupDirs.filter(dir => 
      dir.startsWith("pgdump_") || dir.startsWith("scheduled_")
    );

    const backups = [];

    for (const dirName of allBackupDirs) {
      const backupDir = path.join(BACKUP_DIR, dirName);
      const backupFiles = await fs.readdir(backupDir);

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
    if (backupId.endsWith('_custom') || backupId.endsWith('_sql') || backupId.endsWith('_directory')) {
      // Format-specific ID - remove the format suffix
      dirName = backupId.split("_").slice(0, -1).join("_");
    } else {
      // Directory ID - use as is
      dirName = backupId;
    }
    const backupDir = path.join(BACKUP_DIR, dirName);

    // Check if backup directory exists
    try {
      await fs.access(backupDir);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Backup not found"
      });
    }

    // Remove the entire backup directory
    await fs.rm(backupDir, { recursive: true, force: true });

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

// Download a backup
router.get("/download/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;

    // Parse backup ID to get directory and type
    const parts = backupId.split("_");
    const type = parts[parts.length - 1];
    const dirName = parts.slice(0, -1).join("_");

    const backupDir = path.join(BACKUP_DIR, dirName);

    let filePath;
    let fileName;

    switch (type) {
      case "custom":
        const customFiles = await fs.readdir(backupDir);
        const customFile = customFiles.find(f => f.endsWith(".custom"));
        if (!customFile) throw new Error("Custom backup file not found");
        filePath = path.join(backupDir, customFile);
        fileName = `${dirName}.custom`;
        break;

      case "sql":
        const sqlFiles = await fs.readdir(backupDir);
        const sqlFile = sqlFiles.find(f => f.endsWith(".sql"));
        if (!sqlFile) throw new Error("SQL backup file not found");
        filePath = path.join(backupDir, sqlFile);
        fileName = `${dirName}.sql`;
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
    await fs.access(filePath);

    // Set appropriate headers
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Stream the file
    const fileStream = await fs.readFile(filePath);
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

    const pgRestorePath = path.join(PG_BIN_PATH, "pg_restore.exe");
    const psqlPath = path.join(PG_BIN_PATH, "psql.exe");

    const dbConfig = {
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "postgres",
      database: targetDatabase || "test_restore"
    };

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
        const sqlFiles = await fs.readdir(backupDir);
        const sqlFile = sqlFiles.find(f => f.endsWith(".sql"));
        if (!sqlFile) throw new Error("SQL backup file not found");
        filePath = path.join(backupDir, sqlFile);

        restoreCommand = `"${psqlPath}" --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --file="${filePath}"`;
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
    const startTime = Date.now();
    await execAsync(restoreCommand, { env });
    const duration = Date.now() - startTime;

    // Get restore statistics (simplified)
    const dbStats = await getDatabaseStats();

    res.json({
      success: true,
      data: {
        message: "Database restored successfully",
        restoredTables: dbStats.tables,
        restoredRecords: dbStats.records,
        duration: Math.round(duration / 1000) // Convert to seconds
      }
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
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
    await fs.mkdir(backupDir, { recursive: true });

    // Move uploaded file to backup directory
    const targetFileName = type === "sql" ? "backup.sql" : "backup.custom";
    const targetPath = path.join(backupDir, targetFileName);
    await fs.rename(uploadedFile.path, targetPath);

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
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload backup",
      error: error.message
    });
  }
});

export default router;
