import { sequelize } from "../models/index.js";
import migrateJsonToRelational from "./dayOperationRelationalMigration.js";

/**
 * Migration script to create the new tables and migrate data
 */
const runMigration = async () => {
  console.log("Starting Day Operations database migration...");
  
  try {
    // Create the new tables
    console.log("Creating new tables...");
    
    // Sync the models with the database
    await sequelize.sync({ alter: true });
    console.log("Tables created successfully");
    
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
