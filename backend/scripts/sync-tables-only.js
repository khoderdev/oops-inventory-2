import sequelize from "../config/database.js";
import Table from "../models/Table.js";

async function syncTablesOnly() {
  try {
    console.log("🔄 Syncing Tables model only...");
    
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    
    // Sync only the Table model
    await Table.sync({ alter: true });
    console.log("✅ Tables model synchronized successfully");
    
    // Run table initialization
    console.log("🌱 Running table initialization...");
    const result = await Table.createInitialTables();
    console.log(`✅ Table initialization complete: ${result.created} created, ${result.existing} existing`);
    
    // Verify final state
    const tableCount = await Table.count();
    console.log(`📊 Final table count: ${tableCount}`);
    
    if (tableCount >= 13) {
      console.log("🎉 All tables successfully created and verified!");
    } else {
      console.log("⚠️ Some tables may be missing. Expected 13 tables.");
    }
    
  } catch (error) {
    console.error("❌ Tables sync failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

syncTablesOnly();
