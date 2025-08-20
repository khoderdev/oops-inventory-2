import { exec } from "child_process";
import express from "express";
import fs from "fs/promises";
import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import BackupSchedule from "../models/BackupSchedule.js";
import ScheduleExecution from "../models/ScheduleExecution.js";
import sequelize from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const execAsync = promisify(exec);

// In-memory storage for schedules and executions
// In production, this should be stored in a database
let schedules = [];
let executions = [];
let schedulerStatus = {
  isRunning: false,
  nextScheduledRun: null,
  activeSchedules: 0,
  totalSchedules: 0,
  lastError: null
};

// Active cron jobs
const activeCronJobs = new Map();

// Helper function to calculate next run time
function calculateNextRun(schedule) {
  const now = new Date();
  const nextRun = new Date();

  switch (schedule.frequency) {
    case "minutely":
      const intervalMinutes = schedule.intervalMinutes || 1;
      nextRun.setTime(now.getTime() + intervalMinutes * 60 * 1000);
      break;

    case "daily":
      const [hoursDaily, minutesDaily] = schedule.time.split(":").map(Number);
      nextRun.setHours(hoursDaily, minutesDaily, 0, 0);

      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      const [hoursWeekly, minutesWeekly] = schedule.time.split(":").map(Number);
      nextRun.setHours(hoursWeekly, minutesWeekly, 0, 0);

      const targetDay = schedule.dayOfWeek || 0;
      const currentDay = nextRun.getDay();
      let daysUntilTarget = targetDay - currentDay;

      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7;
      }

      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;

    case "monthly":
      const [hoursMonthly, minutesMonthly] = schedule.time.split(":").map(Number);
      nextRun.setHours(hoursMonthly, minutesMonthly, 0, 0);

      const targetDate = schedule.dayOfMonth || 1;
      nextRun.setDate(targetDate);

      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(targetDate);
      }
      break;
  }

  return nextRun;
}

// Helper function to create cron expression
function createCronExpression(schedule) {
  switch (schedule.frequency) {
    case "minutely":
      const intervalMinutes = schedule.intervalMinutes || 1;
      return `*/${intervalMinutes} * * * *`; // Every N minutes (minute hour day month weekday)
    case "daily":
      const [hoursDaily, minutesDaily] = schedule.time.split(":").map(Number);
      return `${minutesDaily} ${hoursDaily} * * *`;
    case "weekly":
      const [hoursWeekly, minutesWeekly] = schedule.time.split(":").map(Number);
      return `${minutesWeekly} ${hoursWeekly} * * ${schedule.dayOfWeek || 0}`;
    case "monthly":
      const [hoursMonthly, minutesMonthly] = schedule.time.split(":").map(Number);
      return `${minutesMonthly} ${hoursMonthly} ${schedule.dayOfMonth || 1} * *`;
    default:
      throw new Error(`Invalid frequency: ${schedule.frequency}`);
  }
}

// Helper function to execute backup
async function executeBackup(schedule) {
  let execution;

  try {
    // Create execution record in database
    execution = await ScheduleExecution.create({
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      startTime: new Date(),
      status: "running"
    });

    console.log(`📅 Schedule execution started in database:`, {
      id: execution.id,
      scheduleId: execution.scheduleId,
      scheduleName: execution.scheduleName,
      startTime: execution.startTime
    });

    // Also add to in-memory array for compatibility
    const executionObj = {
      id: execution.id,
      scheduleId: execution.scheduleId,
      scheduleName: execution.scheduleName,
      startTime: execution.startTime.toISOString(),
      status: "running"
    };
    executions.unshift(executionObj);

    // Keep only last 100 executions in memory
    if (executions.length > 100) {
      executions = executions.slice(0, 100);
    }
  } catch (dbError) {
    console.error("Failed to create execution record in database:", dbError);
    // Continue with backup execution even if database logging fails
  }

  try {
    console.log(`Starting scheduled backup: ${schedule.name}`);

    // Create backup using the same logic as manual backups
    const backupName = `scheduled_${schedule.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const backupDir = path.join(__dirname, "../backups", backupName);

    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Get database configuration from the main database.js file
    const dbConfig = {
      host: process.env.DB_HOST || sequelize.config.host,
      port: process.env.DB_PORT || sequelize.config.port,
      database: process.env.DB_NAME || sequelize.config.database,
      username: process.env.DB_USER || sequelize.config.username,
      password: process.env.DB_PASSWORD || sequelize.config.password
    };
    
    console.log(`Using database configuration: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} (user: ${dbConfig.username})`);

    // Detect PostgreSQL binary path with better error handling
    let pgDumpPath = process.env.PG_DUMP_PATH;
    
    if (!pgDumpPath) {
      // Common PostgreSQL installation paths
      const possiblePaths = [
        "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\12\\bin\\pg_dump.exe"
      ];
      
      // Try to find pg_dump in common paths
      for (const path of possiblePaths) {
        try {
          await fs.access(path);
          pgDumpPath = path;
          console.log(`Found PostgreSQL binary at: ${pgDumpPath}`);
          break;
        } catch (err) {
          // Path not found, continue to next path
        }
      }
      
      if (!pgDumpPath) {
        throw new Error("PostgreSQL pg_dump binary not found. Please set PG_DUMP_PATH environment variable.");
      }
    }

    // Build pg_dump command based on schedule settings
    let command = `"${pgDumpPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database}`;

    // Add password via environment variable
    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    // Configure backup options based on schedule
    if (!schedule.includeData) {
      command += " --schema-only";
    } else if (!schedule.includeSchema) {
      command += " --data-only";
    }

    // Execute backup based on type
    let backupFile;
    switch (schedule.backupType) {
      case "custom":
        backupFile = path.join(backupDir, "backup.custom");
        command += ` --format=custom --file="${backupFile}"`;
        break;
      case "directory":
        backupFile = backupDir;
        command += ` --format=directory --file="${backupFile}"`;
        break;
      case "sql":
        backupFile = path.join(backupDir, "backup.sql");
        command += ` --file="${backupFile}"`;
        break;
    }

    console.log(`Executing backup command: ${command}`);
    console.log(`Backup directory: ${backupDir}`);
    console.log(`Backup format: ${schedule.backupType}`);
    console.log(`Include schema: ${schedule.includeSchema ? 'Yes' : 'No'}`);
    console.log(`Include data: ${schedule.includeData ? 'Yes' : 'No'}`);
    const startTime = Date.now();
    
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutMs = 30 * 60 * 1000; // 30 minutes timeout
      setTimeout(() => reject(new Error(`Backup operation timed out after ${timeoutMs/60000} minutes`)), timeoutMs);
    });
    
    // Race between the backup execution and the timeout
    console.log(`Starting backup execution with timeout of 30 minutes...`);
    const { stdout, stderr } = await Promise.race([
      execAsync(command, { env }),
      timeoutPromise
    ]);
    
    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    console.log(`Backup execution completed in ${durationSeconds} seconds`);
    
    if (stderr && stderr.trim()) {
      console.log(`Backup command stderr output: ${stderr}`);
    }
    
    if (stdout && stdout.trim()) {
      console.log(`Backup command stdout output: ${stdout}`);
    }

    // Get backup file size
    let backupSize = 0;
    try {
      if (schedule.backupType === "directory") {
        // Calculate directory size
        const files = await fs.readdir(backupDir, { recursive: true });
        for (const file of files) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            backupSize += stats.size;
          }
        }
      } else {
        const stats = await fs.stat(backupFile);
        backupSize = stats.size;
      }
    } catch (error) {
      console.warn("Could not calculate backup size:", error.message);
    }

    // Update execution record in database
    if (execution) {
      try {
        await execution.update({
          endTime: new Date(),
          status: "completed",
          backupId: backupName,
          duration: Math.floor((new Date() - execution.startTime) / 1000)
        });

        console.log(`✅ Schedule execution completed in database:`, {
          id: execution.id,
          status: "completed",
          backupId: backupName,
          duration: Math.floor((new Date() - execution.startTime) / 1000)
        });
      } catch (dbError) {
        console.error("Failed to update execution record in database:", dbError);
      }
    }

    // Update execution record in memory
    const completedExecution = executions.find(e => e.id === execution?.id);
    if (completedExecution) {
      completedExecution.endTime = new Date().toISOString();
      completedExecution.status = "completed";
      completedExecution.backupId = backupName;
      completedExecution.duration = Math.floor((new Date(completedExecution.endTime) - new Date(completedExecution.startTime)) / 1000);
    }

    // Update schedule last run time in database
    try {
      await BackupSchedule.update(
        {
          lastRun: new Date(),
          nextRun: calculateNextRun(schedule)
        },
        {
          where: { id: schedule.id }
        }
      );

      console.log(`✅ Schedule updated in database:`, {
        id: schedule.id,
        lastRun: new Date(),
        nextRun: calculateNextRun(schedule)
      });
    } catch (dbError) {
      console.error("Failed to update schedule in database:", dbError);
    }

    // Update schedule in memory
    const scheduleIndex = schedules.findIndex(s => s.id === schedule.id);
    if (scheduleIndex !== -1) {
      schedules[scheduleIndex].lastRun = new Date().toISOString();
      schedules[scheduleIndex].nextRun = calculateNextRun(schedules[scheduleIndex]).toISOString();
    }

    console.log(`Scheduled backup completed successfully: ${schedule.name}`);

    // Clean up old backups based on retention policy
    await cleanupOldBackups(schedule);
  } catch (error) {
    console.error(`Scheduled backup failed: ${schedule.name}`, error);

    // Update execution record with error in database
    if (execution) {
      try {
        await execution.update({
          endTime: new Date(),
          status: "failed",
          error: error.message,
          duration: Math.floor((new Date() - execution.startTime) / 1000)
        });

        console.log(`❌ Schedule execution failed in database:`, {
          id: execution.id,
          status: "failed",
          error: error.message,
          duration: Math.floor((new Date() - execution.startTime) / 1000)
        });
      } catch (dbError) {
        console.error("Failed to update execution record in database:", dbError);
      }
    }

    // Update execution record with error in memory
    const failedExecution = executions.find(e => e.id === execution?.id);
    if (failedExecution) {
      failedExecution.endTime = new Date().toISOString();
      failedExecution.status = "failed";
      failedExecution.error = error.message;
      failedExecution.duration = Math.floor((new Date(failedExecution.endTime) - new Date(failedExecution.startTime)) / 1000);
    }

    // Update schedule with error in database
    try {
      await BackupSchedule.update(
        {
          lastError: error.message,
          status: "error"
        },
        {
          where: { id: schedule.id }
        }
      );

      console.log(`❌ Schedule error updated in database:`, {
        id: schedule.id,
        lastError: error.message,
        status: "error"
      });
    } catch (dbError) {
      console.error("Failed to update schedule error in database:", dbError);
    }

    // Update scheduler status with error
    schedulerStatus.lastError = `${schedule.name}: ${error.message}`;
  }
}

// Helper function to clean up old backups
async function cleanupOldBackups(schedule) {
  try {
    const backupsDir = path.join(__dirname, "../backups");
    const files = await fs.readdir(backupsDir);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - schedule.retentionDays);

    for (const file of files) {
      if (file.startsWith(`scheduled_${schedule.name.replace(/[^a-zA-Z0-9]/g, "_")}`)) {
        const filePath = path.join(backupsDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          console.log(`Cleaning up old backup: ${file}`);
          if (stats.isDirectory()) {
            await fs.rmdir(filePath, { recursive: true });
          } else {
            await fs.unlink(filePath);
          }
        }
      }
    }
  } catch (error) {
    console.warn("Error during backup cleanup:", error.message);
  }
}

// Helper function to start all active schedules
function startScheduler() {
  if (schedulerStatus.isRunning) {
    console.log("⚠️ Scheduler is already running");
    return;
  }

  console.log("Starting backup scheduler...");
  schedulerStatus.isRunning = true;
  schedulerStatus.lastError = null;

  // Start cron jobs for all enabled schedules
  const activeSchedules = schedules.filter(s => s.enabled && s.status === "active");

  activeSchedules.forEach(schedule => {
    startScheduleCronJob(schedule);
  });

  updateSchedulerStatus();
  console.log(`Backup scheduler started with ${activeSchedules.length} active schedules`);
}

// Helper function to stop all schedules
function stopScheduler() {
  if (!schedulerStatus.isRunning) {
    return;
  }

  console.log("Stopping backup scheduler...");
  schedulerStatus.isRunning = false;

  // Stop all cron jobs
  activeCronJobs.forEach((job, scheduleId) => {
    job.stop();
    job.destroy();
  });
  activeCronJobs.clear();

  updateSchedulerStatus();
  console.log("Backup scheduler stopped");
}

// Helper function to start a cron job for a schedule
function startScheduleCronJob(schedule) {
  try {
    const cronExpression = createCronExpression(schedule);
    console.log(`Starting cron job for schedule: ${schedule.name} (${cronExpression})`);

    const job = cron.schedule(
      cronExpression,
      () => {
        executeBackup(schedule);
      },
      {
        scheduled: false,
        timezone: "Asia/Beirut" // Lebanon timezone
      }
    );

    job.start();
    activeCronJobs.set(schedule.id, job);
    console.log(`✅ Cron job started successfully for: ${schedule.name}`);
  } catch (error) {
    console.error(`Failed to start cron job for schedule: ${schedule.name}`, error);
    schedulerStatus.lastError = `Failed to start ${schedule.name}: ${error.message}`;
  }
}

// Helper function to stop a cron job for a schedule
function stopScheduleCronJob(scheduleId) {
  const job = activeCronJobs.get(scheduleId);
  if (job) {
    job.stop();
    job.destroy();
    activeCronJobs.delete(scheduleId);
  }
}

// Helper function to update scheduler status
function updateSchedulerStatus() {
  schedulerStatus.activeSchedules = schedules.filter(s => s.enabled && s.status === "active").length;
  schedulerStatus.totalSchedules = schedules.length;

  // Calculate next scheduled run
  const nextRuns = schedules
    .filter(s => s.enabled && s.status === "active")
    .map(s => calculateNextRun(s))
    .sort((a, b) => a - b);

  schedulerStatus.nextScheduledRun = nextRuns.length > 0 ? nextRuns[0].toISOString() : null;
}

// Routes

// Get all schedules
router.get("/schedules", async (req, res) => {
  try {
    // Load schedules from database
    const dbSchedules = await BackupSchedule.findAll({
      order: [["createdAt", "DESC"]]
    });

    console.log(`📅 Loaded ${dbSchedules.length} schedules from database`);

    // Update in-memory schedules array for compatibility
    schedules.length = 0; // Clear existing
    dbSchedules.forEach(schedule => {
      schedules.push({
        id: schedule.id,
        name: schedule.name,
        enabled: schedule.enabled,
        frequency: schedule.frequency,
        time: schedule.time,
        dayOfWeek: schedule.dayOfWeek,
        dayOfMonth: schedule.dayOfMonth,
        intervalMinutes: 1, // Default for compatibility
        backupType: schedule.backupType,
        includeData: schedule.includeData,
        includeSchema: schedule.includeSchema,
        retentionDays: schedule.retentionDays,
        status: schedule.status,
        lastRun: schedule.lastRun?.toISOString(),
        nextRun: schedule.nextRun?.toISOString(),
        lastError: schedule.lastError,
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString()
      });
    });

    res.json({
      success: true,
      data: dbSchedules
    });
  } catch (error) {
    console.error("Failed to fetch schedules from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedules",
      error: error.message
    });
  }
});

// Get single schedule
router.get("/schedules/:id", (req, res) => {
  try {
    const schedule = schedules.find(s => s.id === req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule",
      error: error.message
    });
  }
});

// Create new schedule
router.post("/schedules", async (req, res) => {
  try {
    const { name, frequency, time, dayOfWeek, dayOfMonth, intervalMinutes, backupType, includeData, includeSchema, retentionDays } = req.body;

    // Validation
    if (!name || !frequency || !time || !backupType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const scheduleData = {
      name,
      enabled: true,
      frequency,
      time,
      dayOfWeek,
      dayOfMonth,
      backupType,
      includeData: includeData !== false,
      includeSchema: includeSchema !== false,
      retentionDays: retentionDays || 30,
      status: "active"
    };

    // Calculate next run time
    const nextRun = calculateNextRun({ ...scheduleData, intervalMinutes: intervalMinutes || 1 });
    scheduleData.nextRun = nextRun;

    // Save to database
    const schedule = await BackupSchedule.create(scheduleData);

    console.log(`✅ Schedule created in database:`, {
      id: schedule.id,
      name: schedule.name,
      frequency: schedule.frequency,
      nextRun: schedule.nextRun
    });

    // Add to in-memory array for compatibility (TODO: remove when fully migrated)
    const scheduleObj = {
      id: schedule.id,
      name: schedule.name,
      enabled: schedule.enabled,
      frequency: schedule.frequency,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      intervalMinutes: intervalMinutes || 1,
      backupType: schedule.backupType,
      includeData: schedule.includeData,
      includeSchema: schedule.includeSchema,
      retentionDays: schedule.retentionDays,
      status: schedule.status,
      nextRun: schedule.nextRun.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString()
    };
    schedules.push(scheduleObj);

    // Start cron job if scheduler is running
    if (schedulerStatus.isRunning && schedule.enabled) {
      startScheduleCronJob(scheduleObj);
    }

    updateSchedulerStatus();

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create schedule",
      error: error.message
    });
  }
});

// Update schedule
router.put("/schedules/:id", (req, res) => {
  try {
    const scheduleIndex = schedules.findIndex(s => s.id === req.params.id);
    if (scheduleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    const existingSchedule = schedules[scheduleIndex];
    const updates = req.body;

    // Stop existing cron job
    stopScheduleCronJob(existingSchedule.id);

    // Update schedule
    const updatedSchedule = {
      ...existingSchedule,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Recalculate next run time if timing changed
    if (updates.frequency || updates.time || updates.dayOfWeek || updates.dayOfMonth || updates.intervalMinutes) {
      updatedSchedule.nextRun = calculateNextRun(updatedSchedule).toISOString();
    }

    schedules[scheduleIndex] = updatedSchedule;

    // Start new cron job if scheduler is running and schedule is enabled
    if (schedulerStatus.isRunning && updatedSchedule.enabled && updatedSchedule.status === "active") {
      startScheduleCronJob(updatedSchedule);
    }

    updateSchedulerStatus();

    res.json({
      success: true,
      data: updatedSchedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update schedule",
      error: error.message
    });
  }
});

// Toggle schedule enabled/disabled
router.post("/schedules/:id/toggle", (req, res) => {
  try {
    const { enabled } = req.body;
    const scheduleIndex = schedules.findIndex(s => s.id === req.params.id);

    if (scheduleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    const schedule = schedules[scheduleIndex];

    // Stop existing cron job
    stopScheduleCronJob(schedule.id);

    // Update enabled status
    schedules[scheduleIndex].enabled = enabled;
    schedules[scheduleIndex].updatedAt = new Date().toISOString();

    // Start cron job if scheduler is running and schedule is enabled
    if (schedulerStatus.isRunning && enabled && schedule.status === "active") {
      startScheduleCronJob(schedules[scheduleIndex]);
    }

    updateSchedulerStatus();

    res.json({
      success: true,
      data: schedules[scheduleIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to toggle schedule",
      error: error.message
    });
  }
});

// Delete schedule
router.delete("/schedules/:id", (req, res) => {
  try {
    const scheduleIndex = schedules.findIndex(s => s.id === req.params.id);
    if (scheduleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    const schedule = schedules[scheduleIndex];

    // Stop cron job
    stopScheduleCronJob(schedule.id);

    // Remove schedule
    schedules.splice(scheduleIndex, 1);

    updateSchedulerStatus();

    res.json({
      success: true,
      message: "Schedule deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete schedule",
      error: error.message
    });
  }
});

// Get scheduler status
router.get("/status", (req, res) => {
  try {
    updateSchedulerStatus();
    res.json({
      success: true,
      data: schedulerStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch scheduler status",
      error: error.message
    });
  }
});

// Start scheduler
router.post("/start", (req, res) => {
  try {
    startScheduler();
    res.json({
      success: true,
      message: "Scheduler started successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to start scheduler",
      error: error.message
    });
  }
});

// Stop scheduler
router.post("/stop", (req, res) => {
  try {
    stopScheduler();
    res.json({
      success: true,
      message: "Scheduler stopped successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to stop scheduler",
      error: error.message
    });
  }
});

// Run schedule now
router.post("/schedules/:id/run", (req, res) => {
  try {
    const schedule = schedules.find(s => s.id === req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    // Execute backup immediately
    const executionId = uuidv4();
    const execution = {
      id: executionId,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      startTime: new Date().toISOString(),
      status: "running"
    };

    executions.unshift(execution);

    // Execute backup asynchronously
    executeBackup(schedule);

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to run schedule",
      error: error.message
    });
  }
});

// Get execution history
router.get("/executions", async (req, res) => {
  try {
    const { scheduleId, limit = 50 } = req.query;

    // Build query options
    const queryOptions = {
      order: [["startTime", "DESC"]],
      limit: parseInt(limit),
      include: [
        {
          model: BackupSchedule,
          as: "schedule",
          attributes: ["name"]
        }
      ]
    };

    // Add schedule filter if provided
    if (scheduleId) {
      queryOptions.where = { scheduleId };
    }

    // Load executions from database
    const dbExecutions = await ScheduleExecution.findAll(queryOptions);

    console.log(`📅 Loaded ${dbExecutions.length} schedule executions from database`);

    // Update in-memory executions array for compatibility
    executions.length = 0; // Clear existing
    dbExecutions.forEach(execution => {
      executions.push({
        id: execution.id,
        scheduleId: execution.scheduleId,
        scheduleName: execution.scheduleName,
        startTime: execution.startTime.toISOString(),
        endTime: execution.endTime?.toISOString(),
        status: execution.status,
        backupId: execution.backupId,
        error: execution.error,
        duration: execution.duration,
        backupSize: execution.backupSize
      });
    });

    res.json({
      success: true,
      data: dbExecutions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch execution history",
      error: error.message
    });
  }
});

// Get single execution
router.get("/executions/:id", (req, res) => {
  try {
    const execution = executions.find(e => e.id === req.params.id);
    if (!execution) {
      return res.status(404).json({
        success: false,
        message: "Execution not found"
      });
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch execution",
      error: error.message
    });
  }
});

// Auto-start scheduler when module loads
setTimeout(() => {
  console.log("Auto-starting backup scheduler...");
  startScheduler();
}, 2000); // Wait 2 seconds for server to fully start

export default router;
