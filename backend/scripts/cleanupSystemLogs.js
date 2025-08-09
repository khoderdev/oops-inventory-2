import sequelize from "../config/database.js";
import SystemLogs from "../models/StockEntryLogSimple.js";
import User from "../models/User.js";
import StockEntry from "../models/StockEntry.js";
import Material from "../models/materials.js";

async function cleanupSystemLogs() {
  try {
    console.log("🧹 Starting SystemLogs cleanup...");

    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Count total SystemLogs entries before cleanup
    const totalBefore = await SystemLogs.count();
    console.log(`📊 Total SystemLogs entries before cleanup: ${totalBefore}`);

    if (totalBefore === 0) {
      console.log("ℹ️  No SystemLogs entries found - nothing to clean up");
      return;
    }

    // Clear all foreign key references to prevent constraint violations
    console.log("🔧 Clearing all foreign key references to prevent constraint violations...");
    
    const [updatedRows] = await SystemLogs.update(
      { 
        userId: null,
        stockEntryId: null,
        materialId: null
      },
      { 
        where: {},  // Update all rows
        returning: false
      }
    );

    console.log(`✅ Updated ${updatedRows} SystemLogs entries - cleared all foreign key references`);

    // Count total SystemLogs entries after cleanup
    const totalAfter = await SystemLogs.count();
    console.log(`📊 Total SystemLogs entries after cleanup: ${totalAfter}`);

    console.log("✅ SystemLogs cleanup completed successfully - all foreign key references cleared");
    console.log("ℹ️  Foreign key relationships will be properly established when the server starts");

  } catch (error) {
    console.error("❌ Error during SystemLogs cleanup:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupSystemLogs()
    .then(() => {
      console.log("🎉 SystemLogs cleanup script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 SystemLogs cleanup script failed:", error);
      process.exit(1);
    });
}

export { cleanupSystemLogs };
