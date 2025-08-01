import sequelize from "../config/database.js";
import Table from "../models/Table.js";

async function initializeTables() {
  try {
    console.log("🚀 Starting table initialization process...");
    
    // Ensure database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    
    // Sync the Table model (create table if it doesn't exist)
    await Table.sync({ alter: true });
    console.log("✅ Table model synchronized");
    
    // Create initial tables
    const result = await Table.createInitialTables();
    
    console.log("\n🎉 Table initialization completed successfully!");
    console.log(`📈 Summary: ${result.created} created, ${result.existing} existing, ${result.total} total`);
    
    // Verify tables were created
    const allTables = await Table.findAll({
      order: [['number', 'ASC']]
    });
    
    console.log("\n📋 Current tables in database:");
    allTables.forEach(table => {
      console.log(`   Table ${table.number}: ${table.seats} seats, ${table.shape}, ${table.section} section, ${table.status}`);
    });
    
  } catch (error) {
    console.error("❌ Table initialization failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

initializeTables();
