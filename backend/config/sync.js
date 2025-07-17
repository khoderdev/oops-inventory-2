import sequelize from "./database.js";

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Sync all models (create tables if not exists or alter them)
    await sequelize.sync({ alter: true }); // `alter` will update the table without dropping data
    console.log("✅ All models synchronized.");
  } catch (error) {
    console.error("❌ Database sync failed:", error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
