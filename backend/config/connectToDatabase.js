import { seedTables } from "../utils/seedTables.js";
import { seedPrinters } from "../seeds/seedPrinters.js";
import sequelize, { resetAllSequences, checkAndFixSequences } from "../config/database.js";
import { Op } from "sequelize";
import User from "../models/User.js";

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

const connectToDatabase = async (retries = 2, delay = 5000) => {
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

      // 3. Synchronization order - tables without foreign keys first
      console.log("🔄 Synchronizing database schema...");
      try {
        const syncOrder = [
          "User", // Base table with no dependencies
          "CategoryType", // Base table
          "Category", // Depends on CategoryType
          "Employee", // Base table, needed before Department
          "Department", // Depends on Employee
          "Supplier", // Base table
          "Material", // Depends on Category, Supplier
          "Section", // Base table
          "MenuItem", // Depends on Category
          "Sauce", // Base table
          "Variants", // Depends on MenuItem
          "Table", // Base table
          "PrinterChannel", // Base table
          "Printer", // Depends on PrinterChannel
          "StockEntry", // Depends on Material
          "MenuItemIngredient", // Depends on MenuItem, Material
          "MenuItemSauce", // Depends on MenuItem, Sauce
          "SauceIngredient", // Depends on Sauce, Material
          "VariantIngredient", // Depends on Variants, Material
          "Assignment", // Depends on Employee, Section
          "Sale", // Depends on User, Table
          "SaleMenuItem", // Depends on Sale, MenuItem
          "Order", // Depends on User, Table
          "OrderItem", // Depends on Order, MenuItem
          "Wasting", // Depends on Material
          "EmployeeUsage", // Depends on Employee, Material
          "EmployeeSettlement", // Depends on Employee
          "Session", // Depends on User
          "AuditLog", // Depends on User
          "SystemLogs", // Base table
          "DayOperation", // Depends on User
          "DayOperationReport", // Depends on DayOperation
          "BackupSchedule", // Base table
          "ScheduleExecution", // Depends on BackupSchedule
          "PrintJob" // Depends on Printer
        ];

        // First, sync all models without foreign key constraints
        console.log("📋 Syncing models without foreign key constraints...");
        for (const modelName of syncOrder) {
          if (sequelize.models[modelName]) {
            console.log(`📋 Syncing ${modelName} without constraints...`);
            await sequelize.models[modelName].sync({
              force: false,
              alter: { drop: false },
              hooks: false
            });
          }
        }

        // Now add foreign key constraints
        console.log("🔗 Adding foreign key constraints...");
        await sequelize.query("SET CONSTRAINTS ALL DEFERRED");
        // Enable foreign key constraints for each model
        for (const modelName of syncOrder) {
          if (sequelize.models[modelName]) {
            try {
              // This will add any missing foreign key constraints
              await sequelize.models[modelName].sync({
                force: false,
                alter: true,
                hooks: false
              });
              console.log(`✅ Constraints added for ${modelName}`);
            } catch (error) {
              console.warn(`⚠️ Could not add constraints for ${modelName}:`, error.message);
            }
          }
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
        console.log("🏷️ Initializing category types...");
        const categoryTypesInitialized = await initializeCategoryTypes();

        if (categoryTypesInitialized) {
          console.log("✅ Category types initialized successfully");
        } else {
          console.log("⚠️ Category types initialization skipped or failed (non-critical)");
        }
      } catch (error) {
        console.warn("⚠️ Category type initialization failed:", error.message);
        console.log("💡 This is non-critical, continuing with other initializations...");
      }

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
