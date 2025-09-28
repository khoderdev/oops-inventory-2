import { sequelize } from "../backend/models/index.js";
import migrateJsonToRelational from "../backend/migrations/dayOperationRelationalMigration.js";

/**
 * Script to migrate Day Operations data from JSON fields to relational tables
 */
const runMigration = async () => {
  console.log("Starting Day Operations migration to relational tables...");
  
  try {
    // Sync the models with the database to create the new tables
    console.log("Creating new tables if they don't exist...");
    await sequelize.sync({ alter: true });
    
    // Migrate data from JSON fields to relational tables
    console.log("Migrating data from JSON fields to relational tables...");
    await migrateJsonToRelational();
    
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration
runMigration();
