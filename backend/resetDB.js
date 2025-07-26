import sequelize from "./config/database.js";

async function resetDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    console.log("🔄 Recreating tables to fix schema mismatch...");

    // Force sync - this will drop and recreate all tables
    await sequelize.sync({ force: true });
    console.log("✅ Database tables recreated with correct schema.");

    console.log("🎉 Database reset complete!");
    console.log("📋 OrderItem now has proper autoIncrement ID field.");
  } catch (error) {
    console.error("❌ Database reset failed:", error);
  } finally {
    await sequelize.close();
  }
}

resetDatabase();
