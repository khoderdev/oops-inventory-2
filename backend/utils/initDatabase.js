import sequelize from "../config/database.js";
import "../models/index.js"; // Import all models and relationships

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");
    
    // Test database connection first
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    
    // Drop all tables and recreate them
    console.log("🗑️ Dropping existing tables...");
    await sequelize.drop();
    
    // Create all tables with relationships
    console.log("🏗️ Creating tables...");
    await sequelize.sync({ force: true });
    
    console.log("✅ Database initialized successfully!");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}
