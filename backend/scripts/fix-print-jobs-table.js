import sequelize from "../config/database.js";

async function fixPrintJobsTable() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    console.log("🗑️ Dropping print_jobs table if it exists...");
    await sequelize.query('DROP TABLE IF EXISTS "print_jobs" CASCADE;');
    console.log("✅ print_jobs table dropped.");

    console.log("🗑️ Dropping print job related enum types if they exist...");
    await sequelize.query('DROP TYPE IF EXISTS "public"."enum_print_jobs_status" CASCADE;');
    await sequelize.query('DROP TYPE IF EXISTS "public"."enum_print_jobs_jobType" CASCADE;');
    console.log("✅ Enum types dropped.");

    console.log("🔄 Running database sync to recreate tables...");
    await sequelize.sync({ force: false, alter: true });
    console.log("✅ Database sync completed successfully.");

  } catch (error) {
    console.error("❌ Error fixing print_jobs table:", error);
  } finally {
    await sequelize.close();
  }
}

fixPrintJobsTable();
