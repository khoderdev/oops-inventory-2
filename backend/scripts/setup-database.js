import sequelize from "../config/database.js";

// Import all models to ensure they're registered
import "../models/User.js";
import "../models/Session.js";
import "../models/materials.js";
import "../models/menuItems.js";
import "../models/StockEntry.js";
import "../models/Order.js";
import "../models/Employee.js";
import "../models/Table.js";
import "../models/Printer.js";
import "../models/PrinterChannel.js";

async function setupDatabase() {
  try {
    console.log("🔄 Setting up complete database schema...");
    
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    
    // Sync all models (create tables if they don't exist)
    console.log("🔄 Synchronizing all models...");
    await sequelize.sync({ alter: true });
    console.log("✅ All models synchronized");
    
    // List all tables
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    
    console.log("\n📋 Available tables:");
    tables.forEach(table => {
      console.log(`  ✅ ${table}`);
    });
    
    console.log(`\n📊 Total tables: ${tables.length}`);
    
    // Check for critical tables
    const criticalTables = ['users', 'sessions', 'materials', 'menuItems', 'orders'];
    const missingTables = criticalTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing critical tables: ${missingTables.join(', ')}`);
    } else {
      console.log("\n✅ All critical tables are present");
    }
    
    console.log("\n🎉 Database setup completed successfully!");
    
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupDatabase();
