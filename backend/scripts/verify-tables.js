import sequelize from "../config/database.js";
import Table from "../models/Table.js";

async function verifyTables() {
  try {
    console.log("🔍 Verifying table initialization...");
    
    // Check if tables exist
    const tableCount = await Table.count();
    console.log(`📊 Total tables in database: ${tableCount}`);
    
    if (tableCount === 0) {
      console.log("⚠️ No tables found. Running initialization...");
      const result = await Table.createInitialTables();
      console.log(`✅ Initialization complete: ${result.created} created, ${result.existing} existing`);
    } else {
      console.log("✅ Tables already exist. Showing current tables:");
      
      const allTables = await Table.findAll({
        order: [['number', 'ASC']],
        attributes: ['id', 'number', 'seats', 'shape', 'section', 'status', 'position']
      });
      
      console.log("\n📋 Current tables:");
      allTables.forEach(table => {
        const pos = table.position ? `(${table.position.x}, ${table.position.y})` : 'N/A';
        console.log(`   Table ${table.number}: ${table.seats} seats, ${table.shape}, ${table.section} section, ${table.status}, position ${pos}`);
      });
    }
    
    console.log("\n🎉 Table verification completed!");
    
  } catch (error) {
    console.error("❌ Table verification failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verifyTables();
