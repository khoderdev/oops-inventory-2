import { seedTables } from "../utils/seedTables.js";
import { seedPrinters } from "../seeds/seedPrinters.js";
import sequelize, { resetAllSequences, checkAndFixSequences } from "../config/database.js";
import { Op } from "sequelize";
import User from "../models/User.js";

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

// Cache for checking if tables exist to avoid repeated queries
const tableExistenceCache = new Map();

// Function to check if a table exists (with caching)
async function tableExists(tableName) {
  if (tableExistenceCache.has(tableName)) {
    return tableExistenceCache.get(tableName);
  }

  try {
    const result = await sequelize.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `,
      { type: sequelize.QueryTypes.SELECT }
    );

    const exists = result[0].exists;
    tableExistenceCache.set(tableName, exists);
    return exists;
  } catch (error) {
    console.warn(`⚠️ Could not check existence of table ${tableName}:`, error.message);
    return false;
  }
}

// Parallel user initialization
async function initializeUsers() {
  try {
    console.log("👤 Checking users...");

    const [adminUser, cashierUser] = await Promise.allSettled([User.findOne({ where: { role: "admin" } }), User.findOne({ where: { role: "staff" } })]);

    const results = { admin: { created: 0, existing: 0 }, cashier: { created: 0, existing: 0 } };

    // Process admin user
    if (adminUser.status === "fulfilled" && !adminUser.value) {
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
      results.admin.created = 1;
    } else if (adminUser.status === "fulfilled") {
      console.log("✅ Admin user already exists.");
      results.admin.existing = 1;
    } else {
      console.error("❌ Error checking admin user:", adminUser.reason.message);
    }

    // Process cashier user
    if (cashierUser.status === "fulfilled" && !cashierUser.value) {
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
      results.cashier.created = 1;
    } else if (cashierUser.status === "fulfilled") {
      console.log("✅ Cashier user already exists.");
      results.cashier.existing = 1;
    } else {
      console.error("❌ Error checking cashier user:", cashierUser.reason.message);
    }

    return results;
  } catch (error) {
    console.error("❌ Error initializing users:", error.message);
    throw error;
  }
}

// Add this function somewhere in your code
const initializeCategoryTypes = async () => {
  try {
    console.log("🏷️ Checking for default category types...");

    // First ensure the CategoryType table exists
    await sequelize.models.CategoryType.sync({ force: false });

    const defaultTypes = ["materials", "menu_items", "beverages"];
    const existingTypes = await sequelize.models.CategoryType.findAll({
      where: {
        type: { [Op.in]: defaultTypes }
      }
    });

    const existingTypeNames = existingTypes.map(type => type.type);
    const typesToCreate = defaultTypes.filter(type => !existingTypeNames.includes(type));

    if (typesToCreate.length > 0) {
      console.log(`📋 Creating ${typesToCreate.length} missing category types`);
      await sequelize.models.CategoryType.bulkCreate(typesToCreate.map(type => ({ type })));
    }

    return true;
  } catch (error) {
    console.warn("⚠️ Category type initialization failed:", error.message);
    return false;
  }
};

// Enhanced database connection with manual sync option
const connectToDatabase = async (options = { sync: false, seedData: false }, retries = 2, delay = 5000) => {
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

      // 2. Clean up orphaned data before syncing (only if table exists)
      console.log("🧹 Cleaning up orphaned data before sync...");
      try {
        if (await tableExists("menuItemSauces")) {
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

      // 3. Manual synchronization - only if explicitly requested
      if (options.sync) {
        console.log("🔄 Synchronizing database schema...");
        try {
          // Group models by dependency level for parallel processing
          const syncGroups = [
            // Level 0: No dependencies
            ["User", "CategoryType", "Supplier", "Section", "PrinterChannel", "SystemLogs", "BackupSchedule"],
            // Level 1: Depend on Level 0
            ["Category", "Employee", "Material", "MenuItem", "Sauce", "Table", "Printer", "ScheduleExecution"],
            // Level 2: Depend on Level 1
            ["Department", "Variants", "StockEntry", "MenuItemIngredient", "MenuItemSauce", "SauceIngredient", "VariantIngredient", "PrintJob"],
            // Level 3: Depend on Level 2
            ["Assignment", "Sale", "Order", "Wasting", "EmployeeUsage", "EmployeeSettlement", "Session", "AuditLog", "DayOperation"],
            // Level 4: Depend on Level 3
            ["SaleMenuItem", "OrderItem", "DayOperationReport"]
          ];

          // Sync models in parallel within each group
          for (const [index, group] of syncGroups.entries()) {
            console.log(`📋 Syncing dependency level ${index} models...`);

            const syncPromises = group
              .filter(modelName => sequelize.models[modelName])
              .map(modelName =>
                sequelize.models[modelName]
                  .sync({
                    force: false,
                    alter: { drop: false },
                    hooks: false
                  })
                  .then(() => {
                    console.log(`✅ ${modelName} synced`);
                  })
                  .catch(error => {
                    console.warn(`⚠️ Could not sync ${modelName}:`, error.message);
                  })
              );

            await Promise.all(syncPromises);
          }

          console.log("✅ Database schema synchronized successfully");
        } catch (error) {
          throw new DatabaseError("Failed to synchronize database schema", DatabaseErrorType.SYNC, error);
        }
      } else {
        console.log("ℹ️ Database schema synchronization skipped (manual sync mode)");
        console.log("ℹ️ To sync database schema, call connectToDatabase({ sync: true })");
      }

      // 4. Reset sequence (non-blocking) - only if sync is enabled
      if (options.sync) {
        try {
          // Run sequence check in background without blocking
          setTimeout(async () => {
            try {
              await checkAndFixSequences();
              await resetAllSequences();
            } catch (seqError) {
              console.warn("⚠️ Sequence reset failed:", seqError.message);
            }
          }, 1000); // Delay to allow other operations to proceed
        } catch (seqError) {
          console.warn("⚠️ Sequence reset scheduling failed:", seqError.message);
        }
      } else {
        console.log("ℹ️ Sequence reset skipped (manual sync mode)");
      }

      // 5. Initialize data in parallel where possible - only if seedData is enabled
      if (options.seedData) {
        console.log("🔧 Initializing essential data...");

        // Run non-critical initializations in parallel
        const initializationTasks = [
          (async () => {
            try {
              console.log("🏷️ Initializing category types...");
              const categoryTypesInitialized = await initializeCategoryTypes();
              if (categoryTypesInitialized) {
                console.log("✅ Category types initialized successfully");
              } else {
                console.log("⚠️ Category types initialization skipped or failed (non-critical)");
              }
            } catch (error) {
              console.warn("⚠️ Category type initialization failed:", error.message);
            }
          })(),

          (async () => {
            try {
              console.log("👤 Initializing users...");
              const userResults = await initializeUsers();
              console.log(`✅ Users initialized: Admin - ${userResults.admin.created} created, ${userResults.admin.existing} existing; Cashier - ${userResults.cashier.created} created, ${userResults.cashier.existing} existing`);
            } catch (error) {
              console.error("❌ User initialization failed:", error.message);
            }
          })(),

          (async () => {
            try {
              await seedTables();
              console.log("✅ Tables seeded successfully");
            } catch (error) {
              console.error("❌ Table seeding failed:", error.message);
            }
          })(),

          (async () => {
            try {
              await seedPrinters();
              console.log("✅ Printers seeded successfully");
            } catch (error) {
              console.error("❌ Printer seeding failed:", error.message);
            }
          })()
        ];

        // Wait for all initialization tasks to complete
        await Promise.allSettled(initializationTasks);

        console.log("✅ Essential initialization completed");
      } else {
        console.log("ℹ️ Data initialization skipped (manual mode)");
      }

      console.log("ℹ️ For manual database operations, use:");
      console.log("ℹ️ - Sync schema: connectToDatabase({ sync: true })");
      console.log("ℹ️ - Seed data: connectToDatabase({ seedData: true })");
      console.log("ℹ️ - Both: connectToDatabase({ sync: true, seedData: true })");
      console.log("ℹ️ - For comprehensive data seeding, run: npm run seed");

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
          // Log the specific SQL error if available
          if (error.originalError && error.originalError.sql) {
            console.error("📝 SQL that failed:", error.originalError.sql);
          }
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

export default connectToDatabase;
