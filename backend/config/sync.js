import sequelize from "./database.js";
// Import all models to ensure they are registered with Sequelize
import "../models/index.js";
// import StockEntryLog from "../models/StockEntryLog.js"; // Temporarily disabled

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // List all models that will be synchronized
    const modelNames = Object.keys(sequelize.models);
    console.log(`📋 Models to synchronize: ${modelNames.join(", ")}`);

    // Sync all models (create tables if not exists or alter them)
    await sequelize.sync({ alter: true }); // `alter` will update the table without dropping data
    console.log("✅ All models synchronized successfully.");
    
    // Verify StockEntryLog tables were created
    // Complex StockEntryLog model temporarily disabled
    /*
    if (sequelize.models.StockEntryLog) {
      console.log("✅ StockEntryLog model synchronized.");
    } else {
      console.log("⚠️  StockEntryLog model not found in registered models.");
    }
    */
    
    if (sequelize.models.SystemLogs) {
      console.log("✅ SystemLogs model synchronized.");
    } else {
      console.log("⚠️  SystemLogs model not found in registered models.");
    }
    
  } catch (error) {
    console.error("❌ Database sync failed:", error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
