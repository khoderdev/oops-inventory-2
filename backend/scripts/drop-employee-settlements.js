import sequelize from "../config/database.js";

async function dropEmployeeSettlementsTable() {
  try {
    console.log("🗑️ Dropping employee_settlements table...");
    
    // Drop the table if it exists
    await sequelize.query('DROP TABLE IF EXISTS "employee_settlements" CASCADE;');
    
    console.log("✅ employee_settlements table dropped successfully.");
    
    // Also drop the enum types to clean up
    await sequelize.query('DROP TYPE IF EXISTS "enum_employee_settlements_status" CASCADE;');
    await sequelize.query('DROP TYPE IF EXISTS "enum_employee_settlements_payment_method" CASCADE;');
    
    console.log("✅ ENUM types cleaned up.");
    
  } catch (error) {
    console.error("❌ Error dropping table:", error.message);
  } finally {
    await sequelize.close();
  }
}

dropEmployeeSettlementsTable();
