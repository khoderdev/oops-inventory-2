import sequelize from "./config/database.js";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");
    
    // List existing tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("📋 Existing tables:", results.map(r => r.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
}

testConnection();
