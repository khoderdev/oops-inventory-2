import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import { createServer } from "http";
import sequelize, { resetAllSequences, checkAndFixSequences } from "./config/database.js";
import "./models/index.js";
import User from "./models/User.js";
import assignmentsRoutes from "./routes/assignments.js";
import authRoutes from "./routes/auth.js";
import backupSchedulerRoutes from "./routes/backup-scheduler.js";
import backupRoutes from "./routes/backup.js";
import categoriesRoutes from "./routes/categories.js";
import dayOperationsRoutes from "./routes/dayOperations.js";
import dayOperationReportsRoutes from "./routes/dayOperationReports.js";
import employeeRoutes from "./routes/employees.js";
import logsRoutes from "./routes/logs.js";
import materialRoutes from "./routes/materials.js";
import menuItemsRoutes from "./routes/menuItems.js";
import ordersRoutes from "./routes/orders.js";
import posRoutes from "./routes/pos.js";
import printersRoutes from "./routes/printers.js";
import salesRoutes from "./routes/sales.js";
import sectionRoutes from "./routes/sections.js";
import sessionsRoutes from "./routes/sessions.js";
import stockEntriesRoutes from "./routes/stockEntries.js";
import saucesRoutes from "./routes/sauces.js";
import tablesRoutes from "./routes/tables.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import userRoutes from "./routes/users.js";
import variantsRoutes from "./routes/variants.js";
import variantIngredientsRoutes from "./routes/variantIngredients.js";
import PrinterService from "./services/PrinterService.js";
import realTimeSessionService from "./services/realTimeSessionService.js";
import { errorHandler } from "./utils/logger.js";
import { seedTables } from "./utils/seedTables.js";
import { seedPrinters } from "./seeds/seedPrinters.js";

process.on("uncaughtException", error => {
  console.error("🚨 Uncaught Exception:", error.message);
  console.log("🔄 Server continuing to run despite uncaught exception...");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
  console.log("🔄 Server continuing to run despite unhandled rejection...");
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  gracefulShutdown();
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  gracefulShutdown();
});

const app = express();
const PORT = process.env.PORT || 3000;
let server = null;
let httpServer = null;

app.use(
  cors({
    origin: ["http://localhost", "http://localhost:5173", "http://192.168.88.86", "http://127.0.0.1", "http://192.168.88.86:5173", "https://oops-pos.vercel.app", "https://oops-pos-git-dev-66-khoderdevs-projects.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        console.error("🚨 Invalid JSON received:", e.message);
        res.status(400).json({ error: "Invalid JSON format" });
        return;
      }
    }
  })
);

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));
app.set("trust proxy", true);

app.get("/", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
      uptime: process.uptime()
    });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    if (status >= 400) {
      console.error(`🚨 [${timestamp}] ${method} ${url} - ${status} (${duration}ms)`);
    } else {
      console.log(`✅ [${timestamp}] ${method} ${url} - ${status} (${duration}ms)`);
    }
  });
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/stock-entries", stockEntriesRoutes);
app.use("/api/sauces", saucesRoutes);
app.use("/api/menu-items", menuItemsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/day-operations", dayOperationsRoutes);
app.use("/api/day-operation-reports", dayOperationReportsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/backup-scheduler", backupSchedulerRoutes);
app.use("/api/printers", printersRoutes);
app.use("/api/variants", variantsRoutes);
app.use("/api/variant-ingredients", variantIngredientsRoutes);
app.use("/api/departments", departmentRoutes);
// Emergency fix for sequences
app.post('/api/admin/fix-sequences', async (req, res) => { // call it using this in terminal: curl -X POST http://localhost:3000/api/admin/fix-sequences
  try {
    await resetAllSequences();
    res.json({ success: true, message: "Database sequences reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reset sequences", error: error.message });
  }
});

app.use(errorHandler);

const gracefulShutdown = async () => {
  console.log("🔄 Starting graceful shutdown...");
  try {
    realTimeSessionService.shutdown();
    const printerService = app.get("printerService");
    if (printerService) {
      await printerService.stopService();
      console.log("✅ Printer service stopped");
    }
    if (server) {
      await new Promise(resolve => {
        server.close(() => {
          console.log("✅ HTTP server closed");
          resolve();
        });
      });
    }
    if (sequelize) {
      await sequelize.close();
      console.log("✅ Database connection closed");
    }
    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("🚨 Error during graceful shutdown:", error.message);
    process.exit(1);
  }
};

async function initializeAdminUser() {
  try {
    console.log("👤 Checking admin user...");
    const adminUser = await User.findOne({ where: { role: "admin" } });
    if (!adminUser) {
      console.log("👤 No admin user found. Creating default admin user...");
      await User.create({
        username: "admin",
        firstName: "Admin",
        lastName: "User",
        password: "Admin@123",
        pin: "111111",
        role: "admin",
        isActive: true,
        createdBy: null,
        updatedBy: null
      });
      console.log("✅ Admin user created successfully.");
      return { created: 1, existing: 0 };
    } else {
      console.log("✅ Admin user already exists.");
      return { created: 0, existing: 1 };
    }
  } catch (error) {
    console.error("❌ Error initializing admin user:", error.message);
    throw error;
  }
}
async function initializeCashier() {
  try {
    console.log("👤 Checking cashier user...");
    const cashierUser = await User.findOne({ where: { role: "staff" } });
    if (!cashierUser) {
      console.log("👤 No cashier user found. Creating default cashier user...");
      await User.create({
        username: "Cashier",
        firstName: "Cashier",
        lastName: "User",
        password: "Cashier@123",
        pin: "333333",
        role: "staff",
        isActive: true,
        createdBy: null,
        updatedBy: null
      });
      console.log("✅ Cashier user created successfully.");
      return { created: 1, existing: 0 };
    } else {
      console.log("✅ Cashier user already exists.");
      return { created: 0, existing: 1 };
    }
  } catch (error) {
    console.error("❌ Error initializing cashier user:", error.message);
    throw error;
  }
}

// Database error types for better error handling
const DatabaseErrorType = {
  CONNECTION: "CONNECTION",
  AUTHENTICATION: "AUTHENTICATION",
  SYNC: "SYNC",
  SEQUENCE: "SEQUENCE",
  INITIALIZATION: "INITIALIZATION",
  UNKNOWN: "UNKNOWN"
};

// Custom error class for database operations
class DatabaseError extends Error {
  constructor(message, type = DatabaseErrorType.UNKNOWN, originalError = null) {
    super(message);
    this.name = "DatabaseError";
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

const resetAuditLogSequence = async () => {
  try {
    await sequelize.query(`
      SELECT setval('"audit_logs_id_seq"', 
        COALESCE((SELECT MAX(id) FROM "audit_logs"), 0) + 1, 
        false
      );
    `);
    console.log("✅ Audit log sequence reset successfully");
  } catch (error) {
    console.error("❌ Error resetting audit log sequence:", error);
    throw new DatabaseError("Failed to reset audit log sequence", DatabaseErrorType.SEQUENCE, error);
  }
};

const connectToDatabase = async (retries = 3, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${retries}...`);

      // 1. Authenticate connection
      try {
        await sequelize.authenticate();
        console.log("✅ Database connection established successfully");
      } catch (error) {
        throw new DatabaseError("Failed to authenticate database connection", DatabaseErrorType.AUTHENTICATION, error);
      }

      // 2. Clean up orphaned data before syncing
      console.log("🧹 Cleaning up orphaned data before sync...");
      try {
        // Check if menuItemSauces table exists
        const tableExists = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'menuItemSauces'
          );
        `);

        if (tableExists[0][0].exists) {
          // Clean up orphaned menuItemSauces that reference non-existent sauces
          await sequelize.query(`
            DELETE FROM "menuItemSauces" 
            WHERE "sauceId" IS NOT NULL 
            AND "sauceId" NOT IN (SELECT id FROM "sauces")
          `);
          console.log("✅ Cleaned up orphaned menuItemSauces data");
        }
      } catch (cleanupError) {
        console.warn("⚠️ Could not clean up orphaned data:", cleanupError.message);
      }

      // 3. Synchronize schema with a more controlled approach
      console.log("🔄 Synchronizing database schema...");
      try {
        // Get all model names except the problematic ones
        const modelNames = Object.keys(sequelize.models).filter(modelName => !["MenuItemSauce"].includes(modelName));

        // Sync non-problematic models first
        for (const modelName of modelNames) {
          await sequelize.models[modelName].sync({
            force: false,
            alter: { drop: false },
            hooks: false
          });
        }

        // Now handle the problematic MenuItemSauce model separately
        try {
          // First check if the table exists and needs to be altered
          const tableExists = await sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'menuItemSauces'
            );
          `);

          if (tableExists[0][0].exists) {
            // Table exists, so we need to handle the foreign key constraint carefully
            console.log("🔧 Handling existing menuItemSauces table...");

            // First, drop the existing foreign key constraint if it exists
            try {
              await sequelize.query(`
                ALTER TABLE "menuItemSauces" 
                DROP CONSTRAINT IF EXISTS "menuItemSauces_sauceId_fkey";
              `);
            } catch (dropError) {
              console.warn("⚠️ Could not drop existing foreign key:", dropError.message);
            }

            // Now sync the model without constraints
            await sequelize.models.MenuItemSauce.sync({
              force: false,
              alter: { drop: false },
              hooks: false
            });

            // Add the foreign key constraint manually with proper error handling
            try {
              await sequelize.query(`
                ALTER TABLE "menuItemSauces" 
                ADD CONSTRAINT "menuItemSauces_sauceId_fkey"
                FOREIGN KEY ("sauceId") 
                REFERENCES "sauces" ("id") 
                ON DELETE CASCADE ON UPDATE CASCADE;
              `);
              console.log("✅ Added foreign key constraint to menuItemSauces");
            } catch (fkError) {
              console.warn("⚠️ Could not add foreign key constraint to menuItemSauces:", fkError.message);
              console.log("💡 This is non-critical and the application will continue");
            }
          } else {
            // Table doesn't exist, sync normally
            await sequelize.models.MenuItemSauce.sync({
              force: false,
              alter: { drop: false },
              hooks: false
            });
          }
        } catch (menuItemError) {
          console.warn("⚠️ Could not sync MenuItemSauce model:", menuItemError.message);
          console.log("💡 This is non-critical and the application will continue");
        }

        console.log("✅ Database schema synchronized successfully");
      } catch (error) {
        throw new DatabaseError("Failed to synchronize database schema", DatabaseErrorType.SYNC, error);
      }

      // 4. Reset sequence
      try {
        await checkAndFixSequences(); // Check first
        await resetAllSequences(); // Then reset all
      } catch (seqError) {
        console.warn("⚠️ Sequence reset failed, continuing without it:", seqError.message);
      }

      // 5. Initialize data
      console.log("🔧 Initializing essential data...");

      try {
        console.log("👤 Initializing admin user...");
        const adminResult = await initializeAdminUser();
        console.log(`✅ Admin user initialized: ${adminResult.created} created, ${adminResult.existing} existing`);
      } catch (error) {
        throw new DatabaseError("Failed to initialize admin user", DatabaseErrorType.INITIALIZATION, error);
      }

      try {
        console.log("👤 Initializing cashier user...");
        const cashierResult = await initializeCashier();
        console.log(`✅ Cashier user initialized: ${cashierResult.created} created, ${cashierResult.existing} existing`);
      } catch (error) {
        throw new DatabaseError("Failed to initialize cashier user", DatabaseErrorType.INITIALIZATION, error);
      }

      try {
        await seedTables();
        await seedPrinters();
        console.log("✅ Tables and printers seeded successfully");
      } catch (error) {
        throw new DatabaseError("Failed to seed tables and printers", DatabaseErrorType.INITIALIZATION, error);
      }

      console.log("✅ Essential initialization completed");
      console.log("ℹ️  For comprehensive data seeding, run: npm run seed");

      return { connected: true, error: null };
    } catch (error) {
      console.error(`🚨 Database attempt ${attempt} failed:`, error.message);

      // Log specific error details based on type
      switch (error.type) {
        case DatabaseErrorType.AUTHENTICATION:
          console.error("🔐 Authentication failed - check credentials");
          break;
        case DatabaseErrorType.SYNC:
          console.error("🗄️ Schema synchronization failed - check migrations");
          break;
        case DatabaseErrorType.INITIALIZATION:
          console.error("📊 Data initialization failed - check seed data");
          break;
        case DatabaseErrorType.SEQUENCE:
          console.error("🔢 Sequence reset failed - non-critical issue");
          break;
        default:
          console.error("❌ Unknown database error");
      }

      if (attempt === retries) {
        console.error("🚨 All database connection attempts failed");
        return {
          connected: false,
          error: {
            message: error.message,
            type: error.type,
            originalError: error.originalError
          }
        };
      }

      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { connected: false, error: { message: "All connection attempts exhausted", type: DatabaseErrorType.CONNECTION } };
};

const startServer = async () => {
  try {
    console.log("🚀 Starting Cost Craft Converter Server...");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("💻 Environment:", process.env.NODE_ENV || "development");

    const dbResult = await connectToDatabase();
    const dbConnected = dbResult.connected;

    if (!dbConnected) {
      console.log("⚠️ Server starting in limited mode (no database)");
      console.log("❌ Database error details:", dbResult.error);
    }

    httpServer = createServer(app);
    realTimeSessionService.initialize(httpServer);

    if (dbConnected) {
      try {
        const printerService = new PrinterService();
        app.set("printerService", printerService);
        console.log("🖨️  Printer service initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize printer service:", error.message);
      }
    } else {
      console.log("⚠️ Printer service disabled (no database connection)");
    }

    server = httpServer.listen(PORT, () => {
      console.log("✅ =================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
      console.log(`📊 Database: ${dbConnected ? "Connected" : "Disconnected"}`);
      if (!dbConnected) {
        console.log(`🔍 Error type: ${dbResult.error.type}`);
      }
      console.log(`🕰️ Started at: ${new Date().toLocaleString()}`);
      console.log("✅ =================================");
    });

    server.on("error", error => {
      if (error.code === "EADDRINUSE") {
        console.error(`🚨 Port ${PORT} is already in use`);
        console.log("🔄 Trying alternative port...");
        const altPort = PORT + 1;
        server = httpServer.listen(altPort, () => {
          console.log(`🚀 Server running on alternative port ${altPort}`);
          console.log(`🔌 WebSocket server: ws://localhost:${altPort}`);
        });
      } else {
        console.error("🚨 Server error:", error.message);
      }
    });

    // Database health check (only if we initially connected)
    if (dbConnected) {
      setInterval(async () => {
        try {
          await sequelize.authenticate();
        } catch (error) {
          console.warn("⚠️ Database health check failed:", error.message);
          // You could add logic here to try to reconnect
        }
      }, 30000);
    }
  } catch (error) {
    console.error("🚨 Failed to start server:", error.message);
    console.error("Stack:", error.stack);
    console.log("🔄 Server will attempt to continue...");
  }
};

startServer().catch(error => {
  console.error("🚨 Critical startup error:", error.message);
  console.log("🔄 Attempting emergency server start...");
  try {
    server = app.listen(PORT, () => {
      console.log(`🆘 Emergency server running on port ${PORT} (limited functionality)`);
    });
  } catch (emergencyError) {
    console.error("🚨 Emergency server start failed:", emergencyError.message);
    process.exit(1); // Exit if emergency start also fails
  }
});
