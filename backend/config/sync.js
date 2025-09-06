import sequelize from "./database.js";
import "../models/index.js";

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Disable foreign key checks temporarily
    await sequelize.query('SET session_replication_role = "replica";');
    console.log("🔧 Temporarily disabled foreign key checks");

    try {
      // Sync Department model first
      console.log("🔄 Syncing Department model...");
      await sequelize.models.Department.sync({ alter: true, force: false });
      
      // Then sync other models
      const modelNames = Object.keys(sequelize.models).filter(m => m !== 'Department');
      console.log(`📋 Syncing remaining models: ${modelNames.join(", ")}`);
      
      for (const modelName of modelNames) {
        console.log(`🔄 Syncing ${modelName}...`);
        await sequelize.models[modelName].sync({ alter: true, force: false });
      }

      console.log("✅ All models synchronized successfully.");

      if (sequelize.models.SystemLogs) {
        console.log("✅ SystemLogs model synchronized.");
      } else {
        console.log("⚠️  SystemLogs model not found in registered models.");
      }
    } finally {
      // Re-enable foreign key checks
      await sequelize.query('SET session_replication_role = DEFAULT;');
      console.log("🔧 Re-enabled foreign key checks");
    }

  } catch (error) {
    console.error("❌ Database sync failed:", error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();


////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

// // import sequelize from "./database.js";
// // import "../models/index.js";

// // async function syncDatabase() {
// //   try {
// //     await sequelize.authenticate();
// //     console.log("✅ Database connected successfully.");

// //     // List all models that will be synchronized
// //     const modelNames = Object.keys(sequelize.models);
// //     console.log(`📋 Models to synchronize: ${modelNames.join(", ")}`);

// //     // First, check if we need to clean up invalid references BEFORE sync
// //     console.log("🔍 Checking for invalid foreign key references...");
// //     try {
// //       // Check if both tables exist
// //       const tablesExist = await sequelize.query(`
// //         SELECT
// //           EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'SystemLogs') as system_logs_exists,
// //           EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stockEntries') as stock_entries_exists
// //       `);

// //       const systemLogsExists = tablesExist[0][0].system_logs_exists;
// //       const stockEntriesExists = tablesExist[0][0].stock_entries_exists;

// //       if (systemLogsExists && stockEntriesExists) {
// //         // Clean up invalid references BEFORE sync to prevent constraint errors
// //         const cleanupResult = await sequelize.query(`
// //           DELETE FROM "SystemLogs"
// //           WHERE "stockEntryId" IS NOT NULL
// //           AND "stockEntryId" NOT IN (SELECT id FROM "stockEntries")
// //           RETURNING COUNT(*) as cleaned_count
// //         `);

// //         const cleanedCount = cleanupResult[0][0].cleaned_count;
// //         if (cleanedCount > 0) {
// //           console.log(`✅ Cleaned up ${cleanedCount} invalid foreign key references in SystemLogs`);
// //         } else {
// //           console.log("✅ No invalid foreign key references found");
// //         }
// //       }
// //     } catch (cleanupError) {
// //       console.warn("⚠️ Could not check/clean invalid references:", cleanupError.message);
// //     }

// //     // Disable foreign key checks temporarily for the sync process
// //     console.log("🔧 Disabling foreign key checks temporarily...");
// //     await sequelize.query("SET session_replication_role = replica;");

// //     // Sync all models (create tables if not exists or alter them)
// //     console.log("🔄 Synchronizing models...");

// //     // Use a more controlled sync approach - sync models individually
// //     // to better handle foreign key constraints
// //     for (const modelName of modelNames) {
// //       try {
// //         console.log(`🔄 Syncing model: ${modelName}`);
// //         await sequelize.models[modelName].sync({ alter: true });
// //         console.log(`✅ ${modelName} synchronized successfully`);
// //       } catch (modelError) {
// //         console.warn(`⚠️ Error syncing ${modelName}:`, modelError.message);
// //         // Continue with other models even if one fails
// //       }
// //     }

// //     // Re-enable foreign key checks
// //     console.log("🔧 Re-enabling foreign key checks...");
// //     await sequelize.query("SET session_replication_role = DEFAULT;");

// //     console.log("✅ All models synchronized successfully.");

// //     // Verify SystemLogs model
// //     if (sequelize.models.SystemLogs) {
// //       console.log("✅ SystemLogs model synchronized.");

// //       // Additional verification: check if foreign key constraint exists
// //       try {
// //         const fkCheck = await sequelize.query(`
// //           SELECT COUNT(*) as constraint_exists
// //           FROM information_schema.table_constraints
// //           WHERE table_name = 'SystemLogs'
// //           AND constraint_name = 'SystemLogs_stockEntryId_fkey'
// //           AND constraint_type = 'FOREIGN KEY'
// //         `);

// //         if (fkCheck[0][0].constraint_exists > 0) {
// //           console.log("✅ SystemLogs_stockEntryId_fkey foreign key constraint exists");
// //         } else {
// //           console.log("⚠️ SystemLogs_stockEntryId_fkey foreign key constraint not found");
// //         }
// //       } catch (fkError) {
// //         console.warn("⚠️ Could not verify foreign key constraint:", fkError.message);
// //       }
// //     } else {
// //       console.log("⚠️ SystemLogs model not found in registered models.");
// //     }
// //   } catch (error) {
// //     console.error("❌ Database sync failed:", error);

// //     // Try to re-enable foreign key checks even if sync fails
// //     try {
// //       console.log("🔄 Attempting to re-enable foreign key checks after error...");
// //       await sequelize.query("SET session_replication_role = DEFAULT;");
// //       console.log("✅ Foreign key checks re-enabled after error");
// //     } catch (enableError) {
// //       console.warn("⚠️ Could not re-enable foreign key checks:", enableError.message);
// //     }
// //   } finally {
// //     await sequelize.close();
// //   }
// // }

// // // Alternative approach: Drop and recreate the problematic constraint
// // async function fixSystemLogsConstraint() {
// //   try {
// //     await sequelize.authenticate();
// //     console.log("✅ Database connected for constraint fix.");

// //     // Check if the constraint exists
// //     const constraintExists = await sequelize.query(`
// //       SELECT COUNT(*) as exists
// //       FROM information_schema.table_constraints
// //       WHERE table_name = 'SystemLogs'
// //       AND constraint_name = 'SystemLogs_stockEntryId_fkey'
// //     `);

// //     if (constraintExists[0][0].exists > 0) {
// //       console.log("🔧 Dropping problematic constraint...");
// //       await sequelize.query('ALTER TABLE "SystemLogs" DROP CONSTRAINT IF EXISTS "SystemLogs_stockEntryId_fkey"');
// //       console.log("✅ Constraint dropped");
// //     }

// //     // Clean up invalid references
// //     console.log("🧹 Cleaning up invalid references...");
// //     await sequelize.query(`
// //       DELETE FROM "SystemLogs"
// //       WHERE "stockEntryId" IS NOT NULL
// //       AND "stockEntryId" NOT IN (SELECT id FROM "stockEntries")
// //     `);

// //     // Recreate the constraint
// //     console.log("🔧 Recreating constraint...");
// //     await sequelize.query(`
// //       ALTER TABLE "SystemLogs"
// //       ADD CONSTRAINT "SystemLogs_stockEntryId_fkey"
// //       FOREIGN KEY ("stockEntryId")
// //       REFERENCES "stockEntries" ("id")
// //       ON DELETE SET NULL
// //       ON UPDATE CASCADE
// //     `);

// //     console.log("✅ Constraint recreated successfully");
// //   } catch (error) {
// //     console.error("❌ Constraint fix failed:", error);
// //   } finally {
// //     await sequelize.close();
// //   }
// // }

// // // Run the appropriate function based on command line arguments
// // const args = process.argv.slice(2);
// // if (args.includes("--fix-constraint")) {
// //   fixSystemLogsConstraint().catch(console.error);
// // } else {
// //   syncDatabase().catch(error => {
// //     console.error("❌ Unhandled error in sync process:", error);
// //     process.exit(1);
// //   });
// // }



////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


// import sequelize from "./database.js";
// import "../models/index.js";

// async function syncDatabase() {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ Database connected successfully.");

//     // List all models that will be synchronized
//     const modelNames = Object.keys(sequelize.models);
//     console.log(`📋 Models to synchronize: ${modelNames.join(", ")}`);

//     // FIX THE FOREIGN KEY VIOLATION FIRST
//     console.log("🔍 Fixing foreign key violation...");
//     try {
//       // Check if the problematic record exists
//       const problematicRecords = await sequelize.query(`
//         SELECT COUNT(*) as count
//         FROM "SystemLogs"
//         WHERE "stockEntryId" = 111
//         AND NOT EXISTS (SELECT 1 FROM "stockEntries" WHERE id = 111)
//       `);

//       if (problematicRecords[0][0].count > 0) {
//         console.log("🔄 Found problematic records with stockEntryId=111, fixing...");

//         // Option 1: Delete the problematic records
//         await sequelize.query(`
//           DELETE FROM "SystemLogs"
//           WHERE "stockEntryId" = 111
//           AND NOT EXISTS (SELECT 1 FROM "stockEntries" WHERE id = 111)
//         `);
//         console.log("✅ Deleted problematic records with invalid stockEntryId");

//         // Option 2: Alternatively, you could set them to NULL instead of deleting
//         // await sequelize.query(`
//         //   UPDATE "SystemLogs"
//         //   SET "stockEntryId" = NULL
//         //   WHERE "stockEntryId" = 111
//         //   AND NOT EXISTS (SELECT 1 FROM "stockEntries" WHERE id = 111)
//         // `);
//         // console.log("✅ Set invalid stockEntryId references to NULL");
//       } else {
//         console.log("✅ No foreign key violations found");
//       }
//     } catch (fixError) {
//       console.warn("⚠️ Could not fix foreign key violation:", fixError.message);
//     }

//     // Sync all models (create tables if not exists or alter them)
//     console.log("🔄 Synchronizing models...");
//     await sequelize.sync({ alter: true });
//     console.log("✅ All models synchronized successfully.");

//     if (sequelize.models.SystemLogs) {
//       console.log("✅ SystemLogs model synchronized.");
//     } else {
//       console.log("⚠️ SystemLogs model not found in registered models.");
//     }

//   } catch (error) {
//     console.error("❌ Database sync failed:", error);
//   } finally {
//     await sequelize.close();
//   }
// }

// syncDatabase().catch(error => {
//   console.error("❌ Unhandled error in sync process:", error);
//   process.exit(1);
// });import sequelize from "./database.js";


////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

// import "../models/index.js";
// import sequelize from "./database.js";

// async function syncDatabase() {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ Database connected successfully.");

//     // List all models that will be synchronized
//     const modelNames = Object.keys(sequelize.models);
//     console.log(`📋 Models to synchronize: ${modelNames.join(", ")}`);

//     // FIX ALL FOREIGN KEY VIOLATIONS FIRST
//     console.log("🔍 Fixing ALL foreign key violations...");
//     try {
//       // Check if both tables exist
//       const tablesExist = await sequelize.query(`
//         SELECT 
//           EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'SystemLogs') as system_logs_exists,
//           EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stockEntries') as stock_entries_exists
//       `);

//       const systemLogsExists = tablesExist[0][0].system_logs_exists;
//       const stockEntriesExists = tablesExist[0][0].stock_entries_exists;

//       if (systemLogsExists && stockEntriesExists) {
//         // Find ALL problematic records (not just stockEntryId=111)
//         const problematicRecords = await sequelize.query(`
//           SELECT COUNT(*) as count 
//           FROM "SystemLogs" 
//           WHERE "stockEntryId" IS NOT NULL 
//           AND "stockEntryId" NOT IN (SELECT id FROM "stockEntries")
//         `);

//         if (problematicRecords[0][0].count > 0) {
//           console.log(`🔄 Found ${problematicRecords[0][0].count} problematic records, fixing...`);

//           // Delete ALL problematic records with invalid foreign keys
//           await sequelize.query(`
//             DELETE FROM "SystemLogs" 
//             WHERE "stockEntryId" IS NOT NULL 
//             AND "stockEntryId" NOT IN (SELECT id FROM "stockEntries")
//           `);
//           console.log(`✅ Deleted ${problematicRecords[0][0].count} problematic records with invalid stockEntryId`);
//         } else {
//           console.log("✅ No foreign key violations found");
//         }
//       }
//     } catch (fixError) {
//       console.warn("⚠️ Could not fix foreign key violations:", fixError.message);
//     }

//     // Sync all models (create tables if not exists or alter them)
//     console.log("🔄 Synchronizing models...");
//     await sequelize.sync({ alter: true });
//     console.log("✅ All models synchronized successfully.");

//     if (sequelize.models.SystemLogs) {
//       console.log("✅ SystemLogs model synchronized.");
//     } else {
//       console.log("⚠️ SystemLogs model not found in registered models.");
//     }
//   } catch (error) {
//     console.error("❌ Database sync failed:", error);
//   } finally {
//     await sequelize.close();
//   }
// }

// syncDatabase().catch(error => {
//   console.error("❌ Unhandled error in sync process:", error);
//   process.exit(1);
// });
