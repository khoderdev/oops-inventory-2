import sequelize from "../config/database.js";

async function fixSystemLogsConstraints() {
  try {
    console.log("🔧 Starting SystemLogs constraints fix...");

    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Drop NOT NULL constraints on foreign key columns
    console.log("🔧 Dropping NOT NULL constraints on foreign key columns...");

    // Drop NOT NULL constraint on userId
    try {
      await sequelize.query(`
        ALTER TABLE "SystemLogs" 
        ALTER COLUMN "userId" DROP NOT NULL;
      `);
      console.log("✅ Dropped NOT NULL constraint on userId");
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log("ℹ️  userId column already allows NULL");
      } else {
        console.log("⚠️  Error dropping NOT NULL constraint on userId:", error.message);
      }
    }

    // Drop NOT NULL constraint on stockEntryId
    try {
      await sequelize.query(`
        ALTER TABLE "SystemLogs" 
        ALTER COLUMN "stockEntryId" DROP NOT NULL;
      `);
      console.log("✅ Dropped NOT NULL constraint on stockEntryId");
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log("ℹ️  stockEntryId column already allows NULL");
      } else {
        console.log("⚠️  Error dropping NOT NULL constraint on stockEntryId:", error.message);
      }
    }

    // Drop NOT NULL constraint on materialId
    try {
      await sequelize.query(`
        ALTER TABLE "SystemLogs" 
        ALTER COLUMN "materialId" DROP NOT NULL;
      `);
      console.log("✅ Dropped NOT NULL constraint on materialId");
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log("ℹ️  materialId column already allows NULL");
      } else {
        console.log("⚠️  Error dropping NOT NULL constraint on materialId:", error.message);
      }
    }

    console.log("✅ SystemLogs constraints fix completed successfully");
    console.log("ℹ️  Foreign key columns now allow NULL values");

  } catch (error) {
    console.error("❌ Error during SystemLogs constraints fix:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the fix if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixSystemLogsConstraints()
    .then(() => {
      console.log("🎉 SystemLogs constraints fix script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 SystemLogs constraints fix script failed:", error);
      process.exit(1);
    });
}

export { fixSystemLogsConstraints };
